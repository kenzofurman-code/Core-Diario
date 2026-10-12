// =====================================================================
// SERVIÇO DE DISPARO & COMPARTILHAMENTO DE RESUMO PARA WHATSAPP
// Gera resumos executivos e operacionais formatados com Markdown nativo
// =====================================================================

import { DiaryState } from './diaryStorage';

export type WhatsAppProfile = 'EXECUTIVO' | 'OPERACIONAL';

export class WhatsAppShareService {
  /**
   * Gera o texto da mensagem formatada para WhatsApp
   */
  public static generateMessage(
    state: DiaryState,
    profile: WhatsAppProfile = 'EXECUTIVO',
    customLink?: string
  ): string {
    const { project, dailyReport, weatherSummary, workforceSnapshot, productionEntries, occurrences } = state;

    const formattedDate = this.formatDate(dailyReport.report_date);
    const link = customLink || `https://construkore.app/rdo/${project.codigo.toLowerCase()}/${dailyReport.report_number}`;

    const lines: string[] = [];

    // 1. Cabeçalho
    lines.push('🏗️ *CONSTRUKORE • DIÁRIO DE OBRA (RDO)*');
    lines.push(`📋 *Obra:* ${project.codigo} • ${project.nome}`);
    lines.push(`📅 *Data:* ${formattedDate} • *${dailyReport.formatted_number}*`);
    lines.push(`👤 *Responsável Técnico:* ${dailyReport.responsible_engineer_name}`);
    lines.push('');

    // 2. Clima e Intempérie Pericial
    if (weatherSummary && weatherSummary.shifts && weatherSummary.shifts.length > 0) {
      lines.push('⛅ *CLIMA & INTEMPÉRIE:*');
      weatherSummary.shifts.forEach((s) => {
        const condLabel = s.condition.replace(/_/g, ' ');
        const workLabel =
          s.workability === 'IMPRATICAVEL'
            ? '❌ Impraticável'
            : s.workability === 'PARCIALMENTE_PRATICAVEL'
            ? '⚠️ Parcial'
            : '✓ Praticável';
        const hoursLost = s.hours_lost_to_weather > 0 ? ` (${s.hours_lost_to_weather}h paralisadas)` : '';
        lines.push(`• *${s.shift}:* ${condLabel} (${s.precipitation_mm}mm) • ${workLabel}${hoursLost}`);
      });

      const rainWarning = weatherSummary.is_contractual_rain_day
        ? ' ⚠️ *(Dia de Chuva Impediente Contratual)*'
        : '';
      lines.push(`• *Total Chuva:* ${weatherSummary.total_precipitation_day_mm} mm${rainWarning}`);

      if (weatherSummary.has_nr18_wind_alert) {
        lines.push(`• 💨 *Alerta NR-18:* Vento de ${weatherSummary.max_wind_speed_kmh} km/h (Atenção a içamentos/balancins)`);
      }
      lines.push('');
    }

    // 3. Efetivo de Mão de Obra
    if (workforceSnapshot && workforceSnapshot.entries) {
      const terceirizados = workforceSnapshot.entries
        .filter((e) => e.company_type === 'TERCEIRIZADA')
        .reduce((acc, curr) => acc + curr.count, 0);
      const proprios = workforceSnapshot.entries
        .filter((e) => e.company_type === 'PROPRIA')
        .reduce((acc, curr) => acc + curr.count, 0);

      lines.push('👷 *EFETIVO DE MÃO DE OBRA:*');
      lines.push(`• *Total:* ${workforceSnapshot.total_workers} operários (${terceirizados} terceirizados, ${proprios} próprios)`);

      if (profile === 'OPERACIONAL') {
        const tradeList = workforceSnapshot.entries
          .map((e) => `${e.role_name}: ${e.count}`)
          .join(' • ');
        lines.push(`• *Frentes:* ${tradeList}`);
      } else {
        // No executivo coloca os principais
        const topTrades = workforceSnapshot.entries
          .slice(0, 3)
          .map((e) => `${e.count} ${e.role_name}s`)
          .join(', ');
        lines.push(`• *Principais:* ${topTrades}`);
      }
      lines.push('');
    }

    // 4. Produção e Avanço Físico
    if (productionEntries && productionEntries.length > 0) {
      lines.push('🚧 *AVANÇO DE PRODUÇÃO:*');
      productionEntries.forEach((p) => {
        const check = p.progress_pct >= 100 ? ' ✅' : '';
        lines.push(`• [${p.progress_pct}%] *${p.task_name}* (${p.location_name}) — ${p.quantity_reported}/${p.quantity_planned} ${p.uom}${check}`);
      });
      lines.push('');
    }

    // 5. Alertas & Ocorrências
    const approvedOccs = occurrences.filter((o) => o.approved_for_rdo);
    const criticalOccs = occurrences.filter((o) => o.severity === 'critical' || (o.recurrence_count ?? 0) >= 3);

    lines.push('⚠️ *ALERTAS & OCORRÊNCIAS:*');
    if (criticalOccs.length > 0) {
      criticalOccs.forEach((c) => {
        lines.push(`• 🚨 *Grave:* ${c.title} (${c.location_name}) — Recorrência: ${c.recurrence_count}x`);
      });
    } else if (approvedOccs.length > 0) {
      approvedOccs.forEach((o) => {
        lines.push(`• *Alerta:* ${o.title} (${o.location_name})`);
      });
    } else {
      lines.push('• Nenhum incidente impeditivo registrado no dia.');
    }
    lines.push('');

    // 6. Selo de Governança e Link
    const isIssued = dailyReport.workflow_state === 'ISSUED';
    const lastVersion = state.versions[state.versions.length - 1];
    const hash = lastVersion?.document_hash || 'SHA256-4C28-PND9-2026';

    lines.push(isIssued ? '🔒 *STATUS:* Emitido & Bloqueado no Livro de Ordem' : '📝 *STATUS:* RDO em Aberto / Em Revisão Técnica');
    lines.push(`🔑 *Selo SHA-256:* \`${hash}\``);
    lines.push(`🔗 *Visualizar RDO Completo:* ${link}`);

    return lines.join('\n');
  }

  /**
   * Gera a URL para abertura direta no WhatsApp (Web ou App)
   */
  public static generateWhatsAppUrl(text: string, phoneOrGroup?: string): string {
    const encoded = encodeURIComponent(text);
    if (phoneOrGroup && phoneOrGroup.trim()) {
      const cleanPhone = phoneOrGroup.replace(/\D/g, '');
      return `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encoded}`;
    }
    return `https://api.whatsapp.com/send?text=${encoded}`;
  }

  /**
   * Copia o texto para a área de transferência do dispositivo
   */
  public static async copyToClipboard(text: string): Promise<boolean> {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
      // Fallback
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      return successful;
    } catch (err) {
      console.error('Falha ao copiar texto para área de transferência:', err);
      return false;
    }
  }

  private static formatDate(isoDate: string): string {
    try {
      const parts = isoDate.split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      return isoDate;
    } catch {
      return isoDate;
    }
  }
}
