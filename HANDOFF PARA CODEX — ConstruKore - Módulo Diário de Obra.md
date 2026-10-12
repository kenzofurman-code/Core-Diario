# HANDOFF PARA CODEX — ConstruKore / Módulo Diário de Obra

Quero implementar no repositório existente do **ConstruKore** o módulo **Diário de Obra / RDO**, evolução do projeto anteriormente chamado KoreDiario.

## 1. Regra principal

Não trate este módulo como aplicativo isolado.

Ele deve ser **Core Compliant** e reutilizar integralmente as entidades e padrões existentes do ConstruKore.

Antes de escrever código:

1. leia integralmente o `AGENTS.md`;
2. inspecione a arquitetura real do repositório;
3. localize os schemas/tabelas/serviços existentes de Core, IAM, Planejamento, arquivos e auditoria;
4. compare a implementação real com esta especificação;
5. não invente nomes de tabelas, helpers, contratos ou APIs que já possam existir;
6. apresente um plano de implementação;
7. sinalize qualquer conflito material entre esta spec e o código existente antes de implementar.

O ORCHESTRATOR é responsável por arquitetura, decisões, revisão, testes e aceitação.

Não delegue decisão de arquitetura ao WORKER.

---

# 2. Stack e convenções conhecidas

Stack:

- TypeScript strict;
- React 19;
- Vite;
- Tailwind;
- Supabase/PostgreSQL 16;
- npm.

Estrutura preferida:

```text
src/
  modules/<business-module>/
    components/
    hooks/
    services/
    types.ts

  shared/
```

Código e banco em inglês.

Interface e documentação de usuário em português.

Componentes React nunca acessam Supabase diretamente.

Toda consulta tenant-scoped deve explicitamente carregar o tenant atual mesmo com RLS habilitado.

Executar ao final:

```text
npm run verify
```

---

# 3. Tese do Diário

Não estamos criando apenas um formulário de RDO.

O fluxo conceitual é:

```text
OBRA ACONTECE
    ↓
FATOS SÃO CAPTURADOS
    ↓
FATOS RECEBEM CONTEXTO E PROCEDÊNCIA
    ↓
CONFLITOS / PENDÊNCIAS SÃO RESOLVIDOS
    ↓
MÓDULOS PROPRIETÁRIOS RECEBEM INFORMAÇÃO QUANDO APLICÁVEL
    ↓
BASE OPERACIONAL DO DIA
    ↓
RDO
    ↓
REVISÃO
    ↓
APROVAÇÃO
    ↓
SNAPSHOT IMUTÁVEL
    ↓
PDF / ASSINATURA / EMISSÃO
```

O princípio central é:

> captura primeiro, formulário depois.

O RDO é um produto derivado da base operacional diária.

---

# 4. Fonte de verdade por domínio

O Diário NÃO pode criar segunda fonte oficial de informações pertencentes a outros módulos.

| Informação | Módulo proprietário |
|---|---|
| tenant/empresa/obra | Core |
| usuários/permissões | Core/IAM |
| localização física | Core |
| WBS | Core/Planejamento |
| tarefas | Planejamento |
| progresso acumulado oficial | Planejamento |
| curto prazo | Planejamento |
| orçamento | Orçamento |
| solicitações/cotações/pedidos | Suprimentos |
| recebimento/estoque oficial | Suprimentos |
| FVS/FVM | Qualidade |
| RNC | Qualidade |
| pessoas/fornecedores/empreiteiros | Core Parties |
| arquivos | Core Files/Attachments |
| ações/pendências | capacidade transversal Core |
| fatos operacionais do dia | Diário |
| RDO/versões | Diário |

Não criar cópias locais de projetos, locations, WBS, suppliers, contractors ou files.

---

# 5. Invariantes Core

Toda nova tabela tenant-scoped deve seguir o padrão existente do Core, incluindo conforme aplicável:

```text
id uuid
tenant_id uuid
status core.record_status
created_at timestamptz
updated_at timestamptz
```

Obrigatório:

