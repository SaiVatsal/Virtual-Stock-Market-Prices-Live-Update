'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { X, TrendingUp, TrendingDown, DollarSign, Loader2, AlertTriangle, CheckCircle } from 'lucide-react'

const SYMBOLS = [
  { value: 'XAUUSD', label: 'Gold (XAUUSD)', pipValue: 0.01 },
  { value: 'EURUSD', label: 'EUR/USD', pipValue: 0.0001 },
  { value: 'GBPUSD', label: 'GBP/USD', pipValue: 0.0001 },
  { value: 'USDJPY', label: 'USD/JPY', pipValue: 0.01 },
  { value: 'USDCHF', label: 'USD/CHF', pipValue: 0.0001 },
  { value: 'AUDUSD', label: 'AUD/USD', pipValue: 0.0001 },
  { value: 'USDCAD', label: 'USD/CAD', pipValue: 0.0001 },
  { value: 'NZDUSD', label: 'NZD/USD', pipValue: 0.0001 },
  { value: 'BTCUSD', label: 'Bitcoin (BTCUSD)', pipValue: 0.01 },
]

interface PriceData {
  symbol: string
  price: number
  bid: number
  ask: number
  timestamp: string
  change24h: number
  changePercent24h: number
}

interface Position {
  id: string
  symbol: string
  quantity: number
  averagePrice: number
  currentPrice: number | null
  unrealizedPnL: number
}

