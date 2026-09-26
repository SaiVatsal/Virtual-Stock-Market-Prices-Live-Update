'use client'

import { TradingViewChart } from '@/components/TradingViewChart'
import { Portfolio } from '@/components/Portfolio'
import { TradeForm } from '@/components/TradeForm'
import { SignalsFeed } from '@/components/SignalsFeed'
import { JournalView } from '@/components/JournalView'
import { CoachAlerts } from '@/components/CoachAlerts'
import { SuspenseWrapper } from '@/components/SuspenseWrapper'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Sun, Moon, TrendingUp, TrendingDown, Layout, List, Menu, Calendar, CheckCircle, Zap, Activity, Brain, AlertTriangle, DollarSign } from 'lucide-react'
import { useState, useEffect } from 'react'

export default function Dashboard() {
  const router = useRouter()
  const [darkMode, setDarkMode] = useState(false)
  const [activeSection, setActiveSection] = useState<'overview' | 'trading' | 'analysis' | 'coach'>('overview')

  useEffect(() => {
    // Check for saved preference
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('darkMode')
      if (saved !== null) {
        setDarkMode(saved === 'true')
      }
    }
  }, [])

  useEffect(() => {
    // Save preference and apply to document
    if (typeof window !== 'undefined') {
      localStorage.setItem('darkMode', String(darkMode))
      document.documentElement.classList.toggle('dark', darkMode)
    }
  }, [darkMode])

  const toggleDarkMode = () => setDarkMode(!darkMode)

  const sections = [
    { id: 'overview', label: 'Overview', icon: Layout, count: 4 },
    { id: 'trading', label: 'Trading', icon: DollarSign, count: 3 },
    { id: 'analysis', label: 'Analysis', icon: Activity, count: 3 },
    { id: 'coach', label: 'Risk Coach', icon: Zap, count: 2 },
  ]

  return (
    <div className="min-h-screen bg-gray-900 text-white transition-colors duration-200">
      {/* Mobile Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-gray-900/80 backdrop-blur-sm border-b border-gray-800 px-4 py-4 sm:hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/" className="text-xl font-bold">
              Virtual Trading
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={toggleDarkMode} className="p-2 rounded hover:bg-gray-800">
              {darkMode ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-gray-400" />}
            </button>
            <button onClick={() => setActiveSection('coach')} className="p-2 rounded hover:bg-gray-800">
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside className="w-64 bg-gray-900/80 backdrop-blur-sm border-r border-gray-800 flex flex-col px-4 pt-16 pb-8 sm:block hidden">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Link href="/" className="text-2xl font-bold">
                Virtual Trading
              </Link>
            </div>
            <button onClick={toggleDarkMode} className="p-2 rounded hover:bg-gray-800">
              {darkMode ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-gray-400" />}
            </button>
          </div>

          <nav className="space-y-2">
            {sections.map(section => (
              <Link
                key={section.id}
                href={`#${section.id}`}
                onClick={() => setActiveSection(section.id as any)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
                  activeSection === section.id
                    ? 'bg-primary text-primary-foreground shadow-lg'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <section.icon className="w-5 h-5" />
                <span className="text-sm font-medium">{section.label}</span>
                {section.count > 0 && (
                  <span className="ml-auto text-xs font-mono bg-gray-800 border border-gray-700 rounded px-2 py-0.5">
                    {section.count}
                  </span>
                )}
              </Link>
            ))}
          </nav>

          <div className="mt-auto border-t border-gray-800 pt-4">
            <p className="text-xs text-gray-500">
              Paper Trading • Virtual Funds
            </p>
            <p className="text-xs text-gray-500">
              Not Financial Advice
            </p>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-8 pt-16 sm:ml-64">
          {/* Desktop Header */}
          {!(
            typeof window !== 'undefined' && window.innerWidth < 640
          ) && (
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-3xl font-bold">
                Virtual Trading Dashboard
              </h1>
              <div className="flex items-center gap-4">
                <button onClick={toggleDarkMode} className="p-2 rounded hover:bg-gray-800">
                  {darkMode ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-gray-400" />}
                </button>
                <Link href="/portfolio" className="text-sm text-gray-400 hover:text-white">
                  Portfolio
                </Link>
                <Link href="/journal" className="text-sm text-gray-400 hover:text-white">
                  Journal
                </Link>
              </div>
            </div>
          )}

          {/* Dashboard Content */}
          <div className="space-y-8">
            {/* Overview Section */}
            <section id="overview" className="space-y-6">
              <h2 className="text-xl font-bold mb-4">Overview</h2>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-6">
                  <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-green-400" />
                    Portfolio Summary
                  </h3>
                  <Portfolio />
                </div>
                <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-6">
                  <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-blue-400" />
                    Recent Signals
                  </h3>
                  <div className="h-full">
                    <SuspenseWrapper fallback={<div className="h-full flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>}>
                    <SignalsFeed />
                  </SuspenseWrapper>
                  </div>
                </div>
                <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-6">
                  <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-400" />
                    Risk Alerts
                  </h3>
                  <div className="h-full">
                    <SuspenseWrapper fallback={<div className="h-full flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>}>
                      <CoachAlerts />
                    </SuspenseWrapper>
                  </div>
                </div>
              </div>
            </section>

            {/* Trading Section */}
            <section id="trading" className="space-y-6">
              <h2 className="text-xl font-bold mb-4">Trading</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-6">
                  <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-yellow-400" />
                    Trade Execution
                  </h3>
                  <SuspenseWrapper fallback={<div className="h-full flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>}>
                    <TradeForm />
                  </SuspenseWrapper>
                </div>
                <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-6">
                  <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                    <Layout className="w-4 h-4 text-purple-400" />
                    Live Charts
                  </h3>
                  <div className="h-full">
                    <TradingViewChart symbol="XAUUSD" interval="5" height={500} />
                  </div>
                </div>
              </div>
            </section>

            {/* Analysis Section */}
            <section id="analysis" className="space-y-6">
              <h2 className="text-xl font-bold mb-4">Analysis</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-6">
                  <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                    <List className="w-4 h-4 text-indigo-400" />
                    Trade Journal
                  </h3>
                  <SuspenseWrapper fallback={<div className="h-full flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>}>
                    <JournalView />
                  </SuspenseWrapper>
                </div>
                <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-6">
                  <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                    <Brain className="w-4 h-4 text-blue-400" />
                    AI Insights
                  </h3>
                  <div className="space-y-4">
                    <div className="text-sm text-gray-400 mb-2">
                      AI-powered trade analysis provides:
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-3 text-gray-300">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        <span>ICT/SMC concept detection</span>
                      </div>
                      <div className="flex items-center gap-3 text-gray-300">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        <span>Trade quality scoring (-100 to 100)</span>
                      </div>
                      <div className="flex items-center gap-3 text-gray-300">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        <span>Behavioral pattern recognition</span>
                      </div>
                      <div className="flex items-center gap-3 text-gray-300">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        <span>Risk management feedback</span>
                      </div>
                    </div>
                    <button
                      onClick={() => router.push('/journal')}
                      className="w-full py-3 bg-primary text-primary-foreground rounded-lg text-sm font-medium"
                    >
                      View Full Journal
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* Coach Section */}
            <section id="coach" className="space-y-6">
              <h2 className="text-xl font-bold mb-4">Risk Coach</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-6">
                  <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-red-400" />
                    Behavioral Alerts
                  </h3>
                  <SuspenseWrapper fallback={<div className="h-full flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>}>
                    <CoachAlerts />
                  </SuspenseWrapper>
                </div>
                <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-6">
                  <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-orange-400" />
                    Market Context
                  </h3>
                  <div className="space-y-4">
                    <div className="text-sm text-gray-400 mb-2">
                      Stay informed about market-moving events:
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-3 text-gray-300">
                        <AlertTriangle className="w-4 h-4 text-yellow-400" />
                        <span>High-impact economic events</span>
                      </div>
                      <div className="flex items-center gap-3 text-gray-300">
                        <AlertTriangle className="w-4 h-4 text-yellow-400" />
                        <span>Central bank decisions</span>
                      </div>
                      <div className="flex items-center gap-3 text-gray-300">
                        <AlertTriangle className="w-4 h-4 text-yellow-400" />
                        <span>Geopolitical developments</span>
                      </div>
                    </div>
                    <button
                      onClick={() => router.push('/macro')}
                      className="w-full py-3 bg-primary text-primary-foreground rounded-lg text-sm font-medium"
                    >
                      View Macro Briefing
                    </button>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  )
}