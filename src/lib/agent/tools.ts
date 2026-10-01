import { formatEther, formatUnits, type Address, type PublicClient } from 'viem'
import { EXPLORER_ADDRESS, EXPLORER_BASE, EXPLORER_TOKEN } from '../chain'
import {
  erc20Abi,
  HOOD_META,
  HOOD_TOKEN_ADDRESS,
  HOOD_TOKEN_DEPLOYED,
} from '../hoodToken'
import {
  FAIR_LAUNCH_COPY,
  listProjects,
  socialChips,
  suggestTickerFromName,
  type Project,
} from '../projects'
import { generateDemoCandles } from '../trade/chartData'
import { getTokenPrice } from '../trade/uniswap'
import { collectTradeTokens, findToken, formatPrice, HOOD_DEMO_ADDRESS } from '../trade/demoTokens'
import { formatVetSummary, vetToken } from '../trade/vet'
import {
  followBot,
  getActiveBot,
  listSkillPacks,
  marketBrowseSummary,
  recordSkillUsage,
  setActiveBot,
  unfollowBot,
} from '../market/skillMarket'

export type ToolContext = {
  address?: Address
  publicClient?: PublicClient
  chainId?: number
}

export type ToolResult = {
  ok: boolean
  text: string
}

function needWallet(ctx: ToolContext): string | null {
  if (!ctx.address) {
    return 'Connect your wallet first (rail up top). Desk never holds private keys — you sign.'
  }
  return null
}

function latestProject(ctx: ToolContext): Project | null {
  const all = listProjects(ctx.address)
  return all[0] ?? null
}

function findProject(ctx: ToolContext, raw?: string): Project | null {
  const all = listProjects(ctx.address)
  if (!all.length) return null
  if (!raw) return all[0]
  const q = raw.toLowerCase()
  const byName = all.find(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      (p.ticker && p.ticker.toLowerCase().includes(q)) ||
      p.id.toLowerCase() === q,
  )
  return byName ?? all[0]
}

