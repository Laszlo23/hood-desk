import type { Address, PublicClient } from 'viem'
import { parseIntent } from './intents'
import { invokeSkill, skillCount, type SkillId } from './skills'
import type { ToolContext } from './tools'

export type ChatMessage = {
  id: string
  role: 'user' | 'agent'
  text: string
}

export function greetingMessage(): ChatMessage {
  return {
    id: 'greeting',
    role: 'agent',
    text: `GM. **HOOD** here — community desk online. 🦊\n\nFlagship agent on Robinhood Chain **4663**. **${skillCount()} skills** ready.\n\n$HOOD market swaps on **#/trade** are wallet-signed Uniswap fills. I do not place orders and I do not run a paper book.`,
  }
}

export async function agentReply(
  userText: string,
  ctx: ToolContext & { address?: Address; publicClient?: PublicClient },
): Promise<ChatMessage> {
  const intent = parseIntent(userText)
  let result

  if (intent === 'unknown') {
    result = {
      ok: true,
      text: `Not sure I caught that. Try **list skills**, **balance**, **list projects**, **explain fair launch**, **gm**, or **help**.\n\n(Rule-based Desk — ${skillCount()} skills, no paid LLM. Your wallet signs; I never hold keys.)`,
    }
  } else {
    result = await invokeSkill(intent as SkillId, ctx, userText)
  }

  return {
    id: `a-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    role: 'agent',
    text: result.text,
  }
}
