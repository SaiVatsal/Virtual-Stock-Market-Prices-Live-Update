import Anthropic from '@anthropic-ai/sdk'
import { prisma } from './prisma'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

interface TradeContext {
  symbol: string
  side: 'BUY' | 'SELL'
  entryPrice: number
  exitPrice: number
  quantity: number
  pnl: number
  timeframe: string
  durationMinutes: number
  marketStructure: string // e.g., "uptrend", "downtrend", "ranging"
  keyLevels: string[] // support/resistance, order blocks, FVG
}

interface SignalContext {
  symbol: string
  direction: 'LONG' | 'SHORT'
  timeframe: string
  entryPrice: number
  stopLoss?: number
  takeProfit?: number
  signalType: string // e.g., "order_block", "fvg", "structure_shift", "liquidity_sweep"
  historicalWinRate: number
  totalSignals: number
}

interface MacroContext {
  date: string
  events: Array<{
    time: string
    currency: string
    event: string
    impact: 'high' | 'medium' | 'low'
    forecast?: string
    previous?: string
  }>
}

export async function generateTradeJournalCritique(context: TradeContext): Promise<{
  critique: string
  score: number
  concepts: string[]
}> {
  const prompt = `You are an expert ICT/SMC trading coach. Analyze this completed trade and provide a structured critique.

Trade Details:
- Symbol: ${context.symbol}
- Direction: ${context.side}
- Entry: ${context.entryPrice}
- Exit: ${context.exitPrice}
- Quantity: ${context.quantity}
- P&L: ${context.pnl}
- Timeframe: ${context.timeframe}
- Duration: ${context.durationMinutes} minutes
- Market Structure: ${context.marketStructure}
- Key Levels: ${context.keyLevels.join(', ')}

Analyze using ICT/SMC concepts:
1. Liquidity Sweeps - Did price sweep liquidity before the move?
2. Order Blocks - Was entry at a valid order block?
3. Fair Value Gaps (FVG) - Was there an FVG involved?
4. Structure Shift (BOS/CHOCH) - Was there a break of structure?
5. Premium/Discount - Was entry in premium or discount?
6. Risk Management - Was R:R appropriate? Position sizing?

Return JSON with:
{
  "critique": "Detailed structured critique covering entry quality, exit quality, risk management, and ICT/SMC concept alignment",
  "score": -100 to 100 (positive for good trades, negative for poor trades),
  "concepts": ["array", "of", "identified", "concepts"]
}`

  const response = await anthropic.messages.create({
    model: 'claude-3-haiku-20240307',
    max_tokens: 1500,
    temperature: 0.3,
    system: 'You are an expert ICT/SMC trading coach. Provide structured, actionable critiques. Return only valid JSON.',
    messages: [{ role: 'user', content: prompt }],
  })

  const content = response.content[0].type === 'text' ? response.content[0].text : '{}'
  return JSON.parse(content)
}

export async function generateSignalConfidenceNote(context: SignalContext): Promise<string> {
  const prompt = `You are a trading signal analyst. A ${context.signalType} signal was detected for ${context.symbol} ${context.direction} on ${context.timeframe} timeframe.

Signal Details:
- Entry: ${context.entryPrice}
- Stop Loss: ${context.stopLoss || 'Not set'}
- Take Profit: ${context.takeProfit || 'Not set'}
- Historical Win Rate: ${(context.historicalWinRate * 100).toFixed(1)}% (${context.totalSignals} signals)

Provide a concise (2-3 sentences) contextual note explaining:
1. What this signal type typically means in current market context
2. The reliability based on historical data
3. One key risk factor to watch

Do not give buy/sell recommendations. Be objective and educational.`

  const response = await anthropic.messages.create({
    model: 'claude-3-haiku-20240307',
    max_tokens: 300,
    temperature: 0.3,
    system: 'You are an objective signal analyst. Provide educational context only, never trading advice.',
    messages: [{ role: 'user', content: prompt }],
  })

  return response.content[0].type === 'text' ? response.content[0].text : ''
}

