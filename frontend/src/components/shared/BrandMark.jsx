import React from "react";

export default function BrandMark({ className = "" }) {
  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      {/* Ambient glow layers — no background box */}
      <div className="pointer-events-none absolute inset-0 rounded-full bg-electric-500/20 blur-[8px]" />
      <div className="pointer-events-none absolute inset-[10%] rounded-full bg-cyan-300/15 blur-[10px]" />

      <svg
        viewBox="0 0 512 512"
        className="relative h-full w-full"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* No background rect — fully transparent */}

        {/* Outer orbit ring */}
        <circle cx="256" cy="256" r="156" stroke="#2D3D60" strokeWidth="18" />

        {/* Orbital ellipse 1 */}
        <ellipse
          cx="256"
          cy="256"
          rx="178"
          ry="88"
          transform="rotate(-20 256 256)"
          stroke="#7C83FF"
          strokeWidth="14"
        />

        {/* Orbital ellipse 2 */}
        <ellipse
          cx="256"
          cy="256"
          rx="178"
          ry="88"
          transform="rotate(40 256 256)"
          stroke="#67E8F9"
          strokeOpacity="0.7"
          strokeWidth="10"
        />

        {/* N mark — gradient stroke */}
        <path
          d="M176 334V178L336 334V178"
          stroke="url(#nexus-brand-mark-gradient)"
          strokeWidth="28"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* N mark — inner shimmer */}
        <path
          d="M176 334V178L336 334V178"
          stroke="#A5B4FC"
          strokeWidth="8"
          strokeOpacity="0.28"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Accent node */}
        <circle cx="366" cy="200" r="14" fill="#67E8F9" />
        <circle cx="366" cy="200" r="24" fill="#67E8F9" fillOpacity="0.26" />

        <defs>
          <linearGradient id="nexus-brand-mark-gradient" x1="166" y1="166" x2="352" y2="350" gradientUnits="userSpaceOnUse">
            <stop stopColor="#7CF8FF" />
            <stop offset="0.55" stopColor="#7C83FF" />
            <stop offset="1" stopColor="#A78BFA" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
