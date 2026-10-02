import { useEffect, useState } from 'react'
import { HoodMark } from '../components/HoodMark'
import {
  activateTier,
  downgradeToFree,
  formatUpdatesUntil,
  getSubscription,
  TIERS,
  type SubTier,
} from '../lib/subscription'
import {
  redirectToCheckout,
  stripeConfigured,
  verifyCheckoutSession,
  type PaidTier,
} from '../lib/stripe/client'
import type { ViewId } from '../lib/nav'

type Props = { onNavigate: (id: ViewId, projectId?: string) => void }

function hashQuery(): URLSearchParams {
  const hash = window.location.hash || ''
  const q = hash.includes('?') ? hash.slice(hash.indexOf('?') + 1) : ''
  return new URLSearchParams(q)
}

export function Subscribe({ onNavigate }: Props) {
  const [state, setState] = useState(() => getSubscription())
  const [flash, setFlash] = useState<string | null>(null)
  const [busy, setBusy] = useState<SubTier | null>(null)
  const [stripeOk] = useState(() => stripeConfigured())
  const [verifying, setVerifying] = useState(false)

  useEffect(() => {
    const params = hashQuery()
    const success = params.get('success') === '1'
    const sessionId = params.get('session_id')
    const canceled = params.get('canceled') === '1'

    if (canceled) {
      setFlash('Checkout canceled. No charge.')
      window.setTimeout(() => setFlash(null), 4000)
      window.history.replaceState(null, '', '#/subscribe')
      return
    }

    if (!success || !sessionId) return

    let cancelled = false
    setVerifying(true)
    void (async () => {
      try {
        const session = await verifyCheckoutSession(sessionId)
        const tierRaw = (session.metadata?.tier || 'desk') as SubTier
        const tier: SubTier =
          tierRaw === 'starter' || tierRaw === 'desk' || tierRaw === 'desk_plus' ? tierRaw : 'desk'
        if (session.payment_status === 'paid' || session.status === 'complete') {
          if (cancelled) return
          const next = activateTier(tier, {
            stripeSessionId: session.id,
            stripeCustomerId: session.customer,
          })
          setState(next)
          setFlash(
            `Stripe unlocked **${next.label}**` +
              (next.updatesUntil
                ? ` · updates until ${formatUpdatesUntil(next.updatesUntil)}`
                : ''),
          )
        } else {
          setFlash(`Session status: ${session.status} / ${session.payment_status}`)
        }
      } catch (e) {
        setFlash(
          e instanceof Error
            ? e.message
            : 'Could not verify Stripe session — is the :8787 server running?',
        )
      } finally {
        if (!cancelled) setVerifying(false)
        window.history.replaceState(null, '', '#/subscribe')
        window.setTimeout(() => setFlash(null), 6000)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const activateDemo = (tier: SubTier) => {
    if (tier === 'free') {
      setState(downgradeToFree())
      setFlash('Back on Free — demo entitlement cleared.')
    } else {
      setState(activateTier(tier))
      const label = TIERS.find((t) => t.id === tier)?.name || tier
      setFlash(`Activated ${label} (demo) — no real charge.`)
    }
    window.setTimeout(() => setFlash(null), 3500)
  }

  const checkout = async (tier: PaidTier) => {
    setBusy(tier)
    setFlash(null)
    try {
      await redirectToCheckout(tier)
    } catch (e) {
      setFlash(
        e instanceof Error
          ? e.message
          : 'Checkout did not open. Try again in a moment.',
      )
      window.setTimeout(() => setFlash(null), 5000)
    } finally {
      setBusy(null)
    }
  }

  const updatesLabel = formatUpdatesUntil(state.updatesUntil)

  return (
    <section className="page subscribe-page">
      <div className="page-intro subscribe-hero">
        <HoodMark size={72} variant="photo" bounce className="subscribe-mascot" />
        <div>
          <p className="eyebrow">Plans</p>
          <h1>Subscribe</h1>
          <p className="muted">
            Free covers the swap, the ledger, and a few question lists. Desk and Desk+ add more
            lists in this browser, drafts you post yourself, and six months of product updates.
          </p>
          <p className="muted mt">
            Ask answers questions and can draft a post. It does not place a swap, and it does not
            book a trading profit. The desk&apos;s fee is the 1% that stays in the $HOOD pool
            position. A plan does not pay that fee out. Showing up is rewarded in desk points, on
            the card, for anyone.
          </p>
          <p className="tiny muted mt">
            Current plan: <strong className="accent-text">{state.label}</strong>
            {state.activatedAt ? ` · since ${new Date(state.activatedAt).toLocaleDateString()}` : ''}
            {updatesLabel ? (
              <>
                {' '}
                · Updates covered until <strong>{updatesLabel}</strong>
              </>
            ) : null}
          </p>
        </div>
      </div>

      {!stripeOk && (
        <div className="card subscribe-stripe-warn" role="status">
          <p className="section-title">Add Stripe keys</p>
          <p className="muted">
            Set <code className="inline-code">VITE_STRIPE_PUBLISHABLE_KEY</code> and price IDs{' '}
            <code className="inline-code">VITE_STRIPE_PRICE_STARTER|DESK|DESK_PLUS</code> in{' '}
            <code className="inline-code">.env</code>, plus{' '}
            <code className="inline-code">STRIPE_SECRET_KEY</code> for the local server on{' '}
            <code className="inline-code">:8787</code>. See <code className="inline-code">.env.example</code>{' '}
            and <code className="inline-code">server/README.md</code>. Until then, a preview button
            can open a plan in this browser. It does not charge.
          </p>
        </div>
      )}

      {(flash || verifying) && (
        <p className="trade-flash subscribe-flash" role="status">
          {verifying ? 'Verifying Stripe session…' : flash}
        </p>
      )}

      <div className="subscribe-grid">
        {TIERS.map((tier) => {
          const active = state.tier === tier.id
          const paid = Boolean(tier.paid)
          return (
            <article
              key={tier.id}
              className={`card subscribe-card${tier.highlight ? ' highlight' : ''}${active ? ' current' : ''}`}
            >
              <div className="subscribe-card-head">
                <h2 className="section-title">{tier.name}</h2>
                <p className="subscribe-price mono">{tier.price}</p>
              </div>
              <p className="muted">{tier.tagline}</p>
              <ul className="subscribe-perks">
                {tier.perks.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
              {active ? (
                <button type="button" className="btn btn-ghost" disabled>
                  Current plan
                </button>
              ) : tier.id === 'free' ? (
                <button type="button" className="btn btn-ghost" onClick={() => activateDemo('free')}>
                  Switch to Free
                </button>
              ) : (
                <div className="subscribe-actions">
                  {stripeOk ? (
                    <button
                      type="button"
                      className="btn btn-primary"
                      disabled={busy === tier.id}
                      onClick={() => checkout(tier.id as PaidTier)}
                    >
                      {busy === tier.id ? 'Redirecting…' : `Subscribe · ${tier.price}`}
                    </button>
                  ) : null}
                  {stripeOk ? null : (
                    <button type="button" className="btn btn-primary" onClick={() => activateDemo(tier.id)}>
                      Preview {tier.name}
                    </button>
                  )}
                </div>
              )}
              {paid && !active ? (
                <p className="tiny muted mt">
                  {stripeOk
                    ? 'Stripe Checkout. The plan unlocks after the receipt is paid.'
                    : 'Preview only until Stripe keys are set.'}
                </p>
              ) : null}
            </article>
          )
        })}
      </div>

      <div className="card mt subscribe-social">
        <p className="eyebrow">Included on Desk / Desk+</p>
        <h2 className="section-title">Social media growth</h2>
        <p className="muted">
          Ask can draft a post for X or Farcaster. You publish it. Starter includes the drafts.
          Desk and Desk+ keep the drafts and add six months of product updates.
        </p>
        <p className="tiny muted mt">
          Desk &amp; Desk+ also set entitlement <code className="inline-code">updatesUntil</code> = now +
          6 months — shown here and on Account as &quot;Updates covered until …&quot;.
        </p>
      </div>

      <div className="card mt subscribe-note">
        <p className="muted">
          A paid plan is saved in this browser after Stripe confirms the receipt. The desk does
          not trade for you.
        </p>
        <div className="cta-row mt">
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => onNavigate('rewards')}>
            View the ledger →
          </button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => onNavigate('skills')}>
            Skill Market →
          </button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => onNavigate('account')}>
            Account →
          </button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => onNavigate('landing')}>
            Home →
          </button>
        </div>
      </div>
    </section>
  )
}
