/** Original illustration for the home hero: an elder and a young woman comparing a medicine strip. */
export function HeroArt() {
  return (
    <svg className="hero-art" viewBox="0 0 180 150" role="img" aria-label="An elder and a young woman comparing a medicine strip">
      <circle cx="90" cy="80" r="68" fill="var(--art-disc)" />
      <circle cx="62" cy="58" r="17" fill="#8a5a3c" />
      <path d="M30 150c2-34 14-56 32-56s30 22 32 56z" fill="#e7a33e" />
      <circle cx="118" cy="62" r="16" fill="#a86b47" />
      <path d="M102 60c0-14 10-22 18-20 10 2 15 10 14 22-6-8-20-10-32-2z" fill="#2b1d17" />
      <path d="M90 150c2-32 12-52 28-52s27 20 30 52z" fill="#0f7a55" />
      {/* Blister strip: foil card with two rows of capsules. */}
      <g transform="rotate(-8 91 113)">
        <rect x="68" y="101" width="46" height="25" rx="3" fill="#dfe6ea" stroke="#8d9aa1" strokeWidth="1.5" />
        <path d="M91 101v25" stroke="#8d9aa1" strokeWidth="1" strokeDasharray="2 2" />
        {[73, 84, 96, 107].flatMap((x) =>
          [105, 115].map((y) => (
            <g key={`${x}-${y}`}>
              <rect x={x - 1} y={y - 1} width="9" height="7" rx="3.5" fill="#fff" stroke="#b5c0c5" strokeWidth="0.8" />
              <rect x={x} y={y} width="3.5" height="5" rx="2.5" fill="#e7a33e" />
              <rect x={x + 3.5} y={y} width="3.5" height="5" rx="2.5" fill="#0f7a55" />
            </g>
          )),
        )}
      </g>
      <text x="132" y="36" fontSize="18" fontWeight="700" fill="var(--accent)" fontFamily="system-ui, sans-serif">
        ₹
      </text>
    </svg>
  );
}
