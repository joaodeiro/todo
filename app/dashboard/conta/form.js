'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function SetPassword() {
  const [pw, setPw] = useState('')
  const [done, setDone] = useState(false)
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)
  async function submit(e) {
    e.preventDefault()
    if (pw.length < 6) { setErr('Mínimo 6 caracteres'); return }
    setLoading(true); setErr('')
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password: pw })
    setLoading(false)
    if (error) setErr(error.message); else { setDone(true); setPw('') }
  }
  return (
    <form onSubmit={submit} style={{ maxWidth: 380, marginTop: 18 }}>
      <input type="password" minLength={6} placeholder="nova senha (mín. 6)" value={pw} onChange={e => setPw(e.target.value)} />
      <button className="btn" disabled={loading}>{loading ? '…' : 'Definir senha'}</button>
      {done && <p className="sub" style={{ color: '#1D9E75', marginTop: 12 }}>Senha definida! Agora dá pra sair e entrar com e-mail e senha. ✅</p>}
      {err && <p className="sub" style={{ color: '#DA2037', marginTop: 12 }}>{err}</p>}
    </form>
  )
}
