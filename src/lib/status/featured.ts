/**
 * The featured hash is the $HOOD deploy. The receipt exists on Robinhood Chain.
 * A missing receipt must not grow a Blockscout link.
 */

import { useEffect, useState } from 'react'
import { EXPLORER_TX, RH_RPC } from '../chain'
import { HOOD_DEPLOY_TX } from '../hoodToken'

export const FEATURED_RH_TX = HOOD_DEPLOY_TX

export const FEATURED_RH_TX_LABEL = '$HOOD deploy'
export const FEATURED_RH_TX_EXPLORER = EXPLORER_TX(FEATURED_RH_TX)

/** Start by asking the chain. Do not seed a miss for a hash that has a receipt. */
export const FEATURED_RH_TX_SEED_NOT_FOUND = false

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
      return FEATURED_RH_TX_SEED_NOT_FOUND
        ? { kind: 'not_found' }
        : { kind: 'error', message: `RPC HTTP ${res.status}` }
    }
    const json = (await res.json()) as {
      result?: { blockNumber?: string | null; hash?: string } | null
      error?: { message?: string }
    }
    if (json.error?.message) {
      return FEATURED_RH_TX_SEED_NOT_FOUND
        ? { kind: 'not_found' }
        : { kind: 'error', message: json.error.message }
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
    return FEATURED_RH_TX_SEED_NOT_FOUND
      ? { kind: 'not_found' }
      : {
          kind: 'error',
          message: e instanceof Error ? e.message : 'RPC unreachable',
        }
  }
}

export function useFeaturedTxStatus(): FeaturedTxRpcStatus {
  const [status, setStatus] = useState<FeaturedTxRpcStatus>(() =>
    FEATURED_RH_TX_SEED_NOT_FOUND ? { kind: 'not_found' } : { kind: 'checking' },
  )

  useEffect(() => {
    const ac = new AbortController()
    void (async () => {
      const next = await probeFeaturedTx(FEATURED_RH_TX, ac.signal)
      if (!ac.signal.aborted) setStatus(next)
    })()
    return () => ac.abort()
  }, [])

  return status
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
    default: {
      const _exhaustive: never = status
      return _exhaustive
    }
  }
}
