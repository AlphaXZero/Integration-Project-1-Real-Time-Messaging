#!/usr/bin/env bash
# Déploiement de Canopée sur le VPS.
#
# Lancé automatiquement par GitHub Actions (via SSH) à chaque push sur main,
# ou à la main depuis le VPS :   bash /home/debian/canopee/deploy/deploy.sh
#
# Étapes : sauvegarde de la base -> récupération du code -> dépendances Python
#          -> migrations + fichiers statiques -> build du front -> redémarrage -> vérification

# Arrêter le script à la première erreur (-e), sur variable inconnue (-u)
# ou si une commande échoue au milieu d'un pipe (-o pipefail).
set -Eeuo pipefail

# Tout le script est dans une fonction : bash la lit en entier avant de l'exécuter.
# C'est important car l'étape 2 (git) remplace ce fichier pendant qu'il tourne.
main() {
    # ---------- Réglages ----------
    local APP_DIR="/home/debian/canopee"
    local BRANCH="main"
    local WEB_ROOT="/var/www/canopee"
    local BACKUP_DIR="/home/debian/canopee-backups"
    local KEEP_BACKUPS=10
    local SERVICE="canopee"
    local DOMAIN="canopee.coisnevalentin.be"

    # Une connexion SSH automatique n'a pas le même PATH qu'un terminal :
    # on ajoute les dossiers où uv (et éventuellement Node via nvm) sont installés.
    export PATH="$HOME/.local/bin:$HOME/.cargo/bin:/usr/local/bin:/usr/bin:/bin:$PATH"
    if [ -s "$HOME/.nvm/nvm.sh" ]; then
        # shellcheck disable=SC1091
        . "$HOME/.nvm/nvm.sh"
    fi

    for tool in git uv node npm python3 curl; do
        command -v "$tool" >/dev/null || fail "Outil introuvable : $tool"
    done

    # Empêcher deux déploiements en même temps.
    exec 9>/tmp/canopee-deploy.lock
    flock -n 9 || fail "Un déploiement est déjà en cours."

    cd "$APP_DIR"

    # ---------- 1. Sauvegarde de la base ----------
    step "1/7 Sauvegarde de la base SQLite"
    mkdir -p "$BACKUP_DIR"
    if [ -f backend/db.sqlite3 ]; then
        local backup_file
        backup_file="$BACKUP_DIR/db_$(date +%Y-%m-%d_%H-%M-%S).sqlite3"
        # API "backup" de SQLite : copie cohérente même si l'appli écrit en même temps.
        python3 -c 'import sqlite3, sys; s = sqlite3.connect(sys.argv[1]); d = sqlite3.connect(sys.argv[2]); s.backup(d); d.close(); s.close()' \
            backend/db.sqlite3 "$backup_file"
        echo "Sauvegarde : $backup_file"
        # Ne garder que les $KEEP_BACKUPS sauvegardes les plus récentes.
        # shellcheck disable=SC2012  # noms de fichiers maîtrisés (db_DATE.sqlite3)
        ls -1t "$BACKUP_DIR"/db_*.sqlite3 | tail -n +"$((KEEP_BACKUPS + 1))" | xargs -r rm --
    else
        echo "Pas encore de base, rien à sauvegarder."
    fi

    # ---------- 2. Code ----------
    step "2/7 Récupération du code ($BRANCH)"
    git fetch --prune origin "$BRANCH"
    # Aligne le dossier sur GitHub. Les fichiers ignorés par Git
    # (.env, .venv, db.sqlite3) ne sont jamais touchés.
    git checkout -q -f -B "$BRANCH" "origin/$BRANCH"
    echo "Version déployée : $(git log -1 --format='%h %s')"

    # ---------- 3. Dépendances Python ----------
    step "3/7 Dépendances Python (uv)"
    cd "$APP_DIR/backend"
    uv sync --frozen

    # ---------- 4. Django ----------
    step "4/7 Migrations et fichiers statiques"
    load_env .env
    .venv/bin/python manage.py migrate --noinput
    .venv/bin/python manage.py collectstatic --noinput

    # ---------- 5. Front ----------
    step "5/7 Build du front React"
    cd "$APP_DIR/frontend"
    npm ci --no-audit --no-fund
    npm run build
    find "$WEB_ROOT" -mindepth 1 -delete
    cp -r dist/. "$WEB_ROOT/"

    # ---------- 6. Redémarrage ----------
    step "6/7 Redémarrage du backend"
    sudo systemctl restart "$SERVICE"

    # ---------- 7. Vérification ----------
    step "7/7 Vérification"
    local ok=0
    for _ in $(seq 1 15); do
        if curl -fsS -o /dev/null -H "Host: $DOMAIN" "http://127.0.0.1:8001/admin/login/"; then
            ok=1
            break
        fi
        sleep 1
    done
    if [ "$ok" -ne 1 ]; then
        echo "Le backend ne répond pas. Derniers logs :"
        sudo journalctl -u "$SERVICE" -n 30 --no-pager
        fail "Échec de la vérification du backend."
    fi
    curl -fsS -o /dev/null "https://$DOMAIN/" || fail "Le site public ne répond pas."

    step "Déploiement terminé : https://$DOMAIN"
}

step() { echo; echo "==> $*"; }

fail() { echo "ERREUR : $*" >&2; exit 1; }

# Charge le .env comme le fait systemd (EnvironmentFile) : chaque ligne CLE=valeur
# devient une variable d'environnement, sans que bash interprète les caractères
# spéciaux ($, (, &...) que contient souvent DJANGO_SECRET_KEY.
load_env() {
    local line key value
    while IFS= read -r line || [ -n "$line" ]; do
        line="${line%$'\r'}"
        [[ "$line" =~ ^[[:space:]]*(#|$) ]] && continue
        [[ "$line" == *=* ]] || continue
        key="${line%%=*}"
        value="${line#*=}"
        if [[ "$value" =~ ^\"(.*)\"$ || "$value" =~ ^\'(.*)\'$ ]]; then
            value="${BASH_REMATCH[1]}"
        fi
        export "$key=$value"
    done < "$1"
}

main "$@"; exit $?
