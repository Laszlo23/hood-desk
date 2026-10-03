import { HoodLogo } from './HoodLogo'

type Props = {
  size?: number
  /** mark = icon only; logo = square with HOOD; avatar = circular chat; photo = raster mascot */
  variant?: 'mark' | 'logo' | 'avatar' | 'photo'
  className?: string
  bounce?: boolean
  alt?: string
}

const SRC: Record<NonNullable<Props['variant']>, string> = {
  mark: '/brand/hood-mark.svg',
  logo: '/brand/hood-logo.svg',
  avatar: '/brand/hood-avatar.svg',
  photo: '/brand/hood-agent.webp',
}

/** HOOD agent brand mark — hooded trader-AI, neon visor + circuit collar. */
export function HoodMark({
  size = 36,
  variant = 'mark',
  className = '',
  bounce,
  alt = 'HOOD agent',
}: Props) {
  if (variant === 'logo') {
    return <HoodLogo size={size} className={className} alt={alt} />
  }

  return (
    <img
      src={SRC[variant]}
      width={size}
      height={size}
      alt={alt}
      draggable={false}
      className={`hood-mark${bounce ? ' bounce' : ''}${className ? ` ${className}` : ''}`}
      style={{ width: size, height: size }}
    />
  )
}
