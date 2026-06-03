import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { DemandPage } from './detail'

export const dynamic = 'force-dynamic'
export const preferredRegion = 'gru1'

export default async function Page({ params }) {
  const code = decodeURIComponent(params.code || '')
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(code)
  const cardQ = isUuid
    ? supabase.from('item').select('*').eq('environment', 'trabalho').eq('id', code).limit(1)
    : supabase.from('item').select('*').eq('environment', 'trabalho').ilike('legacy_id', code).limit(1)
  const [{ data: cardRows }, { data: areas }] = await Promise.all([
    cardQ,
    supabase.from('work_area').select('*').order('code'),
  ])
  const card = (cardRows || [])[0]
  if (!card) {
    return (
      <main className="dash wide">
        <Link href="/dashboard/trabalho" className="back">← Kanban</Link>
        <h1>Demanda não encontrada</h1>
        <p className="sub">Nenhuma demanda com o código “{code}”.</p>
      </main>
    )
  }
  const { data: te } = await supabase.from('time_entry').select('seconds').eq('item_id', card.id)
  const secs = (te || []).reduce((a, t) => a + (t.seconds || 0), 0)
  return <DemandPage initialCard={{ ...card, secs }} areas={areas || []} />
}
