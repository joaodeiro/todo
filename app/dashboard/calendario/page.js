import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CalendarView } from './ui'

export const dynamic = 'force-dynamic'
export const preferredRegion = 'gru1'

const TZ = 'America/Sao_Paulo'
const dayOf = ts => new Date(ts).toLocaleDateString('en-CA', { timeZone: TZ })

export default async function CalendarioPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const since = new Date(Date.now() - 400 * 86400000).toISOString()
  const [{ data: domains }, { data: vida }, { data: trab }, { data: rituals }, { data: revs }, { data: moments }] = await Promise.all([
    supabase.from('domain').select('id,name'),
    supabase.from('item').select('id,title,domain_id,completed_at').eq('environment', 'vida').in('status', ['done', 'concluido']).not('completed_at', 'is', null).gte('completed_at', since),
    supabase.from('item').select('id,title,legacy_id,completed_at').eq('environment', 'trabalho').eq('status', 'concluido').not('completed_at', 'is', null).gte('completed_at', since),
    supabase.from('item').select('id,title,domain_id').eq('environment', 'vida').eq('primitive', 'ritual'),
    supabase.from('event').select('item_id,domain_id,occurred_at').eq('type', 'ritual_done').gte('occurred_at', since),
    supabase.from('presence_moment').select('domain_id,note,occurred_at').gte('occurred_at', since),
  ])

  const domMap = {}; (domains || []).forEach(d => { domMap[d.id] = d.name })
  const ritMap = {}; (rituals || []).forEach(r => { ritMap[r.id] = r })

  const entries = []
  ;(vida || []).forEach(i => entries.push({ day: dayOf(i.completed_at), type: 'vida', title: i.title, sub: domMap[i.domain_id] || 'Vida', ts: i.completed_at }))
  ;(trab || []).forEach(i => entries.push({ day: dayOf(i.completed_at), type: 'trabalho', title: i.title, sub: i.legacy_id || 'Trabalho', ts: i.completed_at }))
  ;(revs || []).forEach(e => { const r = ritMap[e.item_id]; entries.push({ day: dayOf(e.occurred_at), type: 'rotina', title: r ? r.title : 'Rotina', sub: domMap[e.domain_id || (r && r.domain_id)] || 'Rotina', ts: e.occurred_at }) })
  ;(moments || []).forEach(m => entries.push({ day: dayOf(m.occurred_at), type: 'momento', title: m.note, sub: domMap[m.domain_id] || 'Presença', ts: m.occurred_at }))
  entries.sort((a, b) => (a.ts < b.ts ? 1 : -1))

  return (
    <main className="dash wide">
      <CalendarView entries={entries} todayStr={dayOf(Date.now())} />
    </main>
  )
}
