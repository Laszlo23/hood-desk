import { HoodMark } from '../components/HoodMark'
import { HoodSeal } from '../components/HoodSeal'
import { HoodAgentBadge } from '../components/HoodAgentBadge'
import { DogiHoodCard } from '../components/DogiHoodCard'
import { CCFF00_STORY, CCFF00_OPENSEA, ccff00ItemUrl, shortAddr } from '../lib/nfts/stories'
import { StatusStrip } from '../components/status/StatusStrip'
import { FeaturedTxRow } from '../components/status/FeaturedTxRow'
import { skillCount } from '../lib/agent/skills'
import type { ViewId } from '../lib/nav'

type Props = { onNavigate: (id: ViewId, projectId?: string) => void }

export function Landing({ onNavigate }: Props) {
  return (
    <section className="page landing-page">
      <div className="hero card">
        <div className="hero-top">
          <HoodMark size={112} variant="logo" className="hero-logo" alt="Hood Desk" />
          <div className="hero-copy">
            <p className="eyebrow">From the wood · Hood Street</p>
            <h1 className="hero-title">Hood Desk</h1>
            <p className="hero-tagline">
              Once the forest took from the rich so the pack could eat. Tonight that story is one
              coin, one pool, and the notes.
            </p>
            <HoodAgentBadge className="landing-hood-badge" />
          </div>
        </div>

        <p className="hero-pitch">
          One coin, one Uniswap pool, and a desk that keeps the notes. <strong>$HOOD</strong> is a
          fixed 1,000,000,000 supply. <strong>{skillCount()} skills</strong> answer questions. They
          do not place orders.
        </p>

        <div className="status-badges" aria-label="Quick tags">
          <span className="badge">$HOOD</span>
          <span className="badge">One pool</span>
          <span className="badge">Wallet signs</span>
          <span className="badge">{skillCount()} skills</span>
        </div>

        <StatusStrip onNavigate={onNavigate} />
        <FeaturedTxRow compact className="landing-featured-tx" />

        <div className="demo-banner landing-honesty" role="note">
          <strong>What is live.</strong> $HOOD trades on Uniswap. The ledger lists those swaps. A
          seed pairs ETH with treasury $HOOD, and 2% of that ETH goes to the cause. A green check
          means Sourcify matched the contract.
        </div>

        <div className="hero-actions">
          <button type="button" className="btn btn-primary" onClick={() => onNavigate('trade')}>
            Trade
          </button>
          <button type="button" className="btn btn-quiet" onClick={() => onNavigate('hood')}>
            $HOOD
          </button>
          <button type="button" className="btn btn-quiet" onClick={() => onNavigate('rewards')}>
            Ledger
          </button>
          <button type="button" className="btn btn-quiet" onClick={() => onNavigate('blog')}>
            Notes
          </button>
        </div>
      </div>


      <section className="lore-legend-strip card" aria-label="The Legend">
        <div className="lore-legend-head row-between">
          <div className="row-gap">
            <HoodSeal size={44} className="lore-legend-seal" />
            <div>
              <p className="eyebrow">The Legend</p>
              <h2 className="section-title">Sherwood → Hood Street</h2>
            </div>
          </div>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => onNavigate('lore')}>
            Full legend →
          </button>
        </div>
        <p className="muted lore-legend-copy">
          Three scenes from the wood. The coin, the pool, and the notes carry them.
        </p>
        <div className="lore-legend-thumbs">
          <button type="button" className="lore-thumb" onClick={() => onNavigate('lore')} aria-label="The wood took from the rich">
            <img src="/lore/hood-forest.jpg" alt="" loading="lazy" />
            <span className="lore-thumb-line">The wood took from the rich.</span>
          </button>
          <button type="button" className="lore-thumb" onClick={() => onNavigate('lore')} aria-label="The desk keeps the books">
            <img src="/lore/hood-council.jpg" alt="" loading="lazy" />
            <span className="lore-thumb-line">The desk keeps the books.</span>
          </button>
          <button type="button" className="lore-thumb" onClick={() => onNavigate('lore')} aria-label="The hood marks the pack">
            <img src="/lore/hood-seal.jpg" alt="" loading="lazy" />
            <span className="lore-thumb-line">The hood marks the pack.</span>
          </button>
        </div>
      </section>

      <div className="featured-nft-strip" aria-label="Featured NFTs">
        <div className="row-between" style={{ alignItems: 'baseline' }}>
          <p className="rail-label">Featured pack · DogiHood · CCFF00</p>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => onNavigate('nfts')}>
            Stories + gallery →
          </button>
        </div>
        <DogiHoodCard
          variant="strip"
          showHolderToggle={false}
          onOpenNfts={() => onNavigate('nfts')}
        />
        <article className="card nft-landing-ccff00">
          <div className="nft-landing-ccff00-inner">
            <div className="nft-story-cover-wrap nft-landing-neon" aria-hidden>
              <img src={CCFF00_STORY.coverImage} alt="" loading="lazy" />
            </div>
            <div>
              <p className="eyebrow">HoodStreet · Proof of Neon</p>
              <h3 className="section-title" style={{ margin: '4px 0 6px' }}>
                {CCFF00_STORY.name}
              </h3>
              <p className="muted tiny">{CCFF00_STORY.tagline}</p>
              <p className="tiny muted mono mt">{shortAddr(CCFF00_STORY.contract)}</p>
              <div className="cta-row mt">
                <a className="btn btn-primary btn-sm" href={CCFF00_OPENSEA} target="_blank" rel="noreferrer">
                  OpenSea →
                </a>
                <a className="btn btn-ghost btn-sm" href={ccff00ItemUrl(1)} target="_blank" rel="noreferrer">
                  Sample #1
                </a>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => onNavigate('nfts')}>
                  Full stories →
                </button>
              </div>
            </div>
          </div>
        </article>
      </div>

      <div className="landing-grid">
        <article className="card mini-card">
          <h3>Ledger</h3>
          <p className="muted">
            Every $HOOD swap, in order. The pool fee stays in the position.
          </p>
          <button type="button" className="btn btn-quiet mt" onClick={() => onNavigate('rewards')}>
            Open the ledger
          </button>
        </article>
        <article className="card mini-card">
          <h3>Create</h3>
          <p className="muted">
            Start a fair launch: a name, a ticker, and a supply that is minted once.
          </p>
          <button type="button" className="btn btn-quiet mt" onClick={() => onNavigate('create')}>
            Create →
          </button>
        </article>
        <article className="card mini-card">
          <h3>Projects</h3>
          <p className="muted">
            Launches saved on this desk. Mint once, no team mint, no tax.
          </p>
          <button type="button" className="btn btn-quiet mt" onClick={() => onNavigate('projects')}>
            Browse →
          </button>
        </article>
        <article className="card mini-card community-mini-card">
          <h3>The pool</h3>
          <p className="muted">
            The live $HOOD/WETH market. The desk does not place the order for you.
          </p>
          <button type="button" className="btn btn-quiet mt" onClick={() => onNavigate('community')}>
            See the pool
          </button>
        </article>
        <article className="card mini-card">
          <h3>Skills</h3>
          <p className="muted">
            Questions the desk can answer. Following a pack copies its skill list. It does not trade.
          </p>
          <button type="button" className="btn btn-quiet mt" onClick={() => onNavigate('skills')}>
            Browse →
          </button>
        </article>
        <article className="card mini-card">
          <h3>Notes</h3>
          <p className="muted">
            What Hood Street said, written down here.
          </p>
          <button type="button" className="btn btn-quiet mt" onClick={() => onNavigate('blog')}>
            Read →
          </button>
        </article>
        <article className="card mini-card">
          <h3>Subscribe</h3>
          <p className="muted">
            Starter $4.99, Desk $9.99, Desk+ $19.99. Paid plans on this desk.
          </p>
          <button type="button" className="btn btn-quiet mt" onClick={() => onNavigate('subscribe')}>
            Plans →
          </button>
        </article>
        <article className="card mini-card">
          <h3>Marks</h3>
          <p className="muted">
            DogiHood, Hood Seeder, and CCFF00. Each mark can hold a wallet.
          </p>
          <button type="button" className="btn btn-quiet mt" onClick={() => onNavigate('nfts')}>
            Open marks
          </button>
        </article>
        <article className="card mini-card">
          <h3>$HOOD</h3>
          <p className="muted">
            Struck once. One pool. A cut of every seed for the cause.
          </p>
          <button type="button" className="btn btn-quiet mt" onClick={() => onNavigate('hood')}>
            Token card →
          </button>
        </article>
      </div>

    </section>
  )
}

