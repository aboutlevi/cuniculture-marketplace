import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Send, ArrowLeft, MessageCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import BottomNav from '../components/BottomNav'

export default function Messages() {
  const { id: targetId } = useParams() // if direct chat
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [conversations, setConversations] = useState([])
  const [activeConv, setActiveConv] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMsg, setNewMsg] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    if (profile) {
      loadConversations()
      if (targetId) openConversationWith(targetId)
    }
  }, [profile])

  useEffect(() => {
    if (activeConv) {
      loadMessages(activeConv.id)
      // Real-time subscription
      const sub = supabase.channel(`messages-${activeConv.id}`)
        .on('postgres_changes', {
          event: 'INSERT', schema: 'public', table: 'messages',
          filter: `conversation_id=eq.${activeConv.id}`
        }, payload => {
          setMessages(m => [...m, payload.new])
          scrollToBottom()
        })
        .subscribe()
      return () => supabase.removeChannel(sub)
    }
  }, [activeConv])

  useEffect(() => { scrollToBottom() }, [messages])

  function scrollToBottom() {
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
  }

  async function loadConversations() {
    const { data } = await supabase
      .from('conversations')
      .select('*, profiles!conversations_user1_id_fkey(id,nom,type), profiles!conversations_user2_id_fkey(id,nom,type)')
      .or(`user1_id.eq.${profile.id},user2_id.eq.${profile.id}`)
      .order('updated_at', { ascending: false })
    setConversations(data || [])
    setLoading(false)
  }

  async function openConversationWith(otherId) {
    // Find or create conversation
    let { data: existing } = await supabase
      .from('conversations')
      .select('*')
      .or(`and(user1_id.eq.${profile.id},user2_id.eq.${otherId}),and(user1_id.eq.${otherId},user2_id.eq.${profile.id})`)
      .single()

    if (!existing) {
      const { data } = await supabase
        .from('conversations')
        .insert({ user1_id: profile.id, user2_id: otherId })
        .select()
        .single()
      existing = data
    }

    // Get other user info
    const { data: other } = await supabase.from('profiles').select('nom').eq('id', otherId).single()
    setActiveConv({ ...existing, otherName: other?.nom || '—', otherId })
  }

  async function loadMessages(convId) {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', convId)
      .order('created_at')
    setMessages(data || [])
  }

  async function sendMessage() {
    if (!newMsg.trim() || !activeConv) return
    setSending(true)
    await supabase.from('messages').insert({
      conversation_id: activeConv.id,
      sender_id: profile.id,
      contenu: newMsg.trim()
    })
    await supabase.from('conversations').update({ updated_at: new Date().toISOString() }).eq('id', activeConv.id)
    setNewMsg('')
    setSending(false)
  }

  // Show chat view if active conversation
  if (activeConv) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--cream)' }}>
        {/* Chat header */}
        <div style={{ background: 'var(--green-deep)', padding: '50px 16px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => setActiveConv(null)}
            style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <ArrowLeft size={16} />
          </button>
          <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🐇</div>
          <div>
            <div style={{ color: 'white', fontWeight: 700 }}>{activeConv.otherName}</div>
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem' }}>En ligne</div>
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {messages.length === 0 && (
            <div style={{ textAlign: 'center', color: 'var(--text-light)', padding: 40 }}>
              <MessageCircle size={32} style={{ marginBottom: 8, opacity: 0.4 }} />
              <p>Démarrez la conversation !</p>
            </div>
          )}
          {messages.map(m => {
            const isMine = m.sender_id === profile.id
            return (
              <div key={m.id} style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth: '75%', padding: '10px 14px', borderRadius: isMine ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                  background: isMine ? 'var(--green-deep)' : 'white',
                  color: isMine ? 'white' : 'var(--text-dark)',
                  boxShadow: 'var(--shadow-sm)', fontSize: '0.92rem', lineHeight: 1.5
                }}>
                  <p>{m.contenu}</p>
                  <div style={{ fontSize: '0.72rem', opacity: 0.6, marginTop: 4, textAlign: 'right' }}>
                    {new Date(m.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            )
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div style={{ padding: '12px 16px calc(12px + env(safe-area-inset-bottom))', background: 'white', display: 'flex', gap: 10, alignItems: 'center', borderTop: '1px solid var(--cream-dark)' }}>
          <input
            type="text"
            placeholder="Votre message..."
            value={newMsg}
            onChange={e => setNewMsg(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
            style={{
              flex: 1, padding: '12px 16px', border: '2px solid var(--cream-dark)',
              borderRadius: 'var(--radius-full)', outline: 'none', fontFamily: 'var(--font-body)',
              fontSize: '0.95rem', background: 'var(--cream)'
            }}
          />
          <button onClick={sendMessage} disabled={!newMsg.trim() || sending}
            style={{
              width: 44, height: 44, borderRadius: '50%', background: 'var(--green-deep)',
              border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center',
              justifyContent: 'center', color: 'white', flexShrink: 0
            }}>
            <Send size={18} />
          </button>
        </div>
      </div>
    )
  }

  // Conversations list
  return (
    <div className="page">
      <div className="page-header">
        <h1>Messages</h1>
        <p>Vos conversations</p>
      </div>

      <div className="content" style={{ paddingTop: 16 }}>
        {loading ? (
          <div className="loader"><div className="spinner" /></div>
        ) : conversations.length === 0 ? (
          <div className="empty-state">
            <MessageCircle />
            <h3>Aucune conversation</h3>
            <p>Commencez par contacter un éleveur depuis sa fiche</p>
          </div>
        ) : (
          conversations.map(c => {
            const other = c.user1_id === profile.id ? c['profiles!conversations_user2_id_fkey'] : c['profiles!conversations_user1_id_fkey']
            const otherId = c.user1_id === profile.id ? c.user2_id : c.user1_id
            return (
              <div key={c.id} className="card" style={{ padding: 16, marginBottom: 10, display: 'flex', gap: 14, alignItems: 'center', cursor: 'pointer' }}
                onClick={() => setActiveConv({ ...c, otherName: other?.nom, otherId })}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--green-deep)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                  {other?.type === 'eleveur' ? '🐇' : '🍽️'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700 }}>{other?.nom || '—'}</div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-light)', marginTop: 2 }}>
                    {new Date(c.updated_at).toLocaleDateString('fr-FR')}
                  </div>
                </div>
                <ChevronRight size={16} color="var(--text-light)" />
              </div>
            )
          })
        )}
      </div>
      <BottomNav />
    </div>
  )
}

// Needed for arrow in conversations list
function ChevronRight({ size, color }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
}
