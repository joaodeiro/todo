import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { LifeItemPage } from './detail'

export const dynamic = 'force-dynamic'
export const preferredRegion = 'gru1'

export default async function Page({ params }) {
  const id = decodeURIComponent(params.id || '')
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')
  const { data: card } = await supabase.from('item').select('*').eq('environment', 'vida').eq('id', id).single()
  if (!card) {
    return (
      <main className="dash">
        <Link href="/dashboard" className="back">← Vida</Link>
        <h1>Demanda não encontrada</h1>
        <p className="sub">Essa demanda não existe ou foi removida.</p>
      </main>
    )
  }
  const [{ data: dom }, { data: te }, { data: domains }] = await Promise.all([
    supabase.from('domain').select('slug,name').eq('id', card.domain_id).single(),
    supabase.from('time_entry').select('seconds').eq('item_id', card.id),
    supabase.from('domain').select('id,name').eq('kind', 'maestria').order('sort'),
  ])
  const secs = (te || []).reduce((a, t) => a + (t.seconds || 0), 0)
  return <LifeItemPage initialCard={{ ...card, secs }} domain={dom || null} domains={domains || []} />
}
