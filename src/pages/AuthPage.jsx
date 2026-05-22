import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { useToast } from '../lib/useToast'

export default function AuthPage() {
  const [mode, setMode] = useState('login') // login | register
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    email: '', password: '', nom: '', telephone: '',
    type: '', ville: '', description: ''
  })
  const { signIn, signUp } = useAuth()
  const navigate = useNavigate()
  const { showToast, ToastComponent } = useToast()

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }))

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    try {
      await signIn(form.email, form.password)
      navigate('/dashboard')
    } catch (err) {
      showToast('Email ou mot de passe incorrect', 'error')
    } finally {
      setLoading(false)
    }
  }

  async function handleRegister(e) {
    e.preventDefault()
    setLoading(true)
    try {
      await signUp(form.email, form.password, {
        nom: form.nom,
        telephone: form.telephone,
        type: form.type,
        ville: form.ville,
        description: form.description
      })
      showToast('Compte créé ! Vérifiez votre email.', 'success')
      setMode('login')
    } catch (err) {
      showToast(err.message || 'Erreur lors de la création', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{
        background: 'var(--green-deep)', padding: '60px 24px 40px',
        textAlign: 'center', position: 'relative', overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute', top: -40, right: -40,
          width: 160, height: 160,
          background: 'rgba(255,255,255,0.06)', borderRadius: '50%'
        }} />
        <div style={{
          position: 'absolute', bottom: -30, left: -30,
          width: 120, height: 120,
          background: 'rgba(200,150,42,0.15)', borderRadius: '50%'
        }} />
        <div style={{
          width: 72, height: 72, background: 'var(--gold)',
          borderRadius: '50%', display: 'flex', alignItems: 'center',
          justifyContent: 'center', margin: '0 auto 20px', fontSize: 32,
          position: 'relative'
        }}>🐇</div>
        <h1 style={{ fontFamily: 'var(--font-display)', color: 'white', fontSize: '2rem', position: 'relative' }}>
          LapinBénin
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.75)', marginTop: 8, position: 'relative' }}>
          Marketplace cunicole du Bénin
        </p>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex', background: 'white',
        borderBottom: '2px solid var(--cream-dark)', margin: '0'
      }}>
        {['login', 'register'].map(m => (
          <button key={m} onClick={() => { setMode(m); setStep(1) }}
            style={{
              flex: 1, padding: '16px', border: 'none', background: 'none',
              fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '0.95rem',
              cursor: 'pointer', color: mode === m ? 'var(--green-deep)' : 'var(--text-light)',
              borderBottom: mode === m ? '3px solid var(--green-deep)' : '3px solid transparent',
              transition: 'all 0.2s', marginBottom: -2
            }}>
            {m === 'login' ? 'Connexion' : "S'inscrire"}
          </button>
        ))}
      </div>

      {/* Form */}
      <div style={{ padding: '24px', maxWidth: 480, margin: '0 auto', width: '100%' }}>
        {mode === 'login' ? (
          <form onSubmit={handleLogin}>
            <div className="input-group">
              <label>Email</label>
              <input type="email" placeholder="votre@email.com" required
                value={form.email} onChange={e => update('email', e.target.value)} />
            </div>
            <div className="input-group">
              <label>Mot de passe</label>
              <input type="password" placeholder="••••••••" required
                value={form.password} onChange={e => update('password', e.target.value)} />
            </div>
            <button type="submit" className="btn btn-primary btn-full" disabled={loading} style={{ marginTop: 8 }}>
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister}>
            {step === 1 && (
              <>
                <p style={{ marginBottom: 20, color: 'var(--text-mid)', fontWeight: 600 }}>
                  Vous êtes ?
                </p>
                {['eleveur', 'restaurant'].map(t => (
                  <div key={t} onClick={() => { update('type', t); setStep(2) }}
                    style={{
                      padding: '20px', border: '2px solid',
                      borderColor: form.type === t ? 'var(--green-deep)' : 'var(--cream-dark)',
                      borderRadius: 'var(--radius-md)', marginBottom: 12,
                      cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 16,
                      background: form.type === t ? '#f0f9f2' : 'white',
                      transition: 'all 0.2s'
                    }}>
                    <span style={{ fontSize: 32 }}>{t === 'eleveur' ? '🐇' : '🍽️'}</span>
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--text-dark)' }}>
                        {t === 'eleveur' ? 'Éleveur' : 'Restaurant / Acheteur'}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>
                        {t === 'eleveur' ? 'Je vends des lapins' : 'Je cherche des lapins'}
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}

            {step === 2 && (
              <>
                <div className="input-group">
                  <label>Nom complet / Nom de la ferme</label>
                  <input type="text" placeholder="Ex: Ferme Adjovi" required
                    value={form.nom} onChange={e => update('nom', e.target.value)} />
                </div>
                <div className="input-group">
                  <label>Téléphone</label>
                  <input type="tel" placeholder="Ex: +229 97 00 00 00" required
                    value={form.telephone} onChange={e => update('telephone', e.target.value)} />
                </div>
                <div className="input-group">
                  <label>Ville</label>
                  <select required value={form.ville} onChange={e => update('ville', e.target.value)}>
                    <option value="">Choisir une ville</option>
                    {['Cotonou','Porto-Novo','Parakou','Abomey-Calavi','Bohicon','Natitingou','Ouidah','Lokossa','Abomey','Kandi'].map(v => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                </div>
                <div className="input-group">
                  <label>Description (optionnel)</label>
                  <textarea placeholder="Décrivez votre activité..."
                    value={form.description} onChange={e => update('description', e.target.value)} />
                </div>
                <div className="input-group">
                  <label>Email</label>
                  <input type="email" placeholder="votre@email.com" required
                    value={form.email} onChange={e => update('email', e.target.value)} />
                </div>
                <div className="input-group">
                  <label>Mot de passe</label>
                  <input type="password" placeholder="Minimum 6 caractères" required minLength={6}
                    value={form.password} onChange={e => update('password', e.target.value)} />
                </div>
                <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                  <button type="button" className="btn btn-outline" onClick={() => setStep(1)}>
                    Retour
                  </button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
                    {loading ? 'Création...' : 'Créer mon compte'}
                  </button>
                </div>
              </>
            )}
          </form>
        )}
      </div>
      {ToastComponent}
    </div>
  )
}
