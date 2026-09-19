import type { ReactNode } from 'react';

const PATHS: Record<string, ReactNode> = {
  home: <path d="M3.5 11.5 12 4l8.5 7.5M6 10v9.5h12V10M10 19.5v-5h4v5" />,
  search: (
    <>
      <circle cx="10.5" cy="10.5" r="6" />
      <path d="m15 15 5.5 5.5" />
    </>
  ),
  broom: <path d="M19.5 3.5 12 11M9.5 9.5l5 5M8 11l5 5c-1 3.5-4 5-9 4.5C3.5 15.500 5 12 8 11ZM6.500 16.500l2 2" />,
  ruler: <path d="m3.500 16.500 13-13 4 4-13 13-4-4ZM7.500 12.500l1.500 1.500M10.500 9.500l1.500 1.500M13.500 6.500l1.500 1.500" />,
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.500v2.500M12 19v2.500M2.500 12H5M19 12h2.500M5.300 5.300 7 7M17 17l1.700 1.700M5.300 18.700 7 17M17 7l1.700-1.700" />
    </>
  ),
  moon: <path d="M20 14.500A8.500 8.500 0 1 1 9.500 4a7 7 0 0 0 10.500 10.500Z" />,
  soundOn: <path d="M4 9.500v5h3.500l4.500 4v-13l-4.500 4H4ZM15.500 9a4 4 0 0 1 0 6M18 6.500a7.500 7.500 0 0 1 0 11" />,
  soundOff: <path d="M4 9.500v5h3.500l4.500 4v-13l-4.500 4H4ZM16 9.500l5 5M21 9.500l-5 5" />,
  more: (
    <>
      <circle cx="5" cy="12" r="1.300" />
      <circle cx="12" cy="12" r="1.300" />
      <circle cx="19" cy="12" r="1.300" />
    </>
  ),
  pin: <path d="M9 3.500h6l-1 5.500 3 3.500H7l3-3.500-1-5.500ZM12 12.500v8" />,
  link: <path d="M10 14a4 4 0 0 0 5.700 0l3-3a4 4 0 0 0-5.700-5.700l-1 1M14 10a4 4 0 0 0-5.700 0l-3 3A4 4 0 0 0 11 18.700l1-1" />,
  trash: <path d="M4.500 7h15M9.500 7V4.500h5V7M6.500 7l1 12.500h9l1-12.500M10 10.500v6M14 10.500v6" />,
  download: <path d="M12 4v11M7.500 11l4.500 4.500 4.500-4.500M5 19.500h14" />,
  upload: <path d="M12 16V5M7.500 9 12 4.500 16.500 9M5 19.500h14" />,
  move: <path d="M12 3v18M3 12h18M12 3 9.500 5.500M12 3l2.500 2.500M12 21l-2.500-2.500M12 21l2.500-2.500M3 12l2.500-2.500M3 12l2.500 2.500M21 12l-2.500-2.500M21 12l-2.500 2.500" />,
  close: <path d="m6 6 12 12M18 6 6 18" />,
  back: <path d="M14.500 5.500 8 12l6.500 6.500" />,
  forward: <path d="M9.500 5.500 16 12l-6.500 6.500" />,
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  photo: (
    <>
      <rect x="3.500" y="5" width="17" height="14" rx="2" />
      <circle cx="9" cy="10" r="1.700" />
      <path d="m4 17 5-4.500 3.500 3 3-2.500 4.500 4" />
    </>
  ),
  box: <path d="M3.500 8 12 4l8.500 4v8.500L12 20.500 3.500 16.500V8ZM3.500 8 12 12l8.500-4M12 12v8.500" />,
  mail: (
    <>
      <rect x="3.500" y="6" width="17" height="12.500" rx="2" />
      <path d="m4 7.500 8 6 8-6" />
    </>
  ),
  sparkle: <path d="M12 3.500 13.800 9l5.700 1.800-5.700 1.800L12 18l-1.800-5.400L4.500 10.800 10.200 9 12 3.500ZM18.500 15.500l.8 2.200 2.200.8-2.200.8-.8 2.200-.8-2.200-2.200-.8 2.200-.8.8-2.200Z" />,
  edit: <path d="M4 20h4L19.500 8.500l-4-4L4 16v4ZM13.500 6.500l4 4" />,
  check: <path d="m5 12.500 4.500 4.500L19 7.500" />,
  undo: <path d="M8.500 6 4 10.500 8.500 15M4.500 10.500H14a5.500 5.500 0 0 1 0 11h-3" />,
  share: (
    <>
      <circle cx="6.500" cy="12" r="2.500" />
      <circle cx="17.500" cy="6" r="2.500" />
      <circle cx="17.500" cy="18" r="2.500" />
      <path d="m8.700 10.800 6.600-3.600M8.700 13.200l6.600 3.600" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="8.500" />
      <path d="M12 11v5.500M12 7.700v.100" />
    </>
  ),
  reset: <path d="M4.500 5v5h5M5 10a8 8 0 1 1-1 5" />,
  play: <path d="M8 5.500v13l10.500-6.500L8 5.500Z" />,
  pause: <path d="M8 5.500v13M16 5.500v13" />,
  door: <path d="M6.500 20.500V4h11v16.500M4 20.500h16M14.500 12.500v.100" />,
  layers: <path d="m12 4 8.500 4.500L12 13 3.500 8.500 12 4ZM3.500 12.500 12 17l8.500-4.500M3.500 16.500 12 21l8.500-4.500" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="8.500" />
      <path d="M12 7.500V12l3 2" />
    </>
  ),
  paint: <path d="M4 4.500h13v6H4v-6ZM17 7.500h3v5h-8v3M10.500 15.500h3v5h-3v-5Z" />,
  image: (
    <>
      <rect x="3.500" y="4.500" width="17" height="15" rx="2" />
      <path d="m4 16 4.500-4 4 3.500 3-2.500 4.500 4" />
    </>
  ),
  swap: <path d="M7 4.500 3.500 8 7 11.500M3.500 8H17M17 12.500l3.500 3.500-3.500 3.500M20.500 16H7" />,
  width: <path d="M3 12h18M3 12l3.500-3.500M3 12l3.500 3.500M21 12l-3.500-3.500M21 12l-3.500 3.500M3 5v14M21 5v14" />,
};

export type IconName = keyof typeof PATHS;

export function Icon({ name, size = 18 }: { name: IconName | string; size?: number }) {
  return (
    <svg className="icon" viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      {PATHS[name] ?? null}
    </svg>
  );
}
