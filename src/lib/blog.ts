/**
 * Editable Hood Street blog — localStorage `hood-desk:blog:v1`.
 * Admin/edit mode is local (no auth); seed motivational posts.
 */

const KEY = 'hood-desk:blog:v1'

export type BlogPost = {
  id: string
  slug: string
  title: string
  body: string
  /** ISO date */
  date: string
  updatedAt: string
}

function uid(): string {
  return `post_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`
}

function slugify(title: string): string {
  const base = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48)
  return base || `post-${Date.now().toString(36)}`
}

const SEED: BlogPost[] = [
  {
    id: 'post_seed_thank_you',
    slug: 'thank-you-this-is-the-lore',
    title: 'Thank you. This is the lore.',
    body: `Thank you to Hood Street.

This desk is a small app, built for free and for fun. It is not a prize, and it is not something to boast about. The useful part is plain. [$HOOD](https://doghood.aibusiness.fun/#/hood) was minted once, one billion tokens, no tax, and it cannot be minted again. There is one pool. Your wallet signs the swap. The [ledger](https://doghood.aibusiness.fun/#/rewards) writes the row down so anyone can read it.

The Robin Hood story is a name we borrowed, with thanks. In the old wood, people took from the rich so the pack could eat. Hood Street kept that myth and built a block on Robinhood Chain: the Squares, the free mints, and the media room that stays up. This desk is a table on that block. We did not invent the street. We kept a book for the coin that lives here.

[Stay dark](https://doghood.aibusiness.fun/#/dark) is the game, and only the game. Come home with a pack if you want. The points stay on a card. They are not written into the coin, and they are not a mint. Tomorrow the streak pays a few more desk points. That is the fun. The pool is the work.

Thank you to everyone who signed a swap, held a Square, sat in the [HoodStreet Media](https://x.com/HoodStreetMedia) room, and walked Robin home. The wood is still open. The ledger is still the book.`,
    date: '2026-10-02T12:10:00.000Z',
    updatedAt: '2026-10-02T12:10:00.000Z',
  },
  {
    id: 'post_seed_media_oct2',
    slug: 'hood-street-media-2-oct',
    title: 'Hood Street on 2 Oct: the media room, the claim, the mint still soon',
    body: `Read on 2 Oct 2026 from the public sites and the HoodStreet Media room. Nothing here is a transcript of a space we did not hear.

**The room.** [HoodStreet Media](https://x.com/HoodStreetMedia) is the standing 24/7 space for Robinhood NFTs, news, and talk. The last one with a public title we can still open ended 29 Sep 2026: [Unvault alpha](https://x.com/i/spaces/1dxYlaOgyzYJX). The page lists Cashpig as host, and the room includes Hood Street Mini, RoaringPiggy, Aaron from X, Unvault, and a long roll of the block. The page said 8 listeners when it ended. The two before it were [VAMPS minted out](https://x.com/i/spaces/1yGBePymnYEKN) on 28 Sep and [VAMPS mint](https://x.com/i/spaces/1nJOLQOvXlOxR) on 27 Sep. No newer titled space was public when this note was written.

**The account.** [@HoodStreetMini](https://x.com/HoodStreetMini) is still the whitelist dealer. The posts on the profile are the site coming back from a 404, GTD and FCFS drops going live, shipments that sell through, a surprise flash drop, an honorary Mini for Adam Weitsman, and Hood morning. Timing for the mint comes from that account only.

**The site, read again today.** [hoodstreetmini.com](https://hoodstreetmini.com/) still says free mint, Robinhood Chain, soon. 4,269 Minis, 55 one-of-ones, 13 base models, 289 traits. The [claim page](https://hoodstreetmini.com/claim) still shows 384 guaranteed spots across 294 wallets, 1,054 first-come spots across 420 wallets, and 496 wallets on the list. Those counts had not moved since 1 Oct. A first guaranteed spot is 4,269 Hood Bucks with an original post that tags @HoodStreetMini and uses #hoodstreet. A first-come spot is 420. Hood Bucks are play money with no cash value. The site also has Hood Games (Blackjack, video poker, three card poker, street dice, lucky 7s, three cups) and 168 memes free to post.

This desk does not sell Minis and does not run the space.`,
    date: '2026-10-02T12:00:00.000Z',
    updatedAt: '2026-10-02T12:00:00.000Z',
  },
  {
    id: 'post_seed_wl_live',
    slug: 'minis-whitelist-drop-is-live',
    title: 'Hood Street Minis: the whitelist drop is live again',
    body: `Taken from the public [@HoodStreetMini](https://x.com/HoodStreetMini) profile on the evening of 1 Oct 2026.

The account posted that the site had gone to a 404 and was back, and that the **GTD and FCFS whitelist drop is live** at [hoodstreetmini.com](https://hoodstreetmini.com). Earlier the same day they said the next shipment was about half an hour out, and that those packs sell through in minutes. Through the night they ran surprise shipments, posted a sold-out, and said another shipment was coming after a guaranteed package missed transit.

They also added an honorary Mini for Adam Weitsman, a tribute piece in the collection.

The [claim page](https://hoodstreetmini.com/claim), read at the same time, still shows 384 guaranteed spots across 294 wallets, 1,054 first-come spots across 420 wallets, and 496 wallets on the list. A guaranteed spot is still 4,269 Hood Bucks with an original post that tags @HoodStreetMini and uses #hoodstreet, then 10,000 for the second. Skip the post and a guaranteed spot is 42,690. A first-come spot is 420. Hood Bucks are play money with no cash value. The mint page still says soon. Timing comes from that account.

The HoodStreet Media room is the standing space on X. The last one with a public title ended 29 Sep 2026: [Unvault alpha](https://x.com/i/spaces/1dxYlaOgyzYJX).`,
    date: '2026-10-01T17:20:00.000Z',
    updatedAt: '2026-10-01T17:20:00.000Z',
  },
  {
    id: 'post_seed_street_now',
    slug: 'what-hood-street-is-minting',
    title: 'What Hood Street is minting right now',
    body: `Checked 1 Oct 2026 against the official sites and Robinhood Chain.

**CCFF00 is minted out.** The founding collection at \`0x505A22Ffed8d37ebE580FfD98d2Cdb0021189146\` reads a total supply of 10,000 on chain. That is the full set: 9,750 public, 20 founder reserve, 230 project reserve. Each Square is the same neon color, fully onchain, and controls its own ERC-6551 wallet with 10,000 $CCFF00 inside. HoodStreet still says $CCFF00 transfers stay off until the public mint condition is met and the official token is live. The NFT itself can move. Check [My Neon](https://hoodstreet.capital/my-neon) before you assume the token can.

**The live queue is Hood Street Minis.** [hoodstreetmini.com](https://hoodstreetmini.com/) is a free mint of 4,269 pixel Minis on Robinhood Chain, including 55 one-of-ones. The mint page says **soon**. What is open today is the claim: Hood Bucks (play money, no cash value) turn into mint spots, max 5 per wallet and up to 3 guaranteed. On the claim page this afternoon: 384 guaranteed spots claimed across 294 wallets, 1,054 first-come spots across 420 wallets, 496 wallets on the list. CCFF00 Squares are listed as a 1,000 Hood Buck holder bonus, paid once per NFT. Gas is the only mint cost they publish. Official mint timing comes from [@HoodStreetMini](https://x.com/HoodStreetMini).

**The mint that just cleared is VAMPS.** [OpenSea](https://opensea.io/collection/vampsonchain) shows 4,444 / 4,444 on Robinhood Chain. The project said the free mint sold through in about four minutes, with CCFF00 on the allowlist. A floor on OpenSea was around 0.0014 ETH when this was written. Floors move. That number is a snapshot, not a promise.

Hood Desk can already read a CCFF00 or DogiHood wallet and send $HOOD into it. Minis do not have a contract on the desk until the mint is actually live.`,
    date: '2026-10-01T13:10:00.000Z',
    updatedAt: '2026-10-01T13:10:00.000Z',
  },
  {
    id: 'post_seed_minis',
    slug: 'hood-street-minis-spots',
    title: 'Hood Street Minis: spots are open, the mint is not',
    body: `Hood Street Minis is the collection people are lining up for while CCFF00 sits at a full 10,000.

4,269 Minis. 13 base models (Gorilla, Drank Jug, Reaper, Alien, plus tributes). 289 traits. 55 one-of-ones, and they say #420 is rank 1. Art is pixel, the mint is free, and the site still says Robinhood Chain · soon.

The claim desk is the part that is actually running:

- First guaranteed spot is 4,269 Hood Bucks if you post an original with a Mini, tag @HoodStreetMini, and use #hoodstreet. The second is 10,000. Skip the post and a guaranteed spot is 42,690.
- A first-come spot is 420 Hood Bucks and only works while supply lasts.
- Welcome package is 1,000 Hood Bucks for a follow and a reply to the pinned post.
- Holder bonuses they list include 1,000 for a CCFF00 Square, a StonkBroker, or a Chain Mancer.

Hood Bucks are free play money. They say they have no cash value. Spots lock to a wallet. Read the terms on [hoodstreetmini.com/claim](https://hoodstreetmini.com/claim) before you spend them. This desk does not sell Minis and does not hold a mint button for a contract that is not deployed yet.`,
    date: '2026-10-01T13:05:00.000Z',
    updatedAt: '2026-10-01T13:05:00.000Z',
  },
  {
    id: 'post_seed_vamps',
    slug: 'vamps-minted-out',
    title: 'VAMPS minted out: 4,444 of 4,444',
    body: `VAMPS is the Hood Street launch that already finished. OpenSea collection [vampsonchain](https://opensea.io/collection/vampsonchain) shows the full 4,444 supply on Robinhood Chain. The project’s own line: minted out in about four minutes. Different fits, same fangs. Site: [vamps.wtf](https://vamps.wtf).

CCFF00 holders were on that allowlist. A community post from the Hood Street space put secondary volume near $700 in the first stretch and a floor that jumped off free. By the time this note was written, OpenSea’s floor title was about 0.0014 ETH. Treat both as timestamps. The useful part is the shape of these launches: a CCFF00 Square is the membership that gets you into the next free mint, and the mint itself can be gone in minutes.

If you still hold a Square, the wallet inside it is the thing Hood Desk binds to. VAMPS is a separate collection. We are not marking it verified, and we are not routing a trade through it.`,
    date: '2026-10-01T13:00:00.000Z',
    updatedAt: '2026-10-01T13:00:00.000Z',
  },
  {
    id: 'post_seed_hood_live',
    slug: 'hood-is-live',
    title: '$HOOD is live on Robinhood Chain',
    body: `Hood Desk is on the server at https://doghood.aibusiness.fun.

**$HOOD** is the companion token: \`0xC7749BCFDC8d06FC246be556f4EAD75Ac7E1320c\`. Fixed supply 1,000,000,000. Mint-once. No transfer tax. Source is an exact match on Sourcify.

**NFT wallets.** DogiHood and CCFF00 use the HoodStreet ERC-6551 registry. Each NFT has its own wallet. Send $HOOD into that wallet and it moves with the NFT. CCFF00 Square #1 already holds 10,000 official $CCFF00. DogiHood wallets start empty — nothing is preloaded.

**Plans.** Starter $4.99 / Desk $9.99 / Desk+ $19.99 per month. Checkout is live Stripe on the desk. Demo activate is still labeled, for when you want to look around without paying.

**Trade.** $HOOD/WETH is a Uniswap V3 pool. Market buy and sell sign in your wallet, and the chart reads those swaps. The pool is thin. Limit, stop, TWAP, DCA, auto-trade, and the rewards ledger stay on the desk.

Hold the coin. Bind it to a Shiba. Subscribe if you want the desk.`,
    date: '2026-10-01T12:00:00.000Z',
    updatedAt: '2026-10-01T12:00:00.000Z',
  },
  {
    id: 'post_seed_build',
    slug: 'build-on-hood-street',
    title: 'Build on Hood Street',
    body: `Hood Desk is an AI-run trading desk on Robinhood Chain (4663). Create a project, fair-launch a token, and let the fox keep ops online.

A token is on the desk after you deploy it and paste the address. $HOOD swaps sign on Uniswap. There is no separate fee ledger.

Ship fair. Stay neon. #CCFF00.`,
    date: '2026-09-22T10:00:00.000Z',
    updatedAt: '2026-09-22T10:00:00.000Z',
  },
  {
    id: 'post_seed_trade',
    slug: 'trade-skills-rewards',
    title: 'Trade · Skills · Rewards',
    body: `One loop, three doors:

1. **Trade** — wallet-signed $HOOD swaps on Uniswap.
2. **Skill Market** — publish a pack. There is no stand-in bot catalog.
3. **Rewards** — the Uniswap LP fee stays in the position. Nothing else is paid out.

Open the desk, pick a path, keep the streak.`,
    date: '2026-09-28T14:00:00.000Z',
    updatedAt: '2026-09-28T14:00:00.000Z',
  },
  {
    id: 'post_seed_dogihood',
    slug: 'dogihood-pack-pride',
    title: 'DogiHood pack pride on Hood Desk',
    body: `Featured NFT: **DogiHood** — pixel Shibas on Robinhood Chain (4663). Browse the pack on [OpenSea](https://opensea.io/collection/dogihood). Hood Desk keeps the HOOD fox as the agent mark; DogiHood is pack pride for holders.

No promises. Clean pixels. Dogs on-chain.`,
    date: '2026-09-30T08:00:00.000Z',
    updatedAt: '2026-09-30T08:00:00.000Z',
  },
]

