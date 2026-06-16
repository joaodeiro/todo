'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  toggleRitual, skipRitual, addMoment,
  moveCard, reorderCards, deleteItem, startTimer, stopTimer
} from '@/app/actions'
import { CreateItemModal } from '@/app/dashboard/createitem'
import {
  LIFE_CATS, CADENCES, LIFE_COLS, LIFE_ORDER, catOf, cadenceOf,
  cadenceLabel, periodKey, periodLabel, isRitualDone, doneSet, dueLabel,
  skipSet, isRitualSkipped, scheduleLabel, isActiveNow
} from '@/app/life'

const COLORS = ['#E64C28', '#DA2037', '#F9C972', '#1D9E75', '#7F77DD']
function tinyBurst(host) {
  if (!host) return
  const r = host.getBoundingClientRect()
  for (let i = 0; i < 12; i++) {
    const c = document.createElement('div')
    c.className = 'confetti'
    c.style.left = '14px'; c.style.top = (r.height / 2) + 'px'
    c.style.background = COLORS[i % COLORS.length]
    if (i % 2) c.style.borderRadius = '50%'
    host.appendChild(c)
    const a = Math.random() * 6.283, d = 60 * (0.5 + Math.random())
    const x = Math.cos(a) * d, y = Math.sin(a) * d - 12
    c.animate([{ transform: 'translate(0,0) scale(1)', opacity: 1 }, { transform: `translate(${x}px,${y + 60}px) rotate(${Math.random() * 540 - 270}deg) scale(.4)`, opacity: 0 }],
      { duration: 1000 + Math.random() * 500, easing: 'cubic-bezier(.2,.6,.3,1)', fill: 'forwards' })
    setTimeout(() => c.remove(), 1600)
  }
}
function fmt(sec) {
  sec = Math.max(0, Math.floor(sec || 0))
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60)
  let out = ''; if (h) out += h + 'h '; out += m + 'm'; return out.trim() || '0m'
}
function liveSecs(c, now) {
  const base = c.secs || 0
  if (c.timer_started_at) return base + Math.max(0, Math.floor((now - Date.parse(c.timer_started_at)) / 1000))
  return base
}
function bySort(a, b) { return ((a.sort || 0) - (b.sort || 0)) || ((a.created_at || '') < (b.created_at || '') ? -1 : 1) }
function Play() { return <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor"><path d="M8 5v14l11-7z" /></svg> }
function Pause() { return <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor"><path d="M6 5h4v14H6zM14 5h4v14h-4z" /></svg> }
function Trash() { return <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /><path d="M10 11v6M14 11v6" /></svg> }
function Ban() { return <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="m4.9 4.9 14.2 14.2" /></svg> }
function catMeta(key) { return LIFE_CATS.find(c => c.key === key) || LIFE_CATS[1] }

// ======================= WORKSPACE =======================
export function AreaWorkspace({ domain, areas, initialTasks, initialRituals, timeTotals, embTotals, ritualEvents, skipEvents, streak }) {
  const tt = timeTotals || {}, et = embTotals || {}
  const [tab, setTab] = useState('registro')
  const [view, setView] = useState('quadro')
  const [cat, setCat] = useState('all')
  const [q, setQ] = useState('')
  const [now, setNow] = useState(Date.now())
  const [tasks, setTasks] = useState((initialTasks || []).map(c => ({ ...c, secs: tt[c.id] || 0, embDone: (et[c.id] || {}).done || 0, embTotal: (et[c.id] || {}).total || 0 })))
  const [rituals, setRituals] = useState(initialRituals || [])
  const [done, setDone] = useState(() => doneSet(ritualEvents))
  const [skipped, setSkipped] = useState(() => skipSet(skipEvents))
  const router = useRouter()
  const openItem = id => router.push(`/dashboard/item/${id}`)
  const [creating, setCreating] = useState(false)
  const [confirmDelId, setConfirmDelId] = useState(null)
  const [dragId, setDragId] = useState(null)
  const [dragCol, setDragCol] = useState(null)
  const [overInfo, setOverInfo] = useState(null)

  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t) }, [])

  function moveDir(id, dir) {
    const card = tasks.find(c => c.id === id); if (!card) return
    const i = LIFE_ORDER.indexOf(card.status || 'backlog')
    const ni = Math.max(0, Math.min(LIFE_ORDER.length - 1, i + dir)); if (ni === i) return
    setTasks(s => s.map(c => c.id === id ? { ...c, status: LIFE_ORDER[ni] } : c)); moveCard(id, LIFE_ORDER[ni])
  }
  function performDrop(id, status, targetId, before) {
    setDragId(null); setOverInfo(null); setDragCol(null)
    if (!id) return
    const dragged = tasks.find(c => c.id === id); if (!dragged) return
    const colCards = tasks.filter(c => (c.status || 'backlog') === status && c.id !== id)
    const rest = [...colCards.filter(c => !c.blocked).sort(bySort), ...colCards.filter(c => c.blocked).sort(bySort)]
    let idx = rest.length
    if (targetId) { const ti = rest.findIndex(c => c.id === targetId); if (ti >= 0) idx = before ? ti : ti + 1 }
    const newList = [...rest.slice(0, idx), dragged, ...rest.slice(idx)]
    const sortById = {}; newList.forEach((c, i) => { sortById[c.id] = i + 1 })
    const statusChanged = (dragged.status || 'backlog') !== status
    setTasks(s => s.map(c => {
      if (sortById[c.id] == null) return c
      let next = { ...c, sort: sortById[c.id] }
      if (c.id === id) {
        next.status = status
        if (c.timer_started_at && status !== 'fazendo') {
          const el = Math.max(0, Math.floor((Date.now() - Date.parse(c.timer_started_at)) / 1000))
          next.secs = (c.secs || 0) + (el >= 60 ? el : 0); next.timer_started_at = null
        }
      }
      return next
    }))
    if (statusChanged) moveCard(id, status)
    reorderCards(newList.map(c => c.id))
  }
  async function remove(id) {
    setTasks(s => s.filter(c => c.id !== id)); setRituals(s => s.filter(c => c.id !== id))
    await deleteItem(id)
  }
  function play(card) {
    if (card.timer_started_at) return
    const iso = new Date().toISOString()
    setTasks(s => s.map(c => {
      if (c.id === card.id) return { ...c, timer_started_at: iso, status: 'fazendo' }
      if (c.timer_started_at) { const el = Math.max(0, Math.floor((Date.now() - Date.parse(c.timer_started_at)) / 1000)); return { ...c, secs: (c.secs || 0) + (el >= 60 ? el : 0), timer_started_at: null } }
      return c
    }))
    startTimer(card.id)
  }
  function pause(card) {
    const el = Math.max(0, Math.floor((Date.now() - Date.parse(card.timer_started_at)) / 1000))
    setTasks(s => s.map(c => c.id === card.id ? { ...c, secs: (c.secs || 0) + (el >= 60 ? el : 0), timer_started_at: null } : c))
    stopTimer(card.id)
  }
  function flipRitual(r, host) {
    const key = periodKey(cadenceOf(r), new Date(), (r.config || {}).anchor)
    const id = `${r.id}|${key}`
    const isDone = done.has(id)
    setDone(s => { const n = new Set(s); isDone ? n.delete(id) : n.add(id); return n })
    if (!isDone) { setSkipped(s => { const n = new Set(s); n.delete(id); return n }); tinyBurst(host) }
    toggleRitual(r.id, domain.id, key, !isDone)
  }
  function doSkip(r, skip) {
    const cad = cadenceOf(r)
    const key = periodKey(cad, new Date(), (r.config || {}).anchor)
    const id = `${r.id}|${key}`
    setSkipped(s => { const n = new Set(s); skip ? n.add(id) : n.delete(id); return n })
    if (skip) setDone(s => { const n = new Set(s); n.delete(id); return n })
    skipRitual(r.id, domain.id, key, cad, skip)
  }
  function onCreated(item) {
    // se criou pra outra Área da Vida, não entra neste quadro
    if (item.domain_id === domain.id) {
      if (item.primitive === 'ritual') setRituals(s => [...s, item])
      else setTasks(s => [...s, { ...item, secs: 0, embDone: 0, embTotal: 0 }])
    }
    setCreating(false)
  }

  const ql = q.trim().toLowerCase()
  function visible(c) {
    if (cat !== 'all' && catOf(c) !== cat) return false
    if (ql) { const hay = `${c.title || ''} ${c.notes || ''}`.toLowerCase(); if (!hay.includes(ql)) return false }
    return true
  }
  const shown = tasks.filter(visible)
  const doneN = tasks.filter(c => (c.status || 'backlog') === 'concluido').length
  const ritPend = rituals.filter(r => {
    const cad = cadenceOf(r), anchor = (r.config || {}).anchor
    return isActiveNow(r) && !isRitualDone(done, r.id, cad, anchor) && !isRitualSkipped(skipped, r.id, cad, anchor)
  }).length

  return (
    <>
      <header className="section-head">
        <div className="section-head-l">
          <h1 className="section-title">{domain.name}</h1>
          {streak && streak.current > 0 && <span className="streakflame on" title="dias seguidos com algo nesta área">🔥 {streak.current}</span>}
          <span className="section-meta">{tasks.length} {tasks.length === 1 ? 'tarefa' : 'tarefas'}{doneN ? ` · ${doneN} concluídas` : ''}{rituals.length ? ` · ${rituals.length} rotinas` : ''}</span>
        </div>
        <button className="knew" onClick={() => setCreating(true)}>＋ Novo</button>
      </header>

      <div className="areatabs">
        <button className={`areatab ${tab === 'registro' ? 'on' : ''}`} onClick={() => setTab('registro')}>Registro</button>
        <button className={`areatab ${tab === 'rotinas' ? 'on' : ''}`} onClick={() => setTab('rotinas')}>Rotinas{ritPend ? <span className="areatab-n">{ritPend}</span> : null}</button>
      </div>

      {tab === 'registro' ? (
        <>
          <div className="kfilters">
            <div className="viewtoggle">
              <button className={`vt ${view === 'quadro' ? 'on' : ''}`} onClick={() => setView('quadro')} aria-label="quadro"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="3" y="3" width="7" height="18" rx="1.4" /><rect x="14" y="3" width="7" height="11" rx="1.4" /></svg> Quadro</button>
              <button className={`vt ${view === 'lista' ? 'on' : ''}`} onClick={() => setView('lista')} aria-label="lista"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></svg> Lista</button>
            </div>
            {['all', 'agenda', 'solta'].map(k => (
              <button key={k} className={`btab ${cat === k ? 'on' : ''}`} onClick={() => setCat(k)}>{k === 'all' ? 'Tudo' : catMeta(k).icon + ' ' + catMeta(k).label}</button>
            ))}
            <input className="ksearch" value={q} onChange={e => setQ(e.target.value)} placeholder="buscar…" />
          </div>

          {tasks.length === 0 ? (
            <p className="empty">Nada por aqui ainda. Toca em <strong>＋ Novo</strong> pra criar a primeira coisa. 👆</p>
          ) : view === 'quadro' ? (
            <div className="kanban">
              {LIFE_COLS.map(col => {
                const list = shown.filter(c => (c.status || 'backlog') === col.key).sort(bySort)
                const free = list.filter(c => !c.blocked), blk = list.filter(c => c.blocked)
                const render = c => (
                  <LifeCard key={c.id} c={c} now={now} colKey={col.key}
                    dragId={dragId} overInfo={overInfo} confirmDelId={confirmDelId}
                    onDragStart={() => setDragId(c.id)} onDragEndAll={() => { setDragId(null); setOverInfo(null); setDragCol(null) }}
                    onOver={(before) => setOverInfo(o => (o && o.id === c.id && o.before === before) ? o : { id: c.id, before })}
                    onDropCard={(before) => performDrop(dragId, col.key, c.id, before)}
                    onOpen={() => openItem(c.id)} onPlay={() => play(c)} onPause={() => pause(c)}
                    onAskDel={() => setConfirmDelId(c.id)} onCancelDel={() => setConfirmDelId(null)} onConfirmDel={() => { remove(c.id); setConfirmDelId(null) }} />
                )
                return (
                  <div key={col.key} className={`kcol ${dragCol === col.key ? 'over' : ''} ${col.key === 'concluido' ? 'kcol-done' : ''}`}
                    onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = 'move' }}
                    onDragEnter={() => setDragCol(col.key)}
                    onDragLeave={e => { if (e.currentTarget === e.target) { setDragCol(null); setOverInfo(null) } }}
                    onDrop={e => { e.preventDefault(); performDrop(dragId, col.key, null, false) }}>
                    <h3>{col.label}<span className="n">{list.length}</span></h3>
                    {free.map(render)}
                    {free.length > 0 && blk.length > 0 && <div className="kdiv" />}
                    {blk.map(render)}
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="lifelist">
              {LIFE_COLS.map(col => {
                const list = shown.filter(c => (c.status || 'backlog') === col.key).sort(bySort)
                if (!list.length) return null
                return (
                  <div key={col.key} className="ll-group">
                    <div className="ll-h"><span className="ll-dot" data-s={col.key} />{col.label}<span className="ll-n">{list.length}</span></div>
                    {list.map(c => <LifeRow key={c.id} c={c} now={now} onOpen={() => openItem(c.id)} onPlay={() => play(c)} onPause={() => pause(c)} onAdvance={() => moveDir(c.id, 1)} />)}
                  </div>
                )
              })}
              {shown.length === 0 && <p className="empty">Nenhuma tarefa nesse filtro.</p>}
            </div>
          )}
        </>
      ) : (
        <RotinasTab rituals={rituals} done={done} skipped={skipped} onFlip={flipRitual} onSkip={doSkip} onOpen={openItem} onNew={() => setCreating(true)} />
      )}

      {creating && <CreateItemModal areas={areas || [{ id: domain.id, name: domain.name }]} domainId={domain.id} onClose={() => setCreating(false)} onCreated={onCreated} />}
    </>
  )
}

// ======================= CARD (quadro) =======================
function LifeCard({ c, now, colKey, dragId, overInfo, confirmDelId, onDragStart, onDragEndAll, onOver, onDropCard, onOpen, onPlay, onPause, onAskDel, onCancelDel, onConfirmDel }) {
  const running = !!c.timer_started_at
  const cm = catMeta(catOf(c))
  const due = catOf(c) === 'agenda' ? dueLabel(c.due_at) : null
  return (
    <div className={`kcard ${c.blocked ? 'blk' : ''} ${colKey === 'concluido' ? 'done' : ''} ${dragId === c.id ? 'dragging' : ''} ${overInfo && overInfo.id === c.id ? (overInfo.before ? 'drop-before' : 'drop-after') : ''}`}
      draggable
      onDragStart={e => { onDragStart(); e.dataTransfer.setData('text/plain', c.id); e.dataTransfer.effectAllowed = 'move' }}
      onDragEnd={onDragEndAll}
      onDragOver={e => { e.preventDefault(); e.stopPropagation(); const r = e.currentTarget.getBoundingClientRect(); onOver(e.clientY < r.top + r.height / 2) }}
      onDrop={e => { e.preventDefault(); e.stopPropagation(); const r = e.currentTarget.getBoundingClientRect(); onDropCard(e.clientY < r.top + r.height / 2) }}
      onClick={onOpen}>
      <div className="kc-top">
        <span className="lc-cat" title={cm.label}>{cm.icon} {cm.label}</span>
        {due && <span className={`lc-due lc-due-${due.tone}`}>{due.txt}</span>}
        {c.blocked && <span className="kc-blktag"><Ban />bloqueado{(c.block_reason || c.block_note) && <span className="kc-tip">{[c.block_reason, c.block_note].filter(Boolean).join(' — ')}</span>}</span>}
        <button className="kc-del" aria-label="excluir" onClick={e => { e.stopPropagation(); onAskDel() }}><Trash /></button>
      </div>
      <div className="kc-title">{c.title}</div>
      <div className="kc-foot">
        <button className={`kc-play ${running ? 'on' : ''}`} onClick={e => { e.stopPropagation(); running ? onPause() : onPlay() }} aria-label={running ? 'pausar' : 'iniciar'}>{running ? <Pause /> : <Play />}</button>
        <span className={`kc-time ${running ? 'on' : ''}`}>{fmt(liveSecs(c, now))}</span>
        {c.embTotal > 0 && <span className={`kc-emb ${c.embDone === c.embTotal ? 'full' : ''}`}>☑ {c.embDone}/{c.embTotal}</span>}
      </div>
      {confirmDelId === c.id && (
        <div className="kc-confirm" onClick={e => e.stopPropagation()}>
          <span className="kc-confirm-q">Excluir tarefa?</span>
          <div className="kc-confirm-btns"><button onClick={onCancelDel}>não</button><button className="danger" onClick={onConfirmDel}>sim, excluir</button></div>
        </div>
      )}
    </div>
  )
}

// ======================= ROW (lista) =======================
function LifeRow({ c, now, onOpen, onPlay, onPause, onAdvance }) {
  const running = !!c.timer_started_at
  const cm = catMeta(catOf(c))
  const due = catOf(c) === 'agenda' ? dueLabel(c.due_at) : null
  const isDone = (c.status || 'backlog') === 'concluido'
  return (
    <div className={`ll-row ${c.blocked ? 'blk' : ''} ${isDone ? 'done' : ''}`} onClick={onOpen}>
      <span className="ll-cat" title={cm.label}>{cm.icon}</span>
      <span className="ll-title">{c.title}</span>
      {c.blocked && <span className="ll-tag"><Ban /></span>}
      {due && <span className={`lc-due lc-due-${due.tone}`}>{due.txt}</span>}
      {(liveSecs(c, now) > 0 || running) && <span className={`kc-time ${running ? 'on' : ''}`}>{fmt(liveSecs(c, now))}</span>}
      <button className={`ll-btn ${running ? 'on' : ''}`} onClick={e => { e.stopPropagation(); running ? onPause() : onPlay() }} aria-label={running ? 'pausar' : 'iniciar'}>{running ? <Pause /> : <Play />}</button>
      {!isDone && <button className="ll-adv" onClick={e => { e.stopPropagation(); onAdvance() }} aria-label="avançar status">→</button>}
    </div>
  )
}

// ======================= ROTINAS =======================
function RitualRow({ r, done, skipped, onFlip, onSkip, onOpen }) {
  const ref = useRef(null)
  const cad = cadenceOf(r), anchor = (r.config || {}).anchor
  const isDone = isRitualDone(done, r.id, cad, anchor)
  const isSkip = isRitualSkipped(skipped, r.id, cad, anchor)
  const sched = scheduleLabel(r)
  return (
    <div ref={ref} className={`rit-row ${isDone ? 'done' : ''} ${isSkip ? 'skipped' : ''}`}>
      <button className={`rit-check ${isDone ? 'on' : ''}`} onClick={() => onFlip(r, ref.current)} aria-label={isDone ? 'desmarcar' : 'marcar'} disabled={isSkip}>
        <svg viewBox="0 0 24 24"><path className="chk" d="M5 12.5l4.5 4.5L19 7" /></svg>
      </button>
      <span className="rit-title" onClick={() => onOpen(r.id)}>{r.title}</span>
      {sched && <span className="rit-sched">{sched}</span>}
      <span className="rit-cad">{cadenceLabel(cad)}</span>
      {isSkip ? (
        <span className="rit-skiptag">pulada · <button className="link" onClick={() => onSkip(r, false)}>desfazer</button></span>
      ) : isDone ? (
        <span className="rit-period ok">✓ {periodLabel(cad)}</span>
      ) : (
        <button className="rit-skip" onClick={() => onSkip(r, true)} title="joga pro próximo ciclo">pular ⏭</button>
      )}
    </div>
  )
}
function RotinasTab({ rituals, done, skipped, onFlip, onSkip, onOpen, onNew }) {
  const byCad = {}
  rituals.forEach(r => { const k = cadenceOf(r); (byCad[k] = byCad[k] || []).push(r) })
  return (
    <div className="rotinas">
      {rituals.length === 0 ? (
        <p className="empty">Nenhuma rotina ainda. As rotinas repetem sozinhas e alimentam o <strong>Hoje</strong>. Toca em <strong>＋ Novo</strong> e escolhe 🔁 Rotina.</p>
      ) : CADENCES.map(cd => {
        const list = byCad[cd.key]; if (!list || !list.length) return null
        const pend = list.filter(r => !isRitualDone(done, r.id, cd.key, (r.config || {}).anchor) && !isRitualSkipped(skipped, r.id, cd.key, (r.config || {}).anchor)).length
        return (
          <div key={cd.key} className="rit-group">
            <div className="rit-gh"><span className="rit-gt">{cadenceLabel(cd.key)}</span><span className="rit-gs">{cd.short}{pend ? ` · ${pend} em aberto` : ' · tudo feito 🎉'}</span></div>
            {list.map(r => <RitualRow key={r.id} r={r} done={done} skipped={skipped} onFlip={onFlip} onSkip={onSkip} onOpen={onOpen} />)}
          </div>
        )
      })}
    </div>
  )
}

// ======================= PRESENÇA (inalterado) =======================
export function PresenceBoard({ domainId, initialMoments }) {
  const [moments, setMoments] = useState(initialMoments || [])
  const [note, setNote] = useState('')
  async function submit(e) { e.preventDefault(); if (!note.trim()) return; const t = note; setNote(''); const m = await addMoment(domainId, t); if (m) setMoments(s => [m, ...s]) }
  return (
    <>
      <form onSubmit={submit} className="addmoment">
        <input value={note} onChange={e => setNote(e.target.value)} placeholder="Um momento bom de hoje…" />
        <button>registrar</button>
      </form>
      <div className="moments">
        {moments.length === 0 && <p className="empty">Nenhum momento ainda. Quando rolar um bom, registra.</p>}
        {moments.map(m => (
          <div key={m.id} className="moment">
            <div className="mnote">{m.note}</div>
            <div className="mdate">{new Date(m.occurred_at).toLocaleDateString('pt-BR')}</div>
          </div>
        ))}
      </div>
    </>
  )
}
