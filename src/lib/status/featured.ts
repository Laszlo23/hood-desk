/**
 * Featured RH hash watch — public hex only (never a private key / signer).
 * Easy to swap when a real RH tx lands.
 *
 * Known state (2026-09-30): Blockscout RH returns "Transaction not found"
 * and eth_getTransactionByHash is null. Do NOT label as proof / success.
 */

import { EXPLORER_TX, RH_RPC } from '../chain'

/** Watched hex — not confirmed as an RH 4663 transaction. */
export const FEATURED_RH_TX =
  '0xe77d0c38e959dafdc3474f0c6fe74b6d92674fd3c4539440ce9572fc13c02afc' as const

export const FEATURED_RH_TX_LABEL = 'Desk status · watched hash'
export const FEATURED_RH_TX_EXPLORER = EXPLORER_TX(FEATURED_RH_TX)

/**
 * Seed truth when explorer already reported miss — UI starts honest,
 * then live probe can upgrade only if RPC/explorer actually finds it.
 */
export const FEATURED_RH_TX_SEED_NOT_FOUND = true

export function shortHash(hash: string, lead = 6, trail = 4): string {
  const h = hash.startsWith('0x') ? hash : `0x${hash}`
  if (h.length <= lead + trail + 2) return h
  return `${h.slice(0, lead + 2)}…${h.slice(-trail)}`
}

export type FeaturedTxRpcStatus =
  | { kind: 'checking' }
  | { kind: 'found'; blockNumber: string | null }
  | { kind: 'not_found' }
  | { kind: 'error'; message: string }

/** Honest RPC probe — never invents a mined/success state. */
export async function probeFeaturedTx(
  hash: string = FEATURED_RH_TX,
  signal?: AbortSignal,
): Promise<FeaturedTxRpcStatus> {
  try {
    const res = await fetch(RH_RPC, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_getTransactionByHash',
        params: [hash],
      }),
      signal,
    })
    if (!res.ok) {
      return { kind: 'error', message: `RPC HTTP ${res.status}` }
    }
    const json = (await res.json()) as {
      result?: { blockNumber?: string | null; hash?: string } | null
      error?: { message?: string }
    }
    if (json.error?.message) {
      return { kind: 'error', message: json.error.message }
    }
    if (json.result && json.result.hash) {
      return {
        kind: 'found',
        blockNumber: json.result.blockNumber ?? null,
      }
    }
    return { kind: 'not_found' }
  } catch (e) {
    if (signal?.aborted) return { kind: 'checking' }
    return {
      kind: 'error',
      message: e instanceof Error ? e.message : 'RPC unreachable',
    }
  }
}

export function featuredStatusLabel(status: FeaturedTxRpcStatus): string {
  switch (status.kind) {
    case 'checking':
      return 'checking RH RPC…'
    case 'found':
      return status.blockNumber
        ? `on RH · block ${Number.parseInt(status.blockNumber, 16) || status.blockNumber}`
        : 'seen on RH RPC · pending block'
    case 'not_found':
      return 'hash not found on RH'
    case 'error':
      return `RPC: ${status.message}`
  }
}
