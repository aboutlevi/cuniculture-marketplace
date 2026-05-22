import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Package, ShoppingBag, MessageCircle, TrendingUp, Star, MapPin, Phone } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import BottomNav from '../components/BottomNav'

export default function Dashboard() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState({})
  const [recentOrders, setRecentOrders] = useState([])
  const [topEleveurs, setTopEleveurs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (profile) loadData()
  }, [profile])

  async function loadData() {
    if (profile.type === 'eleveur') {
      const [{ count: produits }, { count: commandes }, { data: orders }] = await Promise.all([
        supabase.from('produits').select('*', { count: 'exact', head: true }).eq('eleveur_id', profile.id),
        supabase.from('commandes').select('*', { count: 'exact', head: true }).eq('eleveur_id', profile.id),
        supabase.from('commandes').select('*, profiles!commandes_restaurant_id_fkey(nom)').eq('eleveur_id', profile.id).order('created_at', { ascending: false }).limit(5)
      ])
      setStats({ produits: produits || 0, commandes: commandes || 0 })
      setRecentOrders(orders || [])
    } else {
      const [{ count: commandes }, { data: orders }, { data: eleveurs }] = await Promise.all([
        supabase.from('commandes').select('*', { count: 'exact', head: true }).eq('restaurant_id', profile.id),
        supabase.from('commandes').select('*, profiles!commandes_eleveur_id_fkey(nom)').eq('restaurant_id', profile.id).order('created_at', { ascending: false }).limit(5),
        supabase.from('profiles').select('*, produits(count)').eq('type', 'eleveur').limit(4)
      ])
      setStats({ commandes: commandes || 0 })
      setRecentOrders(orders || [])
      setTopEleveurs(eleveurs || [])
    }
    setLoading(false)
  }

  const statusColors = {
    'en_attente': 'badge-gold',
    'confirmee': 'badge-green',
    'livree': 'badge-gray',
    'annulee': 'badge-red'
  }
  const statusLabels = {
    'en_attente': 'En attente',
    'confirmee': 'Confirmée',
    'livree': 'Livrée',
    'annulee': 'Annulée'
  }

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir'

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header" style={{ paddingBottom: 40 }}>
        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem', marginBottom: 4 }}>
          {greeting} 👋
        </p>
        <h1>{profile?.nom || 'Utilisateur'}</h1>
        <p>{profile?.type === 'eleveur' ? '🐇 Éleveur' : '🍽️ Restaurant'} · {profile?.ville}</p>
      </div>

      <div className="content" style={{ marginTop: -20 }}>
        {/* Stats cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
          {profile?.type === 'eleveur' && (
            <StatCard icon={<Package size={20} />} label="Produits" value={stats.produits || 0} color="var(--green-deep)" onClick={() => navigate('/mes-produits')} />
          )}
          <StatCard icon={<ShoppingBag size={20} />} label="Commandes" value={stats.commandes || 0} color="var(--gold)" onClick={() => navigate('/commandes')} />
          <StatCard icon={<MessageCircle size={20} />} label="Messages" value={0} color="var(--green-mid)" onClick={() => navigate('/messages')} />
          <StatCard icon={<TrendingUp size={20} />} label="Ce mois" value="—" color="var(--brown)" />
        </div>

        {/* Quick actions */}
        {profile?.type === 'eleveur' ? (
          <div className="card" style={{ padding: 20, marginBottom: 24 }}>
            <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: 16, fontSize: '1.1rem' }}>
              Actions rapides
            </h3>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-primary btn-sm" onClick={() => navigate('/mes-produits/nouveau')}>
                + Nouveau produit
              </button>
              <button className="btn btn-outline btn-sm" onClick={() => navigate('/commandes')}>
                Voir commandes
              </button>
            </div>
          </div>
        ) : (
          <div className="card" style={{ padding: 20, marginBottom: 24, background: 'linear-gradient(135deg, var(--green-deep), var(--green-mid))' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', color: 'white', marginBottom: 8 }}>
              Trouver des éleveurs
            </h3>
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem', marginBottom: 16 }}>
              Commandez directement auprès des éleveurs locaux
            </p>
            <button className="btn btn-gold btn-sm" onClick={() => navigate('/explorer')}>
              Explorer les éleveurs →
            </button>
          </div>
        )}

        {/* Recent orders */}
        {recentOrders.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem' }}>Commandes récentes</h3>
              <button className="btn-ghost btn btn-sm" onClick={() => navigate('/commandes')}>Voir tout</button>
            </div>
            {recentOrders.map(order => (
              <div key={order.id} className="card" style={{ padding: 16, marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                onClick={() => navigate(`/commandes/${order.id}`)} >
                <div>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>
                    {profile.type === 'eleveur'
                      ? order.profiles?.nom || 'Restaurant'
                      : order.profiles?.nom || 'Éleveur'}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>
                    {new Date(order.created_at).toLocaleDateString('fr-FR')} · {order.montant_total?.toLocaleString()} FCFA
                  </div>
                </div>
                <span className={`badge ${statusColors[order.statut] || 'badge-gray'}`}>
                  {statusLabels[order.statut] || order.statut}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Top éleveurs pour restaurant */}
        {profile?.type === 'restaurant' && topEleveurs.length > 0 && (
          <div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', marginBottom: 16 }}>
              Éleveurs disponibles
            </h3>
            {topEleveurs.map(e => (
              <EleveurCard key={e.id} eleveur={e} onClick={() => navigate(`/eleveur/${e.id}`)} />
            ))}
          </div>
        )}

        {loading && <div className="loader"><div className="spinner" /></div>}
      </div>

      <BottomNav />
    </div>
  )
}

function StatCard({ icon, label, value, color, onClick }) {
  return (
    <div className="card" style={{ padding: 20, cursor: onClick ? 'pointer' : 'default' }} onClick={onClick}>
      <div style={{ color, marginBottom: 8 }}>{icon}</div>
      <div style={{ fontSize: '1.8rem', fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--text-dark)' }}>{value}</div>
      <div style={{ fontSize: '0.8rem', color: 'var(--text-light)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
    </div>
  )
}

function EleveurCard({ eleveur, onClick }) {
  return (
    <div className="card" style={{ padding: 16, marginBottom: 10, display: 'flex', gap: 14, alignItems: 'center', cursor: 'pointer' }} onClick={onClick}>
      <div style={{
        width: 52, height: 52, borderRadius: '50%',
        background: 'var(--green-deep)', display: 'flex', alignItems: 'center',
        justifyContent: 'center', fontSize: 22, flexShrink: 0
      }}>🐇</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, marginBottom: 4 }}>{eleveur.nom}</div>
        <div style={{ display: 'flex', gap: 12, fontSize: '0.82rem', color: 'var(--text-light)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={12} />{eleveur.ville}</span>
          {eleveur.telephone && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Phone size={12} />{eleveur.telephone}</span>}
        </div>
      </div>
      <span className="badge badge-green">Voir →</span>
    </div>
  )
}