function readAll(): BlogPost[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) {
      writeAll(SEED)
      return [...SEED]
    }
    const parsed = JSON.parse(raw) as BlogPost[]
    if (!Array.isArray(parsed) || parsed.length === 0) {
      writeAll(SEED)
      return [...SEED]
    }
    const have = new Set(parsed.map((p) => p.id))
    const missing = SEED.filter((s) => !have.has(s.id))
    if (missing.length === 0) return parsed
    const merged = [...missing, ...parsed]
    writeAll(merged)
    return merged
  } catch {
    writeAll(SEED)
    return [...SEED]
  }
}

function writeAll(posts: BlogPost[]): void {
  localStorage.setItem(KEY, JSON.stringify(posts))
}

export function listBlogPosts(): BlogPost[] {
  return readAll().sort((a, b) => (a.date < b.date ? 1 : -1))
}

export function getBlogPost(slugOrId: string): BlogPost | undefined {
  const q = slugOrId.toLowerCase()
  return listBlogPosts().find((p) => p.slug === q || p.id === slugOrId)
}

export function createBlogPost(input: {
  title: string
  body: string
  date?: string
  slug?: string
}): BlogPost {
  const now = new Date().toISOString()
  const posts = readAll()
  let slug = (input.slug?.trim() || slugify(input.title)).toLowerCase()
  if (posts.some((p) => p.slug === slug)) slug = `${slug}-${uid().slice(-4)}`
  const post: BlogPost = {
    id: uid(),
    slug,
    title: input.title.trim() || 'Untitled',
    body: input.body.trim(),
    date: input.date || now,
    updatedAt: now,
  }
  posts.unshift(post)
  writeAll(posts)
  return post
}

export function updateBlogPost(
  id: string,
  patch: Partial<Pick<BlogPost, 'title' | 'body' | 'date' | 'slug'>>,
): BlogPost | null {
  const posts = readAll()
  const idx = posts.findIndex((p) => p.id === id)
  if (idx < 0) return null
  const next = {
    ...posts[idx],
    ...patch,
    title: patch.title?.trim() ?? posts[idx].title,
    body: patch.body ?? posts[idx].body,
    slug: patch.slug?.trim().toLowerCase() || posts[idx].slug,
    updatedAt: new Date().toISOString(),
  }
  posts[idx] = next
  writeAll(posts)
  return next
}

export function deleteBlogPost(id: string): boolean {
  const posts = readAll()
  const next = posts.filter((p) => p.id !== id)
  if (next.length === posts.length) return false
  writeAll(next)
  return true
}

export { KEY as BLOG_STORAGE_KEY }
