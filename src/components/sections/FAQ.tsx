import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";

export function FAQ() {
  const faqs = [
    {
      question: "O CeleriFlow substitui os sistemas isolados da prefeitura?",
      answer: "Sim. O CeleriFlow foi arquitetado como um ERP Governamental Completo com mais de 24 domínios nativos. Ele pode substituir de forma integrada os velhos sistemas legados de protocolo, tesouraria, tributos, saúde, educação, obras e RH, ou ser implantado em fases integrando-se gradualmente."
    },
    {
      question: "O CeleriFlow precisa de instalação nos computadores da prefeitura?",
      answer: "Não. O CeleriFlow é 100% em nuvem (SaaS). O acesso é realizado de forma segura via navegador web por servidores públicos e gestores, sem necessidade de servidores físicos ou instalações locais na prefeitura."
    },
    {
      question: "Como funciona a validade jurídica das assinaturas e despachos?",
      answer: "Cada documento, processo ou empenho assinado eletronicamente no CeleriFlow recebe uma validação com criptografia de ponta a ponta e log de auditoria imutável, garantindo plena validade jurídica e rastreabilidade institucional."
    },
    {
      question: "É possível contratar apenas alguns módulos para iniciar?",
      answer: "Com certeza. A implantação do CeleriFlow é modular e faseada. A prefeitura pode iniciar pelo Processo Eletrônico e Ouvidoria e, à medida que a gestão avança, ativar os módulos Financeiro, Tributário, Saúde, Educação e Obras sem trocar de plataforma."
    },
    {
      question: "Como o sistema garante o cumprimento da LGPD e da LAI?",
      answer: "A plataforma possui controles rigorosos de permissões (RBAC), anonimização de dados na Ouvidoria Sigilosa para proteção de manifestantes e automação na publicação do Portal da Transparência, atendendo 100% às exigências da Lei de Acesso à Informação (LAI) e LGPD."
    },
    {
      question: "Como solicitar uma demonstração guiada para nossa equipe?",
      answer: "Basta preencher o formulário no final desta página. Nossa equipe de especialistas em Gestão Pública agendará uma apresentação técnica personalizada para demonstrar o CeleriFlow rodando na prática."
    }
  ];

  return (
    <section id="faq" className="py-24 bg-background border-t">
      <div className="container mx-auto px-4 md:px-6 max-w-4xl">
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4 px-4 py-1 border-primary/30 text-primary font-medium">
            Tire Suas Dúvidas
          </Badge>
          <h2 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl mb-4">
            Perguntas Frequentes de Gestores Públicos
          </h2>
          <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto">
            Respostas diretas sobre implantação, módulos integrados e conformidade legal do CeleriFlow.
          </p>
        </div>
        
        <Accordion className="w-full space-y-4">
          {faqs.map((faq, index) => (
            <AccordionItem 
              key={index} 
              value={`item-${index}`}
              className="border rounded-xl px-6 bg-card/60 backdrop-blur-sm shadow-sm transition-all hover:border-primary/30"
            >
              <AccordionTrigger className="text-left font-bold text-base md:text-lg hover:no-underline py-5 text-foreground">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-sm md:text-base leading-relaxed pb-6 border-t pt-4">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
