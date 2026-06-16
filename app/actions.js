'use server'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { V0_ITEMS } from '@/app/v0data'

const DOMAINS = [
  { slug: 'casa', name: 'Cuidar da casa', kind: 'maestria', sort: 1 },
  { slug: 'casamento', name: 'Casamento', kind: 'presenca', sort: 2 },
  { slug: 'cecilia', name: 'Cecília', kind: 'presenca', sort: 3 },
  { slug: 'jiujitsu', name: 'Jiu-jitsu', kind: 'maestria', sort: 4 },
  { slug: 'comida', name: 'Fazer comida', kind: 'maestria', sort: 5 },
  { slug: 'leitura', name: 'Leitura e estudos', kind: 'maestria', sort: 6 },
  { slug: 'carreira', name: 'Carreira internacional', kind: 'maestria', sort: 7 }
]
const WORK_AREAS = [
  { code: 'PROD', name: 'Produto' }, { code: 'DES', name: 'Design' }, { code: 'INOV', name: 'Inovação' }
]
const ACH_DEFS = [
  { key: 'first-ever', tier: 'primeira', kicker: 'Primeiro passo', title_template: 'Você começou! 🎉', desc_template: 'O primeiro ✓ do sistema inteiro. Bem-vindo ao jogo.', rarity: 'comum', hidden: false },
  { key: 'domain-first', tier: 'primeira', kicker: 'Estreia', title_template: 'Estreou em {domain}!', desc_template: 'Primeiro ✓ nesse domínio. A trilha começou aqui.', rarity: 'comum', hidden: false },
  { key: 'domain-5', tier: 'marco', kicker: 'Marco', title_template: '5 em {domain} 💪', desc_template: 'Cinco ✓. Tá pegando ritmo de verdade.', rarity: 'raro', hidden: false },
  { key: 'domain-10', tier: 'marco', kicker: 'Marco', title_template: '10 em {domain} 🔥', desc_template: 'Dez ✓. Isso já é hábito virando identidade.', rarity: 'raro', hidden: false },
  { key: 'domain-25', tier: 'marco', kicker: 'Marco raro', title_template: '25 em {domain} 🏆', desc_template: 'Vinte e cinco. Você é outra pessoa nesse domínio.', rarity: 'epico', hidden: false },
  { key: 'total-10', tier: 'marco', kicker: 'Marco', title_template: '10 no total 🚀', desc_template: 'Dez coisas concluídas no sistema. Tá rodando liso.', rarity: 'raro', hidden: false },
  { key: 'tres-no-dia', tier: 'descoberta', kicker: 'Conquista oculta', title_template: 'Pegou no tranco 🔥', desc_template: 'Três coisas concluídas num dia só. Você nem sabia que isso valia.', rarity: 'raro', hidden: true },
  { key: 'retorno', tier: 'retorno', kicker: 'Voltou', title_template: 'Que bom que você voltou 🤍', desc_template: 'De volta ao {domain} depois de um tempo. Sem cobrança — só bem-vindo.', rarity: 'raro', hidden: false }
]

export async function ensureSeed() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  const { count: dc } = await supabase.from('domain').select('*', { count: 'exact', head: true })
  if (!dc) { await supabase.from('domain').insert(DOMAINS); await supabase.from('work_area').insert(WORK_AREAS) }
  const { data: existing } = await supabase.from('achievement_def').select('key')
  const have = new Set((existing || []).map(d => d.key))
  const missing = ACH_DEFS.filter(d => !have.has(d.key))
  if (missing.length) await supabase.from('achievement_def').insert(missing)
}

export async function createItem(domainId, title) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !title?.trim()) return null
  const { data: item } = await supabase.from('item').insert({ environment: 'vida', primitive: 'task', domain_id: domainId, title: title.trim(), status: 'open' }).select().single()
  return item
}

