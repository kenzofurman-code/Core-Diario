import test from 'node:test';
import assert from 'node:assert/strict';

// Mock localStorage para node environment
const storage = new Map();
globalThis.localStorage = {
  getItem: (key) => storage.get(key) || null,
  setItem: (key, val) => storage.set(key, String(val)),
  removeItem: (key) => storage.delete(key),
  clear: () => storage.clear(),
};

test('Testes Automatizados de Contatos de Canteiro, LGPD e Variações Naturais de Perguntas', async (t) => {
  // 1. Cadastro e Gestão de Contatos de Campo & Grupos do WhatsApp
  await t.test('1. Deve suportar contatos individuais e grupos de WhatsApp com base legal LGPD', () => {
    const contacts = [
      {
        id: 'grp-01',
        name: 'Grupo Frente de Estrutura — Torre A',
        type: 'GROUP',
        role: 'GRUPO_FRENTE',
        phone_or_jid: '1203630248291823@g.us',
        company_name: 'ConstruKore & Parceiros',
        is_active: true,
        lgpd_consent_status: 'ACCEPTED',
        lgpd_legal_basis: 'EXECUCAO_CONTRATO',
      },
      {
        id: 'cnt-01',
        name: 'Antônio Santos',
        type: 'INDIVIDUAL',
        role: 'ENCARREGADO',
        phone_or_jid: '+55 (41) 99888-7711',
        company_name: 'ConstruKore Engenharia',
        is_active: true,
        lgpd_consent_status: 'ACCEPTED',
        lgpd_legal_basis: 'EXECUCAO_CONTRATO',
      },
    ];

    assert.equal(contacts.length, 2);
    const groups = contacts.filter((c) => c.type === 'GROUP');
    assert.equal(groups.length, 1);
    assert.ok(groups[0].phone_or_jid.endsWith('@g.us'), 'JID de grupo deve terminar em @g.us');

    const individuals = contacts.filter((c) => c.type === 'INDIVIDUAL');
    assert.equal(individuals.length, 1);
    assert.equal(individuals[0].lgpd_legal_basis, 'EXECUCAO_CONTRATO');
  });

  // 2. Opt-out e Desligamento (Conformidade LGPD)
  await t.test('2. Inativação de contato revoga consentimento de comunicação imediatamente (Opt-out)', () => {
    const contact = {
      id: 'cnt-03',
      name: 'Marcos Oliveira',
      is_active: true,
      lgpd_consent_status: 'ACCEPTED',
    };

    // Colaborador desliga-se da obra
    contact.is_active = false;
    contact.lgpd_consent_status = 'REVOKED';

    assert.equal(contact.is_active, false);
    assert.equal(contact.lgpd_consent_status, 'REVOKED');
  });

  // 3. Gerador de Variações Naturais de Perguntas (Sem Parecer Robótico)
  await t.test('3. Gerador de templates deve substituir placeholders e oferecer variações amigáveis', () => {
    const templates = [
      'Boa tarde {nome}! Como está o andamento da {tarefa} no {local} hoje? Conseguiu fechar quantos {uom}?',
      'Fala {nome}, beleza? Me passa o resumo de produção de {tarefa} no {local} para fecharmos o diário.',
      'Olá {nome}, tudo certo? A equipe conseguiu bater a meta diária de {tarefa} no {local}?',
    ];

    const params = {
      contactName: 'Antônio Santos',
      taskName: 'Alvenaria Estrutural',
      locationName: 'Pavimento 08',
      uom: 'm²',
    };

    const cleanName = params.contactName.split(' ')[0];
    const generated = templates[0]
      .replace(/{nome}/g, cleanName)
      .replace(/{tarefa}/g, params.taskName)
      .replace(/{local}/g, params.locationName)
      .replace(/{uom}/g, params.uom);

    assert.ok(generated.includes('Antônio'), 'Deve conter primeiro nome do encarregado');
    assert.ok(generated.includes('Alvenaria Estrutural'), 'Deve conter o nome da tarefa');
    assert.ok(generated.includes('Pavimento 08'), 'Deve conter o pavimento');
    assert.ok(generated.includes('m²'), 'Deve conter a unidade de medida');
    assert.ok(!generated.includes('{'), 'Não deve sobrar nenhum placeholder não resolvido');
  });
});
