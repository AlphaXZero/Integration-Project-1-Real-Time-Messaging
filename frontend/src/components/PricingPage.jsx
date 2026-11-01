import { useState } from "react";
import { Link } from "react-router";
import { isLoggedIn } from "../api/auth";

const plans = [
    {
        name: "Gratuit",
        description: "L'essentiel pour discuter avec ton équipe.",
        monthly: 0,
        yearly: 0,
        cta: { label: "Commencer gratuitement", to: "/register" },
        memberCta: { label: "Ouvrir Canopée", to: "/chat" },
    },
    {
        name: "Canopée+",
        description: "Personnalise ton espace et partage plus que du texte.",
        monthly: 4,
        yearly: 3,
        cta: { label: "Passer à Canopée+", to: "/register" },
        memberCta: { label: "Bientôt disponible", disabled: true },
        highlighted: true,
    },
    {
        name: "Entreprise",
        description: "Pour les organisations aux besoins spécifiques.",
        custom: true,
        cta: { label: "Nous contacter", to: "/equipe" },
    },
];

const quotas = [
    { label: "Messages", values: ["Illimités", "Illimités", "Illimités"] },
    { label: "Historique", values: ["Illimité", "Illimité", "Illimité"] },
    { label: "Membres par groupe", values: ["10", "100", "Illimité"] },
];

const features = [
    { label: "Conversations privées et de groupe", plan: 0 },
    { label: "Messages en temps réel", plan: 0 },
    { label: "Notifications des nouveaux messages", plan: 0 },
    { label: "Réactivation d'un compte désactivé", plan: 1 },
    { label: "Choix du thème (clair, sombre, couleurs)", plan: 1, soon: true },
    { label: "Envoi d'images", plan: 1, soon: true },
    { label: "GIF et réactions emoji", plan: 1, soon: true },
    { label: "Photo de profil", plan: 1, soon: true },
    { label: "Modération automatique", plan: 2, soon: true },
    { label: "Support prioritaire", plan: 2 },
];

function PricingPage() {
    const [yearly, setYearly] = useState(false);
    const loggedIn = isLoggedIn();

    const toggleClass = (active) =>
        `cursor-pointer rounded-full px-4 py-1.5 text-sm font-semibold transition ${active ? "bg-forest text-white" : "text-mist hover:text-ink"
        }`;

    return (
        <div className="mx-auto w-full max-w-6xl">
            <div className="mb-10 text-center">
                <h1 className="text-4xl font-bold text-ink">
                    Plus de possibilités avec <span className="text-gold">Canopée+</span>
                </h1>
                <p className="mt-3 text-mist">
                    L'essentiel reste gratuit. Les fonctionnalités en plus sont pour ceux qui en veulent plus.
                </p>

                <div className="mt-8 inline-flex rounded-full border border-night-border bg-night-card p-1">
                    <button type="button" onClick={() => setYearly(false)} aria-pressed={!yearly} className={toggleClass(!yearly)}>
                        Mensuel
                    </button>
                    <button type="button" onClick={() => setYearly(true)} aria-pressed={yearly} className={toggleClass(yearly)}>
                        Annuel <span className="text-xs text-gold">−25 %</span>
                    </button>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {plans.map((plan, planIndex) => {
                    const price = yearly ? plan.yearly : plan.monthly;
                    const cta = loggedIn && plan.memberCta ? plan.memberCta : plan.cta;
                    return (
                        <div
                            key={plan.name}
                            className={`relative flex flex-col rounded-xl border bg-night-card p-6 ${plan.highlighted ? "border-gold shadow-lg shadow-gold/10" : "border-night-border"
                                }`}
                        >
                            {plan.highlighted && (
                                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gold px-3 py-0.5 text-xs font-bold text-night-bg">
                                    Le plus populaire
                                </span>
                            )}

                            <h2 className="text-xl font-semibold text-ink">{plan.name}</h2>
                            <p className="mt-2 text-sm text-mist">{plan.description}</p>

                            <div className="my-6">
                                {plan.custom ? (
                                    <p className="text-4xl font-bold text-ink">Sur devis</p>
                                ) : (
                                    <p className="flex items-baseline gap-1">
                                        <span className="text-4xl font-bold text-ink">{price} €</span>
                                        <span className="text-sm text-mist">{price === 0 ? "pour toujours" : "/ utilisateur / mois"}</span>
                                    </p>
                                )}
                                {yearly && price > 0 && <p className="mt-1 text-xs text-mist">Facturé annuellement</p>}
                            </div>

                            <dl className="mb-6 flex flex-col gap-2 border-y border-night-border py-4 text-sm">
                                {quotas.map((quota) => (
                                    <div key={quota.label} className="flex items-baseline justify-between gap-4">
                                        <dt className="text-mist">{quota.label}</dt>
                                        <dd className="text-right font-semibold text-ink">{quota.values[planIndex]}</dd>
                                    </div>
                                ))}
                            </dl>

                            <ul className="mb-8 flex flex-1 flex-col gap-2.5 text-sm">
                                {features.map((feature) => {
                                    const included = planIndex >= feature.plan;
                                    return (
                                        <li
                                            key={feature.label}
                                            className={`flex items-start gap-2 ${included ? "text-ink" : "text-mist/50"}`}
                                        >
                                            <span className={included ? "text-forest" : ""} aria-hidden="true">
                                                {included ? "✓" : "✕"}
                                            </span>
                                            <span>
                                                {feature.label}
                                                {included && feature.soon && (
                                                    <span className="ml-2 rounded-full bg-gold/15 px-2 py-0.5 text-[10px] font-semibold text-gold">
                                                        Bientôt
                                                    </span>
                                                )}
                                                {!included && <span className="sr-only"> (non inclus)</span>}
                                            </span>
                                        </li>
                                    );
                                })}
                            </ul>

                            {cta.disabled ? (
                                <span
                                    aria-disabled="true"
                                    className="cursor-not-allowed rounded-md border border-night-border py-3 text-center font-semibold text-mist"
                                >
                                    {cta.label}
                                </span>
                            ) : (
                                <Link
                                    to={cta.to}
                                    className={`rounded-md py-3 text-center font-semibold transition ${plan.highlighted
                                            ? "bg-forest text-white hover:bg-forest-hover"
                                            : "border border-night-border text-ink hover:bg-night-bg"
                                        }`}
                                >
                                    {cta.label}
                                </Link>
                            )}
                        </div>
                    );
                })}
            </div>

            <p className="mt-8 text-center text-xs text-mist/70">
                Projet étudiant réalisé à l'IFOSUP Wavre : les tarifs sont fictifs et donnés à titre d'exemple.
            </p>
        </div>
    );
}

export default PricingPage;