import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAccount, usePublicClient, useSendTransaction, useWriteContract } from 'wagmi'
import { formatUnits, isAddress } from 'viem'
import { OrdersPanel } from '../components/trade/OrdersPanel'
import { TokenPicker } from '../components/trade/TokenPicker'
import { TradeChart } from '../components/trade/TradeChart'
import { TradePanel, type TradeDraft } from '../components/trade/TradePanel'
import { TradeSidebar } from '../components/trade/TradeSidebar'
import { VetPanel } from '../components/trade/VetPanel'
import {
  collectTradeTokens,
  DEMO_TOKENS,
  stubTokenFromAddress,
} from '../lib/trade/demoTokens'
import { HOOD_SWAP_SLIPPAGE_BPS, planHoodMarketSwap } from '../lib/trade/hoodSwap'
import { listOrders, placeOnchainOrder, placeSimulatedOrder } from '../lib/trade/orders'
import { loadHoodPoolChart, type HoodPoolChart } from '../lib/trade/poolCandles'
import { hoodHasPool, uniswapSwapUrl } from '../lib/trade/uniswap'
import { erc20Abi } from '../lib/hoodToken'
import type {
  SimulatedOrder,
  Timeframe,
  TradeToken,
  VetResult,
} from '../lib/trade/types'
import { getActiveBot, recordSkillUsage } from '../lib/market/skillMarket'
import { awardXp } from '../lib/gamification'
import { accrueTradeRewards } from '../lib/rewards/ledger'
import type { ViewId } from '../lib/nav'
import { WeeklyBanner } from '../components/WeeklyBanner'
import { ConnectButton } from '../components/ConnectButton'
import { TradeStatusBar } from '../components/status/TradeStatusBar'
import { HOOD_TOKEN_ADDRESS } from '../lib/hoodToken'

type Props = { onNavigate: (id: ViewId, projectId?: string) => void }

function swapError(err: unknown): string {
  if (err && typeof err === 'object' && 'shortMessage' in err) {
    const message = String((err as { shortMessage?: string }).shortMessage || '')
    if (message) return message
  }
  if (err instanceof Error && err.message) return err.message
  return 'Swap failed'
}

