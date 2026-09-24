"use client";

import { useState } from "react";
import { 
  BarChart3, 
  TrendingUp, 
  FileText, 
  Building2, 
  QrCode,
  Activity
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function DashboardShowcase() {
  const [activeTab, setActiveTab] = useState<"geral" | "financeiro" | "protocolos">("geral");

  return (
    <section id="demonstracao" className="py-24 bg-slate-900 text-slate-100 border-b border-slate-800 relative overflow-hidden">
      {/* Glow Effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[850px] h-[450px] bg-blue-600/10 rounded-full blur-[160px] pointer-events-none" />

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Badge variant="outline" className="mb-4 px-4 py-1 border-blue-500/40 bg-blue-950/60 text-blue-300 font-medium">
            <Activity className="h-3.5 w-3.5 mr-1.5 text-emerald-400" />
            Cockpit Executivo em Tempo Real
          </Badge>
          <h2 className="font-heading text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl text-slate-100 mb-6">
            Visão 360° da Gestão Municipal em Tempo Real.
          </h2>
          <p className="text-slate-400 text-lg leading-relaxed">
            Substitua relatórios em papel por um centro de comando inteligente. Acompanhe a arrecadação Pix, o cumprimento de SLAs de atendimento, empenhos e liquidações em uma única tela.
          </p>
        </div>

        {/* Mockup Frame Container */}
        <div className="max-w-6xl mx-auto rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl overflow-hidden backdrop-blur-xl">
          
          {/* Mockup Header Bar */}
          <div className="bg-slate-900 px-6 py-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block" />
                <span className="w-3 h-3 rounded-full bg-yellow-500/80 inline-block" />
                <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
              </div>
              <div className="h-4 w-px bg-slate-800 mx-2 hidden sm:block" />
              <span className="text-xs font-semibold font-mono text-slate-300 flex items-center gap-2">
                <Building2 className="h-4 w-4 text-blue-400" />
                PREFEITURA MUNICIPAL — PAINEL DE CONTROLE EXECUTIVO
              </span>
            </div>

            {/* Dashboard Nav Tabs */}
            <div className="flex items-center bg-slate-950 rounded-xl p-1 border border-slate-800 text-xs font-medium">
              <button 
                onClick={() => setActiveTab("geral")}
                className={`px-3.5 py-1.5 rounded-lg transition-all ${
                  activeTab === "geral" ? "bg-blue-600 text-white font-bold shadow-md shadow-blue-500/20" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Visão Geral 360°
              </button>
              <button 
                onClick={() => setActiveTab("financeiro")}
                className={`px-3.5 py-1.5 rounded-lg transition-all ${
                  activeTab === "financeiro" ? "bg-blue-600 text-white font-bold shadow-md shadow-blue-500/20" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Finanças & Pix
              </button>
              <button 
                onClick={() => setActiveTab("protocolos")}
                className={`px-3.5 py-1.5 rounded-lg transition-all ${
                  activeTab === "protocolos" ? "bg-blue-600 text-white font-bold shadow-md shadow-blue-500/20" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Processos & SLA
              </button>
            </div>
          </div>

          {/* Mockup Dashboard Body */}
          <div className="p-6 md:p-8 space-y-6">
            
            {/* Top KPI Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between hover:border-blue-500/40 transition-colors">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-semibold">Processos Eletrônicos</span>
                  <FileText className="h-4 w-4 text-blue-400" />
                </div>
                <div className="text-2xl font-bold font-mono text-slate-100">14.890</div>
                <div className="mt-2 text-[11px] text-emerald-400 flex items-center gap-1 font-mono">
                  <TrendingUp className="h-3 w-3" />
                  <span>99,4% dentro do SLA</span>
                </div>
              </div>

              <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between hover:border-emerald-500/40 transition-colors">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-semibold">Arrecadação Pix Dinâmico</span>
                  <QrCode className="h-4 w-4 text-emerald-400" />
                </div>
                <div className="text-2xl font-bold font-mono text-emerald-400">R$ 3.892.450</div>
                <div className="mt-2 text-[11px] text-emerald-400 flex items-center gap-1 font-mono">
                  <span>Baixa Instantânea no Banco</span>
                </div>
              </div>

              <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between hover:border-teal-500/40 transition-colors">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-semibold">Execução Orçamentária</span>
                  <BarChart3 className="h-4 w-4 text-teal-400" />
                </div>
                <div className="text-2xl font-bold font-mono text-slate-100">84,2%</div>
                <div className="mt-2 text-[11px] text-teal-300 font-mono">
                  Conformidade SIAFIC STN
                </div>
              </div>

              <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between hover:border-purple-500/40 transition-colors">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-semibold">Atendimentos no e-SUS</span>
                  <Activity className="h-4 w-4 text-purple-400" />
                </div>
                <div className="text-2xl font-bold font-mono text-slate-100">42.150</div>
                <div className="mt-2 text-[11px] text-purple-300 font-mono">
                  Prontuários Sincronizados
                </div>
              </div>

            </div>

            {/* Dashboard Graphical Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Main Chart Graphic Simulation */}
              <div className="lg:col-span-2 p-6 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h4 className="font-bold text-slate-100 text-base">Evolução Mensal de Arrecadação & Despesas</h4>
                    <p className="text-xs text-slate-400">Comparativo em tempo real via Tesouraria CeleriFlow</p>
                  </div>
                  <span className="text-xs font-mono text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded border border-emerald-800">
                    Sincronizado via Webhook
                  </span>
                </div>

                {/* Simulated Visual Graph Bar Chart */}
                <div className="h-48 flex items-end justify-between gap-3 pt-6 px-2 border-b border-slate-800 pb-2">
                  {[
                    { mes: "Jan", val1: 65, val2: 45 },
                    { mes: "Fev", val1: 78, val2: 52 },
                    { mes: "Mar", val1: 85, val2: 60 },
                    { mes: "Abr", val1: 72, val2: 58 },
                    { mes: "Mai", val1: 90, val2: 64 },
                    { mes: "Jun", val1: 95, val2: 70 },
                  ].map((bar, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                      <div className="w-full flex items-end justify-center gap-1.5 h-full">
                        <div 
                          style={{ height: `${bar.val1}%` }} 
                          className="w-1/2 bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-md hover:brightness-125 transition-all"
                        />
                        <div 
                          style={{ height: `${bar.val2}%` }} 
                          className="w-1/2 bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t-md hover:brightness-125 transition-all"
                        />
                      </div>
                      <span className="text-[11px] font-mono text-slate-400">{bar.mes}</span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 pt-4">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded bg-blue-500 inline-block" /> Receita Prevista vs Arrecadada
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded bg-emerald-500 inline-block" /> Liquidações Efetivadas
                    </span>
                  </div>
                </div>
              </div>

              {/* Live Simulated Event Feed */}
              <div className="p-6 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-bold text-slate-100 text-sm">Feed de Eventos em Tempo Real</h4>
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/80">
                      <div className="flex justify-between font-mono text-[11px] text-slate-400 mb-1">
                        <span className="text-emerald-400 font-semibold">TRIBUTAÇÃO</span>
                        <span>Agora mesmo</span>
                      </div>
                      <p className="text-slate-200 font-medium">Guia IPTU nº 84.912 paga via Pix Dinâmico (R$ 1.250,00)</p>
                    </div>

                    <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/80">
                      <div className="flex justify-between font-mono text-[11px] text-slate-400 mb-1">
                        <span className="text-blue-400 font-semibold">PROCESSO ELETRÔNICO</span>
                        <span>Há 3 minutos</span>
                      </div>
                      <p className="text-slate-200 font-medium">Portaria nº 402/2026 assinada digitalmente com Gov.br</p>
                    </div>

                    <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/80">
                      <div className="flex justify-between font-mono text-[11px] text-slate-400 mb-1">
                        <span className="text-teal-400 font-semibold">PNCP COMPRAS</span>
                        <span>Há 12 minutos</span>
                      </div>
                      <p className="text-slate-200 font-medium">Pregão nº 08/2026 homologado e publicado no PNCP</p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800 text-center">
                  <span className="text-[11px] text-slate-400 font-mono">
                    Auditoria Inalterável em Registro Append-Only
                  </span>
                </div>
              </div>

            </div>

          </div>
        </div>

      </div>
    </section>
  );
}
