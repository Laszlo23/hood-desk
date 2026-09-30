import { formatEther, formatUnits } from 'viem'
import { useAccount, useBalance, useDisconnect, useReadContract } from 'wagmi'
import { robinhoodChain } from '../lib/chain'
import { shortenAddress } from '../lib/ensureChain'
import {
  erc20Abi,
  HOOD_META,
  HOOD_TOKEN_ADDRESS,
  HOOD_TOKEN_DEPLOYED,
} from '../lib/hoodToken'
import { ConnectButton } from './ConnectButton'

type Props = {
  /** compact = sidebar / drawer; full = account page card */
  variant?: 'compact' | 'full'
  className?: string
}

/** Full wallet card — chain, address once, ETH / $HOOD balances. Not for the navbar. */
export function WalletPanel({ variant = 'full', className = '' }: Props) {
  const { address, isConnected, chainId } = useAccount()
  const { disconnect } = useDisconnect()
  const { data: nativeBal } = useBalance({
    address,
    chainId: robinhoodChain.id,
    query: { enabled: Boolean(address) },
  })

  const { data: hoodBal } = useReadContract({
    address: HOOD_TOKEN_ADDRESS ?? undefined,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    chainId: robinhoodChain.id,
    query: { enabled: Boolean(address && HOOD_TOKEN_DEPLOYED) },
  })

  const onRh = chainId === robinhoodChain.id
  const nativeStr = nativeBal
    ? Number(formatEther(nativeBal.value)).toLocaleString(undefined, {
        maximumFractionDigits: 5,
      })
    : '—'
  const hoodStr =
    HOOD_TOKEN_DEPLOYED && hoodBal !== undefined
      ? Number(formatUnits(hoodBal, HOOD_META.decimals)).toLocaleString(undefined, {
          maximumFractionDigits: 2,
        })
      : HOOD_TOKEN_DEPLOYED
        ? '…'
        : 'n/a'

  return (
    <aside
      className={`wallet-panel wallet-panel-${variant}${className ? ` ${className}` : ''}`}
      aria-label="Wallet"
    >
      <div className="wallet-panel-head">
        <span className="chain-badge" title="Robinhood Chain">
          {onRh || !isConnected ? '4663' : `≠${chainId ?? '?'}`}
        </span>
        <span className="wallet-panel-title">{variant === 'full' ? 'Wallet' : 'Balances'}</span>
      </div>

      {isConnected && address ? (
        <div className="wallet-panel-body">
          <div className="rail-addr mono" title={address}>
            {shortenAddress(address)}
          </div>
          <div className="rail-row">
            <span className="rail-label">ETH</span>
            <span className="rail-val mono">{nativeStr}</span>
          </div>
          <div className="rail-row">
            <span className="rail-label">$HOOD</span>
            <span className="rail-val mono">{hoodStr}</span>
          </div>
          {variant === 'full' && (
            <div className="wallet-panel-actions">
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => disconnect()}>
                Disconnect
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="wallet-panel-body">
          <p className="rail-hint muted">Connect · RH 4663</p>
          <ConnectButton />
        </div>
      )}
    </aside>
  )
}