export async function completeItem(id) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { earned: [] }
  const { data: item } = await supabase.from('item').update({ status: 'done', completed_at: new Date().toISOString() }).eq('id', id).select('id,domain_id').single()
  if (!item) return { earned: [] }
  await supabase.from('event').insert({ type: 'item_completed', domain_id: item.domain_id, item_id: item.id })
  const { data: domain } = await supabase.from('domain').select('name,slug').eq('id', item.domain_id).single()
  const { count: domainDone } = await supabase.from('item').select('*', { count: 'exact', head: true }).eq('domain_id', item.domain_id).eq('status', 'done')
  const { count: totalDone } = await supabase.from('item').select('*', { count: 'exact', head: true }).eq('environment', 'vida').eq('status', 'done')
  const startToday = new Date(); startToday.setHours(0, 0, 0, 0)
  const { count: todayDone } = await supabase.from('item').select('*', { count: 'exact', head: true }).eq('environment', 'vida').eq('status', 'done').gte('completed_at', startToday.toISOString())
  const { data: defs } = await supabase.from('achievement_def').select('id,key,kicker,title_template,desc_template,tier')
  const byKey = {}; (defs || []).forEach(d => { byKey[d.key] = d })
  const slug = domain?.slug || null, name = domain?.name || ''

  async function award(key, dslug, allowRepeat) {
    const def = byKey[key]; if (!def) return null
    if (!allowRepeat) {
      const { data: ex } = await supabase.from('achievement_earned').select('id,context').eq('def_id', def.id)
      const already = (ex || []).some(e => dslug ? (e.context && e.context.domain === dslug) : true)
      if (already) return null
    }
    const { data: ins } = await supabase.from('achievement_earned').insert({ def_id: def.id, context: dslug ? { domain: dslug } : {}, revealed: true }).select('id').single()
    return { id: ins ? ins.id : null, kicker: def.kicker, title: (def.title_template || '').split('{domain}').join(name), desc: (def.desc_template || '').split('{domain}').join(name), tier: def.tier }
  }

  const earned = []
  const cands = []
  if (totalDone === 1) cands.push(['first-ever', null])
  if (domainDone === 1) cands.push(['domain-first', slug])
  if (domainDone === 5) cands.push(['domain-5', slug])
  if (domainDone === 10) cands.push(['domain-10', slug])
  if (domainDone === 25) cands.push(['domain-25', slug])
  if (totalDone === 10) cands.push(['total-10', null])
  if (todayDone === 3) cands.push(['tres-no-dia', null])
  for (const [k, ds] of cands) { const e = await award(k, ds, false); if (e) earned.push(e) }

  // retorno: lacuna > 14 dias desde a conclusão anterior nesse domínio
  const { data: recents } = await supabase.from('item').select('completed_at').eq('domain_id', item.domain_id).eq('status', 'done').not('completed_at', 'is', null).order('completed_at', { ascending: false }).limit(2)
  if (recents && recents.length === 2) {
    const prev = new Date(recents[1].completed_at).getTime()
    if (Date.now() - prev > 14 * 86400000) { const e = await award('retorno', slug, true); if (e) earned.push(e) }
  }

  return { earned }
}

export async function deleteItem(id) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  await supabase.from('item').delete().eq('id', id)
}

export async function addMoment(domainId, note) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !note?.trim()) return null
  const { data: m } = await supabase.from('presence_moment').insert({ domain_id: domainId, note: note.trim() }).select().single()
  await supabase.from('event').insert({ type: 'moment', domain_id: domainId })
  return m
}

export async function createCard(title, workAreaCode) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !title?.trim()) return null
  let workAreaId = null
  if (workAreaCode) {
    const { data: wa } = await supabase.from('work_area').select('id').eq('code', workAreaCode).single()
    workAreaId = wa ? wa.id : null
  }
  const { data: card } = await supabase.from('item').insert({ environment: 'trabalho', primitive: 'card', work_area_id: workAreaId, title: title.trim(), status: 'backlog' }).select().single()
  return card
}

export async function moveCard(id, status) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  const patch = { status }
  if (status === 'concluido') patch.completed_at = new Date().toISOString()
  // sair de Fazendo com o relógio rodando → para o relógio (registra se ≥ 1 min)
  if (status !== 'fazendo') {
    const { data: it } = await supabase.from('item').select('timer_started_at').eq('id', id).single()
    if (it && it.timer_started_at) {
      const secs = Math.max(0, Math.floor((Date.now() - new Date(it.timer_started_at).getTime()) / 1000))
      if (secs >= 60) await supabase.from('time_entry').insert({ item_id: id, seconds: secs })
      patch.timer_started_at = null
    }
  }
  await supabase.from('item').update(patch).eq('id', id)
  await supabase.from('event').insert({ type: 'card_moved', item_id: id, payload: { status } })
}

export async function reorderCards(ids) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  await Promise.all((ids || []).map((id, i) => supabase.from('item').update({ sort: i + 1 }).eq('id', id)))
}

