'use client'
import { useState } from 'react'

const R = { comum: 'r-comum', raro: 'r-raro', epico: 'r-epico', lendario: 'r-lendario' }
const HEAD = ['Sessões', 'Frequência', 'Repertório']
const TAIL = ['Colecionador', 'Conquistas', 'Especiais']
function prio(t) { const h = HEAD.indexOf(t); if (h >= 0) return h; const ta = TAIL.indexOf(t); if (ta >= 0) return 100 + ta; return 50 }

const METAL = ['#C0853F', '#9DA3A9', '#DDA418', '#5FB6C9', '#E0584C'] // bronze, prata, ouro, platina, rubi
// ícone por trilha (cada trilha tem seu símbolo; a cor varia por nível)
const TRAIL_ICON = {
  'Início': 'spark', 'Vida — Volume': 'life', 'Frequência': 'flame',
  'Trabalho — Demandas': 'board', 'Trabalho · PROD': 'cube', 'Trabalho · DES': 'pen', 'Trabalho · INOV': 'bulb',
  'Cronômetro': 'clock', 'Organização': 'folder', 'Repertório': 'compass', 'Especiais': 'sparkle', 'Colecionador': 'trophy'
}
function motif(kind) {
  switch (kind) {
    case 'spark': return <path d="M13 2 4 14h6l-1 8 11-13h-6z" />
    case 'life': return <path d="M12 20.5s-6.6-4.3-9-8.2C1.1 9 2.8 5.4 6 5.4c2 0 3.2 1.3 4.5 3 1.3-1.7 2.5-3 4.5-3 3.2 0 4.9 3.6 3 6.9-2.4 3.9-9 8.2-9 8.2z" />
    case 'jiujitsu': return <><rect x="3" y="9" width="18" height="6" rx="1" /><path d="M11 9v6" /><path d="M13.2 9v6" /></>
    case 'leitura': return <><path d="M12 6c-1.6-1-4-1.4-6-1v12c2-.4 4.4 0 6 1 1.6-1 4-1.4 6-1V5c-2-.4-4.4 0-6 1z" /><path d="M12 6v12" /></>
    case 'comida': return <><circle cx="11" cy="13" r="5.5" /><path d="M16.3 11.2 21 9" /></>
    case 'casa': return <><path d="M4 11l8-6 8 6" /><path d="M6.5 10v8.5h11V10" /></>
    case 'carreira': return <><circle cx="12" cy="12" r="8" /><path d="M4 12h16" /><path d="M12 4c-3 2.5-3 13.5 0 16M12 4c3 2.5 3 13.5 0 16" /></>
    case 'flame': case 'frequencia': return <path d="M12 3c2 3 4.5 4.5 4.5 8.5A4.5 4.5 0 0 1 7.5 11.5c0-1.8.8-2.8 1.8-3.6.2 1 .9 1.8 1.7 1.8C11 6.7 11 5 12 3z" />
    case 'board': return <><rect x="3.5" y="4" width="6" height="16" rx="1" /><rect x="14.5" y="4" width="6" height="10" rx="1" /></>
    case 'cube': return <><path d="M21 7.5 12 3 3 7.5l9 4.5 9-4.5z" /><path d="M3 7.5v9l9 4.5M21 7.5v9l-9 4.5M12 12v9" /></>
    case 'pen': return <path d="M14.5 5.5l4 4L8 20l-4.5 1L4 16.5z" />
    case 'bulb': return <><path d="M9.5 18h5M10.5 21.5h3" /><path d="M12 2.5a6.5 6.5 0 0 0-4 11.6c.8.7 1 1.4 1 2.4h6c0-1 .2-1.7 1-2.4A6.5 6.5 0 0 0 12 2.5z" /></>
    case 'clock': return <><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></>
    case 'folder': return <path d="M3 7a2 2 0 0 1 2-2h3.5l2 2H19a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    case 'compass': case 'repertorio': return <><circle cx="12" cy="12" r="8.5" /><path d="M15.5 8.5l-2.2 5.2L8.5 15.5l2.2-5.2z" /></>
    case 'sparkle': case 'especial': return <path d="M12 3l2.2 6.3L20.5 11l-6.3 2.2L12 19l-2.2-6.3L3.5 11l6.3-2.2z" />
    case 'trophy': case 'meta': return <><path d="M8 21h8M12 17v4" /><path d="M7 4.5h10V9a5 5 0 0 1-10 0z" /><path d="M7 5.5H4.2V7a3 3 0 0 0 3 3M17 5.5h2.8V7a3 3 0 0 1-3 3" /></>
    default: return <><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="3.4" /></>
  }
}
function Emblem({ kind, tier, mystery, size = 30 }) {
  const color = mystery ? '#9A948A' : (METAL[Math.min(4, Math.max(0, (tier || 1) - 1))] || '#9DA3A9')
  if (mystery) {
    return <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 9a3 3 0 1 1 4 2.8c-.8.5-1 .9-1 1.7M12 17h.01" /></svg>
  }
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {motif(kind)}
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
                    <div className="bicon"><Emblem kind={TRAIL_ICON[s.trail] || s.kind} tier={s.tier} mystery={mystery} /></div>
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
        <div className={`bicon-big ${R[s.rarity] || ''}`}><Emblem kind={TRAIL_ICON[s.trail] || s.kind} tier={s.tier} mystery={mystery} size={40} /></div>
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
