import type { ToolContext, ToolResult } from './tools'
import * as tools from './tools'

/** Skill id — also used as intent / invoke key. */
export type SkillId =
  | 'balance'
  | 'hood_balance'
  | 'ensure_chain'
  | 'explorer_link'
  | 'gas_tip'
  | 'create_project_help'
  | 'list_projects'
  | 'show_project'
  | 'attach_socials_help'
  | 'fair_launch_status'
  | 'explain_fair_launch'
  | 'price'
  | 'swap'
  | 'portfolio'
  | 'draft_tweet'
  | 'draft_farcaster'
  | 'summarize_project_pitch'
  | 'suggest_ticker'
  | 'how_desk_runs'
  | 'treasury_explain'
  | 'revenue_demo_stats'
  | 'daily_brief'
  | 'gm_streak'
  | 'neon_tips'
  | 'neon_tba'
  | 'fox_coach'
  | 'what_is_hood'
  | 'trade_vet'
  | 'trade_chart'
  | 'trade_order'
  | 'market_browse'
  | 'market_follow'
  | 'market_publish'
  | 'social_growth'
  | 'deploy_verify'
  | 'help'
  | 'list_skills'
  | 'whoami'

export type SkillCategory =
  | 'wallet'
  | 'project'
  | 'market'
  | 'social'
  | 'ops'
  | 'flavor'
  | 'meta'

export type SkillDef = {
  id: SkillId
  name: string
  category: SkillCategory
  description: string
  /** Example chat prompts that trigger this skill */
  examples: string[]
  invoke: (ctx: ToolContext, raw?: string) => Promise<ToolResult> | ToolResult
}

