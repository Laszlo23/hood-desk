import { EXPLORER_TOKEN } from '../lib/chain'
import {
  HOOD_META,
  HOOD_TOKEN_ADDRESS,
  HOOD_TOKEN_DEPLOYED,
} from '../lib/hoodToken'
import { HoodMark } from './HoodMark'

export function HoodCard() {
  return (
    <section className="card hood-card" aria-label="$HOOD token">
      <div className="row-between">
        <div>
          <p className="eyebrow">Companion token</p>
          <h2 className="hood-title">
            ${HOOD_META.symbol}{' '}
            <span className="muted hood-name">{HOOD_META.name}</span>
          </h2>
        </div>
        <span className="fox-mini" aria-hidden>
          <HoodMark size={40} variant="mark" />
        </span>
      </div>
      <p className="muted hood-supply">{HOOD_META.totalSupplyNote}</p>
      <p className="mono hood-contract">
        {HOOD_TOKEN_DEPLOYED && HOOD_TOKEN_ADDRESS ? (
          <>
            Contract:{' '}
            <a
              href={EXPLORER_TOKEN(HOOD_TOKEN_ADDRESS)}
              target="_blank"
              rel="noreferrer"
            >
              {HOOD_TOKEN_ADDRESS.slice(0, 8)}…{HOOD_TOKEN_ADDRESS.slice(-6)}
            </a>
          </>
        ) : (
          <>
            Contract: <strong>not deployed</strong> — set <code className="inline-code">VITE_HOOD_TOKEN</code>
          </>
        )}
      </p>
      {HOOD_TOKEN_DEPLOYED && HOOD_TOKEN_ADDRESS && (
        <a
          className="btn btn-ghost btn-sm mt"
          href={EXPLORER_TOKEN(HOOD_TOKEN_ADDRESS)}
          target="_blank"
          rel="noreferrer"
        >
          Open Blockscout →
        </a>
      )}
    </section>
  )
}
