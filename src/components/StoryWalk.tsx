import { STORY } from '../lib/story'
import type { ViewId } from '../lib/nav'

type Props = {
  onNavigate: (id: ViewId) => void
  /** path = the walk on the home page. page = the full telling. */
  mode?: 'path' | 'page'
}

export function StoryWalk({ onNavigate, mode = 'path' }: Props) {
  if (mode === 'page') {
    return (
      <div className="story-page">
        {STORY.map((chapter, index) => (
          <article key={chapter.id} className="card story-page-chapter" id={`story-${chapter.id}`}>
            {chapter.image ? (
              <img src={chapter.image} alt="" className="story-page-art" />
            ) : null}
            <p className="eyebrow">
              {String(index + 1).padStart(2, '0')} · {chapter.title}
            </p>
            <h2 className="section-title">{chapter.title}</h2>
            <p className="story-page-body">{chapter.body}</p>
            {chapter.door === 'lore' ? null : (
              <button type="button" className="btn btn-quiet" onClick={() => onNavigate(chapter.door)}>
                {chapter.doorLabel}
              </button>
            )}
          </article>
        ))}
      </div>
    )
  }

  return (
    <ol className="story-path">
      {STORY.map((chapter, index) => (
        <li key={chapter.id}>
          <button type="button" className="story-step" onClick={() => onNavigate(chapter.door)}>
            {chapter.image ? <img src={chapter.image} alt="" /> : <span className="story-mark" aria-hidden />}
            <span className="story-step-copy">
              <span className="story-kicker">
                {String(index + 1).padStart(2, '0')} · {chapter.title}
              </span>
              <span className="story-line">{chapter.line}</span>
            </span>
            <span className="story-door">{chapter.doorLabel}</span>
          </button>
        </li>
      ))}
    </ol>
  )
}
