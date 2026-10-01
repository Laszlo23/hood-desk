import { HoodMark } from './HoodMark'

type Props = {
  line: string
  onLegend?: () => void
}

/** Logo plus one line of the legend, used at the top of a working page. */
export function DeskStory({ line, onLegend }: Props) {
  return (
    <div className="desk-story">
      <HoodMark size={44} variant="logo" alt="Hood Desk" />
      <p>{line}</p>
      {onLegend ? (
        <button type="button" className="link-btn desk-story-link" onClick={onLegend}>
          The legend
        </button>
      ) : null}
    </div>
  )
}