export async function migrateV0() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  // Seed RODA SÓ UMA VEZ: se já existe qualquer demanda de trabalho, não mexe mais.
  // Antes, isso reinseria cards apagados a cada F5 (voltavam pro backlog).
  const { count } = await supabase.from('item').select('id', { count: 'exact', head: true }).eq('environment', 'trabalho')
  if ((count || 0) > 0) return
  const { data: existing } = await supabase.from('item').select('id,legacy_id,origem').eq('environment', 'trabalho').not('legacy_id', 'is', null)
  const byLegacy = {}; (existing || []).forEach(r => { if (r.legacy_id) byLegacy[r.legacy_id] = r })
  const { data: areas } = await supabase.from('work_area').select('id,code')
  const areaId = {}; (areas || []).forEach(a => { areaId[a.code] = a.id })
  const now = new Date().toISOString()
  const toInsert = []
  const updates = []
  for (const it of V0_ITEMS) {
    const enrich = {
      origem: it.origem || null, notes: it.contexto || null,
      blocked: !!it.blocked, block_reason: it.block_reason || null,
      work_area_id: areaId[it.area] || null, title: it.title
    }
    const card = byLegacy[it.legacy_id]
    if (!card) {
      toInsert.push({ environment: 'trabalho', primitive: 'card', legacy_id: it.legacy_id, status: it.status, completed_at: it.status === 'concluido' ? now : null, ...enrich })
    } else if (!card.origem) {
      updates.push(supabase.from('item').update(enrich).eq('id', card.id))
    }
  }
  if (toInsert.length) await supabase.from('item').insert(toInsert)
  if (updates.length) await Promise.all(updates)
}

export async function setBlocked(id, blocked, type, note) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  // ao destravar, o motivo é apagado do item — então leio antes pra registrar o que estava travando
  const { data: prev } = await supabase.from('item').select('block_reason, block_note').eq('id', id).single()
  await supabase.from('item').update({ blocked: !!blocked, block_reason: blocked ? (type || null) : null, block_note: blocked ? (note || null) : null }).eq('id', id)
  // registra o momento (bloqueio tem função: marca uma espera/dependência; o desbloqueio é quando ela se resolve)
  if (blocked) {
    await supabase.from('event').insert({ type: 'item_blocked', item_id: id, payload: { reason: type || null, note: note || null } })
  } else {
    await supabase.from('event').insert({ type: 'item_unblocked', item_id: id, payload: { reason: (prev && prev.block_reason) || null, note: (prev && prev.block_note) || null } })
  }
}

export async function updateCard(id, fields) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  const patch = {}
  if (fields.title != null) patch.title = String(fields.title).trim()
  if ('contexto' in fields) patch.notes = fields.contexto ? String(fields.contexto).trim() : null
  if ('origem' in fields) patch.origem = fields.origem ? String(fields.origem).trim() : null
  if ('areaCode' in fields) {
    if (fields.areaCode) { const { data: wa } = await supabase.from('work_area').select('id').eq('code', fields.areaCode).single(); patch.work_area_id = wa ? wa.id : null }
    else patch.work_area_id = null
  }
  // demanda sem código que ganha área → gera o código sequencial da área na hora
  if ('areaCode' in fields && fields.areaCode) {
    const { data: cur } = await supabase.from('item').select('legacy_id').eq('id', id).single()
    if (cur && !cur.legacy_id) {
      const { data: rows } = await supabase.from('item').select('legacy_id').eq('environment', 'trabalho').ilike('legacy_id', `${fields.areaCode}-%`)
      let max = 0
      ;(rows || []).forEach(r => { const m = (r.legacy_id || '').match(/-(\d+)$/); if (m) max = Math.max(max, parseInt(m[1], 10)) })
      patch.legacy_id = `${fields.areaCode}-${max + 1}`
    }
  }
  if (Object.keys(patch).length) await supabase.from('item').update(patch).eq('id', id)
  return patch
}

