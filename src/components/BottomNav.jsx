import { useNavigate, useLocation } from 'react-router-dom'
import { Home, Search, ShoppingBag, MessageCircle, User } from 'lucide-react'
import { useAuth } from '../lib/AuthContext'

export default function BottomNav() {
  const navigate = useNavigate()
  const location = useLocation()
  const { profile } = useAuth()

  const isEleveur = profile?.type === 'eleveur'

  const navItems = isEleveur ? [
    { path: '/dashboard', icon: Home, label: 'Accueil' },
    { path: '/mes-produits', icon: ShoppingBag, label: 'Produits' },
    { path: '/commandes', icon: ShoppingBag, label: 'Commandes' },
    { path: '/messages', icon: MessageCircle, label: 'Messages' },
    { path: '/profil', icon: User, label: 'Profil' },
  ] : [
    { path: '/dashboard', icon: Home, label: 'Accueil' },
    { path: '/explorer', icon: Search, label: 'Explorer' },
    { path: '/commandes', icon: ShoppingBag, label: 'Commandes' },
    { path: '/messages', icon: MessageCircle, label: 'Messages' },
    { path: '/profil', icon: User, label: 'Profil' },
  ]

  return (
    <nav className="bottom-nav">
      {navItems.map(({ path, icon: Icon, label }) => (
        <button
          key={path}
          className={`nav-item ${location.pathname === path ? 'active' : ''}`}
          onClick={() => navigate(path)}
        >
          <Icon />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  )
}
