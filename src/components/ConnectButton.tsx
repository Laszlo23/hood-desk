import { useCallback, useState } from 'react'
import { useAccount, useConnect, useConnectorClient, useDisconnect } from 'wagmi'
import { robinhoodChain } from '../lib/chain'
import {
  asEip1193,
  ensureRobinhoodChain,
  friendlyConnectError,
  shortenAddress,
} from '../lib/ensureChain'
import { hasWalletConnect } from '../lib/wagmi'
import { awardXp } from '../lib/gamification'

export function ConnectButton() {
  const { address, isConnected, chainId } = useAccount()
  const { connect, connectors, isPending } = useConnect()
  const { disconnect } = useDisconnect()
  const { data: client } = useConnectorClient()
  const [err, setErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const onConnect = useCallback(async () => {
    setErr(null)
    setBusy(true)
    try {
      const preferred =
        connectors.find((c) => c.id === 'injected') ||
        connectors.find((c) => c.type === 'injected') ||
        connectors[0]
      if (!preferred) {
        setErr(
          hasWalletConnect
            ? 'No connector available.'
            : 'No wallet found. Install MetaMask or set VITE_WC_PROJECT_ID.',
        )
        return
      }
      await connect({ connector: preferred, chainId: robinhoodChain.id })
      awardXp('connect')
    } catch (e) {
      setErr(friendlyConnectError(e, { hasWc: hasWalletConnect }))
    } finally {
      setBusy(false)
    }
  }, [connect, connectors])

  const onSwitch = useCallback(async () => {
    setErr(null)
    const provider = asEip1193(client?.transport) ?? asEip1193(window.ethereum)
    if (!provider) {
      setErr('No provider to switch network.')
      return
    }
    try {
      await ensureRobinhoodChain(provider)
    } catch (e) {
      setErr(friendlyConnectError(e, { hasWc: hasWalletConnect }))
    }
  }, [client])

  if (isConnected && address) {
    const wrong = chainId !== undefined && chainId !== robinhoodChain.id
    return (
      <div className="connect-wrap">
        {wrong ? (
          <button type="button" className="btn btn-warn" onClick={onSwitch}>
            Switch to RH 4663
          </button>
        ) : (
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => disconnect()}>
            {shortenAddress(address)}
          </button>
        )}
        {err && <p className="err-line">{err}</p>}
      </div>
    )
  }

  return (
    <div className="connect-wrap">
      <button
        type="button"
        className="btn btn-primary btn-sm"
        disabled={busy || isPending}
        onClick={onConnect}
      >
        {busy || isPending ? '…' : 'CONNECT'}
      </button>
      {err && (
        <p className="err-line">
          {err}
          <span className="block tiny muted" style={{ marginTop: 4 }}>
            Connect a wallet on Robinhood Chain to sign a swap.
          </span>
        </p>
      )}
    </div>
  )
}