export async function createCardFull(fields) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  let waId = null
  if (fields.areaCode) { const { data: wa } = await supabase.from('work_area').select('id').eq('code', fields.areaCode).single(); waId = wa ? wa.id : null }
  // gera um código sequencial pra área (ex.: PROD-44) — assim o card tem código e URL amigável
  let legacy_id = null
  if (fields.areaCode) {
    const { data: rows } = await supabase.from('item').select('legacy_id').eq('environment', 'trabalho').ilike('legacy_id', `${fields.areaCode}-%`)
    let max = 0
    ;(rows || []).forEach(r => { const m = (r.legacy_id || '').match(/-(\d+)$/); if (m) max = Math.max(max, parseInt(m[1], 10)) })
    legacy_id = `${fields.areaCode}-${max + 1}`
  }
  const status = ['backlog', 'aguardando', 'fazendo', 'concluido'].includes(fields.status) ? fields.status : 'backlog'
  const { data: card } = await supabase.from('item').insert({
    environment: 'trabalho', primitive: 'card', status, completed_at: status === 'concluido' ? new Date().toISOString() : null, legacy_id, sort: 999999,
    title: (fields.title || '').trim() || 'Sem título', work_area_id: waId,
    notes: fields.contexto ? String(fields.contexto).trim() : null,
    origem: fields.origem ? String(fields.origem).trim() : null
  }).select().single()
  return card
}

async function stopRunningTimers(supabase) {
  const { data: running } = await supabase.from('item').select('id,timer_started_at').not('timer_started_at', 'is', null)
  for (const it of (running || [])) {
    const secs = Math.max(0, Math.floor((Date.now() - new Date(it.timer_started_at).getTime()) / 1000))
    if (secs >= 60) await supabase.from('time_entry').insert({ item_id: it.id, seconds: secs })
    await supabase.from('item').update({ timer_started_at: null }).eq('id', it.id)
  }
}

export async function startTimer(id) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  await stopRunningTimers(supabase)
  // puxar pra Fazendo: cronômetro rodando implica status 'fazendo'
  const { data: it } = await supabase.from('item').select('status').eq('id', id).single()
  const patch = { timer_started_at: new Date().toISOString() }
  if (it && it.status !== 'fazendo') { patch.status = 'fazendo'; patch.completed_at = null }
  await supabase.from('item').update(patch).eq('id', id)
  if (patch.status) await supabase.from('event').insert({ type: 'card_moved', item_id: id, payload: { status: 'fazendo', via: 'timer' } })
}

export async function stopTimer(id) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return 0
  const { data: it } = await supabase.from('item').select('timer_started_at').eq('id', id).single()
  if (it && it.timer_started_at) {
    const secs = Math.max(0, Math.floor((Date.now() - new Date(it.timer_started_at).getTime()) / 1000))
    if (secs >= 60) await supabase.from('time_entry').insert({ item_id: id, seconds: secs })
    await supabase.from('item').update({ timer_started_at: null }).eq('id', id)
    return secs
  }
  return 0
}

export async function addTime(id, minutes, note) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  const secs = Math.round((Number(minutes) || 0) * 60)
  if (secs === 0) return
  await supabase.from('time_entry').insert({ item_id: id, seconds: secs, note: note ? String(note).trim() : null })
}

export async function listTimeEntries(id) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []
  const { data } = await supabase.from('time_entry').select('id,seconds,note,occurred_at').eq('item_id', id).order('occurred_at', { ascending: false })
  return data || []
}

// ===== Vida: dia a dia (do dia, quando der, recorrente, geral) =====
const LIFE_STATUSES = ['backlog', 'aguardando', 'fazendo', 'concluido']
// data só-dia ('YYYY-MM-DD') salva ao meio-dia UTC: neutra a fuso, não recua pro dia anterior no BRT.
function dueToIso(s) {
  if (!s) return null
  const str = String(s)
  const d = /^\d{4}-\d{2}-\d{2}$/.test(str) ? new Date(str + 'T12:00:00Z') : new Date(str)
  return isNaN(d.getTime()) ? null : d.toISOString()
}
function isTodayDue(iso) { return iso ? dayIdx(iso) === dayIdx(Date.now()) : false }

