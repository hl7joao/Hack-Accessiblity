// Minimal inline icon set (stroke icons, inherit currentColor).
const PATHS: Record<string, string> = {
  home: 'M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10',
  route: 'M6 19a2 2 0 100-4 2 2 0 000 4zM18 9a2 2 0 100-4 2 2 0 000 4zM6 15V9a4 4 0 014-4h2M18 9v6a4 4 0 01-4 4h-2',
  alert: 'M12 3l10 18H2L12 3zM12 10v4M12 17.5v.5',
  settings: 'M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z',
  search: 'M11 18a7 7 0 100-14 7 7 0 000 14zM21 21l-4.3-4.3',
  elevator: 'M5 3h14v18H5zM9 9l3-3 3 3M9 15l3 3 3-3',
  wheelchair: 'M12 4.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM10 7v6h6l3 6M10 10H7M8 12.5a5 5 0 109 4',
  train: 'M6 3h12a2 2 0 012 2v10a3 3 0 01-3 3H7a3 3 0 01-3-3V5a2 2 0 012-2zM4 11h16M8 21l2-3M16 21l-2-3M8 15h.01M16 15h.01',
  bell: 'M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 01-3.4 0',
  pin: 'M12 22s7-6.3 7-12a7 7 0 10-14 0c0 5.7 7 12 7 12zM12 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z',
  ticket: 'M3 7h18v4a2 2 0 000 4v4H3v-4a2 2 0 000-4V7z',
  walk: 'M13 4.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM10 22l2-7 3 3v6M8 12l2-4 4 1 2 4 3 1',
  check: 'M5 12l5 5L20 7',
  x: 'M6 6l12 12M18 6L6 18',
  chevron: 'M9 6l6 6-6 6',
  back: 'M15 6l-6 6 6 6',
  location: 'M12 2v3M12 19v3M2 12h3M19 12h3M12 17a5 5 0 100-10 5 5 0 000 10z',
  volume: 'M11 5L6 9H2v6h4l5 4V5zM15.5 8.5a5 5 0 010 7M19 5a10 10 0 010 14',
  door: 'M4 21h16M6 21V4a1 1 0 011-1h10a1 1 0 011 1v17M14 12h.01',
  clock: 'M12 21a9 9 0 100-18 9 9 0 000 18zM12 7v5l3 2',
};

export type IconName = keyof typeof PATHS;

export function Icon({ name, size = 24, label }: { name: IconName; size?: number; label?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
