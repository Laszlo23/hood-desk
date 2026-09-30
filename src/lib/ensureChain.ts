import { numberToHex } from 'viem'
import { RH_RPC, robinhoodChain } from './chain'

export const ROBINHOOD_CHAIN_ID_HEX = numberToHex(robinhoodChain.id)

export const robinhoodAddChainParams = {
  chainId: ROBINHOOD_CHAIN_ID_HEX,
  chainName: robinhoodChain.name,
  nativeCurrency: {
    name: robinhoodChain.nativeCurrency.name,
    symbol: robinhoodChain.nativeCurrency.symbol,
    decimals: robinhoodChain.nativeCurrency.decimals,
  },
  rpcUrls: [RH_RPC],
  blockExplorerUrls: robinhoodChain.blockExplorers?.default?.url
    ? [robinhoodChain.blockExplorers.default.url]
    : [],
} as const

type Eip1193 = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  request: (args: { method: string; params?: any }) => Promise<unknown>
}

function errCode(e: unknown): number | undefined {
  if (!e || typeof e !== 'object') return undefined
  const any = e as { code?: unknown; data?: { originalError?: { code?: unknown } } }
  if (typeof any.code === 'number') return any.code
  if (typeof any.data?.originalError?.code === 'number') {
    return any.data.originalError.code
  }
  return undefined
}

function errMessage(e: unknown): string {
  if (e instanceof Error) return e.message
  if (e && typeof e === 'object' && 'message' in e) {
    return String((e as { message: unknown }).message)
  }
  return String(e ?? '')
}

export async function ensureRobinhoodChain(provider: Eip1193): Promise<void> {
  const current = await provider.request({ method: 'eth_chainId' })
  const currentId =
    typeof current === 'string' ? Number.parseInt(current, 16) : Number(current)
  if (currentId === robinhoodChain.id) return

  try {
    await provider.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: ROBINHOOD_CHAIN_ID_HEX }],
    })
    return
  } catch (e) {
    const code = errCode(e)
    const msg = errMessage(e)
    const needsAdd =
      code === 4902 ||
      code === -32603 ||
      /unrecognized chain|unknown chain|not added|do not have|chain id/i.test(msg)

    if (!needsAdd) {
      if (code === 4001 || /rejected|denied|cancel/i.test(msg)) {
        throw new Error('Network switch rejected in wallet.')
      }
      throw e instanceof Error ? e : new Error(msg || 'Failed to switch network')
    }
  }

  try {
    await provider.request({
      method: 'wallet_addEthereumChain',
      params: [robinhoodAddChainParams],
    })
  } catch (e) {
    const msg = errMessage(e)
    if (/rejected|denied|cancel/i.test(msg) || errCode(e) === 4001) {
      throw new Error('Add Robinhood Chain rejected in wallet.')
    }
    throw new Error(
      msg || 'Could not add Robinhood Chain (4663). Add it manually in your wallet.',
    )
  }
}

export function friendlyConnectError(e: unknown, opts?: { hasWc?: boolean }): string {
  const msg = errMessage(e)
  const lower = msg.toLowerCase()

  if (/rejected|denied|cancel/i.test(lower) || errCode(e) === 4001) {
    return 'Connection rejected in wallet.'
  }
  if (
    /provider not found|no provider|resource unavailable|connectors not found|connector not found/i.test(
      lower,
    )
  ) {
    return opts?.hasWc
      ? 'No browser wallet detected. Use WalletConnect, or open in MetaMask.'
      : 'No browser wallet detected. Open in MetaMask, or set VITE_WC_PROJECT_ID for WalletConnect.'
  }
  if (/chain|network|4663/i.test(lower)) {
    return msg.split('\n')[0] || 'Wallet could not switch to Robinhood Chain (4663).'
  }
  return msg.split('\n')[0] || 'Connect failed'
}

export function asEip1193(provider: unknown): Eip1193 | null {
  if (!provider || typeof provider !== 'object') return null
  const req = (provider as { request?: unknown }).request
  if (typeof req !== 'function') return null
  return provider as Eip1193
}

export function shortenAddress(addr: string): string {
  if (!addr || addr.length < 10) return addr
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`
}
