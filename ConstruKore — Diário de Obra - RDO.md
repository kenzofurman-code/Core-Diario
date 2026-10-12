# ConstruKore — Diário de Obra / RDO
## Especificação Funcional e Técnica v0.2 — Core Compliant

**Status:** Draft consolidado para implementação  
**Módulo:** `diario`  
**Origem:** evolução do KoreDiario  
**Produto:** ConstruKore  
**Stack alvo:** React 19 + TypeScript strict + Vite + Tailwind + Supabase/PostgreSQL 16  
**Arquitetura inicial:** monólito modular, respeitando limites de domínio

---

# 0. Objetivo desta versão

Esta v0.2 consolida:

- o plano original do KoreDiario;
- a arquitetura atual Core Compliant do ConstruKore;
- a integração com Planejamento;
- a integração com Qualidade/KoreGRC;
- a integração com Suprimentos;
- preparação para BIM/IFC;
- preparação para Financeiro/Forecast;
- operação mobile/offline;
- WhatsApp;
- IA;
- diário de empreiteiros;
- versionamento e assinatura;
- as decisões Q1–Q53 definidas com o proprietário do produto.

O módulo deixa de ser concebido como um aplicativo independente de RDO.

Ele passa a ser parte do sistema operacional do ConstruKore.

---

# 1. Tese do módulo

O objetivo do Diário não é preencher um PDF.

O objetivo é manter uma representação auditável do que aconteceu na obra.

Fluxo:

```text
OBRA ACONTECE
      ↓
FATOS SÃO CAPTURADOS
      ↓
FATOS RECEBEM CONTEXTO
      ↓
FATOS SÃO CONFIRMADOS / CONCILIADOS
      ↓
MÓDULOS DE ORIGEM SÃO ATUALIZADOS QUANDO APLICÁVEL
      ↓
BASE OPERACIONAL DO DIA
      ↓
RDO
      ↓
REVISÃO
      ↓
APROVAÇÃO
      ↓
SNAPSHOT
      ↓
PDF / ASSINATURA / EMISSÃO
```

O princípio do KoreDiario original permanece:

> captura primeiro, formulário depois.

A estrutura original já previa um RDO composto por clima, efetivo, atividades, equipamentos, materiais, ocorrências, segurança, qualidade, visitas, fotos, observações e assinaturas.

---

# 2. Princípio mais importante — uma fonte de verdade por domínio

O Diário não pode virar uma segunda base de:

- Planejamento;
- Suprimentos;
- Qualidade;
- Financeiro;
- BIM;
- Gestão de Pessoas.

## Fonte oficial

| Informação | Módulo proprietário |
|---|---|
| Tenant | Core |
| Empresa | Core |
| Obra | Core |
| Usuários | IAM/Core |
| Empresas externas | Core Parties |
| Fornecedores | Core Parties / Suprimentos |
| Empreiteiros | Core Parties |
| Localizações | Core |
| WBS | Core / Planejamento |
| Tarefa | Planejamento |
| Progresso oficial | Planejamento |
| Curto prazo | Planejamento |
| Orçamento | Orçamento |
| Solicitação de compra | Suprimentos |
| Cotação | Suprimentos |
| Pedido/contrato | Suprimentos |
| Recebimento oficial | Suprimentos |
| Estoque | Suprimentos |
| FVS/FVM | Qualidade |
| RNC | Qualidade |
| Arquivos | Core |
| Ações/Pendências | Core transversal |
| Registro do fato diário | Diário |
| RDO | Diário |

Essa separação segue o padrão já consolidado no KoreGRC: projeto, localização, WBS, partes e arquivos são entidades compartilhadas do Core, enquanto cada módulo mantém seu estado oficial de negócio.

---

# 3. Invariantes Core Compliant

Toda tabela tenant-scoped do Diário deve:

```text
id uuid
tenant_id uuid
status core.record_status
created_at timestamptz
updated_at timestamptz
```

E obrigatoriamente:

- possuir RLS desde sua migration;
- utilizar os helpers Core existentes;
- possuir índices tenant-aware;
- referenciar Core por FK;
- separar `status` técnico de workflow;
- ser protegida também no backend/API.

Entidades compartilhadas que NÃO serão recriadas:

```text
core.tenants
core.projects
core.locations
core.wbs_nodes
core.parties
core.files
core.attachments
core.modules
core.screens

iam.permissions
```

O padrão Core atual já exige RLS, UUID, `core.record_status`, `core.set_updated_at()`, IAM por permissões e uso do Core para arquivos e entidades compartilhadas.

Componentes React também não acessam Supabase diretamente; o acesso deve passar pela camada de serviços.

---

# 4. Arquitetura funcional do ecossistema

```text
                         CORE
 ┌────────────────────────────────────────────────┐
 │ tenant                                         │
 │ project                                        │
 │ locations                                      │
 │ WBS                                            │
 │ parties                                        │
 │ files / attachments                            │
 │ IAM                                            │
 │ actions / pendencies                           │
 │ signature infrastructure                       │
 └────────────────────────────────────────────────┘
                 ↑            ↑
                 │            │
      ┌──────────┘            └──────────┐
      ↓                                  ↓
PLANEJAMENTO                         QUALIDADE
tarefas                              FVS/FVM
microserviços                        RNC
curto prazo                          inspeções
progresso                              │
      │                                │
      └──────────────┬─────────────────┘
                     ↓
                 ┌───────┐
                 │DIÁRIO │
                 └───────┘
                   ↑   ↑
                   │   │
          SUPRIMENTOS   SST
                   │
                   ↓
              BIM / IFC
                   │
                   ↓
          FINANCEIRO / FORECAST
```

---

# 5. Conceito central — `source_event`

O `source_event` é a porta de entrada do módulo.

