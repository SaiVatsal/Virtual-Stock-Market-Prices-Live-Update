import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getOandaClient } from '@/lib/oanda'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Get demo user (in production, get from auth session)
    const user = await prisma.user.findUnique({
      where: { email: 'demo@virtualstock.app' },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get all positions
    const positions = await prisma.position.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: 'desc' },
    })

    // Update current prices and unrealized P&L
    const oandaClient = getOandaClient()
    const updatedPositions = await Promise.all(
      positions.map(async (position: typeof positions[0]) => {
        try {
          const oandaSymbol = `${position.symbol.slice(0, 3)}_${position.symbol.slice(3)}`
          const priceData = await oandaClient.getPrice(oandaSymbol)
          const currentPrice = (priceData.bid + priceData.ask) / 2
          const unrealizedPnL = (currentPrice - Number(position.averagePrice)) * Number(position.quantity)

          // Update position with current price
          await prisma.position.update({
            where: { id: position.id },
            data: { currentPrice, unrealizedPnL },
          })

          return {
            ...position,
            currentPrice,
            unrealizedPnL,
          }
        } catch (error) {
          console.error(`Failed to update price for ${position.symbol}:`, error)
          return {
            ...position,
            currentPrice: Number(position.currentPrice) || Number(position.averagePrice),
            unrealizedPnL: Number(position.unrealizedPnL) || 0,
          }
        }
      })
    )

    // Get total portfolio value
    const totalUnrealizedPnL = updatedPositions.reduce(
      (sum: number, p) => sum + Number(p.unrealizedPnL),
      0
    )
    const totalEquity = Number(user.balance) + totalUnrealizedPnL

    // Get recent trades for P&L history
    const recentTrades = await prisma.trade.findMany({
      where: { userId: user.id, status: 'CLOSED' },
      orderBy: { closedAt: 'desc' },
      take: 50,
    })

    const realizedPnL = recentTrades.reduce(
      (sum: number, t) => sum + Number(t.pnl || 0),
      0
    )

    return NextResponse.json({
      balance: Number(user.balance),
      equity: totalEquity,
      unrealizedPnL: totalUnrealizedPnL,
      realizedPnL,
      positions: updatedPositions,
      totalPositions: updatedPositions.length,
    })
  } catch (error) {
    console.error('Failed to fetch portfolio:', error)
    return NextResponse.json({ error: 'Failed to fetch portfolio' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Reset demo user balance
    const user = await prisma.user.update({
      where: { email: 'demo@virtualstock.app' },
      data: {
        balance: 100000,
      },
    })

    // Delete all positions
    await prisma.position.deleteMany({
      where: { userId: user.id },
    })

    return NextResponse.json({ success: true, balance: Number(user.balance) })
  } catch (error) {
    console.error('Failed to reset portfolio:', error)
    return NextResponse.json({ error: 'Failed to reset portfolio' }, { status: 500 })
  }
}