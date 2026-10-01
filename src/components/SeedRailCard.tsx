import { useEffect, useState } from 'react'
import { useAccount, usePublicClient, useWriteContract } from 'wagmi'
import { formatUnits, parseEther, parseUnits, type Address } from 'viem'
import { erc20Abi } from '../lib/hoodToken'
import { HOOD_LP_TOKEN_ID, HOOD_POSITION_MANAGER } from '../lib/trade/uniswap'
import {
  HOOD_CAUSES,
  HOOD_DEPLOYER,
  HOOD_SEED_RAIL,
  HOOD_TOKEN_FOR_RAIL,
  seedRailAbi,
} from '../lib/trade/seedRail'

function hoodText(value: bigint): string {
  return Number(formatUnits(value, 18)).toLocaleString('en-US', { maximumFractionDigits: 0 })
}

function ethText(value: bigint): string {
  return Number(formatUnits(value, 18)).toLocaleString('en-US', { maximumFractionDigits: 6 })
}

const approveAbi = [
  {
    type: 'function',
    name: 'getApproved',
    stateMutability: 'view',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ name: '', type: 'address' }],
  },
] as const

type RailFacts = {
  budget: bigint
  treasury: Address
  owner: Address
  paused: boolean
  approved: boolean
  allowance: bigint
}

