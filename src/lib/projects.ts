import { isAddress, type Address } from 'viem'

export type SocialLinks = {
  website?: string
  twitter?: string
  farcaster?: string
  discord?: string
  telegram?: string
}

export type FairLaunchStatus = 'draft' | 'simulated' | 'deployed'

export type LpChecklistItem = {
  id: string
  label: string
  done: boolean
}

export type FairLaunchToken = {
  name: string
  symbol: string
  /** Human supply e.g. "1000000000" (1B) */
  supply: string
  decimals: number
  status: FairLaunchStatus
  /** Pasted after forge deploy; also used as VITE_HOOD_TOKEN-style field */
  tokenAddress?: string
  /** Who earns creator fee share on simulated trades (demo ledger). */
  creatorAddress?: string
  createdAt: string
  updatedAt: string
  /** Fair launch — mint-once, no team mint after deploy, no transfer tax */
  copy: string
  lpChecklist: LpChecklistItem[]
}

export type Project = {
  id: string
  name: string
  /** Optional until token launch */
  ticker?: string
  description: string
  socials: SocialLinks
  logoUrl?: string
  avatarEmoji?: string
  /** How the AI business should talk */
  agentPersona?: string
  /** Default creator for rewards when fair-launch attaches a token. */
  creatorAddress?: string
  fairLaunch?: FairLaunchToken
  createdAt: string
  updatedAt: string
}

export type ProjectInput = {
  name: string
  ticker?: string
  description: string
  socials?: SocialLinks
  logoUrl?: string
  avatarEmoji?: string
  agentPersona?: string
}

const STORAGE_PREFIX = 'hood-desk:projects:'
export const FAIR_LAUNCH_COPY =
  'Fair launch — mint-once, no team mint after deploy, no transfer tax'

export const DEFAULT_SUPPLY = '1000000000'
export const DEFAULT_DECIMALS = 18

export function defaultLpChecklist(): LpChecklistItem[] {
  return [
    { id: 'deploy', label: 'Deploy fair ERC-20 via forge (hood-token pattern)', done: false },
    { id: 'verify', label: 'Verify contract on explorer (Blockscout RH 4663)', done: false },
    { id: 'paste', label: 'Paste tokenAddress on project detail', done: false },
    { id: 'dex', label: 'TODO: confirm RH DEX / AMM router (do not invent)', done: false },
    { id: 'lp', label: 'TODO: create LP once DEX known', done: false },
    { id: 'lock', label: 'TODO: lock LP + publish lock link', done: false },
  ]
}

export function storageOwnerKey(address?: string | null): string {
  if (address && isAddress(address)) return address.toLowerCase()
  return 'anon'
}

function storageKey(owner: string): string {
  return `${STORAGE_PREFIX}${owner}`
}

