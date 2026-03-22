"use client";

/**
 * Narrative SVG: applicant at desk → clicks Apply → résumé flies into hiring portal → success burst.
 * Styling uses theme CSS variables; motion respects prefers-reduced-motion via globals.css.
 */
export function ApplicantHeroScene() {
  return (
    <div className="applicant-wrap relative mx-auto w-full max-w-[min(100%,760px)]">
      <div className="applicant-glow pointer-events-none absolute -inset-8 rounded-[40%] opacity-40 blur-3xl" aria-hidden />
      <svg
        viewBox="0 0 820 540"
        className="applicant-svg relative z-[1] h-auto w-full drop-shadow-2xl"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <defs>
          <linearGradient id="ah-desk" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--scene-elevated)" />
            <stop offset="100%" stopColor="var(--scene-muted)" />
          </linearGradient>
          <linearGradient id="ah-screen" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--scene-accent-2)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="var(--scene-accent)" stopOpacity="0.15" />
          </linearGradient>
          <filter id="ah-soft" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="8" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Ambient blobs */}
        <ellipse
          className="applicant-blob-a"
          cx="120"
          cy="420"
          rx="140"
          ry="100"
          fill="var(--scene-accent)"
          opacity="0.06"
        />
        <ellipse
          className="applicant-blob-b"
          cx="720"
          cy="140"
          rx="120"
          ry="90"
          fill="var(--scene-accent-2)"
          opacity="0.07"
        />

        {/* Portal / company doorway */}
        <g className="applicant-portal">
          <rect x="598" y="120" width="160" height="200" rx="12" fill="var(--scene-surface)" stroke="var(--scene-border)" strokeWidth="2" />
          <rect x="612" y="136" width="132" height="48" rx="6" fill="var(--scene-elevated)" />
          <text x="678" y="168" textAnchor="middle" fill="var(--scene-fg-muted)" fontSize="14" fontFamily="system-ui, -apple-system, sans-serif" fontWeight="600">
            Hiring
          </text>
          <rect x="612" y="198" width="132" height="72" rx="6" fill="url(#ah-screen)" />
          <circle className="applicant-portal-pulse" cx="678" cy="234" r="22" fill="var(--scene-accent)" opacity="0.35" />
          <path
            className="applicant-check"
            d="M668 234 L676 244 L692 224"
            stroke="var(--scene-accent)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0"
          />
        </g>

        {/* Desk */}
        <path d="M80 380 L420 340 L760 380 L760 400 L80 400 Z" fill="url(#ah-desk)" stroke="var(--scene-border)" strokeWidth="1.5" />
        <path d="M80 400 L420 360 L760 400" stroke="var(--scene-border)" strokeWidth="1" opacity="0.5" />

        {/* Chair */}
        <ellipse cx="280" cy="395" rx="44" ry="14" fill="var(--scene-muted)" opacity="0.6" />
        <rect x="252" y="300" width="56" height="88" rx="8" fill="var(--scene-elevated)" stroke="var(--scene-border)" />

        {/* Person */}
        <g className="applicant-person">
          <circle cx="280" cy="248" r="36" fill="var(--scene-fg-muted)" opacity="0.35" />
          <path
            d="M248 288 Q280 272 312 288 L300 360 L260 360 Z"
            fill="var(--scene-fg-muted)"
            opacity="0.28"
          />
          {/* Arm + hand toward laptop */}
          <g className="applicant-arm">
            <path
              d="M300 310 Q340 318 380 305"
              stroke="var(--scene-fg-muted)"
              strokeWidth="14"
              strokeLinecap="round"
              opacity="0.35"
            />
            <circle cx="388" cy="302" r="10" fill="var(--scene-fg-muted)" opacity="0.4" />
          </g>
        </g>

        {/* Laptop */}
        <g className="applicant-laptop">
          <rect x="360" y="268" width="220" height="130" rx="10" fill="var(--scene-surface)" stroke="var(--scene-border)" strokeWidth="2" />
          <rect x="372" y="280" width="196" height="106" rx="4" fill="var(--scene-base)" stroke="var(--scene-border)" />
          <rect x="380" y="288" width="180" height="90" rx="2" fill="url(#ah-screen)" opacity="0.9" />
          {/* Fake form lines */}
          <rect x="392" y="302" width="100" height="6" rx="2" fill="var(--scene-fg-muted)" opacity="0.25" />
          <rect x="392" y="318" width="156" height="6" rx="2" fill="var(--scene-fg-muted)" opacity="0.15" />
          <rect x="392" y="334" width="120" height="6" rx="2" fill="var(--scene-fg-muted)" opacity="0.15" />
          <rect
            className="applicant-apply-btn"
            x="420"
            y="352"
            width="100"
            height="26"
            rx="6"
            fill="var(--scene-accent)"
          />
          <text x="470" y="369" textAnchor="middle" fill="var(--scene-base)" fontSize="11" fontFamily="system-ui, -apple-system, sans-serif" fontWeight="800">
            APPLY
          </text>
          <path d="M350 398 L590 398 L580 408 L360 408 Z" fill="var(--scene-elevated)" stroke="var(--scene-border)" />
        </g>

        {/* Flying résumé sheets */}
        <g className="applicant-paper applicant-paper-1" filter="url(#ah-soft)">
          <rect width="72" height="96" rx="4" fill="var(--scene-fg)" opacity="0.92" />
          <rect x="12" y="16" width="48" height="5" rx="1" fill="var(--scene-base)" opacity="0.2" />
          <rect x="12" y="28" width="40" height="4" rx="1" fill="var(--scene-base)" opacity="0.12" />
          <rect x="12" y="38" width="52" height="4" rx="1" fill="var(--scene-base)" opacity="0.12" />
        </g>
        <g className="applicant-paper applicant-paper-2" opacity="0.85">
          <rect width="64" height="88" rx="4" fill="var(--scene-fg)" opacity="0.75" />
        </g>

        {/* Sparkles */}
        <g className="applicant-sparkles" fill="var(--scene-accent-2)">
          <circle cx="640" cy="200" r="3" />
          <circle cx="670" cy="175" r="2" />
          <circle cx="625" cy="165" r="2.5" />
        </g>
      </svg>

      <p className="sr-only">
        Animated illustration: a person at a laptop clicks Apply; documents fly into a hiring portal and a success checkmark appears.
      </p>
    </div>
  );
}
