'use client'
import { useState } from 'react'

const R = { comum: 'r-comum', raro: 'r-raro', epico: 'r-epico', lendario: 'r-lendario' }
const HEAD = ['Sessões', 'Frequência', 'Repertório']
const TAIL = ['Colecionador', 'Conquistas', 'Especiais']
function prio(t) { const h = HEAD.indexOf(t); if (h >= 0) return h; const ta = TAIL.indexOf(t); if (ta >= 0) return 100 + ta; return 50 }

const METAL = ['#C0853F', '#9DA3A9', '#DDA418', '#5FB6C9', '#E0584C'] // bronze, prata, ouro, platina, rubi
function motif(kind) {
  switch (kind) {
    case 'jiujitsu': return <><rect x="3" y="9" width="18" height="6" rx="1" /><path d="M11 9v6" /><path d="M13.2 9v6" /></>
    case 'leitura': return <><path d="M12 6c-1.6-1-4-1.4-6-1v12c2-.4 4.4 0 6 1 1.6-1 4-1.4 6-1V5c-2-.4-4.4 0-6 1z" /><path d="M12 6v12" /></>
    case 'comida': return <><circle cx="11" cy="13" r="5.5" /><path d="M16.3 11.2 21 9" /></>
    case 'casa': return <><path d="M4 11l8-6 8 6" /><path d="M6.5 10v8.5h11V10" /></>
    case 'carreira': return <><circle cx="12" cy="12" r="8" /><path d="M4 12h16" /><path d="M12 4c-3 2.5-3 13.5 0 16M12 4c3 2.5 3 13.5 0 16" /></>
    case 'sessoes': return <><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="4" /><circle cx="12" cy="12" r="1.1" /></>
    case 'frequencia': return <path d="M12 3c2 3 4.5 4.5 4.5 8.5A4.5 4.5 0 0 1 7.5 11.5c0-1.8.8-2.8 1.8-3.6.2 1 .9 1.8 1.7 1.8C11 6.7 11 5 12 3z" />
    case 'repertorio': return <><circle cx="12" cy="12" r="8" /><path d="M15 9l-2.2 5L8 15l2-4.8z" /></>
    case 'colecao': return <><path d="M7 4h10l3.5 5L12 20 3.5 9z" /><path d="M3.5 9h17" /></>
    case 'meta': return <><path d="M8 4h8v3.5a4 4 0 0 1-8 0z" /><path d="M8 5H5.2v1.6a3 3 0 0 0 3 3" /><path d="M16 5h2.8v1.6a3 3 0 0 1-3 3" /><path d="M10.5 12h3v3h-3z" /><path d="M8.5 18.5h7" /></>
    case 'especial': return <path d="M12 3l2.1 6.2L20.5 11l-6.4 1.8L12 19l-2.1-6.2L3.5 11l6.4-1.8z" />
    default: return <><path d="M6.5 4v16" /><path d="M6.5 5h9.5l-2 3 2 3H6.5" /></>
  }
}
function hashStr(s) { let h = 2166136261; const x = s || ''; for (let i = 0; i < x.length; i++) { h ^= x.charCodeAt(i); h = Math.imul(h, 16777619) } return h >>> 0 }
function makeRng(seed) { let t = seed >>> 0; return () => { t = (t + 0x6D2B79F5) >>> 0; let x = Math.imul(t ^ (t >>> 15), 1 | t); x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x; return ((x ^ (x >>> 14)) >>> 0) / 4294967296 } }
function Emblem({ seedKey, tier, mystery, size = 30 }) {
  const color = mystery ? '#9A948A' : (METAL[Math.min(4, Math.max(0, (tier || 1) - 1))] || '#9DA3A9')
  if (mystery) {
    return <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 9a3 3 0 1 1 4 2.8c-.8.5-1 .9-1 1.7M12 17h.01" /></svg>
  }
  const r = makeRng(hashStr(seedKey || 'x'))
  const P = 4 + Math.min(4, (tier || 1) - 1)
  const a0 = r() * Math.PI
  const len = 6.5 + r() * 3
  const wid = 1.6 + r() * 1.5
  const core = 1.5 + r() * 1.8
  const twist = (r() - 0.5) * 0.7
  const cx = 12, cy = 12, petals = []
  for (let i = 0; i < P; i++) {
    const a = a0 + i * 2 * Math.PI / P
    const tx = (cx + Math.cos(a) * len).toFixed(1), ty = (cy + Math.sin(a) * len).toFixed(1)
    const p1x = (cx + Math.cos(a + 0.45 + twist) * wid).toFixed(1), p1y = (cy + Math.sin(a + 0.45 + twist) * wid).toFixed(1)
    const p2x = (cx + Math.cos(a - 0.45 + twist) * wid).toFixed(1), p2y = (cy + Math.sin(a - 0.45 + twist) * wid).toFixed(1)
    petals.push(`M${cx} ${cy} Q${p1x} ${p1y} ${tx} ${ty} Q${p2x} ${p2y} ${cx} ${cy}Z`)
  }
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={color} strokeWidth="1" strokeLinejoin="round" aria-hidden="true">
      {petals.map((d, i) => <path key={i} d={d} fill={color} fillOpacity="0.14" />)}
      <circle cx="12" cy="12" r={core} fill={color} fillOpacity="0.5" stroke="none" />
      <circle cx="12" cy="12" r="9.4" strokeOpacity="0.3" />
    </svg>
  )
}

