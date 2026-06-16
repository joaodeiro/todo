import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { AreaWorkspace, PresenceBoard } from './ui'
import { getStreaks } from '@/app/actions'

export const dynamic = 'force-dynamic'
export const preferredRegion = 'gru1'

export default async function DomainPage({ params }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')
  const { data: domain } = await supabase.from('domain').select('*').eq('slug', params.slug).single()
  if (!domain) redirect('/dashboard')

  if (domain.kind === 'presenca') {
    const { data: moments } = await supabase.from('presence_moment').select('*').eq('domain_id', domain.id).order('occurred_at', { ascending: false })
    return (
      <main className="dash">
        <Link href="/dashboard" className="back">← voltar</Link>
        <h1>{domain.name}</h1>
        <p className="sub">Aqui não tem placar. Só momentos que valeram. 🤍</p>
        <PresenceBoard domainId={domain.id} initialMoments={moments || []} />
      </main>
    )
  }

  const since = new Date(Date.now() - 420 * 86400000).toISOString()
  const [{ data: items }, { data: te }, { data: emb }, { data: revs }, { data: skips }, { data: areas }] = await Promise.all([
    supabase.from('item').select('*').eq('domain_id', domain.id).eq('environment', 'vida').order('sort', { ascending: true }).order('created_at', { ascending: true }),
    supabase.from('time_entry').select('item_id,seconds'),
    supabase.from('embarque').select('item_id,done'),
    supabase.from('event').select('item_id,payload').eq('type', 'ritual_done').eq('domain_id', domain.id).gte('occurred_at', since),
    supabase.from('event').select('item_id,payload').eq('type', 'ritual_skipped').eq('domain_id', domain.id).gte('occurred_at', since),
    supabase.from('domain').select('id,name').eq('kind', 'maestria').order('sort'),
  ])
  const streaks = await getStreaks()
  const streak = (streaks.byDomain || {})[domain.id] || { current: 0, longest: 0 }
  const all = items || []
  const tasks = all.filter(i => i.primitive !== 'ritual')
  const rituals = all.filter(i => i.primitive === 'ritual')
  const timeTotals = {}; (te || []).forEach(t => { timeTotals[t.item_id] = (timeTotals[t.item_id] || 0) + (t.seconds || 0) })
  const embTotals = {}; (emb || []).forEach(e => { const r = embTotals[e.item_id] || (embTotals[e.item_id] = { done: 0, total: 0 }); r.total++; if (e.done) r.done++ })

  return (
    <main className="dash wide">
      <Link href="/dashboard" className="back">← voltar</Link>
      <AreaWorkspace
        domain={{ id: domain.id, name: domain.name, slug: domain.slug }}
        areas={areas || []}
        initialTasks={tasks} initialRituals={rituals}
        timeTotals={timeTotals} embTotals={embTotals} ritualEvents={revs || []} skipEvents={skips || []} streak={streak} />
    </main>
  )
}
