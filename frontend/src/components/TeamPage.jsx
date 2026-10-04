const members = [
  {
    name: "Valentin Coisne",
    initials: "VC",
    role: "Développeur frontend",
    description: "Interface React, design avec Tailwind, connexion à l'API et expérience utilisateur.",
    skills: ["React", "Tailwind", "JavaScript", "UX"],
    github: "https://github.com/Seth-77",
  },
  {
    name: "George Vanderveen",
    initials: "GV",
    role: "Développeur backend",
    description: "API Django REST, authentification JWT, base de données et temps réel.",
    skills: ["Django", "Python", "REST", "JWT"],
    github: "https://github.com/AlphaXZero",
  },
];

function TeamPage() {
  return (
    <div className="mx-auto w-full max-w-4xl py-8">
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-bold text-ink">
           <span className="text-gold">Notre équipe</span>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-mist">
          Canopée est né dans le cadre du cours de projet d'intégration à l'IFOSUP Wavre.
          Deux développeurs, une ambition : une messagerie d'équipe simple, rapide et sécurisée.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {members.map((member) => (
          <div
            key={member.name}
            className="flex flex-col items-center rounded-xl border border-night-border bg-night-card p-8 text-center"
          >
            <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-forest bg-night-bg text-2xl font-bold text-gold">
              {member.initials}
            </div>

            <h2 className="mt-4 text-xl font-semibold text-ink">{member.name}</h2>
            <p className="text-sm font-semibold text-forest">{member.role}</p>
            <p className="mt-3 text-sm text-mist">{member.description}</p>

            <ul className="mt-5 flex flex-wrap justify-center gap-2">
              {member.skills.map((skill) => (
                <li
                  key={skill}
                  className="rounded-full bg-night-bg px-3 py-1 text-xs font-medium text-ink"
                >
                  {skill}
                </li>
              ))}
            </ul>

            <a
              href={member.github}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 text-sm font-medium text-gold hover:underline"
            >
              Voir le profil GitHub
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}

export default TeamPage;