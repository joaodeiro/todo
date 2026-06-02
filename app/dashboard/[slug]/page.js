import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { DomainBoard, PresenceBoard } from './ui'

export const dynamic = 'force-dynamic'

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

  const { data: items } = await supabase.from('item').select('*').eq('domain_id', domain.id).eq('environment', 'vida').order('created_at')
  const week = Date.now() - 7 * 86400000
  const recent = (items || []).filter(i => i.status === 'done' && i.completed_at && new Date(i.completed_at).getTime() > week).length
  return (
    <main className="dash">
      <Link href="/dashboard" className="back">← voltar</Link>
      <h1>{domain.name}</h1>
      <div className={`momentum ${recent > 0 ? 'hot' : ''}`}>{recent > 0 ? `🔥 embalado · ${recent} nos últimos 7 dias` : '😴 quieto — sem pressa, volta quando der'}</div>
      <DomainBoard domain={{ id: domain.id, name: domain.name, slug: domain.slug }} initialItems={items || []} />
    </main>
  )
}