export async function createLifeItem(fields) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !fields.title?.trim() || !fields.domainId) return null
  const title = fields.title.trim()
  const notes = fields.notes ? String(fields.notes).trim() : null
  const origem = fields.origem ? String(fields.origem).trim() : null

  if (fields.category === 'recorrente') {
    const config = { type: 'recorrente', cadence: fields.cadence || 'diaria' }
    if (fields.anchor) config.anchor = fields.anchor
    if (config.cadence === 'semanal' && fields.weekday != null && fields.weekday !== '') {
      config.weekday = Number(fields.weekday)
      if (fields.time) config.time = String(fields.time)
    }
    const { data } = await supabase.from('item').insert({
      environment: 'vida', primitive: 'ritual', domain_id: fields.domainId,
      title, notes, origem, config, status: 'backlog', sort: 999999
    }).select().single()
    return data
  }

  const type = ['do_dia', 'quando_der', 'geral'].includes(fields.category) ? fields.category : 'quando_der'
  const due = dueToIso(fields.due_at)
  // se está pro dia (data = hoje), já entra como Aguardando (priorizada). senão, Backlog.
  let status = LIFE_STATUSES.includes(fields.status) ? fields.status : (isTodayDue(due) ? 'aguardando' : 'backlog')
  const { data } = await supabase.from('item').insert({
    environment: 'vida', primitive: 'task', domain_id: fields.domainId,
    title, notes, origem, due_at: due, config: { type }, status, sort: 999999,
    completed_at: status === 'concluido' ? new Date().toISOString() : null
  }).select().single()
  return data
}

// "Fazer hoje": joga a data pra hoje, prioriza (Aguardando) e marca o rótulo.
export async function fazerHoje(id) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: cur } = await supabase.from('item').select('config,status').eq('id', id).single()
  const config = { ...((cur && cur.config) || {}), fazer_hoje: true }
  const status = (cur && cur.status === 'fazendo') ? 'fazendo' : 'aguardando'
  await supabase.from('item').update({ due_at: dueToIso(new Date().toLocaleDateString('en-CA')), status, config }).eq('id', id)
  return { status, config }
}

export async function updateLifeItem(id, fields) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  const patch = {}
  if (fields.title != null) patch.title = String(fields.title).trim()
  if ('contexto' in fields) patch.notes = fields.contexto ? String(fields.contexto).trim() : null
  if ('origem' in fields) patch.origem = fields.origem ? String(fields.origem).trim() : null
  if ('due_at' in fields) {
    patch.due_at = dueToIso(fields.due_at)
    // pro dia (hoje) → prioriza pra Aguardando; tira o rótulo "fazer hoje" se a data sair de hoje
    const { data: cur } = await supabase.from('item').select('status,config').eq('id', id).single()
    if (isTodayDue(patch.due_at)) { if (cur && cur.status === 'backlog') patch.status = 'aguardando' }
    else if (cur && cur.config && cur.config.fazer_hoje) { patch.config = { ...cur.config, fazer_hoje: false } }
  }
  if ('domainId' in fields && fields.domainId) patch.domain_id = fields.domainId
  if ('cadence' in fields || 'weekday' in fields || 'time' in fields) {
    const { data: cur } = await supabase.from('item').select('config').eq('id', id).single()
    const config = { ...((cur && cur.config) || {}) }
    if ('cadence' in fields && fields.cadence) config.cadence = fields.cadence
    if ('weekday' in fields) {
      if (fields.weekday === '' || fields.weekday == null) delete config.weekday
      else config.weekday = Number(fields.weekday)
    }
    if ('time' in fields) { if (fields.time) config.time = String(fields.time); else delete config.time }
    patch.config = config
  }
  if (Object.keys(patch).length) await supabase.from('item').update(patch).eq('id', id)
  return patch
}

// marca/desmarca uma rotina no ciclo atual — deixa rastro via evento ritual_done
export async function toggleRitual(itemId, domainId, periodKey, done) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !itemId || !periodKey) return
  if (done) {
    // concluir tira um eventual "pulada" do mesmo período
    const { data: sk } = await supabase.from('event').select('id,payload').eq('item_id', itemId).eq('type', 'ritual_skipped')
    const skIds = (sk || []).filter(e => e.payload && e.payload.period === periodKey).map(e => e.id)
    if (skIds.length) await supabase.from('event').delete().in('id', skIds)
    const { data: ex } = await supabase.from('event').select('id,payload').eq('item_id', itemId).eq('type', 'ritual_done')
    const already = (ex || []).some(e => e.payload && e.payload.period === periodKey)
    if (!already) {
      await supabase.from('event').insert({ type: 'ritual_done', item_id: itemId, domain_id: domainId || null, payload: { period: periodKey } })
    }
  } else {
    const { data: ex } = await supabase.from('event').select('id,payload').eq('item_id', itemId).eq('type', 'ritual_done')
    const ids = (ex || []).filter(e => e.payload && e.payload.period === periodKey).map(e => e.id)
    if (ids.length) await supabase.from('event').delete().in('id', ids)
  }
}

