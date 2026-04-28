import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'

export default function Layout({ children }: { children: React.ReactNode }) {
  const { auth, logout, isCreativeDirector } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0a0a0a' }}>

      {/* Top nav */}
      <header
        style={{
          background: '#111',
          borderBottom: '1px solid rgba(201,162,39,0.25)',
        }}
      >
        <div className="flex items-center justify-between px-6 py-0" style={{ height: '56px' }}>

          {/* Logo */}
          <div className="flex items-center gap-6">
            <div
              className="text-lg font-black italic flex-shrink-0"
              style={{ color: '#c9a227', letterSpacing: '-0.02em' }}
            >
              BOOKER<span className="text-white">BOARD</span>
            </div>

            {/* Nav links */}
            <nav className="flex items-center gap-1">
              {isCreativeDirector() && (
                <NavItem to="/year-overview" label="Year Overview" />
              )}
              <NavItem to="/card-builder" label="Card Builder" />
              <NavItem to="/narrative-threads" label="Threads" />
              <NavItem to="/star-roster" label="Roster" />
              <NavItem to="/injury-alerts" label="Injury Alerts" />
            </nav>
          </div>

          {/* Right side — role badge + email + sign out */}
          <div className="flex items-center gap-4">
            <div
              className="text-xs font-bold uppercase tracking-wider px-2 py-1 rounded"
              style={{
                background: isCreativeDirector()
                  ? 'rgba(201,162,39,0.15)'
                  : 'rgba(99,102,241,0.15)',
                color: isCreativeDirector() ? '#c9a227' : '#818cf8',
                border: `1px solid ${isCreativeDirector() ? 'rgba(201,162,39,0.3)' : 'rgba(99,102,241,0.3)'}`,
              }}
            >
              {isCreativeDirector() ? 'Creative Director' : 'Lead Writer'}
            </div>

            <div className="text-xs text-gray-500 hidden md:block">
              {auth.user?.email}
            </div>

            <button
              onClick={handleLogout}
              className="text-xs font-medium px-3 py-1.5 rounded transition-colors"
              style={{
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

function NavItem({ to, label }: { to: string; label: string }) {
  return (
    <NavLink
      to={to}
      className="text-sm font-medium px-3 py-1.5 rounded transition-colors"
      style={({ isActive }) => ({
        color: isActive ? '#000' : 'rgba(255,255,255,0.5)',
        background: isActive ? '#c9a227' : 'transparent',
      })}
    >
      {label}
    </NavLink>
  )
}