- RLS na migration de criação;
- helpers Core existentes;
- UUID;
- índices tenant-aware;
- FK direta para entidades Core;
- estado de workflow separado de `status`;
- autorização IAM no frontend E backend;
- telas registradas no Core;
- menu por mecanismo equivalente ao `iam.effective_screens()`;
- arquivos através da infraestrutura existente de Core Files/Attachments.

Não invente assinatura SQL de helpers. Inspecione primeiro.

---

# 6. Entidades Core que esperamos reutilizar

Confirme os nomes reais antes de codar:

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

Se os nomes reais forem diferentes, use os existentes.

---

# 7. Conceito central: source event

O Diário terá uma porta de entrada normalizada para fatos.

Entidade conceitual:

```text
diary.source_events
```

Campos conceituais:

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

Tipos iniciais conceituais:

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

Um source event pode originar múltiplos fatos.

Exemplo:

> “Executamos 85 m² de alvenaria no Pav. 8, mas às 15h acabou o bloco.”

pode gerar:

```text
production_entry = 85 m²
```

e:

```text
operational_occurrence = falta de material
```

ambos mantendo referência ao evento original.

---

# 8. Horários

Nunca confundir:

```text
occurred_at
```

com:

```text
recorded_at / received_at
```

Exemplo:

```text
15:00 fato aconteceu
18:12 informação foi registrada
```

Guardar ambos.

---

# 9. Pipeline futuro

Arquitetura conceitual:

```text
source_event
→ validação
→ idempotência
→ deduplicação
→ resolução da obra
→ armazenamento de mídia
→ transcrição
→ extração
→ classificação
→ sugestão location/WBS/task/party
→ confidence
→ regra de confiança/conflito
→ revisão humana quando necessária
→ registro operacional
```

Não precisamos implementar IA neste primeiro slice.

A modelagem, porém, não deve impedir esse fluxo.

---

# 10. Produção

O Diário guarda apontamento diário.

Ele NÃO é fonte oficial do progresso acumulado.

Entidade conceitual:

```text
diary.production_entries
```

Campos mínimos:

```text
id
tenant_id
project_id
reporting_day_id

schedule_task_id
wbs_node_id
location_id

quantity
uom_code

reported_progress_delta

source_event_id
source_party_id

confirmation_state
confirmed_by
confirmed_at

planning_sync_state

notes
status
timestamps
```

## Granularidade

Usar adaptativamente:

```text
microservice + location
```

quando houver microserviço.

Fallback:

```text
activity + location
```

Não obrigar microserviço se o Planejamento não possuir essa granularidade.

---

# 11. Integração produção → Planejamento

Decisão de produto fechada:

comportamento configurável por obra/atividade.

Modos conceituais:

```text
DIRECT
REVIEW_REQUIRED
CONFIGURED_BY_ACTIVITY
```

Default inicial:

```text
REVIEW_REQUIRED
```

Ou seja, produção confirmada no Diário não deve alterar silenciosamente o progresso oficial do Planejamento.

Primeiro descubra como a medição/progresso é atualmente registrada no módulo de Planejamento.

---

# 12. Reporting day

Entidade conceitual:

```text
diary.reporting_days
```

Campos:

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

Regra default:

```text
1 project + 1 local date = 1 reporting day
```

A arquitetura deve suportar turno opcional.

A interface inicial trabalha por dia.

Timezone pertence à obra.

Persistência de timestamps em `timestamptz`.

---

# 13. Efetivo

Suportar:

- registros agregados;
- informações individualizadas quando uma integração de mão de obra/portaria existir.

UI padrão é agregada.

Entidades conceituais:

```text
diary.workforce_snapshots
diary.workforce_entries
```

Não duplicar cadastro de trabalhadores ou empresas.

---

# 14. Diário de empreiteiros

Empreiteiros/subcontratados poderão possuir um diário operacional próprio com:

- efetivo;
- produção;
- fotos;
- ocorrências;
- observações.

Esse diário é uma FONTE para o RDO da construtora, não substitui o RDO principal.

Registros devem aceitar:

```text
source_party_id
```

Confiança é configurável por:

- empreiteiro;
- tipo de dado;
- atividade;
- obra.

Exemplo:

```text
foto      auto-accept
efetivo   auto-accept
produção  review-required
```

---

