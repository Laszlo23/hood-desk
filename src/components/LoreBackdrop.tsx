type Variant = 'forest' | 'council' | 'mist'

type Props = {
  variant?: Variant
  className?: string
}

const SRC: Record<Variant, string> = {
  forest: '/lore/hood-forest.webp',
  council: '/lore/hood-council.webp',
  mist: '/lore/hood-forest.webp',
}

/**
 * Soft mystic lore layer — low opacity, vignette, does not kill card readability.
 * Atmosphere only; DogiHood NFT + HOOD agent mark stay primary brand.
 */
export function LoreBackdrop({ variant = 'forest', className = '' }: Props) {
  return (
    <div
      className={`lore-backdrop lore-backdrop-${variant}${className ? ` ${className}` : ''}`}
      aria-hidden
    >
      <div
        className="lore-backdrop-img"
        style={{ backgroundImage: `url(${SRC[variant]})` }}
      />
      <div className="lore-backdrop-mist" />
      <div className="lore-backdrop-vignette" />
    </div>
  )
}
