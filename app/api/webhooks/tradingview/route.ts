import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

interface TradingViewWebhookPayload {
  symbol: string
  direction: 'long' | 'short'
  timeframe: string
  price: number
  stopLoss?: number
  takeProfit?: number
  signalType: string // e.g., "order_block", "fvg", "structure_shift", "liquidity_sweep"
  indicatorName: string
  timestamp: string
}

export async function POST(request: NextRequest) {
  try {
    // Verify webhook secret
    const signature = request.headers.get('x-tradingview-signature')
    const secret = process.env.TRADINGVIEW_WEBHOOK_SECRET!

    if (!signature || !secret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.text()
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex')

    if (signature !== expectedSignature) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const payload: TradingViewWebhookPayload = JSON.parse(body)

    // Validate payload
    if (!payload.symbol || !payload.direction || !payload.price) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    // Get or create a default user for signals (in production, this would be user-specific)
    // For now, we'll store signals globally or associate with a demo user
    const demoUser = await prisma.user.upsert({
      where: { email: 'demo@virtualstock.app' },
      update: {},
      create: {
        email: 'demo@virtualstock.app',
        passwordHash: 'demo',
        name: 'Demo User',
        balance: 100000,
      },
    })

    // Store the signal
    const signal = await prisma.signal.create({
      data: {
        userId: demoUser.id,
        symbol: payload.symbol.replace('_', ''),
        direction: payload.direction.toUpperCase() as 'LONG' | 'SHORT',
        timeframe: payload.timeframe,
        entryPrice: payload.price,
        stopLoss: payload.stopLoss,
        takeProfit: payload.takeProfit,
        status: 'PENDING',
        source: 'tradingview',
        metadata: {
          indicatorName: payload.indicatorName,
          signalType: payload.signalType,
        },
        receivedAt: new Date(payload.timestamp),
      },
    })

    // Update signal stats
    await updateSignalStats(
      payload.symbol.replace('_', ''),
      payload.direction.toUpperCase() as 'LONG' | 'SHORT',
      payload.timeframe,
      payload.signalType
    )

    // Generate AI confidence note (async, don't await)
    generateConfidenceNote(signal.id).catch(console.error)

    return NextResponse.json({ success: true, signalId: signal.id })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function updateSignalStats(
  symbol: string,
  direction: 'LONG' | 'SHORT',
  timeframe: string,
  signalType: string
) {
  // This would track historical performance of signal types
  // For now, just log it
  console.log(`Signal received: ${symbol} ${direction} ${timeframe} ${signalType}`)
}

async function generateConfidenceNote(signalId: string) {
  try {
    const signal = await prisma.signal.findUnique({
      where: { id: signalId },
      include: { user: true },
    })

    if (!signal) return

    // Get historical win rate for this signal type
    const stats = await prisma.signalStats.findUnique({
      where: {
        symbol_direction_timeframe: {
          symbol: signal.symbol,
          direction: signal.direction,
          timeframe: signal.timeframe,
        },
      },
    })

    const { generateSignalConfidenceNote } = await import('@/lib/ai')

    const note = await generateSignalConfidenceNote({
      symbol: signal.symbol,
      direction: signal.direction,
      timeframe: signal.timeframe,
      entryPrice: Number(signal.entryPrice),
      stopLoss: signal.stopLoss ? Number(signal.stopLoss) : undefined,
      takeProfit: signal.takeProfit ? Number(signal.takeProfit) : undefined,
      signalType: (signal.metadata as Record<string, any>)?.signalType || 'unknown',
      historicalWinRate: stats?.winRate || 0,
      totalSignals: stats?.totalSignals || 0,
    })

    // Update signal with AI note
    await prisma.signal.update({
      where: { id: signalId },
      data: {
        metadata: {
          ...(signal.metadata as Record<string, any>),
          aiNote: note,
        },
      },
    })
  } catch (error) {
    console.error('Failed to generate confidence note:', error)
  }
}