# 15. Conflitos entre fontes

Exemplo:

```text
empreiteiro  120 m²
engenheiro    95 m²
```

Preservar ambos.

Usar:

- hierarquia de fonte;
- tolerância configurável;
- estado de validação;
- resolução humana quando necessária.

Tolerância pode variar por:

- tipo de dado;
- atividade;
- microserviço;
- material.

Não destruir os valores originais.

---

# 16. Caixa de Entrada

Estados conceituais:

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

A UX da Inbox deve ser orientada a exceções.

Não obrigar revisão manual de tudo.

---

# 17. Solicitações de informação

Criar entidade específica:

```text
diary.information_requests
```

Não confundir com ação operacional.

Exemplo:

> “Confirme a produção do Pav. 8 e mande uma foto.”

Workflow:

```text
REQUESTED
→ ANSWERED
→ REVIEWED
→ CLOSED
```

Pode ter:

- responsible party;
- user;
- task;
- location;
- WBS;
- prazo;
- regra bloqueante.

Pode ser respondido por app ou WhatsApp.

---

# 18. Escalonamento

Solicitações podem possuir regra configurável:

```text
30 min → lembrete
1 h    → escalar
2 h    → escalar novamente
fim do dia → bloquear fechamento
```

Parar automaticamente quando atendida.

---

# 19. Resposta estruturada

Exemplo:

> “Foram 92 m² no Pav. 8. Segue foto.”

Fluxo futuro:

```text
resposta
→ source_event
→ information_request
→ interpretação
→ production_entry sugerido
→ attachment
→ regra de confiança
```

Não exigir redigitação do engenheiro.

---

# 20. Ações/Pendências transversais

Há decisão de produto de criar/reutilizar capacidade compartilhada de Ações/Pendências do ConstruKore.

Exemplos:

```text
Diário → ocorrência → ação
Qualidade → RNC → ação
Planejamento → restrição → ação
Reunião → decisão → ação
```

Não implementar uma tabela genérica nova sem antes procurar se já há conceito equivalente no Core.

`information_request` continua entidade separada.

---

# 21. Ocorrências

Entidade conceitual:

```text
diary.operational_occurrences
```

Campos:

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

location_id
wbs_node_id
schedule_task_id
responsible_party_id

occurred_at
due_at

impact_type
impact_description

workflow_state

resolved_at
validated_at
closed_at

source_event_id

