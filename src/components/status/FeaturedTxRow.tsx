import {
  FEATURED_RH_TX,
  FEATURED_RH_TX_EXPLORER,
  FEATURED_RH_TX_LABEL,
  featuredStatusLabel,
  shortHash,
  useFeaturedTxStatus,
} from '../../lib/status/featured'

type Props = {
  compact?: boolean
  className?: string
}

export function FeaturedTxRow({ compact = false, className = '' }: Props) {
  const status = useFeaturedTxStatus()

  const label = featuredStatusLabel(status)
  const tone =
    status.kind === 'found' ? 'ok' : status.kind === 'checking' ? 'pending' : 'warn'

  return (
    <article className={`featured-tx-row featured-tx-${tone}${compact ? ' compact' : ''} ${className}`}>
      <div className="featured-tx-head">
        <span className="featured-tx-pip" aria-hidden />
        <div className="featured-tx-titles">
          <p className="featured-tx-label">{FEATURED_RH_TX_LABEL}</p>
          <p className="featured-tx-sub">Robinhood Chain · the transaction that created $HOOD</p>
        </div>
        <span className={`featured-tx-status featured-tx-status-${tone}`}>{label}</span>
      </div>
      <div className="featured-tx-body">
        <code className="featured-tx-hash mono" title={FEATURED_RH_TX}>
          {compact ? shortHash(FEATURED_RH_TX, 8, 6) : shortHash(FEATURED_RH_TX, 10, 8)}
        </code>
        {status.kind === 'not_found' ? (
          <span className="featured-tx-link muted">No chain record to open</span>
        ) : (
          <a
            className="featured-tx-link"
            href={FEATURED_RH_TX_EXPLORER}
            target="_blank"
            rel="noreferrer noopener"
          >
            Blockscout ↗
          </a>
        )}
      </div>
      {!compact && (
        <p className="featured-tx-note muted tiny">
          {status.kind === 'not_found'
            ? 'The link stays closed until the chain returns a receipt for this hash.'
            : 'Blockscout opens this receipt. It created the $HOOD contract.'}
        </p>
      )}
    </article>
  )
}
