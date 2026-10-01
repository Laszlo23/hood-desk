import { useCallback, useMemo, useState, type FormEvent } from 'react'
import { useAccount } from 'wagmi'
import { SKILLS, type SkillId } from '../lib/agent/skills'
import {
  followBot,
  getActiveBotId,
  getCreator,
  getFollows,
  isFollowing,
  listCreators,
  listLedger,
  listSkillPacks,
  publishBot,
  setActiveBot,
  unfollowBot,
  type SkillPack,
} from '../lib/market/skillMarket'
import { awardXp } from '../lib/gamification'
import { HoodMark } from '../components/HoodMark'
import { DogiHoodHolderBadge } from '../components/DogiHoodCard'
import type { ViewId } from '../lib/nav'

type Props = { onNavigate: (id: ViewId, projectId?: string) => void }

type Tab = 'browse' | 'publish' | 'creator'

const PUBLISHABLE: SkillId[] = [
  'trade_vet',
  'trade_chart',
  'trade_order',
  'portfolio',
  'price',
  'fair_launch_status',
  'explain_fair_launch',
  'list_projects',
  'summarize_project_pitch',
  'draft_tweet',
  'draft_farcaster',
  'daily_brief',
  'how_desk_runs',
  'treasury_explain',
  'neon_tips',
  'fox_coach',
  'help',
]

