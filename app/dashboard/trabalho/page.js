import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { KanbanBoard } from './board'
import { migrateV0 } from '@/app/actions'

export const dynamic = 'force-dynamic'

export default async function Trabalho() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')
  await migrateV0()
  const { data: cards } = await supabase.from('item').select('*').eq('environment', 'trabalho').order('created_at')
  const { data: areas } = await supabase.from('work_area').select('*').order('code')
  const { data: te } = await supabase.from('time_entry').select('item_id,seconds')
  const timeTotals = {}; (te || []).forEach(t => { timeTotals[t.item_id] = (timeTotals[t.item_id] || 0) + (t.seconds || 0) })
  return (
    <main className="dash wide">
      <Link href="/dashboard" className="back">← Vida</Link>
      <h1>Trabalho</h1>
      <KanbanBoard initialCards={cards || []} areas={areas || []} timeTotals={timeTotals} />
    </main>
  )
}
