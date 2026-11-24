import type { ReactNode } from "react";

export type AboutCard = {
  id?: string;
  title: string;
  body: string;
  tone: "green" | "blue" | "sun" | "ink" | "rose";
  link?: { label: string; href: string };
  /** Three layers, back to front. The scroll moves the back ones the most, which is the parallax. */
  art: [ReactNode, ReactNode, ReactNode];
};

const svg = (children: ReactNode) => (
  <svg viewBox="0 0 400 240" aria-hidden="true" focusable="false" preserveAspectRatio="xMidYMid slice">
    {children}
  </svg>
);

const Pill = ({ x, y, r = 0, c = "var(--accent)" }: { x: number; y: number; r?: number; c?: string }) => (
  <g transform={`translate(${x} ${y}) rotate(${r})`}>
    <rect x="-22" y="-9" width="44" height="18" rx="9" fill={c} opacity=".9" />
    <rect x="-22" y="-9" width="22" height="18" rx="9" fill="#fff" opacity=".55" />
  </g>
);

const Strip = ({ x, y, tint }: { x: number; y: number; tint: string }) => (
  <g transform={`translate(${x} ${y})`}>
    <rect width="104" height="58" rx="10" fill="var(--surface)" stroke={tint} strokeWidth="2.5" />
    {[24, 52, 80].map((cx) => (
      <circle key={cx} cx={cx} cy="29" r="9" fill={tint} opacity=".85" />
    ))}
  </g>
);

