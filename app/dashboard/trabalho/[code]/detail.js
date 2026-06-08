'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { DemandDetail } from '../board'
import { updateCard, moveCard, setBlocked, deleteItem, startTimer, stopTimer, addTime } from '@/app/actions'

const ORDER = ['backlog', 'aguardando', 'fazendo', 'concluido']

export function DemandPage({ initialCard, areas }) {
  const router = useRouter()
  const [card, setCard] = useState(initialCard)
  const [now, setNow] = useState(Date.now())
  const areaCode = {}; (areas || []).forEach(a => { areaCode[a.id] = a.code })
  const codeToId = {}; (areas || []).forEach(a => { codeToId[a.code] = a.id })
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
    const waId = fields.areaCode ? codeToId[fields.areaCode] : null
    setCard(c => ({ ...c, title: fields.title, notes: fields.contexto || null, work_area_id: waId }))
    const patch = await updateCard(id, { title: fields.title, contexto: fields.contexto, areaCode: fields.areaCode })
    if (patch && patch.legacy_id) {
      setCard(c => ({ ...c, legacy_id: patch.legacy_id }))
      router.replace(`/dashboard/trabalho/${encodeURIComponent(patch.legacy_id)}`)
    }
  }
  async function remove(id) { await deleteItem(id); router.push('/dashboard/trabalho') }
  function play(c) {
    if (c.timer_started_at) return
    const iso = new Date().toISOString(); setCard(s => ({ ...s, timer_started_at: iso, status: 'fazendo' })); startTimer(c.id)
    try { window.dispatchEvent(new Event('timer-change')) } catch (e) {}
  }
  function pause(c) {
    const el = Math.max(0, Math.floor((Date.now() - Date.parse(c.timer_started_at)) / 1000))
    const add = el >= 60 ? el : 0
    setCard(s => ({ ...s, secs: (s.secs || 0) + add, timer_started_at: null })); stopTimer(c.id)
    try { window.dispatchEvent(new Event('timer-change')) } catch (e) {}
  }
  function addManual(id, min, note) {
    const secs = Math.round((Number(min) || 0) * 60); if (secs === 0) return
    setCard(s => ({ ...s, secs: (s.secs || 0) + secs })); addTime(id, min, note)
  }

  return (
    <main className="dash wide demand-page">
      <Link href="/dashboard/trabalho" className="back">← Kanban</Link>
      <DemandDetail
        card={card} now={now} areas={areas} areaCode={areaCode}
        onMove={move} onSetStatus={setStatus} onBlock={block} onSave={save} onDelete={remove}
        onPlay={play} onPause={pause} onAddTime={addManual} />
    </main>
  )
}