/** Native RH balance via public client / eth_getBalance. */
export async function getBalance(ctx: ToolContext): Promise<ToolResult> {
  const missing = needWallet(ctx)
  if (missing) return { ok: false, text: missing }
  if (!ctx.publicClient) {
    return { ok: false, text: 'RPC client not ready. Check VITE_RH_RPC / network.' }
  }

  try {
    const wei = await ctx.publicClient.getBalance({ address: ctx.address! })
    const eth = formatEther(wei)
    const short = Number(eth).toLocaleString(undefined, { maximumFractionDigits: 6 })
    return {
      ok: true,
      text: `Native balance on Robinhood Chain (4663):\n**${short} ETH**\n\nWallet: \`${ctx.address}\`\nExplorer: ${EXPLORER_ADDRESS(ctx.address!)}`,
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return { ok: false, text: `Could not fetch native balance: ${msg.split('\n')[0]}` }
  }
}

/** $HOOD ERC-20 balanceOf when VITE_HOOD_TOKEN set. */
export async function getHoodBalance(ctx: ToolContext): Promise<ToolResult> {
  if (!HOOD_TOKEN_DEPLOYED || !HOOD_TOKEN_ADDRESS) {
    return {
      ok: false,
      text: `**$HOOD** is not deployed yet.\n\nDraft lives in \`hood-token\` (1B fixed supply, mint-once, clean ERC-20). After \`forge\` deploy, set \`VITE_HOOD_TOKEN=<address>\` and restart.\n\nFees that fund this desk come from DEX fee tiers / external router — not transfer tax.\nExplorer: ${EXPLORER_BASE}`,
    }
  }

  const missing = needWallet(ctx)
  if (missing) return { ok: false, text: missing }
  if (!ctx.publicClient) {
    return { ok: false, text: 'RPC client not ready.' }
  }

  try {
    const bal = await ctx.publicClient.readContract({
      address: HOOD_TOKEN_ADDRESS,
      abi: erc20Abi,
      functionName: 'balanceOf',
      args: [ctx.address!],
    })
    const formatted = formatUnits(bal, HOOD_META.decimals)
    const short = Number(formatted).toLocaleString(undefined, { maximumFractionDigits: 4 })
    return {
      ok: true,
      text: `**$${HOOD_META.symbol}** balance:\n**${short} ${HOOD_META.symbol}**\n\nContract: \`${HOOD_TOKEN_ADDRESS}\`\n${EXPLORER_TOKEN(HOOD_TOKEN_ADDRESS)}`,
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return { ok: false, text: `Could not read $HOOD balance: ${msg.split('\n')[0]}` }
  }
}

export function ensureChainTip(ctx: ToolContext): ToolResult {
  if (ctx.chainId === 4663) {
    return {
      ok: true,
      text: `You are on **Robinhood Chain (4663)**. Good. Desk stays RH-only.`,
    }
  }
  if (ctx.chainId == null) {
    return {
      ok: false,
      text: `Wallet not connected. Connect, then use the rail **Switch to RH** control if needed.\n\nTarget: **chain id 4663** · RPC fallback \`https://rpc.mainnet.chain.robinhood.com\`.`,
    }
  }
  return {
    ok: false,
    text: `Wallet is on chain **${ctx.chainId}**, not RH **4663**.\n\nUse the wallet rail to switch / add Robinhood Chain. Desk will not invent other networks.`,
  }
}

export function explorerLink(ctx: ToolContext): ToolResult {
  const lines = [`**Blockscout** — ${EXPLORER_BASE}`]
  if (ctx.address) {
    lines.push(`Wallet: ${EXPLORER_ADDRESS(ctx.address)}`)
  } else {
    lines.push('Connect a wallet to get your address link.')
  }
  if (HOOD_TOKEN_ADDRESS) {
    lines.push(`$HOOD: ${EXPLORER_TOKEN(HOOD_TOKEN_ADDRESS)}`)
  }
  const p = latestProject(ctx)
  if (p?.fairLaunch?.tokenAddress) {
    lines.push(`Project token (${p.name}): ${EXPLORER_TOKEN(p.fairLaunch.tokenAddress)}`)
  }
  return { ok: true, text: lines.join('\n') }
}

export function gasTip(): ToolResult {
  return {
    ok: true,
    text: `**Gas tip (static)**\n\n• Ops run on Robinhood Chain **4663**\n• Fund your wallet with native ETH on RH for gas\n• Desk never holds keys — you sign every tx\n• Bridge / faucet paths depend on RH infra (check official RH docs)\n• Live deploy of fair tokens: \`forge script\` from \`Desktop/hood-token\` — keep \`PRIVATE_KEY\` local only`,
  }
}

export function createProjectHelp(): ToolResult {
  return {
    ok: true,
    text: `**Create a project**\n\n1. Open **Create** (\`#/create\`) or say **create project**\n2. Fill: name, optional ticker, one-liner, social URLs, logo/emoji, agent persona\n3. Saved in **localStorage** keyed by wallet (or \`anon\`)\n4. Then open the project → **Launch fair token** wizard\n\nSocials (all optional): website · X/Twitter · Farcaster · Discord · Telegram\n\nEvery project token is **Fair launch** only — no unfair allocations UI.`,
  }
}

export function listProjectsSkill(ctx: ToolContext): ToolResult {
  const all = listProjects(ctx.address)
  if (!all.length) {
    return {
      ok: true,
      text: `No projects yet for this wallet key.\n\nOpen **Create** (\`#/create\`) to ship your first AI business card.`,
    }
  }
  const lines = [`**Projects** (${all.length}) — localStorage`, '']
  for (const p of all) {
    const fl = p.fairLaunch
      ? ` · fair ${p.fairLaunch.status}${p.fairLaunch.tokenAddress ? ` \`${p.fairLaunch.tokenAddress.slice(0, 8)}…\`` : ''}`
      : ''
    lines.push(`• **${p.avatarEmoji || '🦊'} ${p.name}**${p.ticker ? ` ($${p.ticker})` : ''}${fl}`)
    lines.push(`  \`${p.id}\` → \`#/projects/${p.id}\``)
  }
  return { ok: true, text: lines.join('\n') }
}

