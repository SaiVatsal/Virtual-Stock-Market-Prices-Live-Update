import type { Metadata, Viewport } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-mono',
})

export const metadata: Metadata = {
  title: 'Virtual Stock Trading - Paper Trading Simulator',
  description: 'Trade forex, gold, and crypto with virtual funds. Live market data, AI-powered analysis, and risk coaching.',
  keywords: ['paper trading', 'forex', 'gold', 'virtual trading', 'trading simulator', 'ICT', 'SMC'],
  authors: [{ name: 'Virtual Trading' }],
  openGraph: {
    title: 'Virtual Stock Trading',
    description: 'Paper trading simulator with live data and AI analysis',
    type: 'website',
  },
}

export const viewport: Viewport = {
  themeColor: '#0f0f1a',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable} dark`}>
      <body className="min-h-screen bg-gray-900 text-white antialiased">
        {children}
      </body>
    </html>
  )
}