'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { Calendar, AlertTriangle, TrendingUp, Target, Shield, Info, ChevronLeft, ChevronRight, RefreshCw, Brain } from 'lucide-react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

interface MacroEvent {
  time: string
  currency: string
  event: string
  impact: 'high' | 'medium' | 'low'
  forecast?: string
  previous?: string
}

interface MacroBriefing {
  briefing: string
  events: MacroEvent[]
  date: string
  cached: boolean
}

export default function MacroPage() {
  const [briefing, setBriefing] = useState<MacroBriefing | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0])
  const [refreshing, setRefreshing] = useState(false)

  const fetchBriefing = async (date: string) => {
    try {
      setLoading(true)
      const res = await fetch(`/api/macro?date=${date}`)
      if (res.ok) {
        const data = await res.json()
        setBriefing(data)
      } else {
        throw new Error('Failed to fetch briefing')
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const refreshBriefing = async () => {
    try {
      setRefreshing(true)
      const res = await fetch(`/api/macro?date=${selectedDate}&refresh=true`)
      if (res.ok) {
        const data = await res.json()
        setBriefing(data)
      } else {
        throw new Error('Failed to refresh briefing')
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setRefreshing(false)
    }
  }

  const changeDate = (days: number) => {
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() + days)
    const dateStr = newDate.toISOString().split('T')[0]
    setSelectedDate(dateStr)
    fetchBriefing(dateStr)
  }

  useEffect(() => {
    fetchBriefing(selectedDate)
  }, [selectedDate])

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-red-400 bg-red-500/10 border-red-500/20'
      case 'medium': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20'
      case 'low': return 'text-green-400 bg-green-500/10 border-green-500/20'
      default: return 'text-gray-400 bg-gray-500/10 border-gray-500/20'
    }
  }

  const getImpactIcon = (impact: string) => {
    switch (impact) {
      case 'high': return AlertTriangle
      case 'medium': return Target
      case 'low': return Info
      default: return Info
    }
  }

  if (loading && !briefing) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8 flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-primary animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/" className="p-2 rounded hover:bg-gray-800">
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Macro Briefing</h1>
            <p className="text-gray-400">Pre-session volatility briefing for forex, gold & crypto</p>
          </div>
        </div>

        {/* Date Selector */}
        <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => changeDate(-1)}
              className="p-2 rounded hover:bg-gray-800 text-gray-400 hover:text-white"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-4">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  const newDate = e.target.value
                  setSelectedDate(newDate)
                  fetchBriefing(newDate)
                }}
                className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <span className="text-sm text-gray-400">
                {briefing?.cached ? (
                  <span className="flex items-center gap-1 text-green-400">
                    <Shield className="w-3 h-3" />
                    Cached
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-blue-400">
                    <Brain className="w-3 h-3" />
                    Fresh
                  </span>
                )}
              </span>
            </div>
            <button
              onClick={() => changeDate(1)}
              disabled={selectedDate >= new Date().toISOString().split('T')[0]}
              className="p-2 rounded hover:bg-gray-800 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Briefing Content */}
        {briefing && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* AI Briefing */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <Brain className="w-5 h-5 text-blue-400" />
                    AI-Generated Briefing
                  </h2>
                  <button
                    onClick={refreshBriefing}
                    disabled={refreshing}
                    className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-xs text-gray-400 hover:text-white hover:border-gray-600 transition-colors"
                  >
                    <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                    Refresh
                  </button>
                </div>
                <div className="prose prose-invert max-w-none text-gray-300 leading-relaxed whitespace-pre-wrap">
                  {briefing.briefing}
                </div>
                <div className="mt-4 pt-4 border-t border-gray-700 text-xs text-gray-500">
                  Generated for {format(new Date(briefing.date), 'EEEE, MMMM d, yyyy')} •
                  {briefing.cached ? 'Cached version' : 'Freshly generated'}
                </div>
              </div>

              {/* Key Levels */}
              <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-6">
                <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                  <Target className="w-4 h-4 text-yellow-400" />
                  Key Levels to Watch
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { symbol: 'XAUUSD', label: 'Gold', level: '2050 / 2000' },
                    { symbol: 'EURUSD', label: 'EUR/USD', level: '1.0850 / 1.0750' },
                    { symbol: 'GBPUSD', label: 'GBP/USD', level: '1.2650 / 1.2550' },
                    { symbol: 'USDJPY', label: 'USD/JPY', level: '151.50 / 150.00' },
                  ].map(item => (
                    <div key={item.symbol} className="bg-gray-900 border border-gray-700 rounded-lg p-3">
                      <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{item.label}</p>
                      <p className="font-mono text-sm text-white">{item.level}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Economic Calendar */}
            <div className="space-y-6">
              <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-6">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-orange-400" />
                  Economic Calendar
                </h2>
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {briefing.events.map((event, index) => {
                    const ImpactIcon = getImpactIcon(event.impact)
                    const impactColor = getImpactColor(event.impact)

                    return (
                      <div key={index} className="bg-gray-900 border border-gray-700 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${impactColor}`}>
                            <ImpactIcon className="w-4 h-4" style={{ color: impactColor.split(' ')[0].replace('text-', '') }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-mono text-sm text-white">{event.time} UTC</span>
                              <span className="px-2 py-0.5 text-xs font-medium rounded border capitalize bg-gray-800 border-gray-700">
                                {event.currency}
                              </span>
                              <span className={`px-2 py-0.5 text-xs font-medium rounded border ${impactColor}`}>
                                {event.impact.toUpperCase()}
                              </span>
                            </div>
                            <p className="text-sm text-gray-300 font-medium">{event.event}</p>
                            {(event.forecast || event.previous) && (
                              <div className="flex gap-4 mt-2 text-xs text-gray-500">
                                {event.forecast && <span>Forecast: <span className="text-gray-300">{event.forecast}</span></span>}
                                {event.previous && <span>Previous: <span className="text-gray-300">{event.previous}</span></span>}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Trading Recommendations */}
              <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-6">
                <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-green-400" />
                  Paper Trader Guidelines
                </h3>
                <div className="space-y-2 text-sm text-gray-300">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-green-400 flex-shrink-0" />
                    <span>Reduce position size 30 min before/after high-impact events</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-green-400 flex-shrink-0" />
                    <span>Avoid opening new positions during NFP, CPI, FOMC</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-green-400 flex-shrink-0" />
                    <span>Use wider stops during high volatility windows</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-green-400 flex-shrink-0" />
                    <span>Consider waiting for post-event price discovery</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-green-400 flex-shrink-0" />
                    <span>Review journal entries for news-related trades</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="text-center p-8 text-red-400">
            <AlertTriangle className="w-12 h-12 mx-auto mb-4" />
            <p className="text-lg">Failed to load briefing</p>
            <p className="text-sm text-gray-500 mt-1">{error}</p>
            <button onClick={() => fetchBriefing(selectedDate)} className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm">
              Retry
            </button>
          </div>
        )}
      </div>
    </div>
  )
}