import { hashForView, type ViewId } from '../lib/nav'

export type LegalPageId = 'terms' | 'privacy' | 'disclaimer'

type Props = {
  page: LegalPageId
  onNavigate: (id: ViewId) => void
}

const UPDATED = '3 October 2026'
const SITE = 'https://doghood.aibusiness.fun'

const PAGES: { id: LegalPageId; label: string }[] = [
  { id: 'terms', label: 'Terms' },
  { id: 'privacy', label: 'Privacy' },
  { id: 'disclaimer', label: 'Disclaimer' },
]

export function Legal({ page, onNavigate }: Props) {
  return (
    <section className="page legal-page">
      <div className="page-intro">
        <p className="eyebrow">Night Ledger · {UPDATED}</p>
        <h1>{page === 'terms' ? 'Terms' : page === 'privacy' ? 'Privacy' : 'Disclaimer'}</h1>
        <p className="muted">
          These pages cover {SITE}. Night Ledger is a member’s book. Hood Street is their street. DogiHood is their dogs, at{' '}
          <a href="https://dogihood.com/" target="_blank" rel="noreferrer">
            dogihood.com
          </a>
          .
        </p>
      </div>

      <article className="card legal-copy">
        {page === 'terms' && <Terms />}
        {page === 'privacy' && <Privacy />}
        {page === 'disclaimer' && <Disclaimer />}
      </article>

      <nav className="legal-switch" aria-label="Other legal pages">
        {PAGES.filter((item) => item.id !== page).map((item) => (
          <a
            key={item.id}
            href={hashForView(item.id)}
            onClick={(e) => {
              e.preventDefault()
              onNavigate(item.id)
            }}
          >
            {item.label}
          </a>
        ))}
      </nav>
    </section>
  )
}

function Terms() {
  return (
    <>
      <h2>The book</h2>
      <p>
        Night Ledger is a free site for reading $HOOD on Robinhood Chain, signing your own swaps, keeping notes, and playing a small game. Using the site means you accept these terms.
      </p>
      <h2>What this site is not</h2>
      <p>
        This site is not Hood Street, HoodStreet Media, Street Hood Minis, or CCFF00. It is not DogiHood. The official dog collection is at dogihood.com. A holder check on this site does not make those collections ours.
      </p>
      <h2>Your wallet</h2>
      <p>
        A swap, a seed, or any other chain action is signed in your wallet. Night Ledger does not hold your keys and does not place the order. If a transaction fails, or the pool moves the price, that result is yours.
      </p>
      <h2>The coin and the pool</h2>
      <p>
        $HOOD was minted once. The supply is fixed. Nothing on this site promises that the price will rise, that a fee will be paid out, or that a plan will return money. The 1% pool fee stays in the liquidity position. Desk points, night scores, and streaks are records on the card. They are not ETH, not HOOD, and not a prize you can withdraw.
      </p>
      <h2>Plans</h2>
      <p>
        Starter is $4.99, Desk is $9.99, and Desk+ is $19.99 per month. Checkout is Stripe. A plan unlocks desk features such as an XP boost. It is not a yield, a share of the pool, or a promise that the agent makes a profit. You can cancel in Stripe. A charge that already cleared is handled by Stripe’s own receipt.
      </p>
      <h2>Things people add</h2>
      <p>
        A project listing or a pressed collection is something a visitor puts on the page. A press is not a mint, and OpenSea does not host it. You are responsible for what you submit. We can remove a listing that asks people to send ETH, share a seed phrase, or promises a guaranteed profit.
      </p>
      <h2>The game and the paper book</h2>
      <p>
        Stay dark is a game, for fun. The paper book replays public pool prints with pretend ETH. A paper gain is not live profit and is not proof that a subscription pays for itself.
      </p>
      <h2>The site can change</h2>
      <p>
        Pages, scores, and features can change or go offline. The chain does not. These terms can be updated on this page. The date at the top is the date of this version. If you keep using the site after a change, the new terms apply.
      </p>
    </>
  )
}

function Privacy() {
  return (
    <>
      <h2>What stays in your browser</h2>
      <p>Most of the desk lives in this browser. That includes:</p>
      <ul>
        <li>a desk id, night scores, and the shareable card</li>
        <li>notes cached on this device</li>
        <li>the plan unlocked after checkout, including a Stripe session id</li>
        <li>projects you saved locally, and menu state</li>
      </ul>
      <p>Clearing site data in the browser removes those records from this device. It does not erase a transaction you already signed on chain.</p>
      <h2>What the desk stores</h2>
      <p>
        A homecoming in Stay dark can be posted to the public board with the desk id and, if you connect, the wallet address you choose to send. A builder listing or a pressed collection is stored so other people can read it. Writing your name in the book stores the name on the page and the way back (an X name, a Farcaster name, or an email) with the desk, so a later note can find you. An email is not shown on the page. The server also keeps a short rate-limit record of the IP that posted, so one address cannot flood the board.
      </p>
      <h2>Wallet and chain</h2>
      <p>
        Connecting a wallet uses the wallet you pick, including WalletConnect where that is the path. The address is public on Robinhood Chain once you transact. Reads of token balances and NFT wallets use a public chain connection. Blockscout links leave this site.
      </p>
      <h2>Stripe</h2>
      <p>
        Paid plans open Stripe Checkout. Stripe collects the card and the email on their page. Night Ledger receives the session result so the plan can unlock in this browser. We do not store your card number.
      </p>
      <h2>What we do not do</h2>
      <p>We do not sell personal data. We do not ask for a seed phrase or a private key. A page that does is not this desk.</p>
    </>
  )
}

function Disclaimer() {
  return (
    <>
      <h2>Not advice</h2>
      <p>
        Nothing on Night Ledger is financial, legal, tax, or investment advice. Notes about Hood Street, DogiHood, or any other project are a member writing down what was public. They are not an offer, and they are not a recommendation to buy.
      </p>
      <h2>You can lose the money</h2>
      <p>
        $HOOD is a crypto token. The pool is thin. A swap can move the price against you, and the token can go to zero. Only sign an amount you can afford to lose. Past pool prints, including a paper book that replays them, are not a forecast.
      </p>
      <h2>The agent does not trade</h2>
      <p>
        Ask answers questions. It does not place orders, and it does not earn a profit for you. A subscription does not turn the pool fee into a payout.
      </p>
      <h2>Other people’s projects</h2>
      <p>
        Hood Street, Street Hood Minis, CCFF00, VAMPS, and DogiHood belong to their own teams. DogiHood’s site is dogihood.com. Their mint, their spaces, and their dogs are theirs. A link from this book does not make us their operator.
      </p>
      <h2>Marks on this page</h2>
      <p>
        Seeder and Inner Circle are marks this desk minted. A night score on the card is not written into those tokens. A collection you press here is a picture on the site, not an on-chain mint.
      </p>
    </>
  )
}
