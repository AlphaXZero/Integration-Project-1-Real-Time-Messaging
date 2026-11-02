#let accent = rgb("#6e1423")
#let gris = luma(100)

#let oui = text(fill: accent)[☒]
#let nonc = text(fill: gris)[☐]

#set document(title: "Carnet métacognitif — usage de l'IA", author: "Coisne Valentin")
#set text(font: ("Latin Modern Roman", "New Computer Modern"), size: 10.2pt, lang: "fr")
#set par(justify: true, leading: 0.62em, spacing: 0.9em)
#set page(
  paper: "a4",
  margin: (x: 2.1cm, top: 1.8cm, bottom: 1.9cm),
  footer: context [
    #set text(size: 8.5pt, fill: gris)
    #grid(
      columns: (1fr, auto),
      [Carnet métacognitif — Coisne Valentin — Projet 1, Canopée], counter(page).display("1 / 1", both: true),
    )
  ],
)
#show list: set par(justify: false)
#set list(indent: 0.6em, spacing: 0.55em)
#show heading.where(level: 1): it => block(
  sticky: true,
  width: 100%,
  above: 1.5em,
  below: 0.8em,
  stroke: (bottom: 0.7pt + accent),
  inset: (bottom: 4pt),
)[
  #text(size: 13pt, fill: accent, weight: "regular")[#it.body]
]
#show heading.where(level: 2): it => block(sticky: true, above: 1.1em, below: 0.6em)[
  #text(size: 11pt, weight: "bold")[#it.body]
]
#show raw: set text(size: 9pt)
#show raw.where(block: false): box.with(fill: luma(242), inset: (x: 2pt), outset: (y: 2pt), radius: 2pt)

// ------------------------------------------------------------
#align(center)[
  #text(size: 17pt, fill: accent)[Carnet métacognitif — usage de l'IA] \
  #v(0.15em)
  #text(size: 10.5pt, fill: gris)[Projet 1 : Messagerie temps réel (B2B) — 5IDEV · 2026-2027]
]

#v(0.4em)
#block(width: 100%, fill: luma(246), inset: 10pt, radius: 3pt)[
  #grid(
    columns: (auto, 1fr),
    column-gutter: 1em,
    row-gutter: 0.55em,
    [*Nom & prénom*], [Coisne Valentin],
    [*Groupe / app*], [Coisne Valentin & van der Veen Georgé — *Canopée*, messagerie en temps réel (Django + React)],
    [*Mon rôle*], [Frontend (React, Tailwind CSS), VPS, déploiement et CI/CD],
  )
]

#text(
  size: 9.5pt,
  fill: gris,
)[Ce carnet est individuel : il décrit *mon* usage de l'IA. Georgé décrit le sien dans son propre carnet.]

J'ai demandé à Claude de rédiger une première version de ce carnet à partir de mes conversations et de l'historique Git du projet. Je l'ai ensuite relue et validée.

// ============================================================
= Partie 1 — Déclaration d'usage
// ============================================================

== 1. Mon setup IA en détail

#oui *Outils et abonnements.* Un seul outil : *Claude* , dans l'application, avec un abonnement Pro payant. Je l'ai utilisé surtout comme assistant de chat pour des explications ou questions, et aussi comme agent capable de cloner le dépôt, de lancer les tests et de vérifier l'application en local.

#oui *Modèles.* Claude Opus 5.5 Effort Moyen. Je n'ai pas fait de comparaison entre modèles.

#oui *Instructions personnalisées.* Pas de fichier d'instructions dans le dépôt pour ma partie. J'ai donné cette préférence globale à Claude :

#block(inset: (left: 1em), stroke: (left: 2pt + luma(200)))[
  #set text(size: 9.5pt, style: "italic")
  « Quand je demande de l'aide, je ne veux pas la solution directe, mais une explication claire et des indices pour que je puisse trouver la réponse moi-même. »
]

Je lui ai aussi demandé d'expliquer les notions avant le code, en français, et de guider dans la correction de mon code, ou de me guider dans la résolution des problèmes, plutôt que de donner directement la solution.

#oui *Skills et workflows.* Aucun skill ni workflow particulier. J'ai utilisé Claude comme un assistant de chat et comme un agent capable de cloner le dépôt, de lancer les tests et de vérifier l'application.

#oui *MCP / intégrations.* L'accès en lecture au dépôt GitHub du projet, la mémoire de Claude et la recherche dans mes anciennes conversations. Claude n'a jamais eu accès à mon VPS, et j'ai refusé de lui donner un accès en écriture au dépôt.

#oui *Autres éléments.* Je n'ai configuré ni hooks ni sous-agents.

== 2. Niveau d'usage global

