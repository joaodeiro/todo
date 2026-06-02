'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { signOut } from '@/app/actions'

const THEMES = ['cream', 'light', 'dark']

function IHome() { return <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M3 11l9-8 9 8" /><path d="M5 10v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V10" /></svg> }
function IBoard() { return <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="18" rx="1.5" /><rect x="14" y="3" width="7" height="11" rx="1.5" /></svg> }
function IAward() { return <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="6" /><path d="M15.5 13.5 17 22l-5-3-5 3 1.5-8.5" /></svg> }
function IUser() { return <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></svg> }
function IOut() { return <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="M16 17l5-5-5-5" /><path d="M21 12H9" /></svg> }
function ITheme() { return <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8a2.8 2.8 0 0 0 4 4 4 4 0 1 1-4-4" /><path d="M12 2v1M12 21v1M4.2 4.2l.8.8M19 19l.8.8M2 12h1M21 12h1M4.2 19.8l.8-.8M19 5l.8-.8" /></svg> }

export function Sidebar() {
  const path = usePathname() || '/dashboard'
  const vidaOn = path === '/dashboard' || (/^\/dashboard\/[^/]+$/.test(path) && !/^\/dashboard\/(trabalho|conquistas|conta)/.test(path))
  const trabOn = path.startsWith('/dashboard/trabalho')
  const conqOn = path.startsWith('/dashboard/conquistas')
  return (
    <aside className="side">
      <Link href="/dashboard" className="side-brand">
        <span className="side-logo">🔥</span><span className="side-brandtxt">Sistema</span>
      </Link>
      <nav className="side-nav">
        <Link href="/dashboard" className={`side-i ${vidaOn ? 'on' : ''}`}><IHome /><span>Vida</span></Link>
        <Link href="/dashboard/trabalho" className={`side-i ${trabOn ? 'on' : ''}`}><IBoard /><span>Trabalho</span></Link>
        <Link href="/dashboard/conquistas" className={`side-i ${conqOn ? 'on' : ''}`}><IAward /><span>Conquistas</span></Link>
      </nav>
    </aside>
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
      <div className="topbar-actions">
        <button className="top-i" onClick={cycleTheme} title={`Tema: ${theme}`} aria-label="Mudar tema"><ITheme /></button>
        <Link href="/dashboard/conta" className={`top-link ${contaOn ? 'on' : ''}`}><IUser /><span>Perfil</span></Link>
        <form action={signOut}><button className="top-link"><IOut /><span>Sair</span></button></form>
      </div>
    </header>
  )
}
