'use client'
import { useState } from 'react'

const TYPES = {
  vida: { label: 'Vida', color: '#1D9E75' },
  trabalho: { label: 'Trabalho', color: '#378ADD' },
  rotina: { label: 'Rotina', color: '#E64C28' },
  momento: { label: 'Momento', color: '#7F77DD' },
}
const ORDER = ['vida', 'trabalho', 'rotina', 'momento']
const WD = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
const TZ = 'America/Sao_Paulo'
const pad = n => String(n).padStart(2, '0')
const ymd = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`
const timeOf = ts => new Date(ts).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: TZ })

export function CalendarView({ entries, todayStr }) {
  const byDay = {}
  entries.forEach(e => { (byDay[e.day] = byDay[e.day] || []).push(e) })
  const [ty, tm] = todayStr.split('-').map(Number)
  const [cur, setCur] = useState({ y: ty, m: tm - 1 })
  const [sel, setSel] = useState(todayStr)

  const first = new Date(cur.y, cur.m, 1)
  const startW = first.getDay()
  const ndays = new Date(cur.y, cur.m + 1, 0).getDate()
  const cells = []
  for (let i = 0; i < startW; i++) cells.push(null)
  for (let d = 1; d <= ndays; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)

  function shift(n) {
    const tot = cur.m + n
    const y = cur.y + Math.floor(tot / 12)
    const m = ((tot % 12) + 12) % 12
    setCur({ y, m })
  }

  const monthPrefix = `${cur.y}-${pad(cur.m + 1)}`
  const monthCount = entries.filter(e => e.day.startsWith(monthPrefix)).length
  const selList = byDay[sel] || []
  const selDate = new Date(sel + 'T12:00:00')
  const selLabel = selDate.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })

  return (
    <>
      <header className="section-head">
        <div className="section-head-l" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>
          <h1 className="section-title">Calendário</h1>
          <span className="section-meta">Tudo que você fez, dia a dia.</span>
        </div>
      </header>

      <div className="cal-legend">
        {ORDER.map(k => <span key={k} className="cal-leg"><span className="dot" style={{ background: TYPES[k].color }} />{TYPES[k].label}</span>)}
      </div>

      <div className="cal-nav">
        <button onClick={() => shift(-1)} aria-label="mês anterior">‹</button>
        <span className="cal-mon">{MONTHS[cur.m]} {cur.y}</span>
        <button onClick={() => shift(1)} aria-label="próximo mês">›</button>
        <button className="cal-today" onClick={() => { setCur({ y: ty, m: tm - 1 }); setSel(todayStr) }}>hoje</button>
        <span className="cal-cnt">{monthCount} {monthCount === 1 ? 'registro' : 'registros'}</span>
      </div>

      <div className="cal-grid">
        {WD.map(w => <div key={w} className="cal-wd">{w}</div>)}
        {cells.map((d, i) => {
          if (d == null) return <div key={'e' + i} className="cal-cell empty" />
          const ds = ymd(cur.y, cur.m, d)
          const list = byDay[ds] || []
          const types = ORDER.filter(t => list.some(e => e.type === t))
          return (
            <button key={ds} className={`cal-cell ${ds === todayStr ? 'today' : ''} ${ds === sel ? 'sel' : ''}`} onClick={() => setSel(ds)}>
              <span className="cal-d">{d}</span>
              {list.length > 0 && (
                <span className="cal-dots">
                  {types.map(t => <span key={t} className="dot" style={{ background: TYPES[t].color }} />)}
                  {list.length > types.length && <span className="cal-more">+{list.length - types.length}</span>}
                </span>
              )}
            </button>
          )
        })}
      </div>

      <section className="cal-day">
        <h3>{selLabel}</h3>
        {selList.length === 0 ? (
          <p className="cal-empty">Nada registrado nesse dia.</p>
        ) : (
          selList.map((e, i) => (
            <div key={i} className="cal-row">
              <span className="cr-ic" style={{ background: TYPES[e.type].color }} />
              <div className="cr-b">
                <div className="cr-t">{e.title}</div>
                <div className="cr-s">{TYPES[e.type].label} · {e.sub} · {timeOf(e.ts)}</div>
              </div>
            </div>
          ))
        )}
      </section>
    </>
  )
}
