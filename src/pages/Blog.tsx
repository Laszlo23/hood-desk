import { useMemo, useState, type FormEvent } from 'react'
import {
  createBlogPost,
  deleteBlogPost,
  getBlogPost,
  listBlogPosts,
  updateBlogPost,
  type BlogPost,
} from '../lib/blog'
import {
  BANNER_SEED_LINES,
  clearBannerOverride,
  currentWeekKey,
  getBannerOverride,
  getWeeklyBanner,
  setBannerOverride,
} from '../lib/banner'
import { awardXp } from '../lib/gamification'
import type { ViewId } from '../lib/nav'
import { WeeklyBanner } from '../components/WeeklyBanner'

type Props = {
  slug?: string
  onNavigate: (id: ViewId, slugOrProject?: string) => void
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return iso.slice(0, 10)
  }
}

/** Very light markdown-ish: paragraphs + **bold** */
function renderBody(body: string) {
  return body.split(/\n\n+/).map((para, i) => {
    const parts = para.split(/(\*\*[^*]+\*\*)/g)
    return (
      <p key={i}>
        {parts.map((p, j) =>
          p.startsWith('**') && p.endsWith('**') ? (
            <strong key={j}>{p.slice(2, -2)}</strong>
          ) : (
            <span key={j}>{p}</span>
          ),
        )}
      </p>
    )
  })
}

export function Blog({ slug, onNavigate }: Props) {
  const [tick, setTick] = useState(0)
  const [admin, setAdmin] = useState(false)
  const posts = useMemo(() => listBlogPosts(), [tick])
  const post = useMemo(() => (slug ? getBlogPost(slug) : undefined), [slug, tick])

  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [editId, setEditId] = useState<string | null>(null)
  const [bannerText, setBannerText] = useState(() => getWeeklyBanner().text)
  const [bannerMsg, setBannerMsg] = useState('')

  const startEdit = (p: BlogPost) => {
    setEditId(p.id)
    setTitle(p.title)
    setBody(p.body)
    setAdmin(true)
  }

  const resetForm = () => {
    setEditId(null)
    setTitle('')
    setBody('')
  }

  const onSave = (e: FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    if (editId) {
      updateBlogPost(editId, { title, body })
    } else {
      const created = createBlogPost({ title, body })
      awardXp('write_blog')
      onNavigate('blog', created.slug)
    }
    resetForm()
    setTick((t) => t + 1)
  }

  const onDelete = (id: string) => {
    if (!window.confirm('Delete this post?')) return
    deleteBlogPost(id)
    resetForm()
    setTick((t) => t + 1)
    if (slug) onNavigate('blog')
  }

  const saveBanner = () => {
    setBannerOverride(bannerText, currentWeekKey())
    setBannerMsg('Banner override saved for this week (localStorage).')
    setTick((t) => t + 1)
  }

  const clearBanner = () => {
    clearBannerOverride()
    setBannerText(getWeeklyBanner().text)
    setBannerMsg('Override cleared — using seeded weekly rotation.')
    setTick((t) => t + 1)
  }

  if (slug && post) {
    return (
      <section className="page blog-page">
        <WeeklyBanner />
        <div className="page-intro">
          <button type="button" className="link-btn" onClick={() => onNavigate('blog')}>
            ← Blog
          </button>
          <p className="eyebrow mt">{formatDate(post.date)}</p>
          <h1>{post.title}</h1>
        </div>
        <article className="card blog-article">{renderBody(post.body)}</article>
        <div className="cta-row mt">
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => startEdit(post)}>
            Edit post
          </button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => onDelete(post.id)}>
            Delete
          </button>
        </div>
      </section>
    )
  }

  if (slug && !post) {
    return (
      <section className="page">
        <div className="card">
          <p>Post not found.</p>
          <button type="button" className="btn btn-primary mt" onClick={() => onNavigate('blog')}>
            Back to blog
          </button>
        </div>
      </section>
    )
  }

  const override = getBannerOverride()

  return (
    <section className="page blog-page">
      <WeeklyBanner />
      <div className="page-intro">
        <p className="eyebrow">Hood Street</p>
        <h1>Blog</h1>
        <p className="muted">
          Motivational posts for builders & traders. Stored in{' '}
          <code className="inline-code">hood-desk:blog:v1</code>. Toggle admin to edit.
        </p>
        <div className="cta-row">
          <button
            type="button"
            className={`btn btn-sm ${admin ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setAdmin((a) => !a)}
          >
            {admin ? 'Exit admin' : 'Admin / edit'}
          </button>
        </div>
      </div>

      <div className="blog-list">
        {posts.map((p) => (
          <article key={p.id} className="card blog-card">
            <p className="eyebrow">{formatDate(p.date)}</p>
            <h2 className="section-title">
              <button type="button" className="link-btn blog-title-btn" onClick={() => onNavigate('blog', p.slug)}>
                {p.title}
              </button>
            </h2>
            <p className="muted">{p.body.slice(0, 140)}{p.body.length > 140 ? '…' : ''}</p>
            <div className="cta-row mt">
              <button type="button" className="btn btn-primary btn-sm" onClick={() => onNavigate('blog', p.slug)}>
                Read →
              </button>
              {admin && (
                <>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => startEdit(p)}>
                    Edit
                  </button>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => onDelete(p.id)}>
                    Delete
                  </button>
                </>
              )}
            </div>
          </article>
        ))}
      </div>

      {admin && (
        <>
          <form className="card form-card mt" onSubmit={onSave}>
            <h2 className="section-title">{editId ? 'Edit post' : 'New post'}</h2>
            <label className="field">
              <span className="rail-label">Title</span>
              <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </label>
            <label className="field">
              <span className="rail-label">Body (plain / light **markdown**)</span>
              <textarea
                className="input textarea"
                rows={8}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                required
              />
            </label>
            <div className="cta-row">
              <button type="submit" className="btn btn-primary">
                {editId ? 'Save changes' : 'Publish post'}
              </button>
              {editId && (
                <button type="button" className="btn btn-ghost" onClick={resetForm}>
                  Cancel edit
                </button>
              )}
            </div>
          </form>

          <article className="card mt">
            <h2 className="section-title">Weekly banner</h2>
            <p className="muted small">
              Site-wide motivational line. Auto-rotates from {BANNER_SEED_LINES.length} seeded lines;
              override persists in localStorage for the week key.
            </p>
            <p className="tiny muted">
              Current week: <code className="inline-code">{currentWeekKey()}</code>
              {override ? ` · override set` : ' · using seed'}
            </p>
            <label className="field">
              <span className="rail-label">Banner text</span>
              <textarea
                className="input textarea"
                rows={3}
                value={bannerText}
                onChange={(e) => setBannerText(e.target.value)}
              />
            </label>
            <div className="cta-row">
              <button type="button" className="btn btn-primary btn-sm" onClick={saveBanner}>
                Save banner override
              </button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={clearBanner}>
                Clear override
              </button>
            </div>
            {bannerMsg && <p className="ok-line mt">{bannerMsg}</p>}
            <details className="mt">
              <summary className="muted small">Seeded rotation lines</summary>
              <ul className="spec-list">
                {BANNER_SEED_LINES.map((line) => (
                  <li key={line}>
                    <span className="tiny">{line}</span>
                  </li>
                ))}
              </ul>
            </details>
          </article>
        </>
      )}
    </section>
  )
}
