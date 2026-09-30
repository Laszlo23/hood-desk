import { HoodCard } from '../components/HoodCard'
import { EXPLORER_BASE } from '../lib/chain'
import { HOOD_META, HOOD_TOKEN_DEPLOYED } from '../lib/hoodToken'
import type { ViewId } from '../lib/nav'

type Props = { onNavigate: (id: ViewId, projectId?: string) => void }

export function Hood({ onNavigate }: Props) {
  return (
    <section className="page hood-page">
      <div className="page-intro">
        <p className="eyebrow">Companion coin</p>
        <h1>Hold $HOOD · fund the desk</h1>
        <p className="muted">
          Fair-launch companion ERC-20 for Hood Desk. Clean token — fees that keep the agent
          online live at the DEX / fee-router layer, not inside transfers.
        </p>
      </div>

      <div className="hood-layout">
        <HoodCard />

        <article className="card">
          <h2>Specs</h2>
          <ul className="spec-list">
            <li>
              <span className="rail-label">Name / symbol</span>
              <span>
                {HOOD_META.name} / ${HOOD_META.symbol}
              </span>
            </li>
            <li>
              <span className="rail-label">Supply</span>
              <span>1,000,000,000 (1B) · mint-once</span>
            </li>
            <li>
              <span className="rail-label">Decimals</span>
              <span>18</span>
            </li>
            <li>
              <span className="rail-label">Tax / pause / blacklist</span>
              <span>None</span>
            </li>
            <li>
              <span className="rail-label">Status</span>
              <span>{HOOD_TOKEN_DEPLOYED ? 'Deployed (env set)' : 'Not deployed until VITE_HOOD_TOKEN'}</span>
            </li>
            <li>
              <span className="rail-label">Draft</span>
              <span className="mono">../hood-token</span>
            </li>
          </ul>
        </article>

        <article className="card">
          <h2>How fees fund the desk</h2>
          <ol className="fee-steps">
            <li>
              <strong>DEX fee tier</strong> — swap volume on RH produces protocol / LP fees
              (router TBD — no invented addresses).
            </li>
            <li>
              <strong>Agent treasury</strong> — a share of fees routes to the Desk treasury
              (runway for RPC, hosting, future tooling).
            </li>
            <li>
              <strong>Agent stays online</strong> — ops continue without human operators.
              Holders stay aligned via ${HOOD_META.symbol}.
            </li>
          </ol>
          <p className="muted mt">
            Not baked into ERC-20 transfers. See <code className="inline-code">hood-token</code>{' '}
            LAUNCH.md. Explorer:{' '}
            <a href={EXPLORER_BASE} target="_blank" rel="noreferrer">
              Blockscout
            </a>
            .
          </p>
          <div className="cta-row mt">
            <button type="button" className="btn btn-primary" onClick={() => onNavigate('terminal')}>
              Ask Desk about $HOOD
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => onNavigate('ops')}>
              Ops loop
            </button>
          </div>
        </article>
      </div>
    </section>
  )
}