Tudo que chega ao Diário pode inicialmente ser representado como um evento.

## `diary.source_events`

Campos mínimos:

```text
id
tenant_id
project_id

source_type
external_event_id

occurred_at
received_at
recorded_at

author_user_id
source_party_id

raw_text

location_id
wbs_node_id
schedule_task_id

review_state
confidence

status
created_at
updated_at
```

## Tipos iniciais

```text
MANUAL_TEXT
MANUAL_AUDIO
MANUAL_IMAGE

PWA_TEXT
PWA_AUDIO
PWA_IMAGE

WHATSAPP_TEXT
WHATSAPP_AUDIO
WHATSAPP_IMAGE
WHATSAPP_DOCUMENT

PLANNING_EVENT
QUALITY_EVENT
PROCUREMENT_EVENT
SAFETY_EVENT
WEATHER_EVENT

EXTERNAL_API
```

O projeto original já tratava `source_events` como tabela central de entrada das diferentes fontes.

---

# 6. Horários

Todo evento diferencia:

```text
occurred_at
```

momento em que o fato aconteceu;

de:

```text
recorded_at / received_at
```

momento em que chegou ao ConstruKore.

Exemplo:

```text
15:00 concretagem finalizada
18:12 engenheiro registrou
```

Essa diferença nunca deve ser perdida.

---

# 7. Pipeline de processamento

```text
source_event
      ↓
validação
      ↓
idempotência
      ↓
deduplicação
      ↓
identificação da obra
      ↓
armazenamento da mídia
      ↓
transcrição
      ↓
extração
      ↓
classificação
      ↓
sugestão de localização
      ↓
sugestão de WBS/tarefa
      ↓
sugestão de parte/equipe
      ↓
confidence
      ↓
conflito?
      │
   sim│      não
      ↓       ↓
 revisão   regra de confiança
      └───────┬─────────
              ↓
       registro operacional
```

---

# 8. Um evento pode gerar vários fatos

Exemplo:

```text
"Executamos 85 m² de alvenaria no Pav. 8.
Às 15h faltou bloco."
```

Pode gerar:

```text
production_entry
quantity = 85
uom = m²
```

e:

```text
operational_occurrence
category = material
```

O vínculo com o evento original permanece nos dois.

---

# 9. Confiança e hierarquia de fontes

A consolidação poderá considerar:

- origem;
- empreiteiro;
- usuário;
- tipo de dado;
- atividade;
- material;
- precisão histórica;
- confirmação humana.

Exemplo:

```text
engenheiro        95 m²
empreiteiro      100 m²
visão computacional 97 m²
```

Não existe regra universal de “último ganha”.

## `diary.source_trust_rules`

Conceitualmente:

```text
project_id
source_type
party_id nullable
data_type
wbs_node_id nullable

priority
auto_accept_allowed
tolerance_type
tolerance_value
requires_review

effective_from
effective_to
```

Defaults devem ser simples.

Configuração avançada só aparece quando necessária.

---

# 10. Conflitos

Um conflito não apaga valores.

Exemplo:

```text
Empreiteiro: 120 m²
Engenheiro:   95 m²
```

O sistema preserva ambos.

A resolução gera um terceiro estado:

```text
valor consolidado = 95 m²
decidido por = user_id
motivo = ...
```

---

# 11. Tolerâncias

Tolerância pode variar por:

```text
tipo de dado
atividade
microserviço
material
fonte
obra
```

Exemplos:

```text
produção       ±3%
efetivo        ±1 pessoa
concreto       ±1 m³
aço            ±2%
```

A tolerância jamais elimina a informação original.

---

# 12. Caixa de Entrada

A Caixa de Entrada existe para resolver exceções.

Estados:

```text
pending_review
confirmed
incomplete
conflict
duplicate
unmatched_project
unmatched_location
unmatched_activity
discarded
```

A UX deve privilegiar:

```text
PRECISA DE DECISÃO
7

Conflitos                    2
Sem atividade                2
Baixa confiança              1
Duplicidade provável         1
Sem localização              1
```

Não obrigar o engenheiro a revisar dezenas de eventos já confiáveis.

---

# 13. Dia operacional

## `diary.reporting_days`

```text
id
tenant_id
project_id

report_date
shift_id nullable

workflow_state

responsible_user_id

completion_percentage
data_quality_score

opened_at
closed_at

status
timestamps
```

## Regra padrão

```text
1 obra
+
1 dia
=
1 reporting_day
```

Mas a arquitetura aceita turno opcional:

```text
Diurno
Noturno
Turno B
24h
```

A UI inicial trabalha com dia único.

---

# 14. Timezone

Cada obra possui timezone.

Banco:

```text
UTC / timestamptz
```

Determinação do dia:

```text
timezone da obra
```

Nunca assumir timezone do navegador como fonte oficial para definir o `report_date`.

---

# 15. Produção diária

O Diário guarda o fato diário.

Ele não é dono do progresso acumulado oficial.

## `diary.production_entries`

```text
id
tenant_id
project_id
reporting_day_id

schedule_task_id nullable
wbs_node_id
location_id

quantity
uom_code

reported_progress_delta nullable

source_event_id nullable
source_party_id nullable

confirmation_state
confirmed_by
confirmed_at

planning_sync_state

notes

status
timestamps
```

---

# 16. Granularidade da produção — B/C adaptativa

A unidade preferencial é:

```text
microserviço + localização
```

quando existir.

Fallback:

```text
atividade + localização
```

Exemplo:

```text
ALVENARIA / PAV 08
```

pode possuir:

```text
Marcação / Pav 08
Elevação / Pav 08
Vergas / Pav 08
Encunhamento / Pav 08
```

Não obrigar microserviços onde o Planejamento não os utiliza.

---

# 17. Integração Produção → Planejamento