function short(addr: string): string {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`
}

export function SeedRailCard() {
  const { address, isConnected } = useAccount()
  const publicClient = usePublicClient()
  const { writeContractAsync } = useWriteContract()
  const [amount, setAmount] = useState('')
  const [budgetInput, setBudgetInput] = useState('')
  const [facts, setFacts] = useState<RailFacts | null>(null)
  const [quote, setQuote] = useState<{ ethUsed: bigint; hoodPull: bigint; causesCut: bigint } | null>(null)
  const [causesEth, setCausesEth] = useState<bigint | null>(null)
  const [causesBps, setCausesBps] = useState<number>(200)
  const [status, setStatus] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const rail = HOOD_SEED_RAIL
  const isOwner = Boolean(address && facts && address.toLowerCase() === facts.owner.toLowerCase())

  useEffect(() => {
    if (!rail || !publicClient) return
    let cancelled = false
    const load = async () => {
      const [budget, treasury, owner, paused, approved, bps, pot] = await Promise.all([
        publicClient.readContract({ address: rail, abi: seedRailAbi, functionName: 'hoodBudget' }),
        publicClient.readContract({ address: rail, abi: seedRailAbi, functionName: 'treasury' }),
        publicClient.readContract({ address: rail, abi: seedRailAbi, functionName: 'owner' }),
        publicClient.readContract({ address: rail, abi: seedRailAbi, functionName: 'paused' }),
        publicClient.readContract({
          address: HOOD_POSITION_MANAGER,
          abi: approveAbi,
          functionName: 'getApproved',
          args: [HOOD_LP_TOKEN_ID],
        }),
        publicClient.readContract({ address: rail, abi: seedRailAbi, functionName: 'causesBps' }),
        publicClient.getBalance({ address: HOOD_CAUSES }),
      ])
      const allowance = await publicClient.readContract({
        address: HOOD_TOKEN_FOR_RAIL,
        abi: erc20Abi,
        functionName: 'allowance',
        args: [treasury, rail],
      })
      if (!cancelled) {
        setCausesBps(Number(bps))
        setCausesEth(pot)
        setFacts({
          budget,
          treasury,
          owner,
          paused,
          approved: approved.toLowerCase() === rail.toLowerCase(),
          allowance,
        })
      }
    }
    load().catch(() => {
      if (!cancelled) setFacts(null)
    })
    return () => {
      cancelled = true
    }
  }, [publicClient, rail, status])

  useEffect(() => {
    if (!rail || !publicClient) return
    let cancelled = false
    let eth: bigint
    try {
      eth = parseEther(amount || '0')
    } catch {
      setQuote(null)
      return
    }
    if (eth === 0n) {
      setQuote(null)
      return
    }
    publicClient
      .readContract({ address: rail, abi: seedRailAbi, functionName: 'quoteSeed', args: [eth] })
      .then(([ethUsed, hoodPull, causesCut]) => {
        if (!cancelled) setQuote({ ethUsed, hoodPull, causesCut })
      })
      .catch(() => {
        if (!cancelled) setQuote(null)
      })
    return () => {
      cancelled = true
    }
  }, [amount, publicClient, rail, facts])

  const seed = async () => {
    if (!rail || !publicClient) return
    setBusy(true)
    setStatus(null)
    try {
      const value = parseEther(amount)
      const hash = await writeContractAsync({
        address: rail,
        abi: seedRailAbi,
        functionName: 'seed',
        value,
      })
      await publicClient.waitForTransactionReceipt({ hash })
      setStatus(`Seeded · ${hash.slice(0, 10)}…`)
      setAmount('')
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Seed failed')
    } finally {
      setBusy(false)
    }
  }

  const setBudget = async () => {
    if (!rail || !publicClient) return
    setBusy(true)
    setStatus(null)
    try {
      const budget = parseUnits(budgetInput, 18)
      if (facts && address && address.toLowerCase() === facts.treasury.toLowerCase() && facts.allowance < budget) {
        const approveHash = await writeContractAsync({
          address: HOOD_TOKEN_FOR_RAIL,
          abi: erc20Abi,
          functionName: 'approve',
          args: [rail, budget],
        })
        await publicClient.waitForTransactionReceipt({ hash: approveHash })
      }
      const hash = await writeContractAsync({
        address: rail,
        abi: seedRailAbi,
        functionName: 'setHoodBudget',
        args: [budget],
      })
      await publicClient.waitForTransactionReceipt({ hash })
      setStatus(`Budget set · ${hash.slice(0, 10)}…`)
      setBudgetInput('')
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Budget update failed')
    } finally {
      setBusy(false)
    }
  }

  const spendable = facts ? (facts.budget < facts.allowance ? facts.budget : facts.allowance) : 0n
  const canSeed = Boolean(
    rail && isConnected && facts && !facts.paused && facts.approved && spendable > 0n && quote && quote.ethUsed > 0n && !busy,
  )

  return (
    <article className="card">
      <h2>Seed the pool</h2>
      <p className="muted">
        Send ETH. {causesBps / 100}% goes to the causes pot. The rest is paired with treasury $HOOD on
        position #{HOOD_LP_TOKEN_ID.toString()}, up to 100,000,000 HOOD. A large deposit uses the same
        price as a small one. Extra ETH comes back when the budget cannot match the full amount.
      </p>
      {rail === null ? (
        <p className="muted mt">
          The rail contract is ready. It deploys from {short(HOOD_DEPLOYER)} and then that wallet approves
          position #{HOOD_LP_TOKEN_ID.toString()}. The $HOOD budget stays at zero until it is set on purpose.
        </p>
      ) : (
        <>
          <ul className="hood-contract-list">
            <li>
              <span className="rail-label">Rail</span>
              <span className="mono">{rail}</span>
            </li>
            <li>
              <span className="rail-label">Treasury budget</span>
              <span className="mono">{facts ? `${hoodText(spendable)} HOOD` : '…'}</span>
            </li>
            <li>
              <span className="rail-label">Causes ({causesBps / 100}%)</span>
              <span className="mono">
                {causesEth === null ? '…' : `${ethText(causesEth)} ETH`} · {HOOD_CAUSES}
              </span>
            </li>
            <li>
              <span className="rail-label">Position approval</span>
              <span className="mono">{facts ? (facts.approved ? 'Approved to add' : 'Not approved') : '…'}</span>
            </li>
          </ul>
          <label className="field mt">
            <span className="rail-label">ETH to add</span>
            <input
              className="input mono"
              inputMode="decimal"
              value={amount}
              placeholder="0.0"
              onChange={(e) => setAmount(e.target.value)}
            />
          </label>
          {quote && quote.ethUsed > 0n && (
            <p className="muted mt">
              Causes {ethText(quote.causesCut)} ETH. Pool {ethText(quote.ethUsed)} ETH and up to {hoodText(quote.hoodPull)}{' '}
              HOOD.
            </p>
          )}
          <div className="cta-row mt">
            <button type="button" className="btn btn-primary" disabled={!canSeed} onClick={() => void seed()}>
              {busy ? 'Waiting for wallet…' : 'Seed liquidity'}
            </button>
          </div>
          {isOwner && (
            <label className="field mt">
              <span className="rail-label">Treasury $HOOD this rail may pair. Sets the cap and approves that amount.</span>
              <input
                className="input mono"
                inputMode="decimal"
                value={budgetInput}
                placeholder="0"
                onChange={(e) => setBudgetInput(e.target.value)}
              />
              <button
                type="button"
                className="btn btn-ghost mt"
                disabled={busy || budgetInput.trim() === ''}
                onClick={() => void setBudget()}
              >
                Set budget
              </button>
            </label>
          )}
        </>
      )}
      {status && <p className="muted mt">{status}</p>}
    </article>
  )
}
