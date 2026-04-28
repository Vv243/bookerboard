import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../lib/auth'
import Layout from '../components/Layout'
import api from '../lib/api'
import type { Star } from '../types/index'

export default function StarRosterView() {
  const { isCreativeDirector } = useAuth()
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

  return (
    <Layout>
      <div className="p-6 text-white">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Star Roster</h1>
            <p className="text-gray-500 text-sm mt-1">{stars.length} superstars</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-6">
          <input
            type="text"
            placeholder="Search stars..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="px-3 py-2 rounded text-sm text-white focus:outline-none"
            style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', width: '220px' }}
          />

          <select
            value={brandFilter}
            onChange={e => setBrandFilter(e.target.value as any)}
            className="px-3 py-2 rounded text-sm text-white focus:outline-none"
            style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            <option value="all">All Brands</option>
            <option value="raw">Raw</option>
            <option value="smackdown">SmackDown</option>
          </select>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 rounded text-sm text-white focus:outline-none"
            style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="injured">Injured</option>
          </select>
        </div>

        {/* Table */}
        {isLoading && (
          <div className="text-gray-500 text-sm">Loading roster...</div>
        )}

        {error && (
          <div className="text-red-400 text-sm">Failed to load roster.</div>
        )}

        {!isLoading && (
          <div className="rounded-lg overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: '#161616', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-500">Name</th>
                  <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-500">Brand</th>
                  <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-500">Alignment</th>
                  <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-500">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-500">Schedule</th>
                  <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-500">Workload</th>
                  {isCreativeDirector() && (
                    <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-500">Backstage</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {filtered.map((star, i) => (
                  <tr
                    key={star.id}
                    style={{
                      background: i % 2 === 0 ? '#111' : '#131313',
                      borderBottom: '1px solid rgba(255,255,255,0.04)',
                    }}
                  >
                    <td className="px-4 py-3 font-medium text-white">{star.name}</td>
                    <td className="px-4 py-3">
                      <BrandBadge brand={star.brand} />
                    </td>
                    <td className="px-4 py-3">
                      <AlignmentBadge alignment={star.alignment} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={star.status} />
                    </td>
                    <td className="px-4 py-3 text-gray-400 capitalize">
                      {star.scheduleType.replace('_', ' ')}
                    </td>
                    <td className="px-4 py-3 text-gray-400">
                      {star.workloadThisMonth} this month
                    </td>
                    {isCreativeDirector() && (
                      <td className="px-4 py-3">
                        {star.backstageScoreBelowThreshold ? (
                          <span className="text-xs text-red-400 font-medium">⚠ Risk</span>
                        ) : (
                          <span className="text-xs text-gray-600">—</span>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>

            {filtered.length === 0 && (
              <div className="text-center py-12 text-gray-600 text-sm">
                No stars match your filters
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  )
}

function BrandBadge({ brand }: { brand: string }) {
  const isRaw = brand === 'raw'
  return (
    <span
      className="text-xs font-bold uppercase px-2 py-0.5 rounded"
      style={{
        background: isRaw ? 'rgba(220,38,38,0.15)' : 'rgba(37,99,235,0.15)',
        color: isRaw ? '#f87171' : '#60a5fa',
        border: `1px solid ${isRaw ? 'rgba(220,38,38,0.3)' : 'rgba(37,99,235,0.3)'}`,
      }}
    >
      {brand === 'smackdown' ? 'SD' : brand.toUpperCase()}
    </span>
  )
}

function AlignmentBadge({ alignment }: { alignment: string }) {
  const colors: Record<string, { bg: string; text: string; border: string }> = {
    face: { bg: 'rgba(34,197,94,0.15)', text: '#4ade80', border: 'rgba(34,197,94,0.3)' },
    heel: { bg: 'rgba(239,68,68,0.15)', text: '#f87171', border: 'rgba(239,68,68,0.3)' },
    neutral: { bg: 'rgba(156,163,175,0.15)', text: '#9ca3af', border: 'rgba(156,163,175,0.3)' },
  }
  const c = colors[alignment] || colors.neutral
  return (
    <span
      className="text-xs font-bold uppercase px-2 py-0.5 rounded"
      style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}` }}
    >
      {alignment}
    </span>
  )
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, { bg: string; text: string; border: string }> = {
    active: { bg: 'rgba(34,197,94,0.15)', text: '#4ade80', border: 'rgba(34,197,94,0.3)' },
    injured: { bg: 'rgba(239,68,68,0.15)', text: '#f87171', border: 'rgba(239,68,68,0.3)' },
    suspended: { bg: 'rgba(234,179,8,0.15)', text: '#facc15', border: 'rgba(234,179,8,0.3)' },
  }
  const c = colors[status] || colors.active
  return (
    <span
      className="text-xs font-bold uppercase px-2 py-0.5 rounded"
      style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}` }}
    >
      {status}
    </span>
  )
}