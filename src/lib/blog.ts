/**
 * Editable Hood Street blog — localStorage `hood-desk:blog:v1`.
 * Admin/edit mode is local (no auth); seed motivational posts.
 */

const KEY = 'hood-desk:blog:v1'

export type BlogPost = {
  id: string
  slug: string
  title: string
  body: string
  /** ISO date */
  date: string
  updatedAt: string
}

function uid(): string {
  return `post_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`
}

function slugify(title: string): string {
  const base = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48)
  return base || `post-${Date.now().toString(36)}`
}

const SEED: BlogPost[] = [
  {
    id: 'post_seed_build',
    slug: 'build-on-hood-street',
    title: 'Build on Hood Street',
    body: `Hood Desk is an AI-run trading desk on Robinhood Chain (4663). Create a project, fair-launch a token, and let the fox keep ops online.

Creators earn when people trade your token — **demo ledger today**, real fee routing when RH DEX lands. No invented routers. No fake mainnet payouts.

Ship fair. Stay neon. #CCFF00.`,
    date: '2026-09-22T10:00:00.000Z',
    updatedAt: '2026-09-22T10:00:00.000Z',
  },
  {
    id: 'post_seed_trade',
    slug: 'trade-skills-rewards',
    title: 'Trade · Skills · Rewards',
    body: `One loop, three doors:

1. **Trade** — simulate fills on RH-flavored pairs (local_ord_* only until DEX).
2. **Skill Market** — follow bots; creators get demo follow + usage credits.
3. **Rewards** — token creator 50% / platform 30% / bot-or-referrer 20% of simulated fees.

Everything stays honest: localStorage ledgers until chain fees are real. Open the desk, pick a path, keep the streak.`,
    date: '2026-09-28T14:00:00.000Z',
    updatedAt: '2026-09-28T14:00:00.000Z',
  },
  {
    id: 'post_seed_dogihood',
    slug: 'dogihood-pack-pride',
    title: 'DogiHood pack pride on Hood Desk',
    body: `Featured NFT: **DogiHood** — pixel Shibas on Robinhood Chain (4663). Browse the pack on [OpenSea](https://opensea.io/collection/dogihood). Hood Desk keeps the HOOD fox as the agent mark; DogiHood is pack pride for holders.

No promises. Clean pixels. Dogs on-chain.`,
    date: '2026-09-30T08:00:00.000Z',
    updatedAt: '2026-09-30T08:00:00.000Z',
  },
]

function readAll(): BlogPost[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) {
      writeAll(SEED)
      return [...SEED]
    }
    const parsed = JSON.parse(raw) as BlogPost[]
    if (!Array.isArray(parsed) || parsed.length === 0) {
      writeAll(SEED)
      return [...SEED]
    }
    return parsed
  } catch {
    writeAll(SEED)
    return [...SEED]
  }
}

function writeAll(posts: BlogPost[]): void {
  localStorage.setItem(KEY, JSON.stringify(posts))
}

export function listBlogPosts(): BlogPost[] {
  return readAll().sort((a, b) => (a.date < b.date ? 1 : -1))
}

export function getBlogPost(slugOrId: string): BlogPost | undefined {
  const q = slugOrId.toLowerCase()
  return listBlogPosts().find((p) => p.slug === q || p.id === slugOrId)
}

export function createBlogPost(input: {
  title: string
  body: string
  date?: string
  slug?: string
}): BlogPost {
  const now = new Date().toISOString()
  const posts = readAll()
  let slug = (input.slug?.trim() || slugify(input.title)).toLowerCase()
  if (posts.some((p) => p.slug === slug)) slug = `${slug}-${uid().slice(-4)}`
  const post: BlogPost = {
    id: uid(),
    slug,
    title: input.title.trim() || 'Untitled',
    body: input.body.trim(),
    date: input.date || now,
    updatedAt: now,
  }
  posts.unshift(post)
  writeAll(posts)
  return post
}

export function updateBlogPost(
  id: string,
  patch: Partial<Pick<BlogPost, 'title' | 'body' | 'date' | 'slug'>>,
): BlogPost | null {
  const posts = readAll()
  const idx = posts.findIndex((p) => p.id === id)
  if (idx < 0) return null
  const next = {
    ...posts[idx],
    ...patch,
    title: patch.title?.trim() ?? posts[idx].title,
    body: patch.body ?? posts[idx].body,
    slug: patch.slug?.trim().toLowerCase() || posts[idx].slug,
    updatedAt: new Date().toISOString(),
  }
  posts[idx] = next
  writeAll(posts)
  return next
}

export function deleteBlogPost(id: string): boolean {
  const posts = readAll()
  const next = posts.filter((p) => p.id !== id)
  if (next.length === posts.length) return false
  writeAll(next)
  return true
}

export { KEY as BLOG_STORAGE_KEY }
