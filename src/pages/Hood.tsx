import { useEffect, useState } from 'react'
import { HoodMark } from '../components/HoodMark'
import { TokenBoundPanel } from '../components/TokenBoundPanel'
import { VerifiedBadge } from '../components/VerifiedBadge'
import { EXPLORER_BASE, EXPLORER_TOKEN, EXPLORER_TX } from '../lib/chain'
import { HOOD_META, HOOD_TOKEN_DEPLOYED, HOOD_TOKEN_ADDRESS } from '../lib/hoodToken'
import { checkOnchainVerified, sourcifyUrl, type VerifyStatus } from '../lib/verify/onchainVerified'
import type { ViewId } from '../lib/nav'

type Props = { onNavigate: (id: ViewId, projectId?: string) => void }

const DEPLOY_TX = '0xe148725110ccf28f6411c90aac0de7b6cbe1708dc2c1e4d8dc9f8b305c97f26b'
const OWNER_MINTER = '0x2CCf1076A9DCA4d656A156d6036Cc2066c596AF5'
const SUPPLY = '1,000,000,000'
const CHAIN_ID = 4663
const CHAIN_NAME = 'Robinhood Chain'

// Uniswap official addresses on RH 4663
const UNISWAP_ADDRESSES = {
  UniversalRouter: '0x8876789976decbfcbbbe364623c63652db8c0904',
  UniswapV3Factory: '0x1f7d7550b1b028f7571e69a784071f0205fd2efa',
  QuoterV2: '0x33e885ed0ec9bf04ecfb19341582aadcb4c8a9e7',
  SwapRouter02: '0xcaf681a66d020601342297493863e78c959e5cb2',
  Permit2: '0x000000000022D473030F116dDEE9F6B43aC78BA3',
}

function shortAddr(addr: string): string {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`
}

function copyToClipboard(text: string, setCopied: (s: string) => void) {
  void navigator.clipboard.writeText(text)
  setCopied(text)
  window.setTimeout(() => setCopied(''), 2200)
}

function warpcastCastIntent(text: string): string {
  return `https://warpcast.com/~/compose?text=${encodeURIComponent(text)}`
}

