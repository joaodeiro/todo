import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Gallery } from './gallery'

export const dynamic = 'force-dynamic'
export const preferredRegion = 'gru1'
const TZ = 3 * 3600 * 1000 // BRT aprox

const LEVEL_NAMES = {
  jiujitsu: ['Tatame Aquecido', 'Pegada de Aço', 'Faixa Subindo', 'Predador do Tatame', 'Lenda do Tatame'],
  leitura: ['Virador de Páginas', 'Devorador de Livros', 'Rato de Biblioteca', 'Mente Enciclopédica', 'Oráculo'],
  comida: ['Mexeu a Panela', 'Tempero na Mão', 'Chef de Casa', 'Mestre-Cuca', 'Estrela Michelin'],
  casa: ['Cama Arrumada', 'Casa em Ordem', 'Zelador-Chefe', 'Lar Impecável', 'Senhor do Castelo'],
  carreira: ['Primeiro Passo Lá Fora', 'Networking Ligado', 'Passaporte Carimbado', 'Player Global', 'Cidadão do Mundo']
}
const AREA_NAMES = {
  PROD: ['Produto no Radar', 'Entregando Valor', 'Máquina de Produto', 'Arquiteto de Produto', 'Lenda do Produto'],
  DES: ['Primeiros Traços', 'Pixel Caprichado', 'Olho de Designer', 'Mestre do Craft', 'Lenda do Design'],
  INOV: ['Semente Plantada', 'Conectando Pontos', 'Mente Inovadora', 'Arquiteto de Futuro', 'Visionário']
}
const L5 = ['comum', 'comum', 'raro', 'epico', 'lendario']
const L6 = ['comum', 'comum', 'raro', 'raro', 'epico', 'lendario']

function ladder(idPrefix, trail, to, kind, names, targets, rarities, current, descFn) {
  return names.map((nm, i) => ({
    key: `${idPrefix}-${i + 1}`, trail, to, kind, tier: Math.min(5, i + 1),
    icon: '🏅', title: nm, desc: descFn(targets[i], i),
    rarity: rarities[i], hidden: false, seq: i + 1,
    earned: current >= targets[i], earnedAt: null,
    current: Math.min(current, targets[i]), target: targets[i], hasProgress: true
  }))
}
function uniq(key, trail, to, kind, title, desc, rarity, ok, hidden = false, seq = 1) {
  const tier = rarity === 'lendario' ? 5 : rarity === 'epico' ? 4 : rarity === 'raro' ? 3 : 1
  return { key, trail, to, kind, tier, icon: '🏅', title, desc, rarity, hidden: !!hidden, seq, earned: !!ok, earnedAt: null, current: ok ? 1 : 0, target: 1, hasProgress: false }
}

