import { useEffect, useMemo, useState } from 'react'
import { FeaturedTxRow } from '../components/status/FeaturedTxRow'
import { buildLocalActivityFeed } from '../lib/status/activity'
import type { ViewId } from '../lib/nav'
import { getGamification } from '../lib/gamification'
import { listOrders } from '../lib/trade/orders'
import { collectTradeTokens, formatUsdCompact, formatPrice } from '../lib/trade/demoTokens'
import { skillCount } from '../lib/agent/skills'
import { listProjects } from '../lib/projects'
import { listSkillPacks } from '../lib/market/skillMarket'
import { DOGIHOOD_NFT_ADDRESS } from '../lib/nfts/dogihood'
import { shortHash } from '../lib/status/featured'
import { DeskStory } from '../components/DeskStory'
import { HoodSeal } from '../components/HoodSeal'
import { HOOD_TOKEN_ADDRESS, HOOD_TOKEN_DEPLOYED } from '../lib/hoodToken'
import { EXPLORER_TX } from '../lib/chain'
import { loadHoodLedger, type HoodSwapRow } from '../lib/trade/poolCandles'

type Props = { onNavigate: (id: ViewId, projectId?: string) => void }
type RankTab = 'top' | 'trending' | 'tokens'

const DEPLOY_TX = '0xe148725110ccf28f6411c90aac0de7b6cbe1708dc2c1e4d8dc9f8b305c97f26b'

function relTime(iso: string): string {
  try {
    const t = new Date(iso).getTime()
    if (Number.isNaN(t)) return ''
    const diff = Date.now() - t
    if (diff < 60_000) return 'just now'
    if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m`
    if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h`
    return `${Math.floor(diff / 86_400_000)}d`
  } catch {
    return ''
  }
}

