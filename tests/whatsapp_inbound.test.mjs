import test from 'node:test';
import assert from 'node:assert/strict';

// Modelos e lógica pura espelhada do DiaryStorageService para Coleta Ativa & WhatsApp Inbound
function createInformationRequest(state, reqData) {
  const now = new Date().toISOString();
  const newRequest = {
    id: reqData.id || `req-${Date.now()}`,
    tenant_id: 'tenant-kore-01',
    project_id: 'poty-01',
    reporting_day_id: 'rep-day-2026-09-08',
    schedule_task_id: reqData.schedule_task_id,
    wbs_task_name: reqData.wbs_task_name,
    location_name: reqData.location_name || 'Canteiro Geral',
    requested_from_party_name: reqData.requested_from_party_name || 'Equipe de Obra',
    requested_from_user_name: reqData.requested_from_user_name || 'Encarregado',
    requested_from_phone: reqData.requested_from_phone || '+55 (41) 99999-0000',
    request_type: reqData.request_type || 'PRODUCTION_PROGRESS',
    request_text: reqData.request_text || 'Favor confirmar produção do turno.',
    scheduled_send_time: reqData.scheduled_send_time || '16:00',
    requested_at: now,
    due_at: reqData.due_at || new Date(Date.now() + 2 * 3600 * 1000).toISOString(),
    request_state: 'PENDING',
    escalation_level: 0,
    blocking_rule: reqData.blocking_rule ?? false,
    created_at: now,
    updated_at: now,
  };

  state.informationRequests.unshift(newRequest);
  return { state, request: newRequest };
}

function escalateInformationRequest(state, requestId, targetLevel) {
  const req = state.informationRequests.find((r) => r.id === requestId);
  if (req && req.request_state !== 'ANSWERED' && req.request_state !== 'CLOSED') {
    const nextLevel = targetLevel !== undefined ? targetLevel : Math.min(3, req.escalation_level + 1);
    req.escalation_level = nextLevel;
    if (nextLevel === 1) {
      req.request_state = 'REMINDED';
    } else if (nextLevel === 2) {
      req.request_state = 'ESCALATED';
    } else if (nextLevel === 3) {
      req.request_state = 'ESCALATED';
      req.blocking_rule = true;
    }
    req.updated_at = new Date().toISOString();
  }
  return state;
}

function simulateWhatsAppInbound(state, payload) {
  const now = new Date().toISOString();
  const sourceType =
    payload.message_type === 'audio'
      ? 'WHATSAPP_AUDIO'
      : payload.message_type === 'image'
      ? 'WHATSAPP_IMAGE'
      : 'WHATSAPP_TEXT';

  const rawText = payload.transcription || payload.raw_text || 'Mensagem recebida via WhatsApp';

  const newEvent = {
    id: payload.event_id || `evt-wa-${Date.now()}`,
    tenant_id: 'tenant-kore-01',
    project_id: 'poty-01',
    reporting_day_id: 'rep-day-2026-09-08',
    source_type: sourceType,
    occurred_at: payload.received_at || now,
    recorded_at: now,
    author_id: 'usr-wa-bot',
    author_name: `${payload.sender_name} (via WhatsApp Bot)`,
    author_role: 'encarregado',
    raw_text: rawText,
    location_name: payload.detected_entities?.location_name || 'Canteiro Geral',
    wbs_task_name: payload.detected_entities?.wbs_task_name,
    media_url: payload.media_url,
    audio_duration_seconds: payload.audio_duration_seconds,
    audio_blob_url: payload.message_type === 'audio' ? payload.media_url : undefined,
    whatsapp_sender_phone: payload.sender_phone,
    whatsapp_message_id: payload.whatsapp_message_id,
    information_request_id: payload.matched_request_id,
    review_state: 'pending_review',
    confidence: 0.95,
    status: 'active',
    created_at: now,
  };

  state.sourceEvents.unshift(newEvent);

  let matchedReq = state.informationRequests.find((r) => r.id === payload.matched_request_id);
  if (!matchedReq && payload.sender_phone) {
    const cleanPhone = payload.sender_phone.replace(/\D/g, '').slice(-8);
    matchedReq = state.informationRequests.find(
      (r) =>
        r.requested_from_phone.replace(/\D/g, '').slice(-8) === cleanPhone &&
        r.request_state !== 'CLOSED'
    );
  }

  if (matchedReq) {
    matchedReq.request_state = 'ANSWERED';
    matchedReq.response_source_event_id = newEvent.id;
    matchedReq.response_received_at = payload.received_at || now;
    matchedReq.response_raw_content = payload.raw_text;
    matchedReq.response_media_url = payload.media_url;
    matchedReq.response_transcription = payload.transcription;
    matchedReq.updated_at = now;

    if (payload.detected_entities) {
      matchedReq.extracted_data = {
        task_id: payload.detected_entities.task_id,
        task_name: payload.detected_entities.wbs_task_name,
        suggested_production_delta: payload.detected_entities.production_quantity,
        suggested_uom: payload.detected_entities.uom,
        suggested_occurrence_title: payload.detected_entities.occurrence_title,
        suggested_occurrence_category: payload.detected_entities.occurrence_category,
        suggested_photo_url: payload.media_url,
        material_shortage: payload.detected_entities.material_shortage,
      };
    }
  }

  return { state, event: newEvent, request: matchedReq };
}

