import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { MapPin, Phone, MessageCircle, ShoppingCart, ArrowLeft, Package } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import { useToast } from '../lib/useToast'

export default function EleveurProfile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { profile: myProfile } = useAuth()
  const { showToast, ToastComponent } = useToast()
  const [eleveur, setEleveur] = useState(null)
  const [produits, setProduits] = useState([])
  const [panier, setPanier] = useState({})
  const [loading, setLoading] = useState(true)
  const [ordering, setOrdering] = useState(false)

  useEffect(() => {
    loadEleveur()
  }, [id])

  async function loadEleveur() {
    const [{ data: e }, { data: p }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', id).single(),
      supabase.from('produits').select('*').eq('eleveur_id', id).eq('disponible', true)
    ])
    setEleveur(e)
    setProduits(p || [])
    setLoading(false)
  }

  const totalPanier = Object.entries(panier).reduce((sum, [pid, qty]) => {
    const p = produits.find(pr => pr.id === pid)
    return sum + (p ? p.prix * qty : 0)
  }, 0)

  const panierCount = Object.values(panier).reduce((a, b) => a + b, 0)

  function updatePanier(produitId, delta) {
    setPanier(prev => {
      const current = prev[produitId] || 0
      const next = Math.max(0, current + delta)
      if (next === 0) {
        const { [produitId]: _, ...rest } = prev
        return rest
      }
      return { ...prev, [produitId]: next }
    })
  }

  async function passerCommande() {
    if (!myProfile || panierCount === 0) return
    setOrdering(true)
    try {
      // Create order
      const { data: order, error: orderError } = await supabase
        .from('commandes')
        .insert({
          restaurant_id: myProfile.id,
          eleveur_id: id,
          statut: 'en_attente',
          montant_total: totalPanier
        })
        .select()
        .single()

      if (orderError) throw orderError

      // Create order lines
      const lignes = Object.entries(panier).map(([produit_id, quantite]) => {
        const p = produits.find(pr => pr.id === produit_id)
        return {
          commande_id: order.id,
          produit_id,
          quantite,
          prix_unitaire: p.prix
        }
      })

      const { error: lignesError } = await supabase.from('commande_lignes').insert(lignes)
      if (lignesError) throw lignesError

      setPanier({})
      showToast('Commande envoyée avec succès !', 'success')
      setTimeout(() => navigate('/commandes'), 2000)
    } catch (err) {
      showToast('Erreur lors de la commande', 'error')
    } finally {
      setOrdering(false)
    }
  }

  if (loading) return <div className="loader"><div className="spinner" /></div>
  if (!eleveur) return <div className="empty-state"><p>Éleveur introuvable</p></div>

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header" style={{ paddingTop: 50 }}>
        <button onClick={() => navigate(-1)}
          style={{
            background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white',
            borderRadius: '50%', width: 38, height: 38, display: 'flex',
            alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            marginBottom: 16, position: 'relative'
          }}>
          <ArrowLeft size={18} />
        </button>

        <div style={{ display: 'flex', gap: 16, alignItems: 'center', position: 'relative' }}>
          <div style={{
            width: 70, height: 70, borderRadius: '50%',
            background: 'rgba(255,255,255,0.2)', border: '3px solid rgba(255,255,255,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30
          }}>🐇</div>
          <div>
            <h1 style={{ fontSize: '1.5rem' }}>{eleveur.nom}</h1>
            <div style={{ display: 'flex', gap: 12, marginTop: 6, flexWrap: 'wrap' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'rgba(255,255,255,0.8)', fontSize: '0.85rem' }}>
                <MapPin size={12} /> {eleveur.ville}
              </span>
              {eleveur.telephone && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'rgba(255,255,255,0.8)', fontSize: '0.85rem' }}>
                  <Phone size={12} /> {eleveur.telephone}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="content" style={{ marginTop: 16 }}>
        {/* Description */}
        {eleveur.description && (
          <div className="card" style={{ padding: 16, marginBottom: 20 }}>
            <p style={{ color: 'var(--text-mid)', lineHeight: 1.6 }}>{eleveur.description}</p>
          </div>
        )}

        {/* Contact */}
        {myProfile?.type === 'restaurant' && (
          <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
            <a href={`tel:${eleveur.telephone}`} className="btn btn-outline btn-sm" style={{ flex: 1 }}>
              <Phone size={16} /> Appeler
            </a>
            <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={() => navigate(`/messages/${id}`)}>
              <MessageCircle size={16} /> Message
            </button>
          </div>
        )}

        {/* Products */}
        <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: 16 }}>
          Produits disponibles ({produits.length})
        </h3>

        {produits.length === 0 ? (
          <div className="empty-state">
            <Package />
            <h3>Aucun produit disponible</h3>
            <p>Cet éleveur n'a pas encore ajouté de produits</p>
          </div>
        ) : (
          produits.map(produit => (
            <ProduitCard
              key={produit.id}
              produit={produit}
              qty={panier[produit.id] || 0}
              onAdd={() => updatePanier(produit.id, 1)}
              onRemove={() => updatePanier(produit.id, -1)}
              canOrder={myProfile?.type === 'restaurant'}
            />
          ))
        )}
      </div>

      {/* Panier flottant */}
      {panierCount > 0 && myProfile?.type === 'restaurant' && (
        <div style={{
          position: 'fixed', bottom: 80, left: 16, right: 16,
          background: 'var(--green-deep)', borderRadius: 'var(--radius-md)',
          padding: '16px 20px', display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', boxShadow: 'var(--shadow-lg)', zIndex: 99
        }}>
          <div style={{ color: 'white' }}>
            <div style={{ fontWeight: 700 }}>{panierCount} article{panierCount > 1 ? 's' : ''}</div>
            <div style={{ fontSize: '0.85rem', opacity: 0.8 }}>{totalPanier.toLocaleString()} FCFA</div>
          </div>
          <button className="btn btn-gold" onClick={passerCommande} disabled={ordering}>
            <ShoppingCart size={18} />
            {ordering ? 'Envoi...' : 'Commander'}
          </button>
        </div>
      )}

      {ToastComponent}
    </div>
  )
}

function ProduitCard({ produit, qty, onAdd, onRemove, canOrder }) {
  return (
    <div className="card" style={{ padding: 16, marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 4 }}>{produit.nom}</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-light)', marginBottom: 8 }}>
            {produit.poids_kg && `${produit.poids_kg} kg`}
            {produit.poids_kg && produit.description && ' · '}
            {produit.description}
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: 'var(--green-deep)', fontWeight: 700 }}>
            {produit.prix.toLocaleString()} <span style={{ fontSize: '0.75rem', color: 'var(--text-light)', fontFamily: 'var(--font-body)', fontWeight: 400 }}>FCFA/kg</span>
          </div>
        </div>

        {canOrder && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {qty > 0 && (
              <>
                <button onClick={onRemove}
                  style={{
                    width: 32, height: 32, borderRadius: '50%', border: '2px solid var(--cream-dark)',
                    background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-dark)'
                  }}>−</button>
                <span style={{ fontWeight: 700, minWidth: 20, textAlign: 'center' }}>{qty}</span>
              </>
            )}
            <button onClick={onAdd}
              style={{
                width: 32, height: 32, borderRadius: '50%', background: 'var(--green-deep)',
                border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center',
                justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '1.1rem'
              }}>+</button>
          </div>
        )}
      </div>
    </div>
  )
}
