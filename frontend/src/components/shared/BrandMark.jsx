import React from "react";

export default function BrandMark({ className = "" }) {
  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <div className="pointer-events-none absolute inset-0 rounded-[22%] bg-electric-500/20 blur-[7px]" />
      <div className="pointer-events-none absolute inset-[8%] rounded-[24%] bg-cyan-300/15 blur-[10px]" />

      <svg
        viewBox="0 0 512 512"
        className="relative h-full w-full"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <rect width="512" height="512" rx="96" fill="#070B14" />

        <rect width="512" height="512" rx="96" fill="url(#nexus-bg-glow)" fillOpacity="0.42" />

        <circle cx="256" cy="256" r="156" stroke="#2D3D60" strokeWidth="18" />

        <ellipse
          cx="256"
          cy="256"
          rx="178"
          ry="88"
          transform="rotate(-20 256 256)"
          stroke="#7C83FF"
          strokeWidth="14"
        />

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

        <path
          d="M176 334V178L336 334V178"
          stroke="url(#nexus-brand-mark-gradient)"
          strokeWidth="28"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        <path
          d="M176 334V178L336 334V178"
          stroke="#A5B4FC"
          strokeWidth="8"
          strokeOpacity="0.24"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        <circle cx="366" cy="200" r="14" fill="#67E8F9" />
        <circle cx="366" cy="200" r="24" fill="#67E8F9" fillOpacity="0.26" />

        <defs>
          <linearGradient id="nexus-brand-mark-gradient" x1="166" y1="166" x2="352" y2="350" gradientUnits="userSpaceOnUse">
            <stop stopColor="#7CF8FF" />
            <stop offset="0.55" stopColor="#7C83FF" />
            <stop offset="1" stopColor="#A78BFA" />
          </linearGradient>
          <radialGradient id="nexus-bg-glow" cx="50%" cy="50%" r="65%">
            <stop offset="0%" stopColor="#3346A1" />
            <stop offset="65%" stopColor="#0E1530" />
            <stop offset="100%" stopColor="#070B14" />
          </radialGradient>
        </defs>
      </svg>
    </div>
  );
}
