import { useCallback, useEffect, useState } from 'react'
import { TopNav } from './components/TopNav'
import { WeeklyBanner } from './components/WeeklyBanner'
import { hashForView, routeFromHash, type ViewId } from './lib/nav'
import { Account } from './pages/Account'
import { Blog } from './pages/Blog'
import { CreateProject } from './pages/CreateProject'
import { Hood } from './pages/Hood'
import { Landing } from './pages/Landing'
import { Nfts } from './pages/Nfts'
import { Ops } from './pages/Ops'
import { ProjectDetail } from './pages/ProjectDetail'
import { Projects } from './pages/Projects'
import { Revenue } from './pages/Revenue'
import { Rewards } from './pages/Rewards'
import { SkillMarket } from './pages/SkillMarket'
import { Status } from './pages/Status'
import { Subscribe } from './pages/Subscribe'
import { Terminal } from './pages/Terminal'
import { Trade } from './pages/Trade'
import { CommunityTrade } from './pages/CommunityTrade'

export default function App() {
  const initial = typeof window !== 'undefined' ? routeFromHash(window.location.hash) : { view: 'landing' as ViewId }
  const [view, setView] = useState<ViewId>(initial.view)
  const [projectId, setProjectId] = useState<string | undefined>(initial.projectId)
  const [blogSlug, setBlogSlug] = useState<string | undefined>(initial.blogSlug)

  useEffect(() => {
    const onHash = () => {
      const r = routeFromHash(window.location.hash)
      setView(r.view)
      setProjectId(r.projectId)
      setBlogSlug(r.blogSlug)
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const navigate = useCallback((id: ViewId, idOrProject?: string) => {
    const next = hashForView(id, idOrProject)
    if (window.location.hash !== next) {
      window.location.hash = next
    } else {
      setView(id)
      setProjectId(id === 'project' ? idOrProject : undefined)
      setBlogSlug(id === 'blog' ? idOrProject : undefined)
    }
  }, [])

  const tradeMode = view === 'trade'
  const showShellBanner =
    view === 'landing' || view === 'status' || view === 'skills' || view === 'rewards' || view === 'subscribe' || view === 'community'

  return (
    <div className={`app-shell${tradeMode ? ' trade-shell' : ''}`}>
      <div className="grid-bg" />
      <div className="glow-orb" />

      <div className={`desk-layout${tradeMode ? ' desk-layout-trade' : ''}`}>
        {!tradeMode && <TopNav view={view} onNavigate={navigate} />}
        {!tradeMode && showShellBanner && (
          <div className="shell-banner-wrap">
            <WeeklyBanner compact />
          </div>
        )}

        <main className={`desk-main${tradeMode ? ' desk-main-trade' : ''}`}>
          {view === 'landing' && <Landing onNavigate={navigate} />}
          {view === 'status' && <Status onNavigate={navigate} />}
          {view === 'terminal' && <Terminal onNavigate={navigate} />}
          {view === 'trade' && <Trade onNavigate={navigate} />}
          {view === 'community' && <CommunityTrade onNavigate={navigate} />}
          {view === 'skills' && <SkillMarket onNavigate={navigate} />}
          {view === 'rewards' && <Rewards onNavigate={navigate} />}
          {view === 'blog' && <Blog slug={blogSlug} onNavigate={navigate} />}
          {view === 'create' && <CreateProject onNavigate={navigate} />}
          {view === 'projects' && <Projects onNavigate={navigate} />}
          {view === 'project' && <ProjectDetail projectId={projectId} onNavigate={navigate} />}
          {view === 'hood' && <Hood onNavigate={navigate} />}
          {view === 'ops' && <Ops onNavigate={navigate} />}
          {view === 'revenue' && <Revenue onNavigate={navigate} />}
          {view === 'subscribe' && <Subscribe onNavigate={navigate} />}
          {view === 'account' && <Account onNavigate={navigate} />}
          {view === 'nfts' && <Nfts onNavigate={navigate} />}
        </main>
      </div>
    </div>
  )
}