export function showProjectSkill(ctx: ToolContext, raw?: string): ToolResult {
  const p = findProject(ctx, raw)
  if (!p) {
    return { ok: false, text: 'No projects found. Create one at `#/create`.' }
  }
  const chips = socialChips(p.socials)
  const socialLine = chips.length
    ? chips.map((c) => `[${c.label}](${c.href})`).join(' · ')
    : '_no socials yet_'
  const fl = p.fairLaunch
  const flLine = fl
    ? `Fair launch: **${fl.status}** · ${fl.symbol} · supply ${fl.supply} (${fl.decimals}dec)${fl.tokenAddress ? `\nToken: \`${fl.tokenAddress}\`` : ''}`
    : 'Fair launch: _not started_ — open project → Launch fair token'
  return {
    ok: true,
    text: `**${p.avatarEmoji || '🦊'} ${p.name}**${p.ticker ? ` · $${p.ticker}` : ''}\n\n${p.description || '_no description_'}\n\nPersona: ${p.agentPersona || '_default Desk fox_'}\nSocials: ${socialLine}\n\n${flLine}\n\nOpen: \`#/projects/${p.id}\``,
  }
}

export function attachSocialsHelp(): ToolResult {
  return {
    ok: true,
    text: `**Attach socials**\n\nOn **Create** or project edit, add optional URLs:\n• Website\n• X / Twitter\n• Farcaster\n• Discord\n• Telegram\n\nThey render as chips on the project detail page. Agent skills \`draft_tweet\` / \`draft_farcaster\` pull from the latest project.`,
  }
}

export function fairLaunchStatusSkill(ctx: ToolContext, raw?: string): ToolResult {
  const p = findProject(ctx, raw)
  if (!p) return { ok: false, text: 'No project — create one first (`#/create`).' }
  if (!p.fairLaunch) {
    return {
      ok: true,
      text: `**${p.name}** has no fair-launch record yet.\n\nOpen \`#/projects/${p.id}\` → **Launch fair token**.\n\n${FAIR_LAUNCH_COPY}\n\nLive deploy (optional): \`forge script\` from \`Desktop/hood-token\`, then paste \`tokenAddress\`.`,
    }
  }
  const fl = p.fairLaunch
  const done = fl.lpChecklist.filter((i) => i.done).length
  return {
    ok: true,
    text: `**Fair launch — ${p.name}**\n\n• Status: **${fl.status}**\n• ${fl.name} / $${fl.symbol}\n• Supply: ${fl.supply} · ${fl.decimals} decimals\n• ${fl.copy}\n${fl.tokenAddress ? `• Address: \`${fl.tokenAddress}\`\n` : ''}• LP checklist: ${done}/${fl.lpChecklist.length} (DEX step = TODO — no invented routers)\n\nDetail: \`#/projects/${p.id}\``,
  }
}

export function explainFairLaunch(): ToolResult {
  return {
    ok: true,
    text: `**Fair launch (Hood pattern)**\n\n${FAIR_LAUNCH_COPY}\n\n• Fixed supply default **1B** · **18** decimals (like \`Hood.sol\`)\n• Mint **once** in constructor — no ownerMint after deploy\n• No transfer tax / reflections / blacklist / pause\n• Fees that fund the agent = DEX fee tier or external router — **not** in the token\n• The browser does not deploy. Paste the contract after a Foundry broadcast.\n• Live: \`cd Desktop/hood-token && forge script script/DeployHood.s.sol:DeployHood --rpc-url "$RPC_URL" --broadcast --chain-id 4663\`\n• Never print or commit \`PRIVATE_KEY\``,
  }
}

/** Honest TODO — no invented DEX / router addresses. Demo chart on #/trade. */
export async function getPrice(_ctx: ToolContext): Promise<ToolResult> {
  if (!HOOD_TOKEN_ADDRESS) {
    return { ok: false, text: '$HOOD is not configured.' }
  }
  const wethPerHood = await getTokenPrice(HOOD_TOKEN_ADDRESS)
  if (wethPerHood == null || !(wethPerHood > 0)) {
    return {
      ok: false,
      text: `**Price**\n\nThe $HOOD/WETH pool did not quote. Open **#/trade**.\n\nExplorer: ${EXPLORER_BASE}`,
    }
  }
  const hoodPerEth = 1 / wethPerHood
  return {
    ok: true,
    text: `**$HOOD / WETH**\n\nAbout **${hoodPerEth.toLocaleString(undefined, { maximumFractionDigits: 0 })} HOOD** per 1 ETH, from a tiny Uniswap quote. A real swap moves this because the pool is thin.\n\nMarket swaps sign on **#/trade**. The chart there reads pool swaps.`,
  }
}

