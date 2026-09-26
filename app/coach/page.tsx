import { CoachAlerts } from '@/components/CoachAlerts'
import Link from 'next/link'
import { ArrowLeft, Zap, Shield, Brain } from 'lucide-react'

export default function CoachPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/" className="p-2 rounded hover:bg-gray-800">
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Zap className="w-8 h-8 text-red-400" />
              Risk Coach
            </h1>
            <p className="text-gray-400">Behavioral pattern detection & risk management alerts</p>
          </div>
        </div>

        <div className="bg-gray-900/50 border border-gray-700 rounded-xl">
          <CoachAlerts />
        </div>

        {/* Detected Patterns Info */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Brain className="w-6 h-6 text-red-400" />
              <h3 className="text-lg font-medium">Revenge Trading</h3>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              Detects when larger positions are opened within 1 hour after consecutive losses. Critical severity alert.
            </p>
          </div>
          <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Brain className="w-6 h-6 text-yellow-400" />
              <h3 className="text-lg font-medium">Position Size Creep</h3>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              Warns when recent position sizes exceed 150% of historical average. Helps maintain consistent risk sizing.
            </p>
          </div>
          <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Brain className="w-6 h-6 text-orange-400" />
              <h3 className="text-lg font-medium">Overtrading</h3>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              Alerts when more than 15 trades are closed in 24 hours. Encourages quality over quantity.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}