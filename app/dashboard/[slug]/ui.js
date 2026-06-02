'use client'
import { useState, useRef } from 'react'
import { createItem, completeItem, addMoment } from '@/app/actions'
import { useReveal } from '@/app/dashboard/reveal'

const COLORS = ['#E64C28', '#DA2037', '#F9C972', '#1D9E75', '#7F77DD']
function tinyBurst(host) {
  if (!host) return
  const r = host.getBoundingClientRect()
  for (let i = 0; i < 12; i++) {
    const c = document.createElement('div')
    c.className = 'confetti'
    c.style.left = '22px'; c.style.top = (r.height / 2) + 'px'
    c.style.background = COLORS[i % COLORS.length]
    if (i % 2) c.style.borderRadius = '50%'
    host.appendChild(c)
    const a = Math.random() * 6.283, d = 70 * (0.5 + Math.random())
    const x = Math.cos(a) * d, y = Math.sin(a) * d - 14
    c.animate([{ transform: 'translate(0,0) scale(1)', opacity: 1 }, { transform: `translate(${x}px,${y + 60}px) rotate(${Math.random() * 540 - 270}deg) scale(.4)`, opacity: 0 }],
      { duration: 1100 + Math.random() * 500, easing: 'cubic-bezier(.2,.6,.3,1)', fill: 'forwards' })
    setTimeout(() => c.remove(), 1700)
  }
}

function AddItem({ onAdd }) {
  const [title, setTitle] = useState('')
  function submit(e) { e.preventDefault(); if (!title.trim()) return; const t = title; setTitle(''); onAdd(t) }
  return (
    <form onSubmit={submit} className="additem">
      <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Adicionar algo…" />
      <button aria-label="adicionar">＋</button>
    </form>
  )
}

function Row({ item, onComplete }) {
  const ref = useRef(null)
  const done = item.status === 'done'
  function click() { if (done) return; tinyBurst(ref.current); onComplete(item.id) }
  return (
    <div ref={ref} className={`taskrow ${done ? 'done' : ''}`} onClick={click}>
      <div className="box"><svg viewBox="0 0 24 24"><path className="chk" d="M5 12.5l4.5 4.5L19 7" /></svg></div>
      <div className="lbl">{item.title}</div>
      <span className="yay">Boa! 🙌</span>
    </div>
  )
}

export function DomainBoard({ domain, initialItems }) {
  const [items, setItems] = useState(initialItems || [])
  const reveal = useReveal()
  async function add(title) { const it = await createItem(domain.id, title); if (it) setItems(s => [...s, it]) }
  async function complete(id) {
    setItems(s => s.map(i => i.id === id ? { ...i, status: 'done' } : i))
    const res = await completeItem(id)
    if (res && res.earned && res.earned.length && reveal) reveal.push(res.earned)
  }
  const open = items.filter(i => i.status !== 'done')
  const done = items.filter(i => i.status === 'done')
  return (
    <>
      <div className="trail">
        {done.map(i => <span key={i.id} className="tnode" title={i.title} />)}
        {done.length === 0 && <span className="sub">sua trilha começa no primeiro ✓</span>}
      </div>
      <AddItem onAdd={add} />
      <div className="items">
        {open.length === 0 && done.length === 0 && <p className="empty">Nada por aqui. Adiciona a primeira coisa. 👆</p>}
        {open.map(i => <Row key={i.id} item={i} onComplete={complete} />)}
        {done.map(i => <Row key={i.id} item={i} onComplete={complete} />)}
      </div>
    </>
  )
}

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
