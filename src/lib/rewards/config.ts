/**
 * Demo trade-fee split — adjustable constants in one place.
 * Accrued to localStorage ledger only until RH DEX + real fee routing exists.
 *
 * Split of simulated fee volume on fills for tokens with a known creator:
 *   token creator ………… 50%
 *   platform (Hood Desk treasury) … 30%
 *   referrer / active bot creator … 20%
 */
export const TRADE_FEE_SPLIT = {
  /** Fraction of notional counted as fee (demo). */
  feeRatePct: 1,
  creatorPct: 50,
  platformPct: 30,
  /** Referrer if set, else active Skill Market bot creator. */
  botOrReferrerPct: 20,
} as const

export const PLATFORM_TREASURY_ID = 'hood_desk_treasury'
export const PLATFORM_TREASURY_LABEL = 'Hood Desk treasury'

/** Demo label — never claim mainnet payouts. */
export const REWARDS_DISCLAIMER =
  'Demo ledger / localStorage only. No mainnet payouts until RH DEX + real fee routing.'

export function assertSplitSums(): boolean {
  const { creatorPct, platformPct, botOrReferrerPct } = TRADE_FEE_SPLIT
  return creatorPct + platformPct + botOrReferrerPct === 100
}
