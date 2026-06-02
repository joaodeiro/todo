'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

const LAST_KEY = 'todo:lastUser'

export default function Home() {
  const [last, setLast] = useState(null)        // { email, name } do último login
  const [view, setView] = useState(null)        // 'returning' | 'reauth' | 'form'
  const [mode, setMode] = useState('login')      // dentro de 'form': login | signup
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const [msg, setMsg] = useState('')

  useEffect(() => {
    let saved = null
    try { saved = JSON.parse(localStorage.getItem(LAST_KEY) || 'null') } catch {}
    if (saved && saved.email) { setLast(saved); setEmail(saved.email); setView('returning') }
    else setView('form')
  }, [])

  function remember(user, mail) {
    const name = user?.user_metadata?.name || user?.user_metadata?.full_name || (mail || '').split('@')[0] || 'você'
    try { localStorage.setItem(LAST_KEY, JSON.stringify({ email: mail, name })) } catch {}
  }

  // botão "Continuar como X": se a sessão ainda vale, entra direto; senão pede só a senha
  async function continueAs() {
    setLoading(true); setErr('')
    const supabase = createClient()
    const { data } = await supabase.auth.getSession()
    if (data?.session) { window.location.assign('/dashboard'); return }
    setLoading(false); setPassword(''); setView('reauth')
  }

  async function signIn(e) {
    e?.preventDefault()
    setLoading(true); setErr(''); setMsg('')
    const supabase = createClient()
    if (mode === 'signup') {
      const { data, error } = await supabase.auth.signUp({ email, password })
      setLoading(false)
      if (error) { setErr(error.message); return }
      if (data.session) { remember(data.user, email); window.location.assign('/dashboard') }
      else setMsg('Conta criada! Confirma pelo e-mail pra entrar.')
      return
    }
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) { setErr(error.message); return }
    remember(data.user, email); window.location.assign('/dashboard')
  }

  function useAnother() { setErr(''); setMsg(''); setPassword(''); setEmail(''); setMode('login'); setView('form') }
  function backToReturning() { setErr(''); setMsg(''); setView('returning') }

  if (!view) return <main className="wrap" />

  return (
    <main className="wrap">
      <div className="card">
        {view === 'returning' && last ? (
          <div className="lg-ret">
            <div className="lg-ava">{(last.name || '?').trim().charAt(0).toUpperCase()}</div>
            <p className="lg-eyebrow">Bom te ver de novo</p>
            <h1 className="lg-name">{last.name}</h1>
            <p className="lg-email">{last.email}</p>
            <button className="btn" disabled={loading} onClick={continueAs}>
              {loading ? '…' : `Continuar como ${last.name}`}
            </button>
            {err && <p className="sub lg-err">{err}</p>}
            <p className="lg-other" onClick={useAnother}>Entrar com outra conta</p>
          </div>
        ) : view === 'reauth' && last ? (
          <form className="lg-ret" onSubmit={signIn}>
            <div className="lg-ava">{(last.name || '?').trim().charAt(0).toUpperCase()}</div>
            <h1 className="lg-name">Oi, {last.name}</h1>
            <p className="lg-email">Tua sessão expirou — confirma a senha pra continuar.</p>
            <input type="password" required minLength={6} autoFocus placeholder="senha" value={password} onChange={e => setPassword(e.target.value)} />
            <button className="btn" disabled={loading}>{loading ? '…' : 'Continuar'}</button>
            {err && <p className="sub lg-err">{err}</p>}
            <p className="lg-other" onClick={useAnother}>Entrar com outra conta</p>
          </form>
        ) : (
          <>
            <h1>Seu sistema 🔥</h1>
            <p className="sub">{mode === 'login' ? 'Entra com e-mail e senha.' : 'Cria tua conta.'}</p>
            <form onSubmit={signIn}>
              <input type="email" required placeholder="voce@email.com" value={email} onChange={e => setEmail(e.target.value)} />
              <input type="password" required minLength={6} placeholder="senha" value={password} onChange={e => setPassword(e.target.value)} />
              <button className="btn" disabled={loading}>{loading ? '…' : (mode === 'login' ? 'Entrar' : 'Criar conta')}</button>
            </form>
            {err && <p className="sub lg-err">{err}</p>}
            {msg && <p className="sub" style={{ color: '#1D9E75', marginTop: 12 }}>{msg}</p>}
            <p className="toggle" onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setErr(''); setMsg('') }}>
              {mode === 'login' ? 'Não tem conta? Criar' : 'Já tenho conta — entrar'}
            </p>
            {last && <p className="lg-other" onClick={backToReturning}>← Voltar para {last.name}</p>}
          </>
        )}
      </div>
    </main>
  )
}