function approveWhatsAppSuggestion(state, requestIdOrEventId, engineerName = 'Engª. Mariana Costa') {
  const now = new Date().toISOString();
  const req = state.informationRequests.find(
    (r) => r.id === requestIdOrEventId || r.response_source_event_id === requestIdOrEventId
  );
  const event = state.sourceEvents.find(
    (e) => e.id === requestIdOrEventId || (req && e.id === req.response_source_event_id)
  );

  if (event) {
    event.review_state = 'confirmed';
    event.reviewed_by = engineerName;
    event.reviewed_at = now;
  }

  if (req) {
    req.request_state = 'CLOSED';
    req.reviewed_by = engineerName;
    req.reviewed_at = now;
    req.updated_at = now;

    if (req.extracted_data?.suggested_production_delta) {
      const prod =
        (req.extracted_data.task_id && state.productionEntries.find((p) => p.task_id === req.extracted_data?.task_id)) ||
        (req.schedule_task_id && state.productionEntries.find((p) => p.task_id === req.schedule_task_id)) ||
        state.productionEntries.find((p) =>
          req.wbs_task_name && p.task_name.toLowerCase().includes(req.wbs_task_name.toLowerCase().split(' ')[0])
        );

      if (prod) {
        prod.quantity_reported = Math.max(prod.quantity_reported, req.extracted_data.suggested_production_delta);
        prod.progress_pct = Math.min(100, Math.round((prod.quantity_reported / prod.quantity_planned) * 100));
        prod.confirmation_state = 'confirmed';
        prod.confirmed_by = engineerName;
        prod.confirmed_at = now;
      }
    }
  }

  return state;
}

function validateRdoClosure(state) {
  const blockingIssues = [];
  const pendingBlockingRequests = (state.informationRequests || []).filter(
    (r) => r.blocking_rule && r.request_state !== 'ANSWERED' && r.request_state !== 'REVIEWED' && r.request_state !== 'CLOSED'
  );
  if (pendingBlockingRequests.length > 0) {
    pendingBlockingRequests.forEach((req) => {
      blockingIssues.push(`Solicitação bloqueante sem resposta: "${req.requested_from_user_name}"`);
    });
  }
  return {
    can_issue: blockingIssues.length === 0,
    blocking_issues: blockingIssues,
  };
}

