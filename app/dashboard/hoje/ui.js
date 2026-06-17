'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toggleRitual, skipRitual, moveCard, reorderCards, deleteItem, startTimer, stopTimer, fazerHoje } from '@/app/actions'
import { CreateItemModal } from '@/app/dashboard/createitem'
import {
  LIFE_CATS, LIFE_COLS, catOf,
  cadenceOf, cadenceLabel, periodKey, periodLabel, isRitualDone, doneSet, dueLabel,
  skipSet, isRitualSkipped, isActiveNow, isDueToday, scheduleLabel, markedToday
} from '@/app/life'

const COLORS = ['#E64C28', '#DA2037', '#F9C972', '#1D9E75', '#7F77DD']
function burst(host) {
  if (!host) return
  const r = host.getBoundingClientRect()
  for (let i = 0; i < 14; i++) {
    const c = document.createElement('div'); c.className = 'confetti'
    c.style.left = '14px'; c.style.top = (r.height / 2) + 'px'
    c.style.background = COLORS[i % COLORS.length]; if (i % 2) c.style.borderRadius = '50%'
    host.appendChild(c)
    const a = Math.random() * 6.283, d = 66 * (0.5 + Math.random())
    const x = Math.cos(a) * d, y = Math.sin(a) * d - 14
    c.animate([{ transform: 'translate(0,0) scale(1)', opacity: 1 }, { transform: `translate(${x}px,${y + 60}px) rotate(${Math.random() * 540}deg) scale(.4)`, opacity: 0 }], { duration: 1100, easing: 'cubic-bezier(.2,.6,.3,1)', fill: 'forwards' })
    setTimeout(() => c.remove(), 1700)
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
function catMeta(key) { return LIFE_CATS.find(c => c.key === key) || LIFE_CATS[1] }
function Play() { return <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor"><path d="M8 5v14l11-7z" /></svg> }
function Pause() { return <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor"><path d="M6 5h4v14H6zM14 5h4v14h-4z" /></svg> }
function Trash() { return <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /><path d="M10 11v6M14 11v6" /></svg> }
function Ban() { return <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="m4.9 4.9 14.2 14.2" /></svg> }
function CheckIcon() { return <svg viewBox="0 0 24 24"><path className="chk" d="M5 12.5l4.5 4.5L19 7" /></svg> }

function HojeRow({ item, domMap, on, onToggle, onSkip, sub }) {
  const ref = useRef(null)
  const dom = domMap[item.domain_id]
  const canSkip = !!onSkip
  return (
    <div ref={ref} className={`hj-row ${on ? 'done' : ''}`}>
      <button className={`rit-check ${on ? 'on' : ''}`} onClick={() => onToggle(item, ref.current)} aria-label={on ? 'desmarcar' : 'concluir'}>
        <svg viewBox="0 0 24 24"><path className="chk" d="M5 12.5l4.5 4.5L19 7" /></svg>
      </button>
      <div className="hj-body">
        <Link href={`/dashboard/item/${item.id}`} className="hj-title hj-titlelink">{item.title}</Link>
        <div className="hj-meta">
          {dom && <Link href={`/dashboard/${dom.slug}`} className="hj-area">{dom.name}</Link>}
          <span className="hj-tag">{sub}</span>
        </div>
      </div>
      {canSkip && !on && <button className="hj-skip" onClick={() => onSkip(item, ref.current)} title="joga pro próximo ciclo">pular ⏭</button>}
    </div>
  )
}

export function HojePanel({ rituals: rituals0, agenda: agenda0, doneTasks, timeTotals, embTotals, ritualEvents, skipEvents, domMap, areas, chamas }) {
  const tt = timeTotals || {}, et = embTotals || {}
  const router = useRouter()
  const decorate = c => ({ ...c, secs: tt[c.id] || 0, embDone: (et[c.id] || {}).done || 0, embTotal: (et[c.id] || {}).total || 0 })
  const [view, setView] = useState('lista')
  const [done, setDone] = useState(() => doneSet(ritualEvents))
  const [skipped, setSkipped] = useState(() => skipSet(skipEvents))
  const [rituals, setRituals] = useState(rituals0 || [])
  const [tasks, setTasks] = useState(() => [...(agenda0 || []), ...(doneTasks || [])].map(decorate))
  const [now, setNow] = useState(Date.now())
  const [creating, setCreating] = useState(false)
  const [confirmDelId, setConfirmDelId] = useState(null)
  const [dragId, setDragId] = useState(null)
  const [dragCol, setDragCol] = useState(null)
  const [overInfo, setOverInfo] = useState(null)

  // o relógio só pulsa quando há cronômetro rodando e nunca durante um arrasto:
  // re-render no meio do drag nativo derruba o dragend e trava o quadro.
  const anyRunning = tasks.some(t => t.timer_started_at)
  useEffect(() => {
    if (!anyRunning || dragId) return
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [anyRunning, dragId])

  const isRit = c => c.primitive === 'ritual'
  const ritDoneOf = c => isRitualDone(done, c.id, cadenceOf(c), (c.config || {}).anchor)
  const ritSkipOf = c => isRitualSkipped(skipped, c.id, cadenceOf(c), (c.config || {}).anchor)
  const effStatus = c => isRit(c) ? (ritDoneOf(c) ? 'concluido' : (c.status || 'backlog')) : (c.status || 'backlog')
  const pend = r => isActiveNow(r) && !ritDoneOf(r) && !ritSkipOf(r)

  // rotinas relevantes pro hoje: vencendo hoje, em aberto no ciclo, feitas ou puladas no ciclo
  const ritualsHoje = rituals.filter(r => isDueToday(r) || pend(r) || ritDoneOf(r) || ritSkipOf(r))
  const boardCards = [...tasks, ...ritualsHoje]

  function notify() { try { window.dispatchEvent(new Event('timer-change')) } catch (e) {} }

  function moveTo(c, status) {
    if (isRit(c)) {
      const cad = cadenceOf(c), anchor = (c.config || {}).anchor
      const key = periodKey(cad, new Date(), anchor)
      const idk = `${c.id}|${key}`
      const wasDone = done.has(idk)
      if (status === 'concluido') {
        if (!wasDone) { setDone(s => { const n = new Set(s); n.add(idk); return n }); setSkipped(s => { const n = new Set(s); n.delete(idk); return n }); toggleRitual(c.id, c.domain_id, key, true) }
      } else {
        if (wasDone) { setDone(s => { const n = new Set(s); n.delete(idk); return n }); toggleRitual(c.id, c.domain_id, key, false) }
        setRituals(s => s.map(x => x.id === c.id ? { ...x, status } : x)); moveCard(c.id, status)
      }
      return
    }
    setTasks(s => s.map(x => {
      if (x.id !== c.id) return x
      let n = { ...x, status }
      if (x.timer_started_at && status !== 'fazendo') { const el = Math.max(0, Math.floor((Date.now() - Date.parse(x.timer_started_at)) / 1000)); n = { ...n, secs: (x.secs || 0) + (el >= 60 ? el : 0), timer_started_at: null } }
      return n
    }))
    moveCard(c.id, status); notify()
  }
  function performDrop(id, status, targetId, before) {
    setDragId(null); setOverInfo(null); setDragCol(null)
    if (!id) return
    const any = boardCards.find(c => c.id === id); if (!any) return
    if (isRit(any)) { moveTo(any, status); return }
    const dragged = any
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
    if (statusChanged) { moveCard(id, status); notify() }
    reorderCards(newList.map(c => c.id))
  }
  // reordenar por botão (sobe/desce dentro da coluna). independe do drag nativo.
  function nudge(card, dir) {
    const status = effStatus(card)
    const col = boardCards.filter(c => effStatus(c) === status)
    const free = col.filter(c => !c.blocked).sort(bySort)
    const blk = col.filter(c => c.blocked).sort(bySort)
    const group = card.blocked ? blk : free
    const i = group.findIndex(c => c.id === card.id)
    const j = i + dir
    if (i < 0 || j < 0 || j >= group.length) return
    const ng = group.slice()
    const tmp = ng[i]; ng[i] = ng[j]; ng[j] = tmp
    const ordered = card.blocked ? [...free, ...ng] : [...ng, ...blk]
    const sortById = {}; ordered.forEach((c, k) => { sortById[c.id] = k + 1 })
    setTasks(s => s.map(c => sortById[c.id] != null ? { ...c, sort: sortById[c.id] } : c))
    setRituals(s => s.map(c => sortById[c.id] != null ? { ...c, sort: sortById[c.id] } : c))
    reorderCards(ordered.map(c => c.id))
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
    startTimer(card.id); notify()
  }
  function pause(card) {
    const el = Math.max(0, Math.floor((Date.now() - Date.parse(card.timer_started_at)) / 1000))
    setTasks(s => s.map(c => c.id === card.id ? { ...c, secs: (c.secs || 0) + (el >= 60 ? el : 0), timer_started_at: null } : c))
    stopTimer(card.id); notify()
  }
  function flipRitual(r, host) {
    const key = periodKey(cadenceOf(r), new Date(), (r.config || {}).anchor)
    const id = `${r.id}|${key}`
    const isDone = done.has(id)
    setDone(s => { const n = new Set(s); isDone ? n.delete(id) : n.add(id); return n })
    if (!isDone) { setSkipped(s => { const n = new Set(s); n.delete(id); return n }); burst(host) }
    toggleRitual(r.id, r.domain_id, key, !isDone)
  }
  function doSkip(r) {
    const cad = cadenceOf(r)
    const key = periodKey(cad, new Date(), (r.config || {}).anchor)
    const id = `${r.id}|${key}`
    setSkipped(s => { const n = new Set(s); n.add(id); return n })
    setDone(s => { const n = new Set(s); n.delete(id); return n })
    skipRitual(r.id, r.domain_id, key, cad, true)
  }
  function completeTask(t, host) {
    if ((t.status || 'backlog') === 'concluido') return
    burst(host); moveTo(t, 'concluido')
  }
  function doFazerHoje(c) {
    const todayIso = new Date(new Date().toLocaleDateString('en-CA') + 'T12:00:00Z').toISOString()
    const status = c.status === 'fazendo' ? 'fazendo' : 'aguardando'
    const patch = { due_at: todayIso, status, config: { ...(c.config || {}), fazer_hoje: true } }
    setTasks(s => s.map(x => x.id === c.id ? { ...x, ...patch } : x))
    fazerHoje(c.id)
  }
  function onCreated(item) {
    setCreating(false)
    if (!item) return
    if (item.primitive === 'ritual') { setRituals(s => [...s, item]); return }
    setTasks(s => [...s, decorate(item)])
  }

  // ===== derivados pra LISTA =====
  const focoRituals = ritualsHoje.filter(r => pend(r) && isDueToday(r))
  const openRec = ritualsHoje.filter(r => pend(r) && !isDueToday(r))
  const doneTodayDaily = rituals.filter(r => cadenceOf(r) === 'diaria' && ritDoneOf(r))
  const agOpen = tasks.filter(t => (t.status || 'backlog') !== 'concluido')

  const dailyTotal = rituals.filter(r => cadenceOf(r) === 'diaria').length
  const dailyDone = doneTodayDaily.length
  const pct = dailyTotal ? Math.round((dailyDone / dailyTotal) * 100) : 0
  const hoje = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })
  const nothing = agOpen.length === 0 && focoRituals.length === 0 && openRec.length === 0 && doneTodayDaily.length === 0
  const boardEmpty = boardCards.length === 0

  return (
    <div style={{ maxWidth: view === 'lista' ? 760 : 'none', margin: '0 auto' }}>
      <header className="section-head">
        <div className="section-head-l" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>
          <h1 className="section-title">Hoje</h1>
          <span className="section-meta" style={{ textTransform: 'capitalize' }}>{hoje}</span>
        </div>
        <button className="knew" onClick={() => setCreating(true)}>＋ Novo</button>
      </header>

      <div className="kfilters">
        <div className="viewtoggle">
          <button className={`vt ${view === 'lista' ? 'on' : ''}`} onClick={() => setView('lista')} aria-label="lista"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></svg> Lista</button>
          <button className={`vt ${view === 'quadro' ? 'on' : ''}`} onClick={() => setView('quadro')} aria-label="kanban"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="3" y="3" width="7" height="18" rx="1.4" /><rect x="14" y="3" width="7" height="11" rx="1.4" /></svg> Kanban</button>
        </div>
      </div>

      {chamas && chamas.length > 0 && (
        <div className="chamas">
          {chamas.map(c => <Link key={c.id} href={`/dashboard/${c.slug}`} className="chama-chip">🔥 {c.name} <strong>{c.current}</strong></Link>)}
        </div>
      )}

      {view === 'lista' ? (
        nothing ? (
          <p className="empty">Nada pra hoje. 🌤️ Crie rotinas e tarefas nas áreas da <Link className="hj-link" href="/dashboard">Vida</Link> que elas aparecem aqui.</p>
        ) : (
          <>
            {dailyTotal > 0 && (
              <div className="hj-progress">
                <div className="hj-bar"><span style={{ width: pct + '%' }} /></div>
                <span className="hj-count">{dailyDone}/{dailyTotal} rotinas do dia</span>
              </div>
            )}

            {(agOpen.length > 0 || focoRituals.length > 0 || doneTodayDaily.length > 0) && (
              <section className="hj-sec">
                <div className="hj-sech">Pra hoje</div>
                {agOpen.map(t => {
                  const due = dueLabel(t.due_at)
                  return <HojeRow key={t.id} item={t} domMap={domMap} on={false} onToggle={completeTask} sub={markedToday(t) ? '🎯 marcado pra hoje' : `📅 ${due ? due.txt : 'do dia'}`} />
                })}
                {focoRituals.map(r => (
                  <HojeRow key={r.id} item={r} domMap={domMap} on={false} onToggle={flipRitual} onSkip={doSkip}
                    sub={`🔁 ${cadenceOf(r) === 'diaria' ? 'rotina diária' : (scheduleLabel(r) || cadenceLabel(cadenceOf(r)))}`} />
                ))}
                {doneTodayDaily.map(r => (
                  <HojeRow key={r.id} item={r} domMap={domMap} on={true} onToggle={flipRitual} sub="🔁 feito hoje" />
                ))}
              </section>
            )}

            {openRec.length > 0 && (
              <section className="hj-sec">
                <div className="hj-sech">Recorrentes em aberto</div>
                {openRec.map(r => (
                  <HojeRow key={r.id} item={r} domMap={domMap} on={false} onToggle={flipRitual} onSkip={doSkip}
                    sub={`🔁 ${cadenceLabel(cadenceOf(r))} · ${scheduleLabel(r) || periodLabel(cadenceOf(r))}`} />
                ))}
              </section>
            )}
          </>
        )
      ) : (
        boardEmpty ? (
          <p className="empty">Nada pra hoje. 🌤️ Crie rotinas e tarefas nas áreas da <Link className="hj-link" href="/dashboard">Vida</Link> que elas aparecem aqui.</p>
        ) : (
          <div className="kanban hjk">
            {LIFE_COLS.map(col => {
              const list = boardCards.filter(c => effStatus(c) === col.key).sort(bySort)
              const free = list.filter(c => !c.blocked), blk = list.filter(c => c.blocked)
              const render = (c, i, arr) => (
                <HojeCard key={c.id} c={c} now={now} colKey={col.key} dom={domMap[c.domain_id]}
                  isRit={isRit(c)} ritDone={ritDoneOf(c)} isSkip={ritSkipOf(c)} cad={cadenceOf(c)} sched={scheduleLabel(c)}
                  canUp={i > 0} canDown={i < arr.length - 1} onUp={() => nudge(c, -1)} onDown={() => nudge(c, 1)}
                  dragId={dragId} overInfo={overInfo} confirmDelId={confirmDelId}
                  onDragStart={() => { setDragId(c.id); setOverInfo(null); setDragCol(null) }} onDragEndAll={() => { setDragId(null); setOverInfo(null); setDragCol(null) }}
                  onOver={before => setOverInfo(o => (o && o.id === c.id && o.before === before) ? o : { id: c.id, before })}
                  onDropCard={before => performDrop(dragId, col.key, c.id, before)}
                  onOpen={() => router.push(`/dashboard/item/${c.id}`)} onPlay={() => play(c)} onPause={() => pause(c)}
                  onCheck={host => flipRitual(c, host)} onSkip={() => doSkip(c)} onFazerHoje={() => doFazerHoje(c)}
                  onAskDel={() => setConfirmDelId(c.id)} onCancelDel={() => setConfirmDelId(null)} onConfirmDel={() => { remove(c.id); setConfirmDelId(null) }} />
              )
              return (
                <div key={col.key} className={`kcol ${dragCol === col.key ? 'over' : ''} ${col.key === 'concluido' ? 'kcol-done' : ''}`}
                  onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = 'move' }}
                  onDragEnter={() => setDragCol(col.key)}
                  onDragLeave={e => { if (e.currentTarget === e.target) { setDragCol(null); setOverInfo(null) } }}
                  onDrop={e => { e.preventDefault(); performDrop(e.dataTransfer.getData('text/plain') || dragId, col.key, null, false) }}>
                  <h3>{col.label}<span className="n">{list.length}</span></h3>
                  {free.map(render)}
                  {free.length > 0 && blk.length > 0 && <div className="kdiv" />}
                  {blk.map(render)}
                </div>
              )
            })}
          </div>
        )
      )}

      {creating && <CreateItemModal areas={areas || []} onClose={() => setCreating(false)} onCreated={onCreated} />}
    </div>
  )
}

function HojeCard({ c, now, colKey, dom, isRit, ritDone, isSkip, cad, sched, canUp, canDown, onUp, onDown, dragId, overInfo, confirmDelId, onDragStart, onDragEndAll, onOver, onDropCard, onOpen, onPlay, onPause, onCheck, onSkip, onFazerHoje, onAskDel, onCancelDel, onConfirmDel }) {
  const ref = useRef(null)
  const running = !!c.timer_started_at
  const cm = catMeta(catOf(c))
  const due = !isRit && c.due_at ? dueLabel(c.due_at) : null
  const mk = !isRit && markedToday(c)
  const canHoje = !isRit && colKey !== 'concluido' && !(due && due.tone === 'today')
  return (
    <div ref={ref} className={`kcard ${c.blocked ? 'blk' : ''} ${colKey === 'concluido' ? 'done' : ''} ${isSkip ? 'skipped' : ''} ${dragId === c.id ? 'dragging' : ''} ${overInfo && overInfo.id === c.id ? (overInfo.before ? 'drop-before' : 'drop-after') : ''}`}
      draggable
      onDragStart={e => { onDragStart(); e.dataTransfer.setData('text/plain', c.id); e.dataTransfer.effectAllowed = 'move' }}
      onDragEnd={onDragEndAll}
      onDragOver={e => { e.preventDefault(); e.stopPropagation(); const r = e.currentTarget.getBoundingClientRect(); onOver(e.clientY < r.top + r.height / 2) }}
      onDrop={e => { e.preventDefault(); e.stopPropagation(); const r = e.currentTarget.getBoundingClientRect(); onDropCard(e.clientY < r.top + r.height / 2) }}
      onClick={onOpen}>
      <div className="hjk-nudge" draggable={false} onMouseDown={e => e.stopPropagation()} onClick={e => e.stopPropagation()}>
        <button type="button" draggable={false} disabled={!canUp} onClick={e => { e.stopPropagation(); onUp() }} aria-label="mover pra cima" title="subir">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 15l6-6 6 6" /></svg>
        </button>
        <button type="button" draggable={false} disabled={!canDown} onClick={e => { e.stopPropagation(); onDown() }} aria-label="mover pra baixo" title="descer">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
        </button>
      </div>
      <div className="kc-top">
        {dom && <span className="hjk-dom">{dom.name}</span>}
        <span className="lc-cat" title={cm.label}>{cm.icon} {isRit ? cadenceLabel(cad) : cm.label}</span>
        {isRit && sched && <span className="rit-sched">{sched}</span>}
        {due && <span className={`lc-due lc-due-${due.tone}`}>{due.txt}</span>}
        {mk && <span className="lc-today">🎯 hoje</span>}
        {c.blocked && <span className="kc-blktag"><Ban />bloqueado{(c.block_reason || c.block_note) && <span className="kc-tip">{[c.block_reason, c.block_note].filter(Boolean).join(' — ')}</span>}</span>}
        <button className="kc-del" aria-label="excluir" onClick={e => { e.stopPropagation(); onAskDel() }}><Trash /></button>
      </div>
      <div className="kc-title">{c.title}</div>
      <div className="kc-foot">
        {isRit ? (
          <>
            <button className={`kc-check ${ritDone ? 'on' : ''}`} onClick={e => { e.stopPropagation(); onCheck(ref.current) }} aria-label={ritDone ? 'desmarcar' : 'marcar feito'}><CheckIcon /></button>
            <span className={`kc-time ${ritDone ? 'on' : ''}`}>{ritDone ? '✓ ' + periodLabel(cad) : periodLabel(cad)}</span>
            {!ritDone && !isSkip && <button className="kc-skip" onClick={e => { e.stopPropagation(); onSkip() }} title="joga pro próximo ciclo">pular ⏭</button>}
            {isSkip && <span className="kc-skiptag">pulada</span>}
          </>
        ) : (
          <>
            <button className={`kc-play ${running ? 'on' : ''}`} onClick={e => { e.stopPropagation(); running ? onPause() : onPlay() }} aria-label={running ? 'pausar' : 'iniciar'}>{running ? <Pause /> : <Play />}</button>
            <span className={`kc-time ${running ? 'on' : ''}`}>{fmt(liveSecs(c, now))}</span>
            {c.embTotal > 0 && <span className={`kc-emb ${c.embDone === c.embTotal ? 'full' : ''}`}>☑ {c.embDone}/{c.embTotal}</span>}
            {canHoje && <button className="kc-skip" onClick={e => { e.stopPropagation(); onFazerHoje() }} title="joga pro hoje e prioriza">fazer hoje</button>}
          </>
        )}
      </div>
      {confirmDelId === c.id && (
        <div className="kc-confirm" onClick={e => e.stopPropagation()}>
          <span className="kc-confirm-q">Excluir demanda?</span>
          <div className="kc-confirm-btns"><button onClick={onCancelDel}>não</button><button className="danger" onClick={onConfirmDel}>sim, excluir</button></div>
        </div>
      )}
    </div>
  )
}