/** Honest TODO — user wallet would sign; agent never holds keys. */
export async function swapStub(_ctx: ToolContext): Promise<ToolResult> {
  return {
    ok: false,
    text: `**Swap**\n\n$HOOD market buy and sell on **#/trade** sign in your wallet through Uniswap V3 SwapRouter02. The desk does not hold your key.\n\nLimit, stop, TWAP, DCA, and auto-trade stay on this desk. The $HOOD/WETH pool is thin.`,
  }
}

export async function portfolioSummary(ctx: ToolContext): Promise<ToolResult> {
  const missing = needWallet(ctx)
  if (missing) return { ok: false, text: missing }
  const parts: string[] = ['**Portfolio (connected balances)**', '']
  if (!ctx.publicClient) {
    return { ok: false, text: 'RPC client not ready.' }
  }
  try {
    const wei = await ctx.publicClient.getBalance({ address: ctx.address! })
    const eth = Number(formatEther(wei)).toLocaleString(undefined, { maximumFractionDigits: 6 })
    parts.push(`• Native: **${eth} ETH** (RH 4663)`)
  } catch {
    parts.push('• Native: _unavailable_')
  }
  if (HOOD_TOKEN_DEPLOYED && HOOD_TOKEN_ADDRESS) {
    try {
      const bal = await ctx.publicClient.readContract({
        address: HOOD_TOKEN_ADDRESS,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [ctx.address!],
      })
      const short = Number(formatUnits(bal, HOOD_META.decimals)).toLocaleString(undefined, {
        maximumFractionDigits: 4,
      })
      parts.push(`• $HOOD: **${short}**`)
    } catch {
      parts.push('• $HOOD: _read failed_')
    }
  } else {
    parts.push('• $HOOD: _not deployed_ (set `VITE_HOOD_TOKEN`)')
  }
  const projects = listProjects(ctx.address)
  const withTok = projects.filter((p) => p.fairLaunch?.tokenAddress)
  parts.push(`• Projects: **${projects.length}** (${withTok.length} with pasted token address)`)
  parts.push('', 'Price / PnL wait for a known RH DEX — no invented routers.')
  return { ok: true, text: parts.join('\n') }
}

export function draftTweet(ctx: ToolContext): ToolResult {
  const p = latestProject(ctx)
  if (!p) {
    return { ok: false, text: 'No project to tweet about. Create one at `#/create`.' }
  }
  const ticker = p.ticker || p.fairLaunch?.symbol
  const body = [
    `${p.avatarEmoji || '🦊'} ${p.name}${ticker ? ` ($${ticker})` : ''}`,
    '',
    p.description || 'AI business on Robinhood Chain.',
    '',
    'Fair launch · mint-once · no transfer tax.',
    'Built on Hood Street · #CCFF00 · RH 4663',
    p.socials.website ? p.socials.website : '',
  ]
    .filter(Boolean)
    .join('\n')
  return {
    ok: true,
    text: `**Draft tweet** (copy/paste — Desk does not post):\n\n---\n${body}\n---\n\nPersona note: ${p.agentPersona || 'default witty fox'}`,
  }
}

export function draftFarcaster(ctx: ToolContext): ToolResult {
  const p = latestProject(ctx)
  if (!p) {
    return { ok: false, text: 'No project for a cast. Create one at `#/create`.' }
  }
  const ticker = p.ticker || p.fairLaunch?.symbol
  const cast = `${p.avatarEmoji || '🦊'} ${p.name}${ticker ? ` · $${ticker}` : ''}\n\n${p.description || 'AI-run desk on Robinhood Chain.'}\n\nFair launch only. No humans required for ops.\n\n/hoodstreet`
  return {
    ok: true,
    text: `**Draft Farcaster cast** (copy/paste — no fake sigs):\n\n---\n${cast}\n---`,
  }
}

