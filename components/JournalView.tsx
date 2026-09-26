'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { TrendingUp, TrendingDown, Minus, FileText, Brain, Star, AlertTriangle, CheckCircle, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react'

interface JournalEntry {
  id: string
  symbol: string
  side: 'BUY' | 'SELL'
  entryPrice: number
  exitPrice: number
  quantity: number
  pnl: number
  timeframe: string
  aiCritique: string
  aiScore: number | null
  concepts: string[]
  createdAt: string
  tradeId: string
}

export function JournalView() {
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [refreshing, setRefreshing] = useState(false)
  const [filter, setFilter] = useState<'all' | 'profitable' | 'losing'>('all')

  const fetchEntries = async () => {
    try {
      setRefreshing(true)
      const res = await fetch('/api/journal')
      if (res.ok) {
        const data = await res.json()
        setEntries(data.entries || [])
      } else {
        throw new Error('Failed to fetch journal entries')
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchEntries()
  }, [])

  const filteredEntries = entries.filter(entry => {
    if (filter === 'all') return true
    if (filter === 'profitable') return entry.pnl > 0
    if (filter === 'losing') return entry.pnl < 0
    return true
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

  const getScoreColor = (score: number | null) => {
    if (score === null) return 'text-gray-500'
    if (score > 50) return 'text-green-400'
    if (score > 0) return 'text-yellow-400'
    if (score > -50) return 'text-orange-400'
    return 'text-red-400'
  }

  const getScoreLabel = (score: number | null) => {
    if (score === null) return 'N/A'
    if (score > 50) return 'Excellent'
    if (score > 0) return 'Good'
    if (score > -50) return 'Fair'
    return 'Poor'
  }

  if (loading && entries.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 text-primary animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center p-8 text-red-400">
        <AlertTriangle className="w-12 h-12 mx-auto mb-4" />
        <p className="text-lg">Failed to load journal</p>
        <p className="text-sm text-gray-500 mt-1">{error}</p>
        <button onClick={fetchEntries} className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm">
          Retry
        </button>
      </div>
    )
  }

  // Calculate stats
  const totalTrades = entries.length
  const profitableTrades = entries.filter(e => e.pnl > 0).length
  const losingTrades = entries.filter(e => e.pnl < 0).length
  const winRate = totalTrades > 0 ? (profitableTrades / totalTrades) * 100 : 0
  const avgScore = entries.filter(e => e.aiScore !== null).reduce((sum, e) => sum + (e.aiScore || 0), 0) /
    Math.max(1, entries.filter(e => e.aiScore !== null).length)
  const totalPnL = entries.reduce((sum, e) => sum + e.pnl, 0)

  return (
    <div className="space-y-6">
      {/* Stats Header */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard label="Total Trades" value={totalTrades} icon={FileText} color="text-blue-400" />
        <StatCard label="Win Rate" value={`${winRate.toFixed(1)}%`} icon={winRate >= 50 ? TrendingUp : TrendingDown} color={winRate >= 50 ? 'text-green-400' : 'text-red-400'} />
        <StatCard label="Avg AI Score" value={avgScore.toFixed(0)} icon={Brain} color={getScoreColor(avgScore)} />
        <StatCard label="Total P&L" value={`${totalPnL >= 0 ? '+' : ''}$${totalPnL.toFixed(2)}`} icon={totalPnL >= 0 ? TrendingUp : TrendingDown} color={totalPnL >= 0 ? 'text-green-400' : 'text-red-400'} />
        <StatCard label="Profitable" value={profitableTrades} icon={CheckCircle} color="text-green-400" />
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {(['all', 'profitable', 'losing'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === f
                ? 'bg-primary text-primary-foreground'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)} {f !== 'all' && `(${filteredEntries.length})`}
          </button>
        ))}
      </div>

      {/* Journal Entries */}
      {filteredEntries.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-300 mb-2">No Journal Entries</h3>
          <p className="text-gray-500">
            Complete trades to generate AI-analyzed journal entries automatically.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredEntries.map(entry => (
            <JournalEntryCard
              key={entry.id}
              entry={entry}
              isExpanded={expandedIds.has(entry.id)}
              onToggle={() => toggleExpand(entry.id)}
              getScoreColor={getScoreColor}
              getScoreLabel={getScoreLabel}
            />
          ))}
        </div>
      )}
    </div>
  )
}

interface StatCardProps {
  label: string
  value: string | number
  icon: typeof TrendingUp
  color: string
}

function StatCard({ label, value, icon: Icon, color }: StatCardProps) {
  return (
    <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-400 uppercase tracking-wide">{label}</span>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      <p className="text-2xl font-mono font-bold text-white">{value}</p>
    </div>
  )
}

interface JournalEntryCardProps {
  entry: JournalEntry
  isExpanded: boolean
  onToggle: () => void
  getScoreColor: (score: number | null) => string
  getScoreLabel: (score: number | null) => string
}

