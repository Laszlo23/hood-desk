import { useEffect, useState } from 'react'
import { useAccount } from 'wagmi'
import { VerifiedBadge } from './VerifiedBadge'
import {
  HOOD_SEEDER,
  hoodSeederItemUrl,
  resolveHoodSeederHold,
  setManualHoodSeederHold,
  shortAddr,
  type HoodSeederHoldStatus,
} from '../lib/nfts/hoodseeder'

type Props = {
  variant?: 'strip' | 'featured' | 'compact'
  className?: string
  showHolderToggle?: boolean
  onOpenNfts?: () => void
}

export function HoodSeederCard({
  variant = 'featured',
  className = '',
  showHolderToggle = true,
  onOpenNfts,
}: Props) {
  const { address } = useAccount()
  const [imgSrc, setImgSrc] = useState(HOOD_SEEDER.sampleImage)
  const [hold, setHold] = useState<HoodSeederHoldStatus | null>(null)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const next = await resolveHoodSeederHold(address)
      if (!cancelled) setHold(next)
    })()
    return () => {
      cancelled = true
    }
  }, [address])

  const onManual = (on: boolean) => {
    setManualHoodSeederHold(on)
    setHold((prev) => ({
      holding: on,
      balance: prev?.source === 'onchain' ? prev.balance : null,
      source: on ? 'manual' : 'none',
      contract: HOOD_SEEDER.contract,
    }))
  }

  const holding = hold?.holding === true
  const onchainHold = hold?.source === 'onchain' && holding

  return (
    <article className={`dogihood-card dogihood-card-${variant} ${className}`.trim()}>
      <div className="dogihood-art-wrap" aria-hidden={false}>
        <img
          className="dogihood-art"
          src={imgSrc}
          alt={`${HOOD_SEEDER.name} #${HOOD_SEEDER.sampleTokenId}`}
          loading="lazy"
          onError={() => {
            setImgSrc((cur) => {
              if (cur === HOOD_SEEDER.sampleImage) return HOOD_SEEDER.placeholderImage
              return HOOD_SEEDER.placeholderImage
            })
          }}
        />
        <span className="dogihood-pack-badge" style={{ background: '#1a4d2e' }}>
          Seeder Pass
        </span>
      </div>

      <div className="dogihood-body">
        <div className="dogihood-title-row">
          <h3 className="dogihood-title">
            {HOOD_SEEDER.name}
            {HOOD_SEEDER.contract ? <VerifiedBadge address={HOOD_SEEDER.contract} size="sm" /> : null}
          </h3>
          <span 
            className="dogihood-flow-badge" 
            style={{ background: '#CCFF00', color: '#1a4d2e' }}
            title="Early supporter pass"
          >
            Seeder+
          </span>
        </div>
        <p className="muted dogihood-tagline">{HOOD_SEEDER.tagline}</p>
        {variant !== 'compact' && (
          <p className="tiny muted dogihood-copy">
            Hood Seeder Pass — early supporters who help seed $HOOD liquidity. Robin Hood / forest / fox themed.
          </p>
        )}

        <div className="dogihood-meta">
          <span className="badge">RH {HOOD_SEEDER.chainId}</span>
          <span className="badge">{HOOD_SEEDER.standard}</span>
          <span className="badge badge-muted">{HOOD_SEEDER.symbol}</span>
          <span className="badge badge-muted">Max {HOOD_SEEDER.maxSupply}</span>
          {holding ? (
            <span 
              className="badge dogihood-holder-badge" 
              style={{ background: '#CCFF00', color: '#1a4d2e' }}
              title={onchainHold ? 'balanceOf > 0' : 'Manual toggle'}
            >
              Hood Seeder holder
            </span>
          ) : null}
        </div>

        {HOOD_SEEDER.contract ? (
          <p className="tiny muted mono">
            {shortAddr(HOOD_SEEDER.contract)}
            {hold?.source === 'onchain' && hold.balance !== null ? (
              <> · balance {hold.balance.toString()}</>
            ) : null}
          </p>
        ) : (
          <p className="tiny muted">Set VITE_HOOD_SEEDER_NFT for on-chain holder checks.</p>
        )}

        <div className="cta-row dogihood-actions">
          {HOOD_SEEDER.contract ? (
            <a
              className="btn btn-primary btn-sm"
              href={hoodSeederItemUrl()}
              target="_blank"
              rel="noreferrer noopener"
            >
              View #{HOOD_SEEDER.sampleTokenId}
            </a>
          ) : (
            <button type="button" className="btn btn-primary btn-sm" disabled>
              Not deployed
            </button>
          )}
          {HOOD_SEEDER.explorerUrl ? (
            <a
              className="btn btn-ghost btn-sm"
              href={HOOD_SEEDER.explorerUrl}
              target="_blank"
              rel="noreferrer noopener"
            >
              Explorer
            </a>
          ) : null}
          {onOpenNfts ? (
            <button type="button" className="btn btn-ghost btn-sm" onClick={onOpenNfts}>
              Collections →
            </button>
          ) : null}
        </div>

        {showHolderToggle && hold?.source !== 'onchain' ? (
          <label className="dogihood-manual-hold">
            <input
              type="checkbox"
              checked={getManualChecked(hold)}
              onChange={(e) => onManual(e.target.checked)}
            />
            <span className="tiny">I hold Hood Seeder (manual — used when RPC balance unavailable)</span>
          </label>
        ) : null}
      </div>
    </article>
  )
}

function getManualChecked(hold: HoodSeederHoldStatus | null): boolean {
  if (!hold) return false
  if (hold.source === 'manual') return hold.holding
  return false
}

export function HoodSeederHolderBadge({ className = '' }: { className?: string }) {
  const { address } = useAccount()
  const [hold, setHold] = useState<HoodSeederHoldStatus | null>(null)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const next = await resolveHoodSeederHold(address)
      if (!cancelled) setHold(next)
    })()
    const onStorage = () => {
      void resolveHoodSeederHold(address).then((n) => {
        if (!cancelled) setHold(n)
      })
    }
    window.addEventListener('storage', onStorage)
    return () => {
      cancelled = true
      window.removeEventListener('storage', onStorage)
    }
  }, [address])

  if (!hold?.holding) return null

  return (
    <span
      className={`badge ${className}`.trim()}
      style={{ background: '#CCFF00', color: '#1a4d2e' }}
      title={hold.source === 'onchain' ? 'On-chain Hood Seeder balanceOf > 0' : 'Manual Hood Seeder hold'}
    >
      Hood Seeder holder
    </span>
  )
}
