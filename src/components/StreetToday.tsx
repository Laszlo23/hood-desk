import { GM_FARCASTER_APP, STREET_DAY, STREET_POST_COUNT, gmCastUrl, streetTalk } from '../lib/streetDay'

export function StreetToday() {
  const bars = streetTalk()
  const peak = bars[0]?.count ?? 1
  const when = new Date(STREET_DAY.readAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })

  return (
    <article className="card street-today">
      <p className="eyebrow">Today · {when}</p>
      <h2>Hood morning</h2>
      <p className="street-today-line">{STREET_DAY.line}</p>
      <p className="muted tiny">
        Read from the public{' '}
        <a href={STREET_DAY.profile} target="_blank" rel="noreferrer">
          @HoodStreetMini
        </a>{' '}
        profile. The last titled space ended {STREET_DAY.spaceWhen}:{' '}
        <a href={STREET_DAY.spaceHref} target="_blank" rel="noreferrer">
          {STREET_DAY.spaceTitle}
        </a>
        .
      </p>
      <div className="cta-row">
        <a className="btn btn-primary btn-sm" href={GM_FARCASTER_APP} target="_blank" rel="noreferrer">
          GM on Farcaster
        </a>
        <a className="btn btn-ghost btn-sm" href={gmCastUrl()} target="_blank" rel="noreferrer">
          Cast gm
        </a>
      </div>
      <p className="rail-label street-bars-label">Posted the most</p>
      <ul className="street-bars">
        {bars.map((row) => (
          <li key={row.label}>
            <span className="street-bar-name">{row.label}</span>
            <span className="street-bar-track" aria-hidden>
              <span className="street-bar-fill" style={{ width: `${Math.round((row.count / peak) * 100)}%` }} />
            </span>
            <span className="street-bar-count">{row.count}</span>
          </li>
        ))}
      </ul>
      <p className="tiny muted">
        How many of the {STREET_POST_COUNT} public posts on that profile named it.
      </p>
    </article>
  )
}
