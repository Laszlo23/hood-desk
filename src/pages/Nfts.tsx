import { DogiHoodCard } from '../components/DogiHoodCard'
import {
  DOGIHOOD,
  DOGIHOOD_NFT_ADDRESS,
  FEATURED_NFT_COLLECTIONS,
  dogiHoodItemUrl,
  shortAddr,
} from '../lib/nfts/dogihood'
import type { ViewId } from '../lib/nav'

type Props = { onNavigate: (id: ViewId, projectId?: string) => void }

export function Nfts({ onNavigate }: Props) {
  return (
    <section className="page nfts-page">
      <div className="page-intro">
        <p className="eyebrow">Explore · Featured NFTs</p>
        <h1>NFT pride</h1>
        <p className="muted">
          Pack collections featured on Hood Desk. The HOOD fox stays the agent mark — DogiHood is
          on-chain pack pride on Robinhood Chain (4663). Labels: <strong>Dogiflow+</strong>.
        </p>
        <div className="demo-banner">
          <strong>On-chain collection.</strong> Contract{' '}
          <code className="inline-code">{shortAddr(DOGIHOOD_NFT_ADDRESS)}</code> · sample token #
          {DOGIHOOD.sampleTokenId}. Holder perks on the desk are local until more product wires in —
          no fake verified badges.
        </div>
      </div>

      <div className="nfts-featured-list">
        {FEATURED_NFT_COLLECTIONS.map((c) =>
          c.id === 'dogihood' ? (
            <DogiHoodCard key={c.id} variant="featured" showHolderToggle />
          ) : null,
        )}
      </div>

      <article className="card mt">
        <p className="rail-label">Quick links · DogiHood</p>
        <ul className="spec-list">
          <li>
            <span className="rail-label">Contract</span>
            <span className="mono">{DOGIHOOD_NFT_ADDRESS || '—'}</span>
          </li>
          <li>
            <span className="rail-label">Sample</span>
            <span>
              #{DOGIHOOD.sampleTokenId} · {DOGIHOOD.badges.join(' · ')}
            </span>
          </li>
          <li>
            <span className="rail-label">OpenSea</span>
            <span>
              <a href={DOGIHOOD.openseaUrl} target="_blank" rel="noreferrer">
                Collection ↗
              </a>
              {' · '}
              <a href={dogiHoodItemUrl()} target="_blank" rel="noreferrer">
                Item #{DOGIHOOD.sampleTokenId} ↗
              </a>
            </span>
          </li>
          {DOGIHOOD.explorerUrl && (
            <li>
              <span className="rail-label">Explorer</span>
              <span>
                <a href={DOGIHOOD.explorerUrl} target="_blank" rel="noreferrer">
                  Blockscout token ↗
                </a>
              </span>
            </li>
          )}
        </ul>
        <div className="cta-row mt">
          <button type="button" className="btn btn-primary btn-sm" onClick={() => onNavigate('status')}>
            Status feed →
          </button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => onNavigate('skills')}>
            Skill Market →
          </button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => onNavigate('account')}>
            Account / holder toggle →
          </button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => onNavigate('landing')}>
            ← Desk
          </button>
        </div>
      </article>
    </section>
  )
}
