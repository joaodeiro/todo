'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { DemandDetail } from '../../trabalho/board'
import { updateLifeItem, moveCard, setBlocked, deleteItem, startTimer, stopTimer, addTime, fazerHoje } from '@/app/actions'
import { catOf, cadenceLabel, cadenceOf, scheduleLabel, LIFE_CATS, CADENCES, WEEKDAYS, dueLabel } from '@/app/life'

const ORDER = ['backlog', 'aguardando', 'fazendo', 'concluido']
const todayStr = () => new Date().toLocaleDateString('en-CA')

export function LifeItemPage({ initialCard, domain, domains }) {
  const router = useRouter()
  const [card, setCard] = useState(initialCard)
  const [now, setNow] = useState(Date.now())
  const back = domain ? `/dashboard/${domain.slug}` : '/dashboard'
  const areaOptions = (domains || []).map(d => ({ value: d.id, label: d.name }))
  const isRitual = card.primitive === 'ritual'
  const cfg = card.config || {}
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t) }, [])

  function setDue(val) {
    setCard(c => ({ ...c, due_at: val ? new Date(val + 'T12:00:00Z').toISOString() : null, config: { ...(c.config || {}), ...(val ? {} : { fazer_hoje: false }) } }))
    updateLifeItem(card.id, { due_at: val || null })
  }
  function doFazerHoje() {
    setCard(c => ({ ...c, due_at: new Date(todayStr() + 'T12:00:00Z').toISOString(), status: c.status === 'fazendo' ? 'fazendo' : 'aguardando', config: { ...(c.config || {}), fazer_hoje: true } }))
    fazerHoje(card.id)
  }
  function setCad(field, val) {
    setCard(c => ({ ...c, config: { ...(c.config || {}), [field]: field === 'weekday' ? Number(val) : val } }))
    updateLifeItem(card.id, { [field]: val })
  }

  function setStatus(id, status) {
    setCard(c => {
      let next = { ...c, status }
      if (c.timer_started_at && status !== 'fazendo') {
        const el = Math.max(0, Math.floor((Date.now() - Date.parse(c.timer_started_at)) / 1000))
        next = { ...next, secs: (c.secs || 0) + (el >= 60 ? el : 0), timer_started_at: null }
      }
      return next
    })
    moveCard(id, status)
    try { window.dispatchEvent(new Event('timer-change')) } catch (e) {}
  }
  function move(id, dir) {
    const i = ORDER.indexOf(card.status || 'backlog')
    const ni = Math.max(0, Math.min(ORDER.length - 1, i + dir)); if (ni === i) return
    setStatus(id, ORDER[ni])
  }
  function block(c, type, note) {
    const nb = !c.blocked
    setCard(s => ({ ...s, blocked: nb, block_reason: nb ? type : null, block_note: nb ? note : null }))
    setBlocked(c.id, nb, type, note)
  }
  async function save(id, fields) {
    setCard(c => ({ ...c, title: fields.title, notes: fields.contexto || null, domain_id: fields.areaCode || c.domain_id }))
    await updateLifeItem(id, { title: fields.title, contexto: fields.contexto, domainId: fields.areaCode })
  }
  async function remove(id) { await deleteItem(id); router.push(back) }
  function play(c) {
    if (c.timer_started_at) return
    const iso = new Date().toISOString(); setCard(s => ({ ...s, timer_started_at: iso, status: 'fazendo' })); startTimer(c.id)
    try { window.dispatchEvent(new Event('timer-change')) } catch (e) {}
  }
  function pause(c) {
    const el = Math.max(0, Math.floor((Date.now() - Date.parse(c.timer_started_at)) / 1000))
    setCard(s => ({ ...s, secs: (s.secs || 0) + (el >= 60 ? el : 0), timer_started_at: null })); stopTimer(c.id)
    try { window.dispatchEvent(new Event('timer-change')) } catch (e) {}
  }
  function addManual(id, min, note) {
    const secs = Math.round((Number(min) || 0) * 60); if (secs === 0) return
    setCard(s => ({ ...s, secs: (s.secs || 0) + secs })); addTime(id, min, note)
  }

  const cat = catOf(card)
  const cm = LIFE_CATS.find(c => c.key === cat) || LIFE_CATS[0]
  const catTag = isRitual ? `🔁 Recorrente · ${cadenceLabel(cadenceOf(card))}${scheduleLabel(card) ? ' · ' + scheduleLabel(card) : ''}` : `${cm.icon} ${cm.label}`
  const dueVal = card.due_at ? new Date(card.due_at).toLocaleDateString('en-CA') : ''
  const dueL = card.due_at ? dueLabel(card.due_at) : null
  const cad = cadenceOf(card)

  return (
    <main className="dash wide demand-page">
      <Link href={back} className="back">← {domain ? domain.name : 'Vida'}</Link>
      <div className="li-cattag">{catTag}</div>

      <div className="li-fields">
        {!isRitual ? (
          <>
            <div className="li-field"><span className="li-fk">Data</span>
              <input type="date" className="km-input" style={{ margin: 0, width: 'auto' }} value={dueVal} onChange={e => setDue(e.target.value)} />
              {dueL && <span className={`lc-due lc-due-${dueL.tone}`}>{dueL.txt}</span>}
            </div>
            {!(dueL && dueL.tone === 'today') && <button className="li-hoje" onClick={doFazerHoje}>🎯 Fazer hoje</button>}
          </>
        ) : (
          <>
            <div className="li-field"><span className="li-fk">Cadência</span>
              <select className="sel sel-sm" value={cad} onChange={e => setCad('cadence', e.target.value)}>
                {CADENCES.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
              </select>
            </div>
            {cad === 'semanal' && (
              <div className="li-field"><span className="li-fk">Roda em</span>
                <select className="sel sel-sm" value={cfg.weekday != null ? cfg.weekday : 1} onChange={e => setCad('weekday', e.target.value)}>
                  {WEEKDAYS.map(w => <option key={w.v} value={w.v}>{w.label}</option>)}
                </select>
                <input type="time" className="km-input" style={{ margin: 0, width: 'auto' }} value={cfg.time || '08:00'} onChange={e => setCad('time', e.target.value)} />
              </div>
            )}
          </>
        )}
      </div>

      <DemandDetail
        card={card} now={now} areas={[]} areaCode={{}}
        areaOptions={areaOptions} areaCurrent={card.domain_id} areaLabel={domain ? domain.name : 'sem área'}
        onMove={move} onSetStatus={setStatus} onBlock={block} onSave={save} onDelete={remove}
        onPlay={play} onPause={pause} onAddTime={addManual} />
    </main>
  )
}