status
timestamps
```

Categorias iniciais:

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

# 22. Ocorrência != RNC

Regra arquitetural:

```text
diary.operational_occurrence
!=
quality.non_conformity
```

Uma ocorrência pode ser encaminhada para Qualidade e originar uma RNC.

Nunca gerar RNC automaticamente somente porque `category = quality`.

---

# 23. Ocorrências multi-dia

Uma ocorrência pode permanecer aberta por vários dias.

Não duplicar automaticamente por RDO.

Exemplo:

```text
01/09 aberta
02/09 continua relevante
03/09 resolvida
```

Cada RDO pode referenciá-la conforme relevância.

---

# 24. Fatos do dia vs pendências

O RDO deve separar claramente:

```text
FATOS DO DIA
```

de:

```text
PENDÊNCIAS RELEVANTES
```

Uma RNC ou ocorrência antiga que continua impactando a obra não pode aparecer como se tivesse ocorrido novamente naquele dia.

---

# 25. Fechamento de ocorrência

Configurável por categoria/severidade.

Pode existir:

```text
OPEN
→ IN_TREATMENT
→ RESOLVED_PENDING_VALIDATION
→ CLOSED
```

Casos simples podem fechar diretamente.

---

# 26. Suprimentos

Recebimento oficial pertence a Suprimentos.

O Diário apenas referencia.

Uma observação de campo:

> “Chegaram 8 pallets.”

não movimenta estoque automaticamente.

Se houver receipt correspondente, vincular.

Se não houver:

```text
sugerir conferência em Suprimentos
```

Uma falta de material pode gerar ocorrência e oferecer ação explícita:

```text
Abrir no Suprimentos
```

---

# 27. Qualidade

O Diário deve conseguir incorporar eventos relevantes de:

- FVS;
- FVM;
- RNC;
- inspeções.

Não criar tabelas `diary.fvs`, `diary.rnc` etc.

O módulo Qualidade continua proprietário.

---

# 28. SST

Mesma regra.

O Diário pode exibir fatos relevantes, mas não duplicar entidades especializadas.

---

# 29. Clima

Suportar:

```text
API
FIELD_OBSERVATION
MANUAL
```

Preservar fontes conflitantes.

Fato observado em campo pode prevalecer na narrativa do RDO quando relevante, sem apagar a API.

---

# 30. Visitas

Criar registro estruturado de visita vinculado a `core.parties` ou equivalente existente.

Campos conceituais:

```text
party
visitor
purpose
host
entered_at
left_at
notes
source
```

Pode vir de portaria/controle de acesso.

---

# 31. Arquivos

Uma única cópia física do arquivo.

Usar Core Files/Attachments.

Uma foto pode simultaneamente estar vinculada a:

- source event;
- atividade;
- produção;
- ocorrência;
- localização;
- RNC;
- seção do RDO.

Não duplicar o blob.

---

# 32. Fotos obrigatórias

Regra configurável por projeto/template.

Pode ser:

```text
mínimo diário
por atividade
por localização
por atividade crítica
nenhuma obrigatoriedade
```

---

# 33. Offline

Captura offline é requisito do MVP1.

Suportar inicialmente:

- texto;
- foto;
- áudio;
- produção;
- ocorrência;
- efetivo rápido.

Estratégia alinhada ao padrão existente:

```text
IndexedDB
client UUID
sync queue
retry
background upload
conflict detection
```

Registro finalizado no servidor nunca é sobrescrito silenciosamente por cópia offline antiga.

---

# 34. WhatsApp

Arquitetura futura:

```text
WhatsApp
→ provider
→ n8n/integration gateway
→ evento normalizado
→ Diário
```

Suportar:

- grupo;
- bot individual;
- canal/número da obra;
- combinação.

Se obra não puder ser determinada com confiança:

```text
unmatched_project
```

Nunca inventar.

---

# 35. IA

Pode:

- transcrever;
- estruturar;
- classificar;
- sugerir location;
- sugerir WBS/task;
- sugerir party;
- detectar conflito;
- detectar duplicidade;
- gerar resumo.

Não pode:

- confirmar produção autonomamente;
- movimentar estoque;
- criar lançamento financeiro;
- fechar ocorrência crítica;
- aprovar RDO;
- emitir RDO.

---

# 36. Resumo executivo

IA pode gerar rascunho usando SOMENTE fatos confirmados.

Sempre exige revisão/aceite humano.

---

# 37. Correção de fatos

Antes da emissão:

fatos confirmados podem ser corrigidos.

Preservar:

```text
old value
new value
user
timestamp
reason
```

Depois da emissão:

não editar snapshot.

---

# 38. Tela Hoje

Visão principal:

```text
timeline cronológica
+
cards resumo
+
filtros
+
pendências
+
ações rápidas
```

Exemplo:

```text
QOYA
03 SET 2026

RDO 184      COLETANDO       76%

Previsto
3 atividades sem apontamento

Pendências
7 precisam de decisão

