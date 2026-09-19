import { memo } from 'react';

/** The backdrop behind the camera: sky, sun or moon, stars and a few drifting clouds. */
export const Sky = memo(function Sky() {
  return (
    <div className="sky" aria-hidden="true">
      <div className="sky-stars" />
      <div className="sky-orb" />
      <div className="cloud cloud-a" />
      <div className="cloud cloud-b" />
      <div className="cloud cloud-c" />
    </div>
  );
});
