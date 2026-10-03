type Props = {
  size?: number
  className?: string
  alt?: string
  /** decorative = aria-hidden; otherwise meaningful seal */
  decorative?: boolean
}

/** Mystic hooded seal — lore accent only; does not replace HOOD agent brand mark. */
export function HoodSeal({
  size = 48,
  className = '',
  alt = 'Night Ledger seal',
  decorative,
}: Props) {
  return (
    <img
      src="/lore/hood-seal.webp"
      width={size}
      height={size}
      alt={decorative ? '' : alt}
      aria-hidden={decorative || undefined}
      loading="lazy"
      decoding="async"
      draggable={false}
      className={`hood-seal${className ? ` ${className}` : ''}`}
      style={{ width: size, height: size }}
    />
  )
}
