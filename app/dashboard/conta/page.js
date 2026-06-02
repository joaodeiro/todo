import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { SetPassword } from './form'

export const dynamic = 'force-dynamic'

export default async function Conta() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')
  return (
    <main className="dash">
      <Link href="/dashboard" className="back">← voltar</Link>
      <h1>Conta</h1>
      <p className="sub">Logado como {user.email}. Define uma senha pra poder entrar com e-mail e senha.</p>
      <SetPassword />
    </main>
  )
}
