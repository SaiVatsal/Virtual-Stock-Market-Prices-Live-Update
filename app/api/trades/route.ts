import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getOandaClient, pollPrices } from '@/lib/oanda'
import { generateTradeJournalCritique, analyzeBehavioralPatterns, storeCoachAlerts } from '@/lib/ai'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { symbol, side, quantity } = body

    // Validate input
    if (!symbol || !side || !quantity || quantity <= 0) {
      return NextResponse.json({ error: 'Invalid trade parameters' }, { status: 400 })
    }

    // Get demo user (in production, get from auth session)
    const user = await prisma.user.findUnique({
      where: { email: 'demo@virtualstock.app' },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get current price from OANDA
    const oandaClient = getOandaClient()
    const oandaSymbol = symbol.includes('_') ? symbol : `${symbol.slice(0, 3)}_${symbol.slice(3)}`
    const priceData = await oandaClient.getPrice(oandaSymbol)
    const currentPrice = (priceData.bid + priceData.ask) / 2

    // Check if user has enough balance for BUY
    if (side === 'BUY') {
      const cost = currentPrice * quantity
      if (Number(user.balance) < cost) {
        return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 })
      }
    }

    // Create trade
    const trade = await prisma.trade.create({
      data: {
        userId: user.id,
        symbol: symbol.replace('_', ''),
        side: side as 'BUY' | 'SELL',
        quantity: quantity,
        price: currentPrice,
        status: 'OPEN',
      },
    })

    // Update user balance and positions
    await updatePosition(user.id, symbol.replace('_', ''), side, quantity, currentPrice)

    // If closing a position, calculate P&L and generate journal entry
    if (side === 'SELL') {
      await closePositionAndGenerateJournal(trade.id, user.id, symbol.replace('_', ''), quantity, currentPrice)
    }

    return NextResponse.json({ success: true, trade })
  } catch (error) {
    console.error('Trade error:', error)
    return NextResponse.json({ error: 'Failed to execute trade' }, { status: 500 })
  }
}

async function updatePosition(
  userId: string,
  symbol: string,
  side: 'BUY' | 'SELL',
  quantity: number,
  price: number
) {
  const existingPosition = await prisma.position.findUnique({
    where: { userId_symbol: { userId, symbol } },
  })

  if (side === 'BUY') {
    if (existingPosition) {
      const newQuantity = Number(existingPosition.quantity) + quantity
      const newAvgPrice = (
        (Number(existingPosition.averagePrice) * Number(existingPosition.quantity)) +
        (price * quantity)
      ) / newQuantity

      await prisma.position.update({
        where: { id: existingPosition.id },
        data: {
          quantity: newQuantity,
          averagePrice: newAvgPrice,
          currentPrice: price,
        },
      })
    } else {
      await prisma.position.create({
        data: {
          userId,
          symbol,
          quantity,
          averagePrice: price,
          currentPrice: price,
        },
      })
    }

    // Deduct from balance
    await prisma.user.update({
      where: { id: userId },
      data: {
        balance: { decrement: price * quantity },
      },
    })
  } else {
    // SELL - reduce position
    if (!existingPosition || Number(existingPosition.quantity) < quantity) {
      throw new Error('Insufficient position to sell')
    }

    const newQuantity = Number(existingPosition.quantity) - quantity

    if (newQuantity === 0) {
      await prisma.position.delete({ where: { id: existingPosition.id } })
    } else {
      await prisma.position.update({
        where: { id: existingPosition.id },
        data: { quantity: newQuantity, currentPrice: price },
      })
    }

    // Add to balance
    await prisma.user.update({
      where: { id: userId },
      data: {
        balance: { increment: price * quantity },
      },
    })
  }
}

async function closePositionAndGenerateJournal(
  tradeId: string,
  userId: string,
  symbol: string,
  quantity: number,
  exitPrice: number
) {
  // Find the matching BUY trade(s) to calculate P&L
  const buyTrades = await prisma.trade.findMany({
    where: {
      userId,
      symbol,
      side: 'BUY',
      status: 'OPEN',
    },
    orderBy: { openedAt: 'asc' },
  })

  let remainingQty = quantity
  let totalPnL = 0
  let avgEntryPrice = 0
  let totalEntryQty = 0

  for (const buyTrade of buyTrades) {
    const tradeQty = Math.min(Number(buyTrade.quantity), remainingQty)
    const entryPrice = Number(buyTrade.price)

    totalPnL += (exitPrice - entryPrice) * tradeQty
    avgEntryPrice += entryPrice * tradeQty
    totalEntryQty += tradeQty
    remainingQty -= tradeQty

    // Mark buy trade as closed
    await prisma.trade.update({
      where: { id: buyTrade.id },
      data: { status: 'CLOSED', closedAt: new Date() },
    })

    if (remainingQty === 0) break
  }

  avgEntryPrice = totalEntryQty > 0 ? avgEntryPrice / totalEntryQty : exitPrice

  // Update the sell trade with P&L
  await prisma.trade.update({
    where: { id: tradeId },
    data: {
      status: 'CLOSED',
      closedAt: new Date(),
      pnl: totalPnL,
    },
  })

  // Generate AI journal entry
  try {
    const { generateTradeJournalCritique } = await import('@/lib/ai')

    const critique = await generateTradeJournalCritique({
      symbol,
      side: 'BUY', // The original position was long
      entryPrice: avgEntryPrice,
      exitPrice,
      quantity,
      pnl: totalPnL,
      timeframe: 'M5', // Would come from signal or user selection
      durationMinutes: 0, // Would calculate from trade timestamps
      marketStructure: 'unknown', // Would analyze from price action
      keyLevels: [],
    })

    await prisma.journalEntry.create({
      data: {
        userId,
        tradeId,
        symbol,
        side: 'BUY',
        entryPrice: avgEntryPrice,
        exitPrice,
        quantity,
        pnl: totalPnL,
        timeframe: 'M5',
        aiCritique: critique.critique,
        aiScore: critique.score,
        concepts: critique.concepts,
      },
    })
  } catch (error) {
    console.error('Failed to generate journal entry:', error)
  }

  // Analyze behavioral patterns
  try {
    const alerts = await analyzeBehavioralPatterns(userId)
    if (alerts.length > 0) {
      await storeCoachAlerts(userId, alerts)
    }
  } catch (error) {
    console.error('Failed to analyze patterns:', error)
  }
}

export async function GET() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'demo@virtualstock.app' },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const trades = await prisma.trade.findMany({
      where: { userId: user.id },
      orderBy: { openedAt: 'desc' },
      take: 50,
    })

    return NextResponse.json({ trades })
  } catch (error) {
    console.error('Failed to fetch trades:', error)
    return NextResponse.json({ error: 'Failed to fetch trades' }, { status: 500 })
  }
}