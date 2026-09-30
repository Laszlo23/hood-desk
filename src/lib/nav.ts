export type ViewId =
  | 'landing'
  | 'terminal'
  | 'trade'
  | 'skills'
  | 'rewards'
  | 'blog'
  | 'create'
  | 'projects'
  | 'project'
  | 'hood'
  | 'ops'
  | 'revenue'
  | 'subscribe'
  | 'account'
  | 'nfts'
  | 'status'
  | 'community'

export const VIEWS: { id: ViewId; label: string; hash: string }[] = [
  { id: 'landing', label: 'Desk', hash: '#/' },
  { id: 'terminal', label: 'Terminal', hash: '#/terminal' },
  { id: 'trade', label: 'Trade', hash: '#/trade' },
  { id: 'skills', label: 'Skills', hash: '#/skills' },
  { id: 'rewards', label: 'Rewards', hash: '#/rewards' },
  { id: 'blog', label: 'Blog', hash: '#/blog' },
  { id: 'create', label: 'Create', hash: '#/create' },
  { id: 'projects', label: 'Projects', hash: '#/projects' },
  { id: 'hood', label: '$HOOD', hash: '#/hood' },
  { id: 'ops', label: 'Ops', hash: '#/ops' },
  { id: 'revenue', label: 'Revenue', hash: '#/revenue' },
  { id: 'subscribe', label: 'Subscribe', hash: '#/subscribe' },
  { id: 'account', label: 'Account', hash: '#/account' },
  { id: 'nfts', label: 'NFTs', hash: '#/nfts' },
  { id: 'status', label: 'Status', hash: '#/status' },
  { id: 'community', label: 'Auto-Trade', hash: '#/community' },
]

/** Primary top-bar links — 4 core items so the navbar stays scannable. */
export const PRIMARY_NAV: { id: ViewId; label: string; hash: string }[] = [
  { id: 'trade', label: 'Trade', hash: '#/trade' },
  { id: 'community', label: 'Auto-Trade', hash: '#/community' },
  { id: 'status', label: 'Status', hash: '#/status' },
  { id: 'skills', label: 'Skills', hash: '#/skills' },
]

/** Secondary links — live under the More dropdown / mobile drawer. */
export const MORE_NAV: { id: ViewId; label: string; hash: string }[] = [
  { id: 'rewards', label: 'Rewards', hash: '#/rewards' },
  { id: 'blog', label: 'Blog', hash: '#/blog' },
  { id: 'projects', label: 'Projects', hash: '#/projects' },
  { id: 'create', label: 'Create', hash: '#/create' },
  { id: 'terminal', label: 'Terminal', hash: '#/terminal' },
  { id: 'nfts', label: 'NFTs · DogiHood', hash: '#/nfts' },
  { id: 'hood', label: '$HOOD', hash: '#/hood' },
  { id: 'ops', label: 'Ops', hash: '#/ops' },
  { id: 'revenue', label: 'Revenue', hash: '#/revenue' },
  { id: 'account', label: 'Account / Wallet', hash: '#/account' },
]

export type RouteState = {
  view: ViewId
  projectId?: string
  blogSlug?: string
}

export function routeFromHash(hash: string): RouteState {
  const raw = (hash || '#/').replace(/^#/, '').replace(/^\//, '')
  const [path] = raw.split('?')
  const parts = path.toLowerCase().split('/').filter(Boolean)
  const origParts = path.split('/').filter(Boolean)

  if (parts[0] === 'status' || parts[0] === 'desk-status') return { view: 'status' }
  if (parts[0] === 'terminal' || parts[0] === 'chat') return { view: 'terminal' }
  if (parts[0] === 'trade' || parts[0] === 'swap' || parts[0] === 'chart') return { view: 'trade' }
  if (parts[0] === 'community' || parts[0] === 'auto-trade' || parts[0] === 'autotrade' || parts[0] === 'community-trade') {
    return { view: 'community' }
  }
  if (parts[0] === 'skills' || parts[0] === 'market' || parts[0] === 'skill-market') {
    return { view: 'skills' }
  }
  if (parts[0] === 'rewards' || parts[0] === 'earnings') return { view: 'rewards' }
  if (parts[0] === 'blog' || parts[0] === 'posts') {
    if (origParts[1]) return { view: 'blog', blogSlug: origParts[1] }
    return { view: 'blog' }
  }
  if (parts[0] === 'create' || parts[0] === 'new') return { view: 'create' }
  if (parts[0] === 'hood' || parts[0] === 'token' || parts[0] === '$hood') return { view: 'hood' }
  if (parts[0] === 'ops' || parts[0] === 'how' || parts[0] === 'business') return { view: 'ops' }
  if (parts[0] === 'revenue' || parts[0] === 'metrics' || parts[0] === 'dashboard') {
    return { view: 'revenue' }
  }
  if (parts[0] === 'subscribe' || parts[0] === 'pricing' || parts[0] === 'plans') {
    return { view: 'subscribe' }
  }
  if (parts[0] === 'account' || parts[0] === 'wallet' || parts[0] === 'profile') {
    return { view: 'account' }
  }
  if (parts[0] === 'nfts' || parts[0] === 'nft' || parts[0] === 'dogihood') {
    return { view: 'nfts' }
  }
  if (parts[0] === 'projects' || parts[0] === 'project') {
    if (origParts[1]) {
      return { view: 'project', projectId: origParts[1] }
    }
    return { view: 'projects' }
  }
  return { view: 'landing' }
}

/** @deprecated use routeFromHash */
export function viewFromHash(hash: string): ViewId {
  return routeFromHash(hash).view
}

export function hashForView(id: ViewId, idOrSlug?: string): string {
  if (id === 'project' && idOrSlug) return `#/projects/${idOrSlug}`
  if (id === 'blog' && idOrSlug) return `#/blog/${idOrSlug}`
  const found = VIEWS.find((v) => v.id === id)
  return found?.hash ?? '#/'
}

export function navActive(view: ViewId, chipId: ViewId): boolean {
  if (chipId === 'projects') return view === 'projects' || view === 'project'
  if (chipId === 'create') return view === 'create'
  return view === chipId
}

/** True when the current view lives under the More menu. */
export function moreNavActive(view: ViewId): boolean {
  return MORE_NAV.some((item) => navActive(view, item.id))
}