// SUÍTE DE TESTES UNITÁRIOS
test('Testes Automatizados de Coleta Ativa & WhatsApp Inbound (Evolution API + n8n)', async (t) => {
  const mockState = {
    informationRequests: [],
    sourceEvents: [],
    productionEntries: [
      {
        task_id: 'tsk-01',
        task_name: 'Concretagem de Vigas e Lajes',
        quantity_planned: 20,
        quantity_reported: 0,
        uom: 'm³',
        progress_pct: 0,
        confirmation_state: 'pending',
      },
    ],
  };

  await t.test('1. Criação e Escalonamento de Solicitação Proativa (Régua de Cobrança)', () => {
    // Cria solicitação
    const { state, request } = createInformationRequest(mockState, {
      id: 'req-test-01',
      schedule_task_id: 'tsk-01',
      wbs_task_name: 'Concretagem de Vigas e Lajes',
      requested_from_user_name: 'Carlos Silva (Mestre)',
      requested_from_phone: '+55 41 98765-4321',
      request_text: 'Carlos, favor enviar foto e laudo de abatimento do concreto da laje L-09.',
      scheduled_send_time: '14:00',
      blocking_rule: false,
    });

    assert.equal(request.request_state, 'PENDING');
    assert.equal(request.escalation_level, 0);

    // Escala para nível 1 (+30 min: Lembrete)
    escalateInformationRequest(state, 'req-test-01', 1);
    const reqLevel1 = state.informationRequests.find((r) => r.id === 'req-test-01');
    assert.equal(reqLevel1.request_state, 'REMINDED');
    assert.equal(reqLevel1.escalation_level, 1);

    // Escala para nível 2 (+1h: Engenharia)
    escalateInformationRequest(state, 'req-test-01', 2);
    const reqLevel2 = state.informationRequests.find((r) => r.id === 'req-test-01');
    assert.equal(reqLevel2.request_state, 'ESCALATED');
    assert.equal(reqLevel2.escalation_level, 2);

    // Escala para nível 3 (Bloqueante Fechamento)
    escalateInformationRequest(state, 'req-test-01', 3);
    const reqLevel3 = state.informationRequests.find((r) => r.id === 'req-test-01');
    assert.equal(reqLevel3.request_state, 'ESCALATED');
    assert.equal(reqLevel3.blocking_rule, true);
  });

  await t.test('2. Ingestão de Webhook Normalizado do n8n (Áudio Whisper com Extração de IA)', () => {
    const webhookPayload = {
      event_id: 'evt-wa-100',
      whatsapp_message_id: 'WAMID-TEST-001',
      sender_phone: '+5541987654321',
      sender_name: 'Carlos Silva',
      message_type: 'audio',
      audio_duration_seconds: 22,
      media_url: 'https://example.com/audio.ogg',
      transcription: 'Finalizamos 18 m³ de concreto na laje L-09, slump deu 12 cm.',
      received_at: '2026-09-08T15:20:00-03:00',
      matched_request_id: 'req-test-01',
      detected_entities: {
        task_id: 'tsk-01',
        wbs_task_name: 'Concretagem de Vigas e Lajes',
        production_quantity: 18,
        uom: 'm³',
      },
    };

    const { state, event, request } = simulateWhatsAppInbound(mockState, webhookPayload);

    // Verifica que gerou SourceEvent auditável com status pending_review
    assert.equal(event.source_type, 'WHATSAPP_AUDIO');
    assert.equal(event.review_state, 'pending_review');
    assert.equal(event.raw_text, 'Finalizamos 18 m³ de concreto na laje L-09, slump deu 12 cm.');
    assert.equal(event.whatsapp_message_id, 'WAMID-TEST-001');

    // Verifica que a solicitação foi atualizada para ANSWERED
    assert.equal(request.request_state, 'ANSWERED');
    assert.equal(request.response_source_event_id, event.id);
    assert.equal(request.extracted_data.suggested_production_delta, 18);
    assert.equal(request.extracted_data.suggested_uom, 'm³');

    // Invariante de Segurança: Produção NÃO é alterada antes da homologação humana do Engenheiro
    const prodBefore = state.productionEntries.find((p) => p.task_id === 'tsk-01');
    assert.equal(prodBefore.quantity_reported, 0);
  });

  await t.test('3. Homologação em 1-Clique pelo Engenheiro Residente', () => {
    approveWhatsAppSuggestion(mockState, 'req-test-01', 'Engª. Mariana Costa');

    const req = mockState.informationRequests.find((r) => r.id === 'req-test-01');
    const evt = mockState.sourceEvents.find((e) => e.id === req.response_source_event_id);
    const prod = mockState.productionEntries.find((p) => p.task_id === 'tsk-01');

    // Request fechada e evento confirmado
    assert.equal(req.request_state, 'CLOSED');
    assert.equal(req.reviewed_by, 'Engª. Mariana Costa');
    assert.equal(evt.review_state, 'confirmed');

    // Produção atualizada deterministicamente
    assert.equal(prod.quantity_reported, 18);
    assert.equal(prod.progress_pct, 90); // 18 / 20 * 100
    assert.equal(prod.confirmation_state, 'confirmed');
    assert.equal(prod.confirmed_by, 'Engª. Mariana Costa');
  });

  await t.test('4. Validação de Regra Bloqueante se Solicitação Crítica Ficar sem Resposta', () => {
    // Cria nova solicitação bloqueante que ainda não foi respondida
    createInformationRequest(mockState, {
      id: 'req-blocking-critical',
      requested_from_user_name: 'Antônio Santos (Encarregado)',
      request_text: 'Confirme a armação de aço da viga antes da concretagem.',
      blocking_rule: true,
    });

    const validationPending = validateRdoClosure(mockState);
    assert.equal(validationPending.can_issue, false);
    assert.equal(validationPending.blocking_issues.length, 1);
    assert.match(validationPending.blocking_issues[0], /Antônio Santos/);

    // Quando o encarregado responde via WhatsApp
    simulateWhatsAppInbound(mockState, {
      whatsapp_message_id: 'WAMID-002',
      sender_phone: '+5541999990000',
      sender_name: 'Antônio Santos',
      message_type: 'text',
      raw_text: 'Armação conferida e liberada.',
      matched_request_id: 'req-blocking-critical',
    });

    const validationAnswered = validateRdoClosure(mockState);
    assert.equal(validationAnswered.can_issue, true);
    assert.equal(validationAnswered.blocking_issues.length, 0);
  });
});
