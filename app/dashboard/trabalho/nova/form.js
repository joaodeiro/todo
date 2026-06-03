'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createCardFull } from '@/app/actions'

const STATUSES = [['backlog', 'Backlog'], ['aguardando', 'Aguardando'], ['fazendo', 'Fazendo'], ['concluido', 'Concluído']]

export function NovaDemanda({ areas }) {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [contexto, setContexto] = useState('')
  const [origem, setOrigem] = useState('')
  const [areaSel, setAreaSel] = useState('')
  const [status, setStatus] = useState('backlog')
  const [saving, setSaving] = useState(false)
  const titleRef = useRef(null)
  useEffect(() => { const el = titleRef.current; if (el) { el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px' } }, [title])

  async function create() {
    if (!title.trim() || saving) return
    setSaving(true)
    const card = await createCardFull({ title, areaCode: areaSel, contexto, origem, status })
    if (card) router.replace(`/dashboard/trabalho/${encodeURIComponent(card.legacy_id || card.id)}`)
    else setSaving(false)
  }

  return (
    <main className="dash wide demand-page">
      <Link href="/dashboard/trabalho" className="back">← Kanban</Link>
      <div className="dmd">
        <div className="dmd-bar">
          <div className="dmd-pills">
            <span className="kcode big">nova demanda</span>
            <span className="dmd-pill"><span className="dmd-pill-dot" style={{ background: '#8C867C' }} />rascunho</span>
          </div>
          <div className="dmd-bar-actions">
            <button className="dmd-ghost" onClick={() => router.push('/dashboard/trabalho')}>cancelar</button>
            <button className="km-save" disabled={saving || !title.trim()} onClick={create}>{saving ? 'criando…' : 'criar demanda'}</button>
          </div>
        </div>

        <textarea ref={titleRef} className="dmd-title" rows={1} value={title} onChange={e => setTitle(e.target.value)} placeholder="Título da demanda" autoFocus />
        <div className="dmd-metarow">
          <span>{areaSel || 'sem área'}</span><span className="dmd-sep">·</span>
          <span>{origem || 'sem origem'}</span>
        </div>

        <div className="dmd-grid">
          <div className="dmd-main">
            <div className="dmd-lbl">Resumo — o que precisa ser feito</div>
            <textarea className="dmd-resumo" rows={7} value={contexto} onChange={e => setContexto(e.target.value)} placeholder="Descreva a demanda…" />
            <div className="dmd-lbl">De onde veio</div>
            <input className="km-input" value={origem} onChange={e => setOrigem(e.target.value)} placeholder="reunião / sessão / link de origem" />
          </div>
          <aside className="dmd-side">
            <div className="dmd-props">
              <div className="dmd-prop"><span className="dmd-pk">Status</span>
                <select className="sel sel-sm" value={status} onChange={e => setStatus(e.target.value)}>
                  {STATUSES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                </select>
              </div>
              <div className="dmd-prop"><span className="dmd-pk">Área</span>
                <select className="sel sel-sm" value={areaSel} onChange={e => setAreaSel(e.target.value)}>
                  <option value="">—</option>
                  {(areas || []).map(a => <option key={a.code} value={a.code}>{a.code}</option>)}
                </select>
              </div>
            </div>
            <p className="dmd-hint">Tempo, anexos e links ficam disponíveis assim que a demanda for criada — você cai direto na página dela.</p>
          </aside>
        </div>
      </div>
    </main>
  )
}
