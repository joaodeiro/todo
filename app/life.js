// Modelo do dia a dia da Vida — constantes e helpers de período.
// Cada item de vida nasce com uma CATEGORIA:
//   rotina  → primitive 'ritual' + config.cadence (recorrente, reseta por período)
//   agenda  → primitive 'task'  + due_at (tem data, aparece no Hoje quando vence)
//   solta   → primitive 'task'  sem due_at (sem prazo, não recorrente)
// Tudo é client-safe (funções puras), sem 'use server'.

export const LIFE_CATS = [
  { key: 'agenda', label: 'Do dia', icon: '📅', hint: 'tem uma data' },
  { key: 'solta', label: 'Quando der', icon: '🌱', hint: 'sem prazo, não recorrente' },
  { key: 'rotina', label: 'Rotina', icon: '🔁', hint: 'recorrente, reseta sozinha' },
]

export const CADENCES = [
  { key: 'diaria', label: 'Diária', short: 'todo dia' },
  { key: 'cada3dias', label: 'A cada 3 dias', short: 'de 3 em 3 dias' },
  { key: 'semanal', label: 'Semanal', short: 'toda semana' },
  { key: 'quinzenal', label: 'Quinzenal', short: 'a cada 15 dias' },
  { key: 'mensal', label: 'Mensal', short: 'todo mês' },
  { key: 'trimestral', label: 'Trimestral', short: 'a cada 3 meses' },
  { key: 'semestral', label: 'Semestral', short: 'a cada 6 meses' },
  { key: 'anual', label: 'Anual', short: 'todo ano' },
]

export const LIFE_COLS = [
  { key: 'backlog', label: 'Backlog' },
  { key: 'aguardando', label: 'Aguardando' },
  { key: 'fazendo', label: 'Fazendo' },
  { key: 'concluido', label: 'Concluído' },
]
export const LIFE_ORDER = LIFE_COLS.map(c => c.key)

export function cadenceLabel(key) { const c = CADENCES.find(c => c.key === key); return c ? c.label : 'Diária' }
export function cadenceShort(key) { const c = CADENCES.find(c => c.key === key); return c ? c.short : 'todo dia' }
export function catOf(item) {
  if (item.primitive === 'ritual') return 'rotina'
  return (item.config && item.config.life_kind) || (item.due_at ? 'agenda' : 'solta')
}
export function cadenceOf(item) { return (item.config && item.config.cadence) || 'diaria' }

