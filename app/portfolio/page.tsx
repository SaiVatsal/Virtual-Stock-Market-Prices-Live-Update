import { Portfolio } from '@/components/Portfolio'
import Link from 'next/link'
import { ArrowLeft, DollarSign } from 'lucide-react'

export default function PortfolioPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/" className="p-2 rounded hover:bg-gray-800">
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <DollarSign className="w-8 h-8 text-yellow-400" />
              Portfolio
            </h1>
            <p className="text-gray-400">Track your positions, P&L, and trade history</p>
          </div>
        </div>

        <div className="bg-gray-900/50 border border-gray-700 rounded-xl">
          <Portfolio />
        </div>
      </div>
    </div>
  )
}