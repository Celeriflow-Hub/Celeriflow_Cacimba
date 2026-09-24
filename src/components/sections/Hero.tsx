"use client";

import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { 
  ArrowRight, 
  ShieldCheck, 
  Zap, 
  Sparkles, 
  Cpu, 
  Activity, 
  FileCheck2, 
  TrendingUp, 
  QrCode,
  Lock,
  Play
} from "lucide-react";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-slate-950 text-slate-100 pt-20 pb-20 md:pt-28 md:pb-28 border-b border-slate-800">
      
      {/* High-Tech Background Glows & Grid Mesh */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_50%_0%,rgba(59,130,246,0.18),transparent_65%)]" />
      <div className="absolute top-1/3 right-1/4 z-0 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/4 z-0 w-[450px] h-[450px] bg-blue-600/15 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30" />

      <div className="container relative z-10 mx-auto px-4 md:px-6 flex flex-col items-center text-center">
        
        {/* Animated Top Pill */}
        <div className="inline-flex items-center gap-2.5 rounded-full border border-blue-500/30 bg-slate-900/80 px-4 py-2 text-xs md:text-sm font-medium backdrop-blur-md shadow-lg shadow-blue-500/10 text-blue-300 mb-8 animate-fade-in">
          <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
          <Sparkles className="h-4 w-4 text-emerald-400" />
          <span className="font-semibold text-slate-100">CeleriFlow Gov 2026</span>
          <span className="h-3 w-px bg-slate-700 mx-1" />
          <span className="text-slate-300 font-normal">SIAFIC, PNCP & Pix Dinâmico Nativos</span>
        </div>
        
        {/* Main Headline */}
        <h1 className="max-w-5xl font-heading text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight leading-[1.1] text-slate-100">
          Revolucione a Gestão Pública com o ERP de{" "}
          <span className="bg-gradient-to-r from-blue-400 via-emerald-400 to-teal-300 bg-clip-text text-transparent drop-shadow-sm">
            Alta Performance em Nuvem.
          </span>
        </h1>
        
        {/* Subheadline */}
        <p className="mt-6 max-w-3xl text-base sm:text-lg md:text-xl text-slate-400 leading-relaxed font-normal">
          Unifique Finanças, Tesouraria, Processo Eletrônico 100% sem papel, Tributação com Pix Dinâmico, Compras PNCP, Saúde e Educação em uma única plataforma hiperconectada.
        </p>
        
        {/* Call to Actions */}
        <div className="mt-10 flex flex-col sm:flex-row gap-4 w-full sm:w-auto items-center justify-center">
          <Link 
            href="#contato" 
            className={buttonVariants({ 
              size: "lg", 
              className: "w-full sm:w-auto h-14 px-8 text-base font-bold bg-gradient-to-r from-blue-600 via-blue-500 to-emerald-500 hover:from-blue-500 hover:to-emerald-400 text-white shadow-xl shadow-blue-500/25 border border-blue-400/30 rounded-xl transition-all duration-300 transform hover:-translate-y-0.5" 
            })}
          >
            Solicitar Demonstração Executiva
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
          <Link 
            href="#demonstracao" 
            className={buttonVariants({ 
              size: "lg", 
              variant: "outline", 
              className: "w-full sm:w-auto h-14 px-8 text-base font-semibold border-slate-700 bg-slate-900/60 hover:bg-slate-800 text-slate-200 hover:text-white rounded-xl backdrop-blur-md" 
            })}
          >
            <Play className="mr-2 h-4 w-4 text-emerald-400 fill-emerald-400" />
            Explorar Painel 360°
          </Link>
        </div>

        {/* Feature Highlights Grid Pill Bar */}
        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 max-w-4xl mx-auto w-full text-xs md:text-sm">
          <div className="flex items-center justify-center gap-2 p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm text-slate-300">
            <Zap className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>Processos 100% Digitais</span>
          </div>
          <div className="flex items-center justify-center gap-2 p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm text-slate-300">
            <ShieldCheck className="h-4 w-4 text-blue-400 shrink-0" />
            <span>SIAFIC Dec. 10.540/20</span>
          </div>
          <div className="flex items-center justify-center gap-2 p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm text-slate-300">
            <QrCode className="h-4 w-4 text-teal-400 shrink-0" />
            <span>Pix Dinâmico Arrecadação</span>
          </div>
          <div className="flex items-center justify-center gap-2 p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm text-slate-300">
            <FileCheck2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>PNCP Lei 14.133/21</span>
          </div>
        </div>

        {/* Interactive Futuristic Live Console / Dashboard Frame Preview */}
        <div className="mt-16 w-full max-w-5xl rounded-2xl border border-slate-800 bg-slate-900/90 shadow-2xl shadow-blue-900/20 p-2 sm:p-4 text-left relative overflow-hidden backdrop-blur-xl group hover:border-slate-700 transition-all">
          
          {/* Top Window Bar */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-950/60 rounded-t-xl mb-4">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-red-500/80" />
              <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
              <div className="h-3 w-3 rounded-full bg-emerald-500/80" />
              <span className="text-xs font-mono text-slate-400 ml-2">celeriflow.gov.br/dashboard-executivo</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/50">
                <Activity className="h-3 w-3 animate-spin" />
                ONLINE • PREFEITURA DIGITAL
              </span>
            </div>
          </div>

          {/* Quick Metrics Live Grid inside Hero Card */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-2 sm:p-4">
            <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 hover:border-blue-500/40 transition-colors">
              <div className="flex justify-between items-center text-xs text-slate-400 mb-1">
                <span>Receita Arrecadada (Mês)</span>
                <TrendingUp className="h-4 w-4 text-emerald-400" />
              </div>
              <div className="text-xl sm:text-2xl font-bold text-slate-100 font-mono">R$ 1.842.910,00</div>
              <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
                <span>+24.5% via Pix Dinâmico</span>
              </div>
            </div>

            <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 hover:border-blue-500/40 transition-colors">
              <div className="flex justify-between items-center text-xs text-slate-400 mb-1">
                <span>Processos Digitais Sem Papel</span>
                <Cpu className="h-4 w-4 text-blue-400" />
              </div>
              <div className="text-xl sm:text-2xl font-bold text-slate-100 font-mono">14.890 Eletrônicos</div>
              <div className="text-[11px] text-blue-400 mt-1">SLA Médio: 2,4 horas</div>
            </div>

            <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 hover:border-blue-500/40 transition-colors">
              <div className="flex justify-between items-center text-xs text-slate-400 mb-1">
                <span>Empenhos & Liquidações</span>
                <Lock className="h-4 w-4 text-teal-400" />
              </div>
              <div className="text-xl sm:text-2xl font-bold text-slate-100 font-mono">100% SIAFIC</div>
              <div className="text-[11px] text-teal-400 mt-1">Conformidade STN Auditada</div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
