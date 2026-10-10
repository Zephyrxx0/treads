import * as React from 'react';

/**
 * An open field guide with empty plates waiting for their first find. A
 * sprout grows from the spine, a butterfly rests on the page and a pencil
 * lies ready. Line art in the ink colour, accents in the primary green and
 * the heat orange. Motion is CSS and stops under prefers-reduced-motion.
 */
export function EmptyFieldGuide({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 320 250"
      role="img"
      aria-label="An open field guide with blank plates and a small sprout growing from its spine."
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.1"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* ground */}
      <ellipse cx="160" cy="218" rx="128" ry="9" className="fill-foreground/5" stroke="none" />

      {/* cover edge and pages */}
      <path d="M26 86 V196 Q92 180 160 204 Q228 180 294 196 V86" className="fill-primary/10" />
      <path d="M36 74 Q98 60 160 80 V192 Q98 172 36 186 Z" className="fill-card" />
      <path d="M284 74 Q222 60 160 80 V192 Q222 172 284 186 Z" className="fill-card" />
      <path d="M160 80 V192" className="opacity-60" />

      {/* left page: a round plate and two lines of notes */}
      <circle cx="98" cy="124" r="25" strokeDasharray="3 4" className="opacity-70" />
      <path d="M86 132 q6 -16 12 -2 q4 -12 12 2" className="opacity-35" />
      <path d="M64 160 H132 M64 170 H112" className="opacity-45" />
      <text x="60" y="92" className="fill-muted-foreground font-mono" stroke="none" fontSize="7" letterSpacing="1.6">
        NO. 001
      </text>

      {/* right page: a photo plate with a corner mark */}
      <rect x="186" y="96" width="70" height="52" rx="4" strokeDasharray="3 4" className="opacity-70" />
      <path d="M186 148 l18 -17 14 11 12 -9 26 15" className="opacity-35" />
      <path d="M186 164 H256 M186 174 H238" className="opacity-45" />
      <text x="186" y="88" className="fill-muted-foreground font-mono" stroke="none" fontSize="7" letterSpacing="1.6">
        NO. 002
      </text>

      {/* sprout from the spine */}
      <g className="nature-sway text-primary" style={{ ['--deg' as string]: '3deg', ['--dur' as string]: '4.5s' }}>
        <path d="M160 82 C160 66 161 54 160 40" strokeWidth="1.4" />
        <path d="M160 62 C148 62 141 55 141 47 C152 47 159 53 160 62 Z" className="fill-primary/30" />
        <path d="M160 52 C172 52 179 45 179 37 C168 37 161 43 160 52 Z" className="fill-primary/30" />
        <path d="M160 40 C156 34 156 28 160 22 C164 28 164 34 160 40 Z" className="fill-primary/40" />
      </g>

      {/* butterfly resting on the right page */}
      <g className="nature-bob" style={{ ['--bob' as string]: '3.2s' }}>
        <g className="nature-flutter" stroke="currentColor" strokeWidth="0.8">
          <path d="M240 62 C233 50 224 51 226 59 C227 64 234 65 240 63 Z" style={{ fill: 'var(--heat-3)' }} />
          <path d="M240 63 C234 65 230 69 232 73 C235 76 239 71 240 63 Z" style={{ fill: 'var(--heat-2)' }} />
          <path d="M240 62 C247 50 256 51 254 59 C253 64 246 65 240 63 Z" style={{ fill: 'var(--heat-3)' }} />
          <path d="M240 63 C246 65 250 69 248 73 C245 76 241 71 240 63 Z" style={{ fill: 'var(--heat-2)' }} />
        </g>
        <path d="M240 58 V70 M239 58 Q237 54 235 53 M241 58 Q243 54 245 53" strokeWidth="0.9" />
      </g>

      {/* pencil */}
      <g transform="rotate(-14 252 214)">
        <rect x="196" y="209" width="66" height="9" rx="1.5" className="fill-card" />
        <path d="M262 209 L278 213.5 L262 218 Z" className="fill-card" />
        <path d="M273 212.3 L278 213.5 L273 214.7 Z" fill="currentColor" stroke="none" />
        <rect x="196" y="209" width="12" height="9" rx="1.5" style={{ fill: 'var(--heat-3)' }} />
        <path d="M212 209 V218" className="opacity-50" />
      </g>
    </svg>
  );
}
