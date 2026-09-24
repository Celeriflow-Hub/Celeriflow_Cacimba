"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Send, CheckCircle2, Building2, Sparkles, Phone, Mail, User, MapPin } from "lucide-react";

const leadSchema = z.object({
  name: z.string().min(2, "Informe seu nome completo"),
  role: z.string().optional(),
  organization: z.string().min(2, "Informe o nome da Prefeitura ou Órgão"),
  city: z.string().min(2, "Informe a cidade"),
  state: z.string().min(2, "Informe o estado"),
  email: z.string().email("Informe um e-mail corporativo/oficial válido"),
  phone: z.string().min(8, "Informe um telefone/WhatsApp de contato"),
  moduleInterest: z.string().optional(),
  message: z.string().optional(),
  consent: z.boolean().refine((val) => val === true, {
    message: "É necessário concordar com o tratamento de dados segundo a LGPD",
  }),
});

type LeadFormValues = z.infer<typeof leadSchema>;

export function Contact() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LeadFormValues>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      name: "",
      role: "",
      organization: "",
      city: "",
      state: "",
      email: "",
      phone: "",
      moduleInterest: "Todos os 24 Módulos (ERP Completo)",
      message: "",
      consent: true,
    },
  });

  async function onSubmit() {
    setIsSubmitting(true);
    try {
      // Simulação de envio com fallback
      await new Promise((res) => setTimeout(res, 800));
      setIsSuccess(true);
      reset();
    } catch (error) {
      console.error("Erro ao enviar formulário:", error);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section id="contato" className="py-24 bg-slate-950 text-slate-100 border-t border-slate-800 relative overflow-hidden">
      {/* Dynamic Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[450px] bg-blue-600/10 rounded-full blur-[160px] pointer-events-none" />

      <div className="container mx-auto px-4 md:px-6 max-w-4xl relative z-10">
        
        {/* Section Header */}
        <div className="text-center mb-12">
          <Badge variant="outline" className="mb-4 px-4 py-1 border-blue-500/40 bg-blue-950/60 text-blue-300 font-medium">
            <Sparkles className="h-3.5 w-3.5 mr-1.5 text-blue-400" />
            Atendimento Exclusivo para Prefeituras & Câmaras
          </Badge>
          <h2 className="font-heading text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl text-slate-100 mb-4">
            Agende uma Apresentação Técnica Executiva.
          </h2>
          <p className="text-slate-400 text-base md:text-lg leading-relaxed max-w-2xl mx-auto">
            Veja em tempo real a simulação do CeleriFlow adaptada ao porte do seu município. Sem compromisso e com parecer técnico de conformidade legal.
          </p>
        </div>
        
        {/* Form Container Card */}
        <div className="bg-slate-900/90 rounded-2xl p-6 sm:p-10 shadow-2xl border border-slate-800 backdrop-blur-xl">
          {isSuccess ? (
            <div className="text-center py-12">
              <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mb-6 animate-bounce">
                <CheckCircle2 className="h-10 w-10" />
              </div>
              <h3 className="text-2xl font-bold font-heading text-slate-100 mb-2">Solicitação Recebida com Sucesso!</h3>
              <p className="text-slate-400 max-w-md mx-auto mb-8 text-sm leading-relaxed">
                Nossos consultores sêniores em ERP Governamental entrarão em contato em até 2 horas úteis para agendar a sessão demonstrativa.
              </p>
              <Button 
                onClick={() => setIsSuccess(false)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200"
              >
                Enviar Outra Solicitação
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              
              {/* Row 1: Name & Role */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-blue-400" /> Nome Completo *
                  </Label>
                  <Input 
                    id="name" 
                    placeholder="Ex: Dra. Juliana Silveira" 
                    {...register("name")} 
                    className="bg-slate-950 border-slate-800 focus:border-blue-500 text-slate-100 h-11 text-sm"
                  />
                  {errors.name && <p className="text-xs text-red-400">{errors.name.message}</p>}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="role" className="text-xs font-semibold text-slate-300">
                    Cargo / Função no Município
                  </Label>
                  <Input 
                    id="role" 
                    placeholder="Ex: Prefeito(a), Secretário(a) de Finanças, Diretor de TI" 
                    {...register("role")} 
                    className="bg-slate-950 border-slate-800 focus:border-blue-500 text-slate-100 h-11 text-sm"
                  />
                </div>
              </div>

              {/* Row 2: Organization & City/State */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2 space-y-2">
                  <Label htmlFor="organization" className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5 text-blue-400" /> Prefeitura / Órgão Público *
                  </Label>
                  <Input 
                    id="organization" 
                    placeholder="Ex: Prefeitura Municipal de ..." 
                    {...register("organization")} 
                    className="bg-slate-950 border-slate-800 focus:border-blue-500 text-slate-100 h-11 text-sm"
                  />
                  {errors.organization && <p className="text-xs text-red-400">{errors.organization.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city" className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-blue-400" /> Cidade / UF *
                  </Label>
                  <Input 
                    id="city" 
                    placeholder="Ex: Lagoa Seca - PB" 
                    {...register("city")} 
                    className="bg-slate-950 border-slate-800 focus:border-blue-500 text-slate-100 h-11 text-sm"
                  />
                  {errors.city && <p className="text-xs text-red-400">{errors.city.message}</p>}
                </div>
              </div>

              {/* Row 3: Email & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-blue-400" /> E-mail Institucional *
                  </Label>
                  <Input 
                    id="email" 
                    type="email"
                    placeholder="seu.nome@prefeitura.gov.br" 
                    {...register("email")} 
                    className="bg-slate-950 border-slate-800 focus:border-blue-500 text-slate-100 h-11 text-sm"
                  />
                  {errors.email && <p className="text-xs text-red-400">{errors.email.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-blue-400" /> Telefone / WhatsApp *
                  </Label>
                  <Input 
                    id="phone" 
                    placeholder="(83) 99999-0000" 
                    {...register("phone")} 
                    className="bg-slate-950 border-slate-800 focus:border-blue-500 text-slate-100 h-11 text-sm"
                  />
                  {errors.phone && <p className="text-xs text-red-400">{errors.phone.message}</p>}
                </div>
              </div>

              {/* Module Interest Dropdown */}
              <div className="space-y-2">
                <Label htmlFor="moduleInterest" className="text-xs font-semibold text-slate-300">
                  Principal Módulo de Interesse
                </Label>
                <select
                  id="moduleInterest"
                  {...register("moduleInterest")}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-lg text-slate-100 h-11 px-3 text-sm focus:outline-none"
                >
                  <option value="Todos os 24 Módulos (ERP Completo)">Todos os 24 Módulos (ERP Completo para Prefeitura)</option>
                  <option value="Finanças, SIAFIC & Tesouraria">Finanças, SIAFIC & Tesouraria</option>
                  <option value="Tributação & Pix Dinâmico">Tributação & Pix Dinâmico (IPTU/ISS)</option>
                  <option value="Compras, Licitações & PNCP">Compras, Licitações & PNCP (Lei 14.133/21)</option>
                  <option value="Processo Eletrônico Sem Papel">Processo Eletrônico 100% Sem Papel & Ouvidoria</option>
                  <option value="Saúde e-SUS & Educação">Saúde e-SUS APS & Diário Eletrônico</option>
                </select>
              </div>

              {/* LGPD Checkbox */}
              <div className="flex items-start gap-2.5 pt-2">
                <input 
                  type="checkbox" 
                  id="consent" 
                  {...register("consent")} 
                  className="mt-1 rounded bg-slate-950 border-slate-800 text-blue-500 focus:ring-blue-500"
                />
                <Label htmlFor="consent" className="text-xs text-slate-400 leading-normal font-normal">
                  Autorizo o envio de informações técnicas e concordo com o tratamento dos dados segundo a Lei Geral de Proteção de Dados (LGPD - Lei 13.709/18).
                </Label>
              </div>
              {errors.consent && <p className="text-xs text-red-400">{errors.consent.message}</p>}

              {/* Submit Button */}
              <Button 
                type="submit" 
                disabled={isSubmitting} 
                className="w-full h-13 text-base font-bold bg-gradient-to-r from-blue-600 via-blue-500 to-emerald-500 hover:from-blue-500 hover:to-emerald-400 text-white shadow-xl shadow-blue-500/20 rounded-xl"
              >
                {isSubmitting ? "Enviando Solicitação..." : "Agendar Demonstração Gratuita com Especialista"}
                <Send className="ml-2 h-4 w-4" />
              </Button>

              <div className="flex items-center justify-center gap-2 text-xs text-slate-400 pt-2">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                <span>Seus dados estão protegidos com criptografia SSL/TLS de 256-bits</span>
              </div>

            </form>
          )}
        </div>

      </div>
    </section>
  );
}
