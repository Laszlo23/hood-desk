import { useEffect } from 'react'
import { getBlogPost } from './blog'
import { hashForView, type ViewId } from './nav'

const SITE = 'https://doghood.aibusiness.fun'
const DEFAULT_IMAGE = `${SITE}/og.jpg?v=20261001`
const STREET_IMAGE = `${SITE}/og-street.jpg?v=20261001`

type PageMeta = {
  title: string
  description: string
  image?: string
}

const PAGES: Record<ViewId, PageMeta> = {
  landing: {
    title: 'Night Ledger · $HOOD on Robinhood Chain',
    description:
      'A free app for the $HOOD pool. Your wallet signs the swap. The ledger writes it down. The story and the game are for fun.',
  },
  trade: {
    title: 'Trade · Night Ledger',
    description:
      '$HOOD/WETH market swaps sign on Uniswap. The chart reads pool swaps. Other pairs and order types stay on the desk.',
  },
  community: {
    title: 'The pool · Night Ledger',
    description: 'Night Ledger on Robinhood Chain. $HOOD swaps are wallet-signed. The agent does not place orders.',
  },
  status: {
    title: 'Desk status · Night Ledger',
    description: 'Live desk status for Night Ledger on Robinhood Chain: token, pool, and NFT wallets.',
  },
  skills: {
    title: 'Skill Market · Night Ledger',
    description: 'Follow trading bots on Night Ledger. Creator credits stay on a local ledger until chain fees are real.',
  },
  terminal: {
    title: 'Terminal · Night Ledger',
    description: 'Chat the HOOD agent. Fair-launch notes, wallet reads, and desk ops on Robinhood Chain.',
  },
  rewards: {
    title: 'Ledger · Night Ledger',
    description: 'The $HOOD/WETH swap ledger. Each row is a Uniswap transaction. The fee stays in the position.',
  },
  blog: {
    title: 'Hood Street notes · Night Ledger',
    description:
      'What Hood Street is minting, the $HOOD launch, and CCFF00 wallet notes. Written on the desk, checked against chain.',
    image: STREET_IMAGE,
  },
  nfts: {
    title: 'NFTs and token-bound wallets · Night Ledger',
    description:
      'DogiHood and CCFF00 on Robinhood Chain. Each NFT controls an ERC-6551 wallet. Send $HOOD in and it moves with the NFT.',
  },
  hood: {
    title: '$HOOD token · Night Ledger',
    description:
      '$HOOD is live at 0xC7749BCFDC8d06FC246be556f4EAD75Ac7E1320c. Fixed 1B supply, mint-once, exact match on Sourcify.',
  },
  lore: {
    title: 'Legend · Night Ledger',
    description:
      'The Robin Hood story, told as a name. Each chapter opens a real page: the coin, the pool, the ledger, the marks.',
  },
  dark: {
    title: 'Stay dark · Night Ledger',
    description: 'A small game on Night Ledger, for fun. Points stay on the card. The coin and the pool are the useful part.',
  },
  account: {
    title: 'Account · Night Ledger',
    description: 'Your Night Ledger wallet, subscription, and NFT-bound balances on Robinhood Chain.',
  },
  card: {
    title: 'Desk card · Night Ledger',
    description: 'A shareable Night Ledger card. Level, mornings, signed swaps, and marks held on Robinhood Chain.',
  },
  projects: {
    title: 'Projects · Night Ledger',
    description: 'Fair-launch projects on Night Ledger. Fixed supply, no invented DEX routers.',
  },
  project: {
    title: 'Project · Night Ledger',
    description: 'Project detail on Night Ledger. Fair-launch checklist and token address when you have one.',
  },
  create: {
    title: 'Create a project · Night Ledger',
    description: 'Start a fair-launch project on Night Ledger. Supply, symbol, and the launch checklist.',
  },
  ops: {
    title: 'Ops · Night Ledger',
    description: 'How the Night Ledger business runs: agent, plans, and the live $HOOD pool.',
  },
  revenue: {
    title: 'Revenue · Night Ledger',
    description: 'Desk revenue metrics. Simulated fee splits stay labeled until chain fees are real.',
  },
  subscribe: {
    title: 'Subscribe · Night Ledger',
    description: 'Starter $4.99, Desk $9.99, Desk+ $19.99 per month. Live Stripe Checkout on Night Ledger.',
  },
  terms: {
    title: 'Terms · Night Ledger',
    description: 'Rules for using Night Ledger. This book is not Hood Street and not DogiHood. Swaps sign in your wallet.',
  },
  privacy: {
    title: 'Privacy · Night Ledger',
    description: 'What Night Ledger keeps in the browser, what the desk stores, and what Stripe handles at checkout.',
  },
  disclaimer: {
    title: 'Disclaimer · Night Ledger',
    description: 'Night Ledger is not financial advice. $HOOD can lose value. Desk points are not a payout.',
  },
}

function setMeta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

export function usePageSeo(view: ViewId, blogSlug?: string) {
  useEffect(() => {
    const page = PAGES[view]
    let title = page.title
    let description = page.description
    let image = page.image ?? DEFAULT_IMAGE
    let hash = hashForView(view)

    if (view === 'blog' && blogSlug) {
      const post = getBlogPost(blogSlug)
      if (post) {
        title = `${post.title} · Night Ledger`
        description = post.body.replace(/[#*`[\]]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 180)
        hash = hashForView('blog', blogSlug)
        image = STREET_IMAGE
      }
    }

    const url = view === 'landing' && !blogSlug ? `${SITE}/` : `${SITE}/${hash}`
    document.title = title
    setMeta('name', 'description', description)
    setMeta('property', 'og:title', title)
    setMeta('property', 'og:description', description)
    setMeta('property', 'og:url', url)
    setMeta('property', 'og:image', image)
    setMeta('property', 'og:image:secure_url', image)
    setMeta('property', 'og:image:alt', title)
    setMeta('name', 'twitter:title', title)
    setMeta('name', 'twitter:description', description)
    setMeta('name', 'twitter:image', image)
    setMeta('name', 'twitter:image:alt', title)
    const canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]')
    if (canonical) canonical.href = url
  }, [view, blogSlug])
}
