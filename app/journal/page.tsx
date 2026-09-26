import { JournalView } from '@/components/JournalView'
import Link from 'next/link'
import { ArrowLeft, FileText, Brain } from 'lucide-react'

export default function JournalPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/" className="p-2 rounded hover:bg-gray-800">
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Trade Journal</h1>
            <p className="text-gray-400">AI-analyzed trade history with ICT/SMC insights</p>
          </div>
        </div>

        <div className="bg-gray-900/50 border border-gray-700 rounded-xl">
          <JournalView />
        </div>

        {/* Features Info */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Brain className="w-6 h-6 text-blue-400" />
              <h3 className="text-lg font-medium">AI Critique</h3>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              Each completed trade receives a structured ICT/SMC critique covering entry quality, exit quality, risk management, and concept alignment.
            </p>
          </div>
          <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <FileText className="w-6 h-6 text-green-400" />
              <h3 className="text-lg font-medium">Quality Score</h3>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              Trades scored from -100 to 100 based on ICT/SMC adherence, risk management, and execution quality. Track improvement over time.
            </p>
          </div>
          <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Brain className="w-6 h-6 text-purple-400" />
              <h3 className="text-lg font-medium">Concept Detection</h3>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              Automatic identification of order blocks, fair value gaps, structure shifts, liquidity sweeps, and premium/discount zones.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}