export function Trade({ onNavigate }: Props) {
  const { address, isConnected } = useAccount()
  const publicClient = usePublicClient()
  const { sendTransactionAsync } = useSendTransaction()
  const { writeContractAsync } = useWriteContract()
  const tokens = useMemo(() => collectTradeTokens(address), [address])
  const [token, setToken] = useState<TradeToken>(
    () => collectTradeTokens()[0] ?? DEMO_TOKENS[0],
  )
  const [timeframe, setTimeframe] = useState<Timeframe>('15m')
  const [ordersTab, setOrdersTab] = useState<'orders' | 'trades'>('orders')
  const [orders, setOrders] = useState<SimulatedOrder[]>([])
  const [vetOpen, setVetOpen] = useState(false)
  const [vetGate, setVetGate] = useState(false)
  const [lastVet, setLastVet] = useState<VetResult | null>(null)
  const [pendingDraft, setPendingDraft] = useState<TradeDraft | null>(null)
  const [flash, setFlash] = useState<string | null>(null)
  const [panelKey, setPanelKey] = useState(0)
  const [swapBusy, setSwapBusy] = useState(false)
  const [poolExists, setPoolExists] = useState<boolean | null>(null)
  const [poolChart, setPoolChart] = useState<HoodPoolChart | null>(null)

  const refreshOrders = useCallback(() => {
    setOrders(listOrders())
  }, [])

  useEffect(() => {
    refreshOrders()
  }, [refreshOrders])

  useEffect(() => {
    if (!HOOD_TOKEN_ADDRESS) {
      setPoolExists(false)
      return
    }
    let cancelled = false
    hoodHasPool(HOOD_TOKEN_ADDRESS)
      .then((exists) => {
        if (!cancelled) setPoolExists(exists)
      })
      .catch(() => {
        if (!cancelled) setPoolExists(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const hoodAddress = HOOD_TOKEN_ADDRESS
  const isHoodToken =
    hoodAddress !== null && token.address.toLowerCase() === hoodAddress.toLowerCase()

  useEffect(() => {
    if (!isHoodToken || poolExists !== true) {
      setPoolChart(null)
      return
    }
    let cancelled = false
    loadHoodPoolChart(timeframe)
      .then((chart) => {
        if (!cancelled) setPoolChart(chart)
      })
      .catch(() => {
        if (!cancelled) setPoolChart(null)
      })
    return () => {
      cancelled = true
    }
  }, [isHoodToken, poolExists, timeframe])

  // Keep selected token in sync if list refreshes with same address
  useEffect(() => {
    const match = tokens.find((t) => t.address.toLowerCase() === token.address.toLowerCase())
    if (match && match !== token) setToken(match)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokens])

  const commitOrder = useCallback(
    (draft: TradeDraft) => {
      const order = placeSimulatedOrder({
        tokenAddress: token.address,
        tokenSymbol: token.symbol,
        quote: token.quote,
        side: draft.side,
        type: draft.type,
        mode: draft.mode,
        amount: draft.amount,
        price: draft.price,
      })
      refreshOrders()
      recordSkillUsage('order')
      const reward = accrueTradeRewards(order)
      awardXp('simulate_trade', { once: false })
      const bot = getActiveBot()
      setOrdersTab(draft.type === 'market' ? 'trades' : 'orders')
      const rewardHint = reward.ok
        ? ` · rewards +${reward.feeVolume.toFixed(4)} fee split`
        : ''
      setFlash(
        bot
          ? `Simulated ${order.side} · ${order.id} · via ${bot.name}${rewardHint}`
          : `Simulated ${order.side} · ${order.id}${rewardHint}`,
      )
      setPendingDraft(null)
      setPanelKey((k) => k + 1)
      window.setTimeout(() => setFlash(null), 3200)
    },
    [token, refreshOrders],
  )

  const executeHoodSwap = useCallback(
    async (draft: TradeDraft) => {
      if (!isConnected || !address || !publicClient || !HOOD_TOKEN_ADDRESS) {
        setFlash('Connect a wallet on Robinhood Chain to swap.')
        window.setTimeout(() => setFlash(null), 3200)
        return
      }
      setSwapBusy(true)
      try {
        const planned = await planHoodMarketSwap({
          side: draft.side,
          amount: draft.amount,
          recipient: address,
        })
        if (!planned.ok) {
          setFlash(planned.error)
          return
        }
        const { plan } = planned
        if (plan.approveAmount) {
          const allowance = await publicClient.readContract({
            address: HOOD_TOKEN_ADDRESS,
            abi: erc20Abi,
            functionName: 'allowance',
            args: [address, plan.router],
          })
          if (allowance < plan.approveAmount) {
            const approveHash = await writeContractAsync({
              address: HOOD_TOKEN_ADDRESS,
              abi: erc20Abi,
              functionName: 'approve',
              args: [plan.router, plan.approveAmount],
            })
            await publicClient.waitForTransactionReceipt({ hash: approveHash })
          }
        }
        const hash = await sendTransactionAsync({
          to: plan.router,
          data: plan.data,
          value: plan.value,
        })
        await publicClient.waitForTransactionReceipt({ hash })
        const outLabel =
          draft.side === 'buy'
            ? `${formatUnits(plan.quotedOut, 18)} HOOD`
            : `${formatUnits(plan.quotedOut, 18)} ETH`
        placeOnchainOrder({
          tokenAddress: token.address,
          tokenSymbol: token.symbol,
          quote: token.quote,
          side: draft.side,
          type: draft.type,
          mode: draft.mode,
          amount: draft.amount,
          price: draft.price,
          txHash: hash,
          note: `Uniswap V3 ${plan.fee / 10000}% · quoted ${outLabel} · min ${HOOD_SWAP_SLIPPAGE_BPS / 100}% slippage`,
        })
        refreshOrders()
        recordSkillUsage('order')
        awardXp('simulate_trade', { once: false })
        setOrdersTab('trades')
        setFlash(`Swap confirmed · ${hash.slice(0, 10)}…`)
        setPanelKey((k) => k + 1)
      } catch (err) {
        setFlash(swapError(err))
      } finally {
        setSwapBusy(false)
        window.setTimeout(() => setFlash(null), 4200)
      }
    },
    [
      address,
      isConnected,
      publicClient,
      refreshOrders,
      sendTransactionAsync,
      token,
      writeContractAsync,
    ],
  )

  const onRequestSimulate = (draft: TradeDraft) => {
    const liveMarket =
      Boolean(isHoodToken) &&
      poolExists === true &&
      (draft.mode === 'instant' || draft.type === 'market')
    if (liveMarket) {
      void executeHoodSwap(draft)
      return
    }
    const vetOk =
      lastVet &&
      lastVet.address.toLowerCase() === token.address.toLowerCase() &&
      lastVet.verdict === 'Likely real'
    if (vetOk) {
      commitOrder(draft)
      return
    }
    setPendingDraft(draft)
    setVetGate(true)
    setVetOpen(true)
  }

  const onPasteAddress = (addr: string) => {
    if (!isAddress(addr)) return
    const existing = tokens.find((t) => t.address.toLowerCase() === addr.toLowerCase())
    setToken(existing ?? stubTokenFromAddress(addr))
    setLastVet(null)
  }

  const uniswapTokenUrl = uniswapSwapUrl(token.address)
  const okuTokenUrl = `https://oku.trade/token/4663:${token.address}`

  return (
    <section className="trade-page lore-shell-page">
      <TradeSidebar active="trade" onNavigate={onNavigate} />

      <div className="trade-center">
        <WeeklyBanner compact />
        <TradeStatusBar
          mode={isHoodToken && poolExists ? 'uniswap' : 'simulate'}
          live={Boolean(isHoodToken && poolExists)}
          tokenSymbol={token.symbol}
        />
        {isHoodToken && poolExists === false && (
          <div className="trade-pool-notice">
            <strong>No $HOOD Uniswap pool yet</strong>
            <p className="tiny muted">
              Checked WETH and USDG fee tiers. Market swaps stay off until a pool exists.
            </p>
            <div className="cta-row">
              <a href={uniswapTokenUrl} target="_blank" rel="noreferrer" className="btn btn-primary btn-sm">
                Open on Uniswap →
              </a>
              <a href={okuTokenUrl} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm">
                Open on Oku →
              </a>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => onNavigate('hood')}>
                $HOOD info
              </button>
            </div>
          </div>
        )}
        {isHoodToken && poolExists === true && (
          <div className="trade-pool-notice">
            <strong>$HOOD/WETH is live on Uniswap V3</strong>
            <p className="tiny muted">
              Market buy and sell sign in your wallet. The pool is thin, so a large size will not fill. Limit, stop, TWAP, and DCA stay on this desk.
            </p>
            <div className="cta-row">
              <a href={uniswapTokenUrl} target="_blank" rel="noreferrer" className="btn btn-primary btn-sm">
                Open on Uniswap →
              </a>
              <a href={okuTokenUrl} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm">
                Open on Oku →
              </a>
            </div>
          </div>
        )}
        <div className="trade-center-top">
          <TokenPicker
            tokens={tokens}
            selected={token}
            onSelect={(t) => {
              setToken(t)
              setLastVet(null)
            }}
            onPasteAddress={onPasteAddress}
          />
          <div className="trade-top-right">
            {flash && <span className="trade-flash">{flash}</span>}
            <button
              type="button"
              className="active-bot-chip"
              title="HOOD Community Auto-Trade"
              onClick={() => onNavigate('community')}
            >
              🦊 HOOD Auto-Trade
            </button>
            {(() => {
              const bot = getActiveBot()
              return bot ? (
                <button
                  type="button"
                  className="active-bot-chip"
                  title="Primary Skill Market bot"
                  onClick={() => onNavigate('skills')}
                >
                  🤖 {bot.name}
                </button>
              ) : (
                <button
                  type="button"
                  className="active-bot-chip muted-chip"
                  onClick={() => onNavigate('skills')}
                >
                  Follow a bot
                </button>
              )
            })()}
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => onNavigate('account')}
              title="Account & wallet"
            >
              Account
            </button>
            <ConnectButton />
          </div>
        </div>

        <TradeChart
          token={token}
          timeframe={timeframe}
          onTimeframe={setTimeframe}
          poolCandles={isHoodToken && poolExists ? poolChart?.candles ?? null : undefined}
          poolSwapCount={poolChart?.swapCount}
        />
        <OrdersPanel orders={orders} tab={ordersTab} onTab={setOrdersTab} />
      </div>

      <TradePanel
        key={`${token.address}-${panelKey}`}
        token={token}
        lastVet={lastVet}
        onOpenVet={() => {
          setVetGate(false)
          setVetOpen(true)
        }}
        busy={swapBusy}
        poolLive={Boolean(isHoodToken && poolExists)}
        liveQuote={isHoodToken && poolChart ? poolChart : null}
        onRequestSimulate={onRequestSimulate}
      />

      <VetPanel
        token={token}
        wallet={address}
        open={vetOpen}
        gateMode={vetGate}
        onClose={() => {
          setVetOpen(false)
          setVetGate(false)
        }}
        onResult={(r) => {
          setLastVet(r)
          recordSkillUsage('vet')
        }}
        onProceed={() => {
          if (pendingDraft) commitOrder(pendingDraft)
        }}
      />
    </section>
  )
}
