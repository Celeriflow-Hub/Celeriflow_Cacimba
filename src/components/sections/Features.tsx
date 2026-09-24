import { FileText, ShoppingCart, BarChart3, Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function Features() {
  const modules = [
    {
      title: "Processo Digital",
      description: "Do protocolo à conclusão, elimine o papel e tramite documentos com validade jurídica, assinaturas e prazos controlados.",
      icon: <FileText className="h-10 w-10 text-primary mb-4" />
    },
    {
      title: "Compras e Licitações",
      description: "Integração total com o PNCP, controle de atas, saldos, requisições e gestão de contratos de ponta a ponta.",
      icon: <ShoppingCart className="h-10 w-10 text-primary mb-4" />
    },
    {
      title: "Transparência e e-SIC",
      description: "Atenda à LAI automaticamente. Publicação de atos, despesas, receitas e respostas aos cidadãos em um único portal.",
      icon: <Users className="h-10 w-10 text-primary mb-4" />
    },
    {
      title: "Indicadores e Gestão",
      description: "Painéis em tempo real para o prefeito e secretários tomarem decisões com base em dados, não intuições.",
      icon: <BarChart3 className="h-10 w-10 text-primary mb-4" />
    }
  ];

  return (
    <section id="modulos" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-16 max-w-3xl mx-auto">
          <h2 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl mb-4">
            Módulos integrados para toda a prefeitura
          </h2>
          <p className="text-lg text-muted-foreground">
            A plataforma foi desenhada de forma modular. Você pode iniciar pelo Processo Digital e ir expandindo conforme a necessidade do órgão, sem trocar de sistema.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {modules.map((mod, i) => (
            <Card key={i} className="border-none shadow-md hover:shadow-lg transition-shadow">
              <CardHeader>
                {mod.icon}
                <CardTitle>{mod.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base text-muted-foreground leading-relaxed">
                  {mod.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
