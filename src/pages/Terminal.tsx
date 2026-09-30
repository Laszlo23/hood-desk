import { useCallback, useRef, useState } from 'react'
import { Chat } from '../components/Chat'
import { HoodCard } from '../components/HoodCard'
import { SkillsPanel } from '../components/SkillsPanel'
import type { SkillId } from '../lib/agent/skills'
import type { ViewId } from '../lib/nav'
import { FeaturedTxRow } from '../components/status/FeaturedTxRow'

type Props = { onNavigate: (id: ViewId, projectId?: string) => void }

export function Terminal({ onNavigate }: Props) {
  const sendRef = useRef<(prompt: string) => void>(() => {})
  const [showSkills, setShowSkills] = useState(true)

  const onReady = useCallback((send: (text: string) => void) => {
    sendRef.current = send
  }, [])

  const invoke = (prompt: string) => {
    sendRef.current(prompt)
  }

  return (
    <section className="page terminal-page">
      <div className="main-stage">
        <Chat onReady={onReady} />
        <aside className="side-panel">
          <HoodCard />
          <FeaturedTxRow compact />
          <div className="card side-links">
            <p className="eyebrow">Desk links</p>
            <button type="button" className="link-btn" onClick={() => onNavigate('status')}>
              Status →
            </button>
            <button type="button" className="link-btn" onClick={() => onNavigate('trade')}>
              Trade (simulate) →
            </button>
            <button type="button" className="link-btn" onClick={() => onNavigate('skills')}>
              Skill Market →
            </button>
            <button type="button" className="link-btn" onClick={() => onNavigate('create')}>
              Create project →
            </button>
            <button type="button" className="link-btn" onClick={() => onNavigate('projects')}>
              Projects →
            </button>
            <button type="button" className="link-btn" onClick={() => onNavigate('ops')}>
              How this AI business runs →
            </button>
            <button type="button" className="link-btn" onClick={() => onNavigate('revenue')}>
              Revenue (demo) →
            </button>
            <button type="button" className="link-btn" onClick={() => onNavigate('nfts')}>
              DogiHood NFTs →
            </button>
            <button type="button" className="link-btn" onClick={() => onNavigate('hood')}>
              $HOOD →
            </button>
            <button type="button" className="link-btn" onClick={() => onNavigate('account')}>
              Account / Wallet →
            </button>
            <button
              type="button"
              className="link-btn"
              onClick={() => {
                setShowSkills(true)
                invoke('list skills')
              }}
            >
              /skills catalog →
            </button>
          </div>
          {showSkills && (
            <SkillsPanel
              compact
              onInvoke={(id: SkillId) => {
                invoke(id === 'list_skills' ? 'list skills' : id.replace(/_/g, ' '))
              }}
            />
          )}
          <p className="side-note muted">
            Desk never holds keys. You sign in your wallet. Price / swap wait for a known RH DEX —
            no invented routers. Fair launch only.
          </p>
        </aside>
      </div>
    </section>
  )
}