Comportamento configurável.

## Modos

```text
DIRECT
```

produção confirmada atualiza Planejamento;

```text
REVIEW_REQUIRED
```

gera sugestão/medição pendente;

```text
CONFIGURED_BY_ACTIVITY
```

regra varia por atividade.

Default inicial:

```text
REVIEW_REQUIRED
```

O Planejamento existente já foi concebido com longo prazo → médio prazo → curto prazo → medição → retroalimentação → compras/financeiro.

---

# 18. Hoje — Planejamento incorporado

A tela Hoje carrega atividades previstas.

Exemplo:

```text
ALVENARIA
Torre A / Pav. 08

Previsto hoje        120 m²
Apontado               85 m²
Desvio                 -35 m²

[ Produção ]
[ Foto ]
[ Ocorrência ]
[ Justificar ]
```

Uma tarefa do Planejamento já possui vínculo com localização e WBS, permitindo esse cruzamento.

---

# 19. Atividade prevista sem apontamento

Jamais interpretar ausência como zero.

Se a atividade estava prevista e não possui apontamento:

```text
SEM INFORMAÇÃO
```

A UI pode gerar:

```text
Solicitar informação
Registrar 0 executado
Marcar não aplicável
Informar produção
```

---

# 20. Regras derivadas da atividade

Uma atividade/WBS/microserviço pode configurar exigências herdáveis.

Exemplo:

```text
CONCRETAGEM
├── produção obrigatória
├── foto obrigatória
├── efetivo obrigatório
├── FVS aplicável
├── controle tecnológico
└── justificativa obrigatória se desvio > X
```

Herança:

```text
Família
  ↓
Pacote
  ↓
Atividade
  ↓
Microserviço
```

Override somente quando necessário.

---

# 21. Efetivo

O Diário suporta:

- agregado;
- individual quando houver integração.

## `diary.workforce_snapshots`

```text
id
tenant_id
project_id
reporting_day_id
source_event_id
captured_at
```

## `diary.workforce_entries`

```text
snapshot_id

party_id
role_code
quantity

location_id nullable
schedule_task_id nullable

source_type
confirmation_state
```

UI principal:

```text
Empreiteira ABC

Pedreiro      8
Servente      5
Encarregado   1
----------------
Total        14
```

Se houver controle individual:

```text
14 pessoas
```

com drill-down opcional.

O RDO continua consolidado.

---

# 22. Diário de empreiteiro

Cada empreiteiro poderá possuir seu próprio diário operacional.

## Conceito

```text
Empreiteiro XYZ
03/09/2026

Efetivo
Produção
Ocorrências
Fotos
Observações
```

O diário do empreiteiro não substitui o RDO da construtora.

Ele é uma fonte estruturada.

---

# 23. Confiança no diário do empreiteiro

Regras configuráveis por:

```text
empreiteiro
tipo de informação
atividade
obra
```

Exemplo:

```text
Fotos              auto-aceitar
Efetivo            auto-aceitar
Produção           revisão
Ocorrência crítica revisão
```

Todos os registros guardam:

```text
source_party_id
```

---

# 24. Solicitação de informação

## `diary.information_requests`

Serve para:

> “Confirme a produção do Pav. 8 e envie uma foto.”

Campos:

```text
id
tenant_id
project_id
reporting_day_id

schedule_task_id nullable
location_id nullable
wbs_node_id nullable

requested_from_party_id
requested_from_user_id nullable

request_type
request_text

requested_at
due_at

request_state

blocking_rule

status
timestamps
```

Workflow:

```text
REQUESTED
   ↓
ANSWERED
   ↓
REVIEWED
   ↓
CLOSED
```

---

# 25. Escalonamento de solicitações

Regras configuráveis.

Exemplo:

```text
16:00 solicitação
16:30 lembrete
17:00 responsável
17:30 engenheiro
18:00 bloquear fechamento
```

Encerrar automações assim que houver resposta válida.

---

# 26. Resposta à solicitação

Resposta:

```text
"Executamos 92 m². Segue foto."
```

Fluxo:

```text
WhatsApp/app
     ↓
source_event
     ↓
information_request
     ↓
extração
     ↓
production_entry sugerido
     +
attachment sugerido
     ↓
regra de confiança
```

Não obrigar redigitação.

---

# 27. Ações/Pendências compartilhadas

Solicitação de informação não é a mesma coisa que uma ação operacional.

Portanto:

```text
information_request
```

é entidade própria.

Quando necessário:

```text
information_request
       ↓
core.action
```

Exemplo:

```text
"Enviar foto"
```

é solicitação de informação.

```text
"Comprar 10 pallets até amanhã"
```

é ação.

---

# 28. Ocorrências

## `diary.operational_occurrences`

```text
id
tenant_id
project_id

opened_on_reporting_day_id

code
title
description

category
severity

location_id nullable
wbs_node_id nullable
schedule_task_id nullable

responsible_party_id nullable

occurred_at
due_at nullable

impact_type
impact_description

workflow_state

resolved_at nullable
validated_at nullable
closed_at nullable

source_event_id nullable

status
timestamps
```

---

# 29. Categorias

```text
planning
production
workforce
material
equipment
design
quality
safety
weather
supplier
contractor
client
external_interference
other
```

---

# 30. Ocorrência não é RNC

Regra obrigatória:

```text
diary.operational_occurrence
≠
quality.non_conformity
```

Fluxo possível:

```text
Ocorrência
   ↓
Encaminhar para Qualidade
   ↓
RNC
```

A decisão pode ser humana ou seguir workflow configurado.

Nunca criar RNC só porque:

```text
category = quality
```

---

# 31. Ocorrência atravessando dias

Uma ocorrência pode permanecer aberta.

Exemplo:

```text
01/09 falta de bloco — OPEN
02/09 continua impactando
03/09 material chegou
03/09 CLOSED
```

Não criar uma ocorrência nova por dia.

Novo fato/ciclo pode gerar nova ocorrência.

---

# 32. Fatos do dia × pendências

O RDO deve separar:

## Fatos do dia

Eventos cujo:

```text
occurred_at
```

pertence ao período do RDO.

## Pendências relevantes

Registros anteriores ainda relevantes:

```text
ocorrências
ações
RNCs
restrições
information_requests
```

Nunca apresentar uma pendência antiga como se tivesse ocorrido novamente.

---

# 33. Pendências trazidas ao próximo dia

Uma pendência aparece automaticamente no próximo dia quando relevante.

Critérios podem considerar:

```text
estado aberto
prazo
atividade
localização
impacto
responsável
severidade
```

O usuário pode:

```text
remover deste RDO
```

sem:

```text
fechar ocorrência
```

---

# 34. Fechamento de ocorrência

Configuração por categoria/severidade.

Possível fluxo:

```text
OPEN
 ↓
IN_TREATMENT
 ↓
RESOLVED_PENDING_VALIDATION
 ↓
CLOSED
```

Casos simples podem permitir:

```text
OPEN → CLOSED
```

---

# 35. Suprimentos

Recebimento oficial continua no módulo de Suprimentos.

Fluxo:

```text
purchase_order
      ↓
receipt
      ↓
Diário referencia
```

O RDO pode mostrar:

```text
Blocos cerâmicos
8.000 un
Fornecedor XYZ
NF 12345
09:43
```

Sem criar outro recebimento oficial.

---

# 36. Observação de material

Se alguém informar:

> “Chegaram 8 pallets de bloco.”

isso pode gerar:

```text
material_observation
```

Se existir recebimento correspondente:

```text
link receipt
```

Se não existir:

```text
sugerir conferência no Suprimentos
```

Nunca alterar estoque por IA ou inferência.

---

# 37. Falta de material

Exemplo:

```text
"Faltou argamassa às 14h."
```

gera:

```text
operational_occurrence
```

e opcionalmente:

```text
[ Abrir no Suprimentos ]
```

O registro de Suprimentos herda:

- obra;
- atividade;
- localização;
- evidências;
- evento de origem.

A arquitetura de Suprimentos já prevê preservar a origem da demanda desde obra/orçamento/atividade até o consumo.

---

# 38. Qualidade

O Diário consome:

```text
quality.fvs.completed
quality.fvs.rejected
quality.rnc.created
quality.rnc.closed
quality.fvm.rejected
```

Exemplo na timeline:

```text
11:32
FVS 037 aprovada
Alvenaria
Pav. 08
```

O KoreGRC já foi desenhado para conectar Planejamento, execução, inspeção, evidência e RNC.

---

# 39. SST

Mesmo princípio.

O Diário pode mostrar:

- DDS;
- treinamentos;
- inspeções;
- incidentes;
- quase acidentes;
- paralisações;
- observações.

Mas SST continua dono das entidades especializadas.

---

# 40. Clima

## `diary.weather_records`

```text
reporting_day_id

recorded_at

source_type
temperature
condition
rainfall
wind
humidity

impact_on_work

source_event_id nullable
```

Fontes:

```text
API
FIELD_OBSERVATION
MANUAL
```

Conflito:

```text
API: sem chuva
Campo: chuva 14:10–14:45
```

Preservar ambos.

Para narrativa do RDO, fato observado em campo pode prevalecer quando relevante.

---

# 41. Visitas

## `diary.site_visits`

```text
id
tenant_id
project_id
reporting_day_id

party_id
visitor_person_id nullable

purpose
host_user_id

entered_at
left_at

notes

source_type
status
```

Pode vir de:

```text
manual
portaria
controle de acesso
```

---

# 42. Equipamentos

Enquanto não houver domínio corporativo de equipamentos:

## `diary.equipment_entries`

```text
equipment_reference
reporting_day_id
location_id nullable

worked_hours
downtime_minutes
condition
stoppage_reason
```

Quando o módulo de Equipamentos existir, migrar a fonte oficial para ele.

---

# 43. Arquivos

Nunca criar infraestrutura paralela.

Usar:

```text
core.files
core.attachments
```

Um único arquivo pode estar vinculado a:

```text
source_event
production_entry
occurrence
schedule_task
location
RNC
report_section
```

sem duplicar o blob.

O padrão Core já determina que evidências usem `core.files/core.attachments`.

---

# 44. Fotos obrigatórias

Regras configuráveis por template/obra.

Exemplos:

```text
mínimo 5 fotos/dia
```

ou:

```text
1 foto por atividade crítica
```

ou:

```text
2 fotos por concretagem
```

ou:

```text
nenhuma obrigatoriedade
```

---

# 45. Offline — MVP1

Offline é requisito do primeiro MVP de campo.

Suportar:

- foto;
- áudio;
- texto;
- produção;
- ocorrência;
- efetivo rápido.

Estratégia:

```text
IndexedDB
UUID client-side
sync queue
retry
background upload
conflict detection
```

O padrão offline já usado no KoreGRC prevê IDs client-side, fila de sincronização e reconciliação no servidor.

---

# 46. Conflito offline

Nunca:

```text
offline antigo
↓
sobrescreve servidor
```

Fluxo:

```text
versão offline
+
versão servidor
      ↓
conflito
      ↓
revisão
```

Registro finalizado no servidor não é sobrescrito silenciosamente.

---

# 47. WhatsApp

O Diário não conhece diretamente a infraestrutura específica do fornecedor.

Arquitetura:

```text
WhatsApp
   ↓
Provider
   ↓
n8n / Integration Gateway
   ↓
evento normalizado
   ↓
Diário
```

---