function xPostIntent(text: string): string {
  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`
}

export function Hood({ onNavigate }: Props) {
  const [copied, setCopied] = useState('')
  const [verify, setVerify] = useState<VerifyStatus | null>(null)
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

  const shareText = HOOD_TOKEN_DEPLOYED
    ? `$HOOD is live on ${CHAIN_NAME} (${CHAIN_ID})\n\n${hoodAddr}\n\nDeployed · 1B supply · companion token for Hood Desk\n\nhttps://doghood.aibusiness.fun`
    : '$HOOD companion token for Hood Desk — coming soon to Robinhood Chain'

  const uniswapAddTokenUrl = HOOD_TOKEN_DEPLOYED
    ? `https://app.uniswap.org/swap?chain=robinhood&inputCurrency=ETH&outputCurrency=${hoodAddr}`
    : '#'

  const okuUrl = HOOD_TOKEN_DEPLOYED
    ? `https://oku.trade/token/${CHAIN_ID}:${hoodAddr}`
    : '#'

  return (
    <section className="page hood-page">
      <div className="page-intro">
        <div className="row-between">
          <div>
            <p className="eyebrow">Companion coin</p>
            <h1 className="hood-launch-title">
              <HoodMark size={56} variant="mark" />
              <span>
                Hold $HOOD · fund the desk
              </span>
            </h1>
            <p className="muted hood-launch-lead">
              Fair-launch companion ERC-20 for Hood Desk on {CHAIN_NAME}. Clean token — fees that keep
              the agent online live at the DEX / fee-router layer, not inside transfers.
            </p>
          </div>
        </div>
      </div>

      {!HOOD_TOKEN_DEPLOYED && (
        <div className="card hood-deploy-pending">
          <strong>Token not deployed yet</strong>
          <p className="muted">
            Set <code className="inline-code">VITE_HOOD_TOKEN</code> in .env after deploying the hood-token contract.
          </p>
        </div>
      )}

      {HOOD_TOKEN_DEPLOYED && (
        <>
          <div className="hood-attention-grid">
            {/* Main token card with copyable address */}
            <article className="card hood-attention-card">
              <div className="row-between">
                <div>
                  <p className="rail-label">Token address</p>
                  <h2 className="hood-attention-symbol">
                    ${HOOD_META.symbol}
                    <span className="hood-verification-status">
                      {verify?.verified ? (
                        <VerifiedBadge address={hoodAddr} size="md" />
                      ) : (
                        <span className="badge badge-warning">
                          {verify ? 'Not verified on explorer' : 'Checking verification…'}
                        </span>
                      )}
                    </span>
                  </h2>
                </div>
                <HoodMark size={48} variant="photo" />
              </div>
              <div className="hood-address-display">
                <code className="hood-address-mono">{hoodAddr}</code>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => copyToClipboard(hoodAddr, setCopied)}
                  title="Copy token address"
                >
                  {copied === hoodAddr ? '✓ Copied' : 'Copy'}
                </button>
              </div>
              <p className="tiny muted mt">
                Contract deployed on {CHAIN_NAME} (chain {CHAIN_ID}).
                {verify?.verified
                  ? ' Source matches on Sourcify (exact match). Blockscout still sits behind Cloudflare from this machine.'
                  : ' Source check runs against Blockscout, then Sourcify. The badge appears only after a real match.'}{' '}
                {hoodAddr ? (
                  <a href={sourcifyUrl(hoodAddr)} target="_blank" rel="noreferrer">
                    Sourcify
                  </a>
                ) : null}
              </p>
            </article>

            {/* Quick actions */}
            <article className="card hood-quick-actions">
              <p className="rail-label">Quick actions</p>
              <div className="hood-action-grid">
                <a
                  href={EXPLORER_TOKEN(hoodAddr)}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-primary btn-sm"
                >
                  View on Blockscout →
                </a>
                <a
                  href={uniswapAddTokenUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-ghost btn-sm"
                  title="View token on Uniswap (pool not confirmed)"
                >
                  Open on Uniswap →
                </a>
                <a
                  href={okuUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-ghost btn-sm"
                  title="View token on Oku (pool not confirmed)"
                >
                  Open on Oku →
                </a>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => onNavigate('trade')}
                >
                  Trade (demo) →
                </button>
              </div>
            </article>

            {/* Share card */}
            <article className="card hood-share-card">
              <p className="rail-label">Share $HOOD</p>
              <div className="hood-share-grid">
                <a
                  href={warpcastCastIntent(shareText)}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-primary btn-sm"
                >
                  Cast on Warpcast
                </a>
                <a
                  href={xPostIntent(shareText)}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-ghost btn-sm"
                >
                  Post on X
                </a>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => copyToClipboard(shareText, setCopied)}
                >
                  {copied === shareText ? '✓ Copied' : 'Copy share text'}
                </button>
              </div>
            </article>
          </div>

          {/* Token specs */}
          <article className="card hood-specs-card">
            <h2>Token specifications</h2>
            <div className="hood-specs-grid">
              <div className="hood-spec-item">
                <span className="rail-label">Name / Symbol</span>
                <span className="hood-spec-value">
                  {HOOD_META.name} / ${HOOD_META.symbol}
                </span>
              </div>
              <div className="hood-spec-item">
                <span className="rail-label">Total supply</span>
                <span className="hood-spec-value mono">{SUPPLY} HOOD (1B)</span>
              </div>
              <div className="hood-spec-item">
                <span className="rail-label">Decimals</span>
                <span className="hood-spec-value mono">18</span>
              </div>
              <div className="hood-spec-item">
                <span className="rail-label">Chain</span>
                <span className="hood-spec-value">{CHAIN_NAME} ({CHAIN_ID})</span>
              </div>
              <div className="hood-spec-item">
                <span className="rail-label">Owner / Minter</span>
                <div className="hood-spec-value">
                  <a
                    href={`${EXPLORER_BASE}/address/${OWNER_MINTER}`}
                    target="_blank"
                    rel="noreferrer"
                    className="mono"
                  >
                    {shortAddr(OWNER_MINTER)}
                  </a>
                </div>
              </div>
              <div className="hood-spec-item">
                <span className="rail-label">Deploy tx</span>
                <div className="hood-spec-value">
                  <a
                    href={EXPLORER_TX(DEPLOY_TX)}
                    target="_blank"
                    rel="noreferrer"
                    className="mono"
                  >
                    {shortAddr(DEPLOY_TX)}
                  </a>
                </div>
              </div>
              <div className="hood-spec-item">
                <span className="rail-label">Tax / Pause / Blacklist</span>
                <span className="hood-spec-value">None</span>
              </div>
              <div className="hood-spec-item">
                <span className="rail-label">Minting</span>
                <span className="hood-spec-value">Mint-once (fixed 1B supply)</span>
              </div>
            </div>
          </article>

          {/* Uniswap on RH 4663 */}
          <article className="card hood-dex-card">
            <h2>Uniswap on Robinhood Chain</h2>
            <p className="muted">
              Uniswap V3 is live on {CHAIN_NAME} at official contract addresses below. $HOOD pool status: <strong>not confirmed</strong> — no invented liquidity. If no pool exists, UI will link to Uniswap/Oku with the token address for honest discovery.
            </p>
            <ul className="hood-contract-list">
              {Object.entries(UNISWAP_ADDRESSES).map(([name, addr]) => (
                <li key={name}>
                  <span className="rail-label">{name}</span>
                  <a
                    href={`${EXPLORER_BASE}/address/${addr}`}
                    target="_blank"
                    rel="noreferrer"
                    className="mono hood-contract-link"
                  >
                    {addr}
                  </a>
                </li>
              ))}
            </ul>
          </article>
        </>
      )}

      <TokenBoundPanel initialCollection="dogihood" />

      <article className="card">
        <h2>How fees fund the desk</h2>
        <ol className="fee-steps">
          <li>
            <strong>DEX fee tier</strong> — swap volume on RH produces protocol / LP fees when a pool exists.
          </li>
          <li>
            <strong>Agent treasury</strong> — a share of fees routes to the Desk treasury (runway for RPC, hosting, future tooling).
          </li>
          <li>
            <strong>Agent stays online</strong> — ops continue without human operators. Holders stay aligned via ${HOOD_META.symbol}.
          </li>
        </ol>
        <p className="muted mt">
          Not baked into ERC-20 transfers. See <code className="inline-code">hood-token</code> LAUNCH.md.
        </p>
        <div className="cta-row mt">
          <button type="button" className="btn btn-primary" onClick={() => onNavigate('terminal')}>
            Ask Desk about $HOOD
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => onNavigate('community')}>
            HOOD Auto-Trade (SIM)
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => onNavigate('ops')}>
            Ops loop
          </button>
        </div>
      </article>
    </section>
  )
}
