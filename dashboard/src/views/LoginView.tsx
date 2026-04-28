import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import api from '../lib/api'

export default function LoginView() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const { login, isCreativeDirector } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const response = await api.post('/auth/login', { email, password })
      const { token, user } = response.data
      login(token, user)
      navigate(isCreativeDirector() ? '/year-overview' : '/card-builder')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center relative"
      style={{
        backgroundImage: `url('https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1920&q=80')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Dark overlay */}
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(135deg, rgba(0,0,0,0.85) 0%, rgba(20,0,0,0.9) 100%)' }}
      />

      {/* Content */}
      <div className="relative z-10 w-full max-w-md px-4">

        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-block mb-4">
            <div
              className="text-5xl font-black tracking-tight text-white px-4 py-2"
              style={{
                fontStyle: 'italic',
                textShadow: '3px 3px 0px #c9a227, -1px -1px 0px #8b6914',
                letterSpacing: '-0.02em',
              }}
            >
              BOOKER
              <span style={{ color: '#c9a227' }}>BOARD</span>
            </div>
          </div>
          <div
            className="text-xs font-bold tracking-widest uppercase"
            style={{ color: '#c9a227', letterSpacing: '0.3em' }}
          >
            WWE Creative Planning System
          </div>
          <div className="mt-3 h-px w-24 mx-auto" style={{ background: '#c9a227' }} />
        </div>

        {/* Form card */}
        <div
          className="rounded-lg p-8 space-y-5"
          style={{
            background: 'rgba(10, 10, 10, 0.85)',
            border: '1px solid rgba(201, 162, 39, 0.3)',
            backdropFilter: 'blur(12px)',
          }}
        >
          {/* Error */}
          {error && (
            <div
              className="px-4 py-3 rounded text-sm font-medium"
              style={{
                background: 'rgba(180, 20, 20, 0.3)',
                border: '1px solid rgba(220, 50, 50, 0.5)',
                color: '#fca5a5',
              }}
            >
              {error}
            </div>
          )}

          {/* Email */}
          <div>
            <label
              className="block text-xs font-bold uppercase tracking-wider mb-2"
              style={{ color: '#c9a227' }}
            >
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded px-4 py-3 text-white text-sm focus:outline-none"
              style={{
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(201, 162, 39, 0.3)',
                transition: 'border-color 0.2s',
              }}
              placeholder="you@bookerboard.com"
            />
          </div>

          {/* Password */}
          <div>
            <label
              className="block text-xs font-bold uppercase tracking-wider mb-2"
              style={{ color: '#c9a227' }}
            >
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded px-4 py-3 text-white text-sm focus:outline-none"
              style={{
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(201, 162, 39, 0.3)',
              }}
              placeholder="••••••••"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={loading}
            className="w-full font-bold py-3 px-4 rounded text-sm uppercase tracking-widest transition-all"
            style={{
              background: loading
                ? 'rgba(201, 162, 39, 0.4)'
                : 'linear-gradient(135deg, #c9a227 0%, #a07d1a 100%)',
              color: loading ? 'rgba(255,255,255,0.5)' : '#000',
              cursor: loading ? 'not-allowed' : 'pointer',
              letterSpacing: '0.15em',
            }}
          >
            {loading ? 'Signing in...' : 'Enter the Arena'}
          </button>
        </div>

        {/* Footer */}
        <p className="text-center mt-6 text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
          Authorized personnel only
        </p>
      </div>
    </div>
  )
}