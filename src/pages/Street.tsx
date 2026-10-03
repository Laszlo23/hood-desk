import { useEffect, useState, useRef } from 'react'
import { useAccount } from 'wagmi'
import { fetchNightDesk, pushNightRun, type Jackpot, type PersonalStats } from '../lib/nightDesk'
import { readNightSave, type NightSave } from '../game/nightMarks'
import { NightBoard } from '../components/NightBoard'
import { shortDeskAddress } from '../lib/deskCard'
import { isFarcasterContext, sdk } from '../lib/farcaster'
import type { BoardRow } from '../lib/nightBoard'
import type { ViewId } from '../lib/nav'
import './street.css'

type Props = {
  onNavigate: (id: ViewId) => void
}

type CheckInState = 'idle' | 'checking' | 'done' | 'error'
type TipState = 'idle' | 'tipping' | 'done' | 'error'
type DigState = 'idle' | 'digging' | 'done' | 'error' | 'already-dug' | 'no-pot'

type FloatingScore = {
  id: string
  amount: number
  x: number
  y: number
}

export function Street({ onNavigate }: Props) {
  const { address, isConnected } = useAccount()
  const inFarcaster = isFarcasterContext()
  const [pot, setPot] = useState<Jackpot | null>(null)
  const [neighbors, setNeighbors] = useState<BoardRow[]>([])
  const [personal, setPersonal] = useState<PersonalStats | null>(null)
  const [save, setSave] = useState<NightSave>(() => readNightSave())
  const [checkInState, setCheckInState] = useState<CheckInState>('idle')
  const [checkInError, setCheckInError] = useState<string | null>(null)
  const [tipState, setTipState] = useState<TipState>('idle')
  const [digState, setDigState] = useState<DigState>('idle')
  const [lastCheckIn, setLastCheckIn] = useState<string | null>(null)
  const [lastTip, setLastTip] = useState<string | null>(null)
  const [lastDig, setLastDig] = useState<string | null>(null)
  const [earlyBird, setEarlyBird] = useState(false)
  const [tippingNeighborId, setTippingNeighborId] = useState<string | null>(null)
  const [diggingNeighborId, setDiggingNeighborId] = useState<string | null>(null)
  const [floatingScores, setFloatingScores] = useState<FloatingScore[]>([])
  const [blockPulse, setBlockPulse] = useState(false)
  const blockRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let live = true
    const addr = isConnected && address ? address : null
    fetchNightDesk(false, addr)
      .then((desk) => {
        if (live && desk) {
          setPot(desk.jackpot)
          setNeighbors(desk.board.slice(0, 8))
          setPersonal(desk.personal ?? null)
        }
      })
      .catch(() => {
        if (live) {
          setPot(null)
          setNeighbors([])
          setPersonal(null)
        }
      })
    return () => {
      live = false
    }
  }, [isConnected, address])

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

  const handleShare = async () => {
    if (!inFarcaster) return

    const streak = save.streak > 0 ? save.streak : 0
    const total = personal?.total ?? save.total
    const place = personal?.place
    
    let message = `Just checked in on Hood Street! 🏘️\n\n`
    
    if (streak > 0) {
      message += `${streak} day streak 🔥\n`
    }
    
    if (total > 0) {
      message += `${total.toLocaleString('en-US')} desk points`
      if (place && place <= 10) {
        message += ` (rank #${place})`
      }
      message += '\n'
    }
    
    message += `\nCheck in once a day, build your streak 📍`

    try {
      await sdk.actions.openUrl('https://warpcast.com/~/compose?text=' + encodeURIComponent(message) + '&embeds[]=https://doghood.aibusiness.fun')
    } catch (err) {
      console.error('Share failed:', err)
    }
  }

  const handleCheckIn = async () => {
    if (!isConnected || checkInState === 'checking') return

    setCheckInState('checking')
    setCheckInError(null)
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
        setPersonal(result.personal ?? null)
        
        const myNewTotal = result.board.find((row) => 
          row.address?.toLowerCase() === address?.toLowerCase()
        )?.total ?? updated.total
        setSave({ ...updated, total: myNewTotal })
        
        setLastCheckIn(new Date().toLocaleString('en-US', { timeStyle: 'short' }))
        setCheckInState('done')
        
        if (result.earlyBird) {
          setEarlyBird(true)
          addFloatingScore(homecomingScore + 20)
          setTimeout(() => setEarlyBird(false), 5000)
        } else {
          addFloatingScore(homecomingScore)
        }
        
        triggerBlockPulse()
        setTimeout(() => setCheckInState('idle'), 3000)
      } else {
        setCheckInState('error')
        setCheckInError('Check-in failed. Try again.')
        setTimeout(() => {
          setCheckInState('idle')
          setCheckInError(null)
        }, 3000)
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Check-in failed. Try again.'
      setCheckInState('error')
      setCheckInError(message)
      setTimeout(() => {
        setCheckInState('idle')
        setCheckInError(null)
      }, 3000)
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
        setPersonal(result.personal ?? null)
        setLastTip(new Date().toLocaleString('en-US', { timeStyle: 'short' }))
        setTipState('done')
        addFloatingScore(tipAmount, neighborIndex)
        triggerBlockPulse()
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

  const handleDig = async (neighborAddress: string | null, neighborIndex: number) => {
    if (!isConnected || digState === 'digging' || !neighborAddress) return

    setDigState('digging')
    setDiggingNeighborId(neighborAddress)
    try {
      const uniqueRunId = `dig:${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
        .replace(/[^a-z0-9:_-]/gi, '')
        .slice(0, 80)

      const updated = readNightSave()
      const currentBest = updated.best?.gate ?? 0

      const result = await pushNightRun({
        address: address ?? null,
        total: updated.total,
        best: currentBest,
        score: 0,
        runId: uniqueRunId,
        neighbor: neighborAddress,
      })

      if (result) {
        setPot(result.jackpot)
        setNeighbors(result.board.slice(0, 8))
        setPersonal(result.personal ?? null)
        const myNewTotal = result.board.find((row) => 
          row.address?.toLowerCase() === address?.toLowerCase()
        )?.total ?? updated.total
        setSave({ ...updated, total: myNewTotal })
        setLastDig(new Date().toLocaleString('en-US', { timeStyle: 'short' }))
        setDigState('done')
        addFloatingScore(30, neighborIndex)
        triggerBlockPulse()
        setTimeout(() => {
          setDigState('idle')
          setDiggingNeighborId(null)
        }, 3000)
      } else {
        setDigState('error')
        setTimeout(() => {
          setDigState('idle')
          setDiggingNeighborId(null)
        }, 3000)
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : ''
      if (message.includes('already dug')) {
        setDigState('already-dug')
      } else if (message.includes('cannot afford')) {
        setDigState('no-pot')
      } else {
        setDigState('error')
      }
      setTimeout(() => {
        setDigState('idle')
        setDiggingNeighborId(null)
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
          <h2>Hood Street</h2>
          <p className="street-pitch">
            Check in once a day. Build your streak. The first person to check in each day gets a bonus.
          </p>
          <div className="street-loop">
            <div className="street-loop-step">
              <span className="street-loop-number">1</span>
              <span className="street-loop-text">Check in today</span>
            </div>
            <div className="street-loop-arrow">→</div>
            <div className="street-loop-step">
              <span className="street-loop-number">2</span>
              <span className="street-loop-text">See it on the ledger</span>
            </div>
            <div className="street-loop-arrow">→</div>
            <div className="street-loop-step">
              <span className="street-loop-number">3</span>
              <span className="street-loop-text">Come back tomorrow</span>
            </div>
          </div>
          <p className="street-fine-print">
            Points are desk points, not blockchain tokens. Tips send points to another wallet. Digs pull from the shared pot.
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
                  const canDig = isConnected && !isYou && neighbor.address
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
                      {canDig && (
                        <button
                          type="button"
                          className="street-neighbor-dig"
                          onClick={() => handleDig(neighbor.address, index)}
                          disabled={digState === 'digging'}
                        >
                          {diggingNeighborId === neighbor.address && digState === 'digging' ? '...' : 'Dig'}
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
                  {inFarcaster && checkInState === 'done' && (
                    <button
                      type="button"
                      className="street-share"
                      onClick={handleShare}
                    >
                      Share
                    </button>
                  )}
                </div>
                {checkInError && <p className="street-error">{checkInError}</p>}
                {checkInState === 'done' && lastCheckIn && (
                  <p className="street-success">
                    {earlyBird 
                      ? `🌅 First check-in of the day! You got 120 points (100 + 20 early bird bonus).`
                      : `Checked in at ${lastCheckIn}. You got 100 points.`}
                  </p>
                )}
                {tipState === 'error' && <p className="street-error">Tip failed. Try again.</p>}
                {tipState === 'done' && lastTip && <p className="street-success">Sent 50 points at {lastTip}.</p>}
                {digState === 'error' && <p className="street-error">Dig failed. Try again.</p>}
                {digState === 'already-dug' && <p className="street-error">You already dug with this neighbor today.</p>}
                {digState === 'no-pot' && <p className="street-error">The pot cannot afford a dig right now.</p>}
                {digState === 'done' && lastDig && (
                  <p className="street-success">Dug at {lastDig}. You and your neighbor each got 30 points from the pot.</p>
                )}
                <p className="street-note">
                  Tip to send points. Dig with a neighbor to mine from the pot together—both get 30 points.
                </p>
              </>
            )}
          </div>

          {pot && pot.moves && pot.moves.length > 0 && (
            <div className="street-ledger">
              <h3>Recent moves</h3>
              <div className="street-ledger-list">
                {pot.moves.slice(0, 10).map((move, index) => {
                  const time = new Date(move.at).toLocaleString('en-US', { 
                    month: 'short', 
                    day: 'numeric', 
                    hour: 'numeric', 
                    minute: '2-digit' 
                  })
                  const normalizedAddress = address?.toLowerCase()
                  const isPersonal = normalizedAddress && (
                    move.from?.toLowerCase() === normalizedAddress || 
                    move.to?.toLowerCase() === normalizedAddress || 
                    move.starter?.toLowerCase() === normalizedAddress || 
                    move.neighbor?.toLowerCase() === normalizedAddress
                  )
                  
                  if (move.type === 'checkin') {
                    return (
                      <div 
                        key={`${move.at}-${index}`} 
                        className={`street-ledger-item ${isPersonal ? 'street-ledger-item-you' : ''}`}
                      >
                        <span className="street-ledger-time">{time}</span>
                        <span className="street-ledger-text">
                          {shortDeskAddress(move.from!)} checked in (+{move.amount})
                          {isPersonal && <span className="street-ledger-you-badge">you</span>}
                        </span>
                      </div>
                    )
                  } else if (move.type === 'tip') {
                    return (
                      <div 
                        key={`${move.at}-${index}`} 
                        className={`street-ledger-item ${isPersonal ? 'street-ledger-item-you' : ''}`}
                      >
                        <span className="street-ledger-time">{time}</span>
                        <span className="street-ledger-text">
                          {shortDeskAddress(move.from!)} tipped {shortDeskAddress(move.to!)} {move.amount} pts
                          {isPersonal && <span className="street-ledger-you-badge">you</span>}
                        </span>
                      </div>
                    )
                  } else {
                    return (
                      <div 
                        key={`${move.at}-${index}`} 
                        className={`street-ledger-item ${isPersonal ? 'street-ledger-item-you' : ''}`}
                      >
                        <span className="street-ledger-time">{time}</span>
                        <span className="street-ledger-text">
                          {shortDeskAddress(move.starter!)} & {shortDeskAddress(move.neighbor!)} dug {move.amount} pts each
                          {isPersonal && <span className="street-ledger-you-badge">you</span>}
                        </span>
                      </div>
                    )
                  }
                })}
              </div>
            </div>
          )}
        </section>

        <section className="street-status">
          {isConnected && personal && (
            <div className="street-card street-card-personal">
              <h2>Your record</h2>
              <div className="street-personal-stats">
                {personal.place !== null && (
                  <div className="street-personal-stat street-personal-stat-place">
                    <span className="street-personal-label">Place on block</span>
                    <span className="street-personal-value street-personal-place">
                      {personal.place === 1 ? '🥇 1st' : 
                       personal.place === 2 ? '🥈 2nd' : 
                       personal.place === 3 ? '🥉 3rd' : 
                       `${personal.place}th`}
                    </span>
                  </div>
                )}
                <div className="street-personal-stat">
                  <span className="street-personal-label">Total points</span>
                  <span className="street-personal-value">{personal.total.toLocaleString('en-US')}</span>
                </div>
                <div className="street-personal-stat">
                  <span className="street-personal-label">Best run</span>
                  <span className="street-personal-value">{personal.best.toLocaleString('en-US')}</span>
                </div>
                <div className="street-personal-stat">
                  <span className="street-personal-label">Tips given</span>
                  <span className="street-personal-value">{personal.tipsGiven}</span>
                </div>
                <div className="street-personal-stat">
                  <span className="street-personal-label">Tips received</span>
                  <span className="street-personal-value">{personal.tipsReceived}</span>
                </div>
                <div className="street-personal-stat">
                  <span className="street-personal-label">Digs</span>
                  <span className="street-personal-value">{personal.digs}</span>
                </div>
              </div>
              {personal.rival && (
                <div className="street-rival">
                  <span className="street-rival-icon">⚔️</span>
                  <span className="street-rival-text">
                    Rivalry with {shortDeskAddress(personal.rival.address)} — {personal.rival.interactions} moves
                  </span>
                </div>
              )}
              {personal.place === null && personal.total === 0 && (
                <p className="street-not-on-board">Not on the board yet. Check in to get started.</p>
              )}
            </div>
          )}

          <div className="street-card street-card-streak">
            <h2>Your streak</h2>
            {save.streak > 0 ? (
              <>
                <p className="street-streak-count">
                  <span className="street-streak-number">{save.streak}</span> days
                </p>
                {(save.streak === 7 || save.streak === 14 || save.streak === 21) && (
                  <div className="street-week-goal">
                    <span className="street-week-goal-icon">🎯</span>
                    <span className="street-week-goal-text">
                      {save.streak === 7 ? 'One week complete!' : 
                       save.streak === 14 ? 'Two weeks complete!' : 
                       'Three weeks complete!'}
                    </span>
                  </div>
                )}
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
                {pot.holder && pot.best > 0 && (
                  <div className="street-block-boss">
                    <span className="street-boss-crown">👑</span>
                    <div className="street-boss-info">
                      <span className="street-boss-label">Block Boss</span>
                      <span className="street-boss-name">{shortDeskAddress(pot.holder)}</span>
                      <span className="street-boss-score">{pot.best.toLocaleString('en-US')} pts this week</span>
                    </div>
                  </div>
                )}
                <div className="street-pot-stats">
                  <span className="street-pot-stat">
                    <span className="street-pot-stat-label">Check-ins</span>
                    <span className="street-pot-stat-value">{pot.runs}</span>
                  </span>
                </div>
                <p className="street-pot-cta">Come back tomorrow to grow your streak</p>
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
