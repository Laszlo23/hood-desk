import { getAddress, isAddress } from 'viem'
import { HOOD_TOKEN_ADDRESS } from '../hoodToken'
import { listProjects } from '../projects'
import { DEMO_TOKENS, HOOD_DEMO_ADDRESS } from './demoTokens'
import type { TradeToken, VetResult, VetVerdict } from './types'

const ZERO = '0x0000000000000000000000000000000000000000'
const SPAM_PATTERNS = [
  /0xdead/i,
  /0x000000000000000000000000000000000000dead/i,
  /^0x([0-9a-f])\1{39}$/i, // repeated nibble
]

export type VetInput = {
  address: string
  website?: string
  twitter?: string
  farcaster?: string
  discord?: string
  telegram?: string
  wallet?: string | null
  /** Optional known token meta from picker */
  token?: TradeToken
}

function hasSocial(v?: string): boolean {
  return Boolean(v && v.trim().length > 4)
}

/** Rule-based AI project check — score + verdict + reasons. */
export function vetToken(input: VetInput): VetResult {
  const reasons: string[] = []
  let score = 50
  const raw = input.address.trim()
  const checkedAt = new Date().toISOString()

  if (!raw) {
    return {
      score: 0,
      verdict: 'High risk',
      reasons: ['No token address provided.'],
      address: '',
      checkedAt,
    }
  }

  if (!/^0x[a-fA-F0-9]*$/.test(raw) || raw.length !== 42) {
    reasons.push('Address length/format invalid (expect 0x + 40 hex).')
    score -= 40
  } else if (!isAddress(raw)) {
    reasons.push('Fails EIP-55 / viem isAddress check.')
    score -= 25
  } else {
    try {
      const checksummed = getAddress(raw)
      if (checksummed !== raw && raw !== raw.toLowerCase()) {
        reasons.push('Checksum mixed-case does not match EIP-55 (caution).')
        score -= 5
      } else {
        reasons.push('Address format looks valid (0x + 40 hex).')
        score += 10
      }
    } catch {
      reasons.push('Checksum parse failed.')
      score -= 15
    }
  }

  const lower = raw.toLowerCase()
  if (lower === ZERO) {
    reasons.push('Zero address — cannot be a tradeable token.')
    score -= 50
  }

  for (const pat of SPAM_PATTERNS) {
    if (pat.test(raw)) {
      reasons.push('Matches known spam / burn-style address pattern.')
      score -= 30
      break
    }
  }

  const projects = listProjects(input.wallet)
  const inProjects = projects.find(
    (p) => p.fairLaunch?.tokenAddress?.toLowerCase() === lower,
  )
  if (inProjects) {
    reasons.push(`Found in local Hood Desk projects (“${inProjects.name}”).`)
    score += 20
    if (inProjects.fairLaunch) {
      reasons.push('Fair launch record attached on local project.')
      score += 10
    }
  } else if (input.token?.projectId) {
    reasons.push('Linked to a local Hood Desk project.')
    score += 15
  } else {
    reasons.push('Not found in local projects store.')
    score -= 5
  }

  const demoHit = DEMO_TOKENS.find((t) => t.address.toLowerCase() === lower)
  if (demoHit || lower === HOOD_DEMO_ADDRESS.toLowerCase()) {
    reasons.push('Known Hood Desk demo token (seeded candles — not live DEX).')
    score += 15
  }

  const socials = {
    website: input.website ?? input.token?.socials?.website,
    twitter: input.twitter ?? input.token?.socials?.twitter,
    farcaster: input.farcaster ?? input.token?.socials?.farcaster,
    discord: input.discord ?? input.token?.socials?.discord,
    telegram: input.telegram ?? input.token?.socials?.telegram,
  }
  const socialCount = Object.values(socials).filter(hasSocial).length
  if (socialCount >= 2) {
    reasons.push(`Socials present (${socialCount} links).`)
    score += 12
  } else if (socialCount === 1) {
    reasons.push('Only one social / website link — thin presence.')
    score += 4
  } else {
    reasons.push('No website or socials provided.')
    score -= 12
  }

  if (input.token?.fairLaunchAttached || inProjects?.fairLaunch) {
    reasons.push('Fair launch attached (mint-once pattern expected).')
    score += 8
  } else {
    reasons.push('No fair-launch attachment visible.')
    score -= 4
  }

  reasons.push('On-chain age / holder analytics unknown (no RH indexer wired).')
  score -= 8

  if (HOOD_TOKEN_ADDRESS && raw.toLowerCase() === HOOD_TOKEN_ADDRESS.toLowerCase()) {
    reasons.push('$HOOD/WETH is live on Uniswap V3. Market swaps on Trade are wallet-signed. The pool is thin.')
    score += 6
  } else {
    reasons.push('No confirmed Uniswap pool for this token — desk orders stay local.')
    score -= 5
  }

  score = Math.max(0, Math.min(100, Math.round(score)))

  let verdict: VetVerdict
  if (score >= 70) verdict = 'Likely real'
  else if (score >= 40) verdict = 'Caution'
  else verdict = 'High risk'

  return {
    score,
    verdict,
    reasons,
    address: raw,
    checkedAt,
  }
}

export function formatVetSummary(r: VetResult): string {
  const bullets = r.reasons.map((x) => `• ${x}`).join('\n')
  return `**AI project check** — ${r.verdict} (score ${r.score}/100)\n\nAddress: \`${r.address || '—'}\`\n\n${bullets}\n\n_Rule-based heuristic. Not financial advice. On-chain swaps TODO until RH DEX is known._`
}
