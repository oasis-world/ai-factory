import type { ReactNode } from 'react'

export type IconName =
  | 'robot' | 'game' | 'video' | 'comic' | 'engine' | 'assets'
  | 'back' | 'spark' | 'arrow' | 'trash' | 'check'

const SHAPES: Record<IconName, ReactNode> = {
  robot: <>
    <rect x="4" y="8" width="16" height="12" rx="4" />
    <path d="M12 8V4M8 4h8" />
    <circle cx="9" cy="14" r="1.1" fill="currentColor" stroke="none" />
    <circle cx="15" cy="14" r="1.1" fill="currentColor" stroke="none" />
    <path d="M9.5 17h5" />
  </>,
  game: <>
    <rect x="2.5" y="7" width="19" height="10" rx="5" />
    <path d="M7 10v4M5 12h4M16 11h.01M18.5 13h.01" />
  </>,
  video: <>
    <rect x="2.5" y="5" width="19" height="14" rx="2.5" />
    <path d="M2.5 9.5h19M7 5l2 4.5M12 5l2 4.5M17 5l2 4.5" />
  </>,
  comic: <>
    <path d="M12 6c-2-2-6-2-9 0v13c3-2 7-2 9 0 2-2 6-2 9 0V6c-3-2-7-2-9 0Z" />
    <path d="M12 6v13" />
  </>,
  engine: <>
    <rect x="3" y="4" width="18" height="16" rx="3" />
    <path d="M7 9h4M7 13h10M7 17h6" />
  </>,
  assets: <path d="M3 7h7l2 2.5h9V19H3V7Z" />,
  back: <path d="M15 5l-7 7 7 7" />,
  spark: <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" />,
  arrow: <path d="M12 5v14M6 13l6 6 6-6" />,
  trash: <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" />,
  check: <path d="M5 12l5 5L19 7" />,
}

export function Icon({ name, size = 26 }: { name: IconName; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {SHAPES[name]}
    </svg>
  )
}