export default async function Conquistas() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const [vd, dm, tr, ar, teq, atq] = await Promise.all([
    supabase.from('item').select('completed_at,domain_id').eq('environment', 'vida').eq('status', 'done'),
    supabase.from('domain').select('id,slug,name,kind').eq('kind', 'maestria').order('sort'),
    supabase.from('item').select('id,status,work_area_id,blocked').eq('environment', 'trabalho'),
    supabase.from('work_area').select('id,code'),
    supabase.from('time_entry').select('item_id,seconds'),
    supabase.from('attachment').select('kind')
  ])
  const vidaDone = vd.data || [], domains = dm.data || [], trab = tr.data || [], areas = ar.data || [], te = teq.data || [], atts = atq.data || []

  // ---- contexto Vida ----
  const domBySlug = {}; domains.forEach(d => { domBySlug[d.id] = d.slug })
  let total = 0; const domainCount = {}; const domSet = new Set(); const dayMap = {}; const comps = []
  vidaDone.forEach(it => {
    if (!it.completed_at) return
    total++
    if (it.domain_id) { domSet.add(it.domain_id); const sl = domBySlug[it.domain_id]; if (sl) domainCount[sl] = (domainCount[sl] || 0) + 1 }
    const ld = new Date(new Date(it.completed_at).getTime() - TZ)
    comps.push({ h: ld.getUTCHours(), wd: ld.getUTCDay(), dom: ld.getUTCDate(), md: ld.toISOString().slice(5, 10) })
    const dk = ld.toISOString().slice(0, 10)
    if (!dayMap[dk]) dayMap[dk] = { count: 0, doms: new Set() }
    dayMap[dk].count++; if (it.domain_id) dayMap[dk].doms.add(it.domain_id)
  })
  const distinctDomains = domSet.size
  const doneInDayMax = Math.max(0, ...Object.values(dayMap).map(d => d.count))
  const distinctDayMax = Math.max(0, ...Object.values(dayMap).map(d => d.doms.size))
  const daysSorted = Object.keys(dayMap).sort()
  let longest = 0, run = 0, prev = null, maxGap = 0
  for (const dk of daysSorted) {
    if (prev) { const diff = (Date.parse(dk) - Date.parse(prev)) / 86400000; run = diff === 1 ? run + 1 : 1; if (diff - 1 > maxGap) maxGap = diff - 1 } else run = 1
    if (run > longest) longest = run
    prev = dk
  }
  const some = fn => comps.some(fn)

  // ---- contexto Trabalho ----
  const codeById = {}; areas.forEach(a => { codeById[a.id] = a.code })
  let trabDone = 0, blockedCount = 0; const perAreaDone = { PROD: 0, DES: 0, INOV: 0 }
  trab.forEach(it => {
    if (it.blocked) blockedCount++
    if (it.status === 'concluido') {
      trabDone++
      const code = codeById[it.work_area_id]; if (perAreaDone[code] != null) perAreaDone[code]++
    }
  })
  const teByItem = {}; te.forEach(t => { teByItem[t.item_id] = (teByItem[t.item_id] || 0) + (t.seconds || 0) })
  const timeTotal = Object.values(teByItem).reduce((a, b) => a + b, 0)
  const maxSingle = Math.max(0, ...Object.values(teByItem))
  const attFiles = atts.filter(a => a.kind !== 'link').length
  const links = atts.filter(a => a.kind === 'link').length
  const distinctAreas = ['PROD', 'DES', 'INOV'].filter(c => perAreaDone[c] > 0).length
  const trabTotal = trab.length

  const S = []
  // 1 — Início
  S.push(uniq('ini-vida', 'Início', 1, 'sessoes', 'Primeira da Vida', 'Você concluiu sua primeira tarefa pessoal. Tudo começa com um passo.', 'comum', total >= 1))
  S.push(uniq('ini-trab', 'Início', 1, 'sessoes', 'Primeira Entrega', 'Sua primeira demanda de trabalho concluída. A engrenagem girou.', 'comum', trabDone >= 1))
  S.push(uniq('ini-timer', 'Início', 1, 'sessoes', 'Cronômetro Ligado', 'Você cronometrou tempo numa demanda pela primeira vez.', 'comum', timeTotal > 0))
  S.push(uniq('ini-att', 'Início', 1, 'colecao', 'Primeiro Anexo', 'Você anexou um arquivo a uma demanda. Contexto guardado.', 'comum', attFiles >= 1))
  S.push(uniq('ini-link', 'Início', 1, 'colecao', 'Primeiro Elo', 'Você ligou um link a uma demanda. Tudo conectado.', 'comum', links >= 1))
  S.push(uniq('ini-blk', 'Início', 1, 'especial', 'Sinaleiro', 'Você marcou um bloqueio — reconhecer o que trava já é metade do caminho.', 'comum', blockedCount >= 1))

  // 2 — Vida em volume
  S.push(...ladder('vida-vol', 'Vida — Volume', 2, 'sessoes',
    ['Primeiros Passos na Vida', 'Vida em Movimento', 'Constância de Vida', 'Vida Plena', 'Mestre da Própria Vida'],
    [10, 25, 50, 100, 250], L5, total, t => `${t} tarefas concluídas na vida.`))

  // 10+ — cada área da vida (maestria), escada de 5
  domains.forEach((d, i) => {
    const names = LEVEL_NAMES[d.slug] || ['Nível 1', 'Nível 2', 'Nível 3', 'Nível 4', 'Nível 5']
    S.push(...ladder(`lvl-${d.slug}`, d.name, 10 + i, d.slug, names, [5, 10, 25, 50, 100], L5, domainCount[d.slug] || 0, t => `${t} tarefas concluídas em ${d.name}.`))
  })

  // 20 — Frequência
  S.push(...ladder('streak', 'Frequência', 20, 'frequencia',
    ['Dois Dias', 'Semana Cheia', 'Quinzena de Fogo', 'Mês Inteiro', 'Sessenta Dias', 'Centenário'],
    [2, 7, 14, 30, 60, 100], L6, longest, t => `${t} dias seguidos com algo concluído.`))
  S.push(...ladder('day', 'Frequência', 20, 'frequencia',
    ['Dia Produtivo', 'Dia Insano', 'Dia Lendário'],
    [3, 5, 10], ['comum', 'raro', 'epico'], doneInDayMax, t => `${t} tarefas concluídas num único dia.`))
  S.push(uniq('comeback', 'Frequência', 20, 'frequencia', 'De Volta ao Jogo', 'Sumiu por mais de duas semanas e voltou. O importante é retomar.', 'raro', maxGap >= 14))

  // 30 — Trabalho: demandas
  S.push(...ladder('trab-vol', 'Trabalho — Demandas', 30, 'repertorio',
    ['Engrenagem Girando', 'Ritmo de Entrega', 'Tocador de Projetos', 'Locomotiva', 'Lenda da Execução'],
    [5, 10, 25, 50, 100], L5, trabDone, t => `${t} demandas de trabalho concluídas.`))

  // 31+ — Trabalho por área
  ;['PROD', 'DES', 'INOV'].forEach((code, i) => {
    S.push(...ladder(`area-${code}`, `Trabalho · ${code}`, 31 + i, 'repertorio', AREA_NAMES[code], [3, 8, 15, 25, 40], L5, perAreaDone[code], t => `${t} demandas de ${code} concluídas.`))
  })

  // 40 — Cronômetro
  S.push(...ladder('time-vol', 'Cronômetro', 40, 'sessoes',
    ['Cronômetro Ligado', 'Cinco Horas', 'Maratonista (10h)', 'Imersão (25h)', 'Cinquentenário', 'Centenário do Foco'],
    [3600, 18000, 36000, 90000, 180000, 360000], L6, timeTotal, t => `${Math.round(t / 3600)}h cronometradas no total.`))
  S.push(...ladder('time-single', 'Cronômetro', 40, 'sessoes',
    ['Sessão Concentrada', 'Foco Profundo', 'Deep Work (8h)'],
    [3600, 10800, 28800], ['comum', 'raro', 'epico'], maxSingle, t => `${Math.round(t / 3600)}h cronometradas numa única demanda.`))

  // 50 — Organização
  S.push(...ladder('att', 'Organização', 50, 'colecao',
    ['Primeiro Anexo', 'Arquivista', 'Bibliotecário', 'Curador'],
    [1, 5, 10, 25], ['comum', 'comum', 'raro', 'epico'], attFiles, t => `${t} anexos guardados nas demandas.`))
  S.push(...ladder('lnk', 'Organização', 50, 'colecao',
    ['Primeiro Link', 'Conector', 'Tecelão de Contexto', 'Hub de Referências'],
    [1, 5, 10, 25], ['comum', 'comum', 'raro', 'epico'], links, t => `${t} links ligados às demandas.`))
  S.push(uniq('org-fila', 'Organização', 50, 'colecao', 'Dono da Fila', 'Seu quadro tem 20+ demandas mapeadas. Nada se perde.', 'raro', trabTotal >= 20))
  S.push(uniq('org-gestor', 'Organização', 50, 'especial', 'Gestor de Bloqueios', 'Dois ou mais bloqueios mapeados ao mesmo tempo — visibilidade total dos travamentos.', 'raro', blockedCount >= 2))

  // 60 — Repertório / diversidade
  S.push(...ladder('div-dom', 'Repertório', 60, 'repertorio',
    ['Dois Mundos', 'Tríade', 'Vida Multifacetada'],
    [2, 3, 5], ['comum', 'raro', 'epico'], distinctDomains, t => `Tarefas concluídas em ${t} áreas diferentes da vida.`))
  S.push(...ladder('div-day', 'Repertório', 60, 'repertorio',
    ['Dia Variado', 'Dia Completo'],
    [2, 3], ['comum', 'raro'], distinctDayMax, t => `${t} áreas diferentes num único dia.`))
  S.push(...ladder('div-area', 'Repertório', 60, 'repertorio',
    ['Duas Frentes', 'Tripla Coroa'],
    [2, 3], ['comum', 'epico'], distinctAreas, t => `Entregou em ${t} áreas de trabalho diferentes.`))

  // 70 — Especiais (secretas)
  S.push(uniq('sec-coruja', 'Especiais', 70, 'especial', 'Coruja da Madrugada', 'Concluiu algo antes das 6 da manhã. O mundo dormia.', 'raro', some(c => c.h < 6), true))
  S.push(uniq('sec-noti', 'Especiais', 70, 'especial', 'Notívago', 'Concluiu algo depois das 22h. A noite é sua.', 'raro', some(c => c.h >= 22), true))
  S.push(uniq('sec-weekend', 'Especiais', 70, 'especial', 'Sem Folga', 'Concluiu algo num fim de semana. Disciplina não tira férias.', 'comum', some(c => c.wd === 0 || c.wd === 6), true))
  S.push(uniq('sec-f13', 'Especiais', 70, 'especial', 'Azar Nenhum', 'Concluiu algo numa sexta-feira 13. Superstição zero.', 'epico', some(c => c.wd === 5 && c.dom === 13), true))
  S.push(uniq('sec-domingo', 'Especiais', 70, 'especial', 'Domingo Operário', 'Concluiu algo num domingo. Enquanto uns descansam…', 'comum', some(c => c.wd === 0), true))
  S.push(uniq('sec-segunda', 'Especiais', 70, 'especial', 'Segunda Não Me Para', 'Concluiu algo antes das 9h de uma segunda. Começou ganhando.', 'raro', some(c => c.wd === 1 && c.h < 9), true))
  S.push(uniq('sec-lobos', 'Especiais', 70, 'especial', 'Hora dos Lobos', 'Concluiu algo entre 0h e 3h. Insônia produtiva.', 'epico', some(c => c.h < 3), true))
  S.push(uniq('sec-virada', 'Especiais', 70, 'especial', 'Virada de Ano', 'Concluiu algo em 31/12 ou 01/01. Ano novo, vida nova de verdade.', 'lendario', some(c => c.md === '12-31' || c.md === '01-01'), true))
  S.push(uniq('sec-almoco', 'Especiais', 70, 'especial', 'Sem Hora pra Almoço', 'Concluiu algo entre meio-dia e 13h. Comeu o problema no almoço.', 'comum', some(c => c.h === 12), true))
  S.push(uniq('sec-madrugador', 'Especiais', 70, 'especial', 'Madrugador', 'Concluiu algo entre 5h e 7h. O dia mal começou e você já entregou.', 'raro', some(c => c.h >= 5 && c.h < 7), true))

  // 90 — Colecionador (meta) — conta as outras conquistas desbloqueadas
  const earnedCount = S.filter(s => s.earned).length
  S.push(...ladder('meta', 'Colecionador', 90, 'meta',
    ['Colecionador Iniciante', 'Caçador de Medalhas', 'Vitrine Cheia', 'Colecionador de Elite', 'Quase Lá', 'Tudo ou Nada'],
    [5, 10, 25, 50, 75, 100], L6, earnedCount, t => `${t} conquistas desbloqueadas no total.`))

  return (
    <main className="dash wide">
      <header className="section-head">
        <div className="section-head-l">
          <h1 className="section-title">Conquistas</h1>
          <span className="section-meta">{S.filter(s => s.earned).length} de {S.length} desbloqueadas</span>
        </div>
      </header>
      <Gallery states={S} />
    </main>
  )
}
