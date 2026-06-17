'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { signOut, stopTimer } from '@/app/actions'
import { createClient as createBrowserSupabase } from '@/lib/supabase/client'
import { Logo } from '@/app/logo'

const THEMES = ['cream', 'light', 'dark']

function IHome() { return <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M3 11l9-8 9 8" /><path d="M5 10v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V10" /></svg> }
function ISun() { return <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg> }
function IBoard() { return <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="18" rx="1.5" /><rect x="14" y="3" width="7" height="11" rx="1.5" /></svg> }
function IAward() { return <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="6" /><path d="M15.5 13.5 17 22l-5-3-5 3 1.5-8.5" /></svg> }
function ICal() { return <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4.5" width="18" height="16.5" rx="2" /><path d="M3 9.5h18M8 2.5v4M16 2.5v4" /></svg> }
function IUser() { return <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></svg> }
function IOut() { return <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="M16 17l5-5-5-5" /><path d="M21 12H9" /></svg> }
function ITheme() { return <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8a2.8 2.8 0 0 0 4 4 4 4 0 1 1-4-4" /><path d="M12 2v1M12 21v1M4.2 4.2l.8.8M19 19l.8.8M2 12h1M21 12h1M4.2 19.8l.8-.8M19 5l.8-.8" /></svg> }

export function Sidebar() {
  const path = usePathname() || '/dashboard'
  const hojeOn = path.startsWith('/dashboard/hoje')
  const vidaOn = path === '/dashboard' || (/^\/dashboard\/[^/]+$/.test(path) && !/^\/dashboard\/(hoje|trabalho|calendario|conquistas|conta)/.test(path))
  const trabOn = path.startsWith('/dashboard/trabalho')
  const calOn = path.startsWith('/dashboard/calendario')
  const conqOn = path.startsWith('/dashboard/conquistas')
  return (
    <aside className="side">
      <Link href="/dashboard" className="side-brand">
        <span className="side-logo"><Logo size={40} /></span><span className="side-brandtxt wordmark">ZenFlow</span>
      </Link>
      <nav className="side-nav">
        <Link href="/dashboard/hoje" className={`side-i ${hojeOn ? 'on' : ''}`}><ISun /><span>Hoje</span></Link>
        <Link href="/dashboard" className={`side-i ${vidaOn ? 'on' : ''}`}><IHome /><span>Vida</span></Link>
        <Link href="/dashboard/trabalho" className={`side-i ${trabOn ? 'on' : ''}`}><IBoard /><span>Trabalho</span></Link>
        <Link href="/dashboard/calendario" className={`side-i ${calOn ? 'on' : ''}`}><ICal /><span>Calendário</span></Link>
        <Link href="/dashboard/conquistas" className={`side-i ${conqOn ? 'on' : ''}`}><IAward /><span>Conquistas</span></Link>
      </nav>
    </aside>
  )
}

// barra de navegação inferior (mobile). espelha a sidebar com cara de app.
export function BottomNav() {
  const path = usePathname() || '/dashboard'
  const hojeOn = path.startsWith('/dashboard/hoje')
  const vidaOn = path === '/dashboard' || (/^\/dashboard\/[^/]+$/.test(path) && !/^\/dashboard\/(hoje|trabalho|calendario|conquistas|conta)/.test(path))
  const trabOn = path.startsWith('/dashboard/trabalho')
  const calOn = path.startsWith('/dashboard/calendario')
  const conqOn = path.startsWith('/dashboard/conquistas')
  return (
    <nav className="botnav">
      <Link href="/dashboard/hoje" className={`bn-i ${hojeOn ? 'on' : ''}`}><ISun /><span>Hoje</span></Link>
      <Link href="/dashboard" className={`bn-i ${vidaOn ? 'on' : ''}`}><IHome /><span>Vida</span></Link>
      <Link href="/dashboard/trabalho" className={`bn-i ${trabOn ? 'on' : ''}`}><IBoard /><span>Trabalho</span></Link>
      <Link href="/dashboard/calendario" className={`bn-i ${calOn ? 'on' : ''}`}><ICal /><span>Agenda</span></Link>
      <Link href="/dashboard/conquistas" className={`bn-i ${conqOn ? 'on' : ''}`}><IAward /><span>Conquistas</span></Link>
    </nav>
  )
}

function IPause() { return <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor" aria-hidden="true"><path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" /></svg> }

// pill global da demanda rodando: visível em qualquer página, tempo ao vivo + pausa
export function RunningTimer() {
  const [supabase] = useState(() => createBrowserSupabase())
  const [run, setRun] = useState(null)
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    let on = true
    async function load() {
      const { data } = await supabase.from('item').select('id,legacy_id,title,timer_started_at').not('timer_started_at', 'is', null).limit(1)
      if (on) setRun((data || [])[0] || null)
    }
    load()
    const poll = setInterval(load, 15000)
    // o evento chega antes da action gravar: atualiza na hora pelo detail e
    // reconcilia com o banco depois (a escrita pode levar alguns ms pra cair).
    const onSync = e => {
      if (e && e.detail && 'item' in e.detail) setRun(e.detail.item)
      load(); setTimeout(load, 600); setTimeout(load, 1600)
    }
    window.addEventListener('focus', load)
    window.addEventListener('timer-change', onSync)
    return () => { on = false; clearInterval(poll); window.removeEventListener('focus', load); window.removeEventListener('timer-change', onSync) }
  }, [supabase])
  useEffect(() => { if (!run) return; const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t) }, [run])
  if (!run) return null
  const secs = Math.max(0, Math.floor((now - Date.parse(run.timer_started_at)) / 1000))
  const h = Math.floor(secs / 3600), m = Math.floor((secs % 3600) / 60), s = secs % 60
  const disp = (h ? h + ':' : '') + String(m).padStart(h ? 2 : 1, '0') + ':' + String(s).padStart(2, '0')
  async function pause(e) {
    e.preventDefault(); e.stopPropagation()
    setRun(null)
    await stopTimer(run.id)
    try { window.dispatchEvent(new Event('timer-change')) } catch (err) {}
  }
  return (
    <Link href={`/dashboard/trabalho/${encodeURIComponent(run.legacy_id || run.id)}`} className="runpill" title={run.title}>
      <span className="runpill-dot" />
      <span className="runpill-code">{run.legacy_id || '—'}</span>
      <span className="runpill-title">{run.title}</span>
      <span className="runpill-time">{disp}</span>
      <button className="runpill-pause" onClick={pause} aria-label="pausar"><IPause /></button>
    </Link>
  )
}

export function TopBar() {
  const path = usePathname() || ''
  const contaOn = path.startsWith('/dashboard/conta')
  const [theme, setTheme] = useState('cream')
  useEffect(() => {
    const s = (typeof localStorage !== 'undefined' && localStorage.getItem('theme')) || 'cream'
    setTheme(s); document.documentElement.dataset.theme = s
  }, [])
  function cycleTheme() {
    const next = THEMES[(THEMES.indexOf(theme) + 1) % THEMES.length]
    setTheme(next); try { localStorage.setItem('theme', next) } catch (e) {}
    document.documentElement.dataset.theme = next
  }
  return (
    <header className="topbar">
      <div className="topbar-left"><RunningTimer /></div>
      <div className="topbar-actions">
        <button className="top-i" onClick={cycleTheme} title={`Tema: ${theme}`} aria-label="Mudar tema"><ITheme /></button>
        <Link href="/dashboard/conta" className={`top-link ${contaOn ? 'on' : ''}`}><IUser /><span>Perfil</span></Link>
        <form action={signOut}><button className="top-link"><IOut /><span>Sair</span></button></form>
      </div>
    </header>
  )
}
