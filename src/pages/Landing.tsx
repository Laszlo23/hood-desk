import { HoodMark } from '../components/HoodMark'
import { HoodSeal } from '../components/HoodSeal'
import { HoodAgentBadge } from '../components/HoodAgentBadge'
import { DogiHoodCard } from '../components/DogiHoodCard'
import { CCFF00_STORY, CCFF00_OPENSEA, ccff00ItemUrl, shortAddr } from '../lib/nfts/stories'
import { StatusStrip } from '../components/status/StatusStrip'
import { FeaturedTxRow } from '../components/status/FeaturedTxRow'
import { skillCount } from '../lib/agent/skills'
import { StoryWalk } from '../components/StoryWalk'
import { WoodWheel } from '../components/WoodWheel'
import type { ViewId } from '../lib/nav'

type Props = { onNavigate: (id: ViewId, projectId?: string) => void }

export function Landing({ onNavigate }: Props) {
  return (
    <section className="page landing-page">
      <div className="hero card">
        <div className="hero-top">
          <HoodMark size={112} variant="logo" className="hero-logo" alt="Hood Desk" />
          <div className="hero-copy">
            <p className="eyebrow">Robinhood Chain</p>
            <h1 className="hero-title">Hood Desk</h1>
            <p className="hero-tagline">
              A launchpad for people who make things. The coin, the pool, and the ledger stay public. A collection you press lives on this desk.
            </p>
            <p className="muted">
              Your wallet signs a swap. This desk writes it down. OpenSea does not host the collections pressed here.
            </p>
            <HoodAgentBadge className="landing-hood-badge" />
          </div>
        </div>

        <section className="project-facts" aria-label="What Hood Desk is">
          <button type="button" className="project-fact" onClick={() => onNavigate('hood')}>
            <span>The coin</span>
            <strong>$HOOD</strong>
            <p>Minted once. 1,000,000,000 tokens. No tax when it moves, and it cannot be minted again.</p>
          </button>
          <button type="button" className="project-fact" onClick={() => onNavigate('community')}>
            <span>The pool</span>
            <strong>$HOOD / WETH</strong>
            <p>One Uniswap market. Each swap pays 1%, and that fee stays in the desk’s position.</p>
          </button>
          <button type="button" className="project-fact" onClick={() => onNavigate('rewards')}>
            <span>The book</span>
            <strong>The ledger</strong>
            <p>
              Every swap is listed here. Notes are what Hood Street said. {skillCount()} skills answer
              questions. They do not trade.
            </p>
          </button>
          <button type="button" className="project-fact" onClick={() => onNavigate('create')}>
            <span>The press</span>
            <strong>Your collection</strong>
            <p>
              Draw a mark, pick an edition, and put it on the public board. The first press from this
              browser adds 120 XP. That is not a mint.
            </p>
          </button>
        </section>

        <div className="hero-actions">
          <button type="button" className="btn btn-primary" onClick={() => onNavigate('create')}>
            Press a collection
          </button>
          <button type="button" className="btn btn-quiet" onClick={() => onNavigate('trade')}>
            Trade $HOOD
          </button>
          <button type="button" className="btn btn-quiet" onClick={() => onNavigate('hood')}>
            The coin
          </button>
          <button type="button" className="btn btn-quiet" onClick={() => onNavigate('rewards')}>
            The ledger
          </button>
          <button type="button" className="btn btn-quiet" onClick={() => onNavigate('dark')}>
            Stay dark
          </button>
        </div>

        <button
          type="button"
          className="notes-callout"
          onClick={() => onNavigate('blog', 'thank-you-cashpig-and-roaringpiggy')}
        >
          <span className="eyebrow">The notes</span>
          <strong>Thank you, Cashpig and RoaringPiggy</strong>
          <p>
            They keep the HoodStreet Media room up, day and night. Today’s Mini counts are in the
            note. Read it.
          </p>
        </button>

        <StatusStrip onNavigate={onNavigate} />
        <FeaturedTxRow compact className="landing-featured-tx" />

        <p className="landing-honesty">
          A seed pairs ETH with treasury $HOOD. 2% of that ETH goes to the cause. A green check means
          Sourcify matched the contract.
        </p>
      </div>

      <WoodWheel onNavigate={onNavigate} />

      <section className="card story-card" aria-label="The story">
        <div className="lore-legend-head row-between">
          <div className="row-gap">
            <HoodSeal size={44} className="lore-legend-seal" />
            <div>
              <p className="eyebrow">The story</p>
              <h2 className="section-title">From the wood to the desk</h2>
            </div>
          </div>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => onNavigate('lore')}>
            Read it through →
          </button>
        </div>
        <p className="muted lore-legend-copy">
          The legend is the name of the app. Each step opens a real page: the coin, the pool, the ledger, the marks.
        </p>
        <StoryWalk onNavigate={onNavigate} />
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
          <h3>$HOOD</h3>
          <p className="muted">The coin. One mint, one billion, one pool.</p>
          <button type="button" className="btn btn-quiet mt" onClick={() => onNavigate('hood')}>
            Open the coin
          </button>
        </article>
        <article className="card mini-card community-mini-card">
          <h3>The pool</h3>
          <p className="muted">The $HOOD/WETH market. The desk does not place the order.</p>
          <button type="button" className="btn btn-quiet mt" onClick={() => onNavigate('community')}>
            See the pool
          </button>
        </article>
        <article className="card mini-card">
          <h3>Ledger</h3>
          <p className="muted">Every signed swap, in order. The 1% fee stays in the position.</p>
          <button type="button" className="btn btn-quiet mt" onClick={() => onNavigate('rewards')}>
            Open the ledger
          </button>
        </article>
        <article className="card mini-card">
          <h3>Notes</h3>
          <p className="muted">
            The latest from the street, and a thank-you to Cashpig and RoaringPiggy for the room they keep open.
          </p>
          <button type="button" className="btn btn-quiet mt" onClick={() => onNavigate('blog')}>
            Read the notes
          </button>
        </article>
        <article className="card mini-card">
          <h3>Marks</h3>
          <p className="muted">DogiHood and CCFF00 are Hood Street. Seeder and Inner Circle are this desk.</p>
          <button type="button" className="btn btn-quiet mt" onClick={() => onNavigate('nfts')}>
            Open marks
          </button>
        </article>
        <article className="card mini-card">
          <h3>Skills</h3>
          <p className="muted">Question lists. Following one changes Ask. It does not move tokens.</p>
          <button type="button" className="btn btn-quiet mt" onClick={() => onNavigate('skills')}>
            Browse skills
          </button>
        </article>
        <article className="card mini-card">
          <h3>Create</h3>
          <p className="muted">
            Press a collection on this page. The pictures stay here. OpenSea does not set the edition.
          </p>
          <button type="button" className="btn btn-quiet mt" onClick={() => onNavigate('create')}>
            Open the press
          </button>
        </article>
        <article className="card mini-card">
          <h3>Projects</h3>
          <p className="muted">Launches saved on this desk. Mint once, no team mint, no tax.</p>
          <button type="button" className="btn btn-quiet mt" onClick={() => onNavigate('projects')}>
            Browse
          </button>
        </article>
        <article className="card mini-card">
          <h3>Subscribe</h3>
          <p className="muted">Starter $4.99, Desk $9.99, Desk+ $19.99. Paid plans, separate from the pool.</p>
          <button type="button" className="btn btn-quiet mt" onClick={() => onNavigate('subscribe')}>
            See plans
          </button>
        </article>
      </div>

    </section>
  )
}

