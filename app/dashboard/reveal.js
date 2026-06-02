'use client'
import { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

const Ctx = createContext(null)
export const useReveal = () => useContext(Ctx)

const TIER_EMOJI = { primeira: '🌱', marco: '🏅', descoberta: '🔮', combo: '⚡', retorno: '🤍', profundidade: '🧠' }
const COLORS = ['#E64C28', '#DA2037', '#F9C972', '#1D9E75', '#7F77DD', '#378ADD']

function burst(host) {
  if (!host) return
  const r = host.getBoundingClientRect()
  const cx = r.width / 2, cy = r.height / 2
  for (let i = 0; i < 26; i++) {
    const c = document.createElement('div')
    c.className = 'confetti'
    c.style.left = cx + 'px'; c.style.top = cy + 'px'
    c.style.background = COLORS[i % COLORS.length]
    if (i % 2) c.style.borderRadius = '50%'
    host.appendChild(c)
    const a = Math.random() * 6.283, d = 150 * (0.5 + Math.random())
    const x = Math.cos(a) * d, y = Math.sin(a) * d - 30
    c.animate([{ transform: 'translate(0,0) scale(1)', opacity: 1 }, { transform: `translate(${x}px,${y + 90}px) rotate(${Math.random() * 600 - 300}deg) scale(.4)`, opacity: 0 }],
      { duration: 1300 + Math.random() * 600, easing: 'cubic-bezier(.2,.6,.3,1)', fill: 'forwards' })
    setTimeout(() => c.remove(), 1900)
  }
}

async function buildReveal(supabase, row) {
  const { data: def } = await supabase.from('achievement_def').select('kicker,title_template,desc_template,tier').eq('id', row.def_id).single()
  if (!def) return null
  let name = ''
  if (row.context && row.context.domain) {
    const { data: dm } = await supabase.from('domain').select('name').eq('slug', row.context.domain).single()
    name = dm ? dm.name : ''
  }
  return { id: row.id, kicker: def.kicker, title: (def.title_template || '').split('{domain}').join(name), desc: (def.desc_template || '').split('{domain}').join(name), tier: def.tier }
}

export function RevealProvider({ children }) {
  const [queue, setQueue] = useState([])
  const [idx, setIdx] = useState(0)
  const shown = useRef(new Set())

  useEffect(() => { try { document.documentElement.dataset.theme = localStorage.getItem('theme') || 'cream' } catch (e) {} }, [])

  const push = useCallback((list) => {
    const fresh = (list || []).filter(d => d && (!d.id || !shown.current.has(d.id)))
    fresh.forEach(d => { if (d.id) shown.current.add(d.id) })
    if (fresh.length) setQueue(q => [...q, ...fresh])
  }, [])

  useEffect(() => {
    const supabase = createClient()
    let ch
    let active = true
    ;(async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session && session.access_token) { try { supabase.realtime.setAuth(session.access_token) } catch (e) {} }
      // rede de segurança: mostra conquistas pendentes ao abrir
      const { data: pending } = await supabase.from('achievement_earned').select('id,def_id,context').eq('revealed', false).order('earned_at')
      if (active && pending && pending.length) {
        const built = []
        for (const r of pending) { const d = await buildReveal(supabase, r); if (d) built.push(d) }
        if (built.length) { push(built); await supabase.from('achievement_earned').update({ revealed: true }).in('id', pending.map(r => r.id)) }
      }
      // ao vivo
      ch = supabase.channel('earned-rt')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'achievement_earned' }, async (payload) => {
          const row = payload.new
          if (!row || shown.current.has(row.id)) return
          const d = await buildReveal(supabase, row)
          if (!d) return
          push([d])
          supabase.from('achievement_earned').update({ revealed: true }).eq('id', row.id)
        })
        .subscribe()
    })()
    return () => { active = false; if (ch) supabase.removeChannel(ch) }
  }, [push])

  function close() { setQueue([]); setIdx(0) }

  return (
    <Ctx.Provider value={{ push }}>
      {children}
      {queue.length > 0 && <Carousel queue={queue} idx={Math.min(idx, queue.length - 1)} setIdx={setIdx} onClose={close} />}
    </Ctx.Provider>
  )
}

function Carousel({ queue, idx, setIdx, onClose }) {
  const cur = queue[idx]
  const ref = useRef(null)
  useEffect(() => {
    const t = setTimeout(() => burst(ref.current), 280)
    const auto = setTimeout(() => { if (idx + 1 >= queue.length) onClose(); else setIdx(idx + 1) }, 5200)
    return () => { clearTimeout(t); clearTimeout(auto) }
  }, [idx, queue.length])
  function advance() { if (idx + 1 >= queue.length) onClose(); else setIdx(idx + 1) }
  return (
    <div className="cq-overlay" onClick={advance}>
      {queue.length > 1 && (
        <div className="cq-dots">
          {queue.map((_, i) => <span key={i} className={`cq-dot ${i === idx ? 'on' : ''} ${i < idx ? 'past' : ''}`} />)}
        </div>
      )}
      <div className="cq" ref={ref} key={idx} onClick={(e) => { e.stopPropagation(); advance() }}>
        <div className="emb"><div className="glow" /><div className="ring" /><div className="face">{TIER_EMOJI[cur.tier] || '🏅'}</div></div>
        <div className="kicker">{cur.kicker}</div>
        <div className="title">{cur.title}</div>
        <div className="desc">{cur.desc}</div>
        <div className="hint">{queue.length > 1 ? `${idx + 1} de ${queue.length} · toque pra ${idx + 1 >= queue.length ? 'fechar' : 'avançar'}` : 'toque pra fechar'}</div>
      </div>
    </div>
  )
}
