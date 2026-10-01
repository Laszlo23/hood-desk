import { useState } from 'react'
import { DogiHoodCard } from '../components/DogiHoodCard'
import { HoodSeederCard } from '../components/HoodSeederCard'
import { InnerCircleCard } from '../components/InnerCircleCard'
import { TokenBoundPanel } from '../components/TokenBoundPanel'
import {
  ALL_GALLERY_ITEMS,
  CCFF00_NFT_ADDRESS,
  NFT_PROJECT_STORIES,
  shortAddr,
  type NftGalleryItem,
  type NftProjectStory,
} from '../lib/nfts/stories'
import type { ViewId } from '../lib/nav'

type Props = { onNavigate: (id: ViewId, projectId?: string) => void }

function GalleryTile({ item }: { item: NftGalleryItem }) {
  const [src, setSrc] = useState(item.image)
  const body = (
    <>
      <div className="nft-gallery-art" aria-hidden={false}>
        <img
          src={src}
          alt={item.label}
          loading="lazy"
          onError={() => {
            if (item.placeholder && src !== item.placeholder) setSrc(item.placeholder)
          }}
        />
      </div>
      <div className="nft-gallery-meta">
        <strong>{item.label}</strong>
        {item.note ? <span className="tiny muted">{item.note}</span> : null}
      </div>
    </>
  )
  if (item.openseaItemUrl) {
    return (
      <a
        className="nft-gallery-tile"
        href={item.openseaItemUrl}
        target="_blank"
        rel="noreferrer noopener"
      >
        {body}
      </a>
    )
  }
  return <div className="nft-gallery-tile">{body}</div>
}

function StoryCard({ story, onOpenFlagship }: { story: NftProjectStory; onOpenFlagship?: () => void }) {
  return (
    <article className={`card nft-story-card${story.flagship ? ' nft-story-flagship' : ''}`}>
      <div className="nft-story-head">
        <div className="nft-story-cover-wrap" aria-hidden>
          <img className="nft-story-cover" src={story.coverImage} alt="" loading="lazy" />
        </div>
        <div className="nft-story-titles">
          <div className="nft-story-title-row">
            <h2>{story.name}</h2>
            {story.flagship ? <span className="dogihood-flow-badge">Flagship</span> : null}
          </div>
          <p className="muted nft-story-tagline">{story.tagline}</p>
          <div className="dogihood-meta">
            <span className="badge">RH {story.chainId}</span>
            <span className="badge">{story.standard}</span>
            {story.badges.map((b) => (
              <span key={b} className="badge badge-muted">
                {b}
              </span>
            ))}
            <span
              className={`badge nft-confidence-${story.confidence}`}
              title={story.confidenceNote}
            >
              {story.confidence === 'confirmed' ? 'Confirmed' : 'Community lore'}
            </span>
          </div>
        </div>
      </div>

      <p className="nft-story-body">{story.story}</p>
      <p className="tiny muted">{story.confidenceNote}</p>

      {story.contract ? (
        <p className="tiny muted mono">
          NFT {shortAddr(story.contract)}
          {story.sampleTokenId != null ? ` · sample #${story.sampleTokenId}` : ''}
        </p>
      ) : null}

      {story.erc20Note ? (
        <div className="demo-banner nft-erc20-note">
          <strong>$CCFF00 note.</strong> {story.erc20Note}
        </div>
      ) : null}

      <div className="cta-row nft-story-links">
        {story.links.map((l) => (
          <a
            key={l.href + l.label}
            className="btn btn-ghost btn-sm"
            href={l.href}
            target="_blank"
            rel="noreferrer noopener"
          >
            {l.label} ↗
          </a>
        ))}
        {story.flagship && onOpenFlagship ? (
          <button type="button" className="btn btn-primary btn-sm" onClick={onOpenFlagship}>
            Holder card ↓
          </button>
        ) : null}
      </div>
    </article>
  )
}

