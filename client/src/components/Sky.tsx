import { memo } from 'react';

/** One puffy cloud, outlined like everything else in the yard. */
function Cloud({ className }: { className: string }) {
  return (
    <svg className={`cloud ${className}`} viewBox="0 0 200 92" focusable="false">
      <path
        d="M38 80C13 80 8 53 30 47 25 24 57 12 73 29 83 6 125 6 133 31 157 20 183 41 168 59 191 63 187 82 164 80Z"
        fill="#fff"
        stroke="var(--cloud-line)"
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** The backdrop behind the camera: sky, sun or moon, stars and a few drifting clouds. */
export const Sky = memo(function Sky() {
  return (
    <div className="sky" aria-hidden="true">
      <div className="sky-stars" />
      <div className="sky-orb" />
      <Cloud className="cloud-a" />
      <Cloud className="cloud-b" />
      <Cloud className="cloud-c" />
    </div>
  );
});
