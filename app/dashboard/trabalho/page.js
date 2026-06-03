import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { KanbanBoard } from './board'
import { migrateV0 } from '@/app/actions'

export const dynamic = 'force-dynamic'
export const preferredRegion = 'gru1'

export default async function Trabalho() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')
  await migrateV0()
  const [{ data: cards }, { data: areas }, { data: te }] = await Promise.all([
    supabase.from('item').select('*').eq('environment', 'trabalho').order('sort', { ascending: true }).order('created_at', { ascending: true }),
    supabase.from('work_area').select('*').order('code'),
    supabase.from('time_entry').select('item_id,seconds'),
  ])
  const timeTotals = {}; (te || []).forEach(t => { timeTotals[t.item_id] = (timeTotals[t.item_id] || 0) + (t.seconds || 0) })
  return (
    <main className="dash wide">
      <KanbanBoard initialCards={cards || []} areas={areas || []} timeTotals={timeTotals} />
    </main>
  )
}
