import { useEffect, useState } from 'react'
import {
  FEATURED_RH_TX,
  FEATURED_RH_TX_EXPLORER,
  FEATURED_RH_TX_LABEL,
  FEATURED_RH_TX_SEED_NOT_FOUND,
  featuredStatusLabel,
  probeFeaturedTx,
  shortHash,
  type FeaturedTxRpcStatus,
} from '../../lib/status/featured'

type Props = {
  compact?: boolean
  className?: string
}

export function FeaturedTxRow({ compact = false, className = '' }: Props) {
  const [status, setStatus] = useState<FeaturedTxRpcStatus>(() =>
    FEATURED_RH_TX_SEED_NOT_FOUND ? { kind: 'not_found' } : { kind: 'checking' },
  )

  useEffect(() => {
    const ac = new AbortController()
    void (async () => {
      const next = await probeFeaturedTx(FEATURED_RH_TX, ac.signal)
      if (!ac.signal.aborted) setStatus(next)
    })()
    return () => ac.abort()
  }, [])

  const label = featuredStatusLabel(status)
  const tone =
    status.kind === 'found' ? 'ok' : status.kind === 'checking' ? 'pending' : 'warn'

  return (
    <article className={`featured-tx-row featured-tx-${tone}${compact ? ' compact' : ''} ${className}`}>
      <div className="featured-tx-head">
        <span className="featured-tx-pip" aria-hidden />
        <div className="featured-tx-titles">
          <p className="featured-tx-label">{FEATURED_RH_TX_LABEL}</p>
          <p className="featured-tx-sub">Not a private key · RH 4663 watch only</p>
        </div>
        <span className={`featured-tx-status featured-tx-status-${tone}`}>{label}</span>
      </div>
      <div className="featured-tx-body">
        <code className="featured-tx-hash mono" title={FEATURED_RH_TX}>
          {compact ? shortHash(FEATURED_RH_TX, 8, 6) : shortHash(FEATURED_RH_TX, 10, 8)}
        </code>
        <a
          className="featured-tx-link"
          href={FEATURED_RH_TX_EXPLORER}
          target="_blank"
          rel="noreferrer noopener"
        >
          Check Blockscout ↗
        </a>
      </div>
      {!compact && (
        <p className="featured-tx-note muted tiny">
          Explorer reports this hash is not a Robinhood Chain transaction. Shown for desk status
          only — never treated as a signed success or a key.
        </p>
      )}
    </article>
  )
}
