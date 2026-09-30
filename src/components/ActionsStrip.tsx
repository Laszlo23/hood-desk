const ACTIONS: { label: string; prompt: string }[] = [
  { label: 'Balance', prompt: 'balance' },
  { label: 'Projects', prompt: 'list projects' },
  { label: 'Skills', prompt: 'list skills' },
  { label: 'Fair launch', prompt: 'explain fair launch' },
  { label: 'GM', prompt: 'gm' },
]

type Props = {
  onInject: (prompt: string) => void
  disabled?: boolean
}

export function ActionsStrip({ onInject, disabled }: Props) {
  return (
    <div className="actions-strip" role="toolbar" aria-label="Quick actions">
      {ACTIONS.map((a) => (
        <button
          key={a.label}
          type="button"
          className="btn btn-ghost btn-action"
          disabled={disabled}
          onClick={() => onInject(a.prompt)}
        >
          {a.label}
        </button>
      ))}
    </div>
  )
}
