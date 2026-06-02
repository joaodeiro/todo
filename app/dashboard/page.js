import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ensureSeed } from '@/app/actions'

export const dynamic = 'force-dynamic'
export const preferredRegion = 'gru1'

export default async function Dashboard() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')
  await ensureSeed()
  const [{ data: domains }, { data: items }] = await Promise.all([
    supabase.from('domain').select('*').order('sort'),
    supabase.from('item').select('domain_id,status,completed_at').eq('environment', 'vida'),
  ])
  const week = Date.now() - 7 * 86400000
  const done = {}, recent = {}
  ;(items || []).forEach(i => {
    if (i.status === 'done') {
      done[i.domain_id] = (done[i.domain_id] || 0) + 1
      if (i.completed_at && new Date(i.completed_at).getTime() > week) recent[i.domain_id] = (recent[i.domain_id] || 0) + 1
    }
  })

  return (
    <main className="dash">
      <header className="page-head">
        <h1>E aí, João! 👋</h1>
        <p className="sub">Clica num domínio pra entrar. 🔥 = embalado nos últimos 7 dias.</p>
      </header>
      <div className="grid">
        {(domains || []).map(d => (
          <Link key={d.id} href={`/dashboard/${d.slug}`} className={`domain ${d.kind}`}>
            <span className="dot" />{d.name}
            {recent[d.id] ? <span className="flame">🔥</span> : null}
            {done[d.id] ? <span className="count">{done[d.id]} ✓</span> : null}
          </Link>
        ))}
      </div>
    </main>
  )
}
