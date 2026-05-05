import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import Layout from '../components/Layout'
import { useTheme } from '../lib/theme'
import { themeColors, themeTodo, themeTag, fontSize } from '../lib/styles'
import api from '../lib/api'

interface OverviewStats {
  activeFeuds: number
  injuredStars: number
  plesRemaining: number
  avgFanScore: number
}

interface TodoItem {
  id: string
  tier: 'blocker' | 'warning' | 'decision'
  message: string
}

interface PleEvent {
  id: number
  name: string
  date: string
  prestigeTier: 'standard' | 'premium'
  location?: string
}

export default function YearOverviewView() {
  const { isDark } = useTheme()
  const c = themeColors(isDark)
  const td = themeTodo(isDark)
  const t = themeTag(isDark)

  const [pleExpanded, setPleExpanded] = useState(false)

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['overview-stats'],
    queryFn: async () => {
      const res = await api.get<OverviewStats>('/overview/stats')
      return res.data
    },
  })

  const { data: todos = [] } = useQuery({
    queryKey: ['todos'],
    queryFn: async () => {
      const res = await api.get<TodoItem[]>('/todos')
      return res.data
    },
  })

  const { data: ples = [] } = useQuery({
    queryKey: ['overview-ples'],
    queryFn: async () => {
      const res = await api.get<PleEvent[]>('/overview/ples')
      return res.data
    },
  })

  const nextPle = ples[0]
  const daysUntil = nextPle
    ? Math.ceil((new Date(nextPle.date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null
  const rawsLeft = daysUntil ? Math.floor(daysUntil / 7) : 0
  const sdsLeft = daysUntil ? Math.floor(daysUntil / 7) : 0

  const blockers = todos.filter(t => t.tier === 'blocker')
  const warnings = todos.filter(t => t.tier === 'warning')
  const decisions = todos.filter(t => t.tier === 'decision')

  const cardStyle = {
    background: c.surface,
    border: `1px solid ${c.border}`,
    borderRadius: '10px',
    padding: '18px 20px',
    boxShadow: c.shadow,
  }

  return (
    <Layout>
      <div style={{ padding: '24px', color: c.textPrimary }}>

        {/* Header */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h1 style={{ fontSize: fontSize.xxl, fontWeight: 500, margin: '0 0 4px', color: c.textPrimary }}>
            Year Overview
          </h1>
          <p style={{ fontSize: fontSize.sm, color: c.textTertiary, margin: 0 }}>
            Creative director view — all data visible
          </p>
        </div>

        {/* PLE Countdown hero */}
        {nextPle && (
          <div
            onClick={() => setPleExpanded(!pleExpanded)}
            style={{
              ...cardStyle,
              marginBottom: '1.25rem',
              cursor: 'pointer',
              borderColor: pleExpanded ? c.goldBorder : c.border,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '24px' }}>
              <div>
                <p style={{ fontSize: fontSize.xs, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: c.textTertiary, margin: '0 0 6px' }}>
                  Next PLE
                </p>
                <p style={{ fontSize: '20px', fontWeight: 500, color: c.textPrimary, margin: '0 0 4px' }}>
                  {nextPle.name}
                  {nextPle.prestigeTier === 'premium' && (
                    <span style={{ ...t.special_appearance, marginLeft: '10px', fontSize: '10px' }}>PREMIUM</span>
                  )}
                </p>
                <p style={{ fontSize: fontSize.sm, color: c.textSecondary, margin: '0 0 8px' }}>
                  {new Date(nextPle.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  {nextPle.location && ` · ${nextPle.location}`}
                </p>
                <p style={{ fontSize: fontSize.xs, color: c.textTertiary, margin: 0 }}>
                  {pleExpanded ? '▲ Click to collapse' : '▼ Click to see all upcoming PLEs'}
                </p>
              </div>

              {/* Countdown numbers */}
              <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-end', flexShrink: 0 }}>
                <div style={{ textAlign: 'center' }}>
                  <span style={{ fontSize: fontSize.countdown, fontWeight: 500, color: c.textPrimary, display: 'block', lineHeight: 1 }}>
                    {daysUntil ?? '—'}
                  </span>
                  <span style={{ fontSize: fontSize.xs, color: c.textTertiary, textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: '4px', display: 'block' }}>
                    Days
                  </span>
                </div>
                <span style={{ fontSize: '36px', color: c.border, paddingBottom: '14px', lineHeight: 1 }}>:</span>
                <div style={{ textAlign: 'center' }}>
                  <span style={{ fontSize: fontSize.countdown, fontWeight: 500, color: c.textPrimary, display: 'block', lineHeight: 1 }}>
                    {rawsLeft}
                  </span>
                  <span style={{ fontSize: fontSize.xs, color: c.textTertiary, textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: '4px', display: 'block' }}>
                    Raws left
                  </span>
                </div>
                <span style={{ fontSize: '36px', color: c.border, paddingBottom: '14px', lineHeight: 1 }}>:</span>
                <div style={{ textAlign: 'center' }}>
                  <span style={{ fontSize: fontSize.countdown, fontWeight: 500, color: c.textPrimary, display: 'block', lineHeight: 1 }}>
                    {sdsLeft}
                  </span>
                  <span style={{ fontSize: fontSize.xs, color: c.textTertiary, textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: '4px', display: 'block' }}>
                    SDs left
                  </span>
                </div>
              </div>
            </div>

            {/* Progress bar */}
            <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: `1px solid ${c.borderSubtle}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: fontSize.sm, color: c.textTertiary }}>Build cycle progress</span>
                <span style={{ fontSize: fontSize.sm, color: c.textTertiary }}>
                  {daysUntil} days remaining
                </span>
              </div>
              <div style={{ height: '5px', borderRadius: '3px', background: c.borderSubtle, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: '3px', background: '#BA7517',
                  width: `${Math.min(100, Math.round(((28 - (daysUntil ?? 0)) / 28) * 100))}%`,
                }} />
              </div>
            </div>
          </div>
        )}

        {/* PLE dropdown */}
        {pleExpanded && ples.length > 0 && (
          <div style={{
            ...cardStyle,
            marginBottom: '1.25rem',
            padding: 0,
            overflow: 'hidden',
          }}>
            <div style={{ padding: '10px 16px', background: c.surfaceRaised, borderBottom: `1px solid ${c.border}` }}>
              <p style={{ fontSize: fontSize.xs, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: c.textTertiary, margin: 0 }}>
                All upcoming PLEs
              </p>
            </div>
            {ples.map((ple, i) => (
              <div
                key={ple.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '12px 16px',
                  borderBottom: i < ples.length - 1 ? `1px solid ${c.borderSubtle}` : 'none',
                }}
              >
                <div style={{
                  width: '8px', height: '8px', borderRadius: '50', flexShrink: 0,
                  background: i === 0 ? '#BA7517' : c.border,
                }} />
                <p style={{ fontSize: fontSize.base, fontWeight: 500, margin: 0, color: c.textPrimary, flex: 1 }}>
                  {ple.name}
                  {ple.prestigeTier === 'premium' && (
                    <span style={{ ...t.special_appearance, marginLeft: '8px', fontSize: '10px' }}>PREMIUM</span>
                  )}
                </p>
                <p style={{ fontSize: fontSize.sm, color: c.textSecondary, margin: 0 }}>
                  {new Date(ple.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  {ple.location && ` · ${ple.location}`}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Metric cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '1.5rem' }}>
          <MetricCard label="Active Feuds" value={statsLoading ? '—' : String(stats?.activeFeuds ?? 0)} color={c.gold} c={c} />
          <MetricCard label="Injured Stars" value={statsLoading ? '—' : String(stats?.injuredStars ?? 0)} color={stats?.injuredStars ? '#dc2626' : '#22c55e'} c={c} />
          <MetricCard label="PLEs Remaining" value={statsLoading ? '—' : String(stats?.plesRemaining ?? 0)} color='#3b82f6' c={c} />
          <MetricCard label="Avg Fan Score" value={statsLoading ? '—' : stats?.avgFanScore ? stats.avgFanScore.toFixed(1) : 'No data'} color='#a78bfa' c={c} />
        </div>

        {/* Next show + checklist */}
        <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
          {/* Show header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 20px',
            background: c.surfaceRaised,
            borderBottom: `1px solid ${c.border}`,
          }}>
            <div>
              <p style={{ fontSize: fontSize.lg, fontWeight: 500, margin: '0 0 2px', color: c.textPrimary }}>
                Next show — Raw
              </p>
              <p style={{ fontSize: fontSize.sm, color: c.textSecondary, margin: 0 }}>
                Monday · Netflix · Soft constraint · ~150 min content
              </p>
            </div>
            <span style={{ background: '#dc2626', color: 'white', fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '0', textTransform: 'uppercase' as const, letterSpacing: '0.08em' }}>
              Raw
            </span>
          </div>

          {/* Show stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', borderBottom: `1px solid ${c.border}` }}>
            {[
              { label: 'Injured', value: stats?.injuredStars ?? 0, color: stats?.injuredStars ? '#dc2626' : '#22c55e' },
              { label: 'Stalling Threads', value: todos.filter(t => t.tier === 'warning').length, color: '#f59e0b' },
              { label: 'Active Stars', value: 14, color: '#22c55e' },
            ].map((stat, i) => (
              <div
                key={stat.label}
                style={{
                  padding: '16px', textAlign: 'center',
                  borderRight: i < 2 ? `1px solid ${c.border}` : 'none',
                }}
              >
                <span style={{ fontSize: fontSize.metric, fontWeight: 500, color: stat.color, display: 'block' }}>
                  {stat.value}
                </span>
                <span style={{ fontSize: fontSize.xs, color: c.textTertiary, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {stat.label}
                </span>
              </div>
            ))}
          </div>

          {/* Checklist */}
          <div style={{ padding: '16px 20px' }}>
            <p style={{ fontSize: fontSize.xs, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: c.textTertiary, margin: '0 0 12px' }}>
              This week's checklist — {blockers.length} blockers · {warnings.length} warnings · {decisions.length} decisions
            </p>

            {todos.length === 0 && (
              <p style={{ fontSize: fontSize.sm, color: c.textTertiary, textAlign: 'center', padding: '1.5rem 0' }}>
                All clear — no blockers or warnings
              </p>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[...blockers, ...warnings, ...decisions].map(todo => {
                const cfg = td[todo.tier]
                return (
                  <div
                    key={todo.id}
                    style={{
                      display: 'flex', alignItems: 'flex-start', gap: '10px',
                      padding: '12px 14px', borderRadius: '6px',
                      background: cfg.background, border: cfg.border,
                    }}
                  >
                    <div style={{
                      width: '8px', height: '8px', borderRadius: '50%',
                      background: cfg.dot, flexShrink: 0, marginTop: '5px',
                    }} />
                    <div>
                      <span style={{
                        fontSize: fontSize.xs, fontWeight: 700, textTransform: 'uppercase',
                        letterSpacing: '0.08em', color: cfg.label, display: 'block', marginBottom: '3px',
                      }}>
                        {todo.tier}
                      </span>
                      <p style={{ fontSize: fontSize.base, color: cfg.text, margin: 0, lineHeight: 1.5 }}>
                        {todo.message}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}

function MetricCard({ label, value, color, c }: {
  label: string
  value: string
  color: string
  c: ReturnType<typeof themeColors>
}) {
  return (
    <div style={{
      background: c.surface,
      border: `1px solid ${c.border}`,
      borderRadius: '10px',
      padding: '16px 20px',
      boxShadow: c.shadow,
    }}>
      <p style={{ fontSize: fontSize.xs, color: c.textTertiary, margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
        {label}
      </p>
      <p style={{ fontSize: fontSize.metric, fontWeight: 500, margin: 0, color }}>
        {value}
      </p>
    </div>
  )
}