export function Status({ onNavigate }: Props) {
  const feed = useMemo(() => buildLocalActivityFeed(28), [])
  const g = useMemo(() => getGamification(), [])
  const orders = useMemo(() => listOrders(), [])
  const orderCount = orders.length
  const projects = useMemo(() => listProjects(), [])
  const packs = useMemo(() => listSkillPacks(), [])
  const [rankTab, setRankTab] = useState<RankTab>('top')
  const [poolSwaps, setPoolSwaps] = useState<HoodSwapRow[]>([])

  useEffect(() => {
    let live = true
    loadHoodLedger()
      .then((swaps) => {
        if (live) setPoolSwaps(swaps.slice(0, 8))
      })
      .catch(() => {
        if (live) setPoolSwaps([])
      })
    return () => {
      live = false
    }
  }, [])

  const featuredProjects = useMemo(() => {
    const withToken = projects.filter((p) => p.fairLaunch?.tokenAddress || p.ticker)
    const pool = withToken.length ? withToken : projects
    return pool.slice(0, 4)
  }, [projects])

  const rankedPacks = useMemo(() => {
    const copy = [...packs]
    if (rankTab === 'trending') {
      return copy
        .sort((a, b) => {
          const fa = a.featured ? 1 : 0
          const fb = b.featured ? 1 : 0
          if (fb !== fa) return fb - fa
          return b.createdAt < a.createdAt ? -1 : 1
        })
        .slice(0, 8)
    }
    return copy
      .sort((a, b) => {
        if (b.followerCount !== a.followerCount) return b.followerCount - a.followerCount
        return b.rating - a.rating
      })
      .slice(0, 8)
  }, [packs, rankTab])

  const rankedOrders = useMemo(() => {
    return orders.slice(0, 8).map((o, i) => ({
      rank: i + 1,
      symbol: o.tokenSymbol,
      side: o.side,
      amount: o.amount,
      status: o.status,
      at: o.createdAt,
      id: o.id,
    }))
  }, [orders])

  const rankedTokens = useMemo(() => {
    const copy = collectTradeTokens().filter((token) => !token.isDemo)
    if (rankTab === 'trending') {
      return copy.sort((a, b) => Math.abs(b.change24h) - Math.abs(a.change24h))
    }
    return copy.sort((a, b) => b.volume24h - a.volume24h)
  }, [rankTab])

  return (
    <section className="page status-page lore-shell-page">
      <header className="status-page-hero card">
        <div className="status-page-hero-top">
          <div>
            <DeskStory
              line="The desk stays up so the street can read the books."
              onLegend={() => onNavigate('lore')}
            />
            <p className="eyebrow">Robinhood Chain</p>
            <h1 className="hero-title status-title">Status</h1>
            <p className="muted status-lead">
              Whether the desk is up, how many projects are saved here, and where $HOOD lives.
              Swap volume is on the ledger, not on this page.
            </p>
          </div>
          <div className="status-kpis">
            <div className="status-kpi">
              <span className="status-kpi-label">Desk</span>
              <strong className="status-kpi-value">
                <span className="status-strip-dot" aria-hidden />
                online
              </strong>
            </div>
            <div className="status-kpi">
              <span className="status-kpi-label">Chain</span>
              <strong className="status-kpi-value">RH 4663</strong>
            </div>
            <div className="status-kpi">
              <span className="status-kpi-label">XP</span>
              <strong className="status-kpi-value">
                {g.xp} · L{g.level}
              </strong>
            </div>
            <div className="status-kpi">
              <span className="status-kpi-label">Signed here</span>
              <strong className="status-kpi-value">{orderCount}</strong>
            </div>
            <div className="status-kpi">
              <span className="status-kpi-label">Projects</span>
              <strong className="status-kpi-value">{projects.length}</strong>
            </div>
            <div className="status-kpi">
              <span className="status-kpi-label">Skills</span>
              <strong className="status-kpi-value">{skillCount()}</strong>
            </div>
            <div className="status-kpi">
              <span className="status-kpi-label">DogiHood</span>
              <strong className="status-kpi-value mono">
                {DOGIHOOD_NFT_ADDRESS ? shortHash(DOGIHOOD_NFT_ADDRESS, 3, 3) : '—'}
              </strong>
            </div>
            {HOOD_TOKEN_DEPLOYED && HOOD_TOKEN_ADDRESS && (
              <div className="status-kpi">
                <span className="status-kpi-label">$HOOD</span>
                <a
                  href={EXPLORER_TX(DEPLOY_TX)}
                  target="_blank"
                  rel="noreferrer"
                  className="status-kpi-value mono"
                  title="View deploy tx"
                >
                  {shortHash(HOOD_TOKEN_ADDRESS, 4, 3)}
                </a>
              </div>
            )}
          </div>
        </div>
        <div className="cta-row">
          <button type="button" className="btn btn-primary btn-sm" onClick={() => onNavigate('community')}>
            Pool
          </button>
          <button type="button" className="btn btn-primary btn-sm" onClick={() => onNavigate('trade')}>
            Trade
          </button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => onNavigate('rewards')}>
            Ledger
          </button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => onNavigate('hood')}>
            $HOOD
          </button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => onNavigate('nfts')}>
            Marks
          </button>
        </div>
      </header>

      <FeaturedTxRow />

      <div className="status-featured-grid">
        <p className="rail-label status-section-label">Featured · projects & pack</p>
        <div className="status-featured-cards">
          <button
            type="button"
            className="status-feature-card card"
            onClick={() => onNavigate('nfts')}
          >
            <span className="status-feature-tag">Pack</span>
            <strong>DogiHood</strong>
            <span className="muted tiny">Featured NFT · RH 4663</span>
          </button>
          <button
            type="button"
            className="status-feature-card card"
            onClick={() => onNavigate('hood')}
          >
            <span className="status-feature-tag">Token</span>
            <strong>$HOOD</strong>
            <span className="muted tiny">Flagship companion · fair launch</span>
          </button>
          <button
            type="button"
            className="status-feature-card card status-feature-hood"
            onClick={() => onNavigate('community')}
          >
            <span className="status-feature-tag">Agent</span>
            <strong>The pool</strong>
            <span className="muted tiny">$HOOD/WETH · you sign the swap</span>
          </button>
          {featuredProjects.map((p) => (
            <button
              key={p.id}
              type="button"
              className="status-feature-card card"
              onClick={() => onNavigate('project', p.id)}
            >
              <span className="status-feature-tag">Project</span>
              <strong>
                {p.avatarEmoji ? `${p.avatarEmoji} ` : ''}
                {p.name}
              </strong>
              <span className="muted tiny">
                {p.ticker ? `$${p.ticker}` : 'no ticker'} · {p.fairLaunch?.status ?? 'draft'}
              </span>
            </button>
          ))}
          {featuredProjects.length === 0 && (
            <button
              type="button"
              className="status-feature-card card"
              onClick={() => onNavigate('create')}
            >
              <span className="status-feature-tag">Create</span>
              <strong>Launch a project</strong>
              <span className="muted tiny">Local desk · fair launch wizard</span>
            </button>
          )}
        </div>
      </div>

      <div className="status-rank card">
        <div className="status-rank-head">
          <p className="rail-label">Skill lists · this browser</p>
          <div className="status-rank-tabs" role="tablist" aria-label="Rank mode">
            <button
              type="button"
              role="tab"
              aria-selected={rankTab === 'top'}
              className={`status-rank-tab${rankTab === 'top' ? ' active' : ''}`}
              onClick={() => setRankTab('top')}
            >
              Top
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={rankTab === 'trending'}
              className={`status-rank-tab${rankTab === 'trending' ? ' active' : ''}`}
              onClick={() => setRankTab('trending')}
            >
              Trending
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={rankTab === 'tokens'}
              className={`status-rank-tab${rankTab === 'tokens' ? ' active' : ''}`}
              onClick={() => setRankTab('tokens')}
            >
              Tokens
            </button>
          </div>
        </div>
        {rankTab === 'tokens' ? (
          <div className="status-rank-table-wrap">
            <table className="status-rank-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Token</th>
                  <th>Price</th>
                  <th>24h</th>
                  <th>Vol</th>
                </tr>
              </thead>
              <tbody>
                {rankedTokens.map((tok, i) => (
                  <tr key={tok.address} onClick={() => onNavigate('trade')} className="status-rank-row">
                    <td className="mono">{i + 1}</td>
                    <td>
                      <strong>
                        {tok.avatarEmoji ? `${tok.avatarEmoji} ` : ''}
                        {tok.symbol}
                      </strong>
                      <span className="muted tiny block">{tok.name}</span>
                    </td>
                    <td className="mono">{tok.price > 0 ? formatPrice(tok.price) : '—'}</td>
                    <td className={tok.change24h > 0 ? 'side-buy' : tok.change24h < 0 ? 'side-sell' : undefined}>
                      {tok.change24h === 0 ? '—' : `${tok.change24h > 0 ? '+' : ''}${tok.change24h.toFixed(1)}%`}
                    </td>
                    <td className="mono">{tok.volume24h > 0 ? formatUsdCompact(tok.volume24h) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="tiny muted status-rank-foot">
              Addresses saved on this desk. A 24h tape is not on this page. The pool log is the ledger.
            </p>
          </div>
        ) : (
          <>
            <div className="status-rank-table-wrap">
              <table className="status-rank-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Bot / pack</th>
                    <th>Followers</th>
                    <th>Rating</th>
                    <th>Tag</th>
                  </tr>
                </thead>
                <tbody>
                  {rankedPacks.map((p, i) => (
                    <tr key={p.id} onClick={() => onNavigate('skills')} className="status-rank-row">
                      <td className="mono">{i + 1}</td>
                      <td>
                        <strong>{p.name}</strong>
                        <span className="muted tiny block">@{p.authorHandle}</span>
                      </td>
                      <td>{p.followerCount}</td>
                      <td>{p.rating.toFixed(1)}</td>
                      <td>
                        {p.isDemo ? (
                          <span className="status-feed-badge">List</span>
                        ) : (
                          <span className="tiny muted">local</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {rankedPacks.length === 0 && (
                    <tr>
                      <td colSpan={5} className="muted">
                        No lists published from this browser. The desk earns on the pool.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <p className="tiny muted status-rank-foot">
              Saved on this browser. A follower count here is not a live crowd.
            </p>
          </>
        )}
      </div>

      {poolSwaps.length > 0 && (
        <div className="status-rank card">
          <div className="status-rank-head">
            <p className="rail-label">Pool trades</p>
            <span className="tiny muted">On the chain for everyone</span>
          </div>
          <div className="status-rank-table-wrap">
            <table className="status-rank-table">
              <thead>
                <tr>
                  <th>Side</th>
                  <th>HOOD</th>
                  <th>ETH</th>
                  <th>When</th>
                </tr>
              </thead>
              <tbody>
                {poolSwaps.map((swap) => (
                  <tr key={swap.txHash} onClick={() => onNavigate('trade')} className="status-rank-row">
                    <td>
                      <a href={EXPLORER_TX(swap.txHash)} target="_blank" rel="noreferrer" className={swap.side === 'buy' ? 'side-buy' : 'side-sell'}>
                        {swap.side.toUpperCase()}
                      </a>
                    </td>
                    <td className="mono">{Math.round(swap.hood).toLocaleString('en-US')}</td>
                    <td className="mono">{swap.eth >= 1 ? swap.eth.toFixed(3) : swap.eth.toPrecision(3)}</td>
                    <td className="tiny muted">{swap.time ? relTime(new Date(swap.time * 1000).toISOString()) : ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {rankedOrders.length === 0 && (
        <div className="card status-empty-orders empty-card">
          <HoodSeal size={48} decorative className="empty-seal" />
          <p className="rail-label">Wallet swaps</p>
          <p className="muted">The pool tape above is public. A wallet is only needed when you sign a swap of your own.</p>
          <div className="cta-row mt">
            <button type="button" className="btn btn-primary btn-sm" onClick={() => onNavigate('trade')}>
              Open Trade
            </button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setRankTab('tokens')}>
              $HOOD pool
            </button>
          </div>
        </div>
      )}

      {rankedOrders.length > 0 && (
        <div className="status-rank card">
          <div className="status-rank-head">
            <p className="rail-label">Recent wallet swaps</p>
            <span className="tiny muted">Signed on Uniswap</span>
          </div>
          <div className="status-rank-table-wrap">
            <table className="status-rank-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Side</th>
                  <th>Token</th>
                  <th>Amount</th>
                  <th>When</th>
                </tr>
              </thead>
              <tbody>
                {rankedOrders.map((o) => (
                  <tr key={o.id} onClick={() => onNavigate('trade')} className="status-rank-row">
                    <td className="mono">{o.rank}</td>
                    <td>
                      <strong className={o.side === 'buy' ? 'side-buy' : 'side-sell'}>
                        {o.side.toUpperCase()}
                      </strong>
                    </td>
                    <td>{o.symbol}</td>
                    <td className="mono">{o.amount}</td>
                    <td className="tiny muted">{relTime(o.at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="status-feed card">
        <div className="status-feed-head">
          <p className="rail-label">This browser</p>
          <span className="tiny muted">Signed swaps saved here. The pool log is the ledger.</span>
        </div>
        <ul className="status-feed-list">
          {feed.map((item) => (
            <li key={item.id} className={`status-feed-item kind-${item.kind}`}>
              <div className="status-feed-main">
                <strong>{item.title}</strong>
                <span className="status-feed-detail muted">{item.detail}</span>
              </div>
              <div className="status-feed-meta">
                {item.badge && <span className="status-feed-badge">{item.badge}</span>}
                <time className="tiny muted" dateTime={item.at}>
                  {relTime(item.at)}
                </time>
              </div>
            </li>
          ))}
        </ul>
        {orderCount === 0 && (
          <p className="status-feed-empty muted">
            No signed swaps yet — open{' '}
            <button type="button" className="link-btn inline" onClick={() => onNavigate('trade')}>
              Trade
            </button>{' '}
            to populate the feed.
          </p>
        )}
      </div>
    </section>
  )
}
