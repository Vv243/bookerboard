import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './lib/auth'
import LoginView from './views/LoginView'
import YearOverviewView from './views/YearOverviewView'
import CardBuilderView from './views/CardBuilderView'
import NarrativeThreadsView from './views/NarrativeThreadsView'
import StarRosterView from './views/StarRosterView'
import InjuryAlertsView from './views/InjuryAlertsView'

function ProtectedRoute({ children, requireCD = false }: {
  children: React.ReactNode
  requireCD?: boolean
}) {
  const { auth, isCreativeDirector } = useAuth()

  if (!auth.token) return <Navigate to="/login" replace />
  if (requireCD && !isCreativeDirector()) return <Navigate to="/card-builder" replace />

  return <>{children}</>
}

export default function App() {
  const { auth, isCreativeDirector } = useAuth()

  // Redirect logged-in users based on role
  const defaultRoute = isCreativeDirector() ? '/year-overview' : '/card-builder'

  return (
    <Routes>
      <Route path="/login" element={
        auth.token ? <Navigate to={defaultRoute} replace /> : <LoginView />
      } />

      <Route path="/year-overview" element={
        <ProtectedRoute requireCD>
          <YearOverviewView />
        </ProtectedRoute>
      } />

      <Route path="/card-builder" element={
        <ProtectedRoute>
          <CardBuilderView />
        </ProtectedRoute>
      } />

      <Route path="/narrative-threads" element={
        <ProtectedRoute>
          <NarrativeThreadsView />
        </ProtectedRoute>
      } />

      <Route path="/star-roster" element={
        <ProtectedRoute>
          <StarRosterView />
        </ProtectedRoute>
      } />

      <Route path="/injury-alerts" element={
        <ProtectedRoute>
          <InjuryAlertsView />
        </ProtectedRoute>
      } />

      <Route path="*" element={<Navigate to={auth.token ? defaultRoute : '/login'} replace />} />
    </Routes>
  )
}