import Link from "next/link";
import Image from "next/image";
import { APP_VERSION } from "@/lib/version";

export function Footer() {
  return (
    <footer className="border-t border-slate-800 bg-slate-950 text-slate-400 text-sm">
      <div className="container mx-auto px-4 md:px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          
          {/* Brand Info */}
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="inline-block mb-4 hover:opacity-90 transition-opacity">
              <Image 
                src="/favicon.png" 
                alt="CeleriFlow ERP Governamental" 
                width={180} 
                height={55} 
                className="h-10 w-auto object-contain" 
              />
            </Link>
            <p className="max-w-sm text-xs text-slate-400 leading-relaxed">
              O ecossistema definitivo de inteligência e gestão pública municipal. SIAFIC, PNCP, Pix Dinâmico, Processo Eletrônico 100% Sem Papel e Saúde e-SUS integrados em nuvem serverless de alta velocidade.
            </p>
            <div className="mt-4 inline-flex items-center gap-2 text-xs font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/50 px-3 py-1 rounded-full">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              Sistemas SIAFIC & PNCP 100% Operacionais
            </div>
          </div>
          
          {/* Navigation Links */}
          <div>
            <h3 className="font-bold text-slate-200 mb-4 text-xs uppercase tracking-wider font-mono">Plataforma</h3>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link href="#modulos" className="hover:text-blue-400 transition-colors">
                  Módulos e Recursos (24+)
                </Link>
              </li>
              <li>
                <Link href="#demonstracao" className="hover:text-blue-400 transition-colors">
                  Cockpit Executivo 360°
                </Link>
              </li>
              <li>
                <Link href="#regulatorio" className="hover:text-blue-400 transition-colors">
                  Conformidade SIAFIC & PNCP
                </Link>
              </li>
              <li>
                <Link href="#calculadora" className="hover:text-blue-400 transition-colors">
                  Calculadora de Impacto
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-slate-200 mb-4 text-xs uppercase tracking-wider font-mono">Regulatório</h3>
            <ul className="space-y-2.5 text-xs">
              <li>
                <span className="text-slate-400">Decreto nº 10.540/20 (SIAFIC)</span>
              </li>
              <li>
                <span className="text-slate-400">Lei nº 14.133/21 (PNCP)</span>
              </li>
              <li>
                <span className="text-slate-400">Lei nº 14.063/20 (Assinaturas)</span>
              </li>
              <li>
                <span className="text-slate-400">Lei nº 13.709/18 (LGPD)</span>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-bold text-slate-200 mb-4 text-xs uppercase tracking-wider font-mono">Acesso & Suporte</h3>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link href="/portal-servidor" className="hover:text-blue-400 transition-colors font-semibold text-blue-400">
                  Portal do Servidor →
                </Link>
              </li>
              <li>
                <Link href="/portal-transparencia" className="hover:text-blue-400 transition-colors">
                  Portal da Transparência
                </Link>
              </li>
              <li>
                <Link href="/portal-protocolos" className="hover:text-blue-400 transition-colors">
                  Processos e Protocolos
                </Link>
              </li>
              <li>
                <Link href="#contato" className="hover:text-blue-400 transition-colors">
                  Solicitar Suporte Técnico
                </Link>
              </li>
            </ul>
          </div>

        </div>
        
        <div className="mt-12 pt-8 border-t border-slate-800/80 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-500 font-mono">
          <p>
            &copy; {new Date().getFullYear()} CeleriFlow ERP Governamental. Todos os direitos reservados.
          </p>
          <div className="flex items-center gap-4">
            <span>Versão {APP_VERSION}</span>
            <span>•</span>
            <span className="text-slate-400">Arquitetura Serverless High-Availability</span>
          </div>
        </div>

      </div>
    </footer>
  );
}
