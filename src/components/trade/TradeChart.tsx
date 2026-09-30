import { useEffect, useRef } from 'react'
import { ColorType, createChart, type IChartApi, type ISeriesApi } from 'lightweight-charts'
import { generateDemoCandles } from '../../lib/trade/chartData'
import type { Timeframe, TradeToken } from '../../lib/trade/types'

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

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return

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
  }, [])

  useEffect(() => {
    if (!seriesRef.current || !chartRef.current) return
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
  }, [token.address, token.price, timeframe])

  return (
    <div className="trade-chart-block">
      <div className="trade-chart-head">
        <div>
          <h2 className="trade-pair-title">
            {token.symbol}/{token.quote}
          </h2>
          <p className="muted tiny">Demo OHLCV · not a live RH DEX feed</p>
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
            >
              {tf}
            </button>
          ))}
        </div>
      </div>
      <div className="trade-chart-canvas" ref={wrapRef} />
    </div>
  )
}
