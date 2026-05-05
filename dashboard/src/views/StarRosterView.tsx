import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../lib/auth'
import { useTheme } from '../lib/theme'
import { themeColors, themeTag, fontSize } from '../lib/styles'
import Layout from '../components/Layout'
import api from '../lib/api'
import type { Star } from '../types/index'

export default function StarRosterView() {
  const { isCreativeDirector } = useAuth()
  const { isDark } = useTheme()
  const c = themeColors(isDark)
  const t = themeTag(isDark)

  const [search, setSearch] = useState('')
  const [brandFilter, setBrandFilter] = useState<'all' | 'raw' | 'smackdown'>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'injured'>('all')

  const { data: stars = [], isLoading, error } = useQuery({
    queryKey: ['stars'],
    queryFn: async () => {
      const res = await api.get<Star[]>('/stars')
      return res.data
    },
  })

  const filtered = stars.filter(star => {
    const matchSearch = star.name.toLowerCase().includes(search.toLowerCase())
    const matchBrand = brandFilter === 'all' || star.brand === brandFilter
    const matchStatus = statusFilter === 'all' || star.status === statusFilter
    return matchSearch && matchBrand && matchStatus
  })

  const thStyle = {
    textAlign: 'left' as const,
    padding: '12px 20px',
    fontSize: fontSize.xs,
    fontWeight: '700',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.1em',
    color: c.textTertiary,
  }

  const inputStyle = {
    background: c.surface,
    border: `1px solid ${c.border}`,
    color: c.textPrimary,
    fontSize: fontSize.sm,
    padding: '8px 12px',
    borderRadius: '6px',
    outline: 'none',
  }

  const selectStyle = {
    background: c.surface,
    border: `1px solid ${c.border}`,
    color: c.textPrimary,
    fontSize: fontSize.sm,
    padding: '8px 12px',
    borderRadius: '6px',
    outline: 'none',
  }

  return (
    <Layout>
      <div style={{ padding: '24px', color: c.textPrimary }}>

        {/* Header */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h1 style={{ fontSize: fontSize.xxl, fontWeight: 500, margin: '0 0 4px', color: c.textPrimary }}>
            Star Roster
          </h1>
          <p style={{ fontSize: fontSize.sm, color: c.textTertiary, margin: 0 }}>
            {stars.length} superstars
          </p>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Search stars..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ ...inputStyle, width: '220px' }}
          />
          <select
            value={brandFilter}
            onChange={e => setBrandFilter(e.target.value as any)}
            style={selectStyle}
          >
            <option value="all">All Brands</option>
            <option value="raw">Raw</option>
            <option value="smackdown">SmackDown</option>
          </select>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
            style={selectStyle}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="injured">Injured</option>
          </select>
        </div>

        {/* Loading / error */}
        {isLoading && (
          <p style={{ fontSize: fontSize.sm, color: c.textTertiary }}>Loading roster...</p>
        )}
        {error && (
          <p style={{ fontSize: fontSize.sm, color: '#f87171' }}>Failed to load roster.</p>
        )}

        {/* Table */}
        {!isLoading && (
          <div style={{
            border: `1px solid ${c.border}`,
            borderRadius: '10px',
            overflow: 'hidden',
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: c.surfaceRaised, borderBottom: `1px solid ${c.border}` }}>
                  <th style={thStyle}>Name</th>
                  <th style={thStyle}>Brand</th>
                  <th style={thStyle}>Alignment</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Schedule</th>
                  <th style={thStyle}>Workload</th>
                  {isCreativeDirector() && <th style={thStyle}>Backstage</th>}
                </tr>
              </thead>
              <tbody>
                {filtered.map((star, i) => (
                  <tr
                    key={star.id}
                    style={{
                      background: i % 2 === 0 ? c.surface : c.surfaceAlt,
                      borderBottom: `1px solid ${c.borderSubtle}`,
                    }}
                  >
                    <td style={{ padding: '14px 20px', fontSize: fontSize.md, fontWeight: 500, color: c.textPrimary }}>
                      {star.name}
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <span style={star.brand === 'raw' ? t.raw : t.smackdown}>
                        {star.brand === 'smackdown' ? 'SD' : 'RAW'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <span style={t[star.alignment as keyof typeof t] || t.neutral}>
                        {star.alignment}
                      </span>
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <span style={t[star.status as keyof typeof t] || t.active}>
                        {star.status}
                      </span>
                    </td>
                    <td style={{ padding: '14px 20px', fontSize: fontSize.sm, color: c.textSecondary }}>
                      <span style={t[star.scheduleType as keyof typeof t] || t.full_time}>
                        {star.scheduleType.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td style={{ padding: '14px 20px', fontSize: fontSize.sm, color: c.textSecondary }}>
                      {star.workloadThisMonth} this month
                    </td>
                    {isCreativeDirector() && (
                      <td style={{ padding: '14px 20px' }}>
                        {star.backstageScoreBelowThreshold ? (
                          <span style={{ fontSize: fontSize.xs, color: '#f87171', fontWeight: 700 }}>⚠ RISK</span>
                        ) : (
                          <span style={{ fontSize: fontSize.sm, color: c.textHint }}>—</span>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>

            {filtered.length === 0 && (
              <div style={{
                textAlign: 'center', padding: '3rem',
                fontSize: fontSize.sm, color: c.textTertiary,
              }}>
                No stars match your filters
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  )
}