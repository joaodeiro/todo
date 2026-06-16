import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { HojePanel } from './ui'
import { getStreaks } from '@/app/actions'

export const dynamic = 'force-dynamic'
export const preferredRegion = 'gru1'

export default async function Hoje() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const since = new Date(Date.now() - 420 * 86400000).toISOString()
  const endOfToday = new Date(); endOfToday.setHours(23, 59, 59, 999)
  const [{ data: domains }, { data: rituals }, { data: agenda }, { data: revs }, { data: skips }, streak] = await Promise.all([
    supabase.from('domain').select('id,name,slug,kind').order('sort'),
    supabase.from('item').select('*').eq('environment', 'vida').eq('primitive', 'ritual'),
    supabase.from('item').select('*').eq('environment', 'vida').eq('primitive', 'task').not('due_at', 'is', null).neq('status', 'concluido').lte('due_at', endOfToday.toISOString()).order('due_at'),
    supabase.from('event').select('item_id,payload').eq('type', 'ritual_done').gte('occurred_at', since),
    supabase.from('event').select('item_id,payload').eq('type', 'ritual_skipped').gte('occurred_at', since),
    getStreaks(),
  ])
  const domMap = {}; (domains || []).forEach(d => { domMap[d.id] = { name: d.name, slug: d.slug } })
  const areas = (domains || []).filter(d => d.kind === 'maestria').map(d => ({ id: d.id, name: d.name }))
  const chamas = (domains || [])
    .map(d => ({ id: d.id, name: d.name, slug: d.slug, current: ((streak.byDomain || {})[d.id] || {}).current || 0 }))
    .filter(c => c.current > 0)
    .sort((a, b) => b.current - a.current)

  return (
    <main className="dash">
      <HojePanel rituals={rituals || []} agenda={agenda || []} ritualEvents={revs || []} skipEvents={skips || []} domMap={domMap} areas={areas} chamas={chamas} />
    </main>
  )
}
