/**
 * Paper book for the HOOD agent.
 * Every fill uses a real $HOOD/WETH pool print. Nothing here signs a wallet.
 */

export const PAPER_START_ETH = 1
export const PAPER_SLICE_ETH = 0.1
/** Buy another slice when the pool is this far under the average entry. */
export const PAPER_DIP = 0.04
/** Sell a quarter of the bag when the pool is this far over the average entry. */
export const PAPER_TAKE = 0.06

export type PaperFill = {
  at: number
  side: 'buy' | 'sell'
  eth: number
  hood: number
  /** ETH per 1 HOOD */
  price: number
  /** ETH gained or lost on a sell, against the cost of the coins sold. */
  closedEth: number | null
  note: string
}

export type PaperBook = {
  cashEth: number
  hood: number
  /** ETH still tied up in the open bag. */
  costEth: number
  fills: PaperFill[]
}

export type PaperMark = {
  price: number
  equityEth: number
  pnlEth: number
  pnlPct: number
  bagEth: number
  unrealizedEth: number
  buys: number
  sells: number
  wins: number
  losses: number
}

const MIN_STEP = 0.002

export function emptyPaper(): PaperBook {
  return { cashEth: PAPER_START_ETH, hood: 0, costEth: 0, fills: [] }
}

function buy(book: PaperBook, at: number, price: number, ethIn: number, note: string): void {
  const eth = Math.min(ethIn, book.cashEth)
  if (!(eth > 0) || !(price > 0)) return
  const hood = eth / price
  book.cashEth -= eth
  book.hood += hood
  book.costEth += eth
  book.fills.push({ at, side: 'buy', eth, hood, price, closedEth: null, note })
}

function sell(book: PaperBook, at: number, price: number, hoodIn: number, note: string): void {
  if (!(book.hood > 0) || !(price > 0)) return
  const hood = Math.min(hoodIn, book.hood)
  if (!(hood > 0)) return
  const eth = hood * price
  const costOut = book.costEth * (hood / book.hood)
  book.hood -= hood
  book.costEth -= costOut
  if (book.hood < 1e-12) {
    book.hood = 0
    book.costEth = 0
  }
  book.cashEth += eth
  book.fills.push({
    at,
    side: 'sell',
    eth,
    hood,
    price,
    closedEth: eth - costOut,
    note,
  })
}

/**
 * Walk pool prints in time order.
 * Open with one slice. Buy another slice 4% under the average. Sell a quarter 6% over it.
 */
export function runPaper(points: { time: number; price: number }[]): PaperBook {
  const book = emptyPaper()
  const ordered = points
    .filter((point) => point.price > 0 && point.time > 0)
    .slice()
    .sort((a, b) => a.time - b.time)

  let last = 0
  for (const point of ordered) {
    if (last > 0 && Math.abs(point.price - last) / last < MIN_STEP) continue
    last = point.price
    const avg = book.hood > 0 ? book.costEth / book.hood : 0
    if (book.hood === 0 && book.cashEth >= PAPER_SLICE_ETH) {
      buy(book, point.time, point.price, PAPER_SLICE_ETH, 'Opened the bag at the pool price.')
    } else if (avg > 0 && point.price <= avg * (1 - PAPER_DIP) && book.cashEth >= PAPER_SLICE_ETH) {
      buy(book, point.time, point.price, PAPER_SLICE_ETH, 'Pool is 4% under the average entry.')
    } else if (avg > 0 && point.price >= avg * (1 + PAPER_TAKE)) {
      sell(book, point.time, point.price, book.hood * 0.25, 'Pool is 6% over the average entry.')
    }
  }
  return book
}

export function markPaper(book: PaperBook, price: number): PaperMark {
  const bagEth = price > 0 ? book.hood * price : 0
  const equityEth = book.cashEth + bagEth
  const pnlEth = equityEth - PAPER_START_ETH
  const sells = book.fills.filter((fill) => fill.side === 'sell')
  return {
    price,
    equityEth,
    pnlEth,
    pnlPct: pnlEth / PAPER_START_ETH,
    bagEth,
    unrealizedEth: bagEth - book.costEth,
    buys: book.fills.filter((fill) => fill.side === 'buy').length,
    sells: sells.length,
    wins: sells.filter((fill) => (fill.closedEth ?? 0) > 0).length,
    losses: sells.filter((fill) => (fill.closedEth ?? 0) < 0).length,
  }
}

export function hoodPerEth(price: number): number {
  if (!(price > 0)) return 0
  return 1 / price
}

function ethText(n: number): string {
  const abs = Math.abs(n)
  const digits = abs >= 0.01 ? 4 : 6
  return n.toLocaleString('en-US', { maximumFractionDigits: digits })
}

export function paperReply(book: PaperBook, mark: PaperMark): string {
  const sign = mark.pnlEth > 0 ? '+' : ''
  const round =
    mark.sells === 0
      ? 'No closed round trip yet. The bag is still open.'
      : `${mark.wins} closed in profit, ${mark.losses} closed at a loss, out of ${mark.sells} sales.`
  const verdict =
    mark.pnlEth > 0
      ? `The paper book is up ${sign}${ethText(mark.pnlEth)} ETH on 1 paper ETH.`
      : mark.pnlEth < 0
        ? `The paper book is down ${ethText(mark.pnlEth)} ETH on 1 paper ETH.`
        : 'The paper book is flat.'
  return [
    '**Paper book**',
    '',
    verdict,
    round,
    `${mark.buys} buys. Cash ${ethText(book.cashEth)} paper ETH. Bag about ${ethText(mark.bagEth)} paper ETH of HOOD.`,
    `Marked at ${hoodPerEth(mark.price).toLocaleString('en-US', { maximumFractionDigits: 0 })} HOOD per 1 ETH.`,
    '',
    'Rule: open with 0.1 paper ETH, buy another 0.1 when the pool is 4% under the average, sell a quarter when it is 6% over. Fills use pool prints only. This does not sign a wallet, and it is not a payout.',
    '',
    'The book is on **#/community**.',
  ].join('\n')
}
