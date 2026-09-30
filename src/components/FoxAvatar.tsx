import { HoodMark } from './HoodMark'

type Props = { size?: number; bounce?: boolean }

/** @deprecated Prefer HoodMark — kept as alias for chat / landing. */
export function FoxAvatar({ size = 64, bounce }: Props) {
  return (
    <div
      className={`fox-avatar hood-avatar-wrap${bounce ? ' bounce' : ''}`}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <HoodMark size={size} variant="avatar" bounce={false} />
    </div>
  )
}
