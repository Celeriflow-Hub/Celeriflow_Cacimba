import { CheckCircle2, ShieldCheck, Award } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function Trust() {
  const trustItems = [
    {
      title: "Modelo SaaS 100% em Nuvem",
      desc: "Sem necessidade de infraestrutura local cara ou servidores físicos na prefeitura."
    },
    {
      title: "Validade Jurídica & Assinatura Eletrônica",
      desc: "Documentos e atos oficiais com hashes imutáveis, integridade e verificação garantida."
    },
    {
      title: "Controle Granular de Permissões (RBAC)",
      desc: "Definição precisa de quem pode visualizar, despachar ou assinar em cada departamento."
    },
    {
      title: "Rastreabilidade e Logs de Auditoria",
      desc: "Histórico completo de cada movimentação de processos, empenhos e atendimento."
    },
    {
      title: "Adequação Total à LGPD e LAI",
      desc: "Proteção a dados sensíveis de cidadãos e servidores com canal sigiloso de Ouvidoria."
    },
    {
      title: "Alta Disponibilidade e Continuidade",
      desc: "Infraestrutura redundante para garantir que a máquina pública nunca pare de rodar."
    },
    {
      title: "Implantação Faseada e Sem Trava",
      desc: "Transição suave módulo por módulo, sem interrupções na rotina das secretarias."
    },
    {
      title: "Portal da Transparência Integrado",
      desc: "Alimentação automática do portal público direto do fluxo financeiro e de processos."
    }
  ];

  return (
    <section id="seguranca" className="py-24 bg-primary text-primary-foreground relative overflow-hidden">
      {/* Background Decorative Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-secondary/10 via-primary to-primary opacity-60 pointer-events-none" />

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        
        {/* Section Header */}
        <div className="max-w-3xl mb-16">
          <Badge variant="outline" className="mb-4 px-4 py-1 border-primary-foreground/30 text-primary-foreground font-medium">
            Segurança, Legislação & Governança
          </Badge>
          <h2 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl mb-6">
            Projetado para as exigências rigorosas da Administração Pública.
          </h2>
          <p className="text-lg text-primary-foreground/80 leading-relaxed">
            Na gestão pública, a integridade da informação e a conformidade legal não são opcionais. O CeleriFlow foi arquitetado para blindar o município, assegurando que cada ato administrativo tenha rastreabilidade, validade e amparo institucional.
          </p>
        </div>

        {/* 2-Column Grid: List & Card */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-center">
          
          {/* Trust Items Column */}
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
            {trustItems.map((item, i) => (
              <div key={i} className="flex items-start gap-3.5 p-4 rounded-xl bg-primary-foreground/5 border border-primary-foreground/10 backdrop-blur-sm">
                <CheckCircle2 className="h-5 w-5 text-secondary shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-base font-bold text-primary-foreground mb-1">
                    {item.title}
                  </h4>
                  <p className="text-xs text-primary-foreground/70 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
          
          {/* Highlight Badge Card Column */}
          <div className="relative">
            <div className="aspect-square bg-primary-foreground/10 rounded-2xl border border-primary-foreground/20 p-8 flex flex-col justify-between backdrop-blur-md shadow-xl text-center">
              
              <div className="inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-secondary text-primary mx-auto shadow-lg shadow-secondary/30">
                <ShieldCheck className="h-10 w-10" />
              </div>
              
              <div className="my-auto">
                <h3 className="text-2xl font-bold font-heading mb-2 text-primary-foreground">
                  Tranquilidade para os Gestores
                </h3>
                <p className="text-xs text-primary-foreground/80 max-w-xs mx-auto leading-relaxed">
                  Prefeitos, Secretários e Controladores têm a certeza de que todos os atos estão em conformidade com as diretrizes do Tribunal de Contas e da Legislação vigente.
                </p>
              </div>

              <div className="pt-4 border-t border-primary-foreground/15 text-xs text-primary-foreground/70 flex items-center justify-center gap-2 font-medium">
                <Award className="h-4 w-4 text-secondary" />
                <span>Padrão Corporativo de Governança Pública</span>
              </div>

            </div>
          </div>
          
        </div>
      </div>
    </section>
  );
}
