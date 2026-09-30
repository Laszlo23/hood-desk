import { http, createConfig } from 'wagmi'
import { injected, walletConnect } from 'wagmi/connectors'
import { RH_RPC, robinhoodChain } from './chain'

const wcProjectId = String(import.meta.env.VITE_WC_PROJECT_ID || '')
  .trim()
  .replace(/^['"]|['"]$/g, '')

export const hasWalletConnect = Boolean(wcProjectId)

const connectors = [
  injected({
    shimDisconnect: true,
    unstable_shimAsyncInject: 2_000,
  }),
  ...(hasWalletConnect
    ? [
        walletConnect({
          projectId: wcProjectId,
          showQrModal: true,
          metadata: {
            name: 'Hood Desk',
            description: 'AI-run trading desk on Robinhood Chain',
            url: typeof window !== 'undefined' ? window.location.origin : 'https://hood-desk.local',
            icons: ['/favicon.svg'],
          },
        }),
      ]
    : []),
]

export const config = createConfig({
  chains: [robinhoodChain],
  transports: {
    [robinhoodChain.id]: http(RH_RPC),
  },
  connectors,
})

declare module 'wagmi' {
  interface Register {
    config: typeof config
  }
}
