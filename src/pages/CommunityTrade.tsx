import { HoodAgentHero } from '../components/HoodAgentHero'
import { HOOD_WETH_POOL, uniswapPoolUrl, uniswapSwapUrl } from '../lib/trade/uniswap'
import { HOOD_TOKEN_ADDRESS } from '../lib/hoodToken'
import type { ViewId } from '../lib/nav'

type Props = { onNavigate: (id: ViewId, projectId?: string) => void }

export function CommunityTrade({ onNavigate }: Props) {
  const swapUrl = HOOD_TOKEN_ADDRESS ? uniswapSwapUrl(HOOD_TOKEN_ADDRESS) : uniswapPoolUrl(HOOD_WETH_POOL)

  return (
    <section className="page community-trade-page">
      <HoodAgentHero
        title="The pool"
        eyebrow="The useful part"
        lead="The desk keeps the market in view. A swap happens when your wallet signs it."
        voice="HOOD here. The pool is on-chain. The desk does not place the order."
      >
        <div className="cta-row mt">
          <button type="button" className="btn btn-primary btn-sm" onClick={() => onNavigate('trade')}>
            Trade $HOOD
          </button>
          <a className="btn btn-ghost btn-sm" href={swapUrl} target="_blank" rel="noreferrer">
            Open the pool
          </a>
        </div>
      </HoodAgentHero>
      <article className="card">
        <p className="rail-label">What is live</p>
        <h2 className="section-title">$HOOD/WETH</h2>
        <p className="muted">
          The pool is Uniswap V3 on Robinhood Chain. Market swaps sign in your wallet. Only swap an
          amount you can afford to lose. The swap list is on the pool ledger.
        </p>
        <p className="mono tiny">{HOOD_WETH_POOL}</p>
      </article>
    </section>
  )
}
