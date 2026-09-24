"use client";

import { useState } from "react";
import { 
  Landmark, 
  FileText, 
  Users, 
  Building2, 
  Receipt, 
  ShoppingCart, 
  Package, 
  UserCheck, 
  FolderCheck, 
  MessageSquare, 
  BarChart3, 
  Activity, 
  GraduationCap, 
  HardHat, 
  Trees, 
  ArrowRight,
  Cpu
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";

export function EcosystemMatrix() {
  const [activePillar, setActivePillar] = useState(0);

  const pillars = [
    {
      id: "financeiro",
      title: "Finanças & Orçamento",
      subtitle: "Execução SIAFIC & Arrecadação Pix",
      icon: Landmark,
      color: "from-blue-600 to-indigo-600",
      accentBg: "border-blue-500/30 bg-blue-950/40 text-blue-300",
      badge: "SIAFIC 100% Conforme",
      domains: [
        {
          name: "Financeiro & Tesouraria",
          desc: "Empenhos, liquidações, pagamentos, retenções na fonte, movimentação bancária e conciliação de contas.",
          tag: "Decreto 10.540/20",
          icon: Landmark
        },
        {
          name: "Tributação & Pix Dinâmico",
          desc: "Cadastro imobiliário (BCT), econômico (BCE), emissão de guias com QR Code Pix, dívida ativa, IPTU e ISS.",
          tag: "Pix em 3s",
          icon: Receipt
        },
        {
          name: "Compras, Licitações & PNCP",
          desc: "Solicitações, atas de registro de preços, cotações e publicação automática na API do PNCP (Lei 14.133/21).",
          tag: "Lei 14.133/21",
          icon: ShoppingCart
        },
        {
          name: "Patrimônio & Almoxarifado",
          desc: "Inventário de bens móveis e imóveis, tombamento, depreciação acumulada e controle de estoque de materiais.",
          tag: "Depreciação Real",
          icon: Package
        }
      ]
    },
    {
      id: "administracao",
      title: "Governo Digital & RH",
      subtitle: "Processo Eletrônico 100% Sem Papel",
      icon: FileText,
      color: "from-emerald-600 to-teal-600",
      accentBg: "border-emerald-500/30 bg-emerald-950/40 text-emerald-300",
      badge: "Zero Papel",
      domains: [
        {
          name: "Protocolo & Tramitação",
          desc: "Abertura de processos, numeração sequencial inalterável, despachos e acompanhamento de SLA em tempo real.",
          tag: "SLA Automático",
          icon: FileText
        },
        {
          name: "Processo Eletrônico & Assinatura",
          desc: "Fluxos 100% digitais com assinatura ICP-Brasil / Gov.br, validade jurídica e auditoria inalterável.",
          tag: "Lei 14.063/20",
          icon: FolderCheck
        },
        {
          name: "RH & eSocial Público",
          desc: "Prontuário do servidor, folha de pagamento, ponto eletrônico, licenças e geração dos eventos do eSocial.",
          tag: "eSocial S-1000",
          icon: UserCheck
        },
        {
          name: "Gestão Documental (GED)",
          desc: "Indexação inteligente, controle de versionamento, guarda digital e busca por metadados.",
          tag: "Arquivística",
          icon: FolderCheck
        }
      ]
    },
    {
      id: "governanca",
      title: "Cidadão & Transparência",
      subtitle: "Participação Cidadã & Ouvidoria LAI",
      icon: MessageSquare,
      color: "from-purple-600 to-pink-600",
      accentBg: "border-purple-500/30 bg-purple-950/40 text-purple-300",
      badge: "Adequação LAI & LGPD",
      domains: [
        {
          name: "Portal da Transparência",
          desc: "Publicação automática de receitas, despesas, empenhos, licitações, contratos e remuneração de servidores.",
          tag: "Lei 12.527/11",
          icon: BarChart3
        },
        {
          name: "Ouvidoria & e-SIC",
          desc: "Atendimento ao cidadão, controle de prazos da LAI, pesquisas de satisfação e estatísticas de resolutividade.",
          tag: "Transparência Passiva",
          icon: MessageSquare
        },
        {
          name: "Carta de Serviços ao Cidadão",
          desc: "Catálogo unificado de serviços municipais, agendamento prévio e acompanhamento de solicitações.",
          tag: "Desburocratização",
          icon: Users
        },
        {
          name: "Diário Oficial Eletrônico",
          desc: "Publicação oficial automatizada com assinatura digital, busca por palavras-chave e acervo histórico.",
          tag: "Diário Oficial",
          icon: Building2
        }
      ]
    },
    {
      id: "servicos-setoriais",
      title: "Saúde, Educação & Obras",
      subtitle: "Gestão Operacional de Ponta a Ponta",
      icon: Activity,
      color: "from-amber-500 to-orange-600",
      accentBg: "border-amber-500/30 bg-amber-950/40 text-amber-300",
      badge: "Sistemas Finalísticos",
      domains: [
        {
          name: "Saúde & Atenção Básica",
          desc: "Cadastro de pacientes, agendamentos, atendimento médico em UBS, dispensação de medicamentos e vacinas.",
          tag: "e-SUS APS Conforme",
          icon: Activity
        },
        {
          name: "Educação & Diário Eletrônico",
          desc: "Gestão de escolas, matrículas, diário de classe do professor, frequência escolar e transporte de alunos.",
          tag: "Educacenso / INEP",
          icon: GraduationCap
        },
        {
          name: "Obras, Medições & Diário",
          desc: "Acompanhamento de obras públicas, diário de obra com geolocalização, medições e aditivos contratuais.",
          tag: "Medições em Tempo Real",
          icon: HardHat
        },
        {
          name: "Meio Ambiente & Licenciamento",
          desc: "Emissão de licenças ambientais, fiscalização de empreendimentos, denúncias e controle de resíduos.",
          tag: "Licença Digital",
          icon: Trees
        }
      ]
    }
  ];

  const currentPillar = pillars[activePillar];

  return (
    <section id="modulos" className="py-24 bg-slate-950 text-slate-100 border-b border-slate-800 relative overflow-hidden">
      {/* Dynamic Glow Background */}
      <div className="absolute top-1/3 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-10 left-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-[150px] pointer-events-none" />

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        
        {/* Section Title */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Badge variant="outline" className="mb-4 px-4 py-1 border-blue-500/40 bg-blue-950/60 text-blue-300 font-medium">
            <Cpu className="h-3.5 w-3.5 mr-1.5 text-blue-400" />
            Ecossistema Completo • 24+ Módulos Conectados
          </Badge>
          <h2 className="font-heading text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl text-slate-100 mb-6">
            Todas as Secretarias Municipais Trabalhando em Sintonia.
          </h2>
          <p className="text-slate-400 text-lg leading-relaxed">
            Elimine a fragmentação e os sistemas isolados. O CeleriFlow integra a prefeitura de ponta a ponta com dados compartilhados em tempo real.
          </p>
        </div>

        {/* Pillar Filter Selector Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-12 max-w-5xl mx-auto">
          {pillars.map((pillar, idx) => {
            const Icon = pillar.icon;
            const isActive = activePillar === idx;
            return (
              <button
                key={pillar.id}
                onClick={() => setActivePillar(idx)}
                className={`flex items-center gap-2.5 px-5 py-3 rounded-xl font-semibold text-sm transition-all duration-300 ${
                  isActive 
                    ? `bg-gradient-to-r ${pillar.color} text-white shadow-lg shadow-blue-500/20 scale-105 border border-white/20`
                    : "bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? "text-white" : "text-slate-400"}`} />
                <span>{pillar.title}</span>
              </button>
            );
          })}
        </div>

        {/* Selected Pillar Content Box */}
        <div className="max-w-6xl mx-auto">
          
          {/* Subheader Banner */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-2xl bg-slate-900/90 border border-slate-800 mb-8 backdrop-blur-xl">
            <div>
              <span className="text-xs font-mono font-semibold uppercase tracking-wider text-blue-400 block mb-1">
                {currentPillar.subtitle}
              </span>
              <h3 className="font-bold text-2xl text-slate-100">
                {currentPillar.title}
              </h3>
            </div>
            <span className={`px-3.5 py-1.5 rounded-full text-xs font-semibold font-mono border ${currentPillar.accentBg}`}>
              {currentPillar.badge}
            </span>
          </div>

          {/* Modules Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {currentPillar.domains.map((domain, idx) => {
              const Icon = domain.icon;
              return (
                <div
                  key={idx}
                  className="group relative p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-blue-500/50 hover:bg-slate-900 backdrop-blur-xl transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 group-hover:border-blue-500/40 text-blue-400 transition-colors">
                        <Icon className="h-6 w-6" />
                      </div>
                      <span className="text-[11px] font-mono font-semibold px-2.5 py-1 rounded bg-slate-950 text-slate-300 border border-slate-800">
                        {domain.tag}
                      </span>
                    </div>

                    <h4 className="font-bold text-xl text-slate-100 mb-2 group-hover:text-blue-300 transition-colors">
                      {domain.name}
                    </h4>
                    <p className="text-sm text-slate-400 leading-relaxed">
                      {domain.desc}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-800/60 flex items-center justify-between text-xs font-semibold text-blue-400 group-hover:text-blue-300">
                    <span>Módulo Integrado ao Core</span>
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Action Footer */}
          <div className="mt-12 text-center">
            <Link
              href="#contato"
              className={buttonVariants({
                size: "lg",
                className: "bg-slate-900 border border-slate-700 hover:border-slate-500 text-slate-100 font-bold px-8 h-13 rounded-xl shadow-lg"
              })}
            >
              Conhecer Todos os 24 Domínios Mapeados
              <ArrowRight className="ml-2 h-5 w-5 text-blue-400" />
            </Link>
          </div>

        </div>

      </div>
    </section>
  );
}
