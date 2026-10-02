import type { ViewId } from './nav'

export type StoryChapter = {
  id: string
  title: string
  /** One line on the home walk. */
  line: string
  /** The full telling on the legend page. */
  body: string
  image?: string
  door: ViewId
  doorLabel: string
}

/** The project, told in order. Each chapter opens a real page. */
export const STORY: StoryChapter[] = [
  {
    id: 'wood',
    title: 'The wood',
    line: 'The forest is the name. The app is one coin, one pool, and a ledger anyone can read.',
    body: 'In the old wood, outlaws took from the rich so the many could eat. Hood Street keeps that myth as a name. The app is the coin, the pool, and a book anyone can read. Stay dark is a small game beside it, for fun.',
    image: '/lore/hood-forest.jpg',
    door: 'lore',
    doorLabel: 'The legend',
  },
  {
    id: 'coin',
    title: 'The coin',
    line: '$HOOD was minted once. One billion tokens. No tax, and no second mint.',
    body: '$HOOD was struck once on Robinhood Chain. The supply is 1,000,000,000. Nothing is taken when it moves, and the contract cannot mint again.',
    image: '/lore/hood-coin.jpg',
    door: 'hood',
    doorLabel: 'The coin',
  },
  {
    id: 'bow',
    title: 'The bow',
    line: 'The bow draws when your wallet signs. The desk does not place the order.',
    body: 'A swap happens only when your wallet signs it. The desk does not hold the key, and it does not send the trade for you.',
    image: '/lore/hood-bow.jpg',
    door: 'trade',
    doorLabel: 'Trade',
  },
  {
    id: 'pool',
    title: 'The pool',
    line: 'One market: $HOOD for WETH. Each swap pays 1%, and the fee stays in the position.',
    body: 'There is one Uniswap pool, $HOOD against WETH. Every swap pays 1%. That fee stays inside the desk’s liquidity position until it is collected.',
    image: '/lore/hood-pool.jpg',
    door: 'community',
    doorLabel: 'The pool',
  },
  {
    id: 'seed',
    title: 'The seed',
    line: 'Bring ETH. The treasury meets you in the pool. 2% of that ETH goes to the cause.',
    body: 'A seed pairs the ETH you bring with treasury $HOOD, in the same pool. Two percent of that ETH is for the cause. The rest deepens the market.',
    image: '/lore/hood-seed.jpg',
    door: 'hood',
    doorLabel: 'Lay a seed',
  },
  {
    id: 'book',
    title: 'The book',
    line: 'The ledger lists every swap the chain already wrote.',
    body: 'The council in the wood kept a map. Here the ledger is that map: every $HOOD swap, in the order the chain recorded it. A row appears only after the swap is real.',
    image: '/lore/hood-council.jpg',
    door: 'rewards',
    doorLabel: 'The ledger',
  },
  {
    id: 'street',
    title: 'The street',
    line: 'Notes are what Hood Street said. The thank-you on that page is the lore.',
    body: 'Notes are Hood Street, written down on this desk. The thank-you is the lore in one piece: a free app, a real pool, and a small game. The skills are question lists. Following one changes what Ask can say. It does not move a token.',
    image: '/lore/hood-street.jpg',
    door: 'blog',
    doorLabel: 'Notes',
  },
  {
    id: 'pack',
    title: 'The pack',
    line: 'DogiHood and CCFF00 are Hood Street. Seeder and Inner Circle are this desk.',
    body: 'The hood marks the pack. DogiHood and CCFF00 belong to Hood Street. Hood Seeder and Inner Circle belong to this desk, and the desk wallet is the one that mints them.',
    image: '/lore/hood-seal.jpg',
    door: 'nfts',
    doorLabel: 'Marks',
  },
]

export function storyChapter(id: string): StoryChapter | undefined {
  return STORY.find((chapter) => chapter.id === id)
}
