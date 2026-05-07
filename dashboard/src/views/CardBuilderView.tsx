import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Layout from '../components/Layout'
import { useAuth } from '../lib/auth'
import { useTheme } from '../lib/theme'
import { themeColors, fontSize } from '../lib/styles'
import api from '../lib/api'
import StarPicker from '../components/StarPicker'
import type { Star } from '../types/index'

interface CardSegment {
  id: number
  segmentType: string
  segmentOrder: number
  durationMinutes: number
  status: string
  contendershipReason?: string
  narrativeThreadName?: string
  stars: string[]
}

interface CardData {
  eventId: number
  eventName: string
  eventType: string
  contentMinutes: number
  constraintType: 'soft' | 'hard'
  totalMinutes: number
  segments: CardSegment[]
}

const segmentTypeConfig: Record<string, { label: string; color: string }> = {
  promo:              { label: 'Promo',         color: '#3b82f6' },
  match:              { label: 'Match',         color: '#8b5cf6' },
  championship_match: { label: 'Title Match',   color: '#c9a227' },
  backstage:          { label: 'Backstage',     color: '#6b7280' },
  video_package:      { label: 'Video Package', color: '#6b7280' },
  special_match:      { label: 'Special Match', color: '#ec4899' },
}

const SHOWS = [
  { id: 9,  label: 'Raw — May 5 2026' },
  { id: 10, label: 'Raw — May 12 2026' },
  { id: 11, label: 'SmackDown — May 8 2026' },
  { id: 12, label: 'SmackDown — May 15 2026' },
]

