'use client'
import { useState, useRef } from 'react'
import Link from 'next/link'
import { toggleRitual, skipRitual, moveCard } from '@/app/actions'
import { CreateItemModal } from '@/app/dashboard/createitem'
import {
  cadenceOf, cadenceLabel, periodKey, periodLabel, isRitualDone, doneSet, dueLabel,
  skipSet, isRitualSkipped, isActiveNow, isDueToday, scheduleLabel
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

export function HojePanel({ rituals: rituals0, agenda: agenda0, ritualEvents, skipEvents, domMap, areas, chamas }) {
  const [done, setDone] = useState(() => doneSet(ritualEvents))
  const [skipped, setSkipped] = useState(() => skipSet(skipEvents))
  const [agDone, setAgDone] = useState(() => new Set())
  const [rituals, setRituals] = useState(rituals0 || [])
  const [agenda, setAgenda] = useState(agenda0 || [])
  const [creating, setCreating] = useState(false)

  function flipRitual(r, host) {
    const key = periodKey(cadenceOf(r), new Date(), (r.config || {}).anchor)
    const id = `${r.id}|${key}`
    const isDone = done.has(id)
    setDone(s => { const n = new Set(s); isDone ? n.delete(id) : n.add(id); return n })
    if (!isDone) { setSkipped(s => { const n = new Set(s); n.delete(id); return n }); burst(host) }
    toggleRitual(r.id, r.domain_id, key, !isDone)
  }
  function skipR(r) {
    const cad = cadenceOf(r)
    const key = periodKey(cad, new Date(), (r.config || {}).anchor)
    const id = `${r.id}|${key}`
    setSkipped(s => { const n = new Set(s); n.add(id); return n })
    setDone(s => { const n = new Set(s); n.delete(id); return n })
    skipRitual(r.id, r.domain_id, key, cad, true)
  }
  function completeAgenda(t, host) {
    if (agDone.has(t.id)) return
    setAgDone(s => new Set(s).add(t.id)); burst(host)
    moveCard(t.id, 'concluido')
  }
  function onCreated(item) {
    setCreating(false)
    if (!item) return
    if (item.primitive === 'ritual') { setRituals(s => [...s, item]); return }
    if (item.due_at) { const end = new Date(); end.setHours(23, 59, 59, 999); if (new Date(item.due_at) <= end) setAgenda(s => [...s, item]) }
  }

  const pend = r => {
    const cad = cadenceOf(r), anchor = (r.config || {}).anchor
    return isActiveNow(r) && !isRitualDone(done, r.id, cad, anchor) && !isRitualSkipped(skipped, r.id, cad, anchor)
  }
  const focoRituals = rituals.filter(r => pend(r) && isDueToday(r))
  const openRec = rituals.filter(r => pend(r) && !isDueToday(r))
  const doneTodayDaily = rituals.filter(r => cadenceOf(r) === 'diaria' && isRitualDone(done, r.id, 'diaria'))
  const agOpen = agenda.filter(t => !agDone.has(t.id))

  const dailyTotal = rituals.filter(r => cadenceOf(r) === 'diaria').length
  const dailyDone = doneTodayDaily.length
  const pct = dailyTotal ? Math.round((dailyDone / dailyTotal) * 100) : 0
  const hoje = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })
  const nothing = agOpen.length === 0 && focoRituals.length === 0 && openRec.length === 0 && doneTodayDaily.length === 0

  return (
    <>
      <header className="section-head">
        <div className="section-head-l" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>
          <h1 className="section-title">Hoje</h1>
          <span className="section-meta" style={{ textTransform: 'capitalize' }}>{hoje}</span>
        </div>
        <button className="knew" onClick={() => setCreating(true)}>＋ Novo</button>
      </header>

      {chamas && chamas.length > 0 && (
        <div className="chamas">
          {chamas.map(c => <Link key={c.id} href={`/dashboard/${c.slug}`} className="chama-chip">🔥 {c.name} <strong>{c.current}</strong></Link>)}
        </div>
      )}

      {nothing ? (
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
                return <HojeRow key={t.id} item={t} domMap={domMap} on={false} onToggle={completeAgenda} sub={`📅 ${due ? due.txt : 'do dia'}`} />
              })}
              {focoRituals.map(r => (
                <HojeRow key={r.id} item={r} domMap={domMap} on={false} onToggle={flipRitual} onSkip={skipR}
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
                <HojeRow key={r.id} item={r} domMap={domMap} on={false} onToggle={flipRitual} onSkip={skipR}
                  sub={`🔁 ${cadenceLabel(cadenceOf(r))} · ${scheduleLabel(r) || periodLabel(cadenceOf(r))}`} />
              ))}
            </section>
          )}
        </>
      )}
      {creating && <CreateItemModal areas={areas || []} onClose={() => setCreating(false)} onCreated={onCreated} />}
    </>
  )
}