export const CARDS: AboutCard[] = [
  {
    id: "mission",
    title: "Health for everyone, everywhere",
    body: "Nirog exists so that anyone, whatever they can afford, can find the medicine they need and know what it should cost.",
    tone: "green",
    art: [
      svg(
        <g fill="none" stroke="var(--accent)" strokeWidth="2" opacity=".22">
          <circle cx="260" cy="120" r="70" />
          <circle cx="260" cy="120" r="108" />
          <circle cx="260" cy="120" r="148" />
        </g>,
      ),
      svg(
        <>
          <Pill x={96} y={60} r={-24} />
          <Pill x={346} y={186} r={18} c="var(--ja)" />
          <Pill x={150} y={196} r={32} c="#e7a33e" />
          <circle cx="352" cy="44" r="7" fill="#e7a33e" />
          <circle cx="60" cy="150" r="5" fill="var(--ja)" />
        </>,
      ),
      svg(
        <>
          <circle cx="260" cy="120" r="56" fill="var(--accent)" />
          <rect x="251" y="92" width="18" height="56" rx="5" fill="#fff" />
          <rect x="232" y="111" width="56" height="18" rx="5" fill="#fff" />
        </>,
      ),
    ],
  },
  {
    title: "The same medicine at a fair price",
    body: "The price of a medicine shouldn’t depend on the brand name on the box. We put the options side by side so you can pay a fair price.",
    tone: "sun",
    art: [
      svg(
        <g fill="#e7a33e" opacity=".3">
          {[0, 1, 2, 3, 4, 5].flatMap((i) => [0, 1, 2, 3].map((j) => <circle key={`${i}${j}`} cx={170 + i * 44} cy={34 + j * 56} r="3.5" />))}
        </g>,
      ),
      svg(
        <>
          <circle cx="86" cy="70" r="24" fill="var(--art-disc)" stroke="#e7a33e" strokeWidth="3" />
          <text x="86" y="79" textAnchor="middle" fontSize="26" fontWeight="700" fill="#b9791a">₹</text>
          <circle cx="352" cy="170" r="20" fill="var(--art-disc)" stroke="#e7a33e" strokeWidth="3" />
          <text x="352" y="178" textAnchor="middle" fontSize="22" fontWeight="700" fill="#b9791a">₹</text>
        </>,
      ),
      svg(
        <g transform="translate(150 40)">
          <rect x="-4" y="40" width="108" height="8" rx="4" fill="var(--text)" opacity=".8" transform="translate(48 -4) translate(-48 4)" />
          <path d="M100 48 100 170M72 170h56" stroke="var(--text)" strokeWidth="8" strokeLinecap="round" opacity=".8" />
          <g stroke="var(--text)" strokeWidth="3" opacity=".6">
            <path d="M0 52 -14 110M0 52 14 110M200 52 186 110M200 52 214 110" transform="translate(-0 0)" />
          </g>
          <ellipse cx="0" cy="112" rx="38" ry="10" fill="var(--accent)" />
          <ellipse cx="200" cy="112" rx="38" ry="10" fill="var(--accent)" />
          <circle cx="0" cy="94" r="16" fill="#e7a33e" />
          <circle cx="200" cy="94" r="16" fill="#e7a33e" />
        </g>,
      ),
    ],
  },
  {
    title: "Exact substitutes, honestly compared",
    body: "Same salts, same strength, same form. When something isn’t an exact match, we say what differs instead of hiding it.",
    tone: "blue",
    art: [
      svg(
        <>
          <circle cx="90" cy="80" r="90" fill="var(--ja)" opacity=".12" />
          <circle cx="340" cy="190" r="110" fill="var(--accent)" opacity=".12" />
        </>,
      ),
      svg(
        <g fill="var(--ja)" opacity=".5">
          {[[58, 196], [330, 46], [212, 24], [370, 120]].map(([x, y]) => (
            <g key={`${x}${y}`} transform={`translate(${x} ${y})`}>
              <rect x="-10" y="-3" width="20" height="6" rx="3" />
              <rect x="-3" y="-10" width="6" height="20" rx="3" />
            </g>
          ))}
        </g>,
      ),
      svg(
        <>
          <Strip x={56} y={92} tint="var(--ja)" />
          <Strip x={240} y={92} tint="var(--accent)" />
          <circle cx="200" cy="121" r="22" fill="var(--text)" />
          <rect x="190" y="113" width="20" height="4.5" rx="2" fill="var(--surface)" />
          <rect x="190" y="124" width="20" height="4.5" rx="2" fill="var(--surface)" />
        </>,
      ),
    ],
  },
  {
    title: "Public prices, no ads or trackers",
    body: "Prices come from public lists, including Government Jan Aushadhi. No ads, no tie-ups, and no analytics trackers.",
    tone: "ink",
    art: [
      svg(
        <g fill="none" stroke="var(--accent)" strokeWidth="2" opacity=".25">
          <path d="M0 150C60 110 100 190 160 150S260 110 320 150 380 170 400 150" />
          <path d="M0 186C60 146 100 226 160 186S260 146 320 186 380 206 400 186" />
          <path d="M0 114C60 74 100 154 160 114S260 74 320 114 380 134 400 114" />
        </g>,
      ),
      svg(
        <>
          <rect x="52" y="46" width="64" height="30" rx="8" fill="var(--accent)" opacity=".85" />
          <text x="84" y="68" textAnchor="middle" fontSize="18" fontWeight="700" fill="#fff">₹</text>
          <rect x="296" y="168" width="64" height="30" rx="8" fill="var(--ja)" opacity=".85" />
          <text x="328" y="190" textAnchor="middle" fontSize="18" fontWeight="700" fill="#fff">₹</text>
        </>,
      ),
      svg(
        <>
          <path d="M200 36 270 62v52c0 44-30 74-70 92-40-18-70-48-70-92V62z" fill="var(--accent)" />
          <path d="m168 120 24 24 42-48" fill="none" stroke="#fff" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" />
        </>,
      ),
    ],
  },
  {
    title: "We are just getting started",
    body: "Nirog is young and still growing. If something looks wrong, or you’d like to see something here, tell us.",
    tone: "rose",
    link: { label: "Tell us on GitHub", href: "https://github.com/iaintsaket/nirog-web/issues" },
    art: [
      svg(
        <g fill="#e7a33e">
          {[[60, 50, 4], [150, 28, 3], [330, 60, 5], [380, 150, 3], [48, 170, 3], [250, 30, 3]].map(([x, y, r]) => (
            <circle key={`${x}${y}`} cx={x} cy={y} r={r} opacity=".55" />
          ))}
        </g>,
      ),
      svg(<path d="M0 214C80 190 120 220 200 204S330 176 400 196V240H0z" fill="var(--accent)" opacity=".28" />),
      svg(
        <>
          <path d="M200 206V112" stroke="var(--accent-strong)" strokeWidth="8" strokeLinecap="round" />
          <path d="M200 140C160 140 134 116 130 82 168 82 196 104 200 140z" fill="var(--accent)" />
          <path d="M200 120C236 120 262 98 268 62 230 62 204 84 200 120z" fill="#3fbf8a" />
          <ellipse cx="200" cy="208" rx="46" ry="9" fill="var(--accent-strong)" opacity=".55" />
        </>,
      ),
    ],
  },
];
