import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Gallery } from './gallery'

export const dynamic = 'force-dynamic'
const TZ = 3 * 3600 * 1000 // BRT aprox

// níveis internos de cada área (por tarefas concluídas naquela área)
const LEVELS = [
  { n: 1, target: 5, icon: '⭐', r: 'comum' },
  { n: 2, target: 10, icon: '🔥', r: 'raro' },
  { n: 3, target: 25, icon: '🏆', r: 'epico' },
  { n: 4, target: 50, icon: '💎', r: 'epico' },
  { n: 5, target: 100, icon: '👑', r: 'lendario' }
]
// nomes épicos por área (5/10/25/50/100) — nada de "Nível 1"
const LEVEL_NAMES = {
  jiujitsu: ['Tatame Aquecido', 'Pegada de Aço', 'Faixa Subindo', 'Predador do Tatame', 'Lenda do Tatame'],
  leitura: ['Virador de Páginas', 'Devorador de Livros', 'Rato de Biblioteca', 'Mente Enciclopédica', 'Oráculo'],
  comida: ['Mexeu a Panela', 'Tempero na Mão', 'Chef de Casa', 'Mestre-Cuca', 'Estrela Michelin'],
  casa: ['Cama Arrumada', 'Casa em Ordem', 'Zelador-Chefe', 'Lar Impecável', 'Senhor do Castelo'],
  carreira: ['Primeiro Passo Lá Fora', 'Networking Ligado', 'Passaporte Carimbado', 'Player Global', 'Cidadão do Mundo']
}
const TRAIL_KIND = { 'Sessões': 'sessoes', 'Frequência': 'frequencia', 'Repertório': 'repertorio', 'Colecionador': 'colecao', 'Conquistas': 'meta', 'Especiais': 'especial' }
const RAR_TIER = { comum: 1, raro: 2, epico: 4, lendario: 5 }

