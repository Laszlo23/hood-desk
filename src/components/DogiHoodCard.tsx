import { useEffect, useState } from 'react'
import { useAccount } from 'wagmi'
import { VerifiedBadge } from './VerifiedBadge'
import {
  DOGIHOOD,
  dogiHoodItemUrl,
  resolveDogiHoodHold,
  setManualDogiHoodHold,
  shortAddr,
  type DogiHoodHoldStatus,
} from '../lib/nfts/dogihood'

type Props = {
  /** Compact strip vs fuller featured card */
  variant?: 'strip' | 'featured' | 'compact'
  className?: string
  showHolderToggle?: boolean
  onOpenNfts?: () => void
}

export function DogiHoodCard({
  variant = 'featured',
  className = '',
  showHolderToggle = true,
  onOpenNfts,
}: Props) {
  const { address } = useAccount()
  const [imgSrc, setImgSrc] = useState(DOGIHOOD.sampleImage)
  const [hold, setHold] = useState<DogiHoodHoldStatus | null>(null)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const next = await resolveDogiHoodHold(address)
      if (!cancelled) setHold(next)
    })()
    return () => {
      cancelled = true
    }
  }, [address])

  const onManual = (on: boolean) => {
    setManualDogiHoodHold(on)
    setHold((prev) => ({
      holding: on,
      balance: prev?.source === 'onchain' ? prev.balance : null,
      source: on ? 'manual' : 'none',
      contract: DOGIHOOD.contract,
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
          alt={`${DOGIHOOD.name} #${DOGIHOOD.sampleTokenId}`}
          loading="lazy"
          onError={() => {
            setImgSrc((cur) => {
              if (cur === DOGIHOOD.sampleImage) return DOGIHOOD.localImage
              if (cur === DOGIHOOD.localImage) return DOGIHOOD.placeholderImage
              return DOGIHOOD.placeholderImage
            })
          }}
        />
        <span className="dogihood-pack-badge">Pack pride</span>
      </div>

      <div className="dogihood-body">
        <div className="dogihood-title-row">
          <h3 className="dogihood-title">
            {DOGIHOOD.name}
            {DOGIHOOD.contract ? <VerifiedBadge address={DOGIHOOD.contract} size="sm" /> : null}
          </h3>
          <span className="dogihood-flow-badge" title="Pack / pride label">
            Dogiflow+
          </span>
        </div>
        <p className="muted dogihood-tagline">{DOGIHOOD.tagline}</p>
        {variant !== 'compact' && (
          <p className="tiny muted dogihood-copy">
            Featured NFT pride on Hood Desk — HOOD fox stays the logo; DogiHood is the pack on-chain.
          </p>
        )}

        <div className="dogihood-meta">
          <span className="badge">RH {DOGIHOOD.chainId}</span>
          <span className="badge">{DOGIHOOD.standard}</span>
          <span className="badge badge-muted">{DOGIHOOD.symbol}</span>
          {holding ? (
            <span className="badge dogihood-holder-badge" title={onchainHold ? 'balanceOf > 0' : 'Manual toggle'}>
              DogiHood holder
            </span>
          ) : null}
        </div>

        {DOGIHOOD.contract ? (
          <p className="tiny muted mono">
            {shortAddr(DOGIHOOD.contract)}
            {hold?.source === 'onchain' && hold.balance !== null ? (
              <> · balance {hold.balance.toString()}</>
            ) : null}
          </p>
        ) : (
          <p className="tiny muted">Set VITE_DOGIHOOD_NFT for on-chain holder checks.</p>
        )}

        <div className="cta-row dogihood-actions">
          <a
            className="btn btn-primary btn-sm"
            href={DOGIHOOD.openseaUrl}
            target="_blank"
            rel="noreferrer noopener"
          >
            OpenSea →
          </a>
          <a
            className="btn btn-ghost btn-sm"
            href={DOGIHOOD.siteUrl}
            target="_blank"
            rel="noreferrer noopener"
          >
            Site →
          </a>
          <a
            className="btn btn-ghost btn-sm"
            href={dogiHoodItemUrl()}
            target="_blank"
            rel="noreferrer noopener"
          >
            Sample #{DOGIHOOD.sampleTokenId}
          </a>
          {DOGIHOOD.explorerUrl ? (
            <a
              className="btn btn-ghost btn-sm"
              href={DOGIHOOD.explorerUrl}
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
            <span className="tiny">I hold DogiHood (manual — used when RPC balance unavailable)</span>
          </label>
        ) : null}
      </div>
    </article>
  )
}

function getManualChecked(hold: DogiHoodHoldStatus | null): boolean {
  if (!hold) return false
  if (hold.source === 'manual') return hold.holding
  return false
}

/** Tiny holder perk stub for sidebars / Skill Market. */
export function DogiHoodHolderBadge({ className = '' }: { className?: string }) {
  const { address } = useAccount()
  const [hold, setHold] = useState<DogiHoodHoldStatus | null>(null)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const next = await resolveDogiHoodHold(address)
      if (!cancelled) setHold(next)
    })()
    const onStorage = () => {
      void resolveDogiHoodHold(address).then((n) => {
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
      className={`dogihood-holder-badge badge ${className}`.trim()}
      title={hold.source === 'onchain' ? 'On-chain DogiHood balanceOf > 0' : 'Manual DogiHood hold'}
    >
      DogiHood holder
    </span>
  )
}
