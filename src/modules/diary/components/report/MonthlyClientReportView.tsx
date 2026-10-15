// =====================================================================
// CONSTRUKORE DIÁRIO DE OBRA — RELATÓRIO MENSAL DE RELACIONAMENTO COM O CLIENTE (RMC)
// Documento Executivo de 2 Páginas A4 para Diretoria, Investidores e Clientes
// =====================================================================

import React, { useState, useEffect } from 'react';
import {
  Printer,
  ChevronLeft,
  Calendar,
  Building2,
  Users,
  CloudRain,
  CheckCircle2,
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  Camera,
  FileCheck,
  Award,
  Clock,
  Download,
  Share2,
} from 'lucide-react';
import { ProjectContext, MonthlyClientReportData } from '../../types/diary.types';
import { MonthlyClientReportService } from '../../services/monthlyClientReportService';

interface MonthlyClientReportViewProps {
  project: ProjectContext;
  initialMonth?: string; // "YYYY-MM"
  onClose: () => void;
}

export const MonthlyClientReportView: React.FC<MonthlyClientReportViewProps> = ({
  project,
  initialMonth,
  onClose,
}) => {
  const months = MonthlyClientReportService.getAvailableMonths();
  const [selectedMonth, setSelectedMonth] = useState<string>(
    initialMonth || (months[0] ? months[0].value : '2026-09')
  );
  const [reportData, setReportData] = useState<MonthlyClientReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    MonthlyClientReportService.buildMonthlyReport({
      project,
      mesAno: selectedMonth,
    }).then((data) => {
      if (isMounted) {
        setReportData(data);
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [project, selectedMonth]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/90 backdrop-blur-md overflow-y-auto flex flex-col items-center p-0 md:p-6 print:p-0 print:bg-white print:static print:overflow-visible">
      {/* Barra de Ações Superior (Oculta na impressão) */}
      <div className="w-full max-w-[210mm] bg-slate-800 text-white px-4 py-3 rounded-none md:rounded-t-xl flex flex-wrap items-center justify-between gap-3 shadow-xl print:hidden sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 transition-colors text-slate-200"
          >
            <ChevronLeft className="w-4 h-4" />
            Voltar
          </button>
          <div>
            <h2 className="text-sm font-bold flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-amber-400" />
              Relatório de Relacionamento com o Cliente (RMC)
            </h2>
            <p className="text-[11px] text-slate-300">
              Formato oficial A4 (2 páginas) consolidado por mês de referência
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Seletor de Mês */}
          <div className="flex items-center gap-1.5 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-700 text-xs">
            <Calendar className="w-3.5 h-3.5 text-amber-400" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent text-white font-medium focus:outline-none cursor-pointer text-xs"
            >
              {months.map((m) => (
                <option key={m.value} value={m.value} className="bg-slate-900 text-white">
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 transition-all shadow-md active:scale-95"
          >
            <Printer className="w-4 h-4" />
            Imprimir / Salvar PDF
          </button>
        </div>
      </div>

      {isLoading || !reportData ? (
        <div className="w-full max-w-[210mm] bg-white h-[297mm] flex flex-col items-center justify-center text-slate-500 shadow-2xl">
          <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-3"></div>
          <p className="text-sm font-medium">Consolidando diários do mês de referência...</p>
        </div>
      ) : (
        <div className="w-full max-w-[210mm] flex flex-col gap-6 print:gap-0 font-sans text-slate-900">
          {/* ============================================================== */}
          {/* PÁGINA 1 — SÍNTESE EXECUTIVA, EFETIVO, PRODUÇÃO & CLIMA        */}
          {/* ============================================================== */}
          <div className="bg-white w-full h-[297mm] max-h-[297mm] p-8 md:p-10 flex flex-col justify-between shadow-2xl print:shadow-none print:m-0 print:p-8 print:w-full print:h-[297mm] print:max-h-[297mm] print:break-after-page box-border overflow-hidden">
            <div>
              {/* Cabeçalho Oficial */}
              <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-950 text-white font-black flex items-center justify-center text-lg tracking-wider">
                    CK
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-black tracking-tight text-slate-900 uppercase">
                        ConstruKore Engenharia
                      </span>
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-300">
                        RMC MENSAL
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-slate-600">
                      Relatório de Relacionamento e Prestação de Contas ao Cliente
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[11px] font-bold text-slate-500 block">MÊS DE REFERÊNCIA</span>
                  <span className="text-base font-black text-amber-600 uppercase">
                    {reportData.mes_ano_formatado}
                  </span>
                </div>
              </div>

              {/* Dados da Obra & Contrato */}
              <div className="grid grid-cols-4 gap-2 bg-slate-50 border border-slate-200 rounded-lg p-3 my-4 text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 font-bold block uppercase">Empreendimento</span>
                  <span className="font-bold text-slate-900">{reportData.project_name}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-bold block uppercase">Cliente / Destinatário</span>
                  <span className="font-semibold text-slate-800">{reportData.client_name}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-bold block uppercase">Responsável Técnico</span>
                  <span className="font-semibold text-slate-800">{reportData.technical_lead_name}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-bold block uppercase">RDOs Auditados</span>
                  <span className="font-bold text-emerald-700">
                    {reportData.total_rdos_period} Diários ({reportData.approved_rdos_count} Aprovados)
                  </span>
                </div>
              </div>

              {/* 1. Resumo Executivo */}
              <div className="mb-4">
                <h3 className="text-xs font-black uppercase text-slate-800 tracking-wider flex items-center gap-1.5 border-b border-slate-200 pb-1 mb-2">
                  <Award className="w-3.5 h-3.5 text-amber-600" />
                  1. Síntese Executiva do Período
                </h3>
                <p className="text-[11px] leading-relaxed text-slate-700 bg-slate-50/60 p-2.5 rounded border border-slate-100 text-justify">
                  {reportData.executive_summary}
                </p>
              </div>

              {/* 2. Efetivo e Mobilização de Mão de Obra */}
              <div className="mb-4">
                <h3 className="text-xs font-black uppercase text-slate-800 tracking-wider flex items-center gap-1.5 border-b border-slate-200 pb-1 mb-2">
                  <Users className="w-3.5 h-3.5 text-indigo-600" />
                  2. Mobilização de Mão de Obra & Horas Trabalhadas
                </h3>
                <div className="grid grid-cols-4 gap-2">
                  <div className="border border-slate-200 rounded p-2 text-center bg-white shadow-xs">
                    <span className="text-[10px] text-slate-500 font-bold block uppercase">Média Diária</span>
                    <span className="text-xl font-black text-slate-900">
                      {reportData.workforce.average_workers_per_day}
                    </span>
                    <span className="text-[9px] text-slate-400 block">operários/dia</span>
                  </div>
                  <div className="border border-slate-200 rounded p-2 text-center bg-white shadow-xs">
                    <span className="text-[10px] text-slate-500 font-bold block uppercase">Pico de Efetivo</span>
                    <span className="text-xl font-black text-indigo-700">
                      {reportData.workforce.peak_workers}
                    </span>
                    <span className="text-[9px] text-slate-400 block">{reportData.workforce.peak_date}</span>
                  </div>
                  <div className="border border-slate-200 rounded p-2 text-center bg-white shadow-xs">
                    <span className="text-[10px] text-slate-500 font-bold block uppercase">Próprios vs Terceiros</span>
                    <span className="text-base font-bold text-slate-800">
                      {reportData.workforce.own_workers_avg} / {reportData.workforce.subcontractor_workers_avg}
                    </span>
                    <span className="text-[9px] text-slate-400 block">média ponderada</span>
                  </div>
                  <div className="border border-slate-200 rounded p-2 text-center bg-white shadow-xs">
                    <span className="text-[10px] text-slate-500 font-bold block uppercase">Homens-Hora Totais</span>
                    <span className="text-xl font-black text-emerald-700">
                      {reportData.workforce.total_man_hours.toLocaleString('pt-BR')} h
                    </span>
                    <span className="text-[9px] text-slate-400 block">jornada produtiva</span>
                  </div>
                </div>
              </div>

              {/* 3. Balanço de Intempéries & Clima Pericial */}
              <div className="mb-4">
                <h3 className="text-xs font-black uppercase text-slate-800 tracking-wider flex items-center gap-1.5 border-b border-slate-200 pb-1 mb-2">
                  <CloudRain className="w-3.5 h-3.5 text-blue-600" />
                  3. Balanço Climático & Intempéries Contratuais
                </h3>
                <div className="grid grid-cols-4 gap-2 text-xs">
                  <div className="bg-slate-50 border border-slate-200 rounded p-2">
                    <span className="text-[10px] text-slate-500 font-bold block">DIAS DE SOL / SECO</span>
                    <span className="text-sm font-bold text-amber-700">{reportData.weather.days_clear} dias</span>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded p-2">
                    <span className="text-[10px] text-slate-500 font-bold block">DIAS NUBLADOS</span>
                    <span className="text-sm font-bold text-slate-700">{reportData.weather.days_cloudy} dias</span>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded p-2">
                    <span className="text-[10px] text-slate-500 font-bold block">DIAS DE PRECIPITAÇÃO</span>
                    <span className="text-sm font-bold text-blue-700">{reportData.weather.days_rain} dias ({reportData.weather.accumulated_rain_mm} mm)</span>
                  </div>
                  <div className="bg-blue-50/80 border border-blue-200 rounded p-2">
                    <span className="text-[10px] text-blue-800 font-bold block">CHUVA CONTRATUAL IMPEDITIVA</span>
                    <span className="text-sm font-black text-blue-900">{reportData.weather.contractual_rain_days} dias ({reportData.weather.hours_lost_to_rain}h perdidas)</span>
                  </div>
                </div>
              </div>

              {/* 4. Avanço Físico das Principais Disciplinas */}
              <div className="mb-2">
                <h3 className="text-xs font-black uppercase text-slate-800 tracking-wider flex items-center gap-1.5 border-b border-slate-200 pb-1 mb-2">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                  4. Avanço Físico das Principais Frentes de Trabalho
                </h3>
                <div className="border border-slate-200 rounded-lg overflow-hidden text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-slate-100 text-[10px] font-bold text-slate-600 uppercase border-b border-slate-200">
                      <tr>
                        <th className="p-2">WBS</th>
                        <th className="p-2">Frente / Serviço</th>
                        <th className="p-2 text-right">Planejado</th>
                        <th className="p-2 text-right">Executado</th>
                        <th className="p-2 text-center">% Avanço</th>
                        <th className="p-2 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-[11px]">
                      {reportData.production.map((p) => (
                        <tr key={p.task_id} className="hover:bg-slate-50/50">
                          <td className="p-2 font-mono text-[10px] text-slate-500 font-bold">{p.wbs_code}</td>
                          <td className="p-2 font-semibold text-slate-900">{p.service_name}</td>
                          <td className="p-2 text-right font-medium text-slate-600">
                            {p.planned_quantity} {p.uom}
                          </td>
                          <td className="p-2 text-right font-bold text-slate-900">
                            {p.executed_quantity} {p.uom}
                          </td>
                          <td className="p-2 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <div className="w-12 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                                <div
                                  className="bg-emerald-600 h-1.5 rounded-full"
                                  style={{ width: `${Math.min(100, p.progress_pct)}%` }}
                                ></div>
                              </div>
                              <span className="font-bold text-[10px]">{p.progress_pct}%</span>
                            </div>
                          </td>
                          <td className="p-2 text-center">
                            <span
                              className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase ${
                                p.status === 'CONCLUIDO'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : p.status === 'NO_PRAZO'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {p.status.replace('_', ' ')}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Rodapé da Página 1 */}
            <div className="border-t border-slate-200 pt-2 flex items-center justify-between text-[10px] text-slate-400">
              <span className="font-mono">{reportData.document_hash}</span>
              <span className="font-medium">ConstruKore RDO — Página 1 de 2</span>
            </div>
          </div>

          {/* ============================================================== */}
          {/* PÁGINA 2 — INTERCORRÊNCIAS, EVIDÊNCIAS FOTOGRÁFICAS & TERMOS   */}
          {/* ============================================================== */}
          <div className="bg-white w-full h-[297mm] max-h-[297mm] p-8 md:p-10 flex flex-col justify-between shadow-2xl print:shadow-none print:m-0 print:p-8 print:w-full print:h-[297mm] print:max-h-[297mm] print:break-before-page box-border overflow-hidden">
            <div>
              {/* Mini Cabeçalho da Página 2 */}
              <div className="flex items-center justify-between border-b border-slate-300 pb-2 mb-4">
                <span className="text-xs font-bold text-slate-700">
                  {reportData.project_name} — Relatório Mensal ({reportData.mes_ano_formatado})
                </span>
                <span className="text-[10px] font-bold text-slate-500 uppercase">
                  Evidências Fotográficas & Governança
                </span>
              </div>

              {/* 5. Intercorrências, Desvios e Planos de Ação */}
              <div className="mb-4">
                <h3 className="text-xs font-black uppercase text-slate-800 tracking-wider flex items-center gap-1.5 border-b border-slate-200 pb-1 mb-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  5. Gestão de Intercorrências & Ações Corretivas Adotadas
                </h3>
                <div className="border border-slate-200 rounded-lg overflow-hidden text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-slate-100 text-[10px] font-bold text-slate-600 uppercase border-b border-slate-200">
                      <tr>
                        <th className="p-2 w-20">Data</th>
                        <th className="p-2">Intercorrência / Fato</th>
                        <th className="p-2 w-24">Severidade</th>
                        <th className="p-2">Plano de Mitigação / Solução Adotada</th>
                        <th className="p-2 text-center w-20">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-[11px]">
                      {reportData.occurrences.map((o) => (
                        <tr key={o.id}>
                          <td className="p-2 font-mono text-[10px] text-slate-500">{o.date}</td>
                          <td className="p-2 font-semibold text-slate-800">{o.title}</td>
                          <td className="p-2">
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                                o.severity === 'critical' || o.severity === 'high'
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {o.severity}
                            </span>
                          </td>
                          <td className="p-2 text-[10px] text-slate-600">{o.solution_notes}</td>
                          <td className="p-2 text-center">
                            <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                              RESOLVIDA
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 6. Curadoria Fotográfica de Evidências */}
              <div className="mb-4">
                <h3 className="text-xs font-black uppercase text-slate-800 tracking-wider flex items-center gap-1.5 border-b border-slate-200 pb-1 mb-2">
                  <Camera className="w-3.5 h-3.5 text-slate-700" />
                  6. Painel de Evidências Fotográficas do Mês
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {reportData.photo_highlights.slice(0, 4).map((photo) => (
                    <div
                      key={photo.id}
                      className="border border-slate-200 rounded-lg overflow-hidden bg-slate-50 flex flex-col"
                    >
                      <div className="h-28 bg-slate-200 overflow-hidden relative">
                        <img
                          src={photo.url}
                          alt={photo.title}
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute bottom-1 right-1 bg-slate-950/80 text-white text-[9px] font-mono px-1.5 py-0.5 rounded">
                          {photo.date}
                        </span>
                      </div>
                      <div className="p-2 flex-1 flex flex-col justify-between">
                        <p className="text-[10px] font-bold text-slate-800 line-clamp-1">{photo.title}</p>
                        <div className="flex items-center justify-between text-[9px] text-slate-500 mt-1">
                          <span className="truncate max-w-[120px]">{photo.location}</span>
                          <span className="font-semibold text-slate-700">{photo.service_name}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 7. Termos de Validação e Assinaturas Digitais */}
              <div className="mt-4 pt-4 border-t border-slate-200">
                <h3 className="text-xs font-black uppercase text-slate-800 tracking-wider flex items-center gap-1.5 mb-4">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  7. Declaração de Conformidade Técnica & Aprovação
                </h3>
                <p className="text-[10px] text-slate-500 mb-6 text-justify">
                  Certificamos que as informações aqui contidas representam fielmente os eventos diários, efetivo de mão de obra e controle tecnológico executados no empreendimento durante o período de referência, em conformidade com as normas técnicas da ABNT e o manual de garantia da obra.
                </p>

                <div className="grid grid-cols-2 gap-8 pt-4">
                  <div className="border-t border-slate-400 pt-2 text-center">
                    <p className="text-xs font-bold text-slate-900">{reportData.technical_lead_name}</p>
                    <p className="text-[10px] text-slate-500">Engenheiro(a) Responsável Técnico(a)</p>
                    <div className="mt-1 flex items-center justify-center gap-1 text-[9px] text-emerald-700 font-semibold">
                      <CheckCircle2 className="w-3 h-3" />
                      Assinado Digitalmente via ConstruKore RDO
                    </div>
                  </div>

                  <div className="border-t border-slate-400 pt-2 text-center">
                    <p className="text-xs font-bold text-slate-900">{reportData.client_name}</p>
                    <p className="text-[10px] text-slate-500">Representante do Cliente / Fiscalização</p>
                    <div className="mt-1 flex items-center justify-center gap-1 text-[9px] text-indigo-700 font-semibold">
                      <ShieldCheck className="w-3 h-3" />
                      Protocolo de Recebimento e Aceite Eletrônico
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Rodapé da Página 2 */}
            <div className="border-t border-slate-200 pt-2 flex items-center justify-between text-[10px] text-slate-400">
              <span className="font-mono">{reportData.document_hash}</span>
              <span className="font-medium">ConstruKore RDO — Página 2 de 2</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