# 48. Roteamento WhatsApp

Suportar:

- grupo da obra;
- conversa direta com bot;
- número/canal dedicado;
- combinações.

A resolução da obra pode usar:

```text
channel
group
contact
active project context
secure link
explicit selection
```

Se ambíguo:

```text
unmatched_project
```

Nunca inventar a obra.

---

# 49. IA

IA pode:

```text
transcrever
classificar
estruturar
sugerir vínculos
detectar conflito
detectar duplicidade
resumir
```

IA não pode:

```text
confirmar produção
fechar ocorrência crítica
emitir RDO
aprovar RDO
movimentar estoque
criar valor financeiro
```

---

# 50. Registro de IA

## `diary.ai_runs`

ou infraestrutura transversal equivalente:

```text
model
prompt_version
input_reference
output
confidence
duration
cost
error
created_at
```

Toda conclusão automatizada relevante deve ser auditável.

---

# 51. Resumo executivo por IA

Só fatos confirmados podem alimentar o resumo.

Fluxo:

```text
confirmed facts
      ↓
AI draft
      ↓
human review
      ↓
accepted text
      ↓
RDO
```

Texto da IA nunca entra automaticamente no documento oficial.

---

# 52. Fato confirmado pode ser corrigido

Antes da emissão:

```text
85 m²
↓
corrigido
92 m²
```

é permitido.

Mas preservar:

```text
valor anterior
valor novo
quem alterou
quando
motivo
```

Depois da emissão:

```text
não editar
```

---

# 53. Tela Hoje

Visão principal:

```text
TIMELINE CRONOLÓGICA
```

com:

- filtros;
- cards;
- pendências;
- ações rápidas.

Exemplo:

```text
QOYA
03 SET 2026

RDO 184                  76%
COLETANDO

PREVISTO
3 atividades sem apontamento

PENDÊNCIAS
7 precisam de decisão

────────────────────────────

07:02  Efetivo confirmado

08:15  Início alvenaria
       Pav. 08

09:43  Recebimento de blocos

11:32  FVS aprovada

14:10  Chuva iniciada

15:05  Falta de material
       Ocorrência #184

16:40  Produção atualizada
       85 m²
```

Filtros:

```text
Todos
Produção
Ocorrências
Clima
Materiais
Qualidade
Efetivo
Visitas
Fotos
```

---

# 54. Captura rápida

Mobile:

```text
[ 🎙 Áudio ]

[ 📷 Foto ]

[ ✏ Texto ]

[ ✓ Produção ]

[ 👷 Efetivo ]

[ ⚠ Ocorrência ]
```

A captura deve levar segundos.

Detalhamento pode vir depois.

---

# 55. RDO

## `diary.daily_reports`

```text
id
tenant_id
project_id
reporting_day_id

report_number
workflow_state

template_version_id

current_version_id

responsible_user_id

submitted_at
approved_at
issued_at

status
timestamps
```

---

# 56. Estados do RDO

```text
COLLECTING
DRAFT_GENERATED
IN_REVIEW
AWAITING_INFORMATION
AWAITING_APPROVAL
RETURNED
APPROVED
ISSUED
SUPERSEDED
CANCELLED
```

---

# 57. Fechamento do dia

Regras configuráveis por template.

## Bloqueantes possíveis

```text
seção obrigatória vazia
assinatura obrigatória
atividade crítica sem informação
solicitação obrigatória não respondida
responsável ausente
```

## Apenas alerta

```text
foto sem legenda
atividade secundária sem apontamento
evento baixa confiança
```

---

# 58. Evento tardio

Se um fato de terça chega na quarta:

```text
late_event = true
occurred_at = terça
received_at = quarta
```

O usuário decide:

```text
manter fora do RDO
adicionar complemento
retificar
```

RDO emitido nunca se altera sozinho.

---

# 59. Seções do RDO

Base:

1. identificação;
2. clima;
3. efetivo;
4. produção;
5. equipamentos;
6. materiais;
7. ocorrências;
8. segurança;
9. qualidade;
10. visitas;
11. fotos;
12. observações;
13. assinaturas.

---

# 60. Seções condicionais

Template pode definir:

```text
equipamento obrigatório se equipment_count > 0
```

ou:

```text
chuva exige impacto se rainfall > X
```

ou:

```text
qualidade obrigatória se atividade exigir FVS
```

O motor de completude deve ser determinístico.

IA não decide se o RDO está completo.

---

# 61. Templates

## `diary.report_templates`

```text
id
tenant_id
name
scope
status
```

## `diary.report_template_versions`

```text
template_id
version_number

sections
requirements
photo_rules
blocking_rules
approval_workflow_id

published_at
published_by
```

Versão publicada:

```text
imutável
```

---

# 62. Numeração

Configurável por obra/template.

Exemplos:

```text
RDO 00184
```

```text
QOYA-RDO-0184
```

```text
2026-QYA-184
```

Default:

```text
sequencial por obra
```

---

# 63. Aprovação

Workflow configurável.

Exemplos:

```text
Engenheiro
→ Gerente
```

ou:

```text
Engenheiro
→ Coordenador
→ Fiscal
→ Cliente
```

---

# 64. Assinatura

Suportar:

## Aprovação autenticada interna

```text
user_id
timestamp
hash
```

## Assinatura eletrônica formal

Quando contrato/processo exigir.

A infraestrutura de assinatura deve ser transversal ao ConstruKore.

Não específica do Diário.

---

# 65. Snapshot

Ao emitir:

```text
todas as informações relevantes
      ↓
snapshot JSON
      ↓
hash
      ↓
PDF
```

## `diary.report_versions`

```text
id
tenant_id
daily_report_id

version_number
parent_version_id

reason

snapshot_json
template_version_id

pdf_file_id
document_hash

created_by
created_at
```

