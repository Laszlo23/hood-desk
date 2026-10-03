import { useEffect, useState, useRef } from 'react'
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

type FloatingScore = {
  id: string
  amount: number
  x: number
  y: number
}

type Activity = {
  id: string
  type: 'checkin' | 'tip'
  address: string
  target?: string
  amount: number
  time: string
}

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
  const [floatingScores, setFloatingScores] = useState<FloatingScore[]>([])
  const [blockPulse, setBlockPulse] = useState(false)
  const [recentActivity, setRecentActivity] = useState<Activity[]>([])
  const blockRef = useRef<HTMLDivElement>(null)

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

  const addFloatingScore = (amount: number, fromNeighborIndex?: number) => {
    const blockEl = blockRef.current
    if (!blockEl) return

    const rect = blockEl.getBoundingClientRect()
    let x = rect.width / 2
    let y = rect.height / 2

    if (fromNeighborIndex !== undefined) {
      const positions = [
        { x: 0.12, y: 0.15 },
        { x: 0.85, y: 0.18 },
        { x: 0.08, y: 0.38 },
        { x: 0.9, y: 0.42 },
        { x: 0.15, y: 0.65 },
        { x: 0.88, y: 0.62 },
        { x: 0.18, y: 0.85 },
        { x: 0.8, y: 0.88 },
      ]
      const pos = positions[fromNeighborIndex]
      if (pos) {
        x = rect.width * pos.x
        y = rect.height * pos.y
      }
    }

    const id = `${Date.now()}-${Math.random()}`
    setFloatingScores((prev) => [...prev, { id, amount, x, y }])
    setTimeout(() => {
      setFloatingScores((prev) => prev.filter((s) => s.id !== id))
    }, 2000)
  }

  const triggerBlockPulse = () => {
    setBlockPulse(true)
    setTimeout(() => setBlockPulse(false), 600)
  }

  const addActivity = (type: 'checkin' | 'tip', addr: string, target?: string, amount: number = 100) => {
    const activity: Activity = {
      id: `${Date.now()}-${Math.random()}`,
      type,
      address: addr,
      target,
      amount,
      time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
    }
    setRecentActivity((prev) => [activity, ...prev.slice(0, 4)])
  }

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
        addFloatingScore(homecomingScore)
        triggerBlockPulse()
        if (address) {
          addActivity('checkin', address, undefined, homecomingScore)
        }
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

  const handleTip = async (recipientAddress: string | null, neighborIndex: number) => {
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
        addFloatingScore(tipAmount, neighborIndex)
        triggerBlockPulse()
        if (address) {
          addActivity('tip', address, recipientAddress, tipAmount)
        }
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
        <p className="street-tagline">Show up. Tip your neighbors. Build your streak.</p>
        <button type="button" className="street-back" onClick={() => onNavigate('landing')}>
          ← Desk
        </button>
      </header>

      <main className="street-main">
        <section className="street-intro">
          <h2>How it works</h2>
          <ol className="street-steps">
            <li>
              <strong>Check in</strong> once a day. You get 100 points.
            </li>
            <li>
              <strong>Tip neighbors</strong> to send them 50 points.
            </li>
            <li>
              <strong>Come back tomorrow.</strong> Your streak grows. The pot grows.
            </li>
          </ol>
          <p className="street-fine-print">
            Points live on this desk, not the blockchain. Tips send desk points to another wallet, not tokens.
          </p>
        </section>

        <section className="street-block">
          <div className={`street-block-visual ${blockPulse ? 'street-block-pulse' : ''}`} ref={blockRef}>
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
            {neighbors.length > 0 ? (
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
                          onClick={() => handleTip(neighbor.address, index)}
                          disabled={tipState === 'tipping'}
                        >
                          {tippingNeighborId === neighbor.address && tipState === 'tipping' ? '...' : 'Tip 50'}
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="street-empty-state">
                <span className="street-waiting">Waiting for neighbors...</span>
              </div>
            )}
            {floatingScores.map((score) => (
              <div
                key={score.id}
                className="street-floating-score"
                style={{ left: `${score.x}px`, top: `${score.y}px` }}
              >
                +{score.amount}
              </div>
            ))}
          </div>

          <div className="street-actions">
            {!isConnected ? (
              <div className="street-state">
                <p className="street-warning">
                  Connect your wallet to check in. The Connect button may fail if Reown has not allowlisted this domain.
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
                        : 'Check in'}
                  </button>
                </div>
                {checkInState === 'error' && <p className="street-error">Check-in failed. Try again.</p>}
                {checkInState === 'done' && lastCheckIn && (
                  <p className="street-success">Checked in at {lastCheckIn}. You got 100 points.</p>
                )}
                {tipState === 'error' && <p className="street-error">Tip failed. Try again.</p>}
                {tipState === 'done' && lastTip && <p className="street-success">Sent 50 points at {lastTip}.</p>}
                <p className="street-note">
                  Click a neighbor's "Tip 50" button to send them points. Your check-in is saved with your wallet.
                </p>
              </>
            )}
          </div>

          {recentActivity.length > 0 && (
            <div className="street-activity">
              <h3>Your moves</h3>
              <div className="street-activity-list">
                {recentActivity.map((act) => (
                  <div key={act.id} className="street-activity-item">
                    <span className="street-activity-time">{act.time}</span>
                    {act.type === 'checkin' ? (
                      <span className="street-activity-text">
                        {shortDeskAddress(act.address)} checked in (+{act.amount})
                      </span>
                    ) : (
                      <span className="street-activity-text">
                        {shortDeskAddress(act.address)} tipped {act.target ? shortDeskAddress(act.target) : 'someone'}{' '}
                        {act.amount} pts
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        <section className="street-status">
          <div className="street-card street-card-streak">
            <h2>Your streak</h2>
            {save.streak > 0 ? (
              <>
                <p className="street-streak-count">
                  <span className="street-streak-number">{save.streak}</span> days
                </p>
                <div className="street-streak-progress">
                  <div
                    className="street-streak-bar"
                    style={{ width: `${((save.streak % 7 || 7) / 7) * 100}%` }}
                  />
                </div>
                <p className="street-streak-label">
                  {save.streak % 7 === 0
                    ? `${save.streak} day streak!`
                    : `${7 - (save.streak % 7)} more for a week`}
                </p>
              </>
            ) : (
              <p className="street-muted">No streak yet. Check in today.</p>
            )}
            {save.total > 0 && (
              <p className="street-total">{save.total.toLocaleString('en-US')} total points</p>
            )}
          </div>

          <div className="street-card street-card-pot">
            <h2>Night pot</h2>
            {pot ? (
              <>
                <p className="street-pot-amount">{pot.pot.toLocaleString('en-US')} points</p>
                <p className="street-pot-label">{pot.label}</p>
                <div className="street-pot-stats">
                  <span className="street-pot-stat">
                    <span className="street-pot-stat-label">Runs</span>
                    <span className="street-pot-stat-value">{pot.runs}</span>
                  </span>
                  {pot.best > 0 && (
                    <span className="street-pot-stat">
                      <span className="street-pot-stat-label">Best</span>
                      <span className="street-pot-stat-value">{pot.best.toLocaleString('en-US')}</span>
                    </span>
                  )}
                </div>
                <p className="street-pot-cta">Come back tomorrow to grow the pot</p>
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
