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

// Funções de normalização e busca testadas de forma pura
function normalizePhoneNumber(phone) {
  if (!phone) return '';
  return phone.replace(/\D/g, '');
}

const sampleUsers = [
  { id: 'usr-01', name: 'Carlos Silva', email: 'carlos.mestre@poty.com', role: 'mestre' },
  { id: 'usr-02', name: 'Antônio Santos', email: 'antonio.encarregado@poty.com', role: 'encarregado' },
  { id: 'usr-03', name: 'Engª. Mariana Costa', email: 'mariana.costa@construkore.com', role: 'engenheiro_residente' },
  { id: 'usr-04', name: 'Roberto Albuquerque', email: 'roberto.gerente@construkore.com', role: 'gerente_obra' },
];

const sampleContacts = [
  { id: 'cnt-01', name: 'Antônio Santos', role: 'ENCARREGADO', phone_or_jid: '+55 (41) 99888-7711' },
  { id: 'cnt-02', name: 'Carlos Silva', role: 'MESTRE', phone_or_jid: '+55 (41) 99777-6622' },
  { id: 'cnt-03', name: 'Marcos Oliveira', role: 'EMPREITEIRO', phone_or_jid: '+55 (41) 99123-4567' },
];

function findUserByPhone(inputPhone, contacts = sampleContacts) {
  const cleanInput = normalizePhoneNumber(inputPhone);
  if (!cleanInput || cleanInput.length < 8) return null;

  for (const c of contacts) {
    if (!c.phone_or_jid) continue;
    const cleanContact = normalizePhoneNumber(c.phone_or_jid);
    if (!cleanContact) continue;

    if (
      cleanContact === cleanInput ||
      cleanContact.endsWith(cleanInput) ||
      cleanInput.endsWith(cleanContact)
    ) {
      const matched = sampleUsers.find(
        (u) => u.name.toLowerCase() === c.name.toLowerCase() || u.role.toUpperCase() === c.role
      );
      return (
        matched || {
          id: `usr-${c.id}`,
          name: c.name,
          email: `${cleanContact}@obra.com`,
          role: c.role === 'MESTRE' ? 'mestre' : 'encarregado',
        }
      );
    }
  }
  return null;
}

function findUserByQuery(query) {
  const clean = query.trim().toLowerCase();
  if (!clean) return null;
  return (
    sampleUsers.find(
      (u) =>
        u.id.toLowerCase() === clean ||
        u.name.toLowerCase().includes(clean) ||
        u.role.toLowerCase() === clean
    ) || null
  );
}

test('Reconhecimento Automático de Celular e Modo Canteiro Mobile', async (t) => {
  await t.test('1. Normalização de número de telefone (remove parênteses, traços, espaços)', () => {
    assert.equal(normalizePhoneNumber('+55 (41) 99888-7711'), '5541998887711');
    assert.equal(normalizePhoneNumber('41 99888-7711'), '41998887711');
    assert.equal(normalizePhoneNumber(' (86) 98188-1122 '), '86981881122');
  });

  await t.test('2. Reconhecimento automático do encarregado Antônio Santos pelo celular', () => {
    const userComDdi = findUserByPhone('5541998887711');
    assert.ok(userComDdi, 'Deveria reconhecer com DDI 55');
    assert.equal(userComDdi.name, 'Antônio Santos');
    assert.equal(userComDdi.role, 'encarregado');

    const userSemDdi = findUserByPhone('41998887711');
    assert.ok(userSemDdi, 'Deveria reconhecer sem DDI');
    assert.equal(userSemDdi.name, 'Antônio Santos');

    const userLocal = findUserByPhone('998887711');
    assert.ok(userLocal, 'Deveria reconhecer por dígitos finais');
    assert.equal(userLocal.name, 'Antônio Santos');
  });

  await t.test('3. Reconhecimento do mestre de obras Carlos Silva pelo celular', () => {
    const userMestre = findUserByPhone('+55 (41) 99777-6622');
    assert.ok(userMestre, 'Deveria encontrar Carlos Silva');
    assert.equal(userMestre.name, 'Carlos Silva');
    assert.equal(userMestre.role, 'mestre');
  });

  await t.test('4. Reconhecimento por Magic Link / token de nome ou papel', () => {
    const userByRole = findUserByQuery('encarregado');
    assert.ok(userByRole);
    assert.equal(userByRole.role, 'encarregado');

    const userByName = findUserByQuery('Mariana');
    assert.ok(userByName);
    assert.equal(userByName.name, 'Engª. Mariana Costa');
  });

  await t.test('5. Retorno nulo para número inválido ou desconhecido', () => {
    assert.equal(findUserByPhone('12345'), null);
    assert.equal(findUserByPhone('11900000000'), null);
  });

  await t.test('6. Filtragem de frentes de produção por encarregado logado', () => {
    const allProduction = [
      { task_id: 't-1', task_name: 'Alvenaria', assigned_user_id: 'usr-02' },
      { task_id: 't-2', task_name: 'Instalação Elétrica', assigned_user_id: 'usr-01' },
      { task_id: 't-3', task_name: 'Reboco Gesso', assigned_user_id: 'usr-02' },
      { task_id: 't-4', task_name: 'Pintura Fachada', assigned_user_id: undefined },
    ];

    const loggedUser = { id: 'usr-02', name: 'Antônio Santos', role: 'encarregado' };
    const filtered = allProduction.filter(
      (p) => p.assigned_user_id === loggedUser.id || !p.assigned_user_id
    );

    assert.equal(filtered.length, 3, 'Encarregado deve ver apenas suas tarefas e as gerais sem atribuição');
    assert.ok(filtered.some((p) => p.task_id === 't-1'));
    assert.ok(filtered.some((p) => p.task_id === 't-3'));
    assert.ok(!filtered.some((p) => p.task_id === 't-2'), 'Não deve ver frentes de outros');
  });
});