---

# 66. Imutabilidade

RDO emitido:

```text
ISSUED
```

nunca é editado.

Correção:

```text
RDO 184 v1
      ↓
RETIFICAÇÃO
      ↓
RDO 184 v2
```

A versão anterior permanece acessível.

---

# 67. PDF

O PDF é um produto do snapshot.

Nunca consultar dados “ao vivo” para reconstruir uma versão antiga.

Fluxo:

```text
report_version.snapshot_json
        ↓
renderer
        ↓
PDF
        ↓
core.files
```

---

# 68. Planejamento x RDO

O RDO deve conseguir mostrar:

```text
Previsto
Executado
Desvio
Motivo
```

mas o Planejamento continua responsável por:

```text
progress
schedule
dependencies
baseline
forecast
```

---

# 69. BIM / IFC

Estrutura espacial oficial:

```text
core.locations
```

IFC acrescenta elementos.

```text
core.location
     ↓
BIM spatial mapping
     ↓
IFC elements
```

Planejamento:

```text
schedule_task
      ↓
location
```

Diário:

```text
production
      ↓
schedule_task
      ↓
location
      ↓
IFC elements
```

---

# 70. BIM não é obrigatório

Uma obra sem modelo IFC deve operar 100%.

O BIM é enriquecimento.

Não dependência.

---

# 71. Financeiro / Forecast

O Diário fornece sinais operacionais.

Exemplo:

```text
produção confirmada
      ↓
Planejamento atualizado
      ↓
medição prevista
      ↓
contrato
      ↓
condição de pagamento
      ↓
forecast financeiro
```

Nunca:

```text
produção
→ conta a pagar direta
```

O princípio usado no módulo financeiro é justamente que regras vivem em seus domínios de origem e o fluxo consolida os resultados.

---

# 72. Indicadores

## Diário

```text
prazo de emissão
completude
tempo de revisão
fatos por dia
ocorrências
eventos sem vínculo
eventos tardios
```

## Coleta

```text
tempo fato → registro
tempo solicitação → resposta
fontes utilizadas
participação dos informantes
```

## IA

```text
auto-classificação aceita
correções humanas
baixa confiança
duplicidades
```

## Planejamento

```text
previsto x apontado
atividades sem informação
motivos de não execução
produção por equipe
produção por localização
```

---

# 73. Modelo de dados final — módulo Diário

```text
diary.project_settings

diary.reporting_days

diary.source_events
diary.source_trust_rules
diary.transcriptions

diary.production_entries

diary.workforce_snapshots
diary.workforce_entries

diary.operational_occurrences

diary.information_requests
diary.information_request_responses

diary.weather_records
diary.site_visits
diary.equipment_entries

diary.daily_reports
diary.report_sections

diary.report_templates
diary.report_template_versions

diary.approval_workflows
diary.approval_steps
diary.report_approvals

diary.report_versions

diary.comments
```

---

# 74. Tabelas que NÃO devem existir

Evitar:

```text
diary.projects
diary.locations
diary.wbs
diary.suppliers
diary.contractors
diary.files
diary.fvs
diary.rnc
diary.purchase_orders
diary.receipts
```

---

# 75. Eventos consumidos

Planejamento:

```text
planning.task.updated
planning.task.completed
planning.task.reopened
planning.week.updated
```

Qualidade:

```text
quality.fvs.completed
quality.fvs.rejected
quality.rnc.created
quality.rnc.closed
quality.fvm.rejected
```

Suprimentos:

```text
procurement.receipt.created
procurement.receipt.updated
procurement.material.shortage
```

Os nomes finais devem respeitar os contratos reais existentes.

O padrão de eventos de Planejamento já prevê `event_id` único, versionamento e idempotência.

---

# 76. Eventos emitidos

```text
diary.day.opened

diary.source_event.received
diary.source_event.confirmed

diary.production.reported
diary.production.confirmed

diary.occurrence.created
diary.occurrence.resolved
diary.occurrence.closed

diary.information_request.created
diary.information_request.answered
diary.information_request.escalated

diary.report.generated
diary.report.submitted
diary.report.returned
diary.report.approved
diary.report.issued
diary.report.revised
```

---

# 77. Serviços

```text
reportingDayService
sourceEventService

productionEntryService
workforceService
occurrenceService
informationRequestService

weatherService
siteVisitService

dailyReportService
reportTemplateService

approvalService
reportGenerationService

diaryIntegrationService
```

---

# 78. Permissões

```text
diario.view

diario.capture

diario.review_events

diario.manage_production
diario.manage_workforce
diario.manage_occurrences
diario.manage_information_requests

diario.edit_report
diario.submit_report

diario.approve_report
diario.issue_report
diario.revise_report

diario.configure
```

Autorização nunca hardcoded por cargo.

O Core atual exige permissões nativas no IAM, telas registradas no Core e autorização também no servidor.

---

# 79. Navegação

```text
Diário
├── Visão Geral
├── Hoje
├── Caixa de Entrada
├── RDOs
├── Ocorrências
├── Fotos e Arquivos
├── Aprovações
├── Indicadores
└── Configurações
```

No início:

```text
Produção
Efetivo
Solicitações
```

podem ser subvisões de Hoje.

Não criar telas independentes antes de haver necessidade operacional.

---

# 80. Mapa tela → serviço → schema → tabela → evento → proprietário

