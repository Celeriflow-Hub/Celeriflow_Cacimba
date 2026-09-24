"use client";

import { Badge } from "@/components/ui/badge";
import { 
  ShieldCheck, 
  FileCheck2, 
  QrCode, 
  Scale, 
  KeyRound, 
  Database, 
  ArrowUpRight,
  Sparkles
} from "lucide-react";

export function GovernmentAI() {
  const integrations = [
    {
      title: "PNCP — Portal Nacional de Contratações Públicas",
      norma: "Lei Federal nº 14.133/2021",
      icon: FileCheck2,
      color: "from-blue-500 to-indigo-600",
      textColor: "text-blue-400",
      description: "Integração via API REST com o Governo Federal para publicação e homologação automática de editais, avisos de licitação, atas e contratos.",
      status: "100% Homologado",
    },
    {
      title: "SIAFIC & Matriz de Saldos Contábeis (MSC)",
      norma: "Decreto Federal nº 10.540/2020",
      icon: Scale,
      color: "from-emerald-500 to-teal-600",
      textColor: "text-emerald-400",
      description: "Sistema Único e Integrado de Execução Orçamentária alinhado ao PCASP com geração da MSC do SICONFI para o Tesouro Nacional.",
      status: "STN Conforme",
    },
    {
      title: "Arrecadação Inteligente com Pix Dinâmico",
      norma: "Padrão FEBRABAN / Banco Central",
      icon: QrCode,
      color: "from-teal-500 to-emerald-500",
      textColor: "text-teal-400",
      description: "Geração instantânea de QR Code Pix em guias de IPTU, ISS e Dívida Ativa com baixa automática em tempo real e conciliação bancária sem arquivos manuais.",
      status: "Baixa em 3 Segundos",
    },
    {
      title: "eSocial & EFD-Reinf do Setor Público",
      norma: "Receita Federal / MTE",
      icon: Database,
      color: "from-purple-500 to-pink-600",
      textColor: "text-purple-400",
      description: "Motor gerador dos eventos periódicos e não periódicos dos servidores municipais com protocolo de validação e arquivo digital de retenções.",
      status: "Eventos S-1000 a S-2400",
    },
    {
      title: "Assinatura Digital ICP-Brasil & Gov.br",
      norma: "Lei Federal nº 14.063/2020",
      icon: KeyRound,
      color: "from-amber-500 to-orange-600",
      textColor: "text-amber-400",
      description: "Assinatura qualificada A1/A3 e integração com Gov.br em portarias, leis, pareceres e despacho de processos administrativos.",
      status: "Validade Jurídica Total",
    },
    {
      title: "Remessas para Tribunais de Contas (TCE)",
      norma: "Instruções Normativas dos TCEs",
      icon: ShieldCheck,
      color: "from-cyan-500 to-blue-600",
      textColor: "text-cyan-400",
      description: "Gerador automatizado das prestações de contas mensais e anuais nos formatos exigidos pelos Tribunais de Contas Estaduais.",
      status: "Auditoria Simplificada",
    },
  ];

  return (
    <section id="regulatorio" className="py-24 bg-slate-950 text-slate-100 border-b border-slate-800 relative overflow-hidden">
      {/* Glow Effects */}
      <div className="absolute top-1/2 left-0 w-96 h-96 bg-blue-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Badge variant="outline" className="mb-4 px-4 py-1 border-blue-500/40 bg-blue-950/60 text-blue-300 font-medium">
            <Sparkles className="h-3.5 w-3.5 mr-1.5 text-blue-400" />
            Conformidade Regulatória & Inteligência Federal
          </Badge>
          <h2 className="font-heading text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl text-slate-100 mb-6">
            Construído para Vencer Licitações e Garantir Total Segurança Jurídica.
          </h2>
          <p className="text-slate-400 text-lg leading-relaxed">
            O CeleriFlow já nasce 100% adequado às legislações federais vigentes. Elimine o risco de rejeição de contas no TCE e modernize a arrecadação da prefeitura.
          </p>
        </div>

        {/* Integration Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {integrations.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div 
                key={idx}
                className="group relative p-6 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-blue-500/10"
              >
                {/* Header Icon & Status Pill */}
                <div className="flex items-center justify-between mb-5">
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${item.color} shadow-lg text-white`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <span className={`text-xs font-mono font-semibold px-2.5 py-1 rounded-full bg-slate-950 border border-slate-800 ${item.textColor}`}>
                    {item.status}
                  </span>
                </div>

                {/* Content */}
                <h3 className="font-bold text-lg text-slate-100 mb-1 group-hover:text-blue-300 transition-colors">
                  {item.title}
                </h3>
                <span className="text-xs font-mono text-slate-400 block mb-3 font-semibold">
                  {item.norma}
                </span>
                <p className="text-sm text-slate-400 leading-relaxed">
                  {item.description}
                </p>

                {/* Footer link */}
                <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs font-medium text-slate-400 group-hover:text-slate-200">
                  <span>Requisito de Edital Cumprido</span>
                  <ArrowUpRight className="h-4 w-4 text-blue-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
