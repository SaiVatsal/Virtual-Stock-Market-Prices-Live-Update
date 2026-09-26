'use client'

import { useEffect, useState } from 'react'
import { format, formatDistanceToNow } from 'date-fns'
import { AlertTriangle, AlertCircle, Info, CheckCircle, X, RefreshCw, Bell, Shield, TrendingUp, Target, Zap, Brain } from 'lucide-react'

interface CoachAlert {
  id: string
  type: string
  severity: 'INFO' | 'WARNING' | 'CRITICAL'
  message: string
  data: any
  acknowledged: boolean
  createdAt: string
}

const ALERT_CONFIG: Record<string, { icon: typeof AlertTriangle; label: string; color: string; bgColor: string }> = {
  POSITION_SIZE_CREEP: { icon: TrendingUp, label: 'Position Size Creep', color: 'text-yellow-400', bgColor: 'bg-yellow-500/10 border-yellow-500/20' },
  REVENGE_TRADING: { icon: Zap, label: 'Revenge Trading', color: 'text-red-400', bgColor: 'bg-red-500/10 border-red-500/20' },
  OVERTRADING: { icon: Target, label: 'Overtrading', color: 'text-orange-400', bgColor: 'bg-orange-500/10 border-orange-500/20' },
  NEWS_TRADING: { icon: AlertCircle, label: 'News Trading', color: 'text-purple-400', bgColor: 'bg-purple-500/10 border-purple-500/20' },
  RISK_LIMIT_BREACH: { icon: Shield, label: 'Risk Limit Breach', color: 'text-red-400', bgColor: 'bg-red-500/10 border-red-500/20' },
  PATTERN_DETECTED: { icon: Brain, label: 'Pattern Detected', color: 'text-blue-400', bgColor: 'bg-blue-500/10 border-blue-500/20' },
}

