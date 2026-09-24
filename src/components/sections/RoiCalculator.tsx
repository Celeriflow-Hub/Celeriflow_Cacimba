"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { 
  Calculator, 
  TrendingUp, 
  Clock, 
  FileText, 
  Coins, 
  Building2, 
  CheckCircle2,
  ArrowRight
} from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export function RoiCalculator() {
  const [population, setPopulation] = useState<number>(35000);

  // Estimativas matemáticas interativas de economia municipal
  const economiaPapel = Math.round((population * 4.8));
  const horasEconomizadas = Math.round((population * 0.42));
  const incrementoArrecadacao = Math.round((population * 22.5));
  const reducaoSlaDias = population > 100000 ? "De 20 dias para 3 horas" : "De 12 dias para 1 hora";

  return (
    <section id="calculadora" className="py-24 bg-slate-900 text-slate-100 border-b border-slate-800 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        
        {/* Section Title */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Badge variant="outline" className="mb-4 px-4 py-1 border-emerald-500/40 bg-emerald-950/60 text-emerald-300 font-medium">
            <Calculator className="h-3.5 w-3.5 mr-1.5 text-emerald-400" />
            Calculadora de Impacto & Economia Municipal
          </Badge>
          <h2 className="font-heading text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl text-slate-100 mb-6">
            Simule a Transformação Digital na Sua Prefeitura.
          </h2>
          <p className="text-slate-400 text-lg leading-relaxed">
            Selecione a população do município e veja a estimativa imediata de economia com papel, aumento da arrecadação e agilidade nos atendimentos.
          </p>
        </div>

        {/* Calculator Interface Container */}
        <div className="max-w-4xl mx-auto rounded-2xl border border-slate-800 bg-slate-950/90 shadow-2xl p-6 sm:p-10 backdrop-blur-xl">
          
          {/* Population Slider Control */}
          <div className="mb-10 p-6 rounded-xl bg-slate-900/80 border border-slate-800">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
              <div>
                <label className="text-sm font-semibold text-slate-200 block">
                  População Estimada do Município
                </label>
                <span className="text-xs text-slate-400">Deslize para ajustar o porte da cidade</span>
              </div>
              <div className="flex items-center gap-2 bg-blue-950/80 border border-blue-800/60 px-4 py-2 rounded-xl">
                <Building2 className="h-4 w-4 text-blue-400" />
                <span className="font-mono text-xl font-bold text-blue-300">
                  {population.toLocaleString("pt-BR")} habitantes
                </span>
              </div>
            </div>

            <input 
              type="range" 
              min="5000" 
              max="300000" 
              step="5000"
              value={population}
              onChange={(e) => setPopulation(Number(e.target.value))}
              className="w-full h-3 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
            />
            
            <div className="flex justify-between text-[11px] font-mono text-slate-500 mt-2">
              <span>5.000 (Pequeno Porte)</span>
              <span>50.000</span>
              <span>150.000</span>
              <span>300.000+ (Médio/Grande Porte)</span>
            </div>
          </div>

          {/* Results Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            
            {/* Metric 1 */}
            <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 hover:border-emerald-500/40 transition-colors">
              <div className="flex items-center justify-between text-slate-400 mb-3">
                <span className="text-xs font-medium">Economia com Papel/Ano</span>
                <FileText className="h-4 w-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-bold font-mono text-emerald-400">
                R$ {economiaPapel.toLocaleString("pt-BR")}
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">Processos 100% digitais</span>
            </div>

            {/* Metric 2 */}
            <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 hover:border-blue-500/40 transition-colors">
              <div className="flex items-center justify-between text-slate-400 mb-3">
                <span className="text-xs font-medium">Ganho de Arrecadação/Ano</span>
                <Coins className="h-4 w-4 text-blue-400" />
              </div>
              <div className="text-2xl font-bold font-mono text-blue-400">
                + R$ {incrementoArrecadacao.toLocaleString("pt-BR")}
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">Com Pix Dinâmico & Dívida Ativa</span>
            </div>

            {/* Metric 3 */}
            <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 hover:border-teal-500/40 transition-colors">
              <div className="flex items-center justify-between text-slate-400 mb-3">
                <span className="text-xs font-medium">Horas Poupadas/Servidores</span>
                <Clock className="h-4 w-4 text-teal-400" />
              </div>
              <div className="text-2xl font-bold font-mono text-teal-300">
                {horasEconomizadas.toLocaleString("pt-BR")}h
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">Automação de rotinas</span>
            </div>

            {/* Metric 4 */}
            <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 hover:border-purple-500/40 transition-colors">
              <div className="flex items-center justify-between text-slate-400 mb-3">
                <span className="text-xs font-medium">Agilidade no Atendimento</span>
                <TrendingUp className="h-4 w-4 text-purple-400" />
              </div>
              <div className="text-base font-bold font-mono text-purple-300">
                {reducaoSlaDias}
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">Satisfação do cidadão</span>
            </div>

          </div>

          {/* CTA Footer inside Calculator */}
          <div className="p-6 rounded-xl bg-gradient-to-r from-blue-950/80 via-slate-900 to-emerald-950/80 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-6 w-6 text-emerald-400 shrink-0" />
              <div>
                <h4 className="font-bold text-slate-100 text-sm sm:text-base">
                  Quer um estudo técnico detalhado para o seu município?
                </h4>
                <p className="text-xs text-slate-400">
                  Nossos consultores preparam um parecer customizado sem compromisso.
                </p>
              </div>
            </div>
            <Link 
              href="#contato"
              className={buttonVariants({ className: "w-full sm:w-auto bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold h-11 px-6 shadow-md shadow-emerald-500/20 shrink-0" })}
            >
              Solicitar Parecer Técnico
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>

        </div>

      </div>
    </section>
  );
}