export function TradeForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const prefillSymbol = searchParams.get('symbol')
  const prefillSide = searchParams.get('side') as 'BUY' | 'SELL' | null

  const [symbol, setSymbol] = useState(prefillSymbol || 'XAUUSD')
  const [side, setSide] = useState<'BUY' | 'SELL'>(prefillSide || 'BUY')
  const [quantity, setQuantity] = useState('')
  const [price, setPrice] = useState<number | null>(null)
  const [bid, setBid] = useState<number | null>(null)
  const [ask, setAsk] = useState<number | null>(null)
  const [change24h, setChange24h] = useState(0)
  const [changePercent24h, setChangePercent24h] = useState(0)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [positions, setPositions] = useState<Position[]>([])
  const [balance, setBalance] = useState(0)
  const [priceLoading, setPriceLoading] = useState(true)

  // Fetch price data
  const fetchPrice = async () => {
    setPriceLoading(true)
    try {
      const res = await fetch(`/api/prices`)
      if (res.ok) {
        const data = await res.json()
        const priceData = data.prices?.find((p: PriceData) => p.symbol === symbol)
        if (priceData) {
          setPrice(priceData.price)
          setBid(priceData.bid)
          setAsk(priceData.ask)
          setChange24h(priceData.change24h)
          setChangePercent24h(priceData.changePercent24h)
        }
      }
    } catch (err) {
      console.error('Failed to fetch price:', err)
    } finally {
      setPriceLoading(false)
    }
  }

  // Fetch portfolio for balance and positions
  const fetchPortfolio = async () => {
    try {
      const res = await fetch('/api/portfolio')
      if (res.ok) {
        const data = await res.json()
        setBalance(data.balance)
        setPositions(data.positions || [])
      }
    } catch (err) {
      console.error('Failed to fetch portfolio:', err)
    }
  }

  useEffect(() => {
    fetchPrice()
    fetchPortfolio()
    const interval = setInterval(fetchPrice, 5000)
    return () => clearInterval(interval)
  }, [symbol])

  // Calculate cost/margin
  const currentPrice = price || bid || ask || 0
  const cost = currentPrice * (parseFloat(quantity) || 0)
  const hasPosition = positions.find(p => p.symbol === symbol)
  const maxSellQty = hasPosition ? hasPosition.quantity : 0

  const canSubmit = () => {
    const qty = parseFloat(quantity)
    if (!qty || qty <= 0) return false
    if (side === 'BUY' && cost > balance) return false
    if (side === 'SELL' && qty > maxSellQty) return false
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit()) return

    setSubmitting(true)
    setError(null)
    setSuccess(null)

    try {
      const res = await fetch('/api/trades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol,
          side,
          quantity: parseFloat(quantity),
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Trade failed')
      }

      setSuccess(`Successfully ${side === 'BUY' ? 'opened' : 'closed'} ${quantity} ${symbol}`)
      setQuantity('')

      // Refresh portfolio data
      await fetchPortfolio()

      // Redirect to portfolio after short delay
      setTimeout(() => {
        router.push('/portfolio')
        router.refresh()
      }, 1500)
    } catch (err: any) {
      setError(err.message || 'Failed to execute trade')
    } finally {
      setSubmitting(false)
    }
  }

  const selectedSymbolInfo = SYMBOLS.find(s => s.value === symbol)

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Symbol Selector */}
      <div>
        <label className="block text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Instrument</label>
        <div className="relative">
          <select
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent appearance-none bg-no-repeat bg-right pr-10"
            style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundSize: '1.5rem 1.5rem', backgroundPosition: 'right 0.5rem center' }}
          >
            {SYMBOLS.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Side Selector */}
      <div>
        <label className="block text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Direction</label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setSide('BUY')}
            className={`flex-1 py-3 rounded-lg font-medium transition-all ${
              side === 'BUY'
                ? 'bg-green-500/20 border border-green-500 text-green-400 shadow-lg shadow-green-500/10'
                : 'bg-gray-800 border border-gray-700 text-gray-400 hover:border-gray-600 hover:text-white'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <TrendingUp className="w-5 h-5" />
              <span>BUY / LONG</span>
            </div>
          </button>
          <button
            type="button"
            onClick={() => setSide('SELL')}
            className={`flex-1 py-3 rounded-lg font-medium transition-all ${
              side === 'SELL'
                ? 'bg-red-500/20 border border-red-500 text-red-400 shadow-lg shadow-red-500/10'
                : 'bg-gray-800 border border-gray-700 text-gray-400 hover:border-gray-600 hover:text-white'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <TrendingDown className="w-5 h-5" />
              <span>SELL / SHORT</span>
            </div>
          </button>
        </div>
      </div>

      {/* Price Display */}
      <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-gray-400 uppercase tracking-wide">Current Price</span>
          {priceLoading && <Loader2 className="w-4 h-4 text-primary animate-spin" />}
        </div>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xs text-gray-400 mb-1">BID</p>
            <p className="text-xl font-mono font-bold text-red-400">{bid?.toFixed(symbol === 'XAUUSD' ? 2 : 5) || '—'}</p>
          </div>
          <div className="border-x border-gray-700">
            <p className="text-xs text-gray-400 mb-1">MID</p>
            <p className="text-2xl font-mono font-bold text-white">{currentPrice.toFixed(symbol === 'XAUUSD' ? 2 : 5) || '—'}</p>
            <p className={`text-xs font-mono mt-1 ${changePercent24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {changePercent24h >= 0 ? '+' : ''}{changePercent24h.toFixed(2)}% (24h)
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">ASK</p>
            <p className="text-xl font-mono font-bold text-green-400">{ask?.toFixed(symbol === 'XAUUSD' ? 2 : 5) || '—'}</p>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-gray-700 flex items-center justify-between text-xs text-gray-400">
          <span>Spread: {(ask && bid ? (ask - bid).toFixed(symbol === 'XAUUSD' ? 2 : 5) : '—')}</span>
          <span>Updated: {new Date().toLocaleTimeString()}</span>
        </div>
      </div>

      {/* Quantity Input */}
      <div>
        <label className="block text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
          Quantity {side === 'SELL' && hasPosition && ` (Max: ${maxSellQty.toLocaleString()})`}
        </label>
        <div className="relative">
          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder={side === 'BUY' ? 'Enter quantity to buy' : `Enter quantity to sell (max ${maxSellQty.toLocaleString()})`}
            min="0.01"
            step={symbol === 'XAUUSD' || symbol === 'BTCUSD' ? '0.01' : '0.01'}
            className="w-full pl-10 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            disabled={side === 'SELL' && maxSellQty === 0}
          />
          {side === 'SELL' && maxSellQty === 0 && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">No position</span>
          )}
        </div>
        {side === 'BUY' && quantity && (
          <p className="mt-1 text-sm text-gray-400">
            Estimated cost: <span className="text-white font-mono">${cost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            {' '}
            {cost > balance && (
              <span className="text-red-400 ml-2">(Insufficient balance: $${balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})</span>
            )}
          </p>
        )}
        {side === 'SELL' && quantity && hasPosition && (
          <p className="mt-1 text-sm text-gray-400">
            Estimated proceeds: <span className="text-white font-mono">${(currentPrice * parseFloat(quantity)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            {' '}
            {parseFloat(quantity) > maxSellQty && (
              <span className="text-red-400 ml-2">(Exceeds position size)</span>
            )}
          </p>
        )}
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm">{success}</span>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        onClick={handleSubmit}
        disabled={!canSubmit() || submitting}
        className={`w-full py-4 rounded-lg font-semibold text-lg transition-all flex items-center justify-center gap-2 ${
          submitting
            ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
            : side === 'BUY'
            ? 'bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-500/20'
            : 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-500/20'
        } ${!canSubmit() && !submitting ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {submitting && <Loader2 className="w-5 h-5 animate-spin" />}
        {submitting ? 'Processing...' : `${side} ${quantity || '—'} ${symbol}`}
      </button>

      {/* Quick Quantity Buttons */}
      <div className="grid grid-cols-4 gap-2">
        {['0.01', '0.1', '0.5', '1'].map(qty => (
          <button
            type="button"
            onClick={() => setQuantity(qty)}
            className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
              quantity === qty
                ? 'bg-primary text-primary-foreground'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white'
            }`}
            disabled={side === 'SELL' && parseFloat(qty) > maxSellQty}
          >
            {qty}
          </button>
        ))}
      </div>

      {/* Risk Warning */}
      <div className="flex items-start gap-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
        <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-yellow-300">
          <p className="font-medium">Risk Reminder:</p>
          <p>This is a paper trading simulator. No real money is at risk. Past performance does not guarantee future results.</p>
        </div>
      </div>
    </div>
  )
}