import React, { useState } from 'react';
import {
  Users,
  Plus,
  MessageSquare,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Trash2,
  Power,
  Phone,
  Send,
  ExternalLink,
  HelpCircle,
  Hash,
  MapPin,
  Lock,
} from 'lucide-react';
import { WhatsAppContact, WhatsAppContactType, WhatsAppContactRole } from '../../types/diary.types';

interface ContactsManagerPanelProps {
  contacts: WhatsAppContact[];
  onAddContact: (contact: Partial<WhatsAppContact>) => void;
  onUpdateContact: (contactId: string, updates: Partial<WhatsAppContact>) => void;
  onRemoveContact: (contactId: string) => void;
  onToggleActive: (contactId: string) => void;
  onTestMessage?: (contact: WhatsAppContact) => void;
}

export const ContactsManagerPanel: React.FC<ContactsManagerPanelProps> = ({
  contacts,
  onAddContact,
  onUpdateContact,
  onRemoveContact,
  onToggleActive,
  onTestMessage,
}) => {
  const [activeTab, setActiveTab] = useState<'ALL' | 'GROUP' | 'INDIVIDUAL'>('ALL');
  const [isAdding, setIsAdding] = useState(false);
  const [showLgpdExplainer, setShowLgpdExplainer] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [type, setType] = useState<WhatsAppContactType>('INDIVIDUAL');
  const [role, setRole] = useState<WhatsAppContactRole>('ENCARREGADO');
  const [phoneOrJid, setPhoneOrJid] = useState('');
  const [companyName, setCompanyName] = useState('ConstruKore Engenharia');
  const [companyType, setCompanyType] = useState<'PROPRIA' | 'TERCEIRIZADA'>('PROPRIA');
  const [assignedLocation, setAssignedLocation] = useState('Torre A — Pavimento 08');
  const [notes, setNotes] = useState('');

  const totalContacts = contacts.length;
  const totalGroups = contacts.filter((c) => c.type === 'GROUP').length;
  const totalIndividuals = contacts.filter((c) => c.type === 'INDIVIDUAL').length;
  const totalActive = contacts.filter((c) => c.is_active).length;

  const filteredContacts = contacts.filter((c) => {
    if (activeTab === 'ALL') return true;
    return c.type === activeTab;
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phoneOrJid) return;

    onAddContact({
      name: name.trim(),
      type,
      role,
      phone_or_jid: phoneOrJid.trim(),
      company_name: companyName.trim(),
      company_type: companyType,
      assigned_location: assignedLocation.trim(),
      is_active: true,
      lgpd_consent_status: 'ACCEPTED',
      lgpd_legal_basis: 'EXECUCAO_CONTRATO',
      notes: notes.trim(),
    });

    setName('');
    setPhoneOrJid('');
    setNotes('');
    setIsAdding(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header com KPIs e Ação de Cadastro */}
      <div className="bg-panel border border-rule rounded-card p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-card bg-emerald-600/10 text-emerald-600 flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-ink flex items-center gap-2">
                Contatos de Campo & Grupos do WhatsApp
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-pill bg-emerald-500/10 text-emerald-700 font-bold uppercase border border-emerald-500/20">
                  Evolution API + n8n
                </span>
              </h2>
              <p className="text-xs text-ink-muted mt-0.5">
                Régua de comunicação híbrida: Grupos temáticos por frente e mensagens privadas com encarregados
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowLgpdExplainer(!showLgpdExplainer)}
            className="px-3 py-2 text-xs font-semibold bg-panel hover:bg-paper border border-rule rounded-field text-ink flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Guia LGPD na Obra
          </button>

          <button
            type="button"
            onClick={() => setIsAdding(!isAdding)}
            className="px-3.5 py-2 text-xs font-bold bg-action hover:bg-action-hover text-white rounded-field flex items-center gap-1.5 transition-all shadow-xs active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Novo Contato / Grupo
          </button>
        </div>
      </div>

      {/* Cards de Métricas de Contatos */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-panel border border-rule p-3.5 rounded-card space-y-1">
          <span className="text-[10px] font-bold text-ink-muted uppercase">Total de Contatos</span>
          <div className="flex items-center justify-between">
            <span className="text-xl font-mono font-bold text-ink">{totalContacts}</span>
            <Users className="w-4 h-4 text-ink-muted" />
          </div>
          <span className="text-[11px] text-ink-secondary">{totalActive} ativos para cobrança</span>
        </div>

        <div className="bg-panel border border-rule p-3.5 rounded-card space-y-1">
          <span className="text-[10px] font-bold text-ink-muted uppercase">Grupos de Obra</span>
          <div className="flex items-center justify-between">
            <span className="text-xl font-mono font-bold text-emerald-600">{totalGroups}</span>
            <MessageSquare className="w-4 h-4 text-emerald-600" />
          </div>
          <span className="text-[11px] text-ink-secondary">Comunicação por frente</span>
        </div>

        <div className="bg-panel border border-rule p-3.5 rounded-card space-y-1">
          <span className="text-[10px] font-bold text-ink-muted uppercase">Contatos Diretos</span>
          <div className="flex items-center justify-between">
            <span className="text-xl font-mono font-bold text-action">{totalIndividuals}</span>
            <Phone className="w-4 h-4 text-action" />
          </div>
          <span className="text-[11px] text-ink-secondary">Encarregados & Mestres</span>
        </div>

        <div className="bg-panel border border-rule p-3.5 rounded-card space-y-1">
          <span className="text-[10px] font-bold text-ink-muted uppercase">Conformidade LGPD</span>
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-emerald-600 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" /> 100% Adequado
            </span>
            <Lock className="w-4 h-4 text-emerald-600" />
          </div>
          <span className="text-[11px] text-ink-secondary">Base: Execução Contratual</span>
        </div>
      </div>

      {/* Explainer / Cartilha Prática de LGPD na Construção Civil */}
      {showLgpdExplainer && (
        <div className="bg-panel border-2 border-emerald-500/30 rounded-card p-4 space-y-3 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-rule pb-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <h3 className="text-xs font-bold text-ink uppercase tracking-wider">
                Como a LGPD (Lei 13.709/2018) Funciona no Canteiro de Obras
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setShowLgpdExplainer(false)}
              className="text-xs text-ink-muted hover:text-ink"
            >
              Fechar
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-ink-secondary leading-relaxed">
            <div className="p-3 rounded-card bg-paper border border-rule-subtle space-y-1">
              <strong className="text-ink flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> 1. Bases Legais Válidas
              </strong>
              <p>
                O uso do WhatsApp de encarregados e terceirizados é respaldado pela <strong>Execução de Contrato de Trabalho / Prestação de Serviços (Art. 7º, V)</strong> e <strong>Obrigação Legal de Segurança (NR-18 e CLT)</strong>. Não há necessidade de burocracia excessiva.
              </p>
            </div>

            <div className="p-3 rounded-card bg-paper border border-rule-subtle space-y-1">
              <strong className="text-ink flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> 2. Minimização de Dados
              </strong>
              <p>
                O bot do ConstruKore <strong>nunca solicita nem armazena CPF, dados bancários ou informações sensíveis</strong>. Trafega exclusivamente produção física (m², m³), fotos técnicas e insumos de canteiro.
              </p>
            </div>

            <div className="p-3 rounded-card bg-paper border border-rule-subtle space-y-1">
              <strong className="text-ink flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> 3. Grupos & Desligamento
              </strong>
              <p>
                <strong>Grupos de WhatsApp</strong> garantem transparência coletiva sem expor números pessoais. Caso um colaborador saia da obra, basta <strong>inativar o contato com 1 clique</strong> (opt-out imediato).
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Formulário de Cadastro Inline */}
      {isAdding && (
        <form
          onSubmit={handleAddSubmit}
          className="bg-panel border-2 border-action/30 rounded-card p-4 space-y-4 animate-in fade-in duration-200"
        >
          <div className="flex items-center justify-between border-b border-rule pb-2">
            <h3 className="text-xs font-bold text-ink uppercase flex items-center gap-2">
              <Plus className="w-4 h-4 text-action" />
              Cadastrar Novo Contato ou Grupo de WhatsApp
            </h3>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="text-xs text-ink-muted hover:text-ink"
            >
              Cancelar
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-ink uppercase mb-1">
                Tipo de Destinatário
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as WhatsAppContactType)}
                className="w-full text-xs p-2 rounded-field bg-paper border border-rule text-ink font-semibold"
              >
                <option value="INDIVIDUAL">Contato Individual (Pessoa)</option>
                <option value="GROUP">Grupo de WhatsApp (Frente Coletiva)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-ink uppercase mb-1">
                {type === 'GROUP' ? 'Nome do Grupo de Obra' : 'Nome Completo do Responsável'}
              </label>
              <input
                type="text"
                required
                placeholder={type === 'GROUP' ? 'Ex: Grupo Frente Estrutura Torre A' : 'Ex: José Ferreira'}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full text-xs p-2 rounded-field bg-paper border border-rule text-ink"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-ink uppercase mb-1">
                {type === 'GROUP' ? 'Group JID (Evolution API)' : 'Telefone WhatsApp (com DDD)'}
              </label>
              <input
                type="text"
                required
                placeholder={type === 'GROUP' ? '1203630248291823@g.us' : '+55 (41) 99888-0000'}
                value={phoneOrJid}
                onChange={(e) => setPhoneOrJid(e.target.value)}
                className="w-full text-xs p-2 rounded-field bg-paper border border-rule text-ink font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-ink uppercase mb-1">
                Função / Papel
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as WhatsAppContactRole)}
                className="w-full text-xs p-2 rounded-field bg-paper border border-rule text-ink"
              >
                <option value="ENCARREGADO">Encarregado de Obras</option>
                <option value="MESTRE">Mestre de Obras</option>
                <option value="EMPREITEIRO">Subempreiteiro / Terceirizado</option>
                <option value="ENGENHEIRO">Engenheiro(a) Residente</option>
                <option value="GRUPO_FRENTE">Grupo de Frente de Serviço</option>
                <option value="FORNECEDOR">Fornecedor / Usina</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-ink uppercase mb-1">
                Empresa / Prestador
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full text-xs p-2 rounded-field bg-paper border border-rule text-ink"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-ink uppercase mb-1">
                Frente / Local de Trabalho
              </label>
              <input
                type="text"
                value={assignedLocation}
                onChange={(e) => setAssignedLocation(e.target.value)}
                className="w-full text-xs p-2 rounded-field bg-paper border border-rule text-ink"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-rule">
            <div className="flex items-center gap-2 text-xs text-ink-secondary">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Base LGPD: <strong>Execução de Contrato e Segurança Operacional</strong></span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-3 py-1.5 text-xs font-semibold bg-paper border border-rule text-ink rounded-field"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-bold bg-action hover:bg-action-hover text-white rounded-field"
              >
                Salvar Contato
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Abas de Navegação (Todos / Grupos / Individuais) */}
      <div className="flex items-center gap-2 border-b border-rule pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('ALL')}
          className={`px-3 py-1.5 text-xs font-bold rounded-chip transition-all ${
            activeTab === 'ALL'
              ? 'bg-action text-white shadow-xs'
              : 'bg-panel hover:bg-paper text-ink-secondary border border-rule'
          }`}
        >
          Todos ({totalContacts})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('GROUP')}
          className={`px-3 py-1.5 text-xs font-bold rounded-chip transition-all flex items-center gap-1.5 ${
            activeTab === 'GROUP'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-panel hover:bg-paper text-ink-secondary border border-rule'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          Grupos de WhatsApp ({totalGroups})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('INDIVIDUAL')}
          className={`px-3 py-1.5 text-xs font-bold rounded-chip transition-all flex items-center gap-1.5 ${
            activeTab === 'INDIVIDUAL'
              ? 'bg-action text-white shadow-xs'
              : 'bg-panel hover:bg-paper text-ink-secondary border border-rule'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          Encarregados & Pessoas ({totalIndividuals})
        </button>
      </div>

      {/* Lista de Contatos em Cards Ricos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filteredContacts.map((contact) => (
          <div
            key={contact.id}
            className={`p-4 rounded-card border transition-all ${
              contact.is_active
                ? 'bg-panel border-rule hover:border-action/40'
                : 'bg-panel-subtle border-rule-subtle opacity-60'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-9 h-9 rounded-card flex items-center justify-center font-bold text-xs shrink-0 ${
                    contact.type === 'GROUP'
                      ? 'bg-emerald-600/10 text-emerald-600 border border-emerald-500/20'
                      : 'bg-action-soft text-action border border-action/20'
                  }`}
                >
                  {contact.type === 'GROUP' ? <MessageSquare className="w-4 h-4" /> : <Users className="w-4 h-4" />}
                </div>

                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-xs font-bold text-ink">{contact.name}</h3>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                        contact.type === 'GROUP'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-panel-subtle text-ink-muted border border-rule'
                      }`}
                    >
                      {contact.type === 'GROUP' ? 'Grupo Obra' : contact.role}
                    </span>
                  </div>
                  <span className="text-[11px] text-ink-muted flex items-center gap-1 mt-0.5 font-mono">
                    {contact.type === 'GROUP' ? <Hash className="w-3 h-3" /> : <Phone className="w-3 h-3" />}
                    {contact.phone_or_jid}
                  </span>
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onToggleActive(contact.id)}
                  className={`p-1.5 rounded-field border transition-colors ${
                    contact.is_active
                      ? 'border-rule hover:bg-paper text-emerald-600'
                      : 'border-rule hover:bg-paper text-ink-muted'
                  }`}
                  title={contact.is_active ? 'Inativar contato (Opt-out LGPD)' : 'Reativar contato'}
                >
                  <Power className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => onRemoveContact(contact.id)}
                  className="p-1.5 rounded-field border border-rule hover:bg-paper text-ink-muted hover:text-danger transition-colors"
                  title="Remover contato"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Informações de Trabalho e LGPD */}
            <div className="mt-3 pt-3 border-t border-rule grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="text-ink-muted block text-[10px] uppercase font-bold">Empresa</span>
                <span className="text-ink font-semibold truncate block">{contact.company_name}</span>
              </div>

              <div>
                <span className="text-ink-muted block text-[10px] uppercase font-bold">Frente Principal</span>
                <span className="text-ink font-semibold truncate block">{contact.assigned_location || 'Geral'}</span>
              </div>
            </div>

            {/* Tarefas Vinculadas */}
            {contact.assigned_wbs_tasks && contact.assigned_wbs_tasks.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {contact.assigned_wbs_tasks.map((task, idx) => (
                  <span
                    key={idx}
                    className="text-[10px] bg-paper border border-rule px-1.5 py-0.5 rounded text-ink-secondary truncate"
                  >
                    {task}
                  </span>
                ))}
              </div>
            )}

            {/* Selo LGPD e Status */}
            <div className="mt-3 pt-2 border-t border-rule-subtle flex items-center justify-between text-[10px] text-ink-muted">
              <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                <ShieldCheck className="w-3 h-3" /> Termo Operacional Ativo
              </span>
              <span
                className={`font-bold px-1.5 py-0.2 rounded-pill uppercase ${
                  contact.is_active ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rule text-ink-muted'
                }`}
              >
                {contact.is_active ? 'Ativo na Régua' : 'Inativo (Opt-out)'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
