'use client'

import { TradeForm } from '@/components/TradeForm'
import { TradingViewChart } from '@/components/TradingViewChart'
import { SuspenseWrapper } from '@/components/SuspenseWrapper'
import Link from 'next/link'
import { ArrowLeft, DollarSign, Layout } from 'lucide-react'

export default function TradePage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/" className="p-2 rounded hover:bg-gray-800">
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <DollarSign className="w-8 h-8 text-yellow-400" />
              Trade Execution
            </h1>
            <p className="text-gray-400">Execute paper trades with live market data</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Trade Form */}
          <div className="lg:col-span-1">
            <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-6 sticky top-24">
              <SuspenseWrapper fallback={<div className="h-64 flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>}>
                <TradeForm />
              </SuspenseWrapper>
            </div>
          </div>

          {/* Chart */}
          <div className="lg:col-span-2">
            <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-6">
              <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
                <Layout className="w-4 h-4 text-purple-400" />
                Live Chart
              </h2>
              <TradingViewChart symbol="XAUUSD" interval="5" height={600} />
            </div>
          </div>
        </div>

        {/* Quick Symbol Switch */}
        <div className="mt-6 bg-gray-900/50 border border-gray-700 rounded-xl p-4">
          <h3 className="text-lg font-medium mb-4">Quick Symbol Switch</h3>
          <div className="flex flex-wrap gap-2">
            {[
              { symbol: 'XAUUSD', label: 'Gold' },
              { symbol: 'EURUSD', label: 'EUR/USD' },
              { symbol: 'GBPUSD', label: 'GBP/USD' },
              { symbol: 'USDJPY', label: 'USD/JPY' },
              { symbol: 'USDCHF', label: 'USD/CHF' },
              { symbol: 'AUDUSD', label: 'AUD/USD' },
              { symbol: 'USDCAD', label: 'USD/CAD' },
              { symbol: 'NZDUSD', label: 'NZD/USD' },
              { symbol: 'BTCUSD', label: 'Bitcoin' },
            ].map(item => (
              <Link
                key={item.symbol}
                href={`/trade?symbol=${item.symbol}`}
                className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-300 hover:bg-gray-700 hover:text-white hover:border-gray-600 transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}