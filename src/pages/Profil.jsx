import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut, Edit2, Save, MapPin, Phone, Mail } from 'lucide-react'
import { useAuth } from '../lib/AuthContext'
import { useToast } from '../lib/useToast'
import BottomNav from '../components/BottomNav'

const VILLES = ['Cotonou','Porto-Novo','Parakou','Abomey-Calavi','Bohicon','Natitingou','Ouidah','Lokossa','Abomey','Kandi']

export default function Profil() {
  const { profile, signOut, updateProfile } = useAuth()
  const navigate = useNavigate()
  const { showToast, ToastComponent } = useToast()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ nom: profile?.nom || '', telephone: profile?.telephone || '', ville: profile?.ville || '', description: profile?.description || '' })
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    try {
      await updateProfile(form)
      setEditing(false)
      showToast('Profil mis à jour', 'success')
    } catch {
      showToast('Erreur lors de la mise à jour', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleLogout() {
    await signOut()
    navigate('/')
  }

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header" style={{ textAlign: 'center', paddingBottom: 50 }}>
        <div style={{
          width: 88, height: 88, borderRadius: '50%',
          background: 'rgba(255,255,255,0.2)', border: '4px solid rgba(255,255,255,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 40, margin: '0 auto 16px', position: 'relative'
        }}>
          {profile?.type === 'eleveur' ? '🐇' : '🍽️'}
        </div>
        <h1 style={{ fontSize: '1.6rem' }}>{profile?.nom}</h1>
        <div style={{ marginTop: 8 }}>
          <span style={{
            background: 'rgba(255,255,255,0.2)', color: 'white',
            padding: '4px 16px', borderRadius: '999px', fontSize: '0.85rem', fontWeight: 600
          }}>
            {profile?.type === 'eleveur' ? '🐇 Éleveur' : '🍽️ Restaurant'}
          </span>
        </div>
      </div>

      <div className="content" style={{ marginTop: -30 }}>
        {/* Profile card */}
        <div className="card" style={{ padding: 20, marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontFamily: 'var(--font-display)' }}>Mes informations</h3>
            <button onClick={() => editing ? handleSave() : setEditing(true)}
              className={`btn btn-sm ${editing ? 'btn-primary' : 'btn-outline'}`}
              disabled={saving}>
              {editing ? <><Save size={14} /> {saving ? '...' : 'Sauvegarder'}</> : <><Edit2 size={14} /> Modifier</>}
            </button>
          </div>

          {editing ? (
            <>
              <div className="input-group">
                <label>Nom</label>
                <input type="text" value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} />
              </div>
              <div className="input-group">
                <label>Téléphone</label>
                <input type="tel" value={form.telephone} onChange={e => setForm(f => ({ ...f, telephone: e.target.value }))} />
              </div>
              <div className="input-group">
                <label>Ville</label>
                <select value={form.ville} onChange={e => setForm(f => ({ ...f, ville: e.target.value }))}>
                  {VILLES.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
              <div className="input-group">
                <label>Description</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Décrivez votre activité..." />
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setEditing(false)}>Annuler</button>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { icon: <Mail size={16} />, value: profile?.email },
                { icon: <Phone size={16} />, value: profile?.telephone || 'Non renseigné' },
                { icon: <MapPin size={16} />, value: profile?.ville || 'Non renseigné' },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'var(--text-mid)' }}>
                  <span style={{ color: 'var(--green-deep)' }}>{item.icon}</span>
                  <span style={{ fontSize: '0.95rem' }}>{item.value}</span>
                </div>
              ))}
              {profile?.description && (
                <p style={{ color: 'var(--text-mid)', fontSize: '0.9rem', lineHeight: 1.6, marginTop: 4, paddingTop: 12, borderTop: '1px solid var(--cream-dark)' }}>
                  {profile.description}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Member since */}
        <div className="card" style={{ padding: 16, marginBottom: 16 }}>
          <div style={{ color: 'var(--text-light)', fontSize: '0.85rem' }}>
            Membre depuis {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }) : '—'}
          </div>
        </div>

        {/* Logout */}
        <button className="btn btn-full" onClick={handleLogout}
          style={{ background: '#fde8e8', color: '#c0392b', border: 'none', borderRadius: 'var(--radius-md)', padding: 16, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: 'var(--font-body)' }}>
          <LogOut size={18} /> Se déconnecter
        </button>
      </div>

      {ToastComponent}
      <BottomNav />
    </div>
  )
}
