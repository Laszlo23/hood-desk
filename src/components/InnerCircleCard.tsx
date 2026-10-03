import { useEffect, useState } from 'react'
import { useAccount } from 'wagmi'
import { DeskMint } from './DeskMint'
import { VerifiedBadge } from './VerifiedBadge'
import {
  INNER_CIRCLE,
  resolveInnerCircleHold,
  setManualInnerCircleHold,
  shortAddr,
  type InnerCircleHoldStatus,
} from '../lib/nfts/innerCircle'

type Props = {
  variant?: 'strip' | 'featured' | 'compact'
  className?: string
  showHolderToggle?: boolean
}

export function InnerCircleCard({
  variant = 'featured',
  className = '',
  showHolderToggle = true,
}: Props) {
  const { address } = useAccount()
  const [hold, setHold] = useState<InnerCircleHoldStatus | null>(null)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const next = await resolveInnerCircleHold(address)
      if (!cancelled) setHold(next)
    })()
    return () => {
      cancelled = true
    }
  }, [address])

  const refreshHold = () => {
    void resolveInnerCircleHold(address).then(setHold)
  }

  const onManual = (on: boolean) => {
    setManualInnerCircleHold(on)
    setHold((prev) => ({
      holding: on,
      balance: prev?.source === 'onchain' ? prev.balance : null,
      source: on ? 'manual' : 'none',
      contract: INNER_CIRCLE.contract,
    }))
  }

  const holding = hold?.holding === true
  const onchainHold = hold?.source === 'onchain' && holding

  if (!INNER_CIRCLE.contract) {
    return (
      <article className={`card inner-circle-card inner-circle-card-${variant} inner-circle-card-empty ${className}`.trim()}>
        <div className="inner-circle-art-wrap" aria-hidden={false}>
          <div className="inner-circle-art-empty">
            <div className="inner-circle-empty-icon">🦊</div>
            <div className="inner-circle-empty-circle"></div>
          </div>
        </div>

        <div className="inner-circle-body">
          <div className="inner-circle-title-row">
            <h3 className="inner-circle-title">{INNER_CIRCLE.name}</h3>
            <span className="badge badge-muted" title="Not deployed">
              Coming soon
            </span>
          </div>
          <p className="muted inner-circle-tagline">{INNER_CIRCLE.tagline}</p>
          {variant !== 'compact' && (
            <p className="tiny muted inner-circle-copy">
              Soulbound membership badge for Hood Desk Inner Circle. One per wallet.
            </p>
          )}

          <div className="inner-circle-meta">
            <span className="badge">RH {INNER_CIRCLE.chainId}</span>
            <span className="badge badge-muted">{INNER_CIRCLE.standard}</span>
            {INNER_CIRCLE.badges.map((b) => (
              <span key={b} className="badge badge-muted">
                {b}
              </span>
            ))}
          </div>

          <p className="tiny muted">The Inner Circle address is not set on this desk.</p>
        </div>
      </article>
    )
  }

  return (
    <article className={`card inner-circle-card inner-circle-card-${variant} ${className}`.trim()}>
      <div className="inner-circle-art-wrap" aria-hidden={false}>
        <svg
          className="inner-circle-art"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 400 400"
          width="400"
          height="400"
        >
          <rect width="400" height="400" fill="#000" />
          <circle cx="200" cy="180" r="80" fill="none" stroke="#CCFF00" strokeWidth="4" />
          <text x="200" y="120" fontFamily="monospace" fontSize="14" fill="#CCFF00" textAnchor="middle">
            HOOD DESK
          </text>
          <text x="200" y="195" fontFamily="monospace" fontSize="28" fontWeight="bold" fill="#CCFF00" textAnchor="middle">
            INNER
          </text>
          <text x="200" y="220" fontFamily="monospace" fontSize="28" fontWeight="bold" fill="#CCFF00" textAnchor="middle">
            CIRCLE
          </text>
          <text x="200" y="280" fontFamily="monospace" fontSize="12" fill="#888" textAnchor="middle">
            #0
          </text>
          <text x="200" y="300" fontFamily="monospace" fontSize="10" fill="#666" textAnchor="middle">
            SOULBOUND · RH 4663
          </text>
          <rect x="160" y="320" width="80" height="2" fill="#CCFF00" />
          <text x="200" y="345" fontFamily="monospace" fontSize="9" fill="#555" textAnchor="middle">
            Night Ledger
          </text>
        </svg>
        <span className="inner-circle-pack-badge">Soulbound</span>
      </div>

      <div className="inner-circle-body">
        <div className="inner-circle-title-row">
          <h3 className="inner-circle-title">
            {INNER_CIRCLE.name}
            {INNER_CIRCLE.contract ? <VerifiedBadge address={INNER_CIRCLE.contract} size="sm" /> : null}
          </h3>
          <span className="badge" title="Non-transferable">
            Soulbound
          </span>
        </div>
        <p className="muted inner-circle-tagline">{INNER_CIRCLE.tagline}</p>
        {variant !== 'compact' && (
          <p className="tiny muted inner-circle-copy">
            One badge per wallet. The desk wallet mints it, and it stays in that wallet.
          </p>
        )}

        <div className="inner-circle-meta">
          <span className="badge">RH {INNER_CIRCLE.chainId}</span>
          <span className="badge">{INNER_CIRCLE.standard}</span>
          <span className="badge badge-muted">{INNER_CIRCLE.symbol}</span>
          {holding ? (
            <span className="badge inner-circle-holder-badge" title={onchainHold ? 'balanceOf > 0' : 'Manual toggle'}>
              Member
            </span>
          ) : null}
        </div>

        {INNER_CIRCLE.contract ? (
          <p className="tiny muted mono">
            {shortAddr(INNER_CIRCLE.contract)}
            {hold?.source === 'onchain' && hold.balance !== null ? (
              <> · balance {hold.balance.toString()}</>
            ) : null}
          </p>
        ) : null}

        {INNER_CIRCLE.contract ? (
          <DeskMint contract={INNER_CIRCLE.contract} kind="inner" onMinted={refreshHold} />
        ) : null}

        <div className="cta-row inner-circle-actions">
          {INNER_CIRCLE.explorerUrl ? (
            <a
              className="btn btn-ghost btn-sm"
              href={INNER_CIRCLE.explorerUrl}
              target="_blank"
              rel="noreferrer noopener"
            >
              Explorer
            </a>
          ) : null}
        </div>

        {showHolderToggle && hold?.source !== 'onchain' ? (
          <label className="inner-circle-manual-hold">
            <input
              type="checkbox"
              checked={getManualChecked(hold)}
              onChange={(e) => onManual(e.target.checked)}
            />
            <span className="tiny">I hold Inner Circle (manual — used when RPC balance unavailable)</span>
          </label>
        ) : null}
      </div>
    </article>
  )
}

function getManualChecked(hold: InnerCircleHoldStatus | null): boolean {
  if (!hold) return false
  if (hold.source === 'manual') return hold.holding
  return false
}

/** Tiny holder badge for sidebars / Skill Market. */
export function InnerCircleHolderBadge({ className = '' }: { className?: string }) {
  const { address } = useAccount()
  const [hold, setHold] = useState<InnerCircleHoldStatus | null>(null)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const next = await resolveInnerCircleHold(address)
      if (!cancelled) setHold(next)
    })()
    const onStorage = () => {
      void resolveInnerCircleHold(address).then((n) => {
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
      className={`inner-circle-holder-badge badge ${className}`.trim()}
      title={hold.source === 'onchain' ? 'On-chain Inner Circle balanceOf > 0' : 'Manual Inner Circle hold'}
    >
      Inner Circle
    </span>
  )
}
