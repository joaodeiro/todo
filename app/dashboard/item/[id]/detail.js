'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { DemandDetail } from '../../trabalho/board'
import { updateLifeItem, moveCard, setBlocked, deleteItem, startTimer, stopTimer, addTime } from '@/app/actions'
import { catOf, cadenceLabel, cadenceOf, scheduleLabel } from '@/app/life'

const ORDER = ['backlog', 'aguardando', 'fazendo', 'concluido']

export function LifeItemPage({ initialCard, domain }) {
  const router = useRouter()
  const [card, setCard] = useState(initialCard)
  const [now, setNow] = useState(Date.now())
  const back = domain ? `/dashboard/${domain.slug}` : '/dashboard'
  const isRitual = card.primitive === 'ritual'
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t) }, [])

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
    setCard(c => ({ ...c, title: fields.title, notes: fields.contexto || null }))
    await updateLifeItem(id, { title: fields.title, contexto: fields.contexto })
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
  const catTag = isRitual ? `🔁 Rotina ${cadenceLabel(cadenceOf(card))}${scheduleLabel(card) ? ' · ' + scheduleLabel(card) : ''}` : (cat === 'agenda' ? '📅 Do dia' : '🌱 Quando der')

  return (
    <main className="dash wide demand-page">
      <Link href={back} className="back">← {domain ? domain.name : 'Vida'}</Link>
      <div className="li-cattag">{catTag}</div>
      <DemandDetail
        card={card} now={now} areas={[]} areaCode={{}}
        onMove={move} onSetStatus={setStatus} onBlock={block} onSave={save} onDelete={remove}
        onPlay={play} onPause={pause} onAddTime={addManual} />
    </main>
  )
}
