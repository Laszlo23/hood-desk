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
  | 'card'
  | 'nfts'
  | 'status'
  | 'community'
  | 'lore'
  | 'dark'

export const VIEWS: { id: ViewId; label: string; hash: string }[] = [
  { id: 'landing', label: 'Desk', hash: '#/' },
  { id: 'terminal', label: 'Terminal', hash: '#/terminal' },
  { id: 'trade', label: 'Trade', hash: '#/trade' },
  { id: 'skills', label: 'Skills', hash: '#/skills' },
  { id: 'rewards', label: 'Ledger', hash: '#/rewards' },
  { id: 'blog', label: 'Notes', hash: '#/blog' },
  { id: 'create', label: 'Create', hash: '#/create' },
  { id: 'projects', label: 'Projects', hash: '#/projects' },
  { id: 'hood', label: '$HOOD', hash: '#/hood' },
  { id: 'ops', label: 'Ops', hash: '#/ops' },
  { id: 'revenue', label: 'Revenue', hash: '#/revenue' },
  { id: 'subscribe', label: 'Subscribe', hash: '#/subscribe' },
  { id: 'account', label: 'Account', hash: '#/account' },
  { id: 'card', label: 'Card', hash: '#/card' },
  { id: 'nfts', label: 'Marks', hash: '#/nfts' },
  { id: 'status', label: 'Status', hash: '#/status' },
  { id: 'community', label: 'Pool', hash: '#/community' },
  { id: 'lore', label: 'Legend', hash: '#/lore' },
  { id: 'dark', label: 'The dark', hash: '#/dark' },
]

/** Primary top-bar links — 4 core items so the navbar stays scannable. */
export const PRIMARY_NAV: { id: ViewId; label: string; hash: string }[] = [
  { id: 'trade', label: 'Trade', hash: '#/trade' },
  { id: 'blog', label: 'Notes', hash: '#/blog' },
  { id: 'community', label: 'Pool', hash: '#/community' },
  { id: 'dark', label: 'The dark', hash: '#/dark' },
  { id: 'status', label: 'Status', hash: '#/status' },
  { id: 'skills', label: 'Skills', hash: '#/skills' },
]

export type StreetItem = {
  id: ViewId
  label: string
  hint: string
  hash: string
}

export type StreetGroup = {
  label: string
  items: StreetItem[]
}

/** The rest of the desk, grouped so the menu says where each door goes. */
export const STREET_GROUPS: StreetGroup[] = [
  {
    label: 'The coin',
    items: [
      { id: 'hood', label: '$HOOD', hint: 'The purse, the pool, the cause', hash: '#/hood' },
      { id: 'rewards', label: 'Ledger', hint: 'Every swap, in order', hash: '#/rewards' },
      { id: 'blog', label: 'Notes', hint: 'What the street just said', hash: '#/blog' },
    ],
  },
  {
    label: 'The wood',
    items: [
      { id: 'nfts', label: 'Marks', hint: 'NFTs and the wallets inside them', hash: '#/nfts' },
      { id: 'lore', label: 'Legend', hint: 'From Sherwood to this desk', hash: '#/lore' },
      { id: 'dark', label: 'The dark', hint: 'A pixel run on the rich', hash: '#/dark' },
    ],
  },
  {
    label: 'The desk',
    items: [
      { id: 'terminal', label: 'Ask', hint: 'Talk to the desk', hash: '#/terminal' },
      { id: 'projects', label: 'Projects', hint: 'Launches on the street', hash: '#/projects' },
      { id: 'create', label: 'Create', hint: 'Press a collection on this desk', hash: '#/create' },
      { id: 'ops', label: 'Ops', hint: 'How the desk stays up', hash: '#/ops' },
      { id: 'revenue', label: 'Revenue', hint: 'Plans, and what is actually paid', hash: '#/revenue' },
      { id: 'account', label: 'Account', hint: 'This wallet', hash: '#/account' },
    ],
  },
]

/** Flat list for active-state checks. */
export const MORE_NAV: StreetItem[] = STREET_GROUPS.flatMap((group) => group.items)

export type DrawerSectionId = 'agent' | 'explore' | 'build'

export type DrawerNavItem = {
  id: ViewId
  label: string
  hash: string
  /** Lightweight icon key rendered as inline SVG in the mobile drawer. */
  icon: string
}

export type DrawerSection = {
  id: DrawerSectionId
  label: string
  defaultOpen: boolean
  items: DrawerNavItem[]
}

/** Mobile drawer accordion: Agent open by default; Explore & Build collapsed. */
export const DRAWER_SECTIONS: DrawerSection[] = [
  {
    id: 'agent',
    label: 'The desk',
    defaultOpen: true,
    items: [
      { id: 'trade', label: 'Trade', hash: '#/trade', icon: 'trade' },
      { id: 'community', label: 'Pool', hash: '#/community', icon: 'autotrade' },
      { id: 'status', label: 'Status', hash: '#/status', icon: 'status' },
      { id: 'skills', label: 'Skills', hash: '#/skills', icon: 'skills' },
      { id: 'terminal', label: 'Ask', hash: '#/terminal', icon: 'terminal' },
    ],
  },
  {
    id: 'explore',
    label: 'The street',
    defaultOpen: false,
    items: [
      { id: 'hood', label: '$HOOD', hash: '#/hood', icon: 'hood' },
      { id: 'rewards', label: 'Ledger', hash: '#/rewards', icon: 'rewards' },
      { id: 'blog', label: 'Notes', hash: '#/blog', icon: 'blog' },
      { id: 'nfts', label: 'Marks', hash: '#/nfts', icon: 'nfts' },
      { id: 'lore', label: 'Legend', hash: '#/lore', icon: 'lore' },
      { id: 'dark', label: 'The dark', hash: '#/dark', icon: 'dark' },
      { id: 'account', label: 'Account', hash: '#/account', icon: 'account' },
    ],
  },
  {
    id: 'build',
    label: 'The work',
    defaultOpen: false,
    items: [
      { id: 'projects', label: 'Projects', hash: '#/projects', icon: 'projects' },
      { id: 'create', label: 'Create', hash: '#/create', icon: 'create' },
      { id: 'ops', label: 'Ops', hash: '#/ops', icon: 'ops' },
      { id: 'revenue', label: 'Revenue', hash: '#/revenue', icon: 'revenue' },
    ],
  },
]

export const DRAWER_SECTIONS_STORAGE_KEY = 'hood-desk:drawer:sections'

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
  if (parts[0] === 'card') return { view: 'card' }
  if (
    parts[0] === 'nfts' ||
    parts[0] === 'nft' ||
    parts[0] === 'dogihood' ||
    parts[0] === 'stories' ||
    parts[0] === 'ccff00' ||
    parts[0] === 'gallery'
  ) {
    return { view: 'nfts' }
  }
  if (parts[0] === 'lore' || parts[0] === 'legend' || parts[0] === 'story') {
    return { view: 'lore' }
  }
  if (parts[0] === 'dark' || parts[0] === 'night' || parts[0] === 'game') {
    return { view: 'dark' }
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

export function drawerSectionHasActive(view: ViewId, section: DrawerSection): boolean {
  return section.items.some((item) => navActive(view, item.id))
}
