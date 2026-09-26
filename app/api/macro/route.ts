import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateMacroBriefing } from '@/lib/ai'

export const dynamic = 'force-dynamic'

// Economic calendar events (in production, fetch from API like Twelve Data, FRED, or Investing.com)
async function fetchEconomicEvents(date: string): Promise<Array<{
  time: string
  currency: string
  event: string
  impact: 'high' | 'medium' | 'low'
  forecast?: string
  previous?: string
}>> {
  // In production, integrate with:
  // - Twelve Data economic calendar API
  // - FRED API for US data
  // - Investing.com calendar
  // - Forex Factory API

  // For demo, return static high-impact events
  const demoEvents = [
    // US Events
    { time: '08:30', currency: 'USD', event: 'Non-Farm Payrolls', impact: 'high' as const, forecast: '180K', previous: '175K' },
    { time: '08:30', currency: 'USD', event: 'Unemployment Rate', impact: 'high' as const, forecast: '3.7%', previous: '3.7%' },
    { time: '08:30', currency: 'USD', event: 'Average Hourly Earnings MoM', impact: 'medium' as const, forecast: '0.3%', previous: '0.4%' },
    { time: '10:00', currency: 'USD', event: 'ISM Manufacturing PMI', impact: 'high' as const, forecast: '48.5', previous: '47.8' },
    { time: '10:00', currency: 'USD', event: 'JOLTS Job Openings', impact: 'medium' as const, forecast: '8.5M', previous: '8.8M' },
    { time: '14:00', currency: 'USD', event: 'FOMC Meeting Minutes', impact: 'high' as const },

    // EUR Events
    { time: '06:00', currency: 'EUR', event: 'German CPI YoY', impact: 'high' as const, forecast: '2.3%', previous: '2.2%' },
    { time: '07:00', currency: 'EUR', event: 'ECB Interest Rate Decision', impact: 'high' as const, forecast: '4.00%', previous: '4.00%' },
    { time: '07:30', currency: 'EUR', event: 'ECB Press Conference', impact: 'high' as const },

    // GBP Events
    { time: '06:00', currency: 'GBP', event: 'UK GDP QoQ', impact: 'high' as const, forecast: '0.2%', previous: '0.1%' },
    { time: '06:00', currency: 'GBP', event: 'BoE Interest Rate Decision', impact: 'high' as const, forecast: '5.25%', previous: '5.25%' },

    // JPY Events
    { time: '23:50', currency: 'JPY', event: 'Japan CPI YoY', impact: 'medium' as const, forecast: '2.8%', previous: '2.6%' },
    { time: '23:50', currency: 'JPY', event: 'BoJ Interest Rate Decision', impact: 'high' as const, forecast: '-0.10%', previous: '-0.10%' },

    // AUD Events
    { time: '00:30', currency: 'AUD', event: 'RBA Interest Rate Decision', impact: 'high' as const, forecast: '4.35%', previous: '4.35%' },

    // CAD Events
    { time: '12:30', currency: 'CAD', event: 'BOC Interest Rate Decision', impact: 'high' as const, forecast: '5.00%', previous: '5.00%' },

    // CHF Events
    { time: '08:30', currency: 'CHF', event: 'SNB Interest Rate Decision', impact: 'high' as const, forecast: '1.75%', previous: '1.75%' },

    // NZD Events
    { time: '21:00', currency: 'NZD', event: 'RBNZ Interest Rate Decision', impact: 'high' as const, forecast: '5.50%', previous: '5.50%' },

    // CNY Events (impact on AUD, commodities)
    { time: '02:00', currency: 'CNY', event: 'Manufacturing PMI', impact: 'medium' as const, forecast: '50.2', previous: '50.1' },
  ]

  return demoEvents
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0]
    const refresh = searchParams.get('refresh') === 'true'

    // Check if we have cached briefing for this date
    if (!refresh) {
      const cached = await prisma.macroBriefing.findUnique({
        where: { date },
      })

      if (cached && cached.content) {
        return NextResponse.json({
          briefing: cached.content,
          events: cached.events,
          date: cached.date,
          cached: true,
        })
      }
    }

    // Fetch economic events
    const events = await fetchEconomicEvents(date)

    // Generate AI briefing
    const briefing = await generateMacroBriefing({ date, events })

    // Store in database
    await prisma.macroBriefing.upsert({
      where: { date },
      update: {
        content: briefing,
        events: events as any,
        updatedAt: new Date(),
      },
      create: {
        date,
        content: briefing,
        events: events as any,
      },
    })

    return NextResponse.json({
      briefing,
      events,
      date,
      cached: false,
    })
  } catch (error) {
    console.error('Failed to generate macro briefing:', error)
    return NextResponse.json({ error: 'Failed to generate macro briefing' }, { status: 500 })
  }
}

// Vercel Cron job endpoint - runs daily at 06:00 UTC (pre-market)
export async function POST(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const date = new Date().toISOString().split('T')[0]
    const events = await fetchEconomicEvents(date)
    const briefing = await generateMacroBriefing({ date, events })

    await prisma.macroBriefing.upsert({
      where: { date },
      update: {
        content: briefing,
        events: events as any,
        updatedAt: new Date(),
      },
      create: {
        date,
        content: briefing,
        events: events as any,
      },
    })

    return NextResponse.json({ success: true, date })
  } catch (error) {
    console.error('Cron job failed:', error)
    return NextResponse.json({ error: 'Cron job failed' }, { status: 500 })
  }
}