import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { DemandPage } from './detail'

export const dynamic = 'force-dynamic'

export default async function Page({ params }) {
  const code = decodeURIComponent(params.code || '')
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')
  const { data: card } = await supabase
    .from('item').select('*')
    .eq('environment', 'trabalho').ilike('legacy_id', code).maybeSingle()
  if (!card) {
    return (
      <main className="dash wide">
        <Link href="/dashboard/trabalho" className="back">← Kanban</Link>
        <h1>Demanda não encontrada</h1>
        <p className="sub">Nenhuma demanda com o código “{code}”.</p>
      </main>
    )
  }
  const { data: areas } = await supabase.from('work_area').select('*').order('code')
  const { data: te } = await supabase.from('time_entry').select('seconds').eq('item_id', card.id)
  const secs = (te || []).reduce((a, t) => a + (t.seconds || 0), 0)
  return <DemandPage initialCard={{ ...card, secs }} areas={areas || []} />
}