function JournalEntryCard({ entry, isExpanded, onToggle, getScoreColor, getScoreLabel }: JournalEntryCardProps) {
  const isProfitable = entry.pnl > 0
  const pnlColor = isProfitable ? 'text-green-400' : 'text-red-400'
  const scoreColor = getScoreColor(entry.aiScore)
  const scoreLabel = getScoreLabel(entry.aiScore)

  return (
    <div className="bg-gray-900/50 border border-gray-700 rounded-xl overflow-hidden transition-all hover:border-gray-600">
      {/* Main Entry Row */}
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-center gap-4 hover:bg-gray-800/50 transition-colors text-left"
      >
        {/* Symbol & Direction */}
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isProfitable ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
            {isProfitable ? <TrendingUp className="w-5 h-5 text-green-400" /> : <TrendingDown className="w-5 h-5 text-red-400" />}
          </div>
          <div>
            <div className="font-mono font-bold text-lg text-white">{entry.symbol}</div>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${entry.side === 'BUY' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                {entry.side}
              </span>
              <span className="px-2 py-0.5 rounded bg-gray-800 border border-gray-700 text-gray-300">{entry.timeframe}</span>
            </div>
          </div>
        </div>

        {/* Prices */}
        <div className="flex-1 hidden md:block grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-xs text-gray-400">Entry</div>
            <div className="font-mono text-white">{entry.entryPrice.toFixed(entry.symbol === 'XAUUSD' ? 2 : 5)}</div>
          </div>
          <div>
            <div className="text-xs text-gray-400">Exit</div>
            <div className="font-mono text-white">{entry.exitPrice.toFixed(entry.symbol === 'XAUUSD' ? 2 : 5)}</div>
          </div>
          <div>
            <div className="text-xs text-gray-400">Qty</div>
            <div className="font-mono text-white">{entry.quantity.toLocaleString()}</div>
          </div>
        </div>

        {/* P&L & Score */}
        <div className="text-right min-w-[180px]">
          <div className={`font-mono font-bold text-lg ${pnlColor}`}>
            {isProfitable ? '+' : ''}$${entry.pnl.toFixed(2)}
          </div>
          <div className="flex items-center justify-end gap-2 mt-1">
            <div className={`px-2 py-1 rounded text-xs font-medium ${scoreColor} bg-current/10 border border-current/20`}>
              {entry.aiScore !== null ? entry.aiScore : '—'}
            </div>
            <span className="text-xs text-gray-500">{scoreLabel}</span>
          </div>
        </div>

        {/* Date */}
        <div className="text-xs text-gray-500 hidden sm:block w-32 text-right">
          {format(new Date(entry.createdAt), 'MMM d, HH:mm')}
        </div>

        {/* Expand Chevron */}
        <div className="text-gray-500 flex-shrink-0">
          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </div>
      </button>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="border-t border-gray-700 p-4 bg-gray-950/50 animate-slide-down">
          {/* AI Critique */}
          <div className="mb-4">
            <div className="flex items-center gap-2 text-sm text-primary mb-2">
              <Brain className="w-4 h-4" />
              <span className="font-medium">AI Trade Critique (ICT/SMC Analysis)</span>
            </div>
            <div className="prose prose-invert max-w-none text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
              {entry.aiCritique}
            </div>
          </div>

          {/* Concepts */}
          {entry.concepts && entry.concepts.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center gap-2 text-sm text-gray-400 mb-2 uppercase tracking-wide">
                <Star className="w-4 h-4" />
                <span>ICT/SMC Concepts Identified</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {entry.concepts.map((concept, i) => (
                  <span key={i} className="px-3 py-1 bg-primary/10 border border-primary/20 rounded-full text-xs text-primary">
                    {concept}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Trade Details */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-700">
            <DetailItem label="Entry Price" value={entry.entryPrice.toFixed(entry.symbol === 'XAUUSD' ? 2 : 5)} />
            <DetailItem label="Exit Price" value={entry.exitPrice.toFixed(entry.symbol === 'XAUUSD' ? 2 : 5)} />
            <DetailItem label="Quantity" value={entry.quantity.toLocaleString()} />
            <DetailItem label="Timeframe" value={entry.timeframe} />
            <DetailItem label="P&L" value={`${isProfitable ? '+' : ''}$${entry.pnl.toFixed(2)}`} color={pnlColor} />
            <DetailItem label="AI Score" value={entry.aiScore !== null ? entry.aiScore.toString() : 'N/A'} color={scoreColor} />
            <DetailItem label="Date" value={format(new Date(entry.createdAt), 'MMM d, yyyy HH:mm')} />
            <DetailItem label="Trade ID" value={entry.tradeId.slice(0, 8)} />
          </div>
        </div>
      )}
    </div>
  )
}

interface DetailItemProps {
  label: string
  value: string
  color?: string
}

function DetailItem({ label, value, color }: DetailItemProps) {
  return (
    <div>
      <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">{label}</div>
      <div className="font-mono text-sm text-white" style={{ color: color || 'inherit' }}>{value}</div>
    </div>
  )
}