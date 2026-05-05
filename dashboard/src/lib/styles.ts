// ============================================================
// BookerBoard Design System
// All views import from here — change once, updates everywhere
// ============================================================

// Base colors
export const colors = {
  bg: '#0a0a0a',
  surface: '#111',
  surfaceAlt: '#131313',
  surfaceRaised: '#161616',
  border: 'rgba(255,255,255,0.1)',
  borderSubtle: 'rgba(255,255,255,0.06)',
  gold: '#c9a227',
  goldDim: 'rgba(201,162,39,0.15)',
  goldBorder: 'rgba(201,162,39,0.3)',
}

// Text
export const text = {
  primary: 'white',
  secondary: 'rgba(255,255,255,0.65)',
  tertiary: 'rgba(255,255,255,0.4)',
  hint: 'rgba(255,255,255,0.25)',
}

// Font sizes — readable for mid-age users
export const fontSize = {
  xs: '11px',
  sm: '13px',
  base: '15px',
  md: '16px',
  lg: '17px',
  xl: '20px',
  xxl: '22px',
  metric: '36px',
  countdown: '48px',
}

// Spacing
export const spacing = {
  cardPad: '18px 20px',
  cardPadSm: '14px 16px',
  rowPad: '16px 20px',
  gap: '12px',
  gapLg: '16px',
}

// Border radius — square tags, rounded cards
export const radius = {
  card: '10px',
  button: '7px',
  tag: '0px',       // hard square — no radius on tags
  badge: '2px',     // very slight on secondary elements
}

// Brand badge styles — hard square, solid fill
export const brandTag = {
  raw: {
    background: '#dc2626',
    color: 'white',
    fontSize: '11px',
    fontWeight: '700',
    padding: '3px 8px',
    borderRadius: '0',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
  },
  smackdown: {
    background: '#1d4ed8',
    color: 'white',
    fontSize: '11px',
    fontWeight: '700',
    padding: '3px 8px',
    borderRadius: '0',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
  },
}

// Status badge styles — hard square
export const statusTag = {
  active: {
    background: '#166534',
    color: '#bbf7d0',
    fontSize: '11px',
    fontWeight: '700',
    padding: '3px 8px',
    borderRadius: '0',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.06em',
  },
  injured: {
    background: '#7f1d1d',
    color: '#fca5a5',
    fontSize: '11px',
    fontWeight: '700',
    padding: '3px 8px',
    borderRadius: '0',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.06em',
  },
  suspended: {
    background: '#78350f',
    color: '#fde68a',
    fontSize: '11px',
    fontWeight: '700',
    padding: '3px 8px',
    borderRadius: '0',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.06em',
  },
}

// Thread status badge styles
export const threadStatusTag = {
  on_track: {
    background: '#166534',
    color: '#bbf7d0',
    fontSize: '11px',
    fontWeight: '700',
    padding: '3px 8px',
    borderRadius: '0',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.06em',
  },
  stalling: {
    background: '#78350f',
    color: '#fde68a',
    fontSize: '11px',
    fontWeight: '700',
    padding: '3px 8px',
    borderRadius: '0',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.06em',
  },
  abandoned: {
    background: '#1c1917',
    color: 'rgba(255,255,255,0.4)',
    fontSize: '11px',
    fontWeight: '700',
    padding: '3px 8px',
    borderRadius: '0',
    border: '1px solid rgba(255,255,255,0.15)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.06em',
  },
}

// Alignment badge styles
export const alignmentTag = {
  face: {
    background: '#166534',
    color: '#bbf7d0',
    fontSize: '11px',
    fontWeight: '700',
    padding: '3px 8px',
    borderRadius: '0',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.06em',
  },
  heel: {
    background: '#7f1d1d',
    color: '#fca5a5',
    fontSize: '11px',
    fontWeight: '700',
    padding: '3px 8px',
    borderRadius: '0',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.06em',
  },
  neutral: {
    background: '#1c1917',
    color: 'rgba(255,255,255,0.5)',
    fontSize: '11px',
    fontWeight: '700',
    padding: '3px 8px',
    borderRadius: '0',
    border: '1px solid rgba(255,255,255,0.15)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.06em',
  },
}

