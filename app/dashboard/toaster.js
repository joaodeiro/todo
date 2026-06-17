'use client'
import { useState, useEffect, useRef } from 'react'

// Pilha de toasts. Escuta o window-event 'toast' (ver app/toast.js).
// Um toast com mesmo id é atualizado no lugar (loading → sucesso).
export function Toaster() {
  const [items, setItems] = useState([])
  const timers = useRef({})

  useEffect(() => {
    function dismiss(id) {
      setItems(list => list.filter(t => t.id !== id))
      clearTimeout(timers.current[id]); delete timers.current[id]
    }
    function onToast(e) {
      const d = e.detail || {}
      setItems(list => {
        const exists = list.some(t => t.id === d.id)
        return exists ? list.map(t => t.id === d.id ? { ...t, ...d } : t) : [...list, d]
      })
      clearTimeout(timers.current[d.id])
      const dur = d.duration != null ? d.duration : (d.loading ? 0 : 2600)
      if (dur > 0) timers.current[d.id] = setTimeout(() => dismiss(d.id), dur)
    }
    window.addEventListener('toast', onToast)
    return () => { window.removeEventListener('toast', onToast); Object.values(timers.current).forEach(clearTimeout) }
  }, [])

  function close(id) { setItems(list => list.filter(t => t.id !== id)) }
  if (!items.length) return null
  return (
    <div className="toaster" role="status" aria-live="polite">
      {items.map(t => (
        <div key={t.id} className={`toast ${t.type || 'success'} ${t.loading ? 'is-loading' : ''}`} onClick={() => close(t.id)}>
          <span className="toast-ico">
            {t.loading ? <span className="toast-spin" aria-hidden="true" /> : t.type === 'error' ? '⚠' : '✓'}
          </span>
          <span className="toast-msg">{t.msg}</span>
        </div>
      ))}
    </div>
  )
}
