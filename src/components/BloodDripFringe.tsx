import React from 'react';

interface BloodDripFringeProps {
  compact?: boolean;
  className?: string;
}

/**
 * Glossy organic melting-blood SVG drip edge for Netflix Castlevania surfaces & buttons.
 */
export const BloodDripFringe: React.FC<BloodDripFringeProps> = ({
  compact = false,
  className = '',
}) => {
  const height = compact ? 10 : 16;
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 400 22"
      preserveAspectRatio="none"
      style={{ height }}
      className={`pointer-events-none absolute left-0 right-0 ${compact ? '-bottom-[9px]' : '-bottom-[15px]'} w-full overflow-visible blood-drip-anim ${className}`}
    >
      <defs>
        <linearGradient id="castlevaniaBloodGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#d90b1c" />
          <stop offset="55%" stopColor="#9e0512" />
          <stop offset="100%" stopColor="#560108" />
        </linearGradient>
      </defs>
      <path
        d="M0,0 L400,0 L400,2 C390,3 386,12 383,12 C380,12 378,4 370,3 C356,2 349,17 346,17 C343,17 341,4 328,2 C314,1 308,9 305,9 C302,9 299,3 284,2 C269,2 264,19 260,19 C256,19 254,3 240,2 C226,2 221,11 218,11 C215,11 212,2 196,2 C180,2 175,15 172,15 C169,15 166,3 152,2 C136,1 131,10 128,10 C125,10 122,2 106,2 C90,2 85,20 81,20 C77,20 75,3 60,2 C44,2 39,13 36,13 C33,13 30,3 18,2 C9,2 4,8 0,6 Z"
        fill="url(#castlevaniaBloodGrad)"
      />
      {/* Wet crimson specular highlights on deepest blood drops */}
      <circle cx="81" cy="15.5" r="1.15" fill="#ff737e" opacity="0.7" />
      <circle cx="172" cy="11.5" r="0.95" fill="#ff737e" opacity="0.65" />
      <circle cx="260" cy="14.5" r="1.1" fill="#ff737e" opacity="0.7" />
      <circle cx="346" cy="13" r="0.95" fill="#ff737e" opacity="0.65" />
    </svg>
  );
};
