import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAccount } from 'wagmi'
import { isAddress } from 'viem'
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
import { listOrders, placeSimulatedOrder } from '../lib/trade/orders'
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

type Props = { onNavigate: (id: ViewId, projectId?: string) => void }

export function Trade({ onNavigate }: Props) {
  const { address } = useAccount()
  const tokens = useMemo(() => collectTradeTokens(address), [address])
  const [token, setToken] = useState<TradeToken>(DEMO_TOKENS[0])
  const [timeframe, setTimeframe] = useState<Timeframe>('15m')
  const [ordersTab, setOrdersTab] = useState<'orders' | 'trades'>('orders')
  const [orders, setOrders] = useState<SimulatedOrder[]>([])
  const [vetOpen, setVetOpen] = useState(false)
  const [vetGate, setVetGate] = useState(false)
  const [lastVet, setLastVet] = useState<VetResult | null>(null)
  const [pendingDraft, setPendingDraft] = useState<TradeDraft | null>(null)
  const [flash, setFlash] = useState<string | null>(null)
  const [panelKey, setPanelKey] = useState(0)

  const refreshOrders = useCallback(() => {
    setOrders(listOrders())
  }, [])

  useEffect(() => {
    refreshOrders()
  }, [refreshOrders])

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

  const onRequestSimulate = (draft: TradeDraft) => {
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

  return (
    <section className="trade-page">
      <TradeSidebar active="trade" onNavigate={onNavigate} />

      <div className="trade-center">
        <WeeklyBanner compact />
        <TradeStatusBar tokenSymbol={token.symbol} />
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

        <TradeChart token={token} timeframe={timeframe} onTimeframe={setTimeframe} />
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