export async function generateMacroBriefing(context: MacroContext): Promise<string> {
  const highImpactEvents = context.events.filter(e => e.impact === 'high')

  const prompt = `Generate a pre-session macro volatility briefing for ${context.date}.

High-Impact Economic Events:
${highImpactEvents.map(e => `- ${e.time} ${e.currency}: ${e.event} (Forecast: ${e.forecast || 'N/A'}, Previous: ${e.previous || 'N/A'})`).join('\n')}

All Events:
${context.events.map(e => `- ${e.time} ${e.currency} [${e.impact.toUpperCase()}]: ${e.event}`).join('\n')}

Provide a concise briefing (3-4 paragraphs) covering:
1. Overall volatility expectation for the session
2. Key events to watch and their potential impact on Gold (XAUUSD), EURUSD, and BTC
3. Specific price levels or times of heightened risk
4. Recommended approach for paper traders (reduce size, avoid news, etc.)

Write for a paper trader audience. Be concise and actionable.`

  const response = await anthropic.messages.create({
    model: 'claude-3-haiku-20240307',
    max_tokens: 800,
    temperature: 0.3,
    system: 'You are a macro analyst for forex/gold/crypto traders. Provide actionable pre-session briefings.',
    messages: [{ role: 'user', content: prompt }],
  })

  return response.content[0].type === 'text' ? response.content[0].text : ''
}

export async function analyzeBehavioralPatterns(userId: string): Promise<Array<{
  type: string
  severity: 'INFO' | 'WARNING' | 'CRITICAL'
  message: string
  data: any
}>> {
  // Fetch user's recent trades
  const trades = await prisma.trade.findMany({
    where: { userId, status: 'CLOSED' },
    orderBy: { closedAt: 'desc' },
    take: 100,
  })

  if (trades.length < 10) return []

  const alerts = []

  // 1. Position size creep - check if position sizes are increasing over time
  const recentTrades = trades.slice(0, 20)
  const olderTrades = trades.slice(20, 40)

  const recentAvgSize = recentTrades.reduce((sum: number, t) => sum + Number(t.quantity), 0) / recentTrades.length
  const olderAvgSize = olderTrades.reduce((sum: number, t) => sum + Number(t.quantity), 0) / olderTrades.length

  if (recentAvgSize > olderAvgSize * 1.5) {
    alerts.push({
      type: 'POSITION_SIZE_CREEP',
      severity: 'WARNING' as const,
      message: `Position sizes have increased ${((recentAvgSize/olderAvgSize - 1) * 100).toFixed(0)}% recently. Consider if this aligns with your risk plan.`,
      data: { recentAvgSize, olderAvgSize, increase: recentAvgSize / olderAvgSize },
    })
  }

  // 2. Revenge trading - consecutive losses followed by larger position
  for (let i = 2; i < trades.length; i++) {
    const t1 = trades[i - 2]
    const t2 = trades[i - 1]
    const t3 = trades[i]

    if (Number(t1.pnl) < 0 && Number(t2.pnl) < 0 && Number(t3.quantity) > Number(t2.quantity) * 1.3) {
      const timeDiff = new Date(t2.closedAt!).getTime() - new Date(t3.openedAt).getTime()
      if (timeDiff < 3600000) { // Within 1 hour
        alerts.push({
          type: 'REVENGE_TRADING',
          severity: 'CRITICAL' as const,
          message: 'Potential revenge trading detected: larger position opened within 1 hour after two consecutive losses.',
          data: { trades: [t1.id, t2.id, t3.id] },
        })
        break
      }
    }
  }

  // 3. Overtrading - too many trades in short period
  const last24h = trades.filter((t) =>
    t.closedAt && new Date(t.closedAt).getTime() > Date.now() - 86400000
  )
  if (last24h.length > 15) {
    alerts.push({
      type: 'OVERTRADING',
      severity: 'WARNING' as const,
      message: `High trade frequency: ${last24h.length} trades in last 24 hours. Consider quality over quantity.`,
      data: { tradeCount: last24h.length },
    })
  }

  // 4. News trading - trades opened around high-impact events
  // This would need economic calendar integration - placeholder
  // alerts.push({...})

  return alerts
}

// Store coach alerts
export async function storeCoachAlerts(userId: string, alerts: Awaited<ReturnType<typeof analyzeBehavioralPatterns>>) {
  for (const alert of alerts) {
    await prisma.coachAlert.create({
      data: {
        userId,
        type: alert.type as any,
        severity: alert.severity,
        message: alert.message,
        data: alert.data,
      },
    })
  }
}