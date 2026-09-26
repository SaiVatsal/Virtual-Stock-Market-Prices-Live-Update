'use client'

import { SignalsFeed } from '@/components/SignalsFeed'
import Link from 'next/link'
import { ArrowLeft, List, AlertTriangle, Zap } from 'lucide-react'

export default function SignalsPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/" className="p-2 rounded hover:bg-gray-800">
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <List className="w-8 h-8 text-indigo-400" />
              Trading Signals
            </h1>
            <p className="text-gray-400">Live signals from TradingView webhook with AI confidence notes</p>
          </div>
        </div>

        <div className="bg-gray-900/50 border border-gray-700 rounded-xl">
          <SignalsFeed />
        </div>

        {/* Webhook Setup Info */}
        <div className="mt-8 bg-gray-900/50 border border-gray-700 rounded-xl p-6">
          <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-400" />
            Webhook Setup
          </h3>
          <div className="space-y-4 text-sm text-gray-400">
            <p>To receive signals, configure a TradingView webhook with the following settings:</p>
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 font-mono text-xs overflow-x-auto">
              URL: https://your-domain.vercel.app/api/webhooks/tradingview
            </div>
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 font-mono text-xs overflow-x-auto">
              Method: POST
            </div>
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 font-mono text-xs overflow-x-auto">
              Headers: X-TradingView-Signature: &lt;HMAC-SHA256 of payload with secret&gt;
            </div>
            <p className="text-yellow-400">Set TRADINGVIEW_WEBHOOK_SECRET in your environment variables to match your TradingView alert webhook secret.</p>
            <div className="space-y-2 pt-2 border-t border-gray-700">
              <p className="font-medium">Expected JSON Payload:</p>
              <pre className="bg-gray-900 border border-gray-700 rounded-lg p-4 text-xs overflow-x-auto">
{`{
  "symbol": "XAUUSD",
  "direction": "long",
  "timeframe": "M5",
  "price": 2045.50,
  "stopLoss": 2040.00,
  "takeProfit": 2055.00,
  "signalType": "order_block",
  "indicatorName": "ICT Order Block Finder",
  "timestamp": "2024-01-15T14:30:00Z"
}`}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}