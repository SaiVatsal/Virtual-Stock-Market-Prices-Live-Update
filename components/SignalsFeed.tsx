'use client'

import { useEffect, useState } from 'react'
import { format, formatDistanceToNow } from 'date-fns'
import { TrendingUp, TrendingDown, Clock, Target, Shield, AlertCircle, Info, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react'

interface Signal {
  id: string
  symbol: string
  direction: 'LONG' | 'SHORT'
  timeframe: string
  entryPrice: number
  stopLoss: number | null
  takeProfit: number | null
  status: 'PENDING' | 'TRIGGERED' | 'EXPIRED' | 'CANCELLED'
  source: string
  metadata: {
    indicatorName?: string
    signalType?: string
    aiNote?: string
  }
  receivedAt: string
  triggeredAt: string | null
  user?: {
    name: string | null
    email: string
  }
}

export function SignalsFeed() {
  const [signals, setSignals] = useState<Signal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'pending' | 'triggered' | 'expired'>('all')
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [refreshing, setRefreshing] = useState(false)

  const fetchSignals = async () => {
    try {
      setRefreshing(true)
      const res = await fetch('/api/signals')
      if (res.ok) {
        const data = await res.json()
        setSignals(data.signals || [])
      } else {
        throw new Error('Failed to fetch signals')
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchSignals()
    const interval = setInterval(fetchSignals, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const filteredSignals = signals.filter(signal => {
    if (filter === 'all') return true
    return signal.status.toLowerCase() === filter
  })

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedIds)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedIds(newExpanded)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20'
      case 'TRIGGERED': return 'text-green-400 bg-green-500/10 border-green-500/20'
      case 'EXPIRED': return 'text-gray-400 bg-gray-500/10 border-gray-500/20'
      case 'CANCELLED': return 'text-red-400 bg-red-500/10 border-red-500/20'
      default: return 'text-gray-400 bg-gray-500/10 border-gray-500/20'
    }
  }

  const getDirectionColor = (direction: string) => {
    return direction === 'LONG' ? 'text-green-400' : 'text-red-400'
  }

  const getDirectionIcon = (direction: string) => {
    return direction === 'LONG' ? TrendingUp : TrendingDown
  }

  if (loading && signals.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 text-primary animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center p-8 text-red-400">
        <AlertCircle className="w-12 h-12 mx-auto mb-4" />
        <p className="text-lg">Failed to load signals</p>
        <p className="text-sm text-gray-500 mt-1">{error}</p>
        <button onClick={fetchSignals} className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm">
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header with Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold text-white">Trading Signals</h2>
          <span className="px-2 py-1 text-xs font-mono bg-gray-800 border border-gray-700 rounded">
            {signals.length} total
          </span>
        </div>
        <div className="flex items-center gap-2">
          {(['all', 'pending', 'triggered', 'expired'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium uppercase tracking-wide transition-colors ${
                filter === f
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
          <button
            onClick={fetchSignals}
            disabled={refreshing}
            className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-xs text-gray-400 hover:text-white hover:border-gray-600 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Signals List */}
      {filteredSignals.length === 0 ? (
        <div className="text-center py-12">
          <Info className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-300 mb-2">No Signals</h3>
          <p className="text-gray-500">
            {filter === 'all'
              ? 'No trading signals received yet. Connect TradingView webhook to start receiving signals.'
              : `No ${filter} signals found.`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredSignals.map(signal => (
            <SignalCard
              key={signal.id}
              signal={signal}
              isExpanded={expandedIds.has(signal.id)}
              onToggle={() => toggleExpand(signal.id)}
              getStatusColor={getStatusColor}
              getDirectionColor={getDirectionColor}
              getDirectionIcon={getDirectionIcon}
            />
          ))}
        </div>
      )}
    </div>
  )
}

interface SignalCardProps {
  signal: Signal
  isExpanded: boolean
  onToggle: () => void
  getStatusColor: (status: string) => string
  getDirectionColor: (direction: string) => string
  getDirectionIcon: (direction: string) => typeof TrendingUp
}

function SignalCard({ signal, isExpanded, onToggle, getStatusColor, getDirectionColor, getDirectionIcon }: SignalCardProps) {
  const DirectionIcon = getDirectionIcon(signal.direction)
  const statusColor = getStatusColor(signal.status)
  const directionColor = getDirectionColor(signal.direction)

  const r = signal.takeProfit && signal.stopLoss && signal.entryPrice
    ? Math.abs((signal.takeProfit - signal.entryPrice) / (signal.entryPrice - signal.stopLoss))
    : null

  const riskPercent = signal.stopLoss && signal.entryPrice
    ? Math.abs((signal.entryPrice - signal.stopLoss) / signal.entryPrice) * 100
    : null

  return (
    <div className="bg-gray-900/50 border border-gray-700 rounded-xl overflow-hidden transition-all hover:border-gray-600">
      {/* Main Signal Row */}
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-center gap-4 hover:bg-gray-800/50 transition-colors text-left"
      >
        {/* Direction Badge */}
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${directionColor} bg-current/10 border border-current/20`}>
          <DirectionIcon className="w-4 h-4" />
          <span className="font-semibold text-sm">{signal.direction}</span>
        </div>

        {/* Symbol & Timeframe */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-mono font-bold text-lg text-white">{signal.symbol}</span>
            <span className="px-2 py-0.5 text-xs font-mono bg-gray-800 border border-gray-700 rounded text-gray-300">
              {signal.timeframe}
            </span>
            <span className="px-2 py-0.5 text-xs font-medium rounded border capitalize bg-gray-800 border-gray-700 text-gray-300">
              {signal.metadata.signalType?.replace('_', ' ') || 'Signal'}
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDistanceToNow(new Date(signal.receivedAt), { addSuffix: true })}
            </span>
            {signal.metadata.indicatorName && (
              <span className="flex items-center gap-1">
                <Info className="w-3 h-3" />
                {signal.metadata.indicatorName}
              </span>
            )}
          </div>
        </div>

        {/* Price Levels */}
        <div className="text-right hidden md:block">
          <div className="text-xs text-gray-400 mb-1">Entry</div>
          <div className="font-mono font-medium text-white">{signal.entryPrice.toFixed(signal.symbol === 'XAUUSD' ? 2 : 5)}</div>
        </div>

        {/* Status */}
        <div className={`px-3 py-1.5 rounded-lg text-xs font-medium uppercase tracking-wide ${statusColor} whitespace-nowrap`}>
          {signal.status}
        </div>

        {/* Expand Chevron */}
        <div className="text-gray-500 flex-shrink-0">
          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </div>
      </button>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="border-t border-gray-700 p-4 bg-gray-950/50 animate-slide-down">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Stop Loss */}
            <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
              <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                <Shield className="w-4 h-4" />
                <span className="uppercase tracking-wide">Stop Loss</span>
              </div>
              {signal.stopLoss ? (
                <>
                  <div className="font-mono text-2xl font-bold text-red-400">{signal.stopLoss.toFixed(signal.symbol === 'XAUUSD' ? 2 : 5)}</div>
                  {riskPercent && (
                    <div className="text-xs text-red-400 mt-1">{riskPercent.toFixed(2)}% risk</div>
                  )}
                </>
              ) : (
                <div className="font-mono text-2xl font-bold text-gray-500">Not Set</div>
              )}
            </div>

            {/* Take Profit */}
            <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
              <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                <Target className="w-4 h-4" />
                <span className="uppercase tracking-wide">Take Profit</span>
              </div>
              {signal.takeProfit ? (
                <>
                  <div className="font-mono text-2xl font-bold text-green-400">{signal.takeProfit.toFixed(signal.symbol === 'XAUUSD' ? 2 : 5)}</div>
                  {r && (
                    <div className="text-xs text-green-400 mt-1">R:R 1:{r.toFixed(2)}</div>
                  )}
                </>
              ) : (
                <div className="font-mono text-2xl font-bold text-gray-500">Not Set</div>
              )}
            </div>

            {/* Risk:Reward */}
            <div className="bg-gray-900 rounded-lg p-4 border border-gray-700 flex items-center justify-center">
              {r ? (
                <div className="text-center">
                  <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Risk : Reward</div>
                  <div className={`font-mono text-3xl font-bold ${r >= 2 ? 'text-green-400' : r >= 1 ? 'text-yellow-400' : 'text-red-400'}`}>
                    1 : {r.toFixed(2)}
                  </div>
                  <div className={`text-xs ${r >= 2 ? 'text-green-400' : r >= 1 ? 'text-yellow-400' : 'text-red-400'} mt-1`}>
                    {r >= 2 ? 'Excellent' : r >= 1 ? 'Acceptable' : 'Poor'}
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500">
                  <div className="text-xs uppercase tracking-wide mb-1">Risk : Reward</div>
                  <div className="font-mono text-3xl font-bold">—</div>
                  <div className="text-xs mt-1">Incomplete levels</div>
                </div>
              )}
            </div>
          </div>

          {/* AI Confidence Note */}
          {signal.metadata.aiNote && (
            <div className="mt-4 p-4 bg-primary/10 border border-primary/20 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-primary mb-2">
                <Info className="w-4 h-4" />
                <span className="font-medium">AI Confidence Note</span>
              </div>
              <p className="text-gray-300 text-sm leading-relaxed">{signal.metadata.aiNote}</p>
            </div>
          )}

          {/* Signal Meta */}
          <div className="mt-4 pt-4 border-t border-gray-700 flex flex-wrap gap-4 text-xs text-gray-500">
            <span>Source: <span className="text-gray-300 capitalize">{signal.source}</span></span>
            <span>Received: <span className="text-gray-300">{format(new Date(signal.receivedAt), 'MMM d, yyyy HH:mm:ss')}</span></span>
            {signal.triggeredAt && (
              <span>Triggered: <span className="text-gray-300">{format(new Date(signal.triggeredAt), 'MMM d, yyyy HH:mm:ss')}</span></span>
            )}
            {signal.user && (
              <span>User: <span className="text-gray-300">{signal.user.name || signal.user.email}</span></span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}