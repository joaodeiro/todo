'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createCardFull, moveCard, reorderCards, setBlocked, updateCard, deleteItem, startTimer, stopTimer, addTime, listTimeEntries } from '@/app/actions'
import { createClient as createBrowserSupabase } from '@/lib/supabase/client'

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
function fmtSize(n) { n = n || 0; if (n < 1024) return n + ' B'; if (n < 1048576) return (n / 1024).toFixed(0) + ' KB'; return (n / 1048576).toFixed(1) + ' MB' }
function bySort(a, b) { return ((a.sort || 0) - (b.sort || 0)) || ((a.created_at || '') < (b.created_at || '') ? -1 : 1) }
function mdToHtml(src) {
  if (!src) return ''
  const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const inline = t => esc(t)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>')
    .replace(/\[([^\]]+)\]\((https?:[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>')
  const lines = src.replace(/\r\n/g, '\n').split('\n')
  let out = '', ul = false, ol = false, code = false, buf = ''
  const closeLists = () => { if (ul) { out += '</ul>'; ul = false } if (ol) { out += '</ol>'; ol = false } }
  for (const raw of lines) {
    if (/^```/.test(raw)) {
      if (code) { out += '<pre class="md-code">' + esc(buf) + '</pre>'; buf = ''; code = false }
      else { closeLists(); code = true }
      continue
    }
    if (code) { buf += raw + '\n'; continue }
    if (/^\s*$/.test(raw)) { closeLists(); continue }
    let m
    if ((m = raw.match(/^(#{1,4})\s+(.*)$/))) { closeLists(); const n = m[1].length; out += `<h${n}>${inline(m[2])}</h${n}>`; continue }
    if (/^\s*([-*])\s+/.test(raw)) { if (!ul) { closeLists(); out += '<ul>'; ul = true } out += '<li>' + inline(raw.replace(/^\s*[-*]\s+/, '')) + '</li>'; continue }
    if (/^\s*\d+\.\s+/.test(raw)) { if (!ol) { closeLists(); out += '<ol>'; ol = true } out += '<li>' + inline(raw.replace(/^\s*\d+\.\s+/, '')) + '</li>'; continue }
    if (/^\s*>\s?/.test(raw)) { closeLists(); out += '<blockquote>' + inline(raw.replace(/^\s*>\s?/, '')) + '</blockquote>'; continue }
    if (/^\s*([-*_])\1{2,}\s*$/.test(raw)) { closeLists(); out += '<hr>'; continue }
    closeLists(); out += '<p>' + inline(raw) + '</p>'
  }
  if (code) out += '<pre class="md-code">' + esc(buf) + '</pre>'
  closeLists()
  return out
}
function Play() { return <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg> }
function Pause() { return <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor" aria-hidden="true"><path d="M6 5h4v14H6zM14 5h4v14h-4z" /></svg> }
function Shield() { return <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" aria-hidden="true"><path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" /></svg> }
function Ban() { return <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10" /><path d="m4.9 4.9 14.2 14.2" /></svg> }
function Trash() { return <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /><path d="M10 11v6M14 11v6" /></svg> }
function linkify(text) {
  if (!text) return null
  return String(text).split(/(https?:\/\/[^\s]+)/g).map((p, i) =>
    /^https?:\/\//.test(p)
      ? <a key={i} className="blk-link" href={p} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}>{p}</a>
      : p)
}
function StatusPill({ status }) {
  const map = { backlog: ['Backlog', '#8C867C'], aguardando: ['Aguardando', '#E6A23C'], fazendo: ['Fazendo', '#378ADD'], concluido: ['Concluído', '#1D9E75'] }
  const [label, color] = map[status || 'backlog'] || map.backlog
  return <span className="dmd-pill"><span className="dmd-pill-dot" style={{ background: color }} />{label}</span>
}

export function KanbanBoard({ initialCards, areas, timeTotals }) {
  const router = useRouter()
  const tt = timeTotals || {}
  const [cards, setCards] = useState((initialCards || []).map(c => ({ ...c, secs: tt[c.id] || 0 })))
  const [now, setNow] = useState(Date.now())
  const [area, setArea] = useState('all')
  const [onlyBlocked, setOnlyBlocked] = useState(false)
  const [q, setQ] = useState('')
  const [selId, setSelId] = useState(null)
  const [creating, setCreating] = useState(false)
  const [switchTo, setSwitchTo] = useState(null)
  const [confirmDelId, setConfirmDelId] = useState(null)
  const [dragCol, setDragCol] = useState(null)
  const [dragId, setDragId] = useState(null)
  const [overInfo, setOverInfo] = useState(null)
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
  // solta o card numa posição: reordena dentro da coluna (e muda status se cruzou coluna)
  function performDrop(id, status, targetId, before) {
    setDragId(null); setOverInfo(null); setDragCol(null)
    if (!id || id === targetId) return
    const dragged = cards.find(c => c.id === id); if (!dragged) return
    const colCards = cards.filter(c => (c.status || 'backlog') === status && c.id !== id)
    const rest = [...colCards.filter(c => !c.blocked).sort(bySort), ...colCards.filter(c => c.blocked).sort(bySort)]
    let idx = rest.length
    if (targetId) { const ti = rest.findIndex(c => c.id === targetId); if (ti >= 0) idx = before ? ti : ti + 1 }
    const newList = [...rest.slice(0, idx), dragged, ...rest.slice(idx)]
    const sortById = {}; newList.forEach((c, i) => { sortById[c.id] = i + 1 })
    const statusChanged = (dragged.status || 'backlog') !== status
    setCards(s => s.map(c => sortById[c.id] != null ? { ...c, sort: sortById[c.id], status: c.id === id ? status : c.status } : c))
    if (statusChanged) moveCard(id, status)
    reorderCards(newList.map(c => c.id))
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
    try { window.dispatchEvent(new Event('timer-change')) } catch (e) {}
  }
  function pause(card) {
    const el = Math.max(0, Math.floor((Date.now() - Date.parse(card.timer_started_at)) / 1000))
    const add = el >= 60 ? el : 0
    setCards(s => s.map(c => c.id === card.id ? { ...c, secs: (c.secs || 0) + add, timer_started_at: null } : c))
    stopTimer(card.id)
    try { window.dispatchEvent(new Event('timer-change')) } catch (e) {}
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
  const doneN = cards.filter(c => (c.status || 'backlog') === 'concluido').length
  const sel = selId ? cards.find(c => c.id === selId) : null

  return (
    <>
      <header className="section-head">
        <div className="section-head-l">
          <h1 className="section-title">Trabalho</h1>
          <span className="section-meta">{cards.length} demandas{doneN ? ` · ${doneN} concluídas` : ''}</span>
        </div>
        <button className="knew" onClick={() => router.push('/dashboard/trabalho/nova')} onMouseEnter={() => router.prefetch('/dashboard/trabalho/nova')}>＋ Nova demanda</button>
      </header>
      <div className="kfilters">
        {['all', 'PROD', 'DES', 'INOV'].map(a => (
          <button key={a} className={`btab ${area === a ? 'on' : ''}`} onClick={() => setArea(a)}>{a === 'all' ? 'Todas' : a}</button>
        ))}
        <button className={`btab ${onlyBlocked ? 'on' : ''}`} onClick={() => setOnlyBlocked(b => !b)}>🚫 bloqueados</button>
        <input className="ksearch" value={q} onChange={e => setQ(e.target.value)} placeholder="buscar código, título, contexto…" />
      </div>
      <div className="kanban">
        {COLS.map(col => {
          const list = shown.filter(c => (c.status || 'backlog') === col.key).sort(bySort)
          return (
            <div key={col.key}
              className={`kcol ${dragCol === col.key ? 'over' : ''} ${col.key === 'concluido' ? 'kcol-done' : ''}`}
              onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = 'move' }}
              onDragEnter={() => setDragCol(col.key)}
              onDragLeave={e => { if (e.currentTarget === e.target) { setDragCol(null); setOverInfo(null) } }}
              onDrop={e => { e.preventDefault(); performDrop(e.dataTransfer.getData('text/plain') || dragId, col.key, null, false) }}>
              <h3>{col.label}<span className="n">{list.length}</span></h3>
              {(() => {
                const free = list.filter(c => !c.blocked)
                const blocked = list.filter(c => c.blocked)
                const renderCard = c => {
                  const running = !!c.timer_started_at
                  return (
                  <div key={c.id} className={`kcard ${c.blocked ? 'blk' : ''} ${col.key === 'concluido' ? 'done' : ''} ${dragId === c.id ? 'dragging' : ''} ${overInfo && overInfo.id === c.id ? (overInfo.before ? 'drop-before' : 'drop-after') : ''}`}
                    draggable
                    onDragStart={e => { setDragId(c.id); e.dataTransfer.setData('text/plain', c.id); e.dataTransfer.effectAllowed = 'move' }}
                    onDragEnd={() => { setDragId(null); setOverInfo(null); setDragCol(null) }}
                    onDragOver={e => { e.preventDefault(); e.stopPropagation(); const r = e.currentTarget.getBoundingClientRect(); const before = e.clientY < r.top + r.height / 2; setOverInfo(o => (o && o.id === c.id && o.before === before) ? o : { id: c.id, before }) }}
                    onDrop={e => { e.preventDefault(); e.stopPropagation(); const r = e.currentTarget.getBoundingClientRect(); const before = e.clientY < r.top + r.height / 2; performDrop(e.dataTransfer.getData('text/plain') || dragId, col.key, c.id, before) }}
                    onMouseEnter={() => router.prefetch(`/dashboard/trabalho/${encodeURIComponent(c.legacy_id || c.id)}`)}
                    onClick={() => router.push(`/dashboard/trabalho/${encodeURIComponent(c.legacy_id || c.id)}`)}>
                    <div className="kc-top">
                      <span className="kcode">{c.legacy_id || (areaCode[c.work_area_id] || '—')}</span>
                      {c.blocked && (
                        <span className="kc-blktag"><Ban />bloqueado
                          {(c.block_reason || c.block_note) && <span className="kc-tip">{[c.block_reason, c.block_note].filter(Boolean).join(' — ')}</span>}
                        </span>
                      )}
                      <button className="kc-del" aria-label="excluir" onClick={e => { e.stopPropagation(); setConfirmDelId(c.id) }}><Trash /></button>
                    </div>
                    <div className="kc-title">{c.title}</div>
                    <div className="kc-foot">
                      <button className={`kc-play ${running ? 'on' : ''}`} onClick={e => { e.stopPropagation(); running ? pause(c) : play(c) }} aria-label={running ? 'pausar' : 'iniciar'}>
                        {running ? <Pause /> : <Play />}
                      </button>
                      <span className={`kc-time ${running ? 'on' : ''}`}>{fmt(Math.max(0, liveSecs(c, now)), running)}</span>
                    </div>
                    {confirmDelId === c.id && (
                      <div className="kc-confirm" onClick={e => e.stopPropagation()}>
                        <span className="kc-confirm-q">Excluir demanda?</span>
                        <div className="kc-confirm-btns">
                          <button onClick={() => setConfirmDelId(null)}>não</button>
                          <button className="danger" onClick={() => { remove(c.id); setConfirmDelId(null) }}>sim, excluir</button>
                        </div>
                      </div>
                    )}
                  </div>
                  )
                }
                return (
                  <>
                    {free.map(renderCard)}
                    {free.length > 0 && blocked.length > 0 && <div className="kdiv" />}
                    {blocked.map(renderCard)}
                  </>
                )
              })()}
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

export function DemandDetail({ card, now, areas, areaCode, onMove, onSetStatus, onBlock, onSave, onDelete, onPlay, onPause, onAddTime }) {
  const [tab, setTab] = useState('geral')
  const [title, setTitle] = useState(card.title || '')
  const [areaSel, setAreaSel] = useState(areaCode[card.work_area_id] || '')
  const [contexto, setContexto] = useState(card.notes || '')
  const [confirmDel, setConfirmDel] = useState(false)
  const [supabase] = useState(() => createBrowserSupabase())
  const [atts, setAtts] = useState(null)
  const [lightbox, setLightbox] = useState(null)
  const [doc, setDoc] = useState(null)
  const i = ORDER.indexOf(card.status || 'backlog')
  const origemUrl = (card.origem || '').match(/^https?:\/\//) ? card.origem : null
  const titleRef = useRef(null)
  const [copied, setCopied] = useState(false)
  useEffect(() => { const el = titleRef.current; if (el) { el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px' } }, [title])
  function copyLink() { try { navigator.clipboard.writeText(window.location.href); setCopied(true); setTimeout(() => setCopied(false), 1500) } catch (e) {} }

  async function loadAtts() {
    const { data } = await supabase.from('attachment').select('*').eq('item_id', card.id).order('created_at')
    const rows = data || []
    const withUrls = await Promise.all(rows.map(async r => {
      if (r.kind === 'image') {
        const { data: s } = await supabase.storage.from('attachments').createSignedUrl(r.path, 3600)
        return { ...r, url: s?.signedUrl || null }
      }
      if (r.kind === 'link') return { ...r, url: r.path }
      return r
    }))
    setAtts(withUrls)
  }
  useEffect(() => { loadAtts() }, [card.id]) // eslint-disable-line react-hooks/exhaustive-deps

  async function addFiles(fileList) {
    const files = Array.from(fileList || [])
    for (const file of files) {
      const ext = (file.name.split('.').pop() || '').toLowerCase()
      const mime = file.type || ''
      let kind = 'text'
      if (mime.startsWith('image/') || ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'avif'].includes(ext)) kind = 'image'
      else if (ext === 'md' || ext === 'markdown') kind = 'md'
      const path = `${card.id}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
      const { error } = await supabase.storage.from('attachments').upload(path, file, { contentType: mime || undefined })
      if (error) { console.error('upload', error); continue }
      await supabase.from('attachment').insert({ item_id: card.id, kind, filename: file.name, mime, size: file.size, path })
    }
    loadAtts()
  }
  async function delAtt(a) {
    setAtts(s => (s || []).filter(x => x.id !== a.id))
    if (a.kind !== 'link') await supabase.storage.from('attachments').remove([a.path])
    await supabase.from('attachment').delete().eq('id', a.id)
  }
  async function addLink(rawUrl, label) {
    let url = (rawUrl || '').trim()
    if (!url || /^javascript:/i.test(url)) return
    if (!/^https?:\/\//i.test(url)) url = 'https://' + url
    await supabase.from('attachment').insert({ item_id: card.id, kind: 'link', filename: (label || '').trim() || url, mime: 'link', size: null, path: url })
    loadAtts()
  }
  async function openAtt(a) {
    if (a.kind === 'image') { setLightbox(a.url); return }
    const { data } = await supabase.storage.from('attachments').download(a.path)
    const text = data ? await data.text() : ''
    setDoc({ name: a.filename, kind: a.kind, text })
  }

  return (
    <div className="dmd">
      <div className="dmd-bar">
        <div className="dmd-pills">
          <span className="kcode big">{card.legacy_id || '—'}</span>
          <StatusPill status={card.status} />
          {card.blocked && <span className="dmd-pill-blk"><Ban /> bloqueado</span>}
        </div>
        <div className="dmd-bar-actions">
          <button className="dmd-ghost" onClick={copyLink}>{copied ? '✓ copiado' : 'copiar link'}</button>
          {confirmDel ? (
            <><span className="km-confirm">Excluir mesmo?</span><button className="link" onClick={() => setConfirmDel(false)}>não</button><button className="km-del" onClick={() => onDelete(card.id)}>sim, excluir</button></>
          ) : (
            <><button className="km-del" onClick={() => setConfirmDel(true)}>excluir</button><button className="km-save" onClick={() => onSave(card.id, { title, areaCode: areaSel, contexto })}>salvar</button></>
          )}
        </div>
      </div>

      <textarea ref={titleRef} className="dmd-title" rows={1} value={title} onChange={e => setTitle(e.target.value)} placeholder="Título da demanda" />
      <div className="dmd-metarow">
        <span>{areaSel || 'sem área'}</span><span className="dmd-sep">·</span>
        <span>{card.origem || 'sem origem'}</span><span className="dmd-sep">·</span>
        <span>⏱ {fmt(Math.max(0, liveSecs(card, now)))}</span>
      </div>

      <div className="dmd-tabs">
        <button className={`dmd-tab ${tab === 'geral' ? 'on' : ''}`} onClick={() => setTab('geral')}>Visão geral</button>
        <button className={`dmd-tab ${tab === 'tempo' ? 'on' : ''}`} onClick={() => setTab('tempo')}>Tempo · {fmt(Math.max(0, liveSecs(card, now)))}</button>
        <button className={`dmd-tab ${tab === 'anexos' ? 'on' : ''}`} onClick={() => setTab('anexos')}>Anexos · {atts ? atts.length : 0}</button>
      </div>

      <div className="dmd-grid">
        <div className="dmd-main">
          {tab === 'geral' && (
            <>
              <div className="dmd-lbl">Resumo — o que precisa ser feito</div>
              <textarea className="dmd-resumo" rows={7} value={contexto} onChange={e => setContexto(e.target.value)} placeholder="Descreva a demanda…" />
              <div className="dmd-lbl">De onde veio</div>
              {origemUrl
                ? <a className="km-src" href={origemUrl} target="_blank" rel="noreferrer">{card.origem} ↗</a>
                : <div className="km-src">{card.origem || '—'}</div>}
              <div className="dmd-move">
                <button onClick={() => onMove(card.id, -1)} disabled={i === 0}>← voltar</button>
                <button onClick={() => onMove(card.id, 1)} disabled={i === ORDER.length - 1}>avançar →</button>
              </div>
            </>
          )}
          {tab === 'tempo' && <TempoTab card={card} now={now} onPlay={onPlay} onPause={onPause} onAddTime={onAddTime} />}
          {tab === 'anexos' && <AnexosTab atts={atts} onAdd={addFiles} onAddLink={addLink} onDelete={delAtt} onOpen={openAtt} />}
        </div>

        <aside className="dmd-side">
          <div className="dmd-props">
            <div className="dmd-prop"><span className="dmd-pk">Status</span>
              <select className="sel sel-sm" value={card.status || 'backlog'} onChange={e => onSetStatus(card.id, e.target.value)}>
                {COLS.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
              </select>
            </div>
            <div className="dmd-prop"><span className="dmd-pk">Área</span>
              <select className="sel sel-sm" value={areaSel} onChange={e => setAreaSel(e.target.value)}>
                <option value="">—</option>
                {(areas || []).map(a => <option key={a.code} value={a.code}>{a.code}</option>)}
              </select>
            </div>
            <div className="dmd-prop"><span className="dmd-pk">Tempo</span><span className="dmd-pv">{fmt(Math.max(0, liveSecs(card, now)))}</span></div>
            <div className="dmd-prop"><span className="dmd-pk">Anexos</span><span className="dmd-pv">{atts ? atts.length : 0}</span></div>
          </div>
          <BlockersPanel card={card} onBlock={onBlock} />
        </aside>
      </div>

      {lightbox && <div className="lightbox" onClick={() => setLightbox(null)}><img src={lightbox} alt="" /></div>}
      {doc && (
        <div className="badge-overlay" onClick={() => setDoc(null)}>
          <div className="docview" onClick={e => e.stopPropagation()}>
            <div className="docview-top"><span className="docview-name">{doc.name}</span><button className="link" onClick={() => setDoc(null)}>fechar</button></div>
            {doc.kind === 'md'
              ? <div className="docview-md" dangerouslySetInnerHTML={{ __html: mdToHtml(doc.text) }} />
              : <pre className="docview-pre">{doc.text}</pre>}
          </div>
        </div>
      )}
    </div>
  )
}

function CardModal(props) {
  return (
    <div className="badge-overlay" onClick={props.onClose}>
      <div className="kmodal kmodal-xl" onClick={e => e.stopPropagation()}>
        <DemandDetail {...props} openHref={`/dashboard/trabalho/${encodeURIComponent(props.card.legacy_id || props.card.id)}`} />
      </div>
    </div>
  )
}

function AnexosTab({ atts, onAdd, onAddLink, onDelete, onOpen }) {
  const [over, setOver] = useState(false)
  const [url, setUrl] = useState('')
  const [label, setLabel] = useState('')
  const images = (atts || []).filter(a => a.kind === 'image')
  const links = (atts || []).filter(a => a.kind === 'link')
  const files = (atts || []).filter(a => a.kind !== 'image' && a.kind !== 'link')
  function submitLink(e) { e.preventDefault(); if (!url.trim()) return; onAddLink(url, label); setUrl(''); setLabel('') }
  return (
    <div className="anx">
      <label
        className={`anx-drop ${over ? 'over' : ''}`}
        onDragOver={e => { e.preventDefault(); setOver(true) }}
        onDragLeave={() => setOver(false)}
        onDrop={e => { e.preventDefault(); setOver(false); onAdd(e.dataTransfer.files) }}>
        <input type="file" multiple accept="image/*,.md,.markdown,.txt,text/*" hidden onChange={e => { onAdd(e.target.files); e.target.value = '' }} />
        <div className="anx-drop-ico">⬆</div>
        <div className="anx-drop-t">Arraste arquivos aqui ou clique pra escolher</div>
        <div className="anx-drop-s">imagens · .md · .txt</div>
      </label>
      <form className="anx-linkadd" onSubmit={submitLink}>
        <input type="url" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://… colar um link" />
        <input value={label} onChange={e => setLabel(e.target.value)} placeholder="rótulo (opcional)" />
        <button>+ link</button>
      </form>
      {atts === null && <div className="anx-empty">carregando…</div>}
      {atts && atts.length === 0 && <div className="anx-empty">Nenhum anexo ou link ainda.</div>}
      {links.length > 0 && (
        <div className="anx-files">
          {links.map(a => (
            <div key={a.id} className="anx-file">
              <span className="anx-file-ico anx-ico-link">↗</span>
              <a className="anx-file-name anx-link-a" href={a.path} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}>{a.filename || a.path}</a>
              <button className="anx-del2" onClick={() => onDelete(a)}>remover</button>
            </div>
          ))}
        </div>
      )}
      {images.length > 0 && (
        <div className="anx-grid">
          {images.map(a => (
            <div key={a.id} className="anx-thumb" onClick={() => onOpen(a)}>
              {a.url ? <img src={a.url} alt={a.filename} /> : <div className="anx-thumb-x">imagem</div>}
              <button className="anx-del" onClick={e => { e.stopPropagation(); onDelete(a) }} aria-label="excluir">×</button>
            </div>
          ))}
        </div>
      )}
      {files.length > 0 && (
        <div className="anx-files">
          {files.map(a => (
            <div key={a.id} className="anx-file" onClick={() => onOpen(a)}>
              <span className="anx-file-ico">{a.kind === 'md' ? 'MD' : 'TXT'}</span>
              <span className="anx-file-name">{a.filename}</span>
              <span className="anx-file-sz">{fmtSize(a.size)}</span>
              <button className="anx-del2" onClick={e => { e.stopPropagation(); onDelete(a) }}>excluir</button>
            </div>
          ))}
        </div>
      )}
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
          {card.block_note && <div className="blk-note">{linkify(card.block_note)}</div>}
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
