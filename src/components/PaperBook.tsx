import { useEffect, useState } from 'react'
import {
  hoodPerEth,
  markPaper,
  PAPER_START_ETH,
  runPaper,
  type PaperBook as Book,
  type PaperMark,
} from '../lib/paper/book'
import { loadHoodPricePath } from '../lib/trade/poolCandles'

function ethText(n: number): string {
  const digits = Math.abs(n) >= 0.01 ? 4 : 6
  return n.toLocaleString('en-US', { maximumFractionDigits: digits })
}

function when(at: number): string {
  return new Date(at * 1000).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function PaperBook() {
  const [book, setBook] = useState<Book | null>(null)
  const [mark, setMark] = useState<PaperMark | null>(null)
  const [prints, setPrints] = useState(0)
  const [error, setError] = useState(false)

  useEffect(() => {
    let live = true
    loadHoodPricePath()
      .then((path) => {
        if (!live) return
        const next = runPaper(path)
        const price = path.length > 0 ? path[path.length - 1].price : 0
        setPrints(path.length)
        setBook(next)
        setMark(price > 0 ? markPaper(next, price) : null)
      })
      .catch(() => {
        if (live) setError(true)
      })
    return () => {
      live = false
    }
  }, [])

  const recent = book ? book.fills.slice(-6).reverse() : []

  return (
    <article className="card paper-book">
      <p className="eyebrow">Paper</p>
      <h2 className="section-title">The agent&apos;s book</h2>
      <p className="muted">
        The agent starts with {PAPER_START_ETH} paper ETH. It buys 0.1 when the bag is empty, buys
        another 0.1 when the pool is 4% under its average, and sells a quarter when the pool is 6%
        over it. Each fill is a real $HOOD/WETH print. A loss stays on the book. None of this signs
        a wallet.
      </p>
      {error ? <p className="muted">The pool path did not load. The book stays closed.</p> : null}
      {!book && !error ? <p className="muted">Reading the pool prints…</p> : null}
      {book && mark ? (
        <>
          <p className="paper-pnl">
            {mark.pnlEth > 0 ? 'Up ' : mark.pnlEth < 0 ? 'Down ' : 'Flat '}
            <b>
              {mark.pnlEth > 0 ? '+' : ''}
              {ethText(mark.pnlEth)} ETH
            </b>
            <span className="tiny muted">
              {' '}
              on {PAPER_START_ETH} paper ETH · {prints.toLocaleString('en-US')} prints
            </span>
          </p>
          <p className="muted">
            {mark.sells === 0
              ? 'No closed round trip yet. The bag is still open.'
              : `${mark.wins} closed in profit, ${mark.losses} closed at a loss, out of ${mark.sells} sales.`}{' '}
            {mark.buys} buys. Cash {ethText(book.cashEth)} paper ETH. The bag is about{' '}
            {ethText(mark.bagEth)} paper ETH of HOOD, marked at{' '}
            {hoodPerEth(mark.price).toLocaleString('en-US', { maximumFractionDigits: 0 })} HOOD per 1
            ETH.
          </p>
          {recent.length > 0 ? (
            <ol className="paper-fills">
              {recent.map((fill) => (
                <li key={`${fill.at}-${fill.side}-${fill.eth}`}>
                  <b>{fill.side === 'buy' ? 'Buy' : 'Sell'}</b>
                  <span>
                    {ethText(fill.eth)} ETH · {when(fill.at)}
                  </span>
                  <span className="tiny muted">{fill.note}</span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="muted">No fill yet. The path has no price the rule can use.</p>
          )}
        </>
      ) : null}
    </article>
  )
}