07:02 Efetivo confirmado
08:15 Início alvenaria Pav.08
09:43 Recebimento blocos
11:32 FVS aprovada
14:10 Chuva
15:05 Falta de material
16:40 Produção 85 m²
```

---

# 39. Captura mobile

Priorizar ações grandes:

```text
Áudio
Foto
Texto
Produção
Efetivo
Ocorrência
```

Operação em segundos.

Pouco teclado.

---

# 40. Daily Report

Entidade conceitual:

```text
diary.daily_reports
```

Campos:

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

Workflow:

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

# 41. Fechamento do dia

Regras configuráveis por projeto/template.

Algumas pendências bloqueiam.

Outras apenas alertam.

Exemplos de bloqueio:

- seção obrigatória;
- atividade crítica sem informação;
- aprovação obrigatória;
- solicitação obrigatória pendente.

---

# 42. Evento tardio

Informação recebida após fechamento:

```text
occurred_at = dia antigo
received_at = agora
late_event = true
```

Usuário decide:

- manter fora;
- complemento;
- retificação.

Nunca alterar RDO emitido automaticamente.

---

# 43. Seções

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

Obrigatoriedade pode ser condicional.

---

# 44. Template

Criar ou adaptar conceito de templates versionados:

```text
diary.report_templates
diary.report_template_versions
```

Template pode configurar:

- seções;
- ordem;
- obrigatoriedade;
- regras condicionais;
- fotos;
- bloqueios;
- workflow de aprovação;
- numeração.

Versão publicada é imutável.

---

# 45. Numeração

Configurável por obra/template.

Default:

```text
sequencial por obra
```

Suportar prefixos.

---

# 46. Aprovação

Workflow configurável por obra.

Exemplo simples:

```text
Engenheiro → Gerente
```

Possíveis fluxos:

```text
Engenheiro
→ Coordenador
→ Fiscal
→ Cliente
```

Não hardcodar cargos.

Usar permissões/participantes configurados.

---

# 47. Assinatura

Suportar dois mecanismos:

1. aprovação autenticada interna;
2. assinatura eletrônica formal quando exigida.

Assinatura formal deve ser infraestrutura transversal, não específica do Diário.

Procure capacidade existente antes de criar.

---

# 48. Snapshot e versões

Entidade conceitual:

```text
diary.report_versions
```

Campos:

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

Regra:

```text
ISSUED = immutable
```

Correção:

```text
v1 → retificação → v2
```

Nunca modificar v1.

---

# 49. PDF

PDF é gerado EXCLUSIVAMENTE a partir do snapshot da versão.

Não reconstruir RDO histórico consultando tabelas atuais.

Fluxo:

```text
snapshot_json
→ renderer
→ PDF
→ Core Files
```

---

# 50. BIM/IFC

Estrutura espacial oficial é o Core Location.

```text
core.location
↕
BIM mapping
↕
IFC element
```

O IFC não define a existência da localização do ConstruKore.

Uma obra sem IFC deve operar normalmente.

---

# 51. Financeiro

O Diário fornece sinais operacionais.

Não cria lançamento financeiro.

Exemplo correto:

```text
produção
→ planejamento
→ medição prevista
→ contrato
→ condição de pagamento
→ forecast
```

---

# 52. Entidades conceituais finais do Diário

Antes de criar qualquer uma, validar contra o banco real.

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

NÃO criar automaticamente todas de uma vez.

Implementar por vertical slice.

---

# 53. Tabelas proibidas conceitualmente

Não criar:

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

# 54. Serviços conceituais

Validar padrões existentes primeiro:

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

# 55. Permissões iniciais conceituais

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

Use padrão/nomenclatura real do IAM se diferente.

---

# 56. Menu

Inicial:

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

Produção, Efetivo e Solicitações podem inicialmente viver dentro de Hoje.

Evitar telas prematuras.

---

# 57. Mapa de propriedade

| Função | Owner |
|---|---|
| dia operacional | Diário |
| source event | Diário |
| produção diária informada | Diário |
| progresso acumulado | Planejamento |
| efetivo diário | Diário |
| ocorrência operacional | Diário |
| action | Core transversal |
| information request | Diário |
| arquivo | Core |
| recebimento | Suprimentos |
| estoque | Suprimentos |
| FVS/RNC | Qualidade |
| RDO | Diário |
| assinatura | Core transversal |
| BIM mapping | BIM |
| forecast | Financeiro |

---

# 58. Rastreabilidade obrigatória

Objetivo:

```text
EVENTO
↓
ORIGEM
↓
FATO ESTRUTURADO
↓
ENTIDADE DE DOMÍNIO
↓
RDO
↓
VERSÃO EMITIDA
```

Exemplo:

```text
WhatsApp #8291
→ source_event
→ production_entry
→ schedule_task
→ Alvenaria / Pav.08
→ RDO 184
→ RDO 184 v2
```

---

# 59. Fases

## Fase 0 — Foundation

- registrar módulo;
- telas;
- permissões;
- migrations;
- RLS;
- service layer;
- Core Files;
- auditoria;
- project context;
- testes cross-tenant.

## MVP1 — Manual + Offline

- reporting day;
- Hoje;
- texto;
- foto;
- áudio;
- produção;
- efetivo;
- ocorrência;
- clima manual;
- RDO;
- revisão;
- aprovação;
- snapshot;
- PDF;
- versionamento;
- captura offline.

## MVP2 — Planejamento

- atividades do dia;
- localização;
- WBS;
- microserviços;
- previsto x executado;
- falta de informação;
- sincronização de produção.

## MVP3 — Inbox

- source events;
- conflitos;
- confiança;
- duplicidade;
- provenance;
- information requests;
- escalation.

## MVP4 — Empreiteiro

- diário externo;
- acesso restrito;
- confiança por fonte.

## MVP5 — Qualidade + Suprimentos

- FVS;
- RNC;
- FVM;
- receipts;
- vínculos.

## MVP6 — WhatsApp + IA

## MVP7 — BIM

## MVP8 — Inteligência

---

# 60. ORDEM DE IMPLEMENTAÇÃO AGORA

NÃO tente implementar o módulo inteiro.

Comece pela:

# VERTICAL SLICE 1
## reporting day → RDO manual → snapshot → PDF

Objetivo:

> provar o núcleo do domínio de ponta a ponta sem nenhuma integração externa.

A Slice 1 deve permitir:

1. acessar uma obra existente;
2. abrir/obter o dia operacional atual;
3. registrar informações manuais mínimas;
4. montar o RDO;
5. editar/revisar;
6. enviar para aprovação;
7. aprovar;
8. criar snapshot;
9. gerar PDF;
10. emitir;
11. impedir edição silenciosa da versão emitida;
12. criar nova versão quando houver retificação.

### Ainda NÃO implementar na Slice 1

- WhatsApp;
- IA;
- BIM;
- source trust avançado;
- diário de empreiteiro;
- Qualidade;
- Suprimentos;
- dashboards sofisticados.

Apenas não bloqueie arquiteturalmente essas evoluções.

---

# 61. PRIMEIRA RESPOSTA ESPERADA DO CODEX

Antes de alterar qualquer arquivo, responda com:

## A. Descoberta do repositório

Liste:

- estrutura relevante;
- padrões existentes;
- tabelas Core relevantes;
- tabelas Planejamento relevantes;
- IAM;
- arquivos;
- auditoria;
- mecanismo atual de PDF/documentos;
- padrões de service/data layer;
- testes existentes.

## B. Conflitos com a spec

Mostre qualquer ponto onde o repositório real diverge desta especificação.

## C. Reuso

Liste o que será reutilizado.

## D. Novas entidades realmente necessárias para a Slice 1

Não liste entidades futuras que ainda não precisam ser criadas.

## E. Plano da Slice 1

Use formato:

```text
1. [passo]
   verify: [checagem objetiva]

