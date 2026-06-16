import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ensureSeed, getStreaks } from '@/app/actions'

export const dynamic = 'force-dynamic'
export const preferredRegion = 'gru1'

export default async function Dashboard() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')
  await ensureSeed()
  const endOfToday = new Date(); endOfToday.setHours(23, 59, 59, 999)
  const startOfToday = new Date(); startOfToday.setHours(0, 0, 0, 0)
  const [{ data: domains }, { data: items }, { data: dailyRituals }, { data: agenda }, { data: doneToday }, streak] = await Promise.all([
    supabase.from('domain').select('*').order('sort'),
    supabase.from('item').select('domain_id,status,primitive').eq('environment', 'vida'),
    supabase.from('item').select('id').eq('environment', 'vida').eq('primitive', 'ritual').contains('config', { cadence: 'diaria' }),
    supabase.from('item').select('id').eq('environment', 'vida').eq('primitive', 'task').not('due_at', 'is', null).neq('status', 'concluido').lte('due_at', endOfToday.toISOString()),
    supabase.from('event').select('item_id').eq('type', 'ritual_done').gte('occurred_at', startOfToday.toISOString()),
    getStreaks(),
  ])
  const done = {}
  ;(items || []).forEach(i => {
    if (i.status === 'done' || i.status === 'concluido') done[i.domain_id] = (done[i.domain_id] || 0) + 1
  })
  const dailyDoneIds = new Set((doneToday || []).map(e => e.item_id))
  const dailyPend = (dailyRituals || []).filter(r => !dailyDoneIds.has(r.id)).length
  const hojePend = dailyPend + (agenda || []).length
  const ds = (streak && streak.byDomain) || {}

  return (
    <main className="dash">
      <header className="page-head">
        <h1>E aí, João! 👋</h1>
        <p className="sub">Clica num domínio pra entrar.</p>
      </header>
      <Link href="/dashboard/hoje" className={`hojecard ${hojePend ? 'has' : ''}`}>
        <span className="hojecard-ico">☀️</span>
        <span className="hojecard-txt">
          <span className="hojecard-t">Hoje</span>
          <span className="hojecard-s">{hojePend ? `${hojePend} ${hojePend === 1 ? 'coisa' : 'coisas'} pra hoje` : 'tudo em dia por aqui 🌤️'}</span>
        </span>
        <span className="hojecard-go">→</span>
      </Link>
      <div className="grid">
        {(domains || []).map(d => {
          const st = (ds[d.id] || {}).current || 0
          return (
            <Link key={d.id} href={`/dashboard/${d.slug}`} className={`domain ${d.kind}`}>
              <span className="dot" />{d.name}
              {st > 0 ? <span className="flame">🔥 {st}</span> : null}
              {done[d.id] ? <span className="count">{done[d.id]} ✓</span> : null}
            </Link>
          )
        })}
      </div>
    </main>
  )
}