export function summarizeProjectPitch(ctx: ToolContext): ToolResult {
  const p = latestProject(ctx)
  if (!p) return { ok: false, text: 'No project. Open `#/create`.' }
  const voice = p.agentPersona || 'witty fox, action-oriented, RH-only'
  const ticker = p.ticker || p.fairLaunch?.symbol
  return {
    ok: true,
    text: `**Pitch — ${p.name}**\n\n${p.name}${ticker ? ` ($${ticker})` : ''} is an AI business on Robinhood Chain (4663). ${p.description}\n\nVoice: ${voice}\nToken stance: Fair launch only — mint-once, no team mint after deploy, no transfer tax.\n\nCTA: chat the Desk · hold the companion coin · watch ops earn runway.`,
  }
}

export function suggestTickerSkill(ctx: ToolContext, raw?: string): ToolResult {
  const fromRaw = raw?.replace(/suggest\s*ticker|ticker\s*ideas|ticker\s*for/gi, '').trim()
  const p = latestProject(ctx)
  const name = fromRaw || p?.name || 'Hood Desk'
  const suggestion = suggestTickerFromName(name)
  const alts = [
    suggestion,
    suggestTickerFromName(name.replace(/\s+/g, '')),
    (name.replace(/[^a-zA-Z]/g, '').slice(0, 4) || 'HOOD').toUpperCase(),
  ]
  const uniq = [...new Set(alts.filter(Boolean))]
  return {
    ok: true,
    text: `**Ticker ideas** for “${name}”:\n${uniq.map((t) => `• **$${t}**`).join('\n')}\n\nPick one on Create / Fair launch — optional until you launch the token.`,
  }
}

export function whatIsHood(): ToolResult {
  const contractLine = HOOD_TOKEN_DEPLOYED
    ? `Contract: \`${HOOD_TOKEN_ADDRESS}\`\n${EXPLORER_TOKEN(HOOD_TOKEN_ADDRESS!)}`
    : 'Contract: **not deployed** — set `VITE_HOOD_TOKEN` after `hood-token` forge deploy.'

  return {
    ok: true,
    text: `**$${HOOD_META.symbol}** — companion coin for Hood Desk\n\n• Name: ${HOOD_META.name}\n• Symbol: ${HOOD_META.symbol}\n• Supply: ${HOOD_META.totalSupplyNote}\n• Chain: Robinhood **4663**\n• Clean ERC-20 (no tax / pause / blacklist)\n• ${FAIR_LAUNCH_COPY}\n\n${contractLine}\n\nHolders align with the desk. Fees fund ops via DEX fee → treasury — not baked into transfers.`,
  }
}

export function opsBrief(): ToolResult {
  return {
    ok: true,
    text: `**How Hood Desk runs** 🦊\n\n1. Users chat → Desk acts on RH 4663\n2. Agent executes skills (balance, projects, future swap)\n3. DEX fee → agent treasury (runway)\n4. Agent stays online — no humans required for ops\n\nRoles: **Agent** (ops) · **$HOOD / project token holders** (aligned) · **Treasury** (runway)\n\nV1 is demo ops; live swap after DEX. Open the **Ops** tab for the loop.`,
  }
}

export function treasuryExplain(): ToolResult {
  return {
    ok: true,
    text: `**Treasury**\n\nToken is a clean fair-launch ERC-20 — **no transfer tax**.\n\nRunway comes from:\n• DEX fee tier / protocol fee → agent treasury (preferred when RH DEX supports it)\n• Optional external fee router (only if needed)\n• Manual / off-chain skim as early fallback\n\nDesk never invents router addresses. See \`hood-token/LAUNCH.md\` for the checklist.`,
  }
}

export function revenueDemoStats(): ToolResult {
  return {
    ok: true,
    text: `**Revenue (demo — labeled)**\n\n• 24h volume: **$12.4k** _(demo)_\n• Fee capture: **~$37** _(demo)_\n• Treasury runway: **~18 days** _(demo)_\n• Skills invoked today: see **list skills**\n\nOpen **Revenue** (\`#/revenue\`) for the dashboard. Live reads replace demos after DEX + treasury wiring.`,
  }
}

