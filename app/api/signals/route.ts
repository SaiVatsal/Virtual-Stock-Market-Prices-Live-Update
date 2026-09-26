import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const symbol = searchParams.get('symbol')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const where: any = {}
    if (symbol) {
      where.symbol = symbol
    }

    const signals = await prisma.signal.findMany({
      where,
      orderBy: { receivedAt: 'desc' },
      skip: offset,
      take: limit,
      include: {
        user: {
          select: {
            name: true,
            email: true,
          }
        }
      }
    })

    const total = await prisma.signal.count({ where })

    return NextResponse.json({ signals, total, limit, offset })
  } catch (error) {
    console.error('Failed to fetch signals:', error)
    return NextResponse.json({ error: 'Failed to fetch signals' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Signal ID required' }, { status: 400 })
    }

    await prisma.signal.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete signal:', error)
    return NextResponse.json({ error: 'Failed to delete signal' }, { status: 500 })
  }
}