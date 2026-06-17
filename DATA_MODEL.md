# Modelagem de dados — ToDo App

Estudo do modelo de dados **atual** (Supabase / Postgres, projeto `todo-app`,
ref `fdbanrsvwhaluwabtejs`, região `sa-east-1`). Documento descritivo: registra
como o esquema está hoje e as convenções que o código assume. Não propõe
migrações — é referência.

Atualizado em 2026-06-17.

## Visão geral

O sistema cobre dois **ambientes** na vida do usuário:

- **`vida`** — domínios pessoais (casa, casamento, jiu-jitsu…), com tarefas,
  rituais (recorrentes) e momentos de presença.
- **`trabalho`** — um kanban de demandas ("cards") por área (Produto, Design,
  Inovação), com cronômetro, anexos e checklist de "embarque".

A peça central é a tabela **`item`**, polimórfica: um único registro representa
tanto uma tarefa de vida, quanto um ritual recorrente, quanto um card de
trabalho. O tipo é discriminado por dois campos: `environment` (vida/trabalho) e
`primitive` (task/ritual/card). Em volta dela orbitam tabelas satélite
(domínios, áreas, log de eventos, tempo, anexos, conquistas).

Toda tabela tem **RLS habilitado** e é escopada por `user_id` (default
`auth.uid()`), ainda que hoje seja um sistema de usuário único.

## Diagrama de relacionamentos

```
auth.users
   │
   │ user_id (em todas as tabelas)
   ▼
domain ──┐                         work_area
  │ id   │                            │ id
  │      │                            │
  │      ├──< item >──────────────────┤
  │      │     │ id                   (work_area_id, p/ trabalho)
  │      │     │
  │      │     ├──< time_entry        (item_id)
  │      │     ├──< attachment        (item_id)
  │      │     ├──< embarque          (item_id)  -- checklist do card
  │      │     └──< event             (item_id, domain_id)
  │      │
  │      ├──< presence_moment         (domain_id)
  │      ├──< event                   (domain_id)
  │      ├──< achievement_def         (domain_id, opcional)
  │      └──< domain_state            (1:1 por domínio)
  │
achievement_def ──< achievement_earned >── event (trigger_event_id)

app_state   -- 1 linha por usuário (settings jsonb)
```

## Tabelas

### `item` — entidade central (polimórfica)

Representa qualquer "coisa a fazer / feita". 85 linhas hoje.

| coluna | tipo | notas |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | uuid | FK `auth.users`, default `auth.uid()` |
| `environment` | text | **CHECK** `'vida' | 'trabalho'` |
| `primitive` | text | **CHECK** `'task' | 'ritual' | 'project' | 'presence' | 'card'` |
| `domain_id` | uuid? | FK `domain` (usado na vida) |
| `work_area_id` | uuid? | FK `work_area` (usado no trabalho) |
| `legacy_id` | text? | código amigável do card (ex.: `PROD-44`); base da URL `/trabalho/[code]` |
| `title` | text | |
| `notes` | text? | contexto/observações |
| `status` | text? | **sem CHECK** — ver convenções abaixo |
| `flag` | text? | (sem uso hoje) |
| `config` | jsonb | default `{}` — guarda categoria, cadência, agendamento, `fazer_hoje` |
| `due_at` | timestamptz? | prazo (vida "do dia") |
| `completed_at` | timestamptz? | quando concluído |
| `created_at` | timestamptz | default `now()` |
| `sort` | int | ordenação manual (default 0) |
| `origem` | text? | de onde veio a demanda |
| `blocked` | bool? | card travado |
| `block_reason` | text? | tipo do bloqueio |
| `block_note` | text? | nota do bloqueio |
| `timer_started_at` | timestamptz? | cronômetro rodando (trabalho) |

**Mapa primitive × environment (uso real):**

| environment | primitive | significado |
|---|---|---|
| vida | task | tarefa pessoal (do dia / quando der / geral) |
| vida | ritual | recorrente — status é irrelevante, rastreado por `event` |
| trabalho | card | demanda no kanban |

> `primitive` aceita `'project'` e `'presence'` pelo CHECK, mas esses valores
> não são gerados em lugar nenhum do código atual.

### `domain` — domínios da vida (7 linhas)

`id`, `user_id`, `slug` (único na prática, base da URL), `name`, `kind`
(**CHECK** `'maestria' | 'presenca'`), `active` (default true), `sort`,
`created_at`. Semente fixa em `app/actions.js` → `DOMAINS`.

### `work_area` — áreas de trabalho (3 linhas)

`id`, `user_id`, `code` (ex.: `PROD`), `name`. Semente em `WORK_AREAS`. O `code`
prefixa o `legacy_id` sequencial dos cards (`PROD-1`, `PROD-2`…).

### `event` — log de eventos (append-only, 69 linhas)

Trilha imutável de tudo que acontece. `id` (bigint identity), `user_id`,
`occurred_at`, `domain_id?`, `item_id?`, `type` (text), `payload` (jsonb).

Tipos em uso: `card_moved`, `ritual_done`, `ritual_skipped`, `item_completed`,
`item_blocked`, `item_unblocked`, `moment`. É a fonte da verdade para:
- **rituais**: `ritual_done`/`ritual_skipped` com `payload.period` (a chave do
  ciclo — ver `app/life.js`). Marcar/desmarcar = inserir/deletar evento.