export default async function Conquistas() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data: defs } = await supabase.from('achievement_def').select('id,key,category,trail,icon,title_template,desc_template,rarity,hidden,seq,target,rule')
  const { data: earnedRows } = await supabase.from('achievement_earned').select('def_id,earned_at')
  const { data: doneItems } = await supabase.from('item').select('completed_at,domain_id').eq('environment', 'vida').eq('status', 'done')
  const { data: domains } = await supabase.from('domain').select('id,slug,name,kind').eq('kind', 'maestria').order('sort')

  const defById = {}; (defs || []).forEach(d => { defById[d.id] = d })
  const earnedByKey = {}
  ;(earnedRows || []).forEach(e => { const d = defById[e.def_id]; if (d && (!earnedByKey[d.key] || e.earned_at > earnedByKey[d.key])) earnedByKey[d.key] = e.earned_at })

  let total = 0; const domSet = new Set(); const dayMap = {}; const comps = []; const domainCount = {}
  ;(doneItems || []).forEach(it => {
    if (!it.completed_at) return
    total++
    if (it.domain_id) { domSet.add(it.domain_id); domainCount[it.domain_id] = (domainCount[it.domain_id] || 0) + 1 }
    const ld = new Date(new Date(it.completed_at).getTime() - TZ)
    comps.push({ h: ld.getUTCHours(), wd: ld.getUTCDay(), dom: ld.getUTCDate(), md: ld.toISOString().slice(5, 10) })
    const dk = ld.toISOString().slice(0, 10)
    if (!dayMap[dk]) dayMap[dk] = { count: 0, doms: new Set() }
    dayMap[dk].count++; if (it.domain_id) dayMap[dk].doms.add(it.domain_id)
  })
  const distinctDomains = domSet.size
  const doneInDayMax = Math.max(0, ...Object.values(dayMap).map(d => d.count))
  const distinctDayMax = Math.max(0, ...Object.values(dayMap).map(d => d.doms.size))
  const days = Object.keys(dayMap).sort()
  let longest = 0, run = 0, prev = null, maxGap = 0
  for (const dk of days) {
    if (prev) { const diff = (Date.parse(dk) - Date.parse(prev)) / 86400000; run = diff === 1 ? run + 1 : 1; if (diff - 1 > maxGap) maxGap = diff - 1 } else run = 1
    if (run > longest) longest = run
    prev = dk
  }
  const some = fn => comps.some(fn)

  function evalRule(rule) {
    if (!rule || !rule.type) return { current: 0, target: 1, ok: false, hasProgress: false }
    const t = rule.type
    if (t === 'total_done') return { current: total, target: rule.target, ok: total >= rule.target, hasProgress: true }
    if (t === 'streak_days') return { current: longest, target: rule.target, ok: longest >= rule.target, hasProgress: true }
    if (t === 'distinct_domains') return { current: distinctDomains, target: rule.target, ok: distinctDomains >= rule.target, hasProgress: true }
    if (t === 'distinct_domains_day') return { current: distinctDayMax, target: rule.target, ok: distinctDayMax >= rule.target, hasProgress: true }
    if (t === 'done_in_day') return { current: doneInDayMax, target: rule.target, ok: doneInDayMax >= rule.target, hasProgress: true }
    if (t === 'time_before') { const ok = some(c => c.h < (rule.hour != null ? rule.hour : 6)); return { current: ok ? 1 : 0, target: 1, ok, hasProgress: false } }
    if (t === 'time_between') { const ok = some(c => c.h >= (rule.from != null ? rule.from : 0) && c.h < (rule.to != null ? rule.to : 5)); return { current: ok ? 1 : 0, target: 1, ok, hasProgress: false } }
    if (t === 'weekday') { const ok = some(c => c.wd === rule.day); return { current: ok ? 1 : 0, target: 1, ok, hasProgress: false } }
    if (t === 'friday13') { const ok = some(c => c.wd === 5 && c.dom === 13); return { current: ok ? 1 : 0, target: 1, ok, hasProgress: false } }
    if (t === 'day_of_month') { const ok = some(c => c.dom === rule.day); return { current: ok ? 1 : 0, target: 1, ok, hasProgress: false } }
    if (t === 'on_dates') { const set = rule.dates || []; const ok = some(c => set.includes(c.md)); return { current: ok ? 1 : 0, target: 1, ok, hasProgress: false } }
    if (t === 'comeback') { const ok = maxGap >= (rule.days || 14); return { current: ok ? 1 : 0, target: 1, ok, hasProgress: false } }
    if (t === 'always') return { current: 1, target: 1, ok: true, hasProgress: false }
    if (t === 'badges_earned') return { current: 0, target: rule.target, ok: false, hasProgress: true, meta: true }
    return { current: 0, target: 1, ok: false, hasProgress: false }
  }

  const pre = (defs || []).map(d => {
    const r = evalRule(d.rule || null)
    const persisted = earnedByKey[d.key]
    return { d, r, persisted, earned: r.meta ? false : (!!persisted || r.ok) }
  })
  const earnedCount = pre.filter(s => !s.r.meta && s.earned).length
  const baseStates = pre
    .filter(s => !['domain-first', 'domain-5', 'domain-10', 'domain-25'].includes(s.d.key))
    .map(s => {
      let earned = s.earned, current = s.r.current
      if (s.r.meta) { current = earnedCount; earned = earnedCount >= s.d.target }
      return {
        key: s.d.key, trail: s.d.trail || 'Marcos', kind: TRAIL_KIND[s.d.trail] || 'marco', tier: RAR_TIER[s.d.rarity] || 1,
        icon: s.d.icon || '🏅', title: (s.d.title_template || '').split('{domain}').join('um domínio'), desc: (s.d.desc_template || '').split('{domain}').join('um domínio'),
        rarity: s.d.rarity || 'comum', hidden: !!s.d.hidden, seq: s.d.seq || 99,
        earned, earnedAt: s.persisted || null, current, target: s.r.target, hasProgress: s.r.hasProgress
      }
    })

  // uma linha (trilha) por área da vida, com níveis internos
  const domainStates = []
  for (const dm of (domains || [])) {
    const c = domainCount[dm.id] || 0
    for (const l of LEVELS) {
      domainStates.push({
        key: `lvl-${dm.slug}-${l.n}`, trail: dm.name, kind: dm.slug, tier: l.n, icon: l.icon,
        title: (LEVEL_NAMES[dm.slug] || [])[l.n - 1] || `Nível ${l.n}`, desc: `${l.target} tarefas concluídas em ${dm.name} (nível ${l.n}).`,
        rarity: l.r, hidden: false, seq: l.n,
        earned: c >= l.target, earnedAt: null, current: Math.min(c, l.target), target: l.target, hasProgress: true
      })
    }
  }

  const allStates = [...baseStates, ...domainStates]

  return (
    <main className="dash wide">
      <Link href="/dashboard" className="back">← voltar</Link>
      <h1>Conquistas 🏅</h1>
      <Gallery states={allStates} />
    </main>
  )
}
