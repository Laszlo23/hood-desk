import { useEffect, useState } from 'react'
import { vetToken, type VetInput } from '../../lib/trade/vet'
import type { TradeToken, VetResult } from '../../lib/trade/types'

type Props = {
  token: TradeToken
  wallet?: string | null
  open: boolean
  onClose: () => void
  onResult: (r: VetResult) => void
  /** When used as gate before trade */
  gateMode?: boolean
  onProceed?: () => void
}

export function VetPanel({
  token,
  wallet,
  open,
  onClose,
  onResult,
  gateMode,
  onProceed,
}: Props) {
  const [address, setAddress] = useState(token.address)
  const [website, setWebsite] = useState(token.socials?.website || '')
  const [twitter, setTwitter] = useState(token.socials?.twitter || '')
  const [farcaster, setFarcaster] = useState(token.socials?.farcaster || '')
  const [result, setResult] = useState<VetResult | null>(null)
  const [ack, setAck] = useState(false)

  useEffect(() => {
    if (!open) return
    setAddress(token.address)
    setWebsite(token.socials?.website || '')
    setTwitter(token.socials?.twitter || '')
    setFarcaster(token.socials?.farcaster || '')
    setResult(null)
    setAck(false)
  }, [open, token])

  useEffect(() => {
    if (!open || !gateMode) return
    const input: VetInput = {
      address: token.address,
      website: token.socials?.website,
      twitter: token.socials?.twitter,
      farcaster: token.socials?.farcaster,
      wallet,
      token,
    }
    const r = vetToken(input)
    setResult(r)
    onResult(r)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, gateMode, token.address])

  if (!open) return null

  const run = () => {
    const input: VetInput = {
      address,
      website,
      twitter,
      farcaster,
      wallet,
      token: { ...token, address },
    }
    const r = vetToken(input)
    setResult(r)
    onResult(r)
  }

  const needsAck = result && result.verdict !== 'Likely real'

  return (
    <div className="vet-overlay" role="dialog" aria-modal="true" aria-label="AI project check">
      <div className="vet-modal card">
        <div className="vet-head">
          <div>
            <p className="eyebrow">AI project check</p>
            <h3>Is this real?</h3>
          </div>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>
            Close
          </button>
        </div>

        <p className="muted tiny">
          Rule-based heuristic (Desk skills style). Not an audit. Helps decide before you simulate a
          trade.
        </p>

        <label className="field">
          <span>Token address</span>
          <input
            className="input mono"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="0x…"
          />
        </label>
        <div className="form-grid vet-socials">
          <label className="field">
            <span>Website</span>
            <input className="input" value={website} onChange={(e) => setWebsite(e.target.value)} />
          </label>
          <label className="field">
            <span>X / Twitter</span>
            <input className="input" value={twitter} onChange={(e) => setTwitter(e.target.value)} />
          </label>
          <label className="field">
            <span>Farcaster</span>
            <input
              className="input"
              value={farcaster}
              onChange={(e) => setFarcaster(e.target.value)}
            />
          </label>
        </div>

        <button type="button" className="btn btn-primary" onClick={run}>
          Run Vet
        </button>

        {result && (
          <div className={`vet-result verdict-${result.verdict.replace(/\s+/g, '-').toLowerCase()}`}>
            <div className="vet-score-row">
              <strong>{result.verdict}</strong>
              <span className="mono accent">{result.score}/100</span>
            </div>
            <ul className="vet-reasons">
              {result.reasons.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>

            {gateMode && (
              <div className="vet-gate">
                {needsAck && (
                  <label className="ack-row">
                    <input
                      type="checkbox"
                      checked={ack}
                      onChange={(e) => setAck(e.target.checked)}
                    />
                    <span>I understand the risk and want to proceed with a local simulate</span>
                  </label>
                )}
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={Boolean(needsAck && !ack)}
                  onClick={() => {
                    onProceed?.()
                    onClose()
                  }}
                >
                  {needsAck ? 'Proceed · I understand' : 'Proceed to simulate'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