function uid(): string {
  return `p_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

/** Deterministic demo 0x address for local simulate (not a real deploy). */
export function demoTokenAddress(projectId: string): string {
  const hex = projectId.replace(/[^a-fA-F0-9]/g, '') || 'dead'
  const padded = (hex + 'c'.repeat(40)).slice(0, 40)
  return (`0x${padded}`).toLowerCase()
}

function readRaw(owner: string): Project[] {
  try {
    const raw = localStorage.getItem(storageKey(owner))
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed as Project[]
  } catch {
    return []
  }
}

function writeRaw(owner: string, projects: Project[]): void {
  localStorage.setItem(storageKey(owner), JSON.stringify(projects))
}

export function listProjects(address?: string | null): Project[] {
  const owner = storageOwnerKey(address)
  return readRaw(owner).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
}

export function getProject(id: string, address?: string | null): Project | null {
  return listProjects(address).find((p) => p.id === id) ?? null
}

export function createProject(input: ProjectInput, address?: string | null): Project {
  const owner = storageOwnerKey(address)
  const now = new Date().toISOString()
  const project: Project = {
    id: uid(),
    name: input.name.trim(),
    ticker: input.ticker?.trim().toUpperCase() || undefined,
    description: input.description.trim(),
    socials: sanitizeSocials(input.socials),
    logoUrl: cleanUrl(input.logoUrl),
    avatarEmoji: input.avatarEmoji?.trim() || '🦊',
    agentPersona: input.agentPersona?.trim() || undefined,
    creatorAddress: address && isAddress(address) ? address.toLowerCase() : undefined,
    createdAt: now,
    updatedAt: now,
  }
  const all = readRaw(owner)
  all.unshift(project)
  writeRaw(owner, all)
  return project
}

export function updateProject(
  id: string,
  patch: Partial<Omit<Project, 'id' | 'createdAt'>>,
  address?: string | null,
): Project | null {
  const owner = storageOwnerKey(address)
  const all = readRaw(owner)
  const idx = all.findIndex((p) => p.id === id)
  if (idx < 0) return null
  const next: Project = {
    ...all[idx],
    ...patch,
    socials: patch.socials ? sanitizeSocials(patch.socials) : all[idx].socials,
    updatedAt: new Date().toISOString(),
  }
  all[idx] = next
  writeRaw(owner, all)
  return next
}

export function attachSocials(
  id: string,
  socials: SocialLinks,
  address?: string | null,
): Project | null {
  const existing = getProject(id, address)
  if (!existing) return null
  return updateProject(id, { socials: { ...existing.socials, ...sanitizeSocials(socials) } }, address)
}

export type FairLaunchConfig = {
  name: string
  symbol: string
  supply?: string
  decimals?: number
  /** Token creator for demo rewards; defaults to project.creatorAddress / wallet. */
  creatorAddress?: string
}

/** Local/demo: create pending fair launch (draft → simulated). */
export function simulateFairLaunch(
  id: string,
  config: FairLaunchConfig,
  address?: string | null,
): Project | null {
  const existing = getProject(id, address)
  if (!existing) return null
  const now = new Date().toISOString()
  const creatorAddress =
    (config.creatorAddress?.trim() ||
      existing.fairLaunch?.creatorAddress ||
      existing.creatorAddress ||
      (address && isAddress(address) ? address.toLowerCase() : undefined)) ||
    undefined
  const fairLaunch: FairLaunchToken = {
    name: config.name.trim() || existing.name,
    symbol: (config.symbol.trim() || existing.ticker || 'TOKEN').toUpperCase(),
    supply: config.supply?.trim() || DEFAULT_SUPPLY,
    decimals: config.decimals ?? DEFAULT_DECIMALS,
    status: 'simulated',
    createdAt: existing.fairLaunch?.createdAt || now,
    updatedAt: now,
    copy: FAIR_LAUNCH_COPY,
    lpChecklist: existing.fairLaunch?.lpChecklist ?? defaultLpChecklist(),
    tokenAddress: existing.fairLaunch?.tokenAddress || demoTokenAddress(id),
    creatorAddress,
  }
  const patch: Partial<Omit<Project, 'id' | 'createdAt'>> = {
    fairLaunch,
    ticker: fairLaunch.symbol,
  }
  if (creatorAddress) patch.creatorAddress = creatorAddress
  return updateProject(id, patch, address)
}

/** Save draft config without simulating. */
export function saveFairLaunchDraft(
  id: string,
  config: FairLaunchConfig,
  address?: string | null,
): Project | null {
  const existing = getProject(id, address)
  if (!existing) return null
  const now = new Date().toISOString()
  const creatorAddress =
    (config.creatorAddress?.trim() ||
      existing.fairLaunch?.creatorAddress ||
      existing.creatorAddress ||
      (address && isAddress(address) ? address.toLowerCase() : undefined)) ||
    undefined
  const fairLaunch: FairLaunchToken = {
    name: config.name.trim() || existing.name,
    symbol: (config.symbol.trim() || existing.ticker || 'TOKEN').toUpperCase(),
    supply: config.supply?.trim() || DEFAULT_SUPPLY,
    decimals: config.decimals ?? DEFAULT_DECIMALS,
    status: 'draft',
    createdAt: existing.fairLaunch?.createdAt || now,
    updatedAt: now,
    copy: FAIR_LAUNCH_COPY,
    lpChecklist: existing.fairLaunch?.lpChecklist ?? defaultLpChecklist(),
    tokenAddress: existing.fairLaunch?.tokenAddress,
    creatorAddress,
  }
  const patch: Partial<Omit<Project, 'id' | 'createdAt'>> = {
    fairLaunch,
    ticker: fairLaunch.symbol,
  }
  if (creatorAddress) patch.creatorAddress = creatorAddress
  return updateProject(id, patch, address)
}

/** Paste deployed address (after forge script from Desktop/hood-token). */
export function setProjectTokenAddress(
  id: string,
  tokenAddress: string,
  address?: string | null,
): Project | null {
  const existing = getProject(id, address)
  if (!existing) return null
  const cleaned = tokenAddress.trim()
  if (!isAddress(cleaned)) return null
  const now = new Date().toISOString()
  const base = existing.fairLaunch ?? {
    name: existing.name,
    symbol: existing.ticker || 'TOKEN',
    supply: DEFAULT_SUPPLY,
    decimals: DEFAULT_DECIMALS,
    status: 'draft' as FairLaunchStatus,
    createdAt: now,
    updatedAt: now,
    copy: FAIR_LAUNCH_COPY,
    lpChecklist: defaultLpChecklist(),
  }
  const checklist = base.lpChecklist.map((item) =>
    item.id === 'paste' || item.id === 'deploy' ? { ...item, done: true } : item,
  )
  const creatorAddress =
    base.creatorAddress ||
    existing.creatorAddress ||
    (address && isAddress(address) ? address.toLowerCase() : undefined)
  const fairLaunch: FairLaunchToken = {
    ...base,
    tokenAddress: cleaned as Address,
    status: 'deployed',
    updatedAt: now,
    lpChecklist: checklist,
    creatorAddress,
  }
  const patch: Partial<Omit<Project, 'id' | 'createdAt'>> = { fairLaunch }
  if (creatorAddress) patch.creatorAddress = creatorAddress
  return updateProject(id, patch, address)
}

export function toggleLpChecklistItem(
  id: string,
  itemId: string,
  address?: string | null,
): Project | null {
  const existing = getProject(id, address)
  if (!existing?.fairLaunch) return null
  const lpChecklist = existing.fairLaunch.lpChecklist.map((item) =>
    item.id === itemId ? { ...item, done: !item.done } : item,
  )
  return updateProject(
    id,
    { fairLaunch: { ...existing.fairLaunch, lpChecklist, updatedAt: new Date().toISOString() } },
    address,
  )
}

export function deleteProject(id: string, address?: string | null): boolean {
  const owner = storageOwnerKey(address)
  const all = readRaw(owner)
  const next = all.filter((p) => p.id !== id)
  if (next.length === all.length) return false
  writeRaw(owner, next)
  return true
}

function cleanUrl(raw?: string): string | undefined {
  const t = raw?.trim()
  if (!t) return undefined
  if (/^https?:\/\//i.test(t)) return t
  if (/^[\w.-]+\.[a-z]{2,}/i.test(t)) return `https://${t}`
  return t
}