export function Gallery({ states }) {
  const [sel, setSel] = useState(null)
  const byTrail = {}
  states.forEach(s => { const t = s.trail || 'Outros'; (byTrail[t] = byTrail[t] || []).push(s) })
  const trailTo = {}; states.forEach(s => { const t = s.trail || 'Outros'; const v = s.to ?? 50; if (trailTo[t] == null || v < trailTo[t]) trailTo[t] = v })
  const trails = Object.keys(byTrail).sort((a, b) => (trailTo[a] - trailTo[b]) || a.localeCompare(b))

  return (
    <>
      {trails.map(t => {
        const list = byTrail[t].slice().sort((a, b) => (a.earned === b.earned ? a.seq - b.seq : (a.earned ? -1 : 1)))
        const e = list.filter(s => s.earned).length
        return (
          <section className="trrow" key={t}>
            <div className="trrow-h"><span className="trrow-t">{t}</span><span className="trrow-c">{e}/{list.length}</span></div>
            <div className="trrow-cards">
              {list.map(s => {
                const mystery = s.hidden && !s.earned
                const pct = s.target ? Math.min(100, Math.round(100 * s.current / s.target)) : 0
                return (
                  <button key={s.key} className={`tbadge ${s.earned ? 'earned' : 'locked'} ${R[s.rarity] || ''}`} onClick={() => setSel(s)}>
                    {s.earned && <div className="bcheck">✓</div>}
                    <div className="bicon"><Emblem seedKey={s.key} tier={s.tier} mystery={mystery} /></div>
                    <div className="btitle">{mystery ? 'Secreta' : s.title}</div>
                    {!s.earned && !mystery && s.hasProgress && (
                      <>
                        <div className="bprog"><div className="bbar" style={{ width: pct + '%' }} /></div>
                        <div className="bpct">{s.current}/{s.target}</div>
                      </>
                    )}
                  </button>
                )
              })}
            </div>
          </section>
        )
      })}
      {sel && <BadgeModal s={sel} onClose={() => setSel(null)} />}
    </>
  )
}

function BadgeModal({ s, onClose }) {
  const mystery = s.hidden && !s.earned
  const status = s.earned ? 'Desbloqueada' : (mystery ? 'Conquista secreta' : 'Bloqueada')
  return (
    <div className="badge-overlay" onClick={onClose}>
      <div className="badge-card" onClick={e => e.stopPropagation()}>
        <div className={`bicon-big ${R[s.rarity] || ''}`}><Emblem seedKey={s.key} tier={s.tier} mystery={mystery} size={40} /></div>
        <div className="bkicker">{status} · {s.rarity}</div>
        <div className="bmtitle">{mystery ? '???' : s.title}</div>
        <div className="bmdesc">{mystery ? 'Continue jogando pra descobrir o que desbloqueia essa. 👀' : s.desc}</div>
        {!s.earned && !mystery && s.hasProgress && <div className="bmprog">{s.current} / {s.target}</div>}
        {s.earned && s.earnedAt && <div className="bmdate">em {new Date(s.earnedAt).toLocaleDateString('pt-BR')}</div>}
        <div className="hint" style={{ marginTop: 10 }}>toque fora pra fechar</div>
      </div>
    </div>
  )
}
