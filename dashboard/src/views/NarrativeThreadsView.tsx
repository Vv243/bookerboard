import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import Layout from '../components/Layout'
import { useTheme } from '../lib/theme'
import { themeColors, themeTag, fontSize } from '../lib/styles'
import api from '../lib/api'

interface NarrativeThread {
  id: number
  name: string
  brand: 'raw' | 'smackdown'
  status: 'on_track' | 'stalling' | 'abandoned'
  heatTrajectory: 'rising' | 'falling' | 'stable'
  buildWeeksTarget: number
  buildWeeksCompleted: number
  lastSegmentDate?: string
  targetPleName?: string
  stars: string[]
}

const statusBorder = {
  on_track: '#639922',
  stalling: '#BA7517',
  abandoned: '#A32D2D',
}

const heatIcon = { rising: '↑', falling: '↓', stable: '→' }

export default function NarrativeThreadsView() {
  const { isDark } = useTheme()
  const c = themeColors(isDark)
  const t = themeTag(isDark)

  const [selected, setSelected] = useState<NarrativeThread | null>(null)
  const [brandFilter, setBrandFilter] = useState<'all' | 'raw' | 'smackdown'>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'on_track' | 'stalling' | 'abandoned'>('all')

  const { data: threads = [], isLoading } = useQuery({
    queryKey: ['threads'],
    queryFn: async () => {
      const res = await api.get<NarrativeThread[]>('/threads')
      return res.data
    },
  })

  const filtered = threads.filter(thread => {
    const matchBrand = brandFilter === 'all' || thread.brand === brandFilter
    const matchStatus = statusFilter === 'all' || thread.status === statusFilter
    return matchBrand && matchStatus
  })

  const filterBtnStyle = (active: boolean, activeColor?: string) => ({
    fontSize: fontSize.sm,
    padding: '5px 14px',
    borderRadius: '20px',
    cursor: 'pointer',
    background: active ? (activeColor || c.goldDim) : 'transparent',
    color: active ? (activeColor ? 'white' : c.gold) : c.textTertiary,
    border: `1px solid ${active ? (activeColor || c.goldBorder) : c.border}`,
  })

  return (
    <Layout>
      <div style={{ padding: '24px', color: c.textPrimary, display: 'flex', gap: '16px', alignItems: 'flex-start' }}>

        {/* Left — list */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ marginBottom: '1rem' }}>
            <h1 style={{ fontSize: fontSize.xxl, fontWeight: 500, margin: '0 0 4px', color: c.textPrimary }}>
              Narrative Threads
            </h1>
            <p style={{ fontSize: fontSize.sm, color: c.textTertiary, margin: 0 }}>
              {threads.length} active storylines
            </p>
          </div>

          {/* Filters */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '1rem', flexWrap: 'wrap' }}>
            {(['all', 'raw', 'smackdown'] as const).map(b => (
              <button key={b} onClick={() => setBrandFilter(b)} style={filterBtnStyle(brandFilter === b)}>
                {b === 'all' ? 'All' : b === 'raw' ? 'Raw' : 'SmackDown'}
              </button>
            ))}
            <button
              onClick={() => setStatusFilter(statusFilter === 'on_track' ? 'all' : 'on_track')}
              style={filterBtnStyle(statusFilter === 'on_track', '#166534')}
            >
              On track
            </button>
            <button
              onClick={() => setStatusFilter(statusFilter === 'stalling' ? 'all' : 'stalling')}
              style={filterBtnStyle(statusFilter === 'stalling', '#92400e')}
            >
              Stalling
            </button>
            <button
              onClick={() => setStatusFilter(statusFilter === 'abandoned' ? 'all' : 'abandoned')}
              style={filterBtnStyle(statusFilter === 'abandoned', '#7f1d1d')}
            >
              Abandoned
            </button>
          </div>

          {isLoading && (
            <p style={{ fontSize: fontSize.sm, color: c.textTertiary }}>Loading threads...</p>
          )}

          {/* List */}
          <div style={{ border: `1px solid ${c.border}`, borderRadius: '10px', overflow: 'hidden' }}>
            {filtered.map((thread, i) => {
              const borderColor = statusBorder[thread.status]
              const isSelected = selected?.id === thread.id
              const pct = Math.round((thread.buildWeeksCompleted / thread.buildWeeksTarget) * 100)

              return (
                <div
                  key={thread.id}
                  onClick={() => setSelected(isSelected ? null : thread)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '16px',
                    padding: '16px 20px', cursor: 'pointer',
                    background: isSelected
                      ? isDark ? 'rgba(201,162,39,0.08)' : 'rgba(160,125,26,0.06)'
                      : i % 2 === 0 ? c.surface : c.surfaceAlt,
                    borderBottom: `1px solid ${c.borderSubtle}`,
                    borderLeft: `4px solid ${borderColor}`,
                  }}
                >
                  {/* Heat */}
                  <span style={{ fontSize: '20px', width: '28px', flexShrink: 0, color: c.textSecondary }}>
                    {heatIcon[thread.heatTrajectory]}
                  </span>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: fontSize.md, fontWeight: 500, margin: '0 0 4px', color: c.textPrimary }}>
                      {thread.name}
                    </p>
                    <p style={{ fontSize: fontSize.sm, color: c.textTertiary, margin: 0 }}>
                      {thread.stars.join(' · ')}
                    </p>
                  </div>

                  {/* Progress */}
                  <div style={{ width: '130px', flexShrink: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                      <span style={{ fontSize: fontSize.xs, color: c.textTertiary }}>Build weeks</span>
                      <span style={{ fontSize: fontSize.xs, color: c.textTertiary }}>
                        {thread.buildWeeksCompleted}/{thread.buildWeeksTarget}
                      </span>
                    </div>
                    <div style={{ height: '5px', borderRadius: '3px', background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', borderRadius: '3px', width: `${pct}%`, background: borderColor }} />
                    </div>
                  </div>

                  {/* Brand */}
                  <span style={thread.brand === 'raw' ? t.raw : t.smackdown}>
                    {thread.brand === 'raw' ? 'RAW' : 'SD'}
                  </span>

                  {/* Status */}
                  <span style={t[thread.status]}>
                    {thread.status.replace('_', ' ')}
                  </span>

                  <span style={{ color: c.textHint, fontSize: '18px' }}>›</span>
                </div>
              )
            })}

            {filtered.length === 0 && !isLoading && (
              <div style={{ textAlign: 'center', padding: '3rem', fontSize: fontSize.sm, color: c.textTertiary }}>
                No threads match your filters
              </div>
            )}
          </div>
        </div>

        {/* Right — detail panel */}
        {selected && (
          <div style={{
            width: '280px', flexShrink: 0,
            background: c.surface,
            border: `1px solid ${c.border}`,
            borderRadius: '10px',
            overflow: 'hidden',
            boxShadow: c.shadow,
          }}>
            <div style={{ padding: '14px 16px', borderBottom: `1px solid ${c.border}` }}>
              <p style={{ fontSize: fontSize.md, fontWeight: 500, margin: '0 0 4px', color: c.textPrimary }}>
                {selected.name}
              </p>
              <p style={{ fontSize: fontSize.sm, color: c.textTertiary, margin: 0 }}>
                {selected.targetPleName ? `Target: ${selected.targetPleName}` : 'No target PLE set'}
              </p>
            </div>

            <div style={{ padding: '14px 16px' }}>
              <p style={{ fontSize: fontSize.xs, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: c.textTertiary, margin: '0 0 12px' }}>
                Stars involved
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                {selected.stars.map(star => (
                  <div key={star} style={{
                    fontSize: fontSize.base, padding: '8px 12px', borderRadius: '6px',
                    background: c.surfaceAlt, color: c.textPrimary,
                    border: `1px solid ${c.border}`,
                  }}>
                    {star}
                  </div>
                ))}
              </div>

              <p style={{ fontSize: fontSize.xs, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: c.textTertiary, margin: '0 0 8px' }}>
                Build progress
              </p>
              <p style={{ fontSize: fontSize.sm, color: c.textSecondary, margin: '0 0 8px' }}>
                {selected.buildWeeksCompleted} of {selected.buildWeeksTarget} build weeks completed
              </p>
              <div style={{ height: '6px', borderRadius: '3px', background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', overflow: 'hidden', marginBottom: '16px' }}>
                <div style={{
                  height: '100%', borderRadius: '3px',
                  width: `${Math.round((selected.buildWeeksCompleted / selected.buildWeeksTarget) * 100)}%`,
                  background: statusBorder[selected.status],
                }} />
              </div>

              {selected.status === 'stalling' && (
                <div style={{
                  background: isDark ? 'rgba(186,117,23,0.15)' : '#fffbeb',
                  border: `1px solid ${isDark ? 'rgba(186,117,23,0.4)' : 'rgba(186,117,23,0.3)'}`,
                  borderRadius: '8px', padding: '10px 12px',
                }}>
                  <p style={{ fontSize: fontSize.sm, color: isDark ? '#fbbf24' : '#92400e', margin: 0, lineHeight: 1.5 }}>
                    This thread hasn't aired recently. Add a segment to the next card to get back on track.
                  </p>
                </div>
              )}

              {selected.status === 'abandoned' && (
                <div style={{
                  background: isDark ? 'rgba(163,45,45,0.15)' : '#fef2f2',
                  border: `1px solid ${isDark ? 'rgba(163,45,45,0.4)' : 'rgba(163,45,45,0.3)'}`,
                  borderRadius: '8px', padding: '10px 12px',
                }}>
                  <p style={{ fontSize: fontSize.sm, color: isDark ? '#fca5a5' : '#b91c1c', margin: 0, lineHeight: 1.5 }}>
                    This thread has been dark for 7+ weeks. Consider retiring it or assigning a target PLE.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}