import { http, createConfig } from 'wagmi'
import { injected, walletConnect } from 'wagmi/connectors'
import { RH_RPC, robinhoodChain } from './chain'

const WALLET_SITE = 'https://doghood.aibusiness.fun'

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
            description: 'Trade $HOOD on Robinhood Chain. A swap happens when your wallet signs it.',
            url: WALLET_SITE,
            icons: [`${WALLET_SITE}/favicon.svg`],
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