// Schedule type tag
export const scheduleTag = {
  full_time: { background: '#1e3a5f', color: '#93c5fd', fontSize: '11px', fontWeight: '700', padding: '3px 8px', borderRadius: '0', textTransform: 'uppercase' as const, letterSpacing: '0.06em' },
  part_time: { background: '#3b1f6e', color: '#c4b5fd', fontSize: '11px', fontWeight: '700', padding: '3px 8px', borderRadius: '0', textTransform: 'uppercase' as const, letterSpacing: '0.06em' },
  special_appearance: { background: '#1c1917', color: '#c9a227', fontSize: '11px', fontWeight: '700', padding: '3px 8px', borderRadius: '0', border: '1px solid rgba(201,162,39,0.3)', textTransform: 'uppercase' as const, letterSpacing: '0.06em' },
}

// Card base style
export const card = {
  background: '#111',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '10px',
  padding: '18px 20px',
}

// Table row styles
export const tableRow = {
  even: { background: '#111' },
  odd: { background: '#131313' },
  header: { background: '#161616', borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '10px 20px' },
}

// Todo tier styles
export const todoTier = {
  blocker: {
    background: 'rgba(127,29,29,0.4)',
    border: '1px solid rgba(239,68,68,0.3)',
    dot: '#dc2626',
    label: '#f87171',
    text: 'rgba(255,255,255,0.85)',
  },
  warning: {
    background: 'rgba(120,53,15,0.4)',
    border: '1px solid rgba(245,158,11,0.3)',
    dot: '#f59e0b',
    label: '#fbbf24',
    text: 'rgba(255,255,255,0.85)',
  },
  decision: {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.1)',
    dot: 'rgba(255,255,255,0.3)',
    label: 'rgba(255,255,255,0.4)',
    text: 'rgba(255,255,255,0.75)',
  },
}

// Theme-aware colors — call with isDark boolean
export const themeColors = (isDark: boolean) => ({
  bg: isDark ? '#0a0a0a' : '#f5f3ef',
  surface: isDark ? '#111' : '#ffffff',
  surfaceAlt: isDark ? '#131313' : '#f9f8f5',
  surfaceRaised: isDark ? '#161616' : '#ffffff',
  border: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
  borderSubtle: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
  shadow: isDark ? 'none' : '0 1px 3px rgba(0,0,0,0.06)',
  gold: isDark ? '#c9a227' : '#a07d1a',
  goldDim: isDark ? 'rgba(201,162,39,0.15)' : 'rgba(160,125,26,0.12)',
  goldBorder: isDark ? 'rgba(201,162,39,0.3)' : 'rgba(160,125,26,0.25)',
  textPrimary: isDark ? 'white' : '#1a1a1a',
  textSecondary: isDark ? 'rgba(255,255,255,0.65)' : '#555',
  textTertiary: isDark ? 'rgba(255,255,255,0.4)' : '#999',
  textHint: isDark ? 'rgba(255,255,255,0.25)' : '#bbb',
})

// Theme-aware tag styles
export const themeTag = (isDark: boolean) => ({
  raw: { background: '#dc2626', color: 'white', fontSize: '11px', fontWeight: '700', padding: '3px 8px', borderRadius: '0', textTransform: 'uppercase' as const, letterSpacing: '0.08em' },
  smackdown: { background: '#1d4ed8', color: 'white', fontSize: '11px', fontWeight: '700', padding: '3px 8px', borderRadius: '0', textTransform: 'uppercase' as const, letterSpacing: '0.08em' },
  face: { background: isDark ? '#166534' : '#14532d', color: isDark ? '#bbf7d0' : '#bbf7d0', fontSize: '11px', fontWeight: '700', padding: '3px 8px', borderRadius: '0', textTransform: 'uppercase' as const, letterSpacing: '0.06em' },
  heel: { background: isDark ? '#7f1d1d' : '#991b1b', color: isDark ? '#fca5a5' : '#fee2e2', fontSize: '11px', fontWeight: '700', padding: '3px 8px', borderRadius: '0', textTransform: 'uppercase' as const, letterSpacing: '0.06em' },
  neutral: { background: isDark ? '#1c1917' : '#f5f5f4', color: isDark ? 'rgba(255,255,255,0.5)' : '#666', border: isDark ? '1px solid rgba(255,255,255,0.15)' : '1px solid rgba(0,0,0,0.15)', fontSize: '11px', fontWeight: '700', padding: '3px 8px', borderRadius: '0', textTransform: 'uppercase' as const, letterSpacing: '0.06em' },
  active: { background: isDark ? '#166534' : '#14532d', color: isDark ? '#bbf7d0' : '#bbf7d0', fontSize: '11px', fontWeight: '700', padding: '3px 8px', borderRadius: '0', textTransform: 'uppercase' as const, letterSpacing: '0.06em' },
  injured: { background: isDark ? '#7f1d1d' : '#991b1b', color: isDark ? '#fca5a5' : '#fee2e2', fontSize: '11px', fontWeight: '700', padding: '3px 8px', borderRadius: '0', textTransform: 'uppercase' as const, letterSpacing: '0.06em' },
  suspended: { background: isDark ? '#78350f' : '#92400e', color: isDark ? '#fde68a' : '#fef3c7', fontSize: '11px', fontWeight: '700', padding: '3px 8px', borderRadius: '0', textTransform: 'uppercase' as const, letterSpacing: '0.06em' },
  on_track: { background: isDark ? '#166534' : '#14532d', color: isDark ? '#bbf7d0' : '#bbf7d0', fontSize: '11px', fontWeight: '700', padding: '3px 8px', borderRadius: '0', textTransform: 'uppercase' as const, letterSpacing: '0.06em' },
  stalling: { background: isDark ? '#78350f' : '#92400e', color: isDark ? '#fde68a' : '#fef3c7', fontSize: '11px', fontWeight: '700', padding: '3px 8px', borderRadius: '0', textTransform: 'uppercase' as const, letterSpacing: '0.06em' },
  abandoned: { background: isDark ? '#1c1917' : '#f5f5f4', color: isDark ? 'rgba(255,255,255,0.4)' : '#666', border: isDark ? '1px solid rgba(255,255,255,0.15)' : '1px solid rgba(0,0,0,0.15)', fontSize: '11px', fontWeight: '700', padding: '3px 8px', borderRadius: '0', textTransform: 'uppercase' as const, letterSpacing: '0.06em' },
  full_time: { background: isDark ? '#1e3a5f' : '#1e3a5f', color: isDark ? '#93c5fd' : '#bfdbfe', fontSize: '11px', fontWeight: '700', padding: '3px 8px', borderRadius: '0', textTransform: 'uppercase' as const, letterSpacing: '0.06em' },
  part_time: { background: isDark ? '#3b1f6e' : '#3b1f6e', color: isDark ? '#c4b5fd' : '#ddd6fe', fontSize: '11px', fontWeight: '700', padding: '3px 8px', borderRadius: '0', textTransform: 'uppercase' as const, letterSpacing: '0.06em' },
  special_appearance: { background: 'transparent', color: isDark ? '#c9a227' : '#a07d1a', border: `1px solid ${isDark ? 'rgba(201,162,39,0.3)' : 'rgba(160,125,26,0.3)'}`, fontSize: '11px', fontWeight: '700', padding: '3px 8px', borderRadius: '0', textTransform: 'uppercase' as const, letterSpacing: '0.06em' },
})

// Theme-aware todo tier styles
export const themeTodo = (isDark: boolean) => ({
  blocker: {
    background: isDark ? 'rgba(127,29,29,0.4)' : '#fef2f2',
    border: isDark ? '1px solid rgba(239,68,68,0.3)' : '1px solid rgba(220,38,38,0.2)',
    dot: '#dc2626',
    label: isDark ? '#f87171' : '#b91c1c',
    text: isDark ? 'rgba(255,255,255,0.85)' : '#1a1a1a',
  },
  warning: {
    background: isDark ? 'rgba(120,53,15,0.4)' : '#fffbeb',
    border: isDark ? '1px solid rgba(245,158,11,0.3)' : '1px solid rgba(217,119,6,0.2)',
    dot: '#f59e0b',
    label: isDark ? '#fbbf24' : '#92400e',
    text: isDark ? 'rgba(255,255,255,0.85)' : '#1a1a1a',
  },
  decision: {
    background: isDark ? 'rgba(255,255,255,0.04)' : '#f9f8f5',
    border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.08)',
    dot: isDark ? 'rgba(255,255,255,0.3)' : '#999',
    label: isDark ? 'rgba(255,255,255,0.4)' : '#999',
    text: isDark ? 'rgba(255,255,255,0.75)' : '#555',
  },
})