2. [passo]
   verify: [checagem objetiva]
```

## F. Acceptance criteria da Slice 1

Critérios objetivos antes de escrever código.

Somente depois disso iniciar a implementação.

---

# 62. Definition of Done

Uma feature só é considerada pronta quando, conforme aplicável:

- migration Core Compliant;
- tenant;
- RLS;
- índices;
- FK;
- permission;
- screen;
- backend auth;
- service layer;
- frontend;
- loading;
- empty;
- error;
- permission state;
- mobile;
- offline;
- audit;
- unit test;
- integration test;
- E2E;
- contrato/OpenAPI;
- `npm run verify`;
- diff revisado pelo ORCHESTRATOR.

Não considere resultado de WORKER como DONE sem revisão.

---

# 63. Diretriz final

Priorize:

```text
simplicidade
correção
rastreabilidade
reuso do Core
uma fonte de verdade
vertical slices
```

Evite:

```text
arquitetura especulativa
tabelas duplicadas
framework genérico sem necessidade
configuração prematura
IA antes do domínio funcionar
```

O objetivo da primeira entrega não é ter um RDO “inteligente”.

É provar:

```text
FATO
→ REGISTRO OPERACIONAL
→ RDO
→ SNAPSHOT
→ DOCUMENTO IMUTÁVEL
```

dentro da arquitetura real do ConstruKore.