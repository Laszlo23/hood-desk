import { useEffect, useState } from 'react'
import { useAccount } from 'wagmi'
import { fetchNightDesk, pushNightRun, type Jackpot } from '../lib/nightDesk'
import { readNightSave, type NightSave } from '../game/nightMarks'
import { NightBoard } from '../components/NightBoard'
import { shortDeskAddress } from '../lib/deskCard'
import type { BoardRow } from '../lib/nightBoard'
import type { ViewId } from '../lib/nav'
import './street.css'

type Props = {
  onNavigate: (id: ViewId) => void
}

type CheckInState = 'idle' | 'checking' | 'done' | 'error'
type TipState = 'idle' | 'tipping' | 'done' | 'error'

export function Street({ onNavigate }: Props) {
  const { address, isConnected } = useAccount()
  const [pot, setPot] = useState<Jackpot | null>(null)
  const [neighbors, setNeighbors] = useState<BoardRow[]>([])
  const [save, setSave] = useState<NightSave>(() => readNightSave())
  const [checkInState, setCheckInState] = useState<CheckInState>('idle')
  const [tipState, setTipState] = useState<TipState>('idle')
  const [lastCheckIn, setLastCheckIn] = useState<string | null>(null)
  const [lastTip, setLastTip] = useState<string | null>(null)
  const [tippingNeighborId, setTippingNeighborId] = useState<string | null>(null)

  useEffect(() => {
    let live = true
    fetchNightDesk()
      .then((desk) => {
        if (live && desk) {
          setPot(desk.jackpot)
          setNeighbors(desk.board.slice(0, 8))
        }
      })
      .catch(() => {
        if (live) {
          setPot(null)
          setNeighbors([])
        }
      })
    return () => {
      live = false
    }
  }, [])

  const handleCheckIn = async () => {
    if (!isConnected || checkInState === 'checking') return

    setCheckInState('checking')
    try {
      const homecomingScore = 100
      const uniqueRunId = `homecoming:${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
        .replace(/[^a-z0-9:_-]/gi, '')
        .slice(0, 80)

      const updated = readNightSave()
      const newTotal = updated.total + homecomingScore
      const currentBest = updated.best?.gate ?? 0

      const result = await pushNightRun({
        address: address ?? null,
        total: newTotal,
        best: currentBest,
        score: homecomingScore,
        runId: uniqueRunId,
      })

      if (result) {
        setPot(result.jackpot)
        setNeighbors(result.board.slice(0, 8))
        setSave({ ...updated, total: newTotal })
        setLastCheckIn(new Date().toLocaleString('en-US', { timeStyle: 'short' }))
        setCheckInState('done')
        setTimeout(() => setCheckInState('idle'), 3000)
      } else {
        setCheckInState('error')
        setTimeout(() => setCheckInState('idle'), 3000)
      }
    } catch {
      setCheckInState('error')
      setTimeout(() => setCheckInState('idle'), 3000)
    }
  }

  const handleTip = async (recipientAddress: string | null) => {
    if (!isConnected || tipState === 'tipping' || !recipientAddress) return

    setTipState('tipping')
    setTippingNeighborId(recipientAddress)
    try {
      const tipAmount = 50
      const uniqueRunId = `tip:${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
        .replace(/[^a-z0-9:_-]/gi, '')
        .slice(0, 80)

      const updated = readNightSave()
      const currentBest = updated.best?.gate ?? 0

      const result = await pushNightRun({
        address: address ?? null,
        total: updated.total,
        best: currentBest,
        score: tipAmount,
        runId: uniqueRunId,
        recipient: recipientAddress,
      })

      if (result) {
        setPot(result.jackpot)
        setNeighbors(result.board.slice(0, 8))
        setLastTip(new Date().toLocaleString('en-US', { timeStyle: 'short' }))
        setTipState('done')
        setTimeout(() => {
          setTipState('idle')
          setTippingNeighborId(null)
        }, 3000)
      } else {
        setTipState('error')
        setTimeout(() => {
          setTipState('idle')
          setTippingNeighborId(null)
        }, 3000)
      }
    } catch {
      setTipState('error')
      setTimeout(() => {
        setTipState('idle')
        setTippingNeighborId(null)
      }, 3000)
    }
  }

  return (
    <div className="street-root">
      <header className="street-header">
        <h1>Hood Street</h1>
        <p className="street-tagline">One block. One neighborhood. People on the block.</p>
        <button type="button" className="street-back" onClick={() => onNavigate('landing')}>
          ← Desk
        </button>
      </header>

      <main className="street-main">
        <section className="street-block">
          <div className="street-block-visual">
            <div className="street-corner street-corner-nw" />
            <div className="street-corner street-corner-ne" />
            <div className="street-corner street-corner-sw" />
            <div className="street-corner street-corner-se" />
            <div className="street-center">
              <span className="street-block-label">The Block</span>
              {isConnected && address ? (
                <span className="street-you">You</span>
              ) : (
                <span className="street-empty">Not connected</span>
              )}
            </div>
            {neighbors.length > 0 && (
              <div className="street-neighbors">
                {neighbors.map((neighbor, index) => {
                  const isYou =
                    address &&
                    (neighbor.address?.toLowerCase() === address.toLowerCase() || neighbor.id === address.toLowerCase())
                  const canTip = isConnected && !isYou && neighbor.address
                  return (
                    <div key={neighbor.id} className={`street-neighbor street-neighbor-${index + 1}`}>
                      <span className="street-neighbor-dot" />
                      <span className="street-neighbor-name">
                        {isYou ? 'You' : neighbor.address ? shortDeskAddress(neighbor.address) : 'Anon'}
                      </span>
                      <span className="street-neighbor-pts">{neighbor.total.toLocaleString('en-US')}</span>
                      {canTip && (
                        <button
                          type="button"
                          className="street-neighbor-tip"
                          onClick={() => handleTip(neighbor.address)}
                          disabled={tipState === 'tipping'}
                        >
                          {tippingNeighborId === neighbor.address && tipState === 'tipping' ? '...' : 'Tip'}
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div className="street-actions">
            {!isConnected ? (
              <div className="street-state">
                <p className="street-warning">
                  Connect your wallet to check in and tip neighbors. Reown may not have allowlisted this domain yet — if Connect fails, that's why.
                </p>
              </div>
            ) : (
              <>
                <div className="street-action-buttons">
                  <button
                    type="button"
                    className="street-checkin"
                    onClick={handleCheckIn}
                    disabled={checkInState === 'checking'}
                  >
                    {checkInState === 'checking'
                      ? 'Checking in...'
                      : checkInState === 'done'
                        ? '✓ Checked in'
                        : "I'm on the block"}
                  </button>
                </div>
                {checkInState === 'error' && (
                  <p className="street-error">Check-in failed. Try again.</p>
                )}
                {checkInState === 'done' && lastCheckIn && (
                  <p className="street-success">Checked in at {lastCheckIn}</p>
                )}
                {tipState === 'error' && <p className="street-error">Tip failed. Try again.</p>}
                {tipState === 'done' && lastTip && <p className="street-success">Tipped at {lastTip} (+50 pts to neighbor)</p>}
                <p className="street-note">
                  Check-in: wallet-signed homecoming (+100 pts). Tip: sends 50 points to a neighbor (database transfer, not yet on-chain).
                </p>
              </>
            )}
          </div>
        </section>

        <section className="street-status">
          <div className="street-card">
            <h2>Your streak</h2>
            {save.streak > 0 ? (
              <p className="street-streak-count">{save.streak} days</p>
            ) : (
              <p className="street-muted">No streak yet. Come back tomorrow.</p>
            )}
            {save.total > 0 && (
              <p className="street-total">{save.total.toLocaleString('en-US')} total points</p>
            )}
          </div>

          <div className="street-card">
            <h2>Night pot</h2>
            {pot ? (
              <>
                <p className="street-pot-amount">{pot.pot.toLocaleString('en-US')} points</p>
                <p className="street-pot-label">{pot.label}</p>
                <p className="street-pot-runs">{pot.runs} runs this week</p>
                {pot.best > 0 && (
                  <p className="street-pot-best">Best run: {pot.best.toLocaleString('en-US')}</p>
                )}
              </>
            ) : (
              <p className="street-muted">Loading pot...</p>
            )}
          </div>
        </section>

        <section className="street-board">
          <h2>The board</h2>
          <NightBoard highlight={address ?? null} limit={12} />
        </section>
      </main>
    </div>
  )
}
