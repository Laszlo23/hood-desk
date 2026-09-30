import { useEffect, useState } from 'react'
import {
  checkOnchainVerified,
  getCachedVerified,
  markVerifiedDemo,
  type VerifyStatus,
} from '../lib/verify/onchainVerified'

type Props = {
  address?: string | null
  /** Show "Mark verified (demo)" control */
  allowDemoMark?: boolean
  className?: string
  size?: 'sm' | 'md'
}

/**
 * Green checkmark next to token symbol when contract is verified on-chain.
 * Only renders when verified === true — never fake-verifies unknowns.
 */
export function VerifiedBadge({ address, allowDemoMark = false, className = '', size = 'sm' }: Props) {
  const [status, setStatus] = useState<VerifyStatus | null>(() =>
    address ? getCachedVerified(address) : null,
  )
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!address) {
      setStatus(null)
      return
    }
    const cached = getCachedVerified(address)
    setStatus(cached)
    let cancelled = false
    void (async () => {
      const next = await checkOnchainVerified(address)
      if (!cancelled) setStatus(next)
    })()
    return () => {
      cancelled = true
    }
  }, [address])

  if (!address) return null

  const verified = status?.verified === true

  const markDemo = () => {
    setBusy(true)
    const next = markVerifiedDemo(address, true)
    setStatus(next)
    setBusy(false)
  }

  if (!verified) {
    if (!allowDemoMark) return null
    return (
      <button
        type="button"
        className={`verified-demo-btn ${className}`}
        onClick={markDemo}
        disabled={busy}
        title="Local demo only — does not verify on explorer"
      >
        Mark verified (demo)
      </button>
    )
  }

  return (
    <span
      className={`verified-badge verified-badge-${size} ${className}`}
      title="Contract verified on-chain"
      role="img"
      aria-label="Contract verified on-chain"
    >
      <svg viewBox="0 0 16 16" width={size === 'md' ? 16 : 13} height={size === 'md' ? 16 : 13} aria-hidden>
        <circle cx="8" cy="8" r="7.25" fill="#22c55e" stroke="#CCFF00" strokeWidth="1.25" />
        <path
          d="M4.6 8.2l2.1 2.1 4.5-4.6"
          fill="none"
          stroke="#0a0a0a"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  )
}

/** Inline symbol + optional green check. */
export function TokenSymbolWithVerified({
  symbol,
  address,
  allowDemoMark,
}: {
  symbol: string
  address?: string | null
  allowDemoMark?: boolean
}) {
  return (
    <span className="token-symbol-verified">
      <span>{symbol}</span>
      <VerifiedBadge address={address} allowDemoMark={allowDemoMark} />
    </span>
  )
}
