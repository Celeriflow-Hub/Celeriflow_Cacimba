import { ShieldCheck, Zap, Layers, FileCheck } from "lucide-react";

export function Stats() {
  const stats = [
    {
      value: "24+",
      label: "Domínios Mapeados",
      description: "Finanças, SIAFIC, Pix, PNCP, Saúde e Educação integrados.",
      icon: Layers,
      color: "text-blue-400",
      borderColor: "hover:border-blue-500/50",
    },
    {
      value: "-85%",
      label: "Tempo de Tramitação",
      description: "Despachos em horas com assinatura digital ICP-Brasil e Gov.br.",
      icon: Zap,
      color: "text-emerald-400",
      borderColor: "hover:border-emerald-500/50",
    },
    {
      value: "100%",
      label: "Processo Sem Papel",
      description: "Eliminação do papel físico com auditoria inalterável.",
      icon: FileCheck,
      color: "text-teal-400",
      borderColor: "hover:border-teal-500/50",
    },
    {
      value: "99.99%",
      label: "Uptime Serverless",
      description: "Nuvem Neon PostgreSQL e Firebase Auth de alta disponibilidade.",
      icon: ShieldCheck,
      color: "text-purple-400",
      borderColor: "hover:border-purple-500/50",
    }
  ];

  return (
    <section className="border-y border-slate-800 bg-slate-900/90 py-16 text-slate-100 relative overflow-hidden">
      {/* Ambient Radial Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-blue-600/5 pointer-events-none" />

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((item, index) => {
            const Icon = item.icon;
            return (
              <div 
                key={index}
                className={`flex flex-col items-center text-center p-6 rounded-2xl bg-slate-950/80 border border-slate-800 backdrop-blur-xl transition-all duration-300 ${item.borderColor} hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-500/10 group`}
              >
                <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 border border-slate-800 group-hover:scale-110 transition-transform ${item.color}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <span className="font-heading text-4xl font-extrabold text-slate-100 tracking-tight font-mono">
                  {item.value}
                </span>
                <span className={`text-sm font-bold mt-1 ${item.color}`}>
                  {item.label}
                </span>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
