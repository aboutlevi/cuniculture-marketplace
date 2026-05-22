import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './lib/AuthContext'
import AuthPage from './pages/AuthPage'
import Dashboard from './pages/Dashboard'
import Explorer from './pages/Explorer'
import EleveurProfile from './pages/EleveurProfile'
import MesProduits from './pages/MesProduits'
import Commandes from './pages/Commandes'
import Messages from './pages/Messages'
import Profil from './pages/Profil'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--cream)' }}>
      <div>
        <div style={{ textAlign: 'center', marginBottom: 20, fontSize: 40 }}>🐇</div>
        <div className="spinner" />
      </div>
    </div>
  )
  return user ? children : <Navigate to="/" replace />
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  return user ? <Navigate to="/dashboard" replace /> : children
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<PublicRoute><AuthPage /></PublicRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/explorer" element={<ProtectedRoute><Explorer /></ProtectedRoute>} />
      <Route path="/eleveur/:id" element={<ProtectedRoute><EleveurProfile /></ProtectedRoute>} />
      <Route path="/mes-produits" element={<ProtectedRoute><MesProduits /></ProtectedRoute>} />
      <Route path="/commandes" element={<ProtectedRoute><Commandes /></ProtectedRoute>} />
      <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
      <Route path="/messages/:id" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
      <Route path="/profil" element={<ProtectedRoute><Profil /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter basename="/cuniculture-marketplace">
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  )
}