*Niveau 3 — coproduction.* L'IA m'a aidé dans l'apprentissage de React, Tailwind CSS et Git, dans le débogage et le déploiement, et dans la rédaction du rapport. Elle m'a fourni des explications, de l'aide dans le code quand je bloquais sur une notion un peu plus complexe. Au niveau du design j'ai fournis a l'IA une palette de couleur a respecter, et elle m'a proposé des idées de mise en page et d'éléments visuels, par exemple pour l'alignement ou les dimensions de certains éléments. J'ai ensuite intégré et testé le code, et j'ai résolu certaines erreurs moi-même à partir des explications de Claude.

== 3. J'ai utilisé l'IA pour…

#show grid: set par(justify: false)
#grid(
  columns: (1fr, 1fr),
  column-gutter: 1.2em,
  row-gutter: 0.5em,
  [#oui comprendre les consignes ou une notion du cours], [#oui chercher des idées (fonctionnalités, architecture…)],
  [#oui élaborer un plan / structurer (rapport, priorités)], [#oui générer du code (composants, script de déploiement…)],
  [#oui déboguer / comprendre une erreur], [#oui écrire des tests (surtout des scripts de vérification lancés par Claude, pas des tests ajoutés au dépôt)],
  [#oui configurer le CI/CD ou le déploiement], [#oui rédiger ou reformuler du texte (rapport, carnet)],
  [#nonc générer des éléments visuels (UI, logo, images)], [#oui autre : installer et sécuriser le VPS (commandes proposées par Claude, exécutées par moi)],
)

// ============================================================
= Partie 2 — Démarche & vérification
// ============================================================

== 4. Démarche suivie

Au début du projet, fin septembre et début octobre, j'ai surtout utilisé Claude comme un professeur pour apprendre React, Tailwind CSS et le workflow Git : il expliquait une notion, on avançait une étape à la fois et il m'aidait quand je bloquais. Il m'a toutefois fourni des parties de code pour des composants simples, que j'ai ensuite intégrées et testées. J'ai aussi utilisé Claude pour relire mon code et m'expliquer les erreurs.

Ensuite, pour les parties que je maîtrisais moins, je lui ai demandé des bouts de code ou des corrections : renouvellement du token, reconnexion du WebSocket, suppression de compte, déploiement continu.

*Exemple réussi : les déconnexions après 5 minutes.* Je lui ai demandé pourquoi les utilisateurs étaient déconnectés. Claude a trouvé la cause : la durée par défaut du token d'accès de SimpleJWT, et un frontend qui n'utilisait pas le token de refresh. Avec ces indices j'ai pu corriger le code et tester la solution. 

*Exemple raté : positionnement du Toast.* J'ai demandé à Claude de m'aider au positionnement du Toast. Il m'a donné une partie de code, que j'ai pu tester et voir que le positionnement n'était pas correct. J'ai alors demandé à Claude de m'expliquer comment le positionner correctement, mais il m'a donné une explication incomplète et j'ai dû chercher par moi-même pour trouver la solution.

== 5. Ce que j'ai délégué à un agent

J'ai utilisé Claude comme agent sur des tâches précises :
- cloner le dépôt et comparer les branches `main` et `develop` pour expliquer les changements de mon binôme, afin de bien comprendre ce qui avait été modifié en Backend ;
- lancer les tests, le lint et le build, démarrer l'application et tester des parcours dans un navigateur automatisé avec plusieurs comptes de test ;
- préparer le code et les fichiers de déploiement, comme le workflow GitHub Actions et le script `deploy.sh` ;

*Garde-fous :*
- j'ai refusé l'accès en écriture au dépôt ;
- il n'a jamais eu accès au VPS : j'exécutais les commandes et je lui renvoyais les résultats ;
- par la suite, il a de nouveau cloné le dépôt et lancé des tests pour vérifier son code, mais sans modifier le dépôt.
- tout changement de code proposé par Claude a été relu et testé par moi avant d'être intégré.

== 6. Vérifications réalisées

- *Essais manuels* : j'ai testé les fonctionnalités avec plusieurs navigateurs et plusieurs comptes, en local puis en production, surtout pour le temps réel.
- *Relecture ligne par ligne* : j'ai relu les changements en les appliquant à la main, et j'ai demandé des explications sur ce que je ne comprenais pas.
- *CI et tests de Claude* : lint et build à chaque Pull Request, puis tests, lint, build et navigateur automatisé lancés par Claude.


Ces vérifications ont détecté des problèmes. Par exemple :
- après une fusion, il n'était plus possible de créer une conversation. Le lint et le build passaient pourtant : l'import de `getCurrentUsername` avait disparu de `ChatPage.jsx`, et le lint ne contrôlait pas les variables non définies. Seul l'essai de la fonctionnalité a révélé le problème ;


// ============================================================
= Partie 3 — Regard critique
// ============================================================

== 7. Ce que l'IA m'a apporté

- Un apprentissage plus rapide de React, Tailwind CSS et Git, grâce à des explications adaptées à mon niveau et à mon code.
- Un gros gain de temps sur le débogage et sur le déploiement, un domaine que je connaissais moins : Nginx, systemd, HTTPS, GitHub Actions et sécurisation du serveur.
- Des tests en conditions proches du réel, avec plusieurs comptes simulés, que je n'aurais pas pris le temps de faire seul.

== 8. Ses limites et erreurs

- *Elle propose facilement plus que nécessaire.* La configuration PostgreSQL et Redis en est le meilleur exemple. C'est à moi de juger ce dont le projet a réellement besoin.
- *Elle n'est pas toujours à jour.* La configuration Nginx proposée utilisait une syntaxe `http2` ancienne qu'il a fallu corriger.
- *Elle veut vouloir travailler plus vite que ce que je peux apprendre.* J'ai parfois eu l'impression que Claude voulait aller trop vite, en me donnant des bouts de code que je ne comprenais pas encore. J'ai alors demandé à Claude de m'expliquer les notions avant le code, et de me guider dans la correction de mon code plutôt que de me donner la solution.
- *La réussite des outils ne prouve rien.* Le lint et le build passaient alors que l'application était cassée. Une relecture finale a aussi montré que le rapport, rédigé avec l'aide de l'IA, contenait des affirmations inexactes par rapport au code (par exemple sur le code d'erreur renvoyé à un intrus).

== 9. Ce que j'ai appris (ou pas) en l'utilisant

Je comprends le code que j'ai intégré, refaire certains éléments me prendront plus de temps sans aide.

*Ce que je saurais refaire sans IA* : les composants React, les formulaires, les appels à l'API et le routage.

*Ce que je referais plus difficilement seul* : le déploiement continu qui nécessite un aprofondisement de ma part, la reconnexion du WebSocket et certains détails de sécurisation du serveur. Je sais expliquer ce qu'elles font, mais je risque de prend beaucoup plus de temps, voir même avoir du mal à les écrire seul sans documentation ou aide.

*Ce que j'ai réellement retenu* : le fonctionnement d'une application React connectée à une API, le temps réel par WebSocket, le workflow Git à deux et la mise en production sur un VPS.

*Sans IA*, j'aurais sans doute mieux assimilé ces parties complexes en les écrivant moi-même, mais je serais allé beaucoup moins loin car j'aurais pris beaucoup plus de temps. À certains moments, j'ai eu l'impression que l'IA en faisait trop à ma place : c'est pour cela que je l'ai stoppé et lui ai demandé de me laisser appliquer les changements moi-même.

== 10. Contribution personnelle

- *Frontend et déploiement.* J'ai pris en charge ces deux parties et défini ce que je voulais construire : organisation de l'interface et contenu de la page tarifs, avec les offres et les quotas.
- *Des décisions qui viennent de moi* :
  - héberger sur mon VPS plutôt que sur Railway ;
  - conserver le pseudo après la suppression d'un compte ;
- *Une décision commune* : ne pas ajouter PostgreSQL et Redis, afin de garder une architecture plus simple adaptée aux besoins du projet.
- *Le serveur.* J'ai installé, sécurisé et administré moi-même le VPS (domaine, HTTPS, Nginx, service systemd), en m'aidant le l'IA, en lui demandant des explications et en les intégrant.
- *L'intégration.* J'ai intégré, testé et corrigé le code, et j'ai résolu certaines erreurs moi-même à partir des explications de Claude.
- *L'équipe.* Je me suis coordonné avec mon binôme sur la répartition du travail, les branches et les Pull Requests.

== 11. Un brin d'auto-critique

- L'IA est un outil redoutable, qu'il faut bien configurer et maîtriser. Si je n'avais pas mis des stops à certains niveaux, il aurait été facile de lui déléguer du travail, mais alors je n'aurais pas eu le plaisir de comprendre des notions nouvelles et de les appliquer moi-même. Je trouve de la satisfaction à résoudre moi même un problème plutot que de me contenter d'une solution rapide. Ce premier travail, m'a permis de me dire qu'il faudrait que je bride encore plus mon utilisation de l'IA, même si ca me prend plus temps. 
// ------------------------------------------------------------
#v(0.3em)
#block(width: 100%, stroke: 0.6pt + accent, inset: 10pt, radius: 3pt, breakable: false)[
  *Attestation.* Je déclare que ce carnet reflète honnêtement mon usage de l'IA et que je suis en mesure d'expliquer et de défendre l'ensemble du travail remis.

  #v(0.6em)
  #grid(
    columns: (1fr, 1fr, 1fr),
    [Nom : Coisne Valentin], [Date : 02/11/2026], [Signature : #box(width: 2.6cm, repeat[.])],
  )
]
