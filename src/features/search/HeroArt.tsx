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
      <rect x="74" y="104" width="34" height="18" rx="4" fill="#fff" stroke="#c98a2b" strokeWidth="2" />
      <circle cx="83" cy="113" r="3" fill="#e7a33e" />
      <circle cx="91" cy="113" r="3" fill="#e7a33e" />
      <circle cx="99" cy="113" r="3" fill="#e7a33e" />
      <text x="132" y="36" fontSize="18" fontWeight="700" fill="var(--accent)" fontFamily="system-ui, sans-serif">
        ₹
      </text>
    </svg>
  );
}
