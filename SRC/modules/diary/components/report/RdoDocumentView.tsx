import React from 'react';
import { Printer, Download, X, ShieldCheck, Lock, MapPin, Calendar, Clock, Check } from 'lucide-react';
import { RdoSnapshotData, ReportVersion } from '../../types/diary.types';

interface RdoDocumentViewProps {
  isOpen: boolean;
  onClose: () => void;
  version?: ReportVersion;
  fallbackData?: RdoSnapshotData;
}

export const RdoDocumentView: React.FC<RdoDocumentViewProps> = ({
  isOpen,
  onClose,
  version,
  fallbackData,
}) => {
  if (!isOpen) return null;

  const data: RdoSnapshotData | undefined = version ? version.snapshot_json : fallbackData;

  if (!data) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6 bg-overlay backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-panel border border-rule rounded-card w-full max-w-4xl shadow-2xl flex flex-col max-h-[95vh] overflow-hidden">
        {/* Barra Superior de Controles (Não é impressa) */}
        <div className="print:hidden p-3 bg-panel border-b border-rule flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-chip text-[11px] font-mono font-bold bg-action text-white">
              {data.report_number}
            </span>
            <span className="text-xs font-bold text-ink">
              Documento Oficial de Diário de Obra (Snapshot Imutável)
            </span>
            {version && (
              <span className="text-[10px] font-mono bg-paper border border-rule px-2 py-0.5 rounded-pill text-ink-muted">
                Hash: {version.document_hash.substring(0, 18)}...
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-1.5 text-xs font-semibold rounded-field bg-action text-white flex items-center gap-1.5 hover:opacity-90 shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              Imprimir / Salvar PDF
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-ink-muted hover:text-ink rounded-chip"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* DOCUMENTO FORMAL A4 (Área Imprimível) */}
        <div className="overflow-y-auto p-6 sm:p-10 bg-white text-black font-sans space-y-6 print:p-0 print:space-y-4 print:text-black">
          {/* Cabeçalho Oficial */}
          <div className="border-b-2 border-black pb-4 flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-black text-white font-bold text-xs flex items-center justify-center rounded-xs">
                  CK
                </div>
                <h1 className="text-lg font-bold tracking-tight text-black">
                  CONSTRUKORE — DIÁRIO DE OBRA (RDO)
                </h1>
              </div>
              <p className="text-xs text-neutral-600 mt-1">
                Relatório Diário de Obra • Livro de Ordem • Normas ABNT NBR 15575 / CONFEA
              </p>
              <div className="text-xs text-neutral-800 mt-2 font-medium">
                <strong>Obra:</strong> {data.project.nome} ({data.project.codigo}) • <strong>Local:</strong> {data.project.cidade}
              </div>
            </div>

            <div className="text-right space-y-1">
              <div className="font-mono text-sm font-bold bg-neutral-100 px-2.5 py-1 border border-neutral-300 rounded">
                {data.report_number}
              </div>
              <p className="text-xs text-neutral-600">
                <strong>Data:</strong> {data.report_date}
              </p>
              <p className="text-[10px] text-neutral-500 font-mono">
                Emitido em: {new Date(data.issued_at).toLocaleString('pt-BR')}
              </p>
            </div>
          </div>

          {/* 1. Condições Climáticas & Prova Pericial de Intempérie */}
          <div className="space-y-2">
            <div className="flex items-center justify-between bg-neutral-100 p-1.5 border-l-4 border-black">
              <h3 className="text-xs font-bold uppercase tracking-wider">
                1. Condições Meteorológicas & Prova Pericial de Intempérie
              </h3>
              {data.weather_summary && (
                <span className="text-[11px] font-mono font-bold text-neutral-800">
                  Total Acumulado: {data.weather_summary.total_precipitation_day_mm} mm •{' '}
                  {data.weather_summary.is_contractual_rain_day
                    ? '⚠️ CHUVA IMPEDIENTE CONTRATUAL'
                    : 'DIÁRIO PRATICÁVEL'}
                </span>
              )}
            </div>

            {data.weather_summary ? (
              <div className="space-y-2 text-xs">
                <div className="flex flex-wrap items-center justify-between text-[11px] text-neutral-600 bg-neutral-50 p-2 border border-neutral-200 rounded">
                  <div>
                    <strong>Estação Satélite:</strong> {data.weather_summary.station_source}
                  </div>
                  <div>
                    <strong>Referência Jurídica:</strong> {data.weather_summary.inmet_reference || 'Estação INMET A807'}
                  </div>
                  <div>
                    <strong>Vento Máx:</strong> {data.weather_summary.max_wind_speed_kmh} km/h{' '}
                    {data.weather_summary.has_nr18_wind_alert && '(Alerta NR-18)'}
                  </div>
                </div>

                <table className="w-full text-xs border-collapse border border-neutral-300">
                  <thead>
                    <tr className="bg-neutral-100 text-neutral-800 font-semibold border-b border-neutral-300">
                      <th className="p-1.5 text-left border-r border-neutral-300">Turno</th>
                      <th className="p-1.5 text-left border-r border-neutral-300">Condição</th>
                      <th className="p-1.5 text-center border-r border-neutral-300">Temp. Méd</th>
                      <th className="p-1.5 text-center border-r border-neutral-300">Chuva (mm)</th>
                      <th className="p-1.5 text-center border-r border-neutral-300">Vento</th>
                      <th className="p-1.5 text-center border-r border-neutral-300">Praticabilidade</th>
                      <th className="p-1.5 text-center border-r border-neutral-300">Horas Paradas</th>
                      <th className="p-1.5 text-left">Parecer Pericial / Auditoria</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.weather_summary.shifts.map((s) => (
                      <tr key={s.shift} className="border-b border-neutral-200">
                        <td className="p-1.5 font-bold border-r border-neutral-300">
                          {s.shift} ({s.period_label})
                        </td>
                        <td className="p-1.5 border-r border-neutral-300">{s.condition.replace(/_/g, ' ')}</td>
                        <td className="p-1.5 text-center font-mono border-r border-neutral-300">{s.temperature_avg_c}°C</td>
                        <td className="p-1.5 text-center font-mono font-bold border-r border-neutral-300">{s.precipitation_mm} mm</td>
                        <td className="p-1.5 text-center font-mono border-r border-neutral-300">{s.wind_speed_max_kmh} km/h</td>
                        <td className="p-1.5 text-center border-r border-neutral-300">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              s.workability === 'IMPRATICAVEL'
                                ? 'bg-red-100 text-red-800'
                                : s.workability === 'PARCIALMENTE_PRATICAVEL'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-green-100 text-green-800'
                            }`}
                          >
                            {s.workability}
                          </span>
                        </td>
                        <td className="p-1.5 text-center font-mono border-r border-neutral-300">
                          {s.hours_lost_to_weather > 0 ? `${s.hours_lost_to_weather}h` : '—'}
                        </td>
                        <td className="p-1.5 text-[11px]">
                          {s.is_overridden ? (
                            <span className="text-amber-900 font-medium">
                              [Ajuste por {s.overridden_by_name}]: {s.override_reason} (Estação: {s.original_api_precipitation_mm}mm)
                            </span>
                          ) : (
                            <span className="text-neutral-600">Medição automática validada.</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 text-xs">
                {data.weather.map((w) => (
                  <div key={w.shift} className="border border-neutral-200 p-2 rounded">
                    <div className="flex justify-between font-semibold">
                      <span>Turno: {w.shift}</span>
                      <span className="text-neutral-700">{w.condition}</span>
                    </div>
                    <p className="text-[11px] text-neutral-600 mt-0.5">
                      Impacto: <strong>{w.impact.replace('_', ' ')}</strong>
                    </p>
                    {w.notes && <p className="text-[11px] text-neutral-500 italic">{w.notes}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 2. Efetivo de Mão de Obra */}
          <div className="space-y-2">
            <div className="flex items-center justify-between bg-neutral-100 p-1.5 border-l-4 border-black">
              <h3 className="text-xs font-bold uppercase tracking-wider">
                2. Efetivo de Pessoal (Mão de Obra)
              </h3>
              <span className="text-xs font-bold font-mono">
                Total Presente: {data.workforce.total_workers} Colaboradores
              </span>
            </div>

            <table className="w-full text-xs border-collapse border border-neutral-300">
              <thead>
                <tr className="bg-neutral-50 text-neutral-700 font-semibold border-b border-neutral-300">
                  <th className="p-2 text-left border-r border-neutral-300">Função</th>
                  <th className="p-2 text-left border-r border-neutral-300">Tipo</th>
                  <th className="p-2 text-left border-r border-neutral-300">Empresa / Subcontratada</th>
                  <th className="p-2 text-right">Qtd</th>
                </tr>
              </thead>
              <tbody>
                {data.workforce.entries.map((w) => (
                  <tr key={w.role_code} className="border-b border-neutral-200">
                    <td className="p-2 font-medium border-r border-neutral-200">{w.role_name}</td>
                    <td className="p-2 border-r border-neutral-200">{w.company_type}</td>
                    <td className="p-2 border-r border-neutral-200">{w.company_name}</td>
                    <td className="p-2 text-right font-mono font-bold">{w.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 3. Produção & Avanço Físico */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider bg-neutral-100 p-1.5 border-l-4 border-black">
              3. Produção Executada no Dia (Previsto x Realizado)
            </h3>
            <table className="w-full text-xs border-collapse border border-neutral-300">
              <thead>
                <tr className="bg-neutral-50 text-neutral-700 font-semibold border-b border-neutral-300">
                  <th className="p-2 text-left border-r border-neutral-300">Atividade</th>
                  <th className="p-2 text-left border-r border-neutral-300">Localização</th>
                  <th className="p-2 text-right border-r border-neutral-300">Previsto</th>
                  <th className="p-2 text-right border-r border-neutral-300">Executado</th>
                  <th className="p-2 text-right border-r border-neutral-300">% Avanço</th>
                  <th className="p-2 text-left">Observações Técnicas</th>
                </tr>
              </thead>
              <tbody>
                {data.production.map((p) => (
                  <tr key={p.task_id} className="border-b border-neutral-200">
                    <td className="p-2 font-medium border-r border-neutral-200">{p.task_name}</td>
                    <td className="p-2 border-r border-neutral-200">{p.location_name}</td>
                    <td className="p-2 text-right font-mono border-r border-neutral-200">
                      {p.quantity_planned} {p.uom}
                    </td>
                    <td className="p-2 text-right font-mono font-bold border-r border-neutral-200">
                      {p.quantity_reported} {p.uom}
                    </td>
                    <td className="p-2 text-right font-mono font-bold border-r border-neutral-200">
                      {p.progress_pct}%
                    </td>
                    <td className="p-2 text-neutral-600 text-[11px]">{p.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 4. Ocorrências Aprovadas & Impactos */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider bg-neutral-100 p-1.5 border-l-4 border-black">
              4. Ocorrências Operacionais & Falta de Materiais Aprovadas
            </h3>
            {data.occurrences.length === 0 ? (
              <p className="text-xs text-neutral-500 italic p-2">
                Nenhuma ocorrência ou anomalia operacional registrada no dia.
              </p>
            ) : (
              <div className="space-y-2">
                {data.occurrences.map((o) => (
                  <div key={o.id} className="border border-neutral-300 p-2.5 rounded text-xs space-y-1">
                    <div className="flex justify-between font-bold">
                      <span>[{o.code}] {o.title} — {o.location_name}</span>
                      <span className="uppercase text-neutral-700">Gravidade: {o.severity}</span>
                    </div>
                    <p className="text-neutral-700">{o.description}</p>
                    {o.immediate_impact && (
                      <div className="text-[11px] text-neutral-600 font-mono bg-neutral-50 p-1.5 rounded">
                        Impacto Imediato: {o.immediate_impact.workers_idle_count} operários ociosos por {o.immediate_impact.hours_lost}h • Custo Estimado: R$ {o.immediate_impact.cost_estimate?.toFixed(2)}
                      </div>
                    )}
                    {o.review_feedback && (
                      <p className="text-[11px] text-neutral-800 font-medium">
                        <strong>Parecer da Engenharia:</strong> {o.review_feedback}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Conciliações de Fontes Homologadas (Fase 3) */}
            {data.conflicts && data.conflicts.length > 0 && (
              <div className="pt-2">
                <h4 className="text-[11px] font-bold uppercase text-neutral-700 mb-1">
                  4.1 Conciliações Técnicas de Divergências (Empreiteiro vs Medição Oficial)
                </h4>
                <div className="space-y-1.5">
                  {data.conflicts.map((conf) => (
                    <div key={conf.id} className="p-2 border border-neutral-300 rounded text-xs space-y-0.5 bg-neutral-50">
                      <div className="flex justify-between font-bold">
                        <span>{conf.task_name} ({conf.location_name}) — {conf.contractor_party_name}</span>
                        <span className="font-mono">Homologado: {conf.resolved_value ?? conf.engineer_value} {conf.uom}</span>
                      </div>
                      <p className="text-[11px] text-neutral-600">
                        Empreiteiro apontou: {conf.contractor_value} {conf.uom} • Medição Engenharia: {conf.engineer_value} {conf.uom} (Variação: +{conf.variance_pct}%)
                      </p>
                      {conf.resolution_rationale && (
                        <p className="text-[11px] text-neutral-800 italic">
                          <strong>Parecer de Conciliação:</strong> {conf.resolution_rationale}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Chamados de Auditoria de Suprimentos Disparados (Fase 3) */}
            {data.supply_tickets && data.supply_tickets.length > 0 && (
              <div className="pt-2">
                <h4 className="text-[11px] font-bold uppercase text-neutral-700 mb-1">
                  4.2 Chamados de Auditoria para Suprimentos & Compras (Reincidência 3x)
                </h4>
                <div className="space-y-1.5">
                  {data.supply_tickets.map((st) => (
                    <div key={st.id} className="p-2 border border-neutral-300 rounded text-xs space-y-0.5 bg-neutral-50">
                      <div className="flex justify-between font-bold">
                        <span>[{st.ticket_code}] Falta Crítica Reincidente: {st.material_name} ({st.recurrence_count}ª falta)</span>
                        <span className="font-mono text-red-700">Prejuízo: R$ {st.total_cost_estimate.toFixed(2)}</span>
                      </div>
                      <p className="text-[11px] text-neutral-600 font-mono">
                        Impacto Total Acumulado: {st.total_workers_idle} operários afetados • {st.total_hours_lost}h ociosas perdidas
                      </p>
                      {st.dispatch_notes && (
                        <p className="text-[11px] text-neutral-800 italic">
                          <strong>Despacho:</strong> {st.dispatch_notes} (por {st.dispatched_by})
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 5. Evidências Fotográficas */}
          {data.photo_evidences.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider bg-neutral-100 p-1.5 border-l-4 border-black">
                5. Registro Fotográfico com Carimbo de Data/Hora/Local
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {data.photo_evidences.map((photo, i) => (
                  <div key={i} className="border border-neutral-300 p-2 rounded space-y-1">
                    <img
                      src={photo.url}
                      alt={photo.caption}
                      className="w-full h-36 object-cover rounded"
                    />
                    <div className="text-[10px] text-neutral-600 font-mono">
                      <strong>Local:</strong> {photo.location} • <strong>Data:</strong> {new Date(photo.timestamp).toLocaleTimeString('pt-BR')}
                    </div>
                    <p className="text-xs text-black font-medium">{photo.caption}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 6. Assinaturas Formais dos 4 Níveis de Governança */}
          <div className="space-y-3 pt-4 border-t-2 border-black">
            <h3 className="text-xs font-bold uppercase tracking-wider">
              6. Termo de Encerramento & Assinaturas Digitais Autenticadas
            </h3>
            <p className="text-[11px] text-neutral-600 leading-relaxed">
              O presente Diário de Obra reflete com fidedignidade todas as ocorrências, condições climáticas, avanço físico e contingente de pessoal presentes no canteiro na data indicada, em conformidade com as exigências legais e contratuais.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              {data.workflow_signatures.map((sig) => (
                <div key={sig.step_number} className="border border-neutral-300 p-2.5 rounded text-center text-xs space-y-1 bg-neutral-50">
                  <span className="text-[9px] font-bold text-neutral-500 uppercase block">
                    Nível {sig.step_number} • {sig.role_title.split('.')[1]?.trim() || sig.role_title}
                  </span>
                  <div className="font-bold text-black pt-2 pb-1 border-b border-neutral-300">
                    {sig.approver_name}
                  </div>
                  <div className="text-[9px] font-mono text-neutral-500 pt-1">
                    {sig.status === 'APPROVED' ? (
                      <>
                        <span className="text-green-700 font-bold block">✓ ASSINADO DIGITALMENTE</span>
                        <span>{sig.approved_at ? new Date(sig.approved_at).toLocaleString('pt-BR') : 'Aprovado'}</span>
                      </>
                    ) : (
                      <span className="text-neutral-400 block">Pendente de assinatura</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Hash Criptográfico do Documento */}
            {version && (
              <div className="pt-2 text-center text-[9px] font-mono text-neutral-500 border-t border-neutral-200">
                🔒 SNAPSHOT IMUTÁVEL CONGELADO • HASH DE INTEGRIDADE SHA-256: {version.document_hash}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
