'use client'
import { useEffect, useState } from 'react'

const THEMES = [
  { k: 'cream', label: 'Cream', icon: '🎨' },
  { k: 'light', label: 'Light', icon: '☀️' },
  { k: 'dark', label: 'Dark', icon: '🌙' }
]

export function ThemeToggle() {
  const [t, setT] = useState('cream')
  useEffect(() => {
    const s = (typeof localStorage !== 'undefined' && localStorage.getItem('theme')) || 'cream'
    setT(s); document.documentElement.dataset.theme = s
  }, [])
  function pick(k) {
    setT(k)
    try { localStorage.setItem('theme', k) } catch (e) {}
    document.documentElement.dataset.theme = k
  }
  return (
    <div className="theme-sw">
      {THEMES.map(x => (
        <button key={x.k} className={`tsw ${t === x.k ? 'on' : ''}`} title={x.label} aria-label={x.label} onClick={() => pick(x.k)}>{x.icon}</button>
      ))}
    </div>
  )
}
