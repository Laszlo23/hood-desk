import { useEffect, useState } from 'react'
import { HoodMark } from '../components/HoodMark'
import { DogiHoodCard } from '../components/DogiHoodCard'
import { HoodSeederCard } from '../components/HoodSeederCard'
import { InnerCircleCard } from '../components/InnerCircleCard'
import { WalletPanel } from '../components/WalletPanel'
import { XpChip } from '../components/XpChip'
import { DeskShareCard } from '../components/DeskShareCard'
import { NightBoard } from '../components/NightBoard'
import { readNightSave } from '../game/nightMarks'
import { bestOf, publishNightScore } from '../lib/nightBoard'
import { formatUpdatesUntil, getSubscription } from '../lib/subscription'
import type { ViewId } from '../lib/nav'
import { useAccount } from 'wagmi'

type Props = { onNavigate: (id: ViewId, projectId?: string) => void }

export function Account({ onNavigate }: Props) {
  const [xpTick, setXpTick] = useState(0)
  const [boardTick, setBoardTick] = useState(0)
  const { address } = useAccount()
  const sub = getSubscription()
  const updatesLabel = formatUpdatesUntil(sub.updatesUntil)

  useEffect(() => {
    const save = readNightSave()
    if (save.total > 0) publishNightScore(address ?? null, save.total, bestOf(save.best), true)
    setBoardTick((n) => n + 1)
  }, [address])

  return (
    <section className="page account-page">
      <div className="page-intro row-gap">
        <HoodMark size={56} variant="photo" className="account-mascot" />
        <div>
          <p className="eyebrow">Profile · Wallet</p>
          <h1>Account</h1>
          <p className="muted">
            XP, level, and balances live here — not in the navbar. Plan:{' '}
            <strong>{sub.label}</strong>
            {updatesLabel ? (
              <>
                {' '}
                · Updates covered until <strong>{updatesLabel}</strong>
              </>
            ) : null}
          </p>
        </div>
      </div>


      <DeskShareCard />

      <article className="card night-board-card">
        <div className="row-between">
          <div>
            <p className="eyebrow">The wood</p>
            <h2 className="section-title">Who came home</h2>
          </div>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => onNavigate('dark')}>
            Stay dark →
          </button>
        </div>
        <p className="muted">
          A clear run writes the total onto this profile card. Open someone else’s card and their gold joins the board.
        </p>
        <NightBoard key={boardTick} highlight={address ?? null} />
      </article>

      <div className="featured-nft-strip account-nft-strip" aria-label="Featured NFT collections">
        <div className="row-gap" style={{ justifyContent: 'space-between', width: '100%' }}>
          <p className="rail-label">Featured collections</p>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => onNavigate('nfts')}>
            All NFTs →
          </button>
        </div>
        <DogiHoodCard variant="featured" showHolderToggle />
        <HoodSeederCard variant="featured" showHolderToggle />
        <InnerCircleCard variant="featured" showHolderToggle />
      </div>

      <div className="account-grid">
        <article className="card account-xp-card">
          <h2 className="section-title">Progress</h2>
          <p className="muted">Level and streak live on this desk. The pool log is the ledger.</p>
          <div className="mt">
            <XpChip
              tick={xpTick}
              onClick={() => {
                setXpTick((t) => t + 1)
                onNavigate('rewards')
              }}
            />
          </div>
          <div className="account-plan-box mt">
            <p className="rail-label">Subscription</p>
            <p>
              <strong className="accent-text">{sub.label}</strong>
              {sub.stripeCustomerId ? (
                <span className="tiny muted"> · Stripe customer linked</span>
              ) : (
                <span className="tiny muted"> · local entitlement</span>
              )}
            </p>
            {updatesLabel ? (
              <p className="tiny muted">Updates covered until {updatesLabel}</p>
            ) : (
              <p className="tiny muted">No 6‑month updates entitlement (activate Desk / Desk+)</p>
            )}
          </div>
          <div className="cta-row mt">
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => onNavigate('rewards')}>
              Ledger →
            </button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => onNavigate('subscribe')}>
              Manage plan →
            </button>
          </div>
        </article>

        <WalletPanel variant="full" className="card" />
      </div>
    </section>
  )
}