function startOfDay(d) { const x = new Date(d); x.setHours(0, 0, 0, 0); return x }
export function ymd(d) {
  const x = new Date(d)
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`
}
// semana ISO (segunda a domingo)
function isoWeekParts(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const day = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - day)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const week = Math.ceil((((d - yearStart) / 86400000) + 1) / 7)
  return [d.getUTCFullYear(), week]
}

// chave do período atual de uma cadência — usada pra saber "já fiz nesse ciclo?"
export function periodKey(cadence, date = new Date(), anchor) {
  const d = new Date(date)
  const y = d.getFullYear(), m = d.getMonth()
  switch (cadence) {
    case 'cada3dias': {
      const epoch = anchor ? new Date(anchor) : new Date(2024, 0, 1)
      const days = Math.floor((startOfDay(d) - startOfDay(epoch)) / 86400000)
      return `T3-${Math.floor(days / 3)}`
    }
    case 'semanal': { const [wy, w] = isoWeekParts(d); return `${wy}-W${String(w).padStart(2, '0')}` }
    case 'quinzenal': {
      const epoch = anchor ? new Date(anchor) : new Date(2024, 0, 1)
      const days = Math.floor((startOfDay(d) - startOfDay(epoch)) / 86400000)
      return `F${Math.floor(days / 14)}`
    }
    case 'mensal': return `${y}-M${String(m + 1).padStart(2, '0')}`
    case 'trimestral': return `${y}-Q${Math.floor(m / 3) + 1}`
    case 'semestral': return `${y}-S${Math.floor(m / 6) + 1}`
    case 'anual': return `${y}`
    case 'diaria':
    default: return ymd(d)
  }
}

// rótulo curto do ciclo atual ("hoje", "esta semana", "este mês"…)
export function periodLabel(cadence) {
  switch (cadence) {
    case 'cada3dias': return 'neste ciclo'
    case 'semanal': return 'esta semana'
    case 'quinzenal': return 'esta quinzena'
    case 'mensal': return 'este mês'
    case 'trimestral': return 'este trimestre'
    case 'semestral': return 'este semestre'
    case 'anual': return 'este ano'
    case 'diaria':
    default: return 'hoje'
  }
}

// um Set de "itemId|periodo" a partir dos eventos ritual_done
export function doneSet(events) {
  const s = new Set()
  ;(events || []).forEach(e => {
    const p = e.payload && e.payload.period
    if (p && e.item_id) s.add(`${e.item_id}|${p}`)
  })
  return s
}
export function isRitualDone(set, itemId, cadence, anchor) {
  return set.has(`${itemId}|${periodKey(cadence, new Date(), anchor)}`)
}

// ===== skip (pular recorrente) =====
export function skipSet(events) {
  const s = new Set()
  ;(events || []).forEach(e => {
    const p = e.payload && e.payload.period
    if (p && e.item_id) s.add(`${e.item_id}|${p}`)
  })
  return s
}
export function isRitualSkipped(set, itemId, cadence, anchor) {
  return set.has(`${itemId}|${periodKey(cadence, new Date(), anchor)}`)
}

// ===== agendamento (dia da semana + horário, p/ semanais) =====
export const WEEKDAYS = [
  { v: 0, label: 'Domingo', short: 'Dom' }, { v: 1, label: 'Segunda', short: 'Seg' },
  { v: 2, label: 'Terça', short: 'Ter' }, { v: 3, label: 'Quarta', short: 'Qua' },
  { v: 4, label: 'Quinta', short: 'Qui' }, { v: 5, label: 'Sexta', short: 'Sex' },
  { v: 6, label: 'Sábado', short: 'Sáb' },
]
export function weekdayShort(v) { const w = WEEKDAYS.find(w => w.v === Number(v)); return w ? w.short : '' }
export function weekdayLabel(v) { const w = WEEKDAYS.find(w => w.v === Number(v)); return w ? w.label : '' }

// data/hora agendada da ocorrência semanal na semana de `now` (ISO, segunda a domingo)
export function scheduledThisWeek(weekday, time, now = new Date()) {
  const d = new Date(now)
  const monday = new Date(d); monday.setHours(0, 0, 0, 0)
  monday.setDate(monday.getDate() - ((d.getDay() + 6) % 7)) // volta pra segunda
  const offset = (Number(weekday) + 6) % 7 // dom→6, seg→0…
  const out = new Date(monday); out.setDate(monday.getDate() + offset)
  if (time) { const [h, m] = String(time).split(':'); out.setHours(Number(h) || 0, Number(m) || 0, 0, 0) }
  return out
}

// já está "rodando" no ciclo atual? (semanal com agenda só ativa a partir do dia/hora)
export function isActiveNow(item, now = new Date()) {
  const cfg = item.config || {}
  if (cadenceOf(item) === 'semanal' && cfg.weekday != null) {
    return now >= scheduledThisWeek(cfg.weekday, cfg.time, now)
  }
  return true
}
// é coisa pra hoje? (diária sempre; semanal agendada hoje e já na hora)
export function isDueToday(item, now = new Date()) {
  const cad = cadenceOf(item), cfg = item.config || {}
  if (cad === 'diaria') return true
  if (cad === 'semanal' && cfg.weekday != null) {
    return Number(cfg.weekday) === now.getDay() && now >= scheduledThisWeek(cfg.weekday, cfg.time, now)
  }
  return false
}
export function scheduleLabel(item) {
  const cfg = item.config || {}
  if (cadenceOf(item) === 'semanal' && cfg.weekday != null) {
    return `${weekdayShort(cfg.weekday)}${cfg.time ? ' ' + cfg.time : ''}`
  }
  return null
}

// data amigável pra due_at de itens "Do dia"
export function dueLabel(due_at) {
  if (!due_at) return null
  const d = startOfDay(due_at), today = startOfDay(new Date())
  const diff = Math.round((d - today) / 86400000)
  if (diff < 0) return { txt: diff === -1 ? 'ontem' : `${Math.abs(diff)} dias atrás`, tone: 'late' }
  if (diff === 0) return { txt: 'hoje', tone: 'today' }
  if (diff === 1) return { txt: 'amanhã', tone: 'soon' }
  if (diff <= 6) return { txt: `em ${diff} dias`, tone: 'soon' }
  return { txt: new Date(due_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }), tone: 'far' }
}