| Tela / função | Serviço | Tabela principal | Eventos | Proprietário |
|---|---|---|---|---|
| Visão Geral | `dailyReportService` | `diary.reporting_days`, `daily_reports` | vários | Diário |
| Hoje | `reportingDayService` | `reporting_days` | inbound diversos | Diário |
| Timeline | `sourceEventService` | `source_events` | inbound | Diário |
| Captura | `sourceEventService` | `source_events` | `source_event.received` | Diário |
| Caixa de Entrada | `sourceEventService` | `source_events` | `source_event.confirmed` | Diário |
| Produção | `productionEntryService` | `production_entries` | `production.confirmed` | Diário + Planejamento |
| Progresso acumulado | Planning Service | Planning tables | planning events | Planejamento |
| Efetivo | `workforceService` | `workforce_*` | opcional | Diário |
| Ocorrências | `occurrenceService` | `operational_occurrences` | occurrence events | Diário |
| Ações | Action Service | Core action tables | action events | Core |
| Solicitações | `informationRequestService` | `information_requests` | request events | Diário |
| Fotos | File Service | `core.files`, `core.attachments` | file events | Core |
| Recebimentos | Procurement Service | procurement tables | receipt events | Suprimentos |
| FVS/RNC | Quality Service | quality tables | quality events | Qualidade |
| Clima | `weatherService` | `weather_records` | weather events | Diário |
| Visitas | `siteVisitService` | `site_visits` | opcional | Diário |
| RDO | `dailyReportService` | `daily_reports` | report events | Diário |
| Revisão | `dailyReportService` | reports/sections | report events | Diário |
| Aprovação | `approvalService` | approvals | approval events | Diário |
| Assinatura | Signature Service | Core signature | signature events | Core |
| PDF | `reportGenerationService` | `report_versions` + Core Files | `report.issued` | Diário |
| BIM | BIM Service | BIM mappings | BIM events | BIM |
| Forecast | Financial Service | forecast | finance events | Financeiro |

---

# 81. Linha de rastreabilidade ideal

Todo fato relevante deve permitir navegar:

```text
EVENTO
↓
ORIGEM
↓
REGISTRO OPERACIONAL
↓
ENTIDADE DE OUTRO MÓDULO
↓
RDO
↓
VERSÃO EMITIDA
```

Exemplo:

```text
WhatsApp message #8291
↓
source_event #8291
↓
production_entry #327
↓
schedule_task #172
↓
Pav. 08 / Alvenaria
↓
RDO 184
↓
RDO 184 v2
```

---

# 82. MVP 0 — Fundação

Implementar:

- módulo Core;
- screens;
- IAM;
- migrations;
- RLS;
- serviços;
- tipos;
- audit trail;
- integração Core Files;
- contexto projeto;
- testes cross-tenant.

## Gate

Tenant A não acessa nenhum registro do tenant B.

---

# 83. MVP 1 — RDO manual + campo offline

Obrigatório:

- reporting day;
- Hoje;
- captura texto;
- captura foto;
- captura áudio;
- produção;
- efetivo;
- ocorrência;
- clima manual;
- fotos;
- edição de RDO;
- revisão;
- aprovação;
- snapshot;
- PDF;
- versionamento;
- offline das capturas.

## Resultado

> Uma obra consegue usar o Diário de ponta a ponta sem nenhuma integração externa.

---

# 84. MVP 2 — Planejamento

- atividades previstas;
- microserviços;
- localizações;
- previsto × executado;
- produção diária;
- faltas de informação;
- motivos;
- curto prazo;
- regra de atualização de progresso;
- divergências.

Esse deve ser o primeiro diferencial forte do ConstruKore.

---

# 85. MVP 3 — Source Events + Inbox

- inbox;
- confiança;
- duplicidade;
- conflito;
- provenance;
- timeline completa;
- solicitações de informação;
- escalonamento;
- respostas.

---

# 86. MVP 4 — Empreiteiros

- diário próprio;
- acesso externo;
- produção;
- efetivo;
- fotos;
- ocorrências;
- regras de confiança;
- consolidação.

---

# 87. MVP 5 — Qualidade + Suprimentos

- FVS;
- RNC;
- FVM;
- recebimentos;
- vínculos;
- encaminhamento de ocorrências;
- timeline integrada.

---

# 88. MVP 6 — WhatsApp + IA

- gateway;
- roteamento;
- áudio;
- transcrição;
- estruturação;
- classificação;
- localização;
- atividade;
- confiança;
- resumo assistido.

---

# 89. MVP 7 — BIM

- localização ↔ IFC;
- atividade ↔ elementos;
- foto ↔ elemento;
- produção ↔ elemento;
- evidência 3D;
- 4D/5D.

---

# 90. MVP 8 — Inteligência

- produtividade histórica;
- recorrência;
- motivos de atraso;
- desempenho de equipe;
- impacto de materiais;
- qualidade da coleta;
- sinais para forecast;
- comparação entre obras.

---

# 91. Primeiras vertical slices para o Codex

## Slice 1 — dia → RDO → PDF

```text
Abrir dia
→ registrar fatos manualmente
→ montar RDO
→ revisar
→ emitir
→ snapshot
```

---

## Slice 2 — Planejamento → produção

```text
atividade prevista
→ aparece em Hoje
→ produção apontada
→ validação
→ Planning
→ RDO
```

---

## Slice 3 — Foto/áudio → evento

```text
captura offline
→ sync
→ source_event
→ vínculo
→ RDO
```

---

## Slice 4 — Ocorrência → ação

```text
ocorrência
→ responsável
→ core.action
→ acompanhamento
→ fechamento
→ RDO
```

---

## Slice 5 — Solicitação

```text
atividade sem informação
→ information_request
→ WhatsApp/app
→ resposta
→ production suggestion
→ review
```

---

# 92. O que NÃO implementar primeiro

Evitar começar por:

- LLM avançado;
- WhatsApp complexo;
- BIM;
- dashboards sofisticados;
- reconhecimento de imagem;
- dezenas de configurações;
- automações corporativas.

Primeiro provar:

```text
fato
→ registro
→ consolidação
→ RDO
```

---

# 93. Regras de IA não negociáveis

