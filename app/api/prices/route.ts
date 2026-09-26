import { NextRequest, NextResponse } from 'next/server'
import { pollPrices } from '@/lib/oanda'

export const dynamic = 'force-dynamic'

// Supported instruments for forex and gold
const INSTRUMENTS = [
  'XAU_USD',  // Gold
  'EUR_USD',  // Euro/USD
  'GBP_USD',  // GBP/USD
  'USD_JPY',  // USD/JPY
  'USD_CHF',  // USD/CHF
  'AUD_USD',  // AUD/USD
  'USD_CAD',  // USD/CAD
  'NZD_USD',  // NZD/USD
  'BTC_USD',  // Bitcoin (if available on OANDA)
]

export async function GET() {
  try {
    const prices = await pollPrices(INSTRUMENTS)

    const priceData = Array.from(prices.entries()).map(([symbol, price]) => ({
      symbol: symbol.replace('_', ''),
      price,
      timestamp: new Date().toISOString(),
    }))

    return NextResponse.json({ prices: priceData })
  } catch (error) {
    console.error('Price polling error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch prices' },
      { status: 500 }
    )
  }
}