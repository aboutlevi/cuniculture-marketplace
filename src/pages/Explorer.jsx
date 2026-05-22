import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, MapPin, Phone, Star, Filter } from 'lucide-react'
import { supabase } from '../lib/supabase'
import BottomNav from '../components/BottomNav'

const VILLES = ['Toutes', 'Cotonou', 'Porto-Novo', 'Parakou', 'Abomey-Calavi', 'Bohicon', 'Natitingou', 'Ouidah', 'Lokossa', 'Abomey', 'Kandi']

export default function Explorer() {
  const navigate = useNavigate()
  const [eleveurs, setEleveurs] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [ville, setVille] = useState('Toutes')
  const [showFilter, setShowFilter] = useState(false)

  useEffect(() => {
    loadEleveurs()
  }, [ville])

  async function loadEleveurs() {
    setLoading(true)
    let query = supabase.from('profiles')
      .select('*, produits(id, nom, prix, poids_kg)')
      .eq('type', 'eleveur')

    if (ville !== 'Toutes') query = query.eq('ville', ville)

    const { data } = await query.order('created_at', { ascending: false })
    setEleveurs(data || [])
    setLoading(false)
  }

  const filtered = eleveurs.filter(e =>
    e.nom?.toLowerCase().includes(search.toLowerCase()) ||
    e.ville?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="page">
      <div className="page-header">
        <h1>Explorer</h1>
        <p>Trouvez vos éleveurs locaux</p>
      </div>

      <div className="content" style={{ marginTop: -10 }}>
        {/* Search bar */}
        <div style={{
          display: 'flex', gap: 10, marginBottom: 16,
          background: 'white', borderRadius: 'var(--radius-md)',
          padding: '12px 16px', boxShadow: 'var(--shadow-sm)',
          alignItems: 'center'
        }}>
          <Search size={18} color="var(--text-light)" />
          <input
            type="text"
            placeholder="Rechercher un éleveur, une ville..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              flex: 1, border: 'none', outline: 'none',
              fontFamily: 'var(--font-body)', fontSize: '0.95rem',
              color: 'var(--text-dark)', background: 'transparent'
            }}
          />
          <button onClick={() => setShowFilter(!showFilter)}
            style={{ color: showFilter ? 'var(--green-deep)' : 'var(--text-light)', background: 'none', border: 'none', cursor: 'pointer' }}>
            <Filter size={18} />
          </button>
        </div>

        {/* Filter by city */}
        {showFilter && (
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 12, marginBottom: 8, scrollbarWidth: 'none' }}>
            {VILLES.map(v => (
              <button key={v} onClick={() => setVille(v)}
                style={{
                  padding: '8px 16px', borderRadius: 'var(--radius-full)',
                  border: '2px solid', whiteSpace: 'nowrap',
                  borderColor: ville === v ? 'var(--green-deep)' : 'var(--cream-dark)',
                  background: ville === v ? 'var(--green-deep)' : 'white',
                  color: ville === v ? 'white' : 'var(--text-mid)',
                  fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer',
                  fontFamily: 'var(--font-body)', transition: 'all 0.2s'
                }}>
                {v}
              </button>
            ))}
          </div>
        )}

        {/* Results count */}
        <p style={{ color: 'var(--text-light)', fontSize: '0.85rem', marginBottom: 16 }}>
          {filtered.length} éleveur{filtered.length !== 1 ? 's' : ''} trouvé{filtered.length !== 1 ? 's' : ''}
        </p>

        {/* Eleveur cards */}
        {loading ? (
          <div className="loader"><div className="spinner" /></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <Search />
            <h3>Aucun éleveur trouvé</h3>
            <p>Essayez une autre ville ou un autre terme</p>
          </div>
        ) : (
          filtered.map(eleveur => (
            <EleveurCard key={eleveur.id} eleveur={eleveur} onClick={() => navigate(`/eleveur/${eleveur.id}`)} />
          ))
        )}
      </div>

      <BottomNav />
    </div>
  )
}

function EleveurCard({ eleveur, onClick }) {
  const produitCount = eleveur.produits?.length || 0
  const minPrix = eleveur.produits?.length
    ? Math.min(...eleveur.produits.map(p => p.prix))
    : null

  return (
    <div className="card" style={{ marginBottom: 14, cursor: 'pointer', overflow: 'hidden' }} onClick={onClick}>
      {/* Top colored band */}
      <div style={{
        background: 'linear-gradient(135deg, var(--green-deep), var(--green-mid))',
        height: 6
      }} />
      <div style={{ padding: '16px' }}>
        <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
          {/* Avatar */}
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: 'var(--cream)', border: '3px solid var(--green-deep)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 24, flexShrink: 0
          }}>🐇</div>

          <div style={{ flex: 1 }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', marginBottom: 6 }}>
              {eleveur.nom}
            </h3>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: '0.82rem', color: 'var(--text-light)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <MapPin size={12} /> {eleveur.ville}
              </span>
              {eleveur.telephone && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Phone size={12} /> {eleveur.telephone}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Description */}
        {eleveur.description && (
          <p style={{
            margin: '12px 0 0', fontSize: '0.88rem', color: 'var(--text-mid)',
            lineHeight: 1.5,
            display: '-webkit-box', WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical', overflow: 'hidden'
          }}>
            {eleveur.description}
          </p>
        )}

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--cream-dark)' }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <span className="badge badge-green">{produitCount} produit{produitCount !== 1 ? 's' : ''}</span>
            {minPrix && <span className="badge badge-gold">Dès {minPrix.toLocaleString()} FCFA/kg</span>}
          </div>
          <span style={{ color: 'var(--green-deep)', fontWeight: 700, fontSize: '0.9rem' }}>Voir →</span>
        </div>
      </div>
    </div>
  )
}