```text
AI suggests
human confirms
```

IA pode ajudar a escrever.

IA não se torna fonte de verdade.

---

# 94. Regras de auditoria não negociáveis

- RDO emitido é imutável;
- correção gera versão;
- fato original nunca é apagado depois de usado;
- valores conflitantes permanecem armazenados;
- eventos tardios não modificam documento silenciosamente;
- templates publicados são imutáveis;
- respostas de terceiros preservam remetente;
- conteúdo gerado por IA possui linhagem.

---

# 95. Regras de UX não negociáveis

- mobile real;
- operação rápida;
- pouco teclado;
- câmera direta;
- áudio direto;
- estados offline explícitos;
- status nunca apenas por cor;
- drawers quando apropriado;
- edição inline onde fizer sentido;
- pendências antes de informação normal.

O plano visual original do KoreDiario já recomendava desktop operacional denso, mobile focado em captura, drawers e edição inline.

A implementação atual deve, porém, usar o design system já existente em `src/shared`, não reconstruir a antiga identidade visual isolada.

---

# 96. Decisões Q1–Q53 consolidadas

## Produção / Planejamento
- Q1: integração configurável; default com revisão.
- Q2: atividade+local ou microserviço+local adaptativamente.

## Dia / workflow
- Q3: turno opcional; padrão diário.
- Q4: aprovação configurável.
- Q5: aprovação interna + assinatura formal.

## Core
- Q6: Ações/Pendências compartilhadas.

## Efetivo/evidência
- Q7: agregado + individual.
- Q8: fotos configuráveis.
- Q9: WhatsApp multimodelo.
- Q10: diário de empreiteiro.
- Q11: offline desde MVP1.
- Q12: `core.locations` oficial.

## Confiança
- Q13: regras por fonte/tipo.
- Q14: hierarquia + tolerância.
- Q15: tolerância por tipo/atividade/material.

## Fechamento/versionamento
- Q16: bloqueios configuráveis.
- Q17: eventos tardios.
- Q18: retificação por nova versão.
- Q19: numeração configurável.
- Q20: seções condicionais.
- Q21: exigências por atividade.

## Consolidação
- Q22: produção por regra configurável.
- Q23: fato e registro têm horários separados.
- Q24: visitas estruturadas.
- Q25: clima API + observação.
- Q26: arquivo único, múltiplos vínculos.
- Q27: ocorrência multi-dia.
- Q28: pendência relevante carregada.
- Q29: fechamento configurável.
- Q30: fatos separados de pendências.

## IA
- Q31: resumo sugerido + revisão.
- Q32: fato confirmado corrigível antes de emissão com histórico.
- Q33: timeline + cards.
- Q34: solicitação de complemento estruturada.
- Q35: information request ≠ action.
- Q36: escalonamento.
- Q37: resposta gera sugestões estruturadas.

## Decisões assumidas pela recomendação
- Q38: múltiplas respostas preservadas.
- Q39: rascunho manual ou automático.
- Q40: completude determinística.
- Q41: eventos externos filtrados por relevância.
- Q42: sem hard delete de fato auditável.
- Q43: template publicado imutável.
- Q44: timezone por obra.
- Q45: conflito offline exige revisão.
- Q46: idempotência + deduplicação assistida.
- Q47: notificações desacopladas via infraestrutura.
- Q48: acesso externo restrito.
- Q49: thresholds de IA conservadores.
- Q50: linhagem completa.
- Q51: KPI derivado, não duplicado.
- Q52: decisão irreversível humana.
- Q53: simplicidade primeiro.

---

# 97. Definition of Done

Uma feature do Diário só está pronta quando, conforme aplicável:

- comportamento definido;
- migration;
- `tenant_id`;
- RLS;
- índices;
- FK correta;
- permission IAM;
- screen Core;
- backend autorizado;
- service layer;
- frontend;
- loading;
- empty;
- error;
- permission state;
- mobile;
- offline;
- audit trail;
- testes unitários;
- integração;
- E2E;
- OpenAPI/contrato atualizado;
- `npm run verify`;
- diff revisado.

O processo do AGENTS atual define explicitamente que o ORCHESTRATOR decide arquitetura, revisa alterações, executa `npm run verify` e somente então aceita a implementação.

---

# 98. Definition of Done funcional do módulo

O Diário pode ser considerado funcionalmente maduro quando consegue responder:

```text
O que estava previsto?
O que aconteceu?
Onde?
Quando?
Quem informou?
Quem executou?
Quanto foi produzido?
Qual foi o efetivo?
Que material chegou?
Que problema surgiu?
Que qualidade foi verificada?
Que evidência existe?
O que permaneceu pendente?
Quem tomou alguma decisão?
O que foi registrado oficialmente?
Em qual RDO?
Em qual versão?
```

---

# 99. Visão final

A arquitetura desejada não é:

```text
obra
↓
formulário
↓
PDF
```

É:

```text
                 PLANEJAMENTO
                      ↓
                  PREVISTO
                      ↓
CAMPO → FATOS → DIÁRIO OPERACIONAL
                      ↓
       ┌──────────────┼───────────────┐
       ↓              ↓               ↓
   QUALIDADE      SUPRIMENTOS      AÇÕES
       ↓              ↓               ↓
       └──────────────┼───────────────┘
                      ↓
                BASE DO DIA
                      ↓
          ┌───────────┴───────────┐
          ↓                       ↓
         RDO                 INTELIGÊNCIA
          ↓                       ↓
      SNAPSHOT                FORECAST
          ↓                       ↓
         PDF                    BIM/5D
```

O RDO passa a ser uma **visão documental e imutável de uma base operacional viva**.

Essa é a peça que faz o Diário deixar de ser um módulo isolado e virar uma das principais interfaces de campo do ConstruKore.