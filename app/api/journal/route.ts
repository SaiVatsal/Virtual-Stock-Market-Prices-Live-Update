import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const symbol = searchParams.get('symbol')
    const tradeId = searchParams.get('tradeId')

    const where: any = {}
    if (symbol) {
      where.symbol = symbol
    }
    if (tradeId) {
      where.tradeId = tradeId
    }

    const entries = await prisma.journalEntry.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit,
    })

    const total = await prisma.journalEntry.count({ where })

    return NextResponse.json({ entries, total, limit, offset })
  } catch (error) {
    console.error('Failed to fetch journal entries:', error)
    return NextResponse.json({ error: 'Failed to fetch journal entries' }, { status: 500 })
  }
}