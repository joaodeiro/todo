// Migração da v0 (ToDo.md do Obsidian) → ambiente Trabalho.
// status: backlog|aguardando|fazendo|concluido · area: PROD|DES|INOV
export const V0_ITEMS = [
  // Fazendo
  { legacy_id: 'PROD-9', area: 'PROD', status: 'fazendo', title: 'Bloco "CONCEITO" estilo elegantgarden.software/#section-sobre', origem: 'memória project_lp_taller_atual (06/05)', contexto: 'Comunicar TALLER = artesão (não oficina). POV de "artesão de produto digital". Respeitar StoryBrand + Suellentrop. NÃO trazer tese "SaaS morreu" pra LP pública.' },
  { legacy_id: 'INOV-2', area: 'INOV', status: 'fazendo', title: 'Aplicar diretrizes do reposicionamento de 06/05 em marca/LP/copy', origem: 'reunião 2026-05-06 + memória project_reposicionamento', contexto: 'Régua transversal: anti-alocação, Service-as-Software, founder-led, subir conversa pra C-level, nichar em founders technical/produto. Em execução desde 29/05 (home /2).', blocked: true, block_reason: 'validação — aguardando o time avaliar a recepção da home /2' },

  // Aguardando Início
  { legacy_id: 'PROD-14', area: 'PROD', status: 'aguardando', title: 'Polir comportamento da logo na home (smooth-scroll + nav interna)', origem: 'sessão Fix broken consulting pages (18/05)', contexto: 'Na home, clique no logo recarrega em vez de scroll. Solução: JS de 4 linhas.' },
  { legacy_id: 'PROD-11', area: 'PROD', status: 'aguardando', title: 'Inserir LP no processo criativo do reposicionamento', origem: 'reunião 2026-05-06 (Alocação Discovery)', contexto: 'Trazer LP pra dentro do reposicionamento (Service-as-Software, founder-led, anti-alocação).' },
  { legacy_id: 'PROD-20', area: 'PROD', status: 'aguardando', title: 'Setup PostHog no blog WordPress (blog.taller.net.br) via WPCode 🔥', origem: 'memória project_blog_taller', contexto: 'Snippet pronto em PostHog-Blog-WordPress-Setup.md. 95% do tráfego invisível sem isso. Eventos post_lido e clique_para_lp. Depende de acesso wp-admin (João não tem direto).' },

  // Backlog · Produto
  { legacy_id: 'PROD-10', area: 'PROD', status: 'backlog', title: 'Comunicar valor com números (negócios, projetos, anos)', origem: 'reunião 2026-05-06 (decisão #7)', contexto: 'Hoje só mostra logos. Faltam números reais do legado software house pra sustentar autoridade (bloco Track Record do /2).' },
  { legacy_id: 'PROD-15', area: 'PROD', status: 'backlog', title: 'Criar /servicos/dynamic-flow.astro pra reabilitar "Consultorias"', origem: 'sessão Fix broken consulting pages (18/05)', contexto: 'Consultorias foi removida temporariamente até esta página existir.' },
  { legacy_id: 'PROD-18', area: 'PROD', status: 'backlog', title: 'Versionar arquivos WIP órfãos do repo da LP', origem: 'sessões Analyze LP + Review modular offer', contexto: 'Untracked há semanas; mesmo risco do ClientsMarquee que quebrou builds. Stage arquivo por arquivo, nunca git add .' },
  { legacy_id: 'PROD-22', area: 'PROD', status: 'backlog', title: 'Identificar onde os ~4 calls qualificadas/mês são registradas', origem: 'sessão GA connector', contexto: 'Sem fonte autoritativa (RD/planilha/Calendly/CRM), métricas pro case da LP dependem de auto-relato.' },
  { legacy_id: 'PROD-21', area: 'PROD', status: 'backlog', title: 'Recuperar baseline "antes" do site antigo no RD Station', origem: 'sessão GA connector', contexto: 'GA4 só tem form_submit desde abr/2024 e nunca pegou forms RD. Sem RD, o antes/depois do case fica fraco.' },
  { legacy_id: 'PROD-23', area: 'PROD', status: 'backlog', title: 'Plano de eventos completo da LP (spec evento-a-evento)', origem: 'sessão GA connector', contexto: 'Cada evento: quando dispara, qual vira conversão, nome técnico. Pendente após travamento de limite.' },
  { legacy_id: 'PROD-19', area: 'PROD', status: 'backlog', title: 'Setup GTM com 3 eventos no GA4', origem: 'memória reference_ga4_taller', contexto: 'Guia em GA4-Taller-Setup-Pareto.md. Decisão pendente: GA4 sendo aposentado por PostHog — vale executar?' },
  { legacy_id: 'PROD-26', area: 'PROD', status: 'backlog', title: 'Interface CS de atualização manual dos 4 indicadores (ECBR)', origem: 'sessão Design Central dashboard', contexto: 'Daniele atualiza manual mensalmente. Lemke sugeriu manter manual no MVP com automação futura.' },
  { legacy_id: 'PROD-27', area: 'PROD', status: 'backlog', title: 'Empty state da Empresa + estado "Em breve" (ECBR)', origem: 'sessão Design Central dashboard (crit. 4-5)', contexto: 'Cobrir empresa sem conteúdo e conteúdos sem integração.' },
  { legacy_id: 'PROD-28', area: 'PROD', status: 'backlog', title: 'Segmentação por perfil + responsividade do dashboard ECBR', origem: 'sessão Design Central dashboard (crit. 6-7)', contexto: 'Colaborador nunca vê dados de outra empresa; layout adapta desktop/tablet/mobile mantendo hierarquia.' },
  { legacy_id: 'PROD-29', area: 'PROD', status: 'backlog', title: 'Validar com Dani perguntas em aberto sobre filtros (ECBR)', origem: 'sessão Design Central dashboard', contexto: 'Período no CS; tipo de conteúdo e período na Empresa. Ausência ≠ decisão de não ter.' },
  { legacy_id: 'PROD-30', area: 'PROD', status: 'backlog', title: 'Screenshots dos dashboards da central antiga (ECBR)', origem: 'sessão Design Central dashboard', contexto: 'Transcrição da Dani descreve mas não mostra. Sem print, hierarquia visual não é avaliável.' },
  { legacy_id: 'PROD-31', area: 'PROD', status: 'backlog', title: 'Inspecionar fonte de dados do dashboard antigo via DevTools', origem: 'sessão Design Central dashboard', contexto: 'Ninguém na cliente sabe explicar como o sistema antigo agrega. Pode ser caixa-preta.' },
  { legacy_id: 'PROD-34', area: 'PROD', status: 'backlog', title: 'Definir tipos de conteúdo no MVP vs "Em breve" (ECBR)', origem: 'sessão Design Central dashboard', contexto: 'Escopo do primeiro release do dashboard Empresa.' },
  { legacy_id: 'PROD-35', area: 'PROD', status: 'backlog', title: 'Mapear funil completo do Sebrae OnChat', origem: 'sessão Interpret Sebrae LP doc', contexto: 'LP → matrícula → clique WA → 1ª msg → curso. Sem o funil, não dá pra saber se gargalo é ir pro WhatsApp ou engajar lá dentro.' },
  { legacy_id: 'PROD-36', area: 'PROD', status: 'backlog', title: 'Pedir à operação Sebrae 2 métricas do WhatsApp', origem: 'sessão Sebrae LP', contexto: '(a) % que clica no link WA pós-matrícula; (b) tempo médio matrícula→1ª msg. Decide entre encurtar atrito da LP ou reforçar gatilho.' },
  { legacy_id: 'PROD-37', area: 'PROD', status: 'backlog', title: '5 testes de usabilidade no fluxo Sebrae mobile', origem: 'sessão Sebrae LP', contexto: 'Doc original só mostra desktop; redesenho começa por mobile (público jovem celular-first).' },
  { legacy_id: 'PROD-38', area: 'PROD', status: 'backlog', title: 'Redesenhar hero da LP Sebrae só no estudante', origem: 'sessão Sebrae LP', contexto: 'Chamada "feitos para aluno e educador" não gera identificação. Educador é ruído (170 vs 9 profs).' },
  { legacy_id: 'PROD-39', area: 'PROD', status: 'backlog', title: 'Destacar curso "IA para empreender" como âncora (Sebrae)', origem: 'sessão Sebrae LP', contexto: '33% das matrículas; vira âncora visual da LP.' },
  { legacy_id: 'PROD-40', area: 'PROD', status: 'backlog', title: 'Identificação automática via CPF (Sebrae)', origem: 'sessão Sebrae LP (proposta João)', contexto: 'Substitui "Já tenho cadastro / Retomar" por sistema, reduzindo carga cognitiva.' },
  { legacy_id: 'PROD-41', area: 'PROD', status: 'backlog', title: 'Eliminar e-mail de confirmação Sebrae (finalizar no WhatsApp)', origem: 'sessão Sebrae LP (proposta João)', contexto: 'WhatsApp converte mais que e-mail; e-mail é passo desnecessário.' },
  { legacy_id: 'PROD-42', area: 'PROD', status: 'backlog', title: 'Substituir form "Como funciona?" por ilustração chalkboard (Sebrae)', origem: 'sessão Sebrae LP (proposta João)', contexto: '3 etapas. Prompt Gemini Image gerado. Gerar 2-3 variações e A/B testar.' },
  { legacy_id: 'PROD-43', area: 'PROD', status: 'backlog', title: 'Encaminhar conclusão do projeto Sanofi', origem: 'reunião 2026-04-15 (Produto x Marketing)', contexto: 'Piloto com caso real. Trava: cliente exige .NET — decidir seguir ou abrir mão.' },

  // Backlog · Design
  { legacy_id: 'DES-2', area: 'DES', status: 'backlog', title: 'Quebrar main.css (1848 linhas) em tokens/base/animations/responsive', origem: 'CLAUDE.md + sessão Document Visual Identity', contexto: 'Hoje cópia verbatim do monolito; depois remover do .prettierignore. Doc de identidade já cita os 4 arquivos.' },
  { legacy_id: 'DES-3', area: 'DES', status: 'backlog', title: 'Quebrar main.js (758 linhas, 15 sistemas) em peças menores', origem: 'CLAUDE.md', contexto: 'Verbatim do monolito; impacta animações, parallax, particle network, glitch, cursor, scroll, magnetic buttons.' },
  { legacy_id: 'DES-10', area: 'DES', status: 'backlog', title: 'Resgatar bento antigo da seção Plano ou manter phases navigator?', origem: 'sessão Update LP content SEO', contexto: 'João disse "gostaria de restaurá-lo" depois de ver as tabs (commit ca30b61). Decisão pendente.' },
  { legacy_id: 'DES-16', area: 'DES', status: 'backlog', title: 'Enviar link Figma pro Dyego conferir moodboard/identidade', origem: 'reunião 2026-04-13', contexto: 'Alinhamento estético com o sócio. Pode virar checkpoint recorrente.' },
  { legacy_id: 'DES-18', area: 'DES', status: 'backlog', title: 'Empacotar página /servicos/desenvolvimento + componentes', origem: 'WIP + CLAUDE.md', contexto: 'Existe docs/redesign/dev-page/ sugerindo spec pronta — só não foi commitada/integrada.' },

  // Backlog · Inovação
  { legacy_id: 'INOV-1', area: 'INOV', status: 'backlog', title: 'Cruzar tese Service-Led Growth com bases de conteúdo', origem: 'reunião 2026-04-15 (Produto x Marketing)', contexto: 'Mapear onde a tese pega gancho com conteúdo existente (founder, education, product).' },
  { legacy_id: 'INOV-3', area: 'INOV', status: 'backlog', title: 'Analisar concorrente de alocação (ex: Bossa Box)', origem: 'reunião 2026-05-06', contexto: 'Referência citada por Rafa como inspiração de Service-as-Software.' },
  { legacy_id: 'INOV-5', area: 'INOV', status: 'backlog', title: 'Lista de conteúdos estratégicos pro LinkedIn', origem: 'reunião 2026-04-15', contexto: 'Complementa a tese com tática de mídia.' },
  { legacy_id: 'INOV-6', area: 'INOV', status: 'backlog', title: 'Organizar ações de estratégia de conteúdo no Miro', origem: 'reunião 2026-04-15', contexto: 'Rastreamento e planejamento.' },
  { legacy_id: 'INOV-7', area: 'INOV', status: 'backlog', title: 'Coordenar com Alis pra suporte na criação de conteúdo', origem: 'reunião 2026-05-06', contexto: 'Braço criativo externo.' },
  { legacy_id: 'INOV-8', area: 'INOV', status: 'backlog', title: 'Manter coerência entre LP e doc fonte da oferta', origem: 'memória project_oferta_modular', contexto: 'Ao mudar LP em Discovery/oferta/ICP, conferir doc fonte; não publicar pricing sem fechamento. MOD_01/02/03 + E2E.' },
  { legacy_id: 'INOV-9', area: 'INOV', status: 'backlog', title: 'Validar internamente pricing de cada módulo de Discovery', origem: 'memória project_oferta_modular', contexto: 'Hoje "a definir". Precondição pra qualquer tabela pública.' },
  { legacy_id: 'INOV-10', area: 'INOV', status: 'backlog', title: 'Manter ICP Fit Score interno ativo na qualificação', origem: 'memória project_oferta_modular', contexto: 'Tier A 80+, B 50-79, C <50. Ferramenta de qualificação, NÃO marketing.' },
  { legacy_id: 'INOV-11', area: 'INOV', status: 'backlog', title: 'Cursos e masterminds de alta qualidade (education-led)', origem: 'reuniões 2026-05-06 + 04-15', contexto: 'Mastermind premium 1-on-1 com cúpula da Taller como ticket alto.' },
  { legacy_id: 'INOV-12', area: 'INOV', status: 'backlog', title: 'Parceria externa pra empacotar o programa Taled', origem: 'reunião 2026-05-04', contexto: 'Treinamentos + conteúdos; ticket de capacitação.' },
  { legacy_id: 'INOV-13', area: 'INOV', status: 'backlog', title: 'Estruturar oferta de Corporate Venture Builder (CVB) as a Service', origem: 'reunião 2026-04-07', contexto: 'Laboratório de P&D sob demanda. Provável reabsorção no reposicionamento de 06/05.' },
  { legacy_id: 'INOV-14', area: 'INOV', status: 'backlog', title: 'Lançar beta da Laminar Discovery via evento ao vivo', origem: 'reunião 2026-04-16 (Q1)', contexto: 'Beta testers + divulgação.' },
  { legacy_id: 'INOV-15', area: 'INOV', status: 'backlog', title: 'LP de waitlist pro beta da Laminar Discovery', origem: 'reunião 2026-04-16 (Q1)', contexto: 'João é o PD; provável responsabilidade dele.' },
  { legacy_id: 'INOV-16', area: 'INOV', status: 'backlog', title: 'Vídeo promo e marketing pra Laminar Discovery', origem: 'reunião 2026-04-16 (Q1)', contexto: '' },
  { legacy_id: 'INOV-17', area: 'INOV', status: 'backlog', title: 'Contribuir com projeto do Joseph (storymapping)', origem: 'reunião 2026-04-16 (Q1)', contexto: 'Skills de storymapping e linguagem de event storming.' },
  { legacy_id: 'INOV-18', area: 'INOV', status: 'backlog', title: 'Definir margens com conceito Fit for Purpose', origem: 'reunião 2026-05-04', contexto: 'Separar margem início/fim de negociação. Lógica reutilizável pra discovery/inovação.' },
  { legacy_id: 'INOV-19', area: 'INOV', status: 'backlog', title: 'Norma: todo Discovery começa por pesquisa real', origem: 'sessão Sebrae LP', contexto: 'Crítica ao doc Sebrae: hipóteses todas internas. Vira norma da casa.' },
  { legacy_id: 'INOV-20', area: 'INOV', status: 'backlog', title: 'Testar Code Rabbit (revisão automática de código)', origem: 'reunião 2026-04-16 (Q1)', contexto: 'Produtividade do time dev.' },
  { legacy_id: 'INOV-21', area: 'INOV', status: 'backlog', title: 'Material de vendas pra Secred, Argentina, Paraguai', origem: 'reunião 2026-05-04', contexto: 'Expansão comercial em novas contas internacionais.' },
  { legacy_id: 'INOV-22', area: 'INOV', status: 'backlog', title: 'Estudar internalização de profissional pelo cliente', origem: 'reunião 2026-05-04', contexto: 'Ex: 2 anos, 25% multa. Parâmetros contratuais pra alocação.' },
  { legacy_id: 'INOV-23', area: 'INOV', status: 'backlog', title: 'Revisar processos e comunicação via Slack', origem: 'reunião 2026-05-06', contexto: 'Reduzir fricção interna.' },

  // Concluído · Produto
  { legacy_id: 'PROD-1', area: 'PROD', status: 'concluido', title: 'Reduzir seção "Laboratório de Inovação" para 1 frase', origem: 'reunião 2026-04-13 (Liz Durman)', contexto: '' },
  { legacy_id: 'PROD-2', area: 'PROD', status: 'concluido', title: 'Listar fases do laboratório no quadro direito da Solução', origem: 'reunião 2026-04-13', contexto: '' },
  { legacy_id: 'PROD-3', area: 'PROD', status: 'concluido', title: 'Simplificar CTA para "parar de queimar dinheiro"', origem: 'reunião 2026-04-13', contexto: '' },
  { legacy_id: 'PROD-4', area: 'PROD', status: 'concluido', title: 'Manter só "o custo de ignorar o mercado é maior que o da descoberta"', origem: 'reunião 2026-04-13', contexto: '' },
  { legacy_id: 'PROD-5', area: 'PROD', status: 'concluido', title: 'Padronizar "evidências" no lugar de "dados"', origem: 'reunião 2026-04-13', contexto: 'Alinha com vocabulário CTO/CIO.' },
  { legacy_id: 'PROD-6', area: 'PROD', status: 'concluido', title: 'Cross-sell de Desenvolvimento pós-validação', origem: 'reunião 2026-04-13', contexto: '' },
  { legacy_id: 'PROD-7', area: 'PROD', status: 'concluido', title: 'Refletir estrutura modular da oferta na LP', origem: 'memória oferta_modular', contexto: 'OfertaModular.astro. MOD_01/02/03 (4 sem) + E2E 8 sem. Concluído 28/05.' },
  { legacy_id: 'PROD-12', area: 'PROD', status: 'concluido', title: 'Corrigir 404 em Consultorias e Treinamentos', origem: 'sessão Fix broken consulting pages (18/05)', contexto: '' },
  { legacy_id: 'PROD-13', area: 'PROD', status: 'concluido', title: 'Logo + "Taller Innovation" apontam pra /', origem: 'sessão Fix broken consulting pages (18/05)', contexto: '' },
  { legacy_id: 'PROD-17', area: 'PROD', status: 'concluido', title: 'Rafa adicionar PUBLIC_POSTHOG_PROJECT_TOKEN em Production', origem: 'sessão Review modular offer', contexto: 'LP em produção captura PostHog. Concluído 29/05.' },
  { legacy_id: 'PROD-24', area: 'PROD', status: 'concluido', title: 'Dashboard inicial CS na Nova Central da ECBR', origem: 'sessão Design Central dashboard (13/05)', contexto: 'Título + atalhos + 4 indicadores. Concluído 29/05.' },
  { legacy_id: 'PROD-25', area: 'PROD', status: 'concluido', title: 'Dashboard inicial Empresa na Nova Central da ECBR', origem: 'sessão Design Central dashboard (13/05)', contexto: 'Atalhos + resultados por tipo. Concluído 29/05.' },

  // Concluído · Design
  { legacy_id: 'DES-1', area: 'DES', status: 'concluido', title: 'Documentar identidade visual da LP a partir do código', origem: 'sessão Document Visual Identity', contexto: '' },
  { legacy_id: 'DES-4', area: 'DES', status: 'concluido', title: 'Corrigir glitch invertido em aba background', origem: 'sessão Update LP content SEO', contexto: '' },
  { legacy_id: 'DES-5', area: 'DES', status: 'concluido', title: 'Aumentar intervalo entre glitches de 5s para 12s', origem: 'sessão Update LP content SEO', contexto: '' },
  { legacy_id: 'DES-6', area: 'DES', status: 'concluido', title: 'Ajustar intervalo de glitch para 9s', origem: 'sessão Update LP content SEO', contexto: '5s muito, 12s pouco, 9s no ponto. Concluído 29/05.' },
  { legacy_id: 'DES-7', area: 'DES', status: 'concluido', title: 'Corrigir texto não aparecendo em diversas seções', origem: 'reunião 2026-04-13', contexto: '' },
  { legacy_id: 'DES-8', area: 'DES', status: 'concluido', title: 'Glitch só 1 vez no scroll', origem: 'reunião 2026-04-13', contexto: '' },
  { legacy_id: 'DES-9', area: 'DES', status: 'concluido', title: 'Aumentar fonte do painel direito da Solução', origem: 'reunião 2026-04-13', contexto: '' },
  { legacy_id: 'DES-11', area: 'DES', status: 'concluido', title: 'Alinhar cards de testimonial via flex + margin-top auto', origem: 'sessão Analyze LP improvements', contexto: '' },
  { legacy_id: 'DES-12', area: 'DES', status: 'concluido', title: 'Substituir "Marina F." por Otávio F. (VIA-App)', origem: 'sessão Analyze LP improvements', contexto: '11/05.' },
  { legacy_id: 'DES-13', area: 'DES', status: 'concluido', title: 'Remover marcador "Start-up" do card do Antônio Mello', origem: 'memória project_lp_taller_atual', contexto: '' },
  { legacy_id: 'DES-14', area: 'DES', status: 'concluido', title: 'Adicionar logo do VIA-App no card do Otávio', origem: 'sessão Analyze LP improvements', contexto: '' },
  { legacy_id: 'DES-15', area: 'DES', status: 'concluido', title: 'Ajustar copy do depoimento do Otávio', origem: 'sessão Analyze LP improvements', contexto: 'Discovery → Innovation; processo estratégico importante.' },
  { legacy_id: 'DES-17', area: 'DES', status: 'concluido', title: 'Vídeo curto no Slack pós-alterações de 13/04', origem: 'reunião 2026-04-13', contexto: '' },

  // Concluído · Inovação
  { legacy_id: 'INOV-4', area: 'INOV', status: 'concluido', title: 'Benchmark de tech staffing/inovação (26 empresas)', origem: 'reunião 2026-04-15 + sessão Benchmark staffing', contexto: 'Planilha Benchmark_Alocacao_TechTalent.xlsx, 8 faixas de porte.' }
]
