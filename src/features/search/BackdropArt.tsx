import type { CSSProperties } from "react";

/**
 * Paper-cutout decorations for the empty home screen: a stethoscope on the right and a tilted
 * blister strip in the bottom-left corner. Original art; decorative only.
 */
export function BackdropArt() {
  return (
    <div className="backdrop-art" aria-hidden="true">
      <svg className="cutout cutout-steth intro" style={{ "--i": 2 } as CSSProperties} viewBox="0 0 240 320">
        <g fill="none" stroke="var(--surface)" strokeWidth="13" strokeLinecap="round">
          <path d="M70 26 C58 84 66 122 110 142" />
          <path d="M150 26 C162 84 154 122 110 142" />
          <path d="M110 142 C110 204 52 214 62 262 C72 306 150 300 170 258" />
        </g>
        <g fill="var(--surface)">
          <circle cx="70" cy="20" r="11" />
          <circle cx="150" cy="20" r="11" />
          <circle cx="176" cy="236" r="30" />
        </g>
        <circle cx="176" cy="236" r="14" fill="var(--accent-soft)" />
      </svg>
      <svg className="cutout cutout-strip intro" style={{ "--i": 4 } as CSSProperties} viewBox="0 0 270 124">
        <rect x="2" y="2" width="266" height="120" rx="16" fill="var(--surface)" />
        <line x1="20" y1="62" x2="250" y2="62" stroke="var(--border)" strokeWidth="2" strokeDasharray="6 6" />
        {[0, 1, 2, 3, 4].flatMap((c) =>
          [0, 1].map((r) => (
            <rect
              key={`${c}-${r}`}
              x={24 + c * 46}
              y={16 + r * 56}
              width="38"
              height="36"
              rx="18"
              fill="var(--accent-soft)"
              stroke="color-mix(in srgb, var(--accent) 25%, transparent)"
              strokeWidth="2"
            />
          )),
        )}
      </svg>
    </div>
  );
}