export function SkillMarket({ onNavigate }: Props) {
  const { address } = useAccount()
  const [tab, setTab] = useState<Tab>('browse')
  const [tick, setTick] = useState(0)
  const refresh = useCallback(() => setTick((t) => t + 1), [])

  const packs = useMemo(() => listSkillPacks(), [tick])
  const follows = useMemo(() => getFollows(), [tick])
  const activeId = useMemo(() => getActiveBotId(), [tick])
  const ledger = useMemo(() => listLedger().slice(0, 12), [tick])
  const creators = useMemo(() => listCreators(), [tick])

  const myCreator = useMemo(() => {
    const published = packs.filter((p) => !p.isDemo && p.authorWallet?.toLowerCase() === address?.toLowerCase())
    if (published[0]) return getCreator(published[0].creatorId) ?? null
    const byWallet = creators.find((c) => c.wallet?.toLowerCase() === address?.toLowerCase())
    return byWallet ?? null
  }, [packs, creators, address, tick])

  const [flash, setFlash] = useState<string | null>(null)
  const toast = (msg: string) => {
    setFlash(msg)
    window.setTimeout(() => setFlash(null), 3200)
  }

  const onFollow = (bot: SkillPack) => {
    const r = followBot(bot.id)
    if (r.ok) awardXp('follow_bot')
    else if (r.text.toLowerCase().includes('subscribe') || r.text.toLowerCase().includes('upgrade')) {
      toast(r.text)
      return
    }
    toast(r.ok ? `Following ${bot.name}` : r.text)
    refresh()
  }

  const onUnfollow = (bot: SkillPack) => {
    const r = unfollowBot(bot.id)
    toast(r.ok ? `Unfollowed ${bot.name}` : r.text)
    refresh()
  }

  const onPrimary = (bot: SkillPack) => {
    const r = setActiveBot(bot.id)
    toast(r.ok ? `Primary → ${bot.name}` : r.text)
    refresh()
  }

  // Publish form
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')
  const [handle, setHandle] = useState('@you')
  const [tags, setTags] = useState('trade.vet, custom')
  const [picked, setPicked] = useState<SkillId[]>(['trade_vet', 'help'])
  const [pubErr, setPubErr] = useState<string | null>(null)

  const toggleSkill = (id: SkillId) => {
    setPicked((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const onPublish = (e: FormEvent) => {
    e.preventDefault()
    setPubErr(null)
    const r = publishBot({
      name,
      description: desc,
      skillTags: tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      skillConfig: picked,
      authorHandle: handle,
      authorWallet: address,
    })
    if (!r.ok) {
      setPubErr(r.text)
      return
    }
    awardXp('publish_bot')
    toast(r.text)
    setName('')
    setDesc('')
    setTab('creator')
    refresh()
  }

  const activeBot = packs.find((p) => p.id === activeId) ?? null

  return (
    <section className="page skills-market-page">
      <div className="page-intro">
        <p className="eyebrow">Explore · Skill Market</p>
        <h1>
          Skill Market <DogiHoodHolderBadge className="skills-holder-inline" />
        </h1>
        <p className="muted">
          Browse skill packs you publish. Following a pack copies its skill list into the Desk agent.
          There is no payout ledger. Pool fees stay on{' '}
          <button type="button" className="link-btn" onClick={() => onNavigate('rewards')}>
            #/rewards
          </button>
          .
        </p>
        {flash && <div className="trade-flash mt">{flash}</div>}
        {activeBot && (
          <div className="active-bot-banner demo-banner">
            <strong>Primary bot:</strong> {activeBot.name}{' '}
            <span className="muted">({activeBot.authorHandle})</span>
            <span className="chip-row mt">
              {activeBot.skillTags.map((t) => (
                <span key={t} className="skill-chip">
                  {t}
                </span>
              ))}
            </span>
          </div>
        )}
      </div>

      <div className="market-tabs orders-tabs">
        {(
          [
            ['browse', 'Browse'],
            ['publish', 'Publish bot'],
            ['creator', 'Creator desk'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={`orders-tab${tab === id ? ' active' : ''}`}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'browse' && (
        <>
        <div className="card skills-featured-hood row-gap">
          <HoodMark size={64} variant="photo" className="skills-hood-mascot" />
          <div>
            <p className="eyebrow">Flagship · HOOD agent · not a generic bot</p>
            <h2 className="section-title">Hood Street Skill Market</h2>
            <p className="muted">
              HOOD Community Desk runs pack auto-trade (SIM). Follow bots, copy skill configs, earn
              demo creator credits. Desk unlocks featured badges + more publish slots.
            </p>
            <div className="cta-row mt">
              <button type="button" className="btn btn-primary btn-sm" onClick={() => onNavigate('community')}>
                Community Auto-Trade
              </button>
            </div>
          </div>
        </div>
        <div className="market-grid">
          {packs.map((bot) => {
            const following = isFollowing(bot.id)
            const primary = activeId === bot.id
            const creator = getCreator(bot.creatorId)
            return (
              <article
                key={bot.id}
                className={`card market-card${bot.featured ? ' featured' : ''}${primary ? ' primary' : ''}${bot.id === 'bot_hood_community' ? ' hood-flagship-bot' : ''}`}
              >
                <div className="row-between">
                  <div className="row-gap">
                    <HoodMark
                      size={44}
                      variant={
                        bot.id === 'bot_hood_community' || bot.featured || bot.id === 'bot_hood_vet_pro'
                          ? 'photo'
                          : 'mark'
                      }
                      className="market-bot-avatar"
                    />
                    <div>
                    <p className="eyebrow">
                      {bot.id === 'bot_hood_community'
                        ? '★ Flagship HOOD agent · '
                        : bot.featured
                          ? 'Featured · '
                          : ''}
                      {bot.isDemo ? 'Demo seed' : 'Community'}
                    </p>
                    <h3 className="market-bot-name">{bot.name}</h3>
                    <p className="muted tiny">
                      {bot.authorHandle}
                      {creator?.perks.includes('Creator') && (
                        <span className="creator-badge"> Creator</span>
                      )}
                    </p>
                    </div>
                  </div>
                  <div className="market-rating mono">
                    ★ {bot.rating.toFixed(1)}
                    <span className="muted block tiny">{bot.followerCount} followers</span>
                  </div>
                </div>
                <p className="market-desc muted">{bot.description}</p>
                <div className="chip-row">
                  {bot.skillTags.map((t) => (
                    <span key={t} className="skill-chip">
                      {t}
                    </span>
                  ))}
                </div>
                <p className="tiny muted mt">
                  Skills: {bot.skillConfig.map((s) => s).join(', ')}
                </p>
                {bot.id === 'bot_hood_community' && (
                  <p className="hood-agent-voice tiny mt">
                    <span className="hood-agent-voice-label">HOOD</span>
                    Not a generic bot — I run the community desk. Open Auto-Trade for SIM strategies.
                  </p>
                )}
                <div className="cta-row mt">
                  {bot.id === 'bot_hood_community' && (
                    <button type="button" className="btn btn-sm btn-ghost" onClick={() => onNavigate('community')}>
                      Auto-Trade desk
                    </button>
                  )}
                  {following ? (
                    <>
                      <button type="button" className="btn btn-sm btn-ghost" onClick={() => onUnfollow(bot)}>
                        Unfollow
                      </button>
                      {!primary && (
                        <button type="button" className="btn btn-sm btn-primary" onClick={() => onPrimary(bot)}>
                          Set primary
                        </button>
                      )}
                      {primary && <span className="badge">Primary</span>}
                    </>
                  ) : (
                    <button type="button" className="btn btn-sm btn-primary" onClick={() => onFollow(bot)}>
                      Follow
                    </button>
                  )}
                </div>
              </article>
            )
          })}
        </div>
        </>
      )}

      {tab === 'publish' && (
        <form className="card form-card market-publish" onSubmit={onPublish}>
          <p className="eyebrow">Publish skill pack</p>
          <h2 className="section-title">Create a trading bot</h2>
          <p className="muted small">
            Publishing unlocks the <strong>Creator</strong> perk and a demo compensation ledger
            (follow bonus + usage share). No real token transfers.
          </p>
          <label className="field">
            <span>Name</span>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Hood Vet Pro" required />
          </label>
          <label className="field">
            <span>Author handle</span>
            <input className="input" value={handle} onChange={(e) => setHandle(e.target.value)} placeholder="@0xleonardo" />
          </label>
          <label className="field">
            <span>Description</span>
            <textarea className="input textarea" value={desc} onChange={(e) => setDesc(e.target.value)} rows={3} />
          </label>
          <label className="field">
            <span>Skill tags (comma)</span>
            <input className="input" value={tags} onChange={(e) => setTags(e.target.value)} />
          </label>
          <div className="field">
            <span>Skill config</span>
            <div className="chip-row">
              {PUBLISHABLE.map((id) => {
                const def = SKILLS.find((s) => s.id === id)
                return (
                  <button
                    key={id}
                    type="button"
                    className={`skill-chip${picked.includes(id) ? ' active-pick' : ''}`}
                    onClick={() => toggleSkill(id)}
                  >
                    {def?.name ?? id}
                  </button>
                )
              })}
            </div>
          </div>
          {pubErr && (
            <div className="upgrade-prompt">
              <p className="err-line form-err">{pubErr}</p>
              {pubErr.toLowerCase().includes('subscribe') || pubErr.toLowerCase().includes('pro') ? (
                <button type="button" className="btn btn-primary btn-sm" onClick={() => onNavigate('subscribe')}>
                  Upgrade to Desk →
                </button>
              ) : null}
            </div>
          )}
          <div className="cta-row">
            <button type="submit" className="btn btn-primary">
              Publish bot
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => onNavigate('terminal')}>
              Or publish via Terminal
            </button>
          </div>
          <p className="tiny muted">Publishing stores the pack in this browser. It does not pay a fee share.</p>
        </form>
      )}

      {tab === 'creator' && (
        <div className="creator-desk">

          {myCreator && (
            <article className="card">
              <p className="eyebrow">Your creator profile</p>
              {(() => {
                const c = myCreator
                return (
                  <>
                    <h2 className="section-title">
                      {c.handle} <span className="creator-badge">Creator</span>
                    </h2>
                    <div className="metrics-grid mt">
                      <div className="card mini-card">
                        <span className="rail-label">Packs</span>
                        <p className="metric-value">{c.packsPublished.length}</p>
                      </div>
                      <div className="card mini-card">
                        <span className="rail-label">Followers</span>
                        <p className="metric-value">{c.followerCount}</p>
                      </div>
                      <div className="card mini-card">
                        <span className="rail-label">Follow credits</span>
                        <p className="metric-value">{c.followCredits}</p>
                      </div>
                      <div className="card mini-card">
                        <span className="rail-label">Usage credits</span>
                        <p className="metric-value">{c.usageCredits}</p>
                      </div>
                      <div className="card mini-card">
                        <span className="rail-label">Fee share</span>
                        <p className="metric-value">{c.feeSharePct}%</p>
                        <p className="metric-note">
                          creator / {100 - c.feeSharePct}% treasury (stub)
                        </p>
                      </div>
                    </div>
                    <div className="chip-row mt">
                      {c.perks.map((p) => (
                        <span key={p} className="badge">
                          {p}
                        </span>
                      ))}
                    </div>
                  </>
                )
              })()}
            </article>
          )}

          <article className="card mt">
            <p className="eyebrow">Leaderboard · local catalog</p>
            <h3>Creators by followers</h3>
            <p className="tiny muted">Creators who published a pack from this desk.</p>
            <div className="orders-table-wrap">
              <table className="orders-table ledger">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Handle</th>
                    <th>Followers</th>
                    <th>Credits</th>
                    <th>Perks</th>
                  </tr>
                </thead>
                <tbody>
                  {[...creators]
                    .sort((a, b) => b.followerCount - a.followerCount)
                    .map((c, i) => (
                      <tr key={c.id}>
                        <td className="mono">{i + 1}</td>
                        <td>
                          {c.handle}{' '}
                          {i === 0 && <span className="badge">Featured</span>}
                        </td>
                        <td>{c.followerCount}</td>
                        <td className="mono">{c.followCredits + c.usageCredits}</td>
                        <td className="tiny">{c.perks.join(', ')}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </article>

          <article className="card mt">
            <p className="eyebrow">Compensation ledger</p>
            <h3>Recent demo entries</h3>
            {ledger.length === 0 ? (
              <div className="orders-empty">
                <p className="muted">No ledger entries yet</p>
                <p className="tiny muted">Follow a bot or run a skill from your primary bot.</p>
              </div>
            ) : (
              <div className="orders-table-wrap">
                <table className="orders-table ledger">
                  <thead>
                    <tr>
                      <th>When</th>
                      <th>Type</th>
                      <th>Amount</th>
                      <th>Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ledger.map((e) => (
                      <tr key={e.id}>
                        <td className="tiny muted">{new Date(e.at).toLocaleString()}</td>
                        <td className="mono tiny">{e.type}</td>
                        <td className="mono">{e.amount}</td>
                        <td className="tiny">{e.note}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </article>

          <div className="cta-row mt">
            <button type="button" className="btn btn-ghost" onClick={() => onNavigate('ops')}>
              Ops loop →
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => onNavigate('trade')}>
              Trade →
            </button>
            <button type="button" className="btn btn-primary" onClick={() => setTab('publish')}>
              Publish another
            </button>
          </div>

          <p className="tiny muted mt">
            Following: {follows.followedIds.length} bot{follows.followedIds.length === 1 ? '' : 's'}
            {activeId ? ` · primary ${activeId}` : ''}
          </p>
        </div>
      )}
    </section>
  )
}