export function dailyBrief(ctx: ToolContext): ToolResult {
  const projects = listProjects(ctx.address)
  const onRh = ctx.chainId === 4663 ? 'on RH 4663 ✓' : ctx.chainId ? `chain ${ctx.chainId}` : 'wallet disconnected'
  return {
    ok: true,
    text: `**Daily brief** 🦊\n\n• Desk online · ${onRh}\n• Projects stored: **${projects.length}**\n• $HOOD: ${HOOD_TOKEN_DEPLOYED ? `\`${HOOD_TOKEN_ADDRESS}\`` : 'not deployed'}\n• Stripe Checkout is live on the desk\n• $HOOD/WETH market swaps sign on Uniswap. The agent does not place orders.\n• Ask **list skills** for the full catalog\n\nGM. What are we building?`,
  }
}

const GM_KEY = 'hood-desk:gm-streak'
const GM_DATE_KEY = 'hood-desk:gm-last'

function todayKey(): string {
  const d = new Date()
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
}

function yesterdayKey(): string {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
}

export function gmStreak(): ToolResult {
  let streak = 0
  try {
    const last = localStorage.getItem(GM_DATE_KEY)
    const prev = Number(localStorage.getItem(GM_KEY) || '0')
    const today = todayKey()
    if (last === today) {
      streak = prev || 1
    } else if (last === yesterdayKey()) {
      streak = prev + 1
      localStorage.setItem(GM_KEY, String(streak))
      localStorage.setItem(GM_DATE_KEY, today)
    } else {
      streak = 1
      localStorage.setItem(GM_KEY, '1')
      localStorage.setItem(GM_DATE_KEY, today)
    }
  } catch {
    streak = 1
  }

  const lines = [
    'GM from the Desk. 🦊',
    `Streak: **${streak}** day${streak === 1 ? '' : 's'}.`,
    'AI-operated. RH-only. What do you need?',
    '',
    'Try: **balance** · **list projects** · **list skills** · **fair launch** · **help**',
  ]
  return { ok: true, text: lines.join('\n') }
}

export function neonTips(): ToolResult {
  return {
    ok: true,
    text: `**Neon tips** · Hood Street \`#CCFF00\`\n\n• Dark bg \`#050505\` + accent \`#CCFF00\` — keep contrast loud\n• Fox 🦊 = operator energy, not mascot fluff\n• Fair launch only — never show team/insider alloc UI\n• Port **5182** for Hood Desk (siblings: terminal 5181, quest 5180)\n• localStorage projects survive refresh; keyed by wallet or \`anon\``,
  }
}

export function foxCoach(): ToolResult {
  const lines = [
    'Ship the project card before the token. Persona first.',
    'Fair launch or it does not ship. Period.',
    'If the DEX is unknown, say TODO — inventing routers is how desks die.',
    'You sign. I never hold keys. That is the deal.',
    'One skill at a time. Ask **list skills** when stuck.',
  ]
  const pick = lines[Math.floor(Math.random() * lines.length)]
  return { ok: true, text: `**Fox coach** 🦊\n\n${pick}` }
}

export function whoami(ctx: ToolContext): ToolResult {
  const wallet = ctx.address ? `\`${ctx.address}\`` : '_disconnected (anon storage)_'
  return {
    ok: true,
    text: `**Desk** — Hood Desk agent 🦊\n\nRule-based skills catalog. No paid LLM. Ask **list skills**.\nRH-only · dark + \`#CCFF00\` · Bankr energy.\n\nYou: ${wallet}\nChain: ${ctx.chainId ?? '—'}\n\nI list skills, draft posts, track fair launches in localStorage, and read balances. I do not hold private keys.`,
  }
}

export function helpText(): ToolResult {
  return {
    ok: true,
    text: `**Desk** — Hood Desk agent (rule-based V1, no paid LLM).\n\nQuick:\n• **balance** / **$HOOD** / **portfolio**\n• **list projects** · **create project** · **fair launch**\n• **draft tweet** · **pitch** · **gm**\n• **list skills** — full catalog\n• **whoami** · **help**\n\nUI: **#/trade** · **#/skills** Skill Market · Terminal · Create → Projects.\n• **skill market** / **follow Hood Vet Pro** / **publish bot**\nWallet rail → chain **4663**.`,
  }
}

function extractTradeAddress(raw?: string): string | undefined {
  if (!raw) return undefined
  const m = raw.match(/0x[a-fA-F0-9]{40}/)
  return m?.[0]
}

