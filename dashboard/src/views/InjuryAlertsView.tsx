import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Layout from '../components/Layout'
import { useAuth } from '../lib/auth'
import { useTheme } from '../lib/theme'
import { themeColors, fontSize } from '../lib/styles'
import api from '../lib/api'
import type { Star } from '../types/index'

export default function InjuryAlertsView() {
  const { isCreativeDirector } = useAuth()
  const { isDark } = useTheme()
  const c = themeColors(isDark)
  const queryClient = useQueryClient()
  const [flagging, setFlagging] = useState<string | null>(null)

  const { data: stars = [], isLoading } = useQuery({
    queryKey: ['stars'],
    queryFn: async () => {
      const res = await api.get<Star[]>('/stars')
      return res.data
    },
  })

  const injuredStars = stars.filter(s => s.status === 'injured')
  const activeStars = stars.filter(s => s.status === 'active' && s.scheduleType === 'full_time')

  const flagInjury = useMutation({
    mutationFn: async (starId: string) => {
      const res = await api.patch(`/stars/${starId}`, { status: 'injured' })
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stars'] })
      setFlagging(null)
    },
  })

  const clearInjury = useMutation({
    mutationFn: async (starId: string) => {
      const res = await api.patch(`/stars/${starId}`, { status: 'active' })
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stars'] })
    },
  })

  return (
    <Layout>
      <div style={{ padding: '24px', color: c.textPrimary }}>

        <div style={{ marginBottom: '1.5rem' }}>
          <h1 style={{ fontSize: fontSize.xxl, fontWeight: 500, margin: '0 0 4px', color: c.textPrimary }}>
            Injury Alerts
          </h1>
          <p style={{ fontSize: fontSize.sm, color: c.textTertiary, margin: 0 }}>
            {injuredStars.length} star{injuredStars.length !== 1 ? 's' : ''} currently injured
          </p>
        </div>

        {isLoading && (
          <p style={{ fontSize: fontSize.sm, color: c.textTertiary }}>Loading...</p>
        )}

        {injuredStars.length === 0 && !isLoading && (
          <div style={{
            textAlign: 'center', padding: '3rem',
            border: `1px solid ${c.border}`, borderRadius: '10px',
            fontSize: fontSize.sm, color: c.textTertiary,
            marginBottom: '1.5rem',
          }}>
            No injured stars — roster is healthy
          </div>
        )}

        {/* Injured stars */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '2rem' }}>
          {injuredStars.map(star => (
            <InjuryCard
              key={star.id}
              star={star}
              isCreativeDirector={isCreativeDirector()}
              isDark={isDark}
              c={c}
              onClearInjury={() => clearInjury.mutate(star.id)}
            />
          ))}
        </div>

        {/* Flag injury — creative director only */}
        {isCreativeDirector() && (
          <div>
            <h2 style={{ fontSize: fontSize.lg, fontWeight: 500, margin: '0 0 12px', color: c.textSecondary }}>
              Flag injury
            </h2>
            <div style={{
              background: c.surface,
              border: `1px solid ${c.border}`,
              borderRadius: '10px',
              padding: '18px 20px',
              boxShadow: c.shadow,
            }}>
              <p style={{ fontSize: fontSize.sm, color: c.textTertiary, margin: '0 0 14px' }}>
                Select an active star to flag as injured. The solver will generate backup plans.
              </p>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {activeStars.map(star => (
                  <button
                    key={star.id}
                    onClick={() => setFlagging(star.id)}
                    style={{
                      fontSize: fontSize.sm, padding: '7px 14px', borderRadius: '6px', cursor: 'pointer',
                      background: flagging === star.id
                        ? isDark ? 'rgba(239,68,68,0.15)' : '#fef2f2'
                        : c.surfaceAlt,
                      color: flagging === star.id ? '#dc2626' : c.textSecondary,
                      border: `1px solid ${flagging === star.id ? 'rgba(239,68,68,0.4)' : c.border}`,
                    }}
                  >
                    {star.name}
                  </button>
                ))}
              </div>

              {flagging && (
                <div style={{ marginTop: '16px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span style={{ fontSize: fontSize.sm, color: c.textSecondary }}>
                    Flag {activeStars.find(s => s.id === flagging)?.name} as injured?
                  </span>
                  <button
                    onClick={() => flagInjury.mutate(flagging)}
                    disabled={flagInjury.isPending}
                    style={{
                      fontSize: fontSize.sm, padding: '7px 16px', borderRadius: '6px',
                      cursor: 'pointer', fontWeight: 500,
                      background: '#dc2626', color: 'white', border: 'none',
                    }}
                  >
                    {flagInjury.isPending ? 'Flagging...' : 'Confirm'}
                  </button>
                  <button
                    onClick={() => setFlagging(null)}
                    style={{
                      fontSize: fontSize.sm, padding: '7px 14px', borderRadius: '6px',
                      cursor: 'pointer', background: 'transparent',
                      color: c.textTertiary, border: `1px solid ${c.border}`,
                    }}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

function InjuryCard({ star, isCreativeDirector, isDark, c, onClearInjury }: {
  star: Star
  isCreativeDirector: boolean
  isDark: boolean
  c: ReturnType<typeof themeColors>
  onClearInjury: () => void
}) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div style={{
      borderRadius: '10px', overflow: 'hidden',
      border: `1px solid rgba(220,38,38,0.3)`,
      borderLeft: '4px solid #dc2626',
    }}>
      <div
        onClick={() => setExpanded(!expanded)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px',
          background: isDark ? 'rgba(239,68,68,0.08)' : '#fef2f2',
          cursor: 'pointer',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#dc2626', flexShrink: 0 }} />
          <div>
            <p style={{ fontSize: fontSize.md, fontWeight: 500, margin: '0 0 2px', color: c.textPrimary }}>
              {star.name} — Injured
            </p>
            <p style={{ fontSize: fontSize.sm, color: c.textSecondary, margin: 0 }}>
              {star.brand === 'raw' ? 'Raw' : 'SmackDown'} · {star.scheduleType.replace(/_/g, ' ')}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {isCreativeDirector ? (
            <button
              onClick={e => { e.stopPropagation(); onClearInjury() }}
              style={{
                fontSize: fontSize.sm, padding: '6px 14px', borderRadius: '6px', cursor: 'pointer',
                background: isDark ? 'rgba(34,197,94,0.15)' : '#dcfce7',
                color: isDark ? '#4ade80' : '#166534',
                border: `1px solid ${isDark ? 'rgba(34,197,94,0.3)' : 'rgba(22,101,52,0.25)'}`,
              }}
            >
              Clear injury
            </button>
          ) : (
            <button
              onClick={e => e.stopPropagation()}
              style={{
                fontSize: fontSize.sm, padding: '6px 14px', borderRadius: '6px', cursor: 'pointer',
                background: c.goldDim, color: c.gold, border: `1px solid ${c.goldBorder}`,
              }}
            >
              Escalate to Creative Director
            </button>
          )}
          <span style={{ color: c.textHint, fontSize: '18px' }}>
            {expanded ? '∨' : '›'}
          </span>
        </div>
      </div>

      {expanded && (
        <div style={{ padding: '14px 20px', background: c.surfaceAlt }}>
          <p style={{ fontSize: fontSize.xs, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: c.textTertiary, margin: '0 0 10px' }}>
            Solver backup plans
          </p>
          <p style={{ fontSize: fontSize.sm, color: c.textSecondary, margin: 0 }}>
            Flag this star as injured from the panel below to generate backup plans.
          </p>
        </div>
      )}
    </div>
  )
}