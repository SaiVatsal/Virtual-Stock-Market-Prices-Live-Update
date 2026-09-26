'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { TrendingUp, TrendingDown, Minus, DollarSign, ArrowUpRight, ArrowDownRight, RefreshCw, AlertTriangle } from 'lucide-react'

interface Position {
  id: string
  symbol: string
  quantity: number
  averagePrice: number
  currentPrice: number | null
  unrealizedPnL: number
  createdAt: string
  updatedAt: string
}

interface PortfolioData {
  balance: number
  equity: number
  unrealizedPnL: number
  realizedPnL: number
  positions: Position[]
  totalPositions: number
}

interface Trade {
  id: string
  symbol: string
  side: 'BUY' | 'SELL'
  quantity: number
  price: number
  pnl: number | null
  status: string
  openedAt: string
  closedAt: string | null
}

export function Portfolio() {
  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null)
  const [trades, setTrades] = useState<Trade[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'positions' | 'history' | 'analytics'>('positions')
  const [refreshing, setRefreshing] = useState(false)

  const fetchPortfolio = async () => {
    try {
      const res = await fetch('/api/portfolio')
      if (res.ok) {
        const data = await res.json()
        setPortfolio(data)
      }
    } catch (error) {
      console.error('Failed to fetch portfolio:', error)
    }
  }

  const fetchTrades = async () => {
    try {
      const res = await fetch('/api/trades')
      if (res.ok) {
        const data = await res.json()
        setTrades(data.trades || [])
      }
    } catch (error) {
      console.error('Failed to fetch trades:', error)
    }
  }

  const refresh = async () => {
    setRefreshing(true)
    await Promise.all([fetchPortfolio(), fetchTrades()])
    setRefreshing(false)
  }

  const handleReset = async () => {
    if (!confirm('Reset portfolio to $100,000 and close all positions?')) return
    try {
      const res = await fetch('/api/portfolio', { method: 'POST' })
      if (res.ok) {
        await refresh()
      }
    } catch (error) {
      console.error('Failed to reset portfolio:', error)
    }
  }

  useEffect(() => {
    refresh()
    // Auto-refresh every 10 seconds
    const interval = setInterval(refresh, 10000)
    return () => clearInterval(interval)
  }, [])

  if (loading && !portfolio) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 text-primary animate-spin" />
      </div>
    )
  }

  const totalPnL = (portfolio?.unrealizedPnL || 0) + (portfolio?.realizedPnL || 0)
  const totalPnLPercent = portfolio?.equity ? ((totalPnL / (portfolio.equity - totalPnL)) * 100) : 0

  return (
    <div className="space-y-6">
      {/* Header with Account Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-900/50 rounded-xl border border-gray-700 p-6">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Cash Balance</p>
          <p className="text-3xl font-mono font-bold text-white">${portfolio?.balance?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}</p>
        </div>
        <div className="bg-gray-900/50 rounded-xl border border-gray-700 p-6">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Total Equity</p>
          <p className="text-3xl font-mono font-bold text-white">${portfolio?.equity?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}</p>
        </div>
        <div className="bg-gray-900/50 rounded-xl border border-gray-700 p-6">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Unrealized P&L</p>
          <p className={`text-3xl font-mono font-bold ${(portfolio?.unrealizedPnL || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {(portfolio?.unrealizedPnL || 0) >= 0 ? '+' : ''}${portfolio?.unrealizedPnL?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
          </p>
        </div>
        <div className="bg-gray-900/50 rounded-xl border border-gray-700 p-6">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Total P&L</p>
          <p className={`text-3xl font-mono font-bold ${totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {totalPnL >= 0 ? '+' : ''}${totalPnL.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            <span className="text-lg ml-2 opacity-70">({totalPnLPercent >= 0 ? '+' : ''}{totalPnLPercent.toFixed(2)}%)</span>
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 bg-gray-900/50 rounded-lg border border-gray-700 p-1">
        {[
          { id: 'positions', label: 'Positions', icon: DollarSign },
          { id: 'history', label: 'Trade History', icon: ArrowUpRight },
          { id: 'analytics', label: 'Analytics', icon: TrendingUp },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-primary text-primary-foreground shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
        <div className="flex-1" />
        <button
          onClick={refresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Tab Content */}
      <div className="bg-gray-900/50 rounded-xl border border-gray-700 overflow-hidden">
        {activeTab === 'positions' && (
          <PositionsTab positions={portfolio?.positions || []} onRefresh={refresh} />
        )}
        {activeTab === 'history' && (
          <HistoryTab trades={trades} />
        )}
        {activeTab === 'analytics' && (
          <AnalyticsTab trades={trades} portfolio={portfolio} />
        )}
      </div>

      {/* Reset Button */}
      <button
        onClick={handleReset}
        className="w-full py-3 bg-gray-800 border border-gray-700 rounded-lg text-gray-400 hover:text-red-400 hover:border-red-500 transition-colors flex items-center justify-center gap-2"
      >
        <AlertTriangle className="w-4 h-4" />
        Reset Portfolio to $100,000 (Demo)
      </button>
    </div>
  )
}

