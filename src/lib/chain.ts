import { defineChain } from 'viem'

const DEFAULT_RH_RPC = 'https://rpc.mainnet.chain.robinhood.com'

const clean = (raw: unknown) =>
  String(raw || '')
    .trim()
    .replace(/^['"]|['"]$/g, '')

/** Prefer VITE_RH_RPC; fall back to public Robinhood Chain RPC. */
export const RH_RPC = clean(import.meta.env.VITE_RH_RPC) || DEFAULT_RH_RPC

export const robinhoodChain = defineChain({
  id: 4663,
  name: 'Robinhood Chain',
  nativeCurrency: {
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: [RH_RPC],
    },
  },
  blockExplorers: {
    default: {
      name: 'Robinhood Blockscout',
      url: 'https://robinhoodchain.blockscout.com',
    },
  },
})

export const EXPLORER_BASE = 'https://robinhoodchain.blockscout.com'
export const EXPLORER_TX = (hash: string) => `${EXPLORER_BASE}/tx/${hash}`
export const EXPLORER_ADDRESS = (addr: string) => `${EXPLORER_BASE}/address/${addr}`
export const EXPLORER_TOKEN = (addr: string) => `${EXPLORER_BASE}/token/${addr}`
