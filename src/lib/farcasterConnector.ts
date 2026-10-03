import { createConnector } from 'wagmi'
import type { Address } from 'viem'
import { sdk } from './farcaster'

export function farcasterConnector() {
  let provider: typeof sdk.wallet.ethProvider | null = null
  let accountsChangedHandler: ((accounts: readonly Address[]) => void) | null = null
  let chainChangedHandler: ((chainId: string) => void) | null = null
  let disconnectHandler: (() => void) | null = null

  return createConnector<typeof sdk.wallet.ethProvider>((config) => ({
    id: 'farcaster',
    name: 'Farcaster',
    type: 'farcaster',
    async setup() {
      provider = sdk.wallet.ethProvider
    },
    async connect({ chainId, withCapabilities } = {}) {
      const prov = provider || sdk.wallet.ethProvider
      provider = prov

      let addressList: readonly Address[] = []
      try {
        addressList = (await prov.request({
          method: 'eth_requestAccounts',
        })) as Address[]
      } catch (error) {
        if ((error as { code?: number }).code === 4001) {
          throw new Error('User rejected the request.')
        }
        throw error
      }

      let currentChainId: number
      try {
        const hexChainId = (await prov.request({
          method: 'eth_chainId',
        })) as string
        currentChainId = Number.parseInt(hexChainId, 16)
      } catch {
        currentChainId = 0
      }

      accountsChangedHandler = (accounts: readonly Address[]) => {
        config.emitter.emit('change', { accounts })
      }
      chainChangedHandler = (chainId: string) => {
        config.emitter.emit('change', { chainId: Number.parseInt(chainId, 16) })
      }
      disconnectHandler = () => {
        config.emitter.emit('disconnect')
      }

      prov.on?.('accountsChanged', accountsChangedHandler)
      prov.on?.('chainChanged', chainChangedHandler)
      prov.on?.('disconnect', disconnectHandler)

      const accounts = withCapabilities
        ? addressList.map((address) => ({ address, capabilities: {} }))
        : addressList

      if (chainId && currentChainId !== chainId) {
        try {
          const chain = await this.switchChain?.({ chainId })
          if (chain) {
            return { accounts, chainId: chain.id } as any
          }
        } catch {
          // If switch fails, continue with current chain
        }
      }

      return { accounts, chainId: currentChainId } as any
    },
    async disconnect() {
      const prov = provider || sdk.wallet.ethProvider

      if (accountsChangedHandler) {
        prov.removeListener?.('accountsChanged', accountsChangedHandler)
        accountsChangedHandler = null
      }
      if (chainChangedHandler) {
        prov.removeListener?.('chainChanged', chainChangedHandler)
        chainChangedHandler = null
      }
      if (disconnectHandler) {
        prov.removeListener?.('disconnect', disconnectHandler)
        disconnectHandler = null
      }
    },
    async getAccounts() {
      const prov = provider || sdk.wallet.ethProvider
      const accounts = (await prov.request({
        method: 'eth_accounts',
      })) as Address[]
      return accounts
    },
    async getChainId() {
      const prov = provider || sdk.wallet.ethProvider
      const chainId = (await prov.request({
        method: 'eth_chainId',
      })) as string
      return Number.parseInt(chainId, 16)
    },
    async isAuthorized() {
      try {
        const accounts = await this.getAccounts()
        return accounts.length > 0
      } catch {
        return false
      }
    },
    async switchChain({ chainId }) {
      const prov = provider || sdk.wallet.ethProvider
      const chain = config.chains.find((c) => c.id === chainId)
      if (!chain) throw new Error(`Chain ${chainId} not configured`)

      try {
        await prov.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: `0x${chainId.toString(16)}` }],
        })
        return chain
      } catch (error) {
        const err = error as { code?: number }
        if (err.code === 4902) {
          try {
            await prov.request({
              method: 'wallet_addEthereumChain',
              params: [
                {
                  chainId: `0x${chainId.toString(16)}`,
                  chainName: chain.name,
                  nativeCurrency: chain.nativeCurrency,
                  rpcUrls: [chain.rpcUrls.default.http[0]],
                  blockExplorerUrls: chain.blockExplorers?.default?.url
                    ? [chain.blockExplorers.default.url]
                    : undefined,
                },
              ],
            })
            return chain
          } catch (addError) {
            throw new Error(`Failed to add chain: ${(addError as Error).message}`)
          }
        }
        throw error
      }
    },
    async getProvider() {
      return provider || sdk.wallet.ethProvider
    },
    async onAccountsChanged(accounts) {
      if (accounts.length === 0) {
        config.emitter.emit('disconnect')
      } else {
        config.emitter.emit('change', { accounts: accounts as readonly Address[] })
      }
    },
    async onChainChanged(chainId) {
      const id = Number.parseInt(chainId as string, 16)
      config.emitter.emit('change', { chainId: id })
    },
    async onDisconnect() {
      config.emitter.emit('disconnect')
    },
  }))
}
