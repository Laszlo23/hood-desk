import { useMemo, useState } from 'react'
import { formatUnits, isAddress, parseUnits } from 'viem'
import {
  useAccount,
  useBytecode,
  useConnectorClient,
  useReadContract,
  useWriteContract,
} from 'wagmi'
import { EXPLORER_ADDRESS, robinhoodChain } from '../lib/chain'
import { asEip1193, ensureRobinhoodChain } from '../lib/ensureChain'
import { erc20Abi, HOOD_META, HOOD_TOKEN_ADDRESS } from '../lib/hoodToken'
import {
  BOUND_COLLECTIONS,
  erc6551RegistryAbi,
  erc721OwnerAbi,
  ERC6551_REGISTRY,
  registryAccountArgs,
  type BoundCollectionId,
} from '../lib/nfts/tokenBound'

type Props = {
  /** Which collection the panel opens on. */
  initialCollection?: BoundCollectionId
}

function shortAddr(addr: string): string {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`
}

function formatToken(value: bigint | undefined, digits = 2): string {
  if (value === undefined) return '…'
  return Number(formatUnits(value, 18)).toLocaleString(undefined, {
    maximumFractionDigits: digits,
  })
}

export function TokenBoundPanel({ initialCollection = 'dogihood' }: Props) {
  const [collectionId, setCollectionId] = useState<BoundCollectionId>(initialCollection)
  const collection = BOUND_COLLECTIONS[collectionId]
  const [tokenIdRaw, setTokenIdRaw] = useState(String(collection.sampleTokenId))
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState<string | null>(null)
  const [busy, setBusy] = useState<'activate' | 'send' | null>(null)

  const { address, isConnected } = useAccount()
  const { data: connectorClient } = useConnectorClient()
  const { writeContractAsync } = useWriteContract()

  const tokenId = useMemo(() => {
    const trimmed = tokenIdRaw.trim()
    if (!/^\d+$/.test(trimmed)) return null
    try {
      return BigInt(trimmed)
    } catch {
      return null
    }
  }, [tokenIdRaw])

  const accountArgs = tokenId !== null ? registryAccountArgs(collection.nft, tokenId) : undefined

  const tbaQuery = useReadContract({
    address: ERC6551_REGISTRY,
    abi: erc6551RegistryAbi,
    functionName: 'account',
    args: accountArgs,
    chainId: robinhoodChain.id,
    query: { enabled: Boolean(accountArgs) },
  })

  const tba = tbaQuery.data && isAddress(tbaQuery.data) ? tbaQuery.data : undefined

  const ownerQuery = useReadContract({
    address: collection.nft,
    abi: erc721OwnerAbi,
    functionName: 'ownerOf',
    args: tokenId !== null ? [tokenId] : undefined,
    chainId: robinhoodChain.id,
    query: { enabled: tokenId !== null },
  })

  const hoodQuery = useReadContract({
    address: HOOD_TOKEN_ADDRESS ?? undefined,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: tba ? [tba] : undefined,
    chainId: robinhoodChain.id,
    query: { enabled: Boolean(tba && HOOD_TOKEN_ADDRESS) },
  })

  const walletHoodQuery = useReadContract({
    address: HOOD_TOKEN_ADDRESS ?? undefined,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    chainId: robinhoodChain.id,
    query: { enabled: Boolean(address && HOOD_TOKEN_ADDRESS) },
  })

  const preloadedQuery = useReadContract({
    address: collection.preloadedToken ?? undefined,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: tba && collection.preloadedToken ? [tba] : undefined,
    chainId: robinhoodChain.id,
    query: { enabled: Boolean(tba && collection.preloadedToken) },
  })

  const codeQuery = useBytecode({
    address: tba,
    chainId: robinhoodChain.id,
    query: { enabled: Boolean(tba) },
  })

  const deployed = Boolean(codeQuery.data && codeQuery.data !== '0x')
  const ownsNft =
    Boolean(address && ownerQuery.data) &&
    address!.toLowerCase() === String(ownerQuery.data).toLowerCase()

  const onCollection = (id: BoundCollectionId) => {
    setCollectionId(id)
    setTokenIdRaw(String(BOUND_COLLECTIONS[id].sampleTokenId))
    setNote(null)
  }

  const refresh = async () => {
    await Promise.all([
      tbaQuery.refetch(),
      ownerQuery.refetch(),
      hoodQuery.refetch(),
      walletHoodQuery.refetch(),
      preloadedQuery.refetch(),
      codeQuery.refetch(),
    ])
  }

  const onRobinhood = async () => {
    const provider = asEip1193(connectorClient?.transport) ?? asEip1193(window.ethereum)
    if (!provider) throw new Error('No wallet provider.')
    await ensureRobinhoodChain(provider)
  }

  const onActivate = async () => {
    if (!accountArgs || !tba) return
    setNote(null)
    setBusy('activate')
    try {
      await onRobinhood()
      const hash = await writeContractAsync({
        address: ERC6551_REGISTRY,
        abi: erc6551RegistryAbi,
        functionName: 'createAccount',
        args: accountArgs,
        chainId: robinhoodChain.id,
      })
      setNote(`Wallet activated. Tx ${shortAddr(hash)}`)
      await refresh()
    } catch (e) {
      setNote(e instanceof Error ? e.message : 'Activation failed.')
    } finally {
      setBusy(null)
    }
  }

  const onSend = async () => {
    if (!tba || !HOOD_TOKEN_ADDRESS) return
    setNote(null)
    setBusy('send')
    try {
      const value = parseUnits(amount.trim(), HOOD_META.decimals)
      if (value <= 0n) throw new Error('Enter an amount of $HOOD greater than 0.')
      await onRobinhood()
      const hash = await writeContractAsync({
        address: HOOD_TOKEN_ADDRESS,
        abi: erc20Abi,
        functionName: 'transfer',
        args: [tba, value],
        chainId: robinhoodChain.id,
      })
      setNote(`Sent $HOOD into NFT #${tokenIdRaw}. Tx ${shortAddr(hash)}`)
      setAmount('')
      await refresh()
    } catch (e) {
      setNote(e instanceof Error ? e.message : 'Transfer failed.')
    } finally {
      setBusy(null)
    }
  }

  return (
    <article className="card tba-panel">
      <div className="row-between">
        <div>
          <p className="rail-label">ERC-6551 · token-bound wallet</p>
          <h2>Bind $HOOD to an NFT</h2>
        </div>
        <span className="badge">RH 4663</span>
      </div>
      <p className="muted">
        Each NFT has its own wallet on the HoodStreet ERC-6551 registry. Whoever owns the NFT
        controls that wallet. Sending $HOOD into it binds the tokens to the NFT — they move when
        the NFT moves.
      </p>
      <p className="tiny muted">{collection.preloadedNote}</p>

      <div className="tba-collections" role="tablist" aria-label="NFT collection">
        {(Object.keys(BOUND_COLLECTIONS) as BoundCollectionId[]).map((id) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={id === collectionId}
            className={`btn btn-sm ${id === collectionId ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => onCollection(id)}
          >
            {BOUND_COLLECTIONS[id].name}
          </button>
        ))}
      </div>

      <label className="field tba-token-field">
        <span className="rail-label">Token id</span>
        <input
          className="input"
          inputMode="numeric"
          value={tokenIdRaw}
          onChange={(e) => {
            setTokenIdRaw(e.target.value)
            setNote(null)
          }}
        />
      </label>

      {tokenId === null ? (
        <p className="tiny muted">Enter a whole token id.</p>
      ) : ownerQuery.isError ? (
        <p className="tiny muted">Token #{tokenIdRaw} is not minted on {collection.name}.</p>
      ) : (
        <div className="hood-specs-grid tba-readout">
          <div className="hood-spec-item">
            <span className="rail-label">NFT wallet</span>
            {tba ? (
              <a className="hood-spec-value mono" href={EXPLORER_ADDRESS(tba)} target="_blank" rel="noreferrer">
                {tba}
              </a>
            ) : (
              <span className="hood-spec-value">{tbaQuery.isError ? 'Registry read failed' : '…'}</span>
            )}
          </div>
          <div className="hood-spec-item">
            <span className="rail-label">Wallet contract</span>
            <span className="hood-spec-value">{deployed ? 'Active' : 'Not activated yet'}</span>
          </div>
          <div className="hood-spec-item">
            <span className="rail-label">NFT owner</span>
            <span className="hood-spec-value mono">
              {ownerQuery.data ? shortAddr(ownerQuery.data) : '…'}
              {ownsNft ? ' · you' : ''}
            </span>
          </div>
          <div className="hood-spec-item">
            <span className="rail-label">$HOOD inside</span>
            <span className="hood-spec-value mono">
              {HOOD_TOKEN_ADDRESS ? formatToken(hoodQuery.data, 4) : 'token unset'}
            </span>
          </div>
          {collection.preloadedToken && collection.preloadedSymbol ? (
            <div className="hood-spec-item">
              <span className="rail-label">${collection.preloadedSymbol} inside</span>
              <span className="hood-spec-value mono">{formatToken(preloadedQuery.data, 0)}</span>
            </div>
          ) : null}
          <div className="hood-spec-item">
            <span className="rail-label">Your wallet $HOOD</span>
            <span className="hood-spec-value mono">
              {isConnected ? formatToken(walletHoodQuery.data, 4) : 'connect wallet'}
            </span>
          </div>
        </div>
      )}

      {HOOD_TOKEN_ADDRESS ? (
        <p className="tiny muted mono tba-hood-line">$HOOD {HOOD_TOKEN_ADDRESS}</p>
      ) : (
        <p className="tiny muted">$HOOD address override is invalid. Clear VITE_HOOD_TOKEN to use the live contract.</p>
      )}

      <div className="tba-send">
        <label className="field">
          <span className="rail-label">$HOOD to send into this NFT</span>
          <input
            className="input"
            inputMode="decimal"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </label>
        <div className="cta-row">
          {!deployed && tba && tokenId !== null && !ownerQuery.isError ? (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              disabled={!isConnected || busy !== null}
              onClick={() => void onActivate()}
            >
              {busy === 'activate' ? 'Activating…' : 'Activate NFT wallet'}
            </button>
          ) : null}
          <button
            type="button"
            className="btn btn-primary btn-sm"
            disabled={!isConnected || !tba || !HOOD_TOKEN_ADDRESS || busy !== null || tokenId === null}
            onClick={() => void onSend()}
          >
            {busy === 'send' ? 'Sending…' : 'Send $HOOD into NFT'}
          </button>
        </div>
        {!isConnected ? (
          <p className="tiny muted">Connect a wallet on Robinhood Chain to send $HOOD into the NFT wallet.</p>
        ) : (
          <p className="tiny muted">
            This transfers $HOOD from your wallet into the NFT wallet. The NFT owner can spend it.
            Receiving works before activation; spending from the NFT wallet needs the wallet activated.
          </p>
        )}
        {note ? <p className="tiny tba-note">{note}</p> : null}
      </div>
    </article>
  )
}
