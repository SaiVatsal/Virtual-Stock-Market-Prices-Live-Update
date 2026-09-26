'use client'

import { useEffect, useRef, useState } from 'react'

interface TradingViewChartProps {
  symbol: string
  interval?: string
  theme?: 'light' | 'dark'
  height?: number
  width?: string
  autosize?: boolean
  studies?: string[]
  toolbar_bg?: string
  allow_symbol_change?: boolean
  details?: boolean
  hotlist?: boolean
  calendar?: boolean
  show_popup_button?: boolean
  popup_width?: string
  popup_height?: string
  locale?: string
  backgroundColor?: string
  gridColor?: string
  watchlist?: string[]
}

export function TradingViewChart({
  symbol,
  interval = '5',
  theme = 'dark',
  height = 600,
  width = '100%',
  autosize = true,
  studies = [],
  toolbar_bg = '#1a1a2e',
  allow_symbol_change = true,
  details = true,
  hotlist = false,
  calendar = false,
  show_popup_button = false,
  popup_width = '1000',
  popup_height = '650',
  locale = 'en',
  backgroundColor = '#0f0f1a',
  gridColor = '#2a2a4a',
  watchlist = ['XAUUSD', 'EURUSD', 'GBPUSD', 'USDJPY', 'BTCUSD'],
}: TradingViewChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const widgetRef = useRef<any>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!containerRef.current || widgetRef.current) return

    // Check if TradingView script is loaded
    const loadWidget = () => {
      if (typeof window !== 'undefined' && (window as any).TradingView) {
        createWidget()
      } else {
        // Load TradingView script
        const script = document.createElement('script')
        script.src = 'https://s3.tradingview.com/tv.js'
        script.async = true
        script.onload = createWidget
        script.onerror = () => setError('Failed to load TradingView widget')
        document.head.appendChild(script)
      }
    }

    const createWidget = () => {
      if (!containerRef.current || widgetRef.current) return

      try {
        widgetRef.current = new (window as any).TradingView.widget({
          symbol: symbol.replace('/', ''),
          interval,
          theme,
          container_id: containerRef.current.id,
          autosize,
          width: autosize ? undefined : width,
          height: autosize ? undefined : height,
          studies,
          toolbar_bg,
          allow_symbol_change,
          details,
          hotlist,
          calendar,
          show_popup_button,
          popup_width,
          popup_height,
          locale,
          backgroundColor,
          gridColor,
          watchlist,
          disabled_features: [
            'header_symbol_search',
            'header_chart_type',
            'header_compare',
            'header_undo_redo',
            'header_screenshot',
            'volume_force_overlay',
          ],
          enabled_features: [
            'study_templates',
            'hide_left_toolbar_by_default',
            'hide_right_toolbar_by_default',
          ],
          overrides: {
            'mainSeriesProperties.candleStyle.upColor': '#00d47e',
            'mainSeriesProperties.candleStyle.downColor': '#ff4757',
            'mainSeriesProperties.candleStyle.borderUpColor': '#00d47e',
            'mainSeriesProperties.candleStyle.borderDownColor': '#ff4757',
            'mainSeriesProperties.candleStyle.wickUpColor': '#00d47e',
            'mainSeriesProperties.candleStyle.wickDownColor': '#ff4757',
            'paneProperties.background': backgroundColor,
            'paneProperties.vertGridProperties.color': gridColor,
            'paneProperties.horzGridProperties.color': gridColor,
            'scalesProperties.textColor': '#a0a0b8',
            'scalesProperties.lineColor': '#2a2a4a',
          },
        })

        setIsLoaded(true)
      } catch (err) {
        console.error('TradingView widget error:', err)
        setError('Failed to initialize chart')
      }
    }

    loadWidget()

    return () => {
      if (widgetRef.current) {
        try {
          widgetRef.current.remove()
        } catch (e) {
          // Ignore cleanup errors
        }
        widgetRef.current = null
      }
    }
  }, [
    symbol,
    interval,
    theme,
    height,
    width,
    autosize,
    studies.join(','),
    toolbar_bg,
    allow_symbol_change,
    details,
    hotlist,
    calendar,
    show_popup_button,
    popup_width,
    popup_height,
    locale,
    backgroundColor,
    gridColor,
    watchlist.join(','),
  ])

  if (error) {
    return (
      <div
        ref={containerRef}
        id={`tradingview-chart-${symbol}`}
        style={{ width, height, background: backgroundColor, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}
      >
        <div className="text-center p-8">
          <svg className="w-12 h-12 mx-auto text-gray-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p className="text-lg font-medium text-gray-300">Chart Unavailable</p>
          <p className="text-sm text-gray-500 mt-1">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      id={`tradingview-chart-${symbol}`}
      style={{ width, height: autosize ? undefined : height }}
      className="w-full"
    />
  )
}

// Simple price display component for when TradingView isn't needed
export function PriceDisplay({
  symbol,
  price,
  change,
  changePercent
}: {
  symbol: string
  price: number
  change: number
  changePercent: number
}) {
  const isPositive = change >= 0

  return (
    <div className="flex items-center gap-4 p-4 bg-gray-900/50 rounded-lg border border-gray-700">
      <div>
        <p className="text-xs text-gray-400 uppercase tracking-wide">{symbol}</p>
        <p className="text-2xl font-mono font-bold text-white">{price.toFixed(symbol === 'XAUUSD' ? 2 : 5)}</p>
      </div>
      <div className={`${isPositive ? 'text-green-400' : 'text-red-400'}`}>
        <p className="font-mono font-semibold">
          {isPositive ? '+' : ''}{change.toFixed(symbol === 'XAUUSD' ? 2 : 5)}
        </p>
        <p className="text-sm font-mono">
          {isPositive ? '+' : ''}{changePercent.toFixed(2)}%
        </p>
      </div>
    </div>
  )
}