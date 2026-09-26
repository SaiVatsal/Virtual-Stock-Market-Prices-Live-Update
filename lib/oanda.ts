// OANDA v20 REST API Client for paper trading
import { PrismaClient } from '@prisma/client'

// Lazy PrismaClient initialization to avoid build-time issues on Vercel
let prisma: PrismaClient | null = null

function getPrisma(): PrismaClient {
  if (!prisma) {
    prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    })
  }
  return prisma
}

interface OandaConfig {
  apiKey: string
  accountId: string
  environment: 'practice' | 'live'
}

interface OandaPrice {
  instrument: string
  time: string
  bid: number
  ask: number
  spread: number
}

interface OandaCandle {
  time: string
  mid: {
    o: string
    h: string
    l: string
    c: string
  }
  volume: number
  complete: boolean
}

export class OandaClient {
  private config: OandaConfig
  private baseUrl: string

  constructor(config: OandaConfig) {
    this.config = config
    this.baseUrl = config.environment === 'live'
      ? 'https://api-fxtrade.oanda.com'
      : 'https://api-fxpractice.oanda.com'
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`OANDA API Error: ${response.status} - ${error}`)
    }

    return response.json()
  }

  // Get current price for an instrument
  async getPrice(instrument: string): Promise<OandaPrice> {
    const data = await this.request<{ prices: OandaPrice[] }>(
      `/v3/accounts/${this.config.accountId}/pricing?instruments=${instrument}`
    )
    return data.prices[0]
  }

  // Get multiple prices at once
  async getPrices(instruments: string[]): Promise<OandaPrice[]> {
    const data = await this.request<{ prices: OandaPrice[] }>(
      `/v3/accounts/${this.config.accountId}/pricing?instruments=${instruments.join(',')}`
    )
    return data.prices
  }

  // Get historical candles
  async getCandles(
    instrument: string,
    granularity: string = 'M5',
    count: number = 100
  ): Promise<OandaCandle[]> {
    const data = await this.request<{ candles: OandaCandle[] }>(
      `/v3/instruments/${instrument}/candles?granularity=${granularity}&count=${count}&price=M`
    )
    return data.candles.filter(c => c.complete)
  }

  // Get account info (for balance, margin, etc.)
  async getAccount() {
    return this.request<{ account: any }>(
      `/v3/accounts/${this.config.accountId}`
    )
  }

  // Get open positions
  async getPositions() {
    return this.request<{ positions: any[] }>(
      `/v3/accounts/${this.config.accountId}/openPositions`
    )
  }

  // Get trade history
  async getTrades() {
    return this.request<{ trades: any[] }>(
      `/v3/accounts/${this.config.accountId}/trades`
    )
  }
}

// Singleton instance
let oandaClient: OandaClient | null = null

export function getOandaClient(): OandaClient {
  if (!oandaClient) {
    oandaClient = new OandaClient({
      apiKey: process.env.OANDA_API_KEY!,
      accountId: process.env.OANDA_ACCOUNT_ID!,
      environment: (process.env.OANDA_ENVIRONMENT as 'practice' | 'live') || 'practice',
    })
  }
  return oandaClient
}

// Price polling service for Vercel-compatible realtime
export async function pollPrices(instruments: string[]): Promise<Map<string, number>> {
  const client = getOandaClient()
  const prices = await client.getPrices(instruments)

  const priceMap = new Map<string, number>()
  for (const price of prices) {
    // Use mid price (average of bid/ask)
    const midPrice = (price.bid + price.ask) / 2
    priceMap.set(price.instrument, midPrice)

    // Store in database for history
    const p = getPrisma()
    await p.priceHistory.upsert({
      where: {
        symbol_timestamp: {
          symbol: price.instrument,
          timestamp: new Date(price.time),
        },
      },
      update: {
        close: midPrice,
        high: Math.max(midPrice, price.ask),
        low: Math.min(midPrice, price.bid),
      },
      create: {
        symbol: price.instrument,
        timestamp: new Date(price.time),
        open: midPrice,
        high: Math.max(midPrice, price.ask),
        low: Math.min(midPrice, price.bid),
        close: midPrice,
      },
    })
  }

  return priceMap
}

// Fallback using Twelve Data
export async function getTwelveDataPrice(symbol: string): Promise<number | null> {
  if (!process.env.TWELVE_DATA_API_KEY) return null

  try {
    const response = await fetch(
      `https://api.twelvedata.com/price?symbol=${symbol}&apikey=${process.env.TWELVE_DATA_API_KEY}`
    )
    const data = await response.json()
    return data.price ? parseFloat(data.price) : null
  } catch {
    return null
  }
}