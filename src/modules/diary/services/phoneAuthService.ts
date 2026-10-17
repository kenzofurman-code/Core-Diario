import { UserContext, WhatsAppContact } from '../types/diary.types';
import { sampleUsers, initialContacts } from './diaryStorage';

/**
 * Normaliza número de telefone removendo qualquer caractere não numérico
 */
export function normalizePhoneNumber(phone: string): string {
  if (!phone) return '';
  return phone.replace(/\D/g, '');
}

/**
 * Mapeamento de contatos conhecidos para UserContext
 */
export function contactToUserContext(contact: WhatsAppContact): UserContext {
  const roleMap: Record<string, UserContext['role']> = {
    ENCARREGADO: 'encarregado',
    MESTRE: 'mestre',
    ENG_RESIDENTE: 'engenheiro_residente',
    GERENTE: 'gerente_obra',
    FISCAL: 'fiscal_cliente',
    CLIENTE: 'cliente',
    EMPREITEIRO: 'encarregado',
  };

  const matchedUser = sampleUsers.find(
    (u) => u.name.toLowerCase() === contact.name.toLowerCase() || u.role.toUpperCase() === contact.role
  );

  return {
    id: matchedUser ? matchedUser.id : `usr-${contact.id}`,
    name: contact.name,
    email: matchedUser ? matchedUser.email : `${normalizePhoneNumber(contact.phone_or_jid)}@obra.com`,
    role: roleMap[contact.role] || 'encarregado',
  };
}

/**
 * Busca usuário por número de telefone (compara dígitos finais para tolerar DDI 55, DDD, etc.)
 */
export function findUserByPhone(
  inputPhone: string,
  contacts: WhatsAppContact[] = initialContacts
): UserContext | null {
  const cleanInput = normalizePhoneNumber(inputPhone);
  if (!cleanInput || cleanInput.length < 8) return null;

  // 1. Procura na lista de contatos do diário
  for (const c of contacts) {
    if (!c.phone_or_jid) continue;
    const cleanContactPhone = normalizePhoneNumber(c.phone_or_jid);
    if (!cleanContactPhone) continue;

    // Se um contém o outro nos dígitos finais (ex: 998887711 coincide com 5541998887711)
    if (
      cleanContactPhone === cleanInput ||
      cleanContactPhone.endsWith(cleanInput) ||
      cleanInput.endsWith(cleanContactPhone)
    ) {
      return contactToUserContext(c);
    }
  }

  // 2. Fallbacks de amostra pré-configurados
  const hardcodedPhoneMap: Record<string, string> = {
    '41998887711': 'usr-02', // Antônio Santos
    '5541998887711': 'usr-02',
    '998887711': 'usr-02',
    '41997776622': 'usr-01', // Carlos Silva
    '5541997776622': 'usr-01',
    '997776622': 'usr-01',
    '41991234567': 'usr-02', // Marcos Oliveira -> Mapeado para encarregado
    '5541991234567': 'usr-02',
    '41988443322': 'usr-02', // Tiago Pereira -> Mapeado para encarregado
    '5541988443322': 'usr-02',
  };

  for (const [keyPhone, userId] of Object.entries(hardcodedPhoneMap)) {
    if (cleanInput === keyPhone || cleanInput.endsWith(keyPhone) || keyPhone.endsWith(cleanInput)) {
      const u = sampleUsers.find((user) => user.id === userId);
      if (u) return u;
    }
  }

  return null;
}

/**
 * Busca usuário por nome, ID ou token amigável (ex: 'antonio', 'carlos', 'mariana')
 */
export function findUserByQuery(query: string): UserContext | null {
  const clean = query.trim().toLowerCase();
  if (!clean) return null;

  return (
    sampleUsers.find(
      (u) =>
        u.id.toLowerCase() === clean ||
        u.name.toLowerCase().includes(clean) ||
        u.role.toLowerCase() === clean ||
        u.email.toLowerCase().includes(clean)
    ) || null
  );
}

const STORAGE_PHONE_KEY = 'construkore_logged_phone';
const STORAGE_USER_ID_KEY = 'construkore_logged_user_id';

export function getPersistedPhone(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(STORAGE_PHONE_KEY);
}

export function persistPhoneAuth(phone: string, user: UserContext): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_PHONE_KEY, normalizePhoneNumber(phone));
  localStorage.setItem(STORAGE_USER_ID_KEY, user.id);
}

export function clearPersistedAuth(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_PHONE_KEY);
  localStorage.removeItem(STORAGE_USER_ID_KEY);
}