- **streaks** (`getStreaks`): combina `ritual_done` + itens de vida concluídos +
  `presence_moment` + cards concluídos, agrupados por dia (fuso BRT).

### `time_entry` — apontamentos de tempo (8 linhas)

`id`, `user_id`, `item_id` (FK), `seconds`, `note?`, `occurred_at`. Gerado ao
parar o cronômetro (≥ 60s) ou via `addTime` manual.

### `embarque` — checklist do card (1 linha)

Subitens de um card de trabalho. `id`, `user_id`, `item_id` (FK), `title`,
`done`, `sort`, `created_at`, `completed_at?`.

### `attachment` — anexos (0 linhas)

`id`, `user_id`, `item_id` (FK), `kind` (`image`/`link`/`md`/`text`),
`filename`, `mime?`, `size?`, `path`, `created_at`. Arquivos físicos no bucket
de storage **`attachments`** (plural — não confundir com a tabela singular);
`kind='link'` guarda a URL direto em `path`.

### `presence_moment` — momentos de presença (0 linhas)

Registro leve de "estive presente" num domínio (sem tarefa). `id`, `user_id`,
`domain_id?`, `occurred_at`, `note?`. Conta para streak.

### `achievement_def` / `achievement_earned` — conquistas

- **`achievement_def`** (33 linhas): catálogo. `key`, `domain_id?`, `tier`
  (**CHECK** `primeira|marco|descoberta|combo|retorno|profundidade`), `kicker`,
  `title_template`/`desc_template` (com placeholder `{domain}`), `rarity`,
  `hidden`, `rule` (jsonb), `reveal` (jsonb), `granted_by` (**CHECK**
  `rule|claude`), `category`, `icon`, `collection`, `seq`, `target`, `trail`.
- **`achievement_earned`** (2 linhas): conquistas obtidas. `def_id` (FK),
  `earned_at`, `trigger_event_id?` (FK `event`), `context` (jsonb, ex.:
  `{domain: slug}`), `revealed`.

A lógica de premiação vive em `completeItem()` (`app/actions.js`).

### `domain_state` — estado/momentum por domínio (0 linhas)

1:1 com `domain` (PK = `domain_id`). `momentum` (numeric), `last_active_at`,
`arc_status` (**CHECK** `active|cooling|reconstrucao|liminar`), `updated_at`.
Reservado para a camada de "inteligência" (G5) — ainda não populado.

### `app_state` — preferências do usuário (0 linhas)

PK `user_id`, `settings` (jsonb), `updated_at`.

## Convenções importantes do modelo

Coisas que **não** estão no esquema mas o código assume:

1. **`status`** carrega o fluxo do kanban: `backlog → aguardando → fazendo →
   concluido` (ver `LIFE_COLS` em `app/life.js`). É um campo livre, sem CHECK.
2. **Vocabulário duplo de conclusão**: o fluxo de kanban/vida grava
   `'concluido'`, mas a função legada `completeItem()` grava `'done'` e emite
   evento `item_completed`. Por isso as leituras checam `('done','concluido')`
   (ex.: `getStreaks`, `dashboard/page.js`). Hoje os dados usam só `'concluido'`.
3. **Rituais ignoram `status`** — 8 rituais têm `status = NULL`. O "feito no
   ciclo" deles vem de `event` (`ritual_done` + `payload.period`), não da coluna.
4. **`config` (jsonb) do item** é o coração do dia a dia da vida:
   - `config.type`: `do_dia` | `quando_der` | `geral` (tarefas)
   - `config.cadence`: `diaria | cada3dias | semanal | quinzenal | mensal | trimestral | semestral | anual` (rituais)
   - `config.weekday`, `config.time`, `config.anchor`: agendamento de recorrentes
   - `config.fazer_hoje`: rótulo "fazer hoje"
   - `config.life_kind`: campo legado (`agenda`/`solta`) com fallback em `catOf()`
5. **Datas só-dia** (`due_at`) são salvas ao **meio-dia UTC** para não recuar de
   dia no fuso BRT (`dueToIso` em `actions.js`).
6. **`periodKey`** (`life.js`) deriva a "chave do ciclo" de uma cadência — é o
   que liga um `ritual_done` ao período em que foi feito.
7. **`legacy_id`** dos cards é sequencial por área, gerado no app (não no banco):
   `max(sufixo numérico) + 1`.

## Notas / pontos de atenção (sem ação aplicada)

Levantados no estudo, deixados aqui como registro:

- **Consistência de status** (`done` vs `concluido`): dois vocabulários para o
  mesmo conceito, compensado nas leituras. Sem CHECK no campo.
- **`item.flag`**: coluna sem uso (0 preenchimentos, 0 referências no código).
- **`primitive`**: o CHECK permite `project`/`presence`, valores nunca gerados.
- **Performance** (advisors do Supabase): 14 foreign keys sem índice de cobertura
  e 13 políticas RLS chamando `auth.uid()` por linha (recomendado
  `(select auth.uid())`).
- **Segurança** (advisor): proteção contra senhas vazadas (HaveIBeenPwned)
  desativada no Auth.
- **Tabelas reservadas**: `domain_state` e `app_state` existem mas estão vazias
  (camada G5 / preferências, ainda não usadas).

Integridade referencial dos dados está limpa: nenhum item de vida sem domínio,
nenhum card de trabalho sem área.