// pular uma recorrente no ciclo atual: vira "pulada", volta pendente no próximo ciclo.
// skip de DIÁRIA quebra o streak. skip=false desfaz.
export async function skipRitual(itemId, domainId, periodKey, cadence, skip = true) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !itemId || !periodKey) return
  if (skip) {
    // tira um eventual "feito" do período
    const { data: dn } = await supabase.from('event').select('id,payload').eq('item_id', itemId).eq('type', 'ritual_done')
    const dnIds = (dn || []).filter(e => e.payload && e.payload.period === periodKey).map(e => e.id)
    if (dnIds.length) await supabase.from('event').delete().in('id', dnIds)
    const { data: ex } = await supabase.from('event').select('id,payload').eq('item_id', itemId).eq('type', 'ritual_skipped')
    const already = (ex || []).some(e => e.payload && e.payload.period === periodKey)
    if (!already) await supabase.from('event').insert({ type: 'ritual_skipped', item_id: itemId, domain_id: domainId || null, payload: { period: periodKey, cadence: cadence || null } })
  } else {
    const { data: ex } = await supabase.from('event').select('id,payload').eq('item_id', itemId).eq('type', 'ritual_skipped')
    const ids = (ex || []).filter(e => e.payload && e.payload.period === periodKey).map(e => e.id)
    if (ids.length) await supabase.from('event').delete().in('id', ids)
  }
}

// Chama por categoria/área: streak DIÁRIO estrito (passou 1 dia sem nada na área, zera).
// Basta 1 atividade na área no dia (rotina feita, tarefa de vida concluída, ou momento) pra pontuar.
const BRT = 3 * 3600 * 1000
function dayIdx(ts) { return Math.floor((new Date(ts).getTime() - BRT) / 86400000) }
function strictStreak(daySet, today) {
  if (!daySet || !daySet.size) return { current: 0, longest: 0 }
  let current = 0
  if (daySet.has(today) || daySet.has(today - 1)) {
    let d = daySet.has(today) ? today : today - 1
    while (daySet.has(d)) { current++; d-- }
  }
  const arr = [...daySet].sort((a, b) => a - b)
  let longest = 0, run = 0, prev = null
  for (const d of arr) { run = (prev !== null && d === prev + 1) ? run + 1 : 1; if (run > longest) longest = run; prev = d }
  return { current, longest }
}
export async function getStreaks() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { byDomain: {}, trab: { current: 0, longest: 0 }, best: 0 }
  const since = new Date(Date.now() - 420 * 86400000).toISOString()
  const [{ data: revs }, { data: vd }, { data: mom }, { data: trab }] = await Promise.all([
    supabase.from('event').select('domain_id,occurred_at').eq('type', 'ritual_done').gte('occurred_at', since),
    supabase.from('item').select('domain_id,completed_at').eq('environment', 'vida').in('status', ['done', 'concluido']).not('completed_at', 'is', null).gte('completed_at', since),
    supabase.from('presence_moment').select('domain_id,occurred_at').gte('occurred_at', since),
    supabase.from('item').select('completed_at').eq('environment', 'trabalho').eq('status', 'concluido').not('completed_at', 'is', null).gte('completed_at', since),
  ])
  const today = dayIdx(Date.now())
  const sets = {}
  const add = (dom, ts) => { if (!dom || !ts) return; (sets[dom] = sets[dom] || new Set()).add(dayIdx(ts)) }
  ;(revs || []).forEach(e => add(e.domain_id, e.occurred_at))
  ;(vd || []).forEach(i => add(i.domain_id, i.completed_at))
  ;(mom || []).forEach(m => add(m.domain_id, m.occurred_at))
  const trabSet = new Set(); (trab || []).forEach(i => trabSet.add(dayIdx(i.completed_at)))
  const byDomain = {}; let best = 0
  for (const id in sets) { const r = strictStreak(sets[id], today); byDomain[id] = r; if (r.longest > best) best = r.longest }
  const trabR = strictStreak(trabSet, today); if (trabR.longest > best) best = trabR.longest
  return { byDomain, trab: trabR, best }
}

export async function signOut() {
  const supabase = createClient()
  await supabase.auth.signOut()
  redirect('/')
}