export default function CardBuilderView() {
  const { isCreativeDirector } = useAuth()
  const { isDark } = useTheme()
  const c = themeColors(isDark)
  const queryClient = useQueryClient()

  const [selectedEventId, setSelectedEventId] = useState(9)
  const [localSegments, setLocalSegments] = useState<CardSegment[] | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [newSegType, setNewSegType] = useState('promo')
  const [newSegDuration, setNewSegDuration] = useState(10)
  const [newSegStars, setNewSegStars] = useState<Star[]>([])
  const [editingSegment, setEditingSegment] = useState<CardSegment | null>(null)
  const [editStars, setEditStars] = useState<Star[]>([])

  const dragIndex = useRef<number | null>(null)

  // Fetch card data
  const { data: card, isLoading } = useQuery({
    queryKey: ['card', selectedEventId],
    queryFn: async () => {
      const res = await api.get<CardData>(`/card?event_id=${selectedEventId}`)
      return res.data
    },
  })

  // Fetch all stars for the picker
  const { data: allStars = [] } = useQuery({
    queryKey: ['stars'],
    queryFn: async () => {
      const res = await api.get<Star[]>('/stars')
      return res.data
    },
  })

  const segments = localSegments ?? card?.segments ?? []

  const reorderMutation = useMutation({
    mutationFn: async (segmentIds: number[]) => {
      await api.patch(`/card/${selectedEventId}/reorder`, { segmentIds })
    },
    onSuccess: () => {
      setLocalSegments(null)
      queryClient.invalidateQueries({ queryKey: ['card', selectedEventId] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (segmentId: number) => {
      await api.delete(`/card/segments/${segmentId}`)
    },
    onSuccess: () => {
      setLocalSegments(null)
      queryClient.invalidateQueries({ queryKey: ['card', selectedEventId] })
    },
  })

  const addMutation = useMutation({
    mutationFn: async () => {
      await api.post(`/card/${selectedEventId}/segments`, {
        segmentType: newSegType,
        durationMinutes: newSegDuration,
        starIds: newSegStars.map(s => Number(s.id)),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['card', selectedEventId] })
      setShowAddModal(false)
      setNewSegType('promo')
      setNewSegDuration(10)
      setNewSegStars([])
    },
  })

  const updateStarsMutation = useMutation({
    mutationFn: async ({ segmentId, starIds }: { segmentId: number; starIds: string[] }) => {
      await api.patch(`/card/segments/${segmentId}/stars`, { starIds: starIds.map(Number) })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['card', selectedEventId] })
      setEditingSegment(null)
      setEditStars([])
    },
  })

  const handleDragStart = (index: number) => {
    dragIndex.current = index
    if (!localSegments && card) setLocalSegments([...card.segments])
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (dragIndex.current === null || dragIndex.current === index) return
    const current = localSegments ?? card?.segments ?? []
    const reordered = [...current]
    const dragged = reordered.splice(dragIndex.current, 1)[0]
    reordered.splice(index, 0, dragged)
    dragIndex.current = index
    setLocalSegments(reordered)
  }

  const handleDrop = () => {
    dragIndex.current = null
    if (localSegments) reorderMutation.mutate(localSegments.map(s => s.id))
  }

  const openEditModal = (seg: CardSegment) => {
    setEditingSegment(seg)
    // Pre-populate with stars already assigned to this segment
    const preSelected = allStars.filter(s => seg.stars.includes(s.name))
    setEditStars(preSelected)
  }

  const totalMinutes = segments.reduce((sum, s) => sum + s.durationMinutes, 0)
  const contentMinutes = card?.contentMinutes ?? 150
  const constraintType = card?.constraintType ?? 'soft'
  const pct = Math.round((totalMinutes / contentMinutes) * 100)

  const getBudgetState = () => {
    if (pct < 80) return { color: '#22c55e', label: 'On budget' }
    if (pct <= 100) return { color: '#f59e0b', label: 'Approaching limit' }
    if (constraintType === 'soft') return { color: '#ef4444', label: 'Over limit — warning' }
    return { color: '#ef4444', label: 'Over limit — blocked' }
  }

  const budget = getBudgetState()
  const isBlocked = totalMinutes > contentMinutes && constraintType === 'hard'

  const cardStyle = {
    background: c.surface,
    border: `1px solid ${c.border}`,
    borderRadius: '10px',
    boxShadow: c.shadow,
  }

  const inputStyle = {
    background: c.surface,
    border: `1px solid ${c.border}`,
    color: c.textPrimary,
    fontSize: fontSize.sm,
    padding: '8px 12px',
    borderRadius: '6px',
    outline: 'none',
    width: '100%',
  }

  return (
    <Layout>
      <div style={{ padding: '24px', color: c.textPrimary }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <div>
            <h1 style={{ fontSize: fontSize.xxl, fontWeight: 500, margin: '0 0 4px', color: c.textPrimary }}>
              Card Builder
            </h1>
            <p style={{ fontSize: fontSize.sm, color: c.textTertiary, margin: 0 }}>
              {card ? card.eventName : 'Select a show'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: fontSize.sm, color: c.textTertiary }}>Show:</span>
            <select
              value={selectedEventId}
              onChange={e => { setLocalSegments(null); setSelectedEventId(Number(e.target.value)) }}
              style={{ ...inputStyle, width: 'auto' }}
            >
              {SHOWS.map(s => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>
          </div>
        </div>

        {isLoading && (
          <p style={{ fontSize: fontSize.sm, color: c.textTertiary }}>Loading card...</p>
        )}

        {card && (
          <>
            {/* Broadcast budget */}
            <div style={{ ...cardStyle, padding: '18px 20px', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <p style={{ fontSize: fontSize.base, fontWeight: 500, margin: 0, color: c.textPrimary }}>
                    Broadcast budget
                  </p>
                  <span style={{
                    background: constraintType === 'soft' ? '#1e3a5f' : '#3b1f6e',
                    color: constraintType === 'soft' ? '#93c5fd' : '#c4b5fd',
                    fontSize: '11px', fontWeight: 700, padding: '3px 8px',
                    borderRadius: '0', textTransform: 'uppercase' as const, letterSpacing: '0.06em',
                  }}>
                    {constraintType === 'soft' ? 'Soft constraint' : 'Hard constraint'}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: fontSize.sm, color: c.textSecondary }}>
                    {totalMinutes} / {contentMinutes} min
                  </span>
                  <span style={{
                    fontSize: '11px', fontWeight: 700, padding: '3px 8px',
                    borderRadius: '0', textTransform: 'uppercase' as const, letterSpacing: '0.06em',
                    background: budget.color === '#22c55e' ? '#166534'
                      : budget.color === '#f59e0b' ? '#78350f' : '#7f1d1d',
                    color: budget.color === '#22c55e' ? '#bbf7d0'
                      : budget.color === '#f59e0b' ? '#fde68a' : '#fca5a5',
                  }}>
                    {budget.label}
                  </span>
                </div>
              </div>
              <div style={{ height: '10px', borderRadius: '5px', background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)', overflow: 'hidden' }}>
                <div style={{
                  height: '100%', width: `${Math.min(pct, 100)}%`,
                  background: budget.color, borderRadius: '5px',
                  transition: 'width 0.3s ease',
                }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
                <span style={{ fontSize: fontSize.xs, color: c.textTertiary }}>0 min</span>
                <span style={{ fontSize: fontSize.xs, color: c.textTertiary }}>{contentMinutes} min limit</span>
              </div>
            </div>

            {/* Segment list */}
            <div style={{ ...cardStyle, overflow: 'hidden', marginBottom: '1.25rem' }}>
              <div style={{
                padding: '12px 20px', background: c.surfaceRaised,
                borderBottom: `1px solid ${c.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <p style={{ fontSize: fontSize.xs, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: c.textTertiary, margin: 0 }}>
                  Segments — {segments.length} total
                  {isCreativeDirector() && (
                    <span style={{ fontSize: fontSize.xs, color: c.textHint, fontWeight: 400, marginLeft: '8px' }}>
                      · drag to reorder
                    </span>
                  )}
                </p>
                <p style={{ fontSize: fontSize.xs, color: c.textTertiary, margin: 0 }}>
                  {totalMinutes} min booked
                </p>
              </div>

              {segments.map((seg, i) => {
                const typeConfig = segmentTypeConfig[seg.segmentType] || { label: seg.segmentType, color: '#6b7280' }
                return (
                  <div
                    key={seg.id}
                    draggable={isCreativeDirector()}
                    onDragStart={() => handleDragStart(i)}
                    onDragOver={e => handleDragOver(e, i)}
                    onDrop={handleDrop}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '16px',
                      padding: '16px 20px',
                      background: i % 2 === 0 ? c.surface : c.surfaceAlt,
                      borderBottom: `1px solid ${c.borderSubtle}`,
                      borderLeft: `4px solid ${typeConfig.color}`,
                      cursor: isCreativeDirector() ? 'grab' : 'default',
                      userSelect: 'none',
                    }}
                  >
                    {isCreativeDirector() && (
                      <span style={{ fontSize: '16px', color: c.textHint, flexShrink: 0 }}>⠿</span>
                    )}
                    <span style={{ fontSize: fontSize.xs, fontWeight: 700, color: c.textHint, width: '20px', flexShrink: 0, textAlign: 'center' }}>
                      {i + 1}
                    </span>
                    <span style={{
                      fontSize: '11px', fontWeight: 700, padding: '3px 8px',
                      borderRadius: '0', textTransform: 'uppercase' as const,
                      letterSpacing: '0.06em', flexShrink: 0,
                      background: typeConfig.color, color: 'white',
                    }}>
                      {typeConfig.label}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: fontSize.md, fontWeight: 500, margin: '0 0 3px', color: c.textPrimary }}>
                        {seg.stars.length > 0 ? seg.stars.join(' vs ') : 'No stars assigned'}
                      </p>
                      {seg.narrativeThreadName && (
                        <p style={{ fontSize: fontSize.sm, color: c.textTertiary, margin: 0 }}>
                          {seg.narrativeThreadName}
                        </p>
                      )}
                    </div>
                    <span style={{ fontSize: fontSize.sm, color: c.textSecondary, flexShrink: 0 }}>
                      {seg.durationMinutes} min
                    </span>
                    {seg.contendershipReason && (
                      <span style={{
                        fontSize: '11px', fontWeight: 700, padding: '3px 8px',
                        borderRadius: '0', textTransform: 'uppercase' as const, letterSpacing: '0.06em',
                        background: isDark ? 'rgba(201,162,39,0.15)' : 'rgba(160,125,26,0.12)',
                        color: c.gold, border: `1px solid ${c.goldBorder}`,
                      }}>
                        {seg.contendershipReason.replace(/_/g, ' ')}
                      </span>
                    )}
                    {isCreativeDirector() && (
                      <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                        <button
                          onClick={() => openEditModal(seg)}
                          style={{
                            fontSize: '12px', padding: '4px 10px', borderRadius: '4px',
                            cursor: 'pointer', background: 'transparent',
                            color: c.textSecondary, border: `1px solid ${c.border}`,
                          }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteMutation.mutate(seg.id)}
                          style={{
                            fontSize: '13px', padding: '4px 10px', borderRadius: '4px',
                            cursor: 'pointer', background: 'transparent',
                            color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)',
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}

              {segments.length === 0 && (
                <div style={{ textAlign: 'center', padding: '3rem', fontSize: fontSize.sm, color: c.textTertiary }}>
                  No segments — add one below
                </div>
              )}
            </div>

            {isCreativeDirector() && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button
                  onClick={() => setShowAddModal(true)}
                  style={{
                    fontSize: fontSize.sm, fontWeight: 700, padding: '10px 24px',
                    borderRadius: '7px', cursor: 'pointer',
                    background: 'transparent', color: c.textSecondary,
                    border: `1px solid ${c.border}`,
                    textTransform: 'uppercase' as const, letterSpacing: '0.08em',
                  }}
                >
                  + Add segment
                </button>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <button
                    onClick={() => reorderMutation.mutate(segments.map(s => s.id))}
                    disabled={reorderMutation.isPending}
                    style={{
                      fontSize: fontSize.sm, fontWeight: 700, padding: '12px 24px',
                      borderRadius: '7px', cursor: 'pointer',
                      background: 'transparent', color: c.textSecondary,
                      border: `1px solid ${c.border}`,
                      textTransform: 'uppercase' as const, letterSpacing: '0.08em',
                    }}
                  >
                    {reorderMutation.isPending ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    disabled={isBlocked}
                    style={{
                      fontSize: fontSize.base, fontWeight: 700, padding: '12px 32px',
                      borderRadius: '7px', cursor: isBlocked ? 'not-allowed' : 'pointer',
                      background: isBlocked ? (isDark ? 'rgba(255,255,255,0.05)' : '#e5e5e5') : c.gold,
                      color: isBlocked ? c.textHint : '#000', border: 'none',
                      textTransform: 'uppercase' as const, letterSpacing: '0.08em',
                    }}
                  >
                    {isBlocked ? 'Blocked — hard constraint exceeded' : 'Finalize card'}
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Add segment modal */}
        {showAddModal && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 50,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{
              background: c.surface, border: `1px solid ${c.border}`,
              borderRadius: '12px', padding: '24px', width: '440px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
              maxHeight: '90vh', overflowY: 'auto',
            }}>
              <h2 style={{ fontSize: fontSize.lg, fontWeight: 500, margin: '0 0 20px', color: c.textPrimary }}>
                Add segment
              </h2>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: fontSize.xs, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: c.textTertiary, display: 'block', marginBottom: '6px' }}>
                  Segment type
                </label>
                <select value={newSegType} onChange={e => setNewSegType(e.target.value)} style={inputStyle}>
                  {Object.entries(segmentTypeConfig).map(([key, val]) => (
                    <option key={key} value={key}>{val.label}</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: fontSize.xs, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: c.textTertiary, display: 'block', marginBottom: '6px' }}>
                  Duration (minutes)
                </label>
                <input
                  type="number" min={1} max={60}
                  value={newSegDuration}
                  onChange={e => setNewSegDuration(Number(e.target.value))}
                  style={inputStyle}
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ fontSize: fontSize.xs, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: c.textTertiary, display: 'block', marginBottom: '6px' }}>
                  Stars
                </label>
                <StarPicker
                  stars={allStars}
                  selected={newSegStars}
                  onChange={setNewSegStars}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => { setShowAddModal(false); setNewSegStars([]) }}
                  style={{
                    fontSize: fontSize.sm, padding: '8px 20px', borderRadius: '6px',
                    cursor: 'pointer', background: 'transparent',
                    color: c.textTertiary, border: `1px solid ${c.border}`,
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => addMutation.mutate()}
                  disabled={addMutation.isPending}
                  style={{
                    fontSize: fontSize.sm, fontWeight: 700, padding: '8px 20px',
                    borderRadius: '6px', cursor: 'pointer',
                    background: c.gold, color: '#000', border: 'none',
                  }}
                >
                  {addMutation.isPending ? 'Adding...' : 'Add segment'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit segment stars modal */}
        {editingSegment && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 50,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{
              background: c.surface, border: `1px solid ${c.border}`,
              borderRadius: '12px', padding: '24px', width: '440px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
              maxHeight: '90vh', overflowY: 'auto',
            }}>
              <h2 style={{ fontSize: fontSize.lg, fontWeight: 500, margin: '0 0 6px', color: c.textPrimary }}>
                Edit segment
              </h2>
              <p style={{ fontSize: fontSize.sm, color: c.textTertiary, margin: '0 0 20px' }}>
                {segmentTypeConfig[editingSegment.segmentType]?.label ?? editingSegment.segmentType}
                {editingSegment.narrativeThreadName && ` · ${editingSegment.narrativeThreadName}`}
              </p>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ fontSize: fontSize.xs, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: c.textTertiary, display: 'block', marginBottom: '6px' }}>
                  Stars
                </label>
                <StarPicker
                  stars={allStars}
                  selected={editStars}
                  onChange={setEditStars}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => { setEditingSegment(null); setEditStars([]) }}
                  style={{
                    fontSize: fontSize.sm, padding: '8px 20px', borderRadius: '6px',
                    cursor: 'pointer', background: 'transparent',
                    color: c.textTertiary, border: `1px solid ${c.border}`,
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => updateStarsMutation.mutate({
                    segmentId: editingSegment.id,
                    starIds: editStars.map(s => s.id),
                  })}
                  disabled={updateStarsMutation.isPending}
                  style={{
                    fontSize: fontSize.sm, fontWeight: 700, padding: '8px 20px',
                    borderRadius: '6px', cursor: 'pointer',
                    background: c.gold, color: '#000', border: 'none',
                  }}
                >
                  {updateStarsMutation.isPending ? 'Saving...' : 'Save stars'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}