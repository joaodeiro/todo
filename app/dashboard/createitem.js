'use client'
import { useState } from 'react'
import { createLifeItem } from '@/app/actions'
import { toastSave } from '@/app/toast'
import { LIFE_CATS, CADENCES, WEEKDAYS } from '@/app/life'

// Modal único de criação de demanda da Vida.
// Hierarquia: toda demanda pertence a uma ÁREA DA VIDA (lifearea = domain).
// Vem pré-selecionada quando criada de dentro de uma área, mas dá pra trocar.
export function CreateItemModal({ areas, domainId, onClose, onCreated }) {
  const list = areas || []
  const today = () => new Date().toLocaleDateString('en-CA')
  const [area, setArea] = useState(domainId || (list[0] && list[0].id) || '')
  const [category, setCategory] = useState('do_dia')
  const [title, setTitle] = useState('')
  const [notes, setNotes] = useState('')
  const [cadence, setCadence] = useState('diaria')
  const [weekday, setWeekday] = useState('1')
  const [time, setTime] = useState('08:00')
  const [due, setDue] = useState(() => today()) // "Do dia" começa hoje; "Quando der" fica vazio
  const [saving, setSaving] = useState(false)
  function pickCategory(key) {
    setCategory(key)
    if (key === 'do_dia') setDue(d => d || today())
    if (key === 'quando_der') setDue('')
  }

  async function create() {
    if (!title.trim() || !area) return
    setSaving(true)
    const item = await toastSave(createLifeItem({ domainId: area, title, notes, category, cadence, weekday, time, due_at: due || null }), { loading: 'Criando…', success: 'Demanda criada' })
    setSaving(false)
    if (item) onCreated(item)
  }
  const areaName = (list.find(a => a.id === area) || {}).name || 'Área da Vida'

  return (
    <div className="badge-overlay" onClick={onClose}>
      <div className="kmodal kmodal-xl" onClick={e => e.stopPropagation()}>
        <div className="km-top">
          <span className="km-newtag">Nova demanda</span>
          <div className="km-top-actions">
            <button className="link" onClick={onClose}>cancelar</button>
            <button className="km-save" disabled={saving || !title.trim() || !area} onClick={create}>criar</button>
          </div>
        </div>

        <div className="ci-area">
          <span className="ci-area-lbl">Área da Vida</span>
          <select className="sel ci-area-sel" value={area} onChange={e => setArea(e.target.value)}>
            {list.length === 0 && <option value="">—</option>}
            {list.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </div>

        <div className="catpick">
          {LIFE_CATS.map(c => (
            <button key={c.key} className={`catopt ${category === c.key ? 'on' : ''}`} onClick={() => pickCategory(c.key)}>
              <span className="catopt-ico">{c.icon}</span>
              <span className="catopt-l">{c.label}</span>
              <span className="catopt-h">{c.hint}</span>
            </button>
          ))}
        </div>

        <div className="km-grid">
          <div className="km-main">
            <input className="km-h" value={title} onChange={e => setTitle(e.target.value)} placeholder="O que é?" autoFocus />
            <div className="km-lbl">Detalhes (opcional)</div>
            <textarea className="km-ta" rows={4} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Contexto, links, o que precisa…" />
          </div>
          <aside className="km-side">
            {category === 'recorrente' && (
              <div className="km-prop km-prop-col"><span className="km-pk">Cadência</span>
                <select className="sel sel-sm" value={cadence} onChange={e => setCadence(e.target.value)}>
                  {CADENCES.map(c => <option key={c.key} value={c.key}>{c.label} — {c.short}</option>)}
                </select>
              </div>
            )}
            {category === 'recorrente' && cadence === 'semanal' && (
              <div className="km-prop km-prop-col"><span className="km-pk">Roda em</span>
                <div className="ci-when">
                  <select className="sel sel-sm" value={weekday} onChange={e => setWeekday(e.target.value)}>
                    {WEEKDAYS.map(w => <option key={w.v} value={w.v}>{w.label}</option>)}
                  </select>
                  <input type="time" className="km-input" style={{ margin: 0 }} value={time} onChange={e => setTime(e.target.value)} />
                </div>
                <span className="catnote">Fica pendente a partir desse dia/horário, toda semana.</span>
              </div>
            )}
            {category !== 'recorrente' && (
              <div className="km-prop km-prop-col"><span className="km-pk">Data</span>
                <input type="date" className="km-input" style={{ margin: 0 }} value={due} onChange={e => setDue(e.target.value)} placeholder="sem data" />
                {!due && <span className="catnote">Sem data: fica no Backlog até você priorizar (ou usar “Fazer hoje”).</span>}
              </div>
            )}
            {category !== 'recorrente' && (
              <div className="km-prop"><span className="km-pk">Status</span><span className="km-pv">{due === today() ? 'Aguardando' : 'Backlog'}</span></div>
            )}
            <div className="km-prop km-prop-col"><span className="km-pk">Em {areaName}</span>
              <span className="catnote">{category === 'recorrente' ? 'Repete sozinha e aparece no Hoje a cada ciclo.' : 'Com data de hoje já entra como Aguardando e aparece no Hoje.'}</span>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
