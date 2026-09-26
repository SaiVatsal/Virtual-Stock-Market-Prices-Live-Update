import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { analyzeBehavioralPatterns, storeCoachAlerts } from '@/lib/ai'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const acknowledged = searchParams.get('acknowledged')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const user = await prisma.user.findUnique({
      where: { email: 'demo@virtualstock.app' },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const where: any = { userId: user.id }
    if (acknowledged !== null) {
      where.acknowledged = acknowledged === 'true'
    }

    const alerts = await prisma.coachAlert.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit,
    })

    const total = await prisma.coachAlert.count({ where })
    const unacknowledged = await prisma.coachAlert.count({
      where: { userId: user.id, acknowledged: false },
    })

    return NextResponse.json({ alerts, total, unacknowledged, limit, offset })
  } catch (error) {
    console.error('Failed to fetch coach alerts:', error)
    return NextResponse.json({ error: 'Failed to fetch coach alerts' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const alertId = searchParams.get('id')

    const user = await prisma.user.findUnique({
      where: { email: 'demo@virtualstock.app' },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (action === 'acknowledge' && alertId) {
      await prisma.coachAlert.update({
        where: { id: alertId, userId: user.id },
        data: { acknowledged: true },
      })
      return NextResponse.json({ success: true })
    }

    if (action === 'acknowledge-all') {
      await prisma.coachAlert.updateMany({
        where: { userId: user.id, acknowledged: false },
        data: { acknowledged: true },
      })
      return NextResponse.json({ success: true })
    }

    if (action === 'analyze') {
      const alerts = await analyzeBehavioralPatterns(user.id)
      if (alerts.length > 0) {
        await storeCoachAlerts(user.id, alerts)
      }
      return NextResponse.json({ success: true, alertsGenerated: alerts.length })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Coach API error:', error)
    return NextResponse.json({ error: 'Failed to process coach request' }, { status: 500 })
  }
}