function PositionsTab({ positions, onRefresh }: { positions: Position[]; onRefresh: () => void }) {
  if (positions.length === 0) {
    return (
      <div className="p-12 text-center">
        <DollarSign className="w-16 h-16 text-gray-600 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-300 mb-2">No Open Positions</h3>
        <p className="text-gray-500 mb-6">Start trading to see your positions here</p>
        <button
          onClick={onRefresh}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium"
        >
          Refresh Prices
        </button>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-700">
            <th className="text-left p-4 text-xs font-medium text-gray-400 uppercase tracking-wide">Symbol</th>
            <th className="text-right p-4 text-xs font-medium text-gray-400 uppercase tracking-wide">Qty</th>
            <th className="text-right p-4 text-xs font-medium text-gray-400 uppercase tracking-wide">Avg Price</th>
            <th className="text-right p-4 text-xs font-medium text-gray-400 uppercase tracking-wide">Current</th>
            <th className="text-right p-4 text-xs font-medium text-gray-400 uppercase tracking-wide">Value</th>
            <th className="text-right p-4 text-xs font-medium text-gray-400 uppercase tracking-wide">Unrealized P&L</th>
            <th className="text-right p-4 text-xs font-medium text-gray-400 uppercase tracking-wide">P&L %</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-800">
          {positions.map((position) => {
            const currentPrice = position.currentPrice || position.averagePrice
            const value = currentPrice * position.quantity
            const pnl = position.unrealizedPnL
            const pnlPercent = position.averagePrice ? ((currentPrice - position.averagePrice) / position.averagePrice) * 100 : 0
            const isPositive = pnl >= 0

            return (
              <tr key={position.id} className="hover:bg-gray-800/50 transition-colors">
                <td className="p-4">
                  <div className="font-mono font-medium text-white">{position.symbol}</div>
                  <div className="text-xs text-gray-500">{format(new Date(position.createdAt), 'MMM d, HH:mm')}</div>
                </td>
                <td className="p-4 text-right font-mono text-white">{position.quantity.toLocaleString()}</td>
                <td className="p-4 text-right font-mono text-gray-300">{position.averagePrice.toFixed(position.symbol === 'XAUUSD' ? 2 : 5)}</td>
                <td className="p-4 text-right font-mono text-white">{currentPrice.toFixed(position.symbol === 'XAUUSD' ? 2 : 5)}</td>
                <td className="p-4 text-right font-mono text-white">${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td className="p-4 text-right font-mono font-semibold text-green-400">
                  {isPositive ? '+' : ''}${pnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td className="p-4 text-right font-mono text-sm">
                  <span className={isPositive ? 'text-green-400' : 'text-red-400'}>
                    {isPositive ? '+' : ''}{pnlPercent.toFixed(2)}%
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function HistoryTab({ trades }: { trades: Trade[] }) {
  if (trades.length === 0) {
    return (
      <div className="p-12 text-center">
        <TrendingUp className="w-16 h-16 text-gray-600 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-300 mb-2">No Trade History</h3>
        <p className="text-gray-500">Your completed trades will appear here</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-700">
            <th className="text-left p-4 text-xs font-medium text-gray-400 uppercase tracking-wide">Time</th>
            <th className="text-left p-4 text-xs font-medium text-gray-400 uppercase tracking-wide">Symbol</th>
            <th className="text-center p-4 text-xs font-medium text-gray-400 uppercase tracking-wide">Side</th>
            <th className="text-right p-4 text-xs font-medium text-gray-400 uppercase tracking-wide">Qty</th>
            <th className="text-right p-4 text-xs font-medium text-gray-400 uppercase tracking-wide">Price</th>
            <th className="text-right p-4 text-xs font-medium text-gray-400 uppercase tracking-wide">P&L</th>
            <th className="text-left p-4 text-xs font-medium text-gray-400 uppercase tracking-wide">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-800">
          {trades.map((trade) => {
            const isBuy = trade.side === 'BUY'
            const isClosed = trade.status === 'CLOSED'
            const pnl = trade.pnl || 0
            const isPositive = pnl >= 0

            return (
              <tr key={trade.id} className="hover:bg-gray-800/50 transition-colors">
                <td className="p-4 text-sm text-gray-300">
                  {format(new Date(trade.openedAt), 'MMM d, HH:mm:ss')}
                </td>
                <td className="p-4 font-mono font-medium text-white">{trade.symbol}</td>
                <td className="p-4 text-center">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${isBuy ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                    {isBuy ? 'LONG' : 'SHORT'}
                  </span>
                </td>
                <td className="p-4 text-right font-mono text-white">{trade.quantity.toLocaleString()}</td>
                <td className="p-4 text-right font-mono text-gray-300">{trade.price.toFixed(trade.symbol === 'XAUUSD' ? 2 : 5)}</td>
                <td className="p-4 text-right font-mono font-semibold">
                  {isClosed ? (
                    <span className={isPositive ? 'text-green-400' : 'text-red-400'}>
                      {isPositive ? '+' : ''}${pnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  ) : (
                    <span className="text-gray-500">—</span>
                  )}
                </td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    trade.status === 'OPEN' ? 'bg-yellow-500/20 text-yellow-400' :
                    trade.status === 'CLOSED' ? 'bg-green-500/20 text-green-400' :
                    'bg-gray-500/20 text-gray-400'
                  }`}>
                    {trade.status}
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function AnalyticsTab({ trades, portfolio }: { trades: Trade[]; portfolio: PortfolioData | null }) {
  const closedTrades = trades.filter(t => t.status === 'CLOSED' && t.pnl !== null)
  const winningTrades = closedTrades.filter(t => (t.pnl || 0) > 0)
  const losingTrades = closedTrades.filter(t => (t.pnl || 0) < 0)

  const winRate = closedTrades.length > 0 ? (winningTrades.length / closedTrades.length) * 100 : 0
  const totalWins = winningTrades.reduce((sum, t) => sum + (t.pnl || 0), 0)
  const totalLosses = losingTrades.reduce((sum, t) => sum + (t.pnl || 0), 0)
  const profitFactor = totalLosses !== 0 ? Math.abs(totalWins / totalLosses) : 0
  const avgWin = winningTrades.length > 0 ? totalWins / winningTrades.length : 0
  const avgLoss = losingTrades.length > 0 ? totalLosses / losingTrades.length : 0
  const riskReward = avgLoss !== 0 ? Math.abs(avgWin / avgLoss) : 0

  const stats = [
    { label: 'Total Trades', value: closedTrades.length.toString(), icon: TrendingUp },
    { label: 'Win Rate', value: `${winRate.toFixed(1)}%`, icon: winRate >= 50 ? TrendingUp : TrendingDown, color: winRate >= 50 ? 'text-green-400' : 'text-red-400' },
    { label: 'Profit Factor', value: profitFactor.toFixed(2), icon: profitFactor >= 1 ? TrendingUp : TrendingDown, color: profitFactor >= 1 ? 'text-green-400' : 'text-red-400' },
    { label: 'Risk:Reward', value: riskReward.toFixed(2), icon: riskReward >= 1 ? TrendingUp : TrendingDown, color: riskReward >= 1 ? 'text-green-400' : 'text-red-400' },
    { label: 'Avg Win', value: `$${avgWin.toFixed(2)}`, icon: TrendingUp, color: 'text-green-400' },
    { label: 'Avg Loss', value: `$${avgLoss.toFixed(2)}`, icon: TrendingDown, color: 'text-red-400' },
    { label: 'Gross Profit', value: `$${totalWins.toFixed(2)}`, icon: TrendingUp, color: 'text-green-400' },
    { label: 'Gross Loss', value: `$${Math.abs(totalLosses).toFixed(2)}`, icon: TrendingDown, color: 'text-red-400' },
  ]

  return (
    <div className="p-6 space-y-6">
      <h3 className="text-lg font-medium text-white">Performance Analytics</h3>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="bg-gray-800/50 rounded-lg border border-gray-700 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-400 uppercase tracking-wide">{stat.label}</span>
              <stat.icon className={`w-4 h-4 ${stat.color || 'text-gray-400'}`} />
            </div>
            <p className="text-2xl font-mono font-bold text-white">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Symbol breakdown */}
      {closedTrades.length > 0 && (
        <>
          <div>
            <h4 className="text-sm font-medium text-gray-400 mb-4 uppercase tracking-wide">By Symbol</h4>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left p-3 text-xs font-medium text-gray-400 uppercase tracking-wide">Symbol</th>
                    <th className="text-center p-3 text-xs font-medium text-gray-400 uppercase tracking-wide">Trades</th>
                    <th className="text-center p-3 text-xs font-medium text-gray-400 uppercase tracking-wide">Win Rate</th>
                    <th className="text-right p-3 text-xs font-medium text-gray-400 uppercase tracking-wide">Net P&L</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {Object.entries(closedTrades.reduce((acc, trade) => {
                    if (!acc[trade.symbol]) {
                      acc[trade.symbol] = { trades: 0, wins: 0, losses: 0, totalPnL: 0 }
                    }
                    acc[trade.symbol].trades++
                    if ((trade.pnl || 0) > 0) acc[trade.symbol].wins++
                    else acc[trade.symbol].losses++
                    acc[trade.symbol].totalPnL += trade.pnl || 0
                    return acc
                  }, {} as Record<string, { trades: number; wins: number; losses: number; totalPnL: number }>))
                    .sort(([, a], [, b]) => b.totalPnL - a.totalPnL)
                    .map(([symbol, stats]) => (
                      <tr key={symbol} className="hover:bg-gray-800/50">
                        <td className="p-3 font-mono text-white">{symbol}</td>
                        <td className="p-3 text-center text-gray-300">{stats.trades}</td>
                        <td className="p-3 text-center">
                          <span className={stats.wins / stats.trades >= 0.5 ? 'text-green-400' : 'text-red-400'}>
                            {((stats.wins / stats.trades) * 100).toFixed(1)}%
                          </span>
                        </td>
                        <td className="p-3 text-right font-mono">
                          <span className={stats.totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}>
                            {stats.totalPnL >= 0 ? '+' : ''}$${stats.totalPnL.toFixed(2)}
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {closedTrades.length === 0 && (
        <div className="text-center text-gray-500 py-12">
          Complete some trades to see analytics
        </div>
      )}
    </div>
  )
}