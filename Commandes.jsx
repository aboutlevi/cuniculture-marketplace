import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShoppingBag, ChevronRight } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import { useToast } from '../lib/useToast'
import BottomNav from '../components/BottomNav'

const STATUS = {
  en_attente: { label: 'En attente', badge: 'badge-gold', next: 'confirmee', action: 'Confirmer' },
  confirmee: { label: 'Confirmée', badge: 'badge-green', next: 'livree', action: 'Marquer livrée' },
  livree: { label: 'Livrée', badge: 'badge-gray', next: null, action: null },
  annulee: { label: 'Annulée', badge: 'badge-red', next: null, action: null }
}

const TABS = ['Toutes', 'En attente', 'Confirmées', 'Livrées']
const TAB_FILTER = { 'Toutes': null, 'En attente': 'en_attente', 'Confirmées': 'confirmee', 'Livrées': 'livree' }

export default function Commandes() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const { showToast, ToastComponent } = useToast()
  const [commandes, setCommandes] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('Toutes')
  const [selected, setSelected] = useState(null)
  const [lignes, setLignes] = useState([])

  useEffect(() => { if (profile) loadCommandes() }, [profile])

  async function loadCommandes() {
    setLoading(true)
    const isEleveur = profile.type === 'eleveur'
    const field = isEleveur ? 'eleveur_id' : 'restaurant_id'
    const otherField = isEleveur ? 'restaurant_id' : 'eleveur_id'
    const fkName = isEleveur ? 'commandes_restaurant_id_fkey' : 'commandes_eleveur_id_fkey'

    const { data } = await supabase.from('commandes')
      .select(`*, profiles!${fkName}(nom, telephone, ville)`)
      .eq(field, profile.id)
      .order('created_at', { ascending: false })

    setCommandes(data || [])
    setLoading(false)
  }

  async function openCommande(c) {
    setSelected(c)
    const { data } = await supabase.from('commande_lignes')
      .select('*, produits(nom, poids_kg)')
      .eq('commande_id', c.id)
    setLignes(data || [])
  }

  async function updateStatut(commande, newStatut) {
    await supabase.from('commandes').update({ statut: newStatut }).eq('id', commande.id)
    showToast(`Commande ${STATUS[newStatut].label.toLowerCase()}`, 'success')
    loadCommandes()
    setSelected(s => s ? { ...s, statut: newStatut } : null)
  }

  const filtered = commandes.filter(c => {
    const f = TAB_FILTER[tab]
    return f ? c.statut === f : true
  })

  return (
    <div className="page">
      <div className="page-header">
        <h1>Commandes</h1>
        <p>{commandes.length} commande{commandes.length !== 1 ? 's' : ''} au total</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', background: 'white', borderBottom: '1px solid var(--cream-dark)', overflowX: 'auto', scrollbarWidth: 'none' }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{
              padding: '14px 16px', border: 'none', background: 'none', whiteSpace: 'nowrap',
              fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer',
              color: tab === t ? 'var(--green-deep)' : 'var(--text-light)',
              borderBottom: tab === t ? '3px solid var(--green-deep)' : '3px solid transparent',
              transition: 'all 0.2s'
            }}>
            {t}
          </button>
        ))}
      </div>

      <div className="content" style={{ paddingTop: 16 }}>
        {loading ? (
          <div className="loader"><div className="spinner" /></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <ShoppingBag />
            <h3>Aucune commande</h3>
            <p>Vos commandes apparaîtront ici</p>
          </div>
        ) : (
          filtered.map(c => {
            const s = STATUS[c.statut] || STATUS.en_attente
            const other = c.profiles
            return (
              <div key={c.id} className="card" style={{ padding: 16, marginBottom: 12, cursor: 'pointer' }}
                onClick={() => openCommande(c)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 700, marginBottom: 4 }}>{other?.nom || '—'}</div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-light)' }}>
                      {new Date(c.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </div>
                    <div style={{ fontFamily: 'var(--font-display)', color: 'var(--green-deep)', fontWeight: 700, marginTop: 4 }}>
                      {c.montant_total?.toLocaleString()} FCFA
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                    <span className={`badge ${s.badge}`}>{s.label}</span>
                    <ChevronRight size={16} color="var(--text-light)" />
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Detail modal */}
      {selected && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'flex-end' }}
          onClick={e => e.target === e.currentTarget && setSelected(null)}>
          <div style={{ background: 'var(--cream)', borderRadius: '24px 24px 0 0', padding: '24px 20px 40px', width: '100%', maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontFamily: 'var(--font-display)' }}>Détail de la commande</h3>
              <button onClick={() => setSelected(null)}
                style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-mid)' }}>×</button>
            </div>

            <div className="card" style={{ padding: 16, marginBottom: 16 }}>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>{selected.profiles?.nom}</div>
              {selected.profiles?.telephone && <div style={{ color: 'var(--text-mid)', fontSize: '0.9rem' }}>📞 {selected.profiles.telephone}</div>}
              {selected.profiles?.ville && <div style={{ color: 'var(--text-mid)', fontSize: '0.9rem' }}>📍 {selected.profiles.ville}</div>}
            </div>

            <h4 style={{ marginBottom: 12, color: 'var(--text-mid)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Articles</h4>
            {lignes.map(l => (
              <div key={l.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--cream-dark)' }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{l.produits?.nom}</div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-light)' }}>Qté: {l.quantite}</div>
                </div>
                <div style={{ fontWeight: 700 }}>{(l.prix_unitaire * l.quantite).toLocaleString()} FCFA</div>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 0 0', fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 700 }}>
              <span>Total</span>
              <span style={{ color: 'var(--green-deep)' }}>{selected.montant_total?.toLocaleString()} FCFA</span>
            </div>

            {/* Actions pour éleveur */}
            {profile?.type === 'eleveur' && STATUS[selected.statut]?.next && (
              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <button className="btn btn-outline" onClick={async () => { await updateStatut(selected, 'annulee'); setSelected(null) }}>
                  Annuler
                </button>
                <button className="btn btn-primary" style={{ flex: 1 }}
                  onClick={() => updateStatut(selected, STATUS[selected.statut].next)}>
                  {STATUS[selected.statut].action}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {ToastComponent}
      <BottomNav />
    </div>
  )
}
