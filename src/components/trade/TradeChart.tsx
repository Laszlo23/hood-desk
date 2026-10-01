import { useEffect, useRef, useState } from 'react'
import { ColorType, createChart, type IChartApi, type ISeriesApi } from 'lightweight-charts'
import { generateDemoCandles } from '../../lib/trade/chartData'
import type { Timeframe, TradeToken } from '../../lib/trade/types'
import { HOOD_TOKEN_ADDRESS } from '../../lib/hoodToken'
import { hoodHasPool } from '../../lib/trade/uniswap'

type Props = {
  token: TradeToken
  timeframe: Timeframe
  onTimeframe: (tf: Timeframe) => void
}

const TFS: Timeframe[] = ['1m', '5m', '15m', '1h', '4h', '1D']

export function TradeChart({ token, timeframe, onTimeframe }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null)
  const [poolExists, setPoolExists] = useState<boolean | null>(null)
  const [isCheckingPool, setIsCheckingPool] = useState(false)

  const isHoodToken = HOOD_TOKEN_ADDRESS && 
    token.address.toLowerCase() === HOOD_TOKEN_ADDRESS.toLowerCase()

  // Check if $HOOD has a pool
  useEffect(() => {
    if (!isHoodToken || !HOOD_TOKEN_ADDRESS) {
      setPoolExists(null)
      return
    }

    let cancelled = false
    setIsCheckingPool(true)

    hoodHasPool(HOOD_TOKEN_ADDRESS)
      .then((exists) => {
        if (!cancelled) {
          setPoolExists(exists)
          setIsCheckingPool(false)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setPoolExists(false)
          setIsCheckingPool(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [isHoodToken])

  const shouldShowChart = !isHoodToken || poolExists === true
  const shouldShowNoPool = isHoodToken && poolExists === false

  useEffect(() => {
    const el = wrapRef.current
    if (!el || !shouldShowChart) return

    const chart = createChart(el, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#8a8a8a',
        fontFamily: "ui-monospace, 'SF Mono', Menlo, Consolas, monospace",
      },
      grid: {
        vertLines: { color: 'rgba(204, 255, 0, 0.06)' },
        horzLines: { color: 'rgba(204, 255, 0, 0.06)' },
      },
      rightPriceScale: { borderColor: 'rgba(204, 255, 0, 0.15)' },
      timeScale: { borderColor: 'rgba(204, 255, 0, 0.15)', timeVisible: true },
      crosshair: {
        vertLine: { color: 'rgba(204, 255, 0, 0.35)' },
        horzLine: { color: 'rgba(204, 255, 0, 0.35)' },
      },
      width: el.clientWidth,
      height: el.clientHeight || 320,
    })

    const series = chart.addCandlestickSeries({
      upColor: '#CCFF00',
      downColor: '#ff5c5c',
      borderUpColor: '#CCFF00',
      borderDownColor: '#ff5c5c',
      wickUpColor: '#CCFF00',
      wickDownColor: '#ff5c5c',
    })

    chartRef.current = chart
    seriesRef.current = series

    const ro = new ResizeObserver(() => {
      if (!wrapRef.current || !chartRef.current) return
      chartRef.current.applyOptions({
        width: wrapRef.current.clientWidth,
        height: wrapRef.current.clientHeight || 320,
      })
    })
    ro.observe(el)

    return () => {
      ro.disconnect()
      chart.remove()
      chartRef.current = null
      seriesRef.current = null
    }
  }, [shouldShowChart])

  useEffect(() => {
    if (!seriesRef.current || !chartRef.current || !shouldShowChart) return
    const candles = generateDemoCandles(token.address, timeframe, token.price || 0.0001)
    seriesRef.current.setData(
      candles.map((c) => ({
        time: c.time as unknown as import('lightweight-charts').UTCTimestamp,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      })),
    )
    chartRef.current.timeScale().fitContent()
  }, [token.address, token.price, timeframe, shouldShowChart])

  return (
    <div className="trade-chart-block">
      <div className="trade-chart-head">
        <div>
          <h2 className="trade-pair-title">
            {token.symbol}/{token.quote}
          </h2>
          <p className="muted tiny">
            {shouldShowNoPool 
              ? 'No Uniswap pool found — cannot show price chart' 
              : isCheckingPool 
                ? 'Checking pool status...'
                : 'Demo OHLCV · not a live RH DEX feed'}
          </p>
        </div>
        <div className="tf-row" role="tablist" aria-label="Timeframes">
          {TFS.map((tf) => (
            <button
              key={tf}
              type="button"
              role="tab"
              aria-selected={timeframe === tf}
              className={`tf-chip${timeframe === tf ? ' active' : ''}`}
              onClick={() => onTimeframe(tf)}
              disabled={shouldShowNoPool || undefined}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>
      {shouldShowNoPool ? (
        <div className="trade-chart-empty">
          <div className="trade-chart-empty-content">
            <span className="trade-chart-empty-icon">📊</span>
            <h3>No liquidity pool found</h3>
            <p className="muted">
              ${token.symbol} has no Uniswap V3 pool vs WETH or USDG on Robinhood Chain.
              <br />
              Price data cannot be displayed until a pool is created.
            </p>
            <div className="cta-row mt">
              <a 
                href={`https://app.uniswap.org/explore/tokens/chain/4663/${token.address}`}
                target="_blank" 
                rel="noreferrer" 
                className="btn btn-ghost btn-sm"
              >
                Check on Uniswap →
              </a>
              <a 
                href={`https://oku.trade/token/4663:${token.address}`}
                target="_blank" 
                rel="noreferrer" 
                className="btn btn-ghost btn-sm"
              >
                Check on Oku →
              </a>
            </div>
          </div>
        </div>
      ) : isCheckingPool ? (
        <div className="trade-chart-empty">
          <div className="trade-chart-empty-content">
            <span className="trade-chart-empty-icon">⏳</span>
            <p className="muted">Checking pool status...</p>
          </div>
        </div>
      ) : (
        <div className="trade-chart-canvas" ref={wrapRef} />
      )}
    </div>
  )
}