/** trade.vet — AI legitimacy check */
export function tradeVetSkill(ctx: ToolContext, raw?: string): ToolResult {
  const addr = extractTradeAddress(raw) || HOOD_DEMO_ADDRESS
  const token = findToken(addr, ctx.address)
  const result = vetToken({
    address: addr,
    wallet: ctx.address,
    token,
    website: token?.socials?.website,
    twitter: token?.socials?.twitter,
    farcaster: token?.socials?.farcaster,
  })
  recordSkillUsage('vet')
  const bot = getActiveBot()
  const via = bot ? `\n\nVia primary bot **${bot.name}** (usage → creator demo ledger).` : ''
  return { ok: true, text: formatVetSummary(result) + '\n\nUI: open **#/trade** → Vet panel.' + via }
}

/** trade.chart — describe the chart the desk will draw */
export function tradeChartSkill(ctx: ToolContext, raw?: string): ToolResult {
  const addr = extractTradeAddress(raw) || HOOD_DEMO_ADDRESS
  const token = findToken(addr, ctx.address) || collectTradeTokens(ctx.address)[0]
  if (HOOD_TOKEN_ADDRESS && token.address.toLowerCase() === HOOD_TOKEN_ADDRESS.toLowerCase()) {
    recordSkillUsage('chart')
    return {
      ok: true,
      text: `**$HOOD chart**\n\nThe trade page reads swaps from the $HOOD/WETH pool. This chat does not draw stand-in candles.\n\nOpen **#/trade**. Market buy and sell sign in your wallet.`,
    }
  }
  const candles = generateDemoCandles(token.address, '15m', token.price || 0.0001)
  const last = candles[candles.length - 1]
  const first = candles[0]
  const chg = ((last.close - first.open) / first.open) * 100
  recordSkillUsage('chart')
  return {
    ok: true,
    text: `**Desk chart** — ${token.symbol}/${token.quote}\n\n• Candles: **${candles.length}** × 15m (desk drawing, not the pool)\n• Last close: **${formatPrice(last.close)}**\n• Window change: **${chg >= 0 ? '+' : ''}${chg.toFixed(2)}%**\n• Address: \`${token.address}\`\n\nOpen **#/trade**. $HOOD market swaps there are wallet-signed.`,
  }
}

/** trade.order — wallet must sign. The agent does not invent a fill. */
export function tradeOrderSkill(_ctx: ToolContext, _raw?: string): ToolResult {
  return {
    ok: false,
    text: `**Swaps are wallet-signed.**\n\nOpen **#/trade**, connect on Robinhood Chain, and press Buy or Sell. This agent does not place an order.`,
  }
}

export function marketBrowseSkill(): ToolResult {
  return { ok: true, text: marketBrowseSummary() }
}

export function marketFollowSkill(raw?: string): ToolResult {
  const t = (raw || '').toLowerCase()
  const packs = listSkillPacks()
  if (/unfollow/.test(t)) {
    const hit = packs.find((b) => t.includes(b.name.toLowerCase()) || t.includes(b.id))
    if (!hit) return { ok: false, text: 'Say e.g. **unfollow Hood Vet Pro**. Browse: **#/skills**.' }
    const r = unfollowBot(hit.id)
    return { ok: r.ok, text: r.text }
  }
  const hit =
    packs.find((b) => t.includes(b.name.toLowerCase())) ||
    packs.find((b) => b.skillTags.some((tag) => t.includes(tag.toLowerCase()))) ||
    packs.find((b) => t.includes(b.authorHandle.toLowerCase())) ||
    packs[0]
  if (!hit) return { ok: false, text: 'No bots in Skill Market yet. Open **#/skills**.' }
  if (/primary|activate|switch/.test(t) && !/follow/.test(t)) {
    const r = setActiveBot(hit.id)
    return { ok: r.ok, text: r.text }
  }
  const r = followBot(hit.id)
  return { ok: r.ok, text: r.text + '\n\nUI: **#/skills**' }
}

export function marketPublishHelp(): ToolResult {
  return {
    ok: true,
    text: `**Publish a list** → Skills\n\n1. Open **#/skills** → Publish bot\n2. Name the list and pick the questions\n3. It is saved in this browser\n4. Follow copies it into Ask\n\nA list does not move tokens.\n\nAlso: Ask **skill market** or **follow Hood Vet Pro**.`,
  }
}


