import { useEffect, useState } from 'react'
import { HoodMark } from '../components/HoodMark'
import { SeedRailCard } from '../components/SeedRailCard'
import { VerifiedBadge } from '../components/VerifiedBadge'
import { HOOD_META, HOOD_TOKEN_ADDRESS, HOOD_TOKEN_DEPLOYED } from '../lib/hoodToken'
import { readHoodLaunch, uniswapPoolUrl, type HoodLaunchFacts } from '../lib/trade/uniswap'
import { checkOnchainVerified, type VerifyStatus } from '../lib/verify/onchainVerified'
import type { ViewId } from '../lib/nav'

type Props = { onNavigate: (id: ViewId, projectId?: string) => void }

const SUPPLY = '1,000,000,000'

function copyToClipboard(text: string, setCopied: (s: string) => void) {
  void navigator.clipboard.writeText(text)
  setCopied(text)
  window.setTimeout(() => setCopied(''), 2200)
}

export function Hood({ onNavigate }: Props) {
  const [copied, setCopied] = useState('')
  const [verify, setVerify] = useState<VerifyStatus | null>(null)
  const [launch, setLaunch] = useState<HoodLaunchFacts | null>(null)
  const hoodAddr = HOOD_TOKEN_ADDRESS || ''

  useEffect(() => {
    if (!hoodAddr) return
    let cancelled = false
    void checkOnchainVerified(hoodAddr).then((next) => {
      if (!cancelled) setVerify(next)
    })
    return () => {
      cancelled = true
    }
  }, [hoodAddr])

  useEffect(() => {
    let cancelled = false
    void readHoodLaunch().then((facts) => {
      if (!cancelled) setLaunch(facts)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const poolEth = launch
    ? Number(launch.poolWeth).toLocaleString('en-US', {
        minimumFractionDigits: 6,
        maximumFractionDigits: 6,
      })
    : '…'
  const poolHood = launch
    ? Number(launch.poolHood).toLocaleString('en-US', { maximumFractionDigits: 0 })
    : '…'

  return (
    <section className="page hood-rite">
      <p className="hood-rite-kicker">The green hood</p>
      <div className="hood-rite-title">
        <HoodMark size={72} variant="logo" alt="Hood Desk" />
        <h1>${HOOD_META.symbol}</h1>
        {verify?.verified ? <VerifiedBadge address={hoodAddr} size="md" /> : null}
      </div>
      <p className="hood-rite-lede">
        Minted once. 1,000,000,000 $HOOD. One Uniswap pool, and 2% of each seed goes to the cause.
      </p>

      {HOOD_TOKEN_DEPLOYED && hoodAddr ? (
        <div className="hood-rite-address">
          <code>{hoodAddr}</code>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => copyToClipboard(hoodAddr, setCopied)}>
            {copied === hoodAddr ? 'Kept' : 'Copy'}
          </button>
        </div>
      ) : (
        <p className="muted">The coin is still in the dark.</p>
      )}

      <div className="hood-rite-figures">
        <article>
          <span>The purse</span>
          <strong>{SUPPLY}</strong>
          <em>Minted once</em>
        </article>
        <article>
          <span>The pool</span>
          <strong>{poolEth} ETH</strong>
          <em>{poolHood} HOOD beside it</em>
        </article>
        <article>
          <span>The cause</span>
          <strong>2%</strong>
          <em>of every seed</em>
        </article>
      </div>

      <div className="hood-rite-actions">
        <button type="button" className="btn btn-primary" onClick={() => onNavigate('trade')}>
          Trade
        </button>
        <a className="btn btn-ghost" href={uniswapPoolUrl()} target="_blank" rel="noreferrer">
          The pool
        </a>
      </div>

      <SeedRailCard />
    </section>
  )
}
