import { useEffect, useRef, useState } from 'react'
import { useAccount, usePublicClient } from 'wagmi'
import { agentReply, greetingMessage, type ChatMessage } from '../lib/agent/reply'
import { robinhoodChain } from '../lib/chain'
import { ActionsStrip } from './ActionsStrip'
import { HoodMark } from './HoodMark'
import { HoodAgentBadge } from './HoodAgentBadge'
import { HoodSeal } from './HoodSeal'

function renderMarkdownish(text: string) {
  return text.split('\n').map((line, i) => (
    <p key={i}>
      {line.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((part, j) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={j}>{part.slice(2, -2)}</strong>
        }
        if (part.startsWith('`') && part.endsWith('`')) {
          return (
            <code key={j} className="inline-code">
              {part.slice(1, -1)}
            </code>
          )
        }
        return <span key={j}>{part}</span>
      })}
    </p>
  ))
}

type Props = {
  onReady?: (send: (text: string) => void) => void
}

export function Chat({ onReady }: Props) {
  const { address, chainId } = useAccount()
  const publicClient = usePublicClient({ chainId: robinhoodChain.id })
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const greeted = useRef(false)
  const sendRef = useRef<(text: string) => void>(() => {})

  const send = async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || busy) return

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      text: trimmed,
    }
    setMessages((m) => [...m, userMsg])
    setInput('')
    setBusy(true)

    try {
      const reply = await agentReply(trimmed, {
        address,
        publicClient: publicClient ?? undefined,
        chainId,
      })
      setMessages((m) => [...m, reply])
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      setMessages((m) => [
        ...m,
        {
          id: `a-err-${Date.now()}`,
          role: 'agent',
          text: `Something broke: ${msg.split('\n')[0]}`,
        },
      ])
    } finally {
      setBusy(false)
    }
  }

  sendRef.current = (text: string) => {
    void send(text)
  }

  useEffect(() => {
    if (greeted.current) return
    greeted.current = true
    setMessages([greetingMessage()])
  }, [])

  useEffect(() => {
    onReady?.((text) => sendRef.current(text))
  }, [onReady])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, busy])

  return (
    <section className="chat-column">
      <header className="chat-head row-gap">
        <HoodMark size={44} variant="photo" bounce className="chat-hood-mascot" />
        <div>
          <h1>Night Ledger</h1>
          <p className="muted">A member’s agent. It does not speak for Hood Street or DogiHood.</p>
          <HoodAgentBadge compact className="chat-hood-badge" />
        </div>
      </header>

      <div className="chat-log" role="log" aria-live="polite">
        {messages.length <= 1 && (
          <div className="chat-empty-hood" aria-hidden>
            <HoodMark size={96} variant="photo" className="chat-empty-mascot" />
            <HoodSeal size={36} decorative className="chat-empty-seal" />
            <p className="muted tiny">HOOD here. Ask a question. This does not place a trade.</p>
          </div>
        )}
        {messages.map((m) => (
          <div key={m.id} className={`bubble ${m.role}`}>
            <div className="bubble-text">{renderMarkdownish(m.text)}</div>
          </div>
        ))}
        {busy && (
          <div className="bubble agent">
            <div className="bubble-text muted">Desk thinking…</div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <ActionsStrip onInject={(p) => void send(p)} disabled={busy} />

      <form
        className="chat-input-row"
        onSubmit={(e) => {
          e.preventDefault()
          void send(input)
        }}
      >
        <input
          className="input"
          placeholder="Ask Desk… try “what can you do?”"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={busy}
          autoComplete="off"
        />
        <button type="submit" className="btn btn-primary" disabled={busy || !input.trim()}>
          SEND
        </button>
      </form>
    </section>
  )
}
