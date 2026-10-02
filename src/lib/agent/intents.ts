import type { SkillId } from './skills'

export type Intent = SkillId | 'unknown'

/** Rule-based intent parser — maps chat to skill ids. Desk persona, RH-only. */
export function parseIntent(text: string): Intent {
  const t = text.toLowerCase().trim()

  if (/^\/?skills\b|list skills|what can you|all skills|skill catalog/.test(t)) {
    return 'list_skills'
  }
  if (/\bwhoami\b|who are you|who am i|your name/.test(t)) return 'whoami'
  if (/\bhelp\b|commands|menu\b/.test(t)) return 'help'

  if (/^(gm|gn)\b|good\s*morning|hello|hi\b|hey\b|streak/.test(t)) return 'gm_streak'
  if (/neon tip|hood street tip|style tip/.test(t)) return 'neon_tips'
  if (/fox coach|motivate|coach me/.test(t)) return 'fox_coach'

  if (/daily brief|\bbrief\b/.test(t)) return 'daily_brief'
  if (/revenue|demo stats|metrics/.test(t)) return 'revenue_demo_stats'
  if (/treasury|how fees|fee path/.test(t)) return 'treasury_explain'
  if (/how (it |this )?(runs|works|earn)|ops\b|business loop/.test(t)) {
    return 'how_desk_runs'
  }
  if (/what (is|are) (\$)?hood\b|about (\$)?hood|tell me about hood|hood token/.test(t)) {
    return 'what_is_hood'
  }

  if (/explain fair|what is fair launch|fair launch (mean|explain)/.test(t)) {
    return 'explain_fair_launch'
  }
  if (/fair launch status|token status|launch status/.test(t)) return 'fair_launch_status'
  if (/attach social|add social|social links help/.test(t)) return 'attach_socials_help'
  if (/show project|project detail|open project/.test(t)) return 'show_project'
  if (/list projects|my projects|projects\b/.test(t)) return 'list_projects'
  if (/create project|new project|how to create/.test(t)) return 'create_project_help'

  if (/social\.growth|social growth|grow on (x|twitter)|farcaster playbook|growth pack/.test(t)) return 'social_growth'
  if (/deploy\.verify|deploy verify|verify contract|blockscout verify|verify on explorer/.test(t)) return 'deploy_verify'
  if (/draft (a )?tweet|tweet for|twitter draft/.test(t)) return 'draft_tweet'
  if (/draft (a )?(cast|farcaster)|farcaster/.test(t)) return 'draft_farcaster'
  if (/summarize|pitch|elevator/.test(t)) return 'summarize_project_pitch'
  if (/suggest ticker|ticker idea|ticker for/.test(t)) return 'suggest_ticker'

  if (/portfolio|holdings|my bags/.test(t)) return 'portfolio'
  if (/trade\.vet|vet token|is this real|legitimacy|project check/.test(t)) return 'trade_vet'
  if (/trade\.chart|show chart|demo candles|candlestick/.test(t)) return 'trade_chart'
  if (/trade\.order|simulate (buy|sell|order)|place (a )?sim/.test(t)) return 'trade_order'
  if (/market\.browse|skill market|browse bots|list bots|skill.?packs/.test(t)) return 'market_browse'
  if (/market\.follow|follow (a )?bot|unfollow|set primary bot/.test(t)) return 'market_follow'
  if (/market\.publish|publish bot|creator perk/.test(t)) return 'market_publish'
  if (/swap|trade|exchange|buy|sell/.test(t)) return 'swap'
  if (/paper book|paper trad|agent record/.test(t)) return 'paper_book'
  if (/price|quote|worth|\$hood price|eth price/.test(t)) return 'price'

  if (/gas tip|\bgas\b|fund wallet/.test(t)) return 'gas_tip'
  if (/explorer|blockscout/.test(t)) return 'explorer_link'
  if (/switch (chain|network)|ensure (rh|chain)|am i on|4663/.test(t)) return 'ensure_chain'

  if (/hood balance|\$hood|my hood|erc-?20|token balance/.test(t)) return 'hood_balance'
  if (/balance|how much|wallet|native|eth\b|funds/.test(t)) return 'balance'

  // Direct skill id invoke: "skill:balance" or bare id if exact match
  const bare = t.replace(/^skill[:\s]+/, '').replace(/\./g, '_').replace(/\s+/g, '_')
  const known: SkillId[] = [
    'balance',
    'hood_balance',
    'ensure_chain',
    'explorer_link',
    'gas_tip',
    'create_project_help',
    'list_projects',
    'show_project',
    'attach_socials_help',
    'fair_launch_status',
    'explain_fair_launch',
    'price',
    'paper_book',
    'swap',
    'trade_vet',
    'trade_chart',
    'trade_order',
    'market_browse',
    'market_follow',
    'market_publish',
    'social_growth',
    'deploy_verify',
    'portfolio',
    'draft_tweet',
    'draft_farcaster',
    'summarize_project_pitch',
    'suggest_ticker',
    'how_desk_runs',
    'treasury_explain',
    'revenue_demo_stats',
    'daily_brief',
    'gm_streak',
    'neon_tips',
    'fox_coach',
    'what_is_hood',
    'help',
    'list_skills',
    'whoami',
  ]
  if ((known as string[]).includes(bare)) return bare as SkillId

  return 'unknown'
}