const SEVERITY_CONFIG = {
  INFO: { color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20', icon: Info },
  WARNING: { color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20', icon: AlertTriangle },
  CRITICAL: { color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20', icon: AlertCircle },
}

export function CoachAlerts() {
  const [alerts, setAlerts] = useState<CoachAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [showAcknowledged, setShowAcknowledged] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)

  const fetchAlerts = async () => {
    try {
      setRefreshing(true)
      const res = await fetch('/api/coach')
      if (res.ok) {
        const data = await res.json()
        setAlerts(data.alerts || [])
      } else {
        throw new Error('Failed to fetch alerts')
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const analyzePatterns = async () => {
    setAnalyzing(true)
    try {
      const res = await fetch('/api/coach?action=analyze', { method: 'POST' })
      if (res.ok) {
        await fetchAlerts()
      }
    } catch (err) {
      console.error('Failed to analyze patterns:', err)
    } finally {
      setAnalyzing(false)
    }
  }

  const acknowledgeAlert = async (id: string) => {
    try {
      await fetch(`/api/coach?action=acknowledge&id=${id}`, { method: 'POST' })
      setAlerts(prev => prev.map(a => a.id === id ? { ...a, acknowledged: true } : a))
    } catch (err) {
      console.error('Failed to acknowledge alert:', err)
    }
  }

  const acknowledgeAll = async () => {
    try {
      await fetch('/api/coach?action=acknowledge-all', { method: 'POST' })
      setAlerts(prev => prev.map(a => ({ ...a, acknowledged: true })))
    } catch (err) {
      console.error('Failed to acknowledge all:', err)
    }
  }

  useEffect(() => {
    fetchAlerts()
  }, [])

  const unacknowledgedAlerts = alerts.filter(a => !a.acknowledged)
  const criticalAlerts = unacknowledgedAlerts.filter(a => a.severity === 'CRITICAL')
  const warningAlerts = unacknowledgedAlerts.filter(a => a.severity === 'WARNING')
  const infoAlerts = unacknowledgedAlerts.filter(a => a.severity === 'INFO')

  if (loading && alerts.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 text-primary animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
            <Bell className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Risk Coach</h2>
            <p className="text-sm text-gray-400">Behavioral pattern detection & risk alerts</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-gray-400">
            <input
              type="checkbox"
              checked={showAcknowledged}
              onChange={(e) => setShowAcknowledged(e.target.checked)}
              className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-primary focus:ring-primary"
            />
            Show acknowledged
          </label>
          <button
            onClick={analyzePatterns}
            disabled={analyzing}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            <Brain className="w-4 h-4" />
            {analyzing ? 'Analyzing...' : 'Analyze Now'}
          </button>
          <button
            onClick={fetchAlerts}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 border border-gray-700 hover:bg-gray-700 text-gray-300 rounded-lg text-sm transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SummaryCard
          label="Unacknowledged"
          value={unacknowledgedAlerts.length}
          icon={Bell}
          color="text-purple-400"
        />
        <SummaryCard
          label="Critical"
          value={criticalAlerts.length}
          icon={AlertCircle}
          color="text-red-400"
        />
        <SummaryCard
          label="Warnings"
          value={warningAlerts.length}
          icon={AlertTriangle}
          color="text-yellow-400"
        />
        <SummaryCard
          label="Info"
          value={infoAlerts.length}
          icon={Info}
          color="text-blue-400"
        />
      </div>

      {/* Acknowledge All Button */}
      {unacknowledgedAlerts.length > 0 && (
        <button
          onClick={acknowledgeAll}
          className="w-full py-3 bg-gray-800 border border-gray-700 rounded-lg text-gray-400 hover:text-yellow-400 hover:border-yellow-500 transition-colors flex items-center justify-center gap-2"
        >
          <CheckCircle className="w-4 h-4" />
          Acknowledge All ({unacknowledgedAlerts.length})
        </button>
      )}

      {/* Alerts List */}
      {alerts.length === 0 ? (
        <div className="text-center py-12">
          <Shield className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-300 mb-2">No Alerts</h3>
          <p className="text-gray-500 mb-4">Your trading behavior looks good! The coach will alert you if patterns emerge.</p>
          <button onClick={analyzePatterns} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm">
            Run Analysis Now
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {[
            { severity: 'CRITICAL', label: 'Critical', alerts: criticalAlerts },
            { severity: 'WARNING', label: 'Warnings', alerts: warningAlerts },
            { severity: 'INFO', label: 'Info', alerts: infoAlerts },
          ].map(({ severity, label, alerts: severityAlerts }) => {
            const displayAlerts = showAcknowledged
              ? alerts.filter(a => a.severity === severity)
              : severityAlerts

            if (displayAlerts.length === 0) return null

            return (
              <div key={severity} className="space-y-3">
                <h3 className="flex items-center gap-2 text-sm font-medium text-gray-400 uppercase tracking-wide">
                  {(() => {
                    const SeverityIcon = SEVERITY_CONFIG[severity as keyof typeof SEVERITY_CONFIG].icon
                    const color = SEVERITY_CONFIG[severity as keyof typeof SEVERITY_CONFIG].color
                    return <SeverityIcon className={`w-4 h-4 ${color}`} />
                  })()}
                  {label} ({displayAlerts.length})
                </h3>
                {displayAlerts.map(alert => (
                  <AlertCard
                    key={alert.id}
                    alert={alert}
                    onAcknowledge={acknowledgeAlert}
                    config={ALERT_CONFIG[alert.type] || { icon: Info, label: alert.type, color: 'text-gray-400', bgColor: 'bg-gray-500/10 border-gray-500/20' }}
                    severityConfig={SEVERITY_CONFIG[alert.severity]}
                  />
                ))}
              </div>
            )
          })}

          {showAcknowledged && alerts.filter(a => a.acknowledged).length > 0 && (
            <div className="space-y-3">
              <h3 className="flex items-center gap-2 text-sm font-medium text-gray-400 uppercase tracking-wide">
                <CheckCircle className="w-4 h-4 text-green-400" />
                Acknowledged ({alerts.filter(a => a.acknowledged).length})
              </h3>
              {alerts.filter(a => a.acknowledged).map(alert => (
                <AlertCard
                  key={alert.id}
                  alert={alert}
                  onAcknowledge={acknowledgeAlert}
                  config={ALERT_CONFIG[alert.type] || { icon: Info, label: alert.type, color: 'text-gray-400', bgColor: 'bg-gray-500/10 border-gray-500/20' }}
                  severityConfig={SEVERITY_CONFIG[alert.severity]}
                  isAcknowledged
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

interface SummaryCardProps {
  label: string
  value: number
  icon: typeof AlertTriangle
  color: string
}

function SummaryCard({ label, value, icon: Icon, color }: SummaryCardProps) {
  return (
    <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-400 uppercase tracking-wide">{label}</span>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      <p className="text-3xl font-mono font-bold text-white">{value}</p>
    </div>
  )
}

interface AlertCardProps {
  alert: CoachAlert
  onAcknowledge: (id: string) => void
  config: { icon: typeof AlertTriangle; label: string; color: string; bgColor: string }
  severityConfig: { color: string; bg: string; icon: typeof Info }
  isAcknowledged?: boolean
}

function AlertCard({ alert, onAcknowledge, config, severityConfig, isAcknowledged = false }: AlertCardProps) {
  const Icon = config.icon
  const SeverityIcon = severityConfig.icon

  return (
    <div className={`rounded-xl border p-4 transition-all ${isAcknowledged ? 'opacity-60 bg-gray-900/30' : 'bg-gray-900/50'} ${config.bgColor}`}>
      <div className="flex items-start gap-3">
        {/* Alert Type Icon */}
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${config.bgColor}`}>
          <Icon className="w-5 h-5" style={{ color: config.color.replace('text-', '') }} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <span className={`font-medium text-sm ${config.color}`}>{config.label}</span>
            <span className={`px-2 py-0.5 rounded text-xs font-medium uppercase tracking-wide ${severityConfig.bg}`}>
              {alert.severity}
            </span>
            {isAcknowledged && (
              <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-500/10 border border-green-500/20 text-green-400">
                Acknowledged
              </span>
            )}
          </div>
          <p className="text-gray-300 text-sm leading-relaxed">{alert.message}</p>

          {/* Alert Data */}
          {alert.data && Object.keys(alert.data).length > 0 && (
            <div className="mt-3 p-3 bg-gray-900 rounded-lg border border-gray-700">
              <p className="text-xs text-gray-400 mb-1">Details:</p>
              <pre className="text-xs text-gray-300 font-mono overflow-x-auto">
                {JSON.stringify(alert.data, null, 2)}
              </pre>
            </div>
          )}

          {/* Timestamp */}
          <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
            <span>{formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true })}</span>
            <span>&#8226;</span>
            <span>{format(new Date(alert.createdAt), 'MMM d, yyyy HH:mm')}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col items-end gap-2">
          {!isAcknowledged && (
            <button
              onClick={() => onAcknowledge(alert.id)}
              className="px-3 py-1.5 text-xs font-medium text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
            >
              Acknowledge
            </button>
          )}
          {isAcknowledged && (
            <CheckCircle className="w-5 h-5 text-green-400" />
          )}
        </div>
      </div>
    </div>
  )
}