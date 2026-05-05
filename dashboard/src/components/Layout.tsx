import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { useTheme } from '../lib/theme'
import { themeColors } from '../lib/styles'

export default function Layout({ children }: { children: React.ReactNode }) {
  const { auth, logout, isCreativeDirector } = useAuth()
  const navigate = useNavigate()
  const { isDark, toggleTheme } = useTheme()
  const c = themeColors(isDark)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: c.bg, color: c.textPrimary }}
    >
      {/* Top nav */}
      <header style={{
        background: c.surface,
        borderBottom: `1px solid ${c.goldBorder}`,
      }}>
        <div className="flex items-center justify-between px-6 py-0" style={{ height: '56px' }}>

          {/* Logo + nav */}
          <div className="flex items-center gap-6">
            <div
              className="text-lg font-black italic flex-shrink-0"
              style={{ color: c.gold, letterSpacing: '-0.02em' }}
            >
              BOOKER<span style={{ color: c.textPrimary }}>BOARD</span>
            </div>

            <nav className="flex items-center gap-1">
              {isCreativeDirector() && (
                <NavItem to="/year-overview" label="Year Overview" isDark={isDark} c={c} />
              )}
              <NavItem to="/card-builder" label="Card Builder" isDark={isDark} c={c} />
              <NavItem to="/narrative-threads" label="Threads" isDark={isDark} c={c} />
              <NavItem to="/star-roster" label="Roster" isDark={isDark} c={c} />
              <NavItem to="/injury-alerts" label="Injury Alerts" isDark={isDark} c={c} />
            </nav>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* Role badge */}
            <div
              className="text-xs font-bold uppercase tracking-wider px-2 py-1"
              style={{
                background: isCreativeDirector() ? c.goldDim : 'rgba(99,102,241,0.15)',
                color: isCreativeDirector() ? c.gold : '#818cf8',
                border: `1px solid ${isCreativeDirector() ? c.goldBorder : 'rgba(99,102,241,0.3)'}`,
              }}
            >
              {isCreativeDirector() ? 'Creative Director' : 'Lead Writer'}
            </div>

            {/* Email */}
            <div style={{ fontSize: '13px', color: c.textTertiary }} className="hidden md:block">
              {auth.user?.email}
            </div>

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              style={{
                fontSize: '13px',
                padding: '5px 12px',
                borderRadius: '6px',
                cursor: 'pointer',
                background: 'transparent',
                color: c.textSecondary,
                border: `1px solid ${c.border}`,
              }}
            >
              {isDark ? '☀ Light' : '◑ Dark'}
            </button>

            {/* Sign out */}
            <button
              onClick={handleLogout}
              style={{
                fontSize: '13px',
                fontWeight: 500,
                padding: '5px 12px',
                borderRadius: '6px',
                cursor: 'pointer',
                background: 'transparent',
                color: '#ef4444',
                border: '1px solid rgba(239,68,68,0.3)',
              }}
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Page content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}

function NavItem({ to, label, isDark, c }: {
  to: string
  label: string
  isDark: boolean
  c: ReturnType<typeof themeColors>
}) {
  return (
    <NavLink
      to={to}
      className="text-sm font-medium px-3 py-1.5 transition-colors"
      style={({ isActive }) => ({
        color: isActive ? '#000' : c.textSecondary,
        background: isActive ? c.gold : 'transparent',
        borderRadius: '4px',
      })}
    >
      {label}
    </NavLink>
  )
}