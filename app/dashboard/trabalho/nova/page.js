import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { NovaDemanda } from './form'

export const dynamic = 'force-dynamic'
export const preferredRegion = 'gru1'

export default async function Nova() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')
  const { data: areas } = await supabase.from('work_area').select('*').order('code')
  return <NovaDemanda areas={areas || []} />
}