export const SKILLS: SkillDef[] = [
  {
    id: 'balance',
    name: 'Native balance',
    category: 'wallet',
    description: 'Read ETH balance on Robinhood Chain 4663',
    examples: ['balance', 'how much eth'],
    invoke: (ctx) => tools.getBalance(ctx),
  },
  {
    id: 'hood_balance',
    name: '$HOOD / token balance',
    category: 'wallet',
    description: 'Read $HOOD ERC-20 balance when VITE_HOOD_TOKEN is set',
    examples: ['$HOOD', 'hood balance'],
    invoke: (ctx) => tools.getHoodBalance(ctx),
  },
  {
    id: 'ensure_chain',
    name: 'Ensure RH 4663',
    category: 'wallet',
    description: 'Check wallet is on Robinhood Chain; tip how to switch',
    examples: ['switch chain', 'ensure RH', 'am I on 4663'],
    invoke: (ctx) => tools.ensureChainTip(ctx),
  },
  {
    id: 'explorer_link',
    name: 'Explorer link',
    category: 'wallet',
    description: 'Blockscout link for wallet or known $HOOD token',
    examples: ['explorer', 'blockscout'],
    invoke: (ctx) => tools.explorerLink(ctx),
  },
  {
    id: 'gas_tip',
    name: 'Gas tip',
    category: 'wallet',
    description: 'Static help for RH gas / funding the wallet',
    examples: ['gas', 'gas tip'],
    invoke: () => tools.gasTip(),
  },
  {
    id: 'create_project_help',
    name: 'Create project help',
    category: 'project',
    description: 'How to create a project with socials + persona',
    examples: ['create project', 'new project'],
    invoke: () => tools.createProjectHelp(),
  },
  {
    id: 'list_projects',
    name: 'List projects',
    category: 'project',
    description: 'List projects stored for this wallet (or anon)',
    examples: ['list projects', 'my projects'],
    invoke: (ctx) => tools.listProjectsSkill(ctx),
  },
  {
    id: 'show_project',
    name: 'Show project',
    category: 'project',
    description: 'Show the latest project or match by name fragment',
    examples: ['show project', 'project detail'],
    invoke: (ctx, raw) => tools.showProjectSkill(ctx, raw),
  },
  {
    id: 'attach_socials_help',
    name: 'Attach socials help',
    category: 'project',
    description: 'How to add website / X / Farcaster / Discord / Telegram',
    examples: ['attach socials', 'add twitter'],
    invoke: () => tools.attachSocialsHelp(),
  },
  {
    id: 'fair_launch_status',
    name: 'Fair launch status',
    category: 'project',
    description: 'Status of fair-launch token on the latest / named project',
    examples: ['fair launch status', 'token status'],
    invoke: (ctx, raw) => tools.fairLaunchStatusSkill(ctx, raw),
  },
  {
    id: 'explain_fair_launch',
    name: 'Explain fair launch',
    category: 'project',
    description: 'Mint-once, no team mint after deploy, no transfer tax',
    examples: ['explain fair launch', 'what is fair launch'],
    invoke: () => tools.explainFairLaunch(),
  },
  {
    id: 'price',
    name: 'Price (TODO DEX)',
    category: 'market',
    description: 'Honest stub until RH DEX / oracle is known',
    examples: ['price', 'quote'],
    invoke: (ctx) => tools.getPrice(ctx),
  },
  {
    id: 'swap',
    name: 'Swap (TODO DEX)',
    category: 'market',
    description: 'Honest stub — you sign; Desk never holds keys',
    examples: ['swap', 'trade'],
    invoke: (ctx) => tools.swapStub(ctx),
  },
  {
    id: 'portfolio',
    name: 'Portfolio summary',
    category: 'market',
    description: 'Connected native + $HOOD balances summary',
    examples: ['portfolio', 'holdings'],
    invoke: (ctx) => tools.portfolioSummary(ctx),
  },
  {
    id: 'draft_tweet',
    name: 'Draft tweet',
    category: 'social',
    description: 'Draft an X/Twitter post for the latest project',
    examples: ['draft tweet', 'tweet'],
    invoke: (ctx) => tools.draftTweet(ctx),
  },
  {
    id: 'draft_farcaster',
    name: 'Draft Farcaster cast',
    category: 'social',
    description: 'Draft a Farcaster cast for the latest project',
    examples: ['draft cast', 'farcaster'],
    invoke: (ctx) => tools.draftFarcaster(ctx),
  },
  {
    id: 'summarize_project_pitch',
    name: 'Summarize project pitch',
    category: 'social',
    description: 'One-liner pitch from stored project + persona',
    examples: ['pitch', 'summarize project'],
    invoke: (ctx) => tools.summarizeProjectPitch(ctx),
  },
  {
    id: 'suggest_ticker',
    name: 'Suggest ticker',
    category: 'social',
    description: 'Suggest a ticker from project name',
    examples: ['suggest ticker', 'ticker ideas'],
    invoke: (ctx, raw) => tools.suggestTickerSkill(ctx, raw),
  },
  {
    id: 'how_desk_runs',
    name: 'How Desk runs',
    category: 'ops',
    description: 'Ops loop: chat → act → fee → runway',
    examples: ['ops', 'how it runs'],
    invoke: () => tools.opsBrief(),
  },
  {
    id: 'treasury_explain',
    name: 'Treasury explain',
    category: 'ops',
    description: 'How DEX fees fund the agent treasury (no transfer tax)',
    examples: ['treasury', 'how fees work'],
    invoke: () => tools.treasuryExplain(),
  },
  {
    id: 'revenue_demo_stats',
    name: 'Revenue demo stats',
    category: 'ops',
    description: 'Canned demo revenue numbers (labeled demo)',
    examples: ['revenue', 'demo stats'],
    invoke: () => tools.revenueDemoStats(),
  },
  {
    id: 'daily_brief',
    name: 'Daily brief',
    category: 'ops',
    description: 'Canned morning brief for the desk',
    examples: ['daily brief', 'brief'],
    invoke: (ctx) => tools.dailyBrief(ctx),
  },
  {
    id: 'gm_streak',
    name: 'GM streak',
    category: 'flavor',
    description: 'GM + localStorage streak counter',
    examples: ['gm', 'good morning'],
    invoke: () => tools.gmStreak(),
  },
  {
    id: 'neon_tips',
    name: 'Neon tips',
    category: 'flavor',
    description: 'Static #CCFF00 / Hood Street style tips',
    examples: ['neon tips', 'hood street tips'],
    invoke: () => tools.neonTips(),
  },
  {
    id: 'neon_tba',
    name: 'Neon TBA (Hoodstreet)',
    category: 'wallet',
    description: 'Resolve CCFF00 ERC-6551 TBA + $HOOD balance via Hoodstreet MCP',
    examples: ['neon tba', 'ccff00 tba', 'neon wallet', 'tba 1'],
    invoke: (_ctx, raw) => tools.neonTbaSkill(raw),
  },
  {
    id: 'fox_coach',
    name: 'Fox coach',
    category: 'flavor',
    description: 'Witty fox coaching for shipping on RH',
    examples: ['fox coach', 'motivate me'],
    invoke: () => tools.foxCoach(),
  },
  {
    id: 'what_is_hood',
    name: 'What is $HOOD',
    category: 'ops',
    description: 'Companion coin card + fair-launch notes',
    examples: ['what is HOOD', 'about hood'],
    invoke: () => tools.whatIsHood(),
  },
  {
    id: 'trade_vet',
    name: 'Trade vet (Is this real?)',
    category: 'market',
    description: 'Rule-based AI legitimacy check for a token address (trade.vet)',
    examples: ['vet token', 'is this real', 'trade vet', 'trade.vet'],
    invoke: (ctx, raw) => tools.tradeVetSkill(ctx, raw),
  },
  {
    id: 'trade_chart',
    name: 'Trade chart',
    category: 'market',
    description: 'Read the $HOOD/WETH pool chart (trade.chart)',
    examples: ['trade chart', 'show chart', 'trade.chart'],
    invoke: (ctx, raw) => tools.tradeChartSkill(ctx, raw),
  },
  {
    id: 'trade_order',
    name: 'Trade order',
    category: 'market',
    description: 'Point a swap at the wallet-signed trade page (trade.order)',
    examples: ['buy hood', 'trade order', 'trade.order'],
    invoke: (ctx, raw) => tools.tradeOrderSkill(ctx, raw),
  },
  {
    id: 'market_browse',
    name: 'Skill Market browse',
    category: 'market',
    description: 'Browse Skill Market packs / trading bots (market.browse)',
    examples: ['skill market', 'market.browse', 'browse bots', 'list bots'],
    invoke: () => tools.marketBrowseSkill(),
  },
  {
    id: 'market_follow',
    name: 'Follow a bot',
    category: 'market',
    description: 'Follow / activate a Skill Market bot into your agent (market.follow)',
    examples: ['follow bot', 'market.follow', 'follow hood vet'],
    invoke: (_ctx, raw) => tools.marketFollowSkill(raw),
  },
  {
    id: 'market_publish',
    name: 'Publish bot',
    category: 'market',
    description: 'How to publish a skill pack + creator perks (demo ledger)',
    examples: ['publish bot', 'creator perks', 'market.publish'],
    invoke: () => tools.marketPublishHelp(),
  },
  {
    id: 'social_growth',
    name: 'Social growth (X / Farcaster)',
    category: 'social',
    description: 'Playbooks for X + Farcaster growth via agent skills (Desk / Desk+)',
    examples: ['social growth', 'social.growth', 'grow on x', 'farcaster playbook'],
    invoke: () => tools.socialGrowthSkill(),
  },
  {
    id: 'deploy_verify',
    name: 'Deploy verify',
    category: 'project',
    description: 'How to verify a fair-launch contract on RH Blockscout (deploy.verify)',
    examples: ['deploy verify', 'deploy.verify', 'verify contract', 'blockscout verify'],
    invoke: (ctx, raw) => tools.deployVerifySkill(ctx, raw),
  },
  {
    id: 'help',
    name: 'Help',
    category: 'meta',
    description: 'Short menu + pointer to full skill list',
    examples: ['help', 'commands'],
    invoke: () => tools.helpText(),
  },
  {
    id: 'list_skills',
    name: 'List skills',
    category: 'meta',
    description: 'List ALL skills in the catalog',
    examples: ['list skills', 'what can you do', '/skills'],
    invoke: () => listAllSkillsResult(),
  },
  {
    id: 'whoami',
    name: 'Who am I',
    category: 'meta',
    description: 'Desk persona + connected wallet summary',
    examples: ['whoami', 'who are you'],
    invoke: (ctx) => tools.whoami(ctx),
  },
]