export function socialGrowthSkill(): ToolResult {
  return {
    ok: true,
    text: `**Social growth** (\`social.growth\`) — X / Farcaster playbooks

Included on **Desk** / **Desk+** (basic tips on Starter).

1. **Cadence** — ship 1 launch cast + 1 thread per fair launch
2. **X** — ask Desk **draft tweet** with project pitch + ticker
3. **Farcaster** — ask **draft cast** / farcaster; pin explorer verify link
4. **Skill Market** — follow growth-flavored bots; publish your own pack
5. **Subscribe** — #/subscribe · Desk includes 6 months of product updates

Honest stub — Desk drafts copy; you post. No auto-post without your keys.`,
  }
}

export function deployVerifySkill(ctx: ToolContext, raw?: string): ToolResult {
  const p = latestProject(ctx)
  const addr =
    (raw && /0x[a-fA-F0-9]{40}/.exec(raw)?.[0]) ||
    p?.fairLaunch?.tokenAddress ||
    HOOD_TOKEN_ADDRESS ||
    HOOD_DEMO_ADDRESS
  const link = addr ? EXPLORER_ADDRESS(addr) + '?tab=contract' : EXPLORER_BASE
  return {
    ok: true,
    text: `**Deploy verify** (\`deploy.verify\`)

1. Deploy fair ERC-20 via forge (\`hood-token\` pattern)
2. Open Blockscout → Contract tab → **Verify & Publish**
3. Paste address on project detail / fair-launch wizard
4. Desk shows a **green checkmark** only when Sourcify or Blockscout reports a match

Explorer: ${link}

Checklist item: **Verify contract on explorer** on #/projects. Skill pairs with fair-launch attach.`,
  }
}

/** neon_tba — resolve CCFF00 ERC-6551 TBA + $HOOD balance via Hoodstreet MCP */
export async function neonTbaSkill(raw?: string): Promise<ToolResult> {
  const tokenIdMatch = raw?.match(/\d+/)
  const tokenId = tokenIdMatch?.[0] || '1'
  
  try {
    // Call our proxy endpoint
    const walletRes = await fetch(`/api/hoodstreet/neon/${tokenId}`)
    if (!walletRes.ok) {
      const err = await walletRes.json().catch(() => ({ error: 'Network error' }))
      return {
        ok: false,
        text: `**Neon TBA — unavailable**\n\nHoodstreet MCP endpoint failed for token #${tokenId}.\n\nError: ${err.error || walletRes.statusText}\n\nEnsure server is running (\`npm run server\`) and \`HOODSTREET_MCP_URL\` is reachable.`,
      }
    }
    
    const walletData = await walletRes.json()
    if (!walletData.ok || !walletData.data) {
      return { ok: false, text: `Could not resolve TBA for token #${tokenId}` }
    }
    
    const tbaAddress = walletData.data.content?.[0]?.text
    if (!tbaAddress) {
      return { ok: false, text: `No TBA address returned for token #${tokenId}` }
    }
    
    // Get $HOOD balance (use VITE_HOOD_TOKEN from env, or fallback to known address)
    const hoodAddress = HOOD_TOKEN_ADDRESS || '0xC7749BCFDC8d06FC246be556f4EAD75Ac7E1320c'
    const tokenRes = await fetch(
      `/api/hoodstreet/neon/${tokenId}/token/${hoodAddress}?walletType=ccff00-erc6551`
    )
    
    let hoodBalance = 'unavailable'
    if (tokenRes.ok) {
      const tokenData = await tokenRes.json()
      if (tokenData.ok && tokenData.data?.content?.[0]?.text) {
        hoodBalance = tokenData.data.content[0].text
      }
    }
    
    return {
      ok: true,
      text: `**Neon TBA — CCFF00 #${tokenId}**

**TBA address:** \`${tbaAddress}\`

**$HOOD balance:** ${hoodBalance}

Explorer: ${EXPLORER_ADDRESS(tbaAddress)}

_Live read from Hoodstreet MCP agent (agent.hoodstreet.capital)._

Open **#/nfts** for CCFF00 story + gallery. Read-only v1 — no trade/mint UI until product policy.`,
    }
  } catch (err) {
    return {
      ok: false,
      text: `**Neon TBA — error**\n\nCould not reach Hoodstreet MCP.\n\nError: ${err instanceof Error ? err.message : String(err)}\n\nEnsure server is running and network is available.`,
    }
  }
}
