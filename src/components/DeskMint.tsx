import { useCallback, useEffect, useState } from 'react'
import { isAddress, type Address, type Hash } from 'viem'
import { useAccount, usePublicClient, useWriteContract } from 'wagmi'
import { EXPLORER_TX } from '../lib/chain'

const mintAbi = [
  {
    type: 'function',
    name: 'owner',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
  },
  {
    type: 'function',
    name: 'totalSupply',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'MAX_SUPPLY',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'onePerAddress',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    type: 'function',
    name: 'balanceOf',
    stateMutability: 'view',
    inputs: [{ name: 'owner', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'mint',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'to', type: 'address' }],
    outputs: [],
  },
] as const

type Kind = 'seeder' | 'inner'

type Props = {
  contract: Address
  kind: Kind
  onMinted?: () => void
}

function supplyCopy(kind: Kind, supply: bigint | null, max: bigint | null): string {
  if (supply === null) return 'Reading the chain…'
  switch (kind) {
    case 'seeder':
      return `${supply.toString()} of ${max?.toString() ?? '3333'} passes are out.`
    case 'inner':
      return `${supply.toString()} ${supply === 1n ? 'badge is' : 'badges are'} out. One per wallet.`
    default: {
      const neverKind: never = kind
      return neverKind
    }
  }
}

function mintError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err ?? '')
  if (/AlreadyHoldsToken|0x726b456b/i.test(msg)) return 'That wallet already holds a badge.'
  if (/max supply/i.test(msg)) return 'All 3,333 passes are out.'
  if (/rejected|denied|cancel|4001/i.test(msg)) return 'The wallet closed the mint.'
  return 'The mint did not land. Try again from the desk wallet.'
}

export function DeskMint({ contract, kind, onMinted }: Props) {
  const { address, isConnected } = useAccount()
  const publicClient = usePublicClient()
  const { writeContractAsync } = useWriteContract()
  const [owner, setOwner] = useState<Address | null>(null)
  const [supply, setSupply] = useState<bigint | null>(null)
  const [max, setMax] = useState<bigint | null>(null)
  const [oneEach, setOneEach] = useState(kind === 'inner')
  const [to, setTo] = useState('')
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState<string | null>(null)
  const [tx, setTx] = useState<Hash | null>(null)

  const load = useCallback(async () => {
    if (!publicClient) return
    try {
      const [nextOwner, nextSupply] = await Promise.all([
        publicClient.readContract({ address: contract, abi: mintAbi, functionName: 'owner' }),
        publicClient.readContract({ address: contract, abi: mintAbi, functionName: 'totalSupply' }),
      ])
      setOwner(nextOwner)
      setSupply(nextSupply)
      if (kind === 'seeder') {
        const cap = await publicClient.readContract({
          address: contract,
          abi: mintAbi,
          functionName: 'MAX_SUPPLY',
        })
        setMax(cap)
      }
      if (kind === 'inner') {
        const flag = await publicClient.readContract({
          address: contract,
          abi: mintAbi,
          functionName: 'onePerAddress',
        })
        setOneEach(flag)
      }
    } catch {
      setNote('The chain read missed. Refresh and try the mint again.')
    }
  }, [contract, kind, publicClient])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (address) setTo((cur) => cur || address)
  }, [address])

  const isOwner = Boolean(address && owner && address.toLowerCase() === owner.toLowerCase())
  const full = kind === 'seeder' && supply !== null && max !== null && supply >= max

  const mint = async () => {
    if (!publicClient || !isOwner) return
    const recipient = to.trim()
    if (!isAddress(recipient)) {
      setNote('Enter the wallet that should receive the mark.')
      return
    }
    setBusy(true)
    setNote(null)
    setTx(null)
    try {
      if (kind === 'inner' && oneEach) {
        const held = await publicClient.readContract({
          address: contract,
          abi: mintAbi,
          functionName: 'balanceOf',
          args: [recipient],
        })
        if (held > 0n) {
          setNote('That wallet already holds a badge.')
          return
        }
      }
      const hash = await writeContractAsync({
        address: contract,
        abi: mintAbi,
        functionName: 'mint',
        args: [recipient],
      })
      await publicClient.waitForTransactionReceipt({ hash })
      setTx(hash)
      setNote(kind === 'seeder' ? 'Pass minted.' : 'Badge minted. It stays in that wallet.')
      await load()
      onMinted?.()
    } catch (err) {
      setNote(mintError(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="desk-mint">
      <p className="tiny muted">{supplyCopy(kind, supply, max)}</p>
      {isConnected && isOwner && !full ? (
        <label className="field">
          <span className="tiny muted">Mint to</span>
          <input
            className="input mono"
            value={to}
            spellCheck={false}
            autoComplete="off"
            onChange={(e) => setTo(e.target.value)}
            placeholder="0x…"
          />
        </label>
      ) : null}
      <div className="cta-row">
        {isConnected && isOwner && !full ? (
          <button type="button" className="btn btn-primary btn-sm" disabled={busy} onClick={() => void mint()}>
            {busy ? 'Minting…' : kind === 'seeder' ? 'Mint pass' : 'Mint badge'}
          </button>
        ) : (
          <button type="button" className="btn btn-primary btn-sm" disabled>
            {full ? 'All passes are out' : isConnected ? 'Desk wallet mints' : 'Connect to mint'}
          </button>
        )}
      </div>
      {!isConnected ? <p className="tiny muted">Connect the desk wallet to mint.</p> : null}
      {isConnected && owner && !isOwner ? (
        <p className="tiny muted">The desk wallet mints this mark.</p>
      ) : null}
      {note ? <p className="tiny">{note}</p> : null}
      {tx ? (
        <a className="tiny" href={EXPLORER_TX(tx)} target="_blank" rel="noreferrer noopener">
          View mint ↗
        </a>
      ) : null}
    </div>
  )
}
