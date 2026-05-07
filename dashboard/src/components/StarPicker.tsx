import { useState, useMemo } from 'react'
import { useTheme } from '../lib/theme'
import { themeColors, themeTag, fontSize } from '../lib/styles'
import type { Star } from '../types/index'

interface StarPickerProps {
  stars: Star[]           // all available stars
  selected: Star[]        // currently selected stars
  onChange: (stars: Star[]) => void
}

export default function StarPicker({ stars, selected, onChange }: StarPickerProps) {
  const { isDark } = useTheme()
  const c = themeColors(isDark)
  const t = themeTag(isDark)
  const [search, setSearch] = useState('')

  const selectedIds = new Set(selected.map(s => s.id))

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return stars.filter(s =>
      s.name.toLowerCase().includes(q) && !selectedIds.has(s.id)
    )
  }, [stars, search, selectedIds])

  const addStar = (star: Star) => {
    onChange([...selected, star])
    setSearch('')
  }

  const removeStar = (starId: string) => {
    onChange(selected.filter(s => s.id !== starId))
  }

  const inputStyle = {
    background: c.surfaceAlt,
    border: `1px solid ${c.border}`,
    color: c.textPrimary,
    fontSize: fontSize.sm,
    padding: '7px 12px',
    borderRadius: '6px',
    outline: 'none',
    width: '100%',
  }

  return (
    <div>
      {/* Selected stars */}
      {selected.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
          {selected.map(star => (
            <div
              key={star.id}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                background: c.surfaceRaised,
                border: `1px solid ${c.border}`,
                borderRadius: '4px',
                padding: '3px 8px',
              }}
            >
              <span style={{ fontSize: fontSize.sm, color: c.textPrimary }}>
                {star.name}
              </span>
              <span style={star.brand === 'raw' ? t.raw : t.smackdown}>
                {star.brand === 'raw' ? 'RAW' : 'SD'}
              </span>
              {star.status === 'injured' && (
                <span style={{ ...t.injured, fontSize: '10px' }}>INJURED</span>
              )}
              <button
                onClick={() => removeStar(star.id)}
                style={{
                  background: 'transparent', border: 'none',
                  color: '#ef4444', cursor: 'pointer',
                  fontSize: '14px', padding: '0 2px', lineHeight: 1,
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Search input */}
      <input
        type="text"
        placeholder="Search stars..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={inputStyle}
      />

      {/* Dropdown results */}
      {search.length > 0 && (
        <div style={{
          marginTop: '4px',
          background: c.surface,
          border: `1px solid ${c.border}`,
          borderRadius: '6px',
          overflow: 'hidden',
          maxHeight: '200px',
          overflowY: 'auto',
        }}>
          {filtered.length === 0 && (
            <div style={{ padding: '10px 12px', fontSize: fontSize.sm, color: c.textTertiary }}>
              No stars found
            </div>
          )}
          {filtered.map((star, i) => (
            <div
              key={star.id}
              onClick={() => addStar(star)}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '10px 12px', cursor: 'pointer',
                background: i % 2 === 0 ? c.surface : c.surfaceAlt,
                borderBottom: `1px solid ${c.borderSubtle}`,
              }}
            >
              <span style={{ flex: 1, fontSize: fontSize.base, color: c.textPrimary }}>
                {star.name}
              </span>
              <span style={star.brand === 'raw' ? t.raw : t.smackdown}>
                {star.brand === 'raw' ? 'RAW' : 'SD'}
              </span>
              <span style={t[star.scheduleType as keyof typeof t] || t.full_time}>
                {star.scheduleType.replace(/_/g, ' ')}
              </span>
              {star.status === 'injured' && (
                <span style={t.injured}>INJURED</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}