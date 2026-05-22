import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Edit2, Trash2, ToggleLeft, ToggleRight } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import { useToast } from '../lib/useToast'
import BottomNav from '../components/BottomNav'

export default function MesProduits() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const { showToast, ToastComponent } = useToast()
  const [produits, setProduits] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ nom: '', prix: '', poids_kg: '', description: '', disponible: true })
  const [saving, setSaving] = useState(false)

  useEffect(() => { if (profile) loadProduits() }, [profile])

  async function loadProduits() {
    const { data } = await supabase.from('produits').select('*').eq('eleveur_id', profile.id).order('created_at', { ascending: false })
    setProduits(data || [])
    setLoading(false)
  }

  function openNew() {
    setEditing(null)
    setForm({ nom: '', prix: '', poids_kg: '', description: '', disponible: true })
    setShowForm(true)
  }

  function openEdit(p) {
    setEditing(p)
    setForm({ nom: p.nom, prix: p.prix, poids_kg: p.poids_kg || '', description: p.description || '', disponible: p.disponible })
    setShowForm(true)
  }

  async function saveProduit() {
    if (!form.nom || !form.prix) return showToast('Nom et prix requis', 'error')
    setSaving(true)
    try {
      const data = {
        nom: form.nom,
        prix: parseFloat(form.prix),
        poids_kg: form.poids_kg ? parseFloat(form.poids_kg) : null,
        description: form.description,
        disponible: form.disponible,
        eleveur_id: profile.id
      }
      if (editing) {
        await supabase.from('produits').update(data).eq('id', editing.id)
        showToast('Produit mis à jour', 'success')
      } else {
        await supabase.from('produits').insert(data)
        showToast('Produit ajouté !', 'success')
      }
      setShowForm(false)
      loadProduits()
    } catch {
      showToast('Erreur lors de la sauvegarde', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function deleteProduit(id) {
    if (!confirm('Supprimer ce produit ?')) return
    await supabase.from('produits').delete().eq('id', id)
    showToast('Produit supprimé', 'default')
    loadProduits()
  }

  async function toggleDispo(p) {
    await supabase.from('produits').update({ disponible: !p.disponible }).eq('id', p.id)
    loadProduits()
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Mes Produits</h1>
        <p>Gérez votre catalogue</p>
      </div>

      <div className="content" style={{ marginTop: 16 }}>
        <button className="btn btn-primary btn-full" style={{ marginBottom: 20 }} onClick={openNew}>
          <Plus size={18} /> Ajouter un produit
        </button>

        {/* Form modal */}
        {showForm && (
          <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            zIndex: 200, display: 'flex', alignItems: 'flex-end'
          }} onClick={e => e.target === e.currentTarget && setShowForm(false)}>
            <div style={{
              background: 'var(--cream)', borderRadius: '24px 24px 0 0',
              padding: '24px 20px 40px', width: '100%', maxHeight: '85vh',
              overflowY: 'auto'
            }}>
              <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: 20 }}>
                {editing ? 'Modifier le produit' : 'Nouveau produit'}
              </h3>

              <div className="input-group">
                <label>Nom du produit *</label>
                <input type="text" placeholder="Ex: Lapin entier, Cuisse de lapin..."
                  value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="input-group">
                  <label>Prix (FCFA/kg) *</label>
                  <input type="number" placeholder="Ex: 2500"
                    value={form.prix} onChange={e => setForm(f => ({ ...f, prix: e.target.value }))} />
                </div>
                <div className="input-group">
                  <label>Poids (kg)</label>
                  <input type="number" placeholder="Ex: 2.5" step="0.1"
                    value={form.poids_kg} onChange={e => setForm(f => ({ ...f, poids_kg: e.target.value }))} />
                </div>
              </div>
              <div className="input-group">
                <label>Description</label>
                <textarea placeholder="Détails sur le produit..."
                  value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, padding: '12px 16px', background: 'white', borderRadius: 'var(--radius-sm)' }}>
                <span style={{ fontWeight: 600 }}>Disponible à la vente</span>
                <button onClick={() => setForm(f => ({ ...f, disponible: !f.disponible }))}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: form.disponible ? 'var(--green-deep)' : 'var(--text-light)' }}>
                  {form.disponible ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                </button>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <button className="btn btn-outline" onClick={() => setShowForm(false)}>Annuler</button>
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={saveProduit} disabled={saving}>
                  {saving ? 'Sauvegarde...' : 'Sauvegarder'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Products list */}
        {loading ? (
          <div className="loader"><div className="spinner" /></div>
        ) : produits.length === 0 ? (
          <div className="empty-state">
            <Plus />
            <h3>Aucun produit</h3>
            <p>Ajoutez votre premier produit pour commencer à vendre</p>
          </div>
        ) : (
          produits.map(p => (
            <div key={p.id} className="card" style={{ padding: 16, marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontWeight: 700 }}>{p.nom}</span>
                    <span className={`badge ${p.disponible ? 'badge-green' : 'badge-gray'}`}>
                      {p.disponible ? 'Disponible' : 'Indisponible'}
                    </span>
                  </div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: 'var(--green-deep)', fontWeight: 700 }}>
                    {p.prix.toLocaleString()} FCFA/kg
                  </div>
                  {p.poids_kg && <div style={{ fontSize: '0.82rem', color: 'var(--text-light)' }}>{p.poids_kg} kg</div>}
                  {p.description && <div style={{ fontSize: '0.85rem', color: 'var(--text-mid)', marginTop: 4 }}>{p.description}</div>}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => toggleDispo(p)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: p.disponible ? 'var(--green-deep)' : 'var(--text-light)', padding: 4 }}>
                    {p.disponible ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                  </button>
                  <button onClick={() => openEdit(p)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-mid)', padding: 4 }}>
                    <Edit2 size={18} />
                  </button>
                  <button onClick={() => deleteProduit(p.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#e74c3c', padding: 4 }}>
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {ToastComponent}
      <BottomNav />
    </div>
  )
}
