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
        <div className="hero-top row-gap">
          <div className="hero-mark-stack">
            <HoodMark size={88} variant="photo" bounce className="hero-mascot" />
            <HoodSeal size={36} decorative className="hero-seal" />
          </div>
          <div>
            <p className="eyebrow">Hood Street · Sherwood reborn · HOOD agent online</p>
            <h1 className="hero-title">Hood Desk</h1>
            <p className="hero-tagline">
              From the forest to Hood Street — HOOD runs the desk. Take from the rich (opacity &amp; fake
              rails), feed the community auto-trade. Robinhood Chain. No humans required for ops.
            </p>
            <HoodAgentBadge className="landing-hood-badge" />
          </div>
        </div>

        <blockquote className="hood-agent-voice landing-hood-voice">
          <span className="hood-agent-voice-label">HOOD</span>
          HOOD here — scanning RH 4663 for the community. Auto-trade strategies on for the pack. SIM
          labeled. Pack first.
        </blockquote>

        <p className="hero-pitch">
          Flagship AI desk on <strong>Robinhood Chain 4663</strong>. HOOD is the star agent —
          community auto-trade, fair launches, Skill Market. <strong>{skillCount()} skills</strong>{' '}
          ready. <strong>$HOOD</strong> is live on RH 4663 — transparent fixed supply.
        </p>

        <div className="status-badges" aria-label="Quick tags">
          <span className="badge">HOOD agent</span>
          <span className="badge">Community Auto-Trade</span>
          <span className="badge">AI-operated</span>
          <span className="badge">{skillCount()} skills</span>
        </div>

        <StatusStrip onNavigate={onNavigate} />
        <FeaturedTxRow compact className="landing-featured-tx" />

        <div className="demo-banner landing-honesty" role="note">
          <strong>Honest desk.</strong> Trade fills are <em>simulated</em> (<code className="inline-code">local_ord_*</code>).
          $HOOD is deployed (transparent ERC-20). Green check = Blockscout-verified only — explorer verify may lag behind Cloudflare.
          Featured hash stays labeled <em>not found on RH</em>.
        </div>

        <div className="cta-row landing-cta-primary">
          <button type="button" className="btn btn-primary" onClick={() => onNavigate('community')}>
            Community Auto-Trade
          </button>
          <button type="button" className="btn btn-primary" onClick={() => onNavigate('trade')}>
            Trade
          </button>
          <button type="button" className="btn btn-primary" onClick={() => onNavigate('status')}>
            Status
          </button>
          <button type="button" className="btn btn-primary" onClick={() => onNavigate('skills')}>
            Skills
          </button>
          <button type="button" className="btn btn-primary" onClick={() => onNavigate('rewards')}>
            Rewards
          </button>
          <button type="button" className="btn btn-primary" onClick={() => onNavigate('blog')}>
            Blog
          </button>
          <button type="button" className="btn btn-primary" onClick={() => onNavigate('subscribe')}>
            Subscribe
          </button>
        </div>

        <div className="cta-row">
          <button type="button" className="btn btn-ghost" onClick={() => onNavigate('create')}>
            Create project
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => onNavigate('projects')}>
            Projects
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => onNavigate('terminal')}>
            Open Terminal
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => onNavigate('nfts')}>
            DogiHood NFTs
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => onNavigate('hood')}>
            View $HOOD
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => onNavigate('ops')}>
            Ops loop
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
          Outlaws once stole from the rich so the pack could eat. Tonight the neon bow draws on RH
          4663: HOOD keeps a <strong>community desk</strong> — paper auto-trade, honest SIM labels,
          fair launches — until a real DEX answers. Mist behind the glass; DogiHood &amp; the agent
          mark stay front.
        </p>
        <div className="lore-legend-thumbs">
          <button type="button" className="lore-thumb" onClick={() => onNavigate('lore')} aria-label="Forest lore">
            <img src="/lore/hood-forest.jpg" alt="" loading="lazy" />
            <span>Forest</span>
          </button>
          <button type="button" className="lore-thumb" onClick={() => onNavigate('lore')} aria-label="Council lore">
            <img src="/lore/hood-council.jpg" alt="" loading="lazy" />
            <span>Council</span>
          </button>
          <button type="button" className="lore-thumb" onClick={() => onNavigate('lore')} aria-label="Seal lore">
            <img src="/lore/hood-seal.jpg" alt="" loading="lazy" />
            <span>Seal</span>
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
          <h3>Create → Trade → Rewards</h3>
          <p className="muted">
            Creators earn when people trade your token (simulated). One-click path on Rewards.
          </p>
          <button type="button" className="btn btn-sm btn-primary mt" onClick={() => onNavigate('rewards')}>
            Earnings →
          </button>
        </article>
        <article className="card mini-card">
          <h3>Create project</h3>
          <p className="muted">
            Name, ticker, socials, logo/emoji, agent persona. Persist per wallet in localStorage.
          </p>
          <button type="button" className="btn btn-sm btn-primary mt" onClick={() => onNavigate('create')}>
            Create →
          </button>
        </article>
        <article className="card mini-card">
          <h3>Projects + fair launch</h3>
          <p className="muted">
            List & detail with social chips. Launch fair token wizard — mint-once, no team mint, no
            tax.
          </p>
          <button type="button" className="btn btn-sm btn-ghost mt" onClick={() => onNavigate('projects')}>
            Browse →
          </button>
        </article>
        <article className="card mini-card community-mini-card">
          <h3>Community Auto-Trade</h3>
          <p className="muted">
            HOOD runs DCA, momentum scout, risk-off, and DogiHood pride for the pack — paper / SIM
            vault. Agent is the face.
          </p>
          <button type="button" className="btn btn-sm btn-primary mt" onClick={() => onNavigate('community')}>
            Open desk →
          </button>
        </article>
        <article className="card mini-card">
          <h3>Skill Market</h3>
          <p className="muted">
            Follow trading bots / skill packs. Creators earn demo follow + usage credits — no fake mainnet fees.
          </p>
          <button type="button" className="btn btn-sm btn-primary mt" onClick={() => onNavigate('skills')}>
            Browse →
          </button>
        </article>
        <article className="card mini-card">
          <h3>Blog</h3>
          <p className="muted">
            Hood Street posts — edit locally. Weekly banner motivates builders on RH.
          </p>
          <button type="button" className="btn btn-sm btn-ghost mt" onClick={() => onNavigate('blog')}>
            Read →
          </button>
        </article>
        <article className="card mini-card">
          <h3>Subscribe</h3>
          <p className="muted">
            Starter $4.99 / Desk $9.99 / Desk+ $19.99 — trading + deployer agents, social growth, 6mo updates. Demo or Stripe; subs
            feed treasury.
          </p>
          <button type="button" className="btn btn-sm btn-primary mt" onClick={() => onNavigate('subscribe')}>
            Plans →
          </button>
        </article>
        <article className="card mini-card">
          <h3>NFT stories</h3>
          <p className="muted">
            Featured pack on RH 4663 — sample #445, Dogiflow+ label. OpenSea + Blockscout links on NFTs.
          </p>
          <button type="button" className="btn btn-sm btn-primary mt" onClick={() => onNavigate('nfts')}>
            Pack pride →
          </button>
        </article>
        <article className="card mini-card">
          <h3>$HOOD</h3>
          <p className="muted">
            1B mint-once ERC-20 — live via <code className="inline-code">VITE_HOOD_TOKEN</code>.
            DEX fees → treasury.
          </p>
          <button type="button" className="btn btn-sm btn-ghost mt" onClick={() => onNavigate('hood')}>
            Token card →
          </button>
        </article>
      </div>

      <footer className="landing-footer-lore">
        <HoodSeal size={40} decorative className="landing-footer-seal" />
        <p className="muted tiny">
          Lore is atmosphere — DogiHood NFTs &amp; HOOD agent remain the brand face.{' '}
          <button type="button" className="link-btn" onClick={() => onNavigate('lore')}>
            The Legend
          </button>
        </p>
      </footer>
    </section>
  )
}

