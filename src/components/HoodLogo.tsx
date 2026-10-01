import { useId } from 'react'

type Props = {
  size: number
  className?: string
  alt?: string
}

/** Square HOOD mark. The visor draws once, then the lights breathe. */
export function HoodLogo({ size, className = '', alt = 'Hood Desk' }: Props) {
  const uid = useId().replace(/:/g, '')
  const bg = `hood-bg-${uid}`
  const visor = `hood-visor-${uid}`
  const glow = `hood-glow-${uid}`

  return (
    <svg
      className={`hood-mark hood-logo${size >= 72 ? ' hood-logo-lift' : ''}${className ? ` ${className}` : ''}`}
      width={size}
      height={size}
      viewBox="0 0 128 128"
      role="img"
      aria-label={alt}
    >
      <defs>
        <radialGradient id={bg} cx="50%" cy="40%" r="65%">
          <stop offset="0%" stopColor="#141a00" />
          <stop offset="50%" stopColor="#0a0a0a" />
          <stop offset="100%" stopColor="#050505" />
        </radialGradient>
        <linearGradient id={visor} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#8fbf00" />
          <stop offset="50%" stopColor="#ccff00" />
          <stop offset="100%" stopColor="#8fbf00" />
        </linearGradient>
        <filter id={glow} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="2" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <rect width="128" height="128" rx="28" fill={`url(#${bg})`} />
      <rect
        x="1.5"
        y="1.5"
        width="125"
        height="125"
        rx="26.5"
        fill="none"
        stroke="#ccff00"
        strokeOpacity="0.35"
        strokeWidth="1.5"
      />
      <circle
        className="hood-logo-orbit"
        cx="64"
        cy="58"
        r="42"
        fill="none"
        stroke="#ccff00"
        strokeWidth="1.5"
        pathLength="100"
      />
      <circle cx="64" cy="58" r="38" fill="#080808" />
      <circle
        className="hood-logo-ring"
        cx="64"
        cy="58"
        r="37"
        fill="none"
        stroke="#ccff00"
        strokeWidth="1.5"
      />
      <path
        d="M38 72 C38 40 48 28 64 28 C80 28 90 40 90 72 L82 78 C78 52 72 44 64 44 C56 44 50 52 46 78 Z"
        fill="#0c0c0c"
      />
      <ellipse cx="64" cy="58" rx="14" ry="11" fill="#050505" />
      <path
        className="hood-logo-visor"
        d="M50 58.5 L56 57 L64 60.5 L72 57 L78 58.5"
        fill="none"
        stroke={`url(#${visor})`}
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter={`url(#${glow})`}
        pathLength="100"
      />
      <path d="M42 80 H86" stroke="#ccff00" strokeOpacity="0.75" strokeWidth="1.5" />
      <path d="M50 80 V88 M64 80 V92 M78 80 V88" stroke="#ccff00" strokeOpacity="0.55" strokeWidth="1.4" />
      <circle className="hood-logo-node" cx="50" cy="88" r="2.2" fill="#ccff00" />
      <circle className="hood-logo-node n2" cx="64" cy="92" r="2.6" fill="#ccff00" />
      <circle className="hood-logo-node n3" cx="78" cy="88" r="2.2" fill="#ccff00" />
      <path d="M50 88 H78" stroke="#ccff00" strokeOpacity="0.3" strokeWidth="1" />
      <text
        x="64"
        y="118"
        textAnchor="middle"
        fontFamily="ui-sans-serif, system-ui, sans-serif"
        fontSize="11"
        fontWeight="800"
        letterSpacing="0.28em"
        fill="#ccff00"
      >
        HOOD
      </text>
    </svg>
  )
}