function sanitizeSocials(socials?: SocialLinks): SocialLinks {
  if (!socials) return {}
  return {
    website: cleanUrl(socials.website),
    twitter: cleanUrl(socials.twitter),
    farcaster: cleanUrl(socials.farcaster),
    discord: cleanUrl(socials.discord),
    telegram: cleanUrl(socials.telegram),
  }
}

export function socialChips(socials: SocialLinks): { label: string; href: string }[] {
  const out: { label: string; href: string }[] = []
  if (socials.website) out.push({ label: 'Website', href: socials.website })
  if (socials.twitter) out.push({ label: 'X / Twitter', href: socials.twitter })
  if (socials.farcaster) out.push({ label: 'Farcaster', href: socials.farcaster })
  if (socials.discord) out.push({ label: 'Discord', href: socials.discord })
  if (socials.telegram) out.push({ label: 'Telegram', href: socials.telegram })
  return out
}

export function suggestTickerFromName(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return 'HOOD'
  if (words.length === 1) {
    const w = words[0].replace(/[^a-zA-Z0-9]/g, '')
    return (w.slice(0, 5) || 'HOOD').toUpperCase()
  }
  const initials = words.map((w) => w[0]).join('').replace(/[^a-zA-Z0-9]/g, '')
  return (initials.slice(0, 5) || 'HOOD').toUpperCase()
}