export function Nfts({ onNavigate }: Props) {
  return (
    <section className="page nfts-page">
      <div className="page-intro">
        <p className="eyebrow">Explore · NFT stories · #CCFF00</p>
        <h1>Pack pride &amp; Proof of Neon</h1>
        <p className="muted">
          Real Hoodstreet / desk-supported collections on Robinhood Chain (4663).{' '}
          <strong>DogiHood</strong> stays the flagship pack; <strong>Hood Seeder</strong> honors
          early supporters; <strong>CCFF00</strong> is HoodStreet&apos;s founding ERC-6551 neon
          membership. No invented contracts, no fake verified badges, no live-trading claims.
        </p>
        <div className="demo-banner">
          <strong>Honest labels.</strong> Contracts shown were checked via OpenSea / official
          HoodStreet pages / RH RPC. Hood Seeder is a desk community collection (deploy via
          contracts/hood-seeder/). Sibling RH collections (e.g. DotHood) exist but are{' '}
          <em>not</em> claimed as Hoodstreet-supported here. $CCFF00 ERC-20 transfers may be
          disabled — culture &amp; membership first.
        </div>
      </div>

      <div className="nft-stories-grid" aria-label="Project stories">
        {NFT_PROJECT_STORIES.map((s) => (
          <StoryCard
            key={s.id}
            story={s}
            onOpenFlagship={s.flagship ? () => {
              document.getElementById('dogihood-flagship')?.scrollIntoView({ behavior: 'smooth' })
            } : undefined}
          />
        ))}
      </div>

      <div id="dogihood-flagship" className="nfts-featured-list">
        <p className="rail-label">Featured cards · DogiHood / Hood Seeder</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
          <DogiHoodCard variant="featured" showHolderToggle />
          <HoodSeederCard variant="featured" showHolderToggle />
        </div>
      </div>

      <div className="nfts-featured-list">
        <p className="rail-label">Inner Circle · soulbound membership</p>
        <InnerCircleCard variant="featured" showHolderToggle />
      </div>

      <div className="mt">
        <TokenBoundPanel initialCollection="dogihood" />
      </div>

      <article className="card mt nft-gallery-section">
        <div className="row-between nft-gallery-head">
          <div>
            <p className="rail-label">Visible gallery · cached locally</p>
            <h2 className="section-title">Neon squares &amp; Shibas</h2>
          </div>
          <span className="tiny muted">{ALL_GALLERY_ITEMS.length} pieces</span>
        </div>
        <p className="muted tiny nft-gallery-lede">
          Images cached under <code className="inline-code">public/nfts/</code> (CCFF00 on-chain
          SVG; DogiHood from IPFS). OpenSea links open the live item when available.
        </p>
        <div className="nft-gallery-grid">
          {ALL_GALLERY_ITEMS.map((item) => (
            <GalleryTile key={item.id} item={item} />
          ))}
        </div>
      </article>

      <article className="card mt">
        <p className="rail-label">Quick refs</p>
        <ul className="spec-list">
          <li>
            <span className="rail-label">DogiHood</span>
            <span className="mono">
              {shortAddr(NFT_PROJECT_STORIES.find((s) => s.id === 'dogihood')?.contract)}
            </span>
          </li>
          <li>
            <span className="rail-label">CCFF00 NFT</span>
            <span className="mono">{shortAddr(CCFF00_NFT_ADDRESS)}</span>
          </li>
          <li>
            <span className="rail-label">Hood Seeder</span>
            <span className="mono">
              {shortAddr(NFT_PROJECT_STORIES.find((s) => s.id === 'hood-seeder')?.contract)}
            </span>
          </li>
          <li>
            <span className="rail-label">Inner Circle</span>
            <span className="tiny muted">Soulbound badge · shows a contract after deploy</span>
          </li>
          <li>
            <span className="rail-label">Sources</span>
            <span className="tiny muted">
              hoodstreet.capital · OpenSea · RH RPC — see story cards
            </span>
          </li>
        </ul>
        <div className="cta-row mt">
          <button type="button" className="btn btn-primary btn-sm" onClick={() => onNavigate('lore')}>
            The Legend →
          </button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => onNavigate('status')}>
            Status feed →
          </button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => onNavigate('account')}>
            Account / holder →
          </button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => onNavigate('landing')}>
            ← Desk
          </button>
        </div>
      </article>
    </section>
  )
}
