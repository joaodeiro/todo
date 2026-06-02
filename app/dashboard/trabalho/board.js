'use client'
import { useState, useEffect } from 'react'
import { createCardFull, moveCard, setBlocked, updateCard, deleteItem, startTimer, stopTimer, addTime, listTimeEntries } from '@/app/actions'

const COLS = [
  { key: 'backlog', label: 'Backlog' },
  { key: 'aguardando', label: 'Aguardando' },
  { key: 'fazendo', label: 'Fazendo' },
  { key: 'concluido', label: 'Concluído' }
]
const ORDER = COLS.map(c => c.key)
const REASONS = ['validação', 'dependência externa', 'interno', 'decisão pendente', 'rota/escopo']

function fmt(sec, withSec) {
  const neg = (sec || 0) < 0
  sec = Math.abs(Math.floor(sec || 0))
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60
  let out = neg ? '-' : ''
  if (h) out += h + 'h '
  out += m + 'm'
  if (withSec) out += ' ' + String(s).padStart(2, '0') + 's'
  return out.trim() || '0m'
}
function liveSecs(c, now) {
  const base = c.secs || 0
  if (c.timer_started_at) return base + Math.max(0, Math.floor((now - Date.parse(c.timer_started_at)) / 1000))
  return base
}
function Play() { return <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg> }
function Pause() { return <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor" aria-hidden="true"><path d="M6 5h4v14H6zM14 5h4v14h-4z" /></svg> }
function Shield() { return <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" aria-hidden="true"><path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" /></svg> }

export function KanbanBoard({ initialCards, areas, timeTotals }) {
  const tt = timeTotals || {}
  const [cards, setCards] = useState((initialCards || []).map(c => ({ ...c, secs: tt[c.id] || 0 })))
  const [now, setNow] = useState(Date.now())
  const [area, setArea] = useState('all')
  const [onlyBlocked, setOnlyBlocked] = useState(false)
  const [q, setQ] = useState('')
  const [selId, setSelId] = useState(null)
  const [creating, setCreating] = useState(false)
  const [switchTo, setSwitchTo] = useState(null)
  const [dragCol, setDragCol] = useState(null)
  const areaCode = {}; (areas || []).forEach(a => { areaCode[a.id] = a.code })
  const codeToId = {}; (areas || []).forEach(a => { codeToId[a.code] = a.id })

  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t) }, [])

  function move(id, dir) {
    const card = cards.find(c => c.id === id); if (!card) return
    const i = ORDER.indexOf(card.status || 'backlog')
    const ni = Math.max(0, Math.min(ORDER.length - 1, i + dir))
    if (ni === i) return
    setCards(s => s.map(c => c.id === id ? { ...c, status: ORDER[ni] } : c))
    moveCard(id, ORDER[ni])
  }
  function moveTo(id, status) {
    const card = cards.find(c => c.id === id); if (!card || (card.status || 'backlog') === status) return
    setCards(s => s.map(c => c.id === id ? { ...c, status } : c))
    moveCard(id, status)
  }
  function toggleBlock(card, type, note) {
    const nb = !card.blocked
    const patch = { blocked: nb, block_reason: nb ? type : null, block_note: nb ? note : null }
    setCards(s => s.map(c => c.id === card.id ? { ...c, ...patch } : c))
    setBlocked(card.id, nb, type, note)
  }
  async function save(id, fields) {
    const waId = fields.areaCode ? codeToId[fields.areaCode] : null
    setCards(s => s.map(c => c.id === id ? { ...c, title: fields.title, notes: fields.contexto || null, work_area_id: waId } : c))
    setSelId(null)
    await updateCard(id, { title: fields.title, contexto: fields.contexto, areaCode: fields.areaCode })
  }
  async function remove(id) { setCards(s => s.filter(c => c.id !== id)); setSelId(null); await deleteItem(id) }
  function play(card) {
    if (card.timer_started_at) return
    const runningCard = cards.find(c => c.timer_started_at)
    if (runningCard && runningCard.id !== card.id) { setSwitchTo({ from: runningCard, to: card }); return }
    doPlay(card)
  }
  function doPlay(card) {
    const iso = new Date().toISOString()
    setCards(s => s.map(c => {
      if (c.id === card.id) return { ...c, timer_started_at: iso }
      if (c.timer_started_at) { const el = Math.max(0, Math.floor((Date.now() - Date.parse(c.timer_started_at)) / 1000)); return { ...c, secs: (c.secs || 0) + (el >= 60 ? el : 0), timer_started_at: null } }
      return c
    }))
    startTimer(card.id)
  }
  function pause(card) {
    const el = Math.max(0, Math.floor((Date.now() - Date.parse(card.timer_started_at)) / 1000))
    const add = el >= 60 ? el : 0
    setCards(s => s.map(c => c.id === card.id ? { ...c, secs: (c.secs || 0) + add, timer_started_at: null } : c))
    stopTimer(card.id)
  }
  function addManual(id, minutes, note) {
    const secs = Math.round((Number(minutes) || 0) * 60); if (secs === 0) return
    setCards(s => s.map(c => c.id === id ? { ...c, secs: (c.secs || 0) + secs } : c))
    addTime(id, minutes, note)
  }
  function onCreated(card) { setCards(s => [...s, { ...card, secs: 0 }]); setCreating(false) }

  const ql = q.trim().toLowerCase()
  function visible(c) {
    if (area !== 'all' && areaCode[c.work_area_id] !== area) return false
    if (onlyBlocked && !c.blocked) return false
    if (ql) { const hay = `${c.legacy_id || ''} ${c.title || ''} ${c.notes || ''}`.toLowerCase(); if (!hay.includes(ql)) return false }
    return true
  }
  const shown = cards.filter(visible)
  const sel = selId ? cards.find(c => c.id === selId) : null

  return (
    <>
      <div className="kadd2"><button className="knew" onClick={() => setCreating(true)}>＋ Nova demanda</button></div>
      <div className="kfilters">
        {['all', 'PROD', 'DES', 'INOV'].map(a => (
          <button key={a} className={`btab ${area === a ? 'on' : ''}`} onClick={() => setArea(a)}>{a === 'all' ? 'Todas' : a}</button>
        ))}
        <button className={`btab ${onlyBlocked ? 'on' : ''}`} onClick={() => setOnlyBlocked(b => !b)}>🚫 bloqueados</button>
        <input className="ksearch" value={q} onChange={e => setQ(e.target.value)} placeholder="buscar código, título, contexto…" />
      </div>
      <div className="kanban">
        {COLS.map(col => {
          const list = shown.filter(c => (c.status || 'backlog') === col.key)
          return (
            <div key={col.key}
              className={`kcol ${dragCol === col.key ? 'over' : ''} ${col.key === 'concluido' ? 'kcol-done' : ''}`}
              onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = 'move' }}
              onDragEnter={() => setDragCol(col.key)}
              onDragLeave={e => { if (e.currentTarget === e.target) setDragCol(null) }}
              onDrop={e => { e.preventDefault(); setDragCol(null); const id = e.dataTransfer.getData('text/plain'); moveTo(id, col.key) }}>
              <h3>{col.label}<span className="n">{list.length}</span></h3>
              {list.map(c => {
                const running = !!c.timer_started_at
                return (
                  <div key={c.id} className={`kcard ${c.blocked ? 'blk' : ''} ${col.key === 'concluido' ? 'done' : ''}`}
                    draggable onDragStart={e => e.dataTransfer.setData('text/plain', c.id)} onClick={() => setSelId(c.id)}>
                    <div className="kc-top">
                      <span className="kcode">{c.legacy_id || (areaCode[c.work_area_id] || '—')}</span>
                      {c.blocked && <span className="kblk">🚫</span>}
                    </div>
                    <div className="kc-title">{c.title}</div>
                    <div className="kc-foot">
                      <span className={`kc-time ${running ? 'on' : ''}`}>{fmt(Math.max(0, liveSecs(c, now)), running)}</span>
                      <button className={`kc-play ${running ? 'on' : ''}`} onClick={e => { e.stopPropagation(); running ? pause(c) : play(c) }} aria-label={running ? 'pausar' : 'iniciar'}>
                        {running ? <Pause /> : <Play />}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
      {sel && <CardModal card={sel} now={now} areas={areas} areaCode={areaCode} onClose={() => setSelId(null)} onMove={move} onSetStatus={moveTo} onBlock={toggleBlock} onSave={save} onDelete={remove} onPlay={play} onPause={pause} onAddTime={addManual} />}
      {creating && <CreateModal areas={areas} onClose={() => setCreating(false)} onCreated={onCreated} />}
      {switchTo && <SwitchTimerModal from={switchTo.from} to={switchTo.to} now={now} onKeep={() => setSwitchTo(null)} onSwitch={() => { doPlay(switchTo.to); setSwitchTo(null) }} />}
    </>
  )
}

function CardModal({ card, now, areas, areaCode, onClose, onMove, onSetStatus, onBlock, onSave, onDelete, onPlay, onPause, onAddTime }) {
  const [tab, setTab] = useState('geral')
  const [title, setTitle] = useState(card.title || '')
  const [areaSel, setAreaSel] = useState(areaCode[card.work_area_id] || '')
  const [contexto, setContexto] = useState(card.notes || '')
  const [confirmDel, setConfirmDel] = useState(false)
  const i = ORDER.indexOf(card.status || 'backlog')
  const origemUrl = (card.origem || '').match(/^https?:\/\//) ? card.origem : null
  return (
    <div className="badge-overlay" onClick={onClose}>
      <div className="kmodal kmodal-xl" onClick={e => e.stopPropagation()}>
        <div className="km-top">
          <span className="kcode big">{card.legacy_id || '—'}</span>
          <div className="km-top-actions">
            {confirmDel ? (
              <><span className="km-confirm">Excluir mesmo?</span><button className="link" onClick={() => setConfirmDel(false)}>não</button><button className="km-del" onClick={() => onDelete(card.id)}>sim, excluir</button></>
            ) : (
              <><button className="km-del" onClick={() => setConfirmDel(true)}>excluir</button><button className="km-save" onClick={() => onSave(card.id, { title, areaCode: areaSel, contexto })}>salvar</button></>
            )}
          </div>
        </div>
        <div className="km-tabs">
          <button className={`km-tab ${tab === 'geral' ? 'on' : ''}`} onClick={() => setTab('geral')}>Visão geral</button>
          <button className={`km-tab ${tab === 'tempo' ? 'on' : ''}`} onClick={() => setTab('tempo')}>Tempo · {fmt(Math.max(0, liveSecs(card, now)))}</button>
        </div>
        {tab === 'geral' ? (
          <div className="km-grid">
            <div className="km-main">
              <input className="km-h" value={title} onChange={e => setTitle(e.target.value)} placeholder="Título da demanda" />
              <div className="km-lbl">Resumo — o que precisa ser feito</div>
              <textarea className="km-ta" rows={5} value={contexto} onChange={e => setContexto(e.target.value)} placeholder="Descreva a demanda…" />
              <div className="km-lbl">De onde veio</div>
              {origemUrl
                ? <a className="km-src" href={origemUrl} target="_blank" rel="noreferrer">{card.origem} ↗</a>
                : <div className="km-src">{card.origem || '—'}</div>}
              <div className="km-move">
                <button onClick={() => onMove(card.id, -1)} disabled={i === 0}>← voltar</button>
                <button onClick={() => onMove(card.id, 1)} disabled={i === ORDER.length - 1}>avançar →</button>
              </div>
            </div>
            <aside className="km-side">
              <div className="km-prop"><span className="km-pk">Status</span>
                <select className="sel sel-sm" value={card.status || 'backlog'} onChange={e => onSetStatus(card.id, e.target.value)}>
                  {COLS.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                </select>
              </div>
              <div className="km-prop"><span className="km-pk">Área</span>
                <select className="sel sel-sm" value={areaSel} onChange={e => setAreaSel(e.target.value)}>
                  <option value="">—</option>
                  {(areas || []).map(a => <option key={a.code} value={a.code}>{a.code}</option>)}
                </select>
              </div>
              <BlockersPanel card={card} onBlock={onBlock} />
            </aside>
          </div>
        ) : (
          <TempoTab card={card} now={now} onPlay={onPlay} onPause={onPause} onAddTime={onAddTime} />
        )}
      </div>
    </div>
  )
}

function BlockersPanel({ card, onBlock }) {
  const [adding, setAdding] = useState(false)
  const [type, setType] = useState('')
  const [note, setNote] = useState('')
  return (
    <div className="blk-panel">
      <div className="blk-head"><Shield /><span>Bloqueios</span></div>
      {card.blocked ? (
        <div className="blk-active">
          <div className="blk-type">{card.block_reason}</div>
          {card.block_note && <div className="blk-note">{card.block_note}</div>}
          <button className="link" onClick={() => onBlock(card, null, null)}>desbloquear</button>
        </div>
      ) : adding ? (
        <div className="blk-form">
          <label className="blk-lbl">Tipo de bloqueio</label>
          <select className="sel" value={type} onChange={e => setType(e.target.value)}>
            <option value="">Selecione o tipo…</option>
            {REASONS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <label className="blk-lbl">Motivo</label>
          <textarea rows={3} maxLength={600} value={note} onChange={e => setNote(e.target.value)} placeholder="Explique por que está bloqueado…" />
          <div className="blk-count">{note.length}/600</div>
          <div className="blk-actions">
            <button className="blk-add" disabled={!type} onClick={() => { onBlock(card, type, note); setAdding(false) }}>Adicionar bloqueio</button>
            <button className="blk-cancel" onClick={() => setAdding(false)}>Cancelar</button>
          </div>
        </div>
      ) : (
        <div className="blk-empty">
          <div className="blk-none">Nenhum bloqueio ativo</div>
          <button className="blk-addbtn" onClick={() => setAdding(true)}>＋ Adicionar bloqueio</button>
        </div>
      )}
    </div>
  )
}

function TempoTab({ card, now, onPlay, onPause, onAddTime }) {
  const running = !!card.timer_started_at
  const [entries, setEntries] = useState(null)
  const [min, setMin] = useState('')
  const [note, setNote] = useState('')
  useEffect(() => { let on = true; listTimeEntries(card.id).then(e => { if (on) setEntries(e) }); return () => { on = false } }, [card.id, running])
  return (
    <div className="tempo">
      <div className="tempo-top">
        <div className="tempo-total">{fmt(Math.max(0, liveSecs(card, now)), running)}</div>
        <button className={`tempo-btn ${running ? 'on' : ''}`} onClick={() => running ? onPause(card) : onPlay(card)}>
          {running ? <><Pause /> pausar</> : <><Play /> iniciar</>}
        </button>
      </div>
      <form className="tempo-add" onSubmit={e => { e.preventDefault(); onAddTime(card.id, min, note); setMin(''); setNote(''); setTimeout(() => listTimeEntries(card.id).then(setEntries), 350) }}>
        <input type="number" step="1" value={min} onChange={e => setMin(e.target.value)} placeholder="min (- desconta)" className="tempo-min" />
        <input value={note} onChange={e => setNote(e.target.value)} placeholder="anotação (opcional)" />
        <button>add manual</button>
      </form>
      <div className="km-lbl">Histórico</div>
      <div className="tempo-log">
        {entries === null && <div className="tempo-empty">carregando…</div>}
        {entries && entries.length === 0 && <div className="tempo-empty">Nenhum tempo registrado ainda.</div>}
        {entries && entries.map(e => (
          <div key={e.id} className="tempo-row">
            <span className="tempo-dur">{fmt(e.seconds)}</span>
            <span className="tempo-note">{e.note || '—'}</span>
            <span className="tempo-date">{new Date(e.occurred_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function SwitchTimerModal({ from, to, now, onKeep, onSwitch }) {
  return (
    <div className="badge-overlay" onClick={onKeep}>
      <div className="swmodal" onClick={e => e.stopPropagation()}>
        <div className="sw-icon"><Pause /></div>
        <h3 className="sw-h">Já tem um cronômetro rodando</h3>
        <p className="sw-p">Você está contando tempo em <strong>{from.title}</strong> <span className="sw-clock">({fmt(Math.max(0, liveSecs(from, now)), true)})</span>. Só dá pra cronometrar uma demanda por vez — qual fica rodando?</p>
        <div className="sw-actions">
          <button className="sw-keep" onClick={onKeep}>Continuar em "{from.title}"</button>
          <button className="sw-switch" onClick={onSwitch}>Pausar essa e contar "{to.title}"</button>
        </div>
      </div>
    </div>
  )
}

function CreateModal({ areas, onClose, onCreated }) {
  const [title, setTitle] = useState('')
  const [areaSel, setAreaSel] = useState('')
  const [contexto, setContexto] = useState('')
  const [origem, setOrigem] = useState('')
  const [saving, setSaving] = useState(false)
  async function create() {
    if (!title.trim()) return
    setSaving(true)
    const card = await createCardFull({ title, areaCode: areaSel, contexto, origem })
    setSaving(false)
    if (card) onCreated(card)
  }
  return (
    <div className="badge-overlay" onClick={onClose}>
      <div className="kmodal kmodal-xl" onClick={e => e.stopPropagation()}>
        <div className="km-top">
          <span className="km-newtag">Nova demanda</span>
          <div className="km-top-actions">
            <button className="link" onClick={onClose}>cancelar</button>
            <button className="km-save" disabled={saving} onClick={create}>criar</button>
          </div>
        </div>
        <div className="km-grid">
          <div className="km-main">
            <input className="km-h" value={title} onChange={e => setTitle(e.target.value)} placeholder="Título da demanda" autoFocus />
            <div className="km-lbl">Resumo — o que precisa ser feito</div>
            <textarea className="km-ta" rows={5} value={contexto} onChange={e => setContexto(e.target.value)} placeholder="Descreva a demanda…" />
            <div className="km-lbl">De onde veio</div>
            <input className="km-input" value={origem} onChange={e => setOrigem(e.target.value)} placeholder="reunião / sessão / link de origem" />
          </div>
          <aside className="km-side">
            <div className="km-prop"><span className="km-pk">Status</span><span className="km-pv">Backlog</span></div>
            <div className="km-prop"><span className="km-pk">Área</span>
              <select className="sel sel-sm" value={areaSel} onChange={e => setAreaSel(e.target.value)}>
                <option value="">—</option>
                {(areas || []).map(a => <option key={a.code} value={a.code}>{a.code}</option>)}
              </select>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