const BY_ID = Object.fromEntries(SKILLS.map((s) => [s.id, s])) as Record<SkillId, SkillDef>

export function getSkill(id: SkillId): SkillDef {
  return BY_ID[id]
}

export function skillCount(): number {
  return SKILLS.length
}

export function listAllSkillsResult(): ToolResult {
  const byCat: Record<SkillCategory, SkillDef[]> = {
    wallet: [],
    project: [],
    market: [],
    social: [],
    ops: [],
    flavor: [],
    meta: [],
  }
  for (const s of SKILLS) byCat[s.category].push(s)

  const labels: Record<SkillCategory, string> = {
    wallet: 'Wallet / chain',
    project: 'Project / launchpad',
    market: 'Market / trading',
    social: 'Social / business',
    ops: 'Ops / AI business',
    flavor: 'GM / Hood Street',
    meta: 'Meta',
  }

  const lines: string[] = [
    `**Desk skills** — ${SKILLS.length} total (rule-based catalog)`,
    '',
  ]
  for (const cat of Object.keys(labels) as SkillCategory[]) {
    const items = byCat[cat]
    if (!items.length) continue
    lines.push(`**${labels[cat]}**`)
    for (const s of items) {
      lines.push(`• \`${s.id}\` — ${s.description}`)
    }
    lines.push('')
  }
  lines.push('Say a skill name or use the **Skills** chip / `#/terminal` panel.')
  return { ok: true, text: lines.join('\n') }
}

export async function invokeSkill(
  id: SkillId,
  ctx: ToolContext,
  raw?: string,
): Promise<ToolResult> {
  const skill = BY_ID[id]
  if (!skill) return { ok: false, text: `Unknown skill: ${id}` }
  return skill.invoke(ctx, raw)
}
