export type TradeSide = 'BUY' | 'SELL'
export type TradeStatus = 'OPEN' | 'CLOSED' | 'CANCELLED'
export type SignalDirection = 'LONG' | 'SHORT'
export type SignalStatus = 'PENDING' | 'TRIGGERED' | 'EXPIRED' | 'CANCELLED'
export type CoachAlertType =
  | 'POSITION_SIZE_CREEP'
  | 'REVENGE_TRADING'
  | 'OVERTRADING'
  | 'NEWS_TRADING'
  | 'RISK_LIMIT_BREACH'
  | 'PATTERN_DETECTED'
export type AlertSeverity = 'INFO' | 'WARNING' | 'CRITICAL'

export interface User {
  id: string
  email: string
  name: string | null
  balance: number
  createdAt: Date
  updatedAt: Date
}

export interface Position {
  id: string
  userId: string
  symbol: string
  quantity: number
  averagePrice: number
  currentPrice: number | null
  unrealizedPnL: number
  createdAt: Date
  updatedAt: Date
}

export interface Trade {
  id: string
  userId: string
  symbol: string
  side: TradeSide
  quantity: number
  price: number
  pnl: number
  status: TradeStatus
  openedAt: Date
  closedAt: Date | null
}

export interface Signal {
  id: string
  userId: string
  symbol: string
  direction: SignalDirection
  timeframe: string
  entryPrice: number
  stopLoss: number | null
  takeProfit: number | null
  status: SignalStatus
  source: string
  metadata: any
  receivedAt: Date
  triggeredAt: Date | null
}

export interface JournalEntry {
  id: string
  userId: string
  tradeId: string
  symbol: string
  side: TradeSide
  entryPrice: number
  exitPrice: number
  quantity: number
  pnl: number
  timeframe: string
  aiCritique: string
  aiScore: number | null
  concepts: string[]
  createdAt: Date
}

export interface CoachAlert {
  id: string
  userId: string
  type: CoachAlertType
  severity: AlertSeverity
  message: string
  data: any
  acknowledged: boolean
  createdAt: Date
}

export interface PriceData {
  symbol: string
  price: number
  bid: number
    ask: number
  timestamp: Date
  change24h: number
  changePercent24h: number
}

export interface Candle {
  time: Date
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export interface MacroEvent {
  time: string
  currency: string
  event: string
  impact: 'high' | 'medium' | 'low'
  forecast?: string
  previous?: string
}