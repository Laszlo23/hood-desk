import { useState } from 'react'
import { isAddress } from 'viem'
import type { TradeToken } from '../../lib/trade/types'
import { VerifiedBadge } from '../VerifiedBadge'

type Props = {
  tokens: TradeToken[]
  selected: TradeToken
  onSelect: (t: TradeToken) => void
  onPasteAddress: (address: string) => void
}

export function TokenPicker({ tokens, selected, onSelect, onPasteAddress }: Props) {
  const [open, setOpen] = useState(false)
  const [paste, setPaste] = useState('')
  const [err, setErr] = useState<string | null>(null)

  const submitPaste = () => {
    const a = paste.trim()
    if (!isAddress(a)) {
      setErr('Paste a valid 0x address (42 chars).')
      return
    }
    setErr(null)
    onPasteAddress(a)
    setPaste('')
    setOpen(false)
  }

  return (
    <div className="token-picker">
      <button
        type="button"
        className="token-picker-trigger"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className="token-avatar" aria-hidden>
          {selected.avatarEmoji}
        </span>
        <span className="token-picker-meta">
          <strong className="token-name-row">
            {selected.symbol}
            <VerifiedBadge address={selected.address} />
            <span>/{selected.quote}</span>
          </strong>
          <span className="muted tiny truncate">{selected.name}</span>
        </span>
        <span className="muted">▾</span>
      </button>

      {open && (
        <div className="token-picker-dropdown">
          <div className="token-paste-row">
            <input
              className="input mono"
              placeholder="Paste token 0x…"
              value={paste}
              onChange={(e) => setPaste(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submitPaste()}
            />
            <button type="button" className="btn btn-ghost btn-sm" onClick={submitPaste}>
              Load
            </button>
          </div>
          {err && <p className="form-err tiny">{err}</p>}
          <ul className="token-picker-list">
            {tokens.map((t) => (
              <li key={t.address}>
                <button
                  type="button"
                  className={`token-picker-item${t.address === selected.address ? ' active' : ''}`}
                  onClick={() => {
                    onSelect(t)
                    setOpen(false)
                  }}
                >
                  <span className="token-avatar">{t.avatarEmoji}</span>
                  <span>
                    <strong className="token-name-row">
                      {t.symbol}
                      <VerifiedBadge address={t.address} />
                      <span>/{t.quote}</span>
                    </strong>
                    <span className="muted tiny block">{t.name}</span>
                  </span>
                  {t.badges.includes('Demo') && <span className="badge-mini">demo</span>}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
