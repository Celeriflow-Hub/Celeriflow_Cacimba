import { Suspense } from "react";
import { ModuleShell, type ModuleNavGroup } from "@/components/app-ui/erp/ModuleShell";

const navigation: ModuleNavGroup[] = [
  {
    title: "Visão geral",
    items: [
      { title: "Painel", href: "/saude", icon: "layoutDashboard", exact: true },
      { title: "Gerencial", href: "/saude/gerencial", icon: "barChart3" },
      { title: "Relatórios", href: "/saude/relatorios", icon: "fileText" },
    ],
  },
  {
    title: "Atendimento",
    items: [
      { title: "Agenda", href: "/saude/agenda", icon: "calendar" },
      { title: "Acolhimento", href: "/saude/acolhimento", icon: "heartPulse" },
      { title: "Pronto Atendimento", href: "/saude/pronto-atendimento", icon: "siren" },
      { title: "Atendimentos", href: "/saude/atendimentos", icon: "clipboardList" },
      { title: "Pacientes", href: "/saude/pacientes", icon: "users" },
    ],
  },
  {
    title: "Assistência",
    items: [
      { title: "Farmácia", href: "/saude/farmacia", icon: "pill" },
      { title: "Vacinação", href: "/saude/vacinacao", icon: "syringe" },
      { title: "Laboratório", href: "/saude/laboratorio", icon: "flaskConical" },
      { title: "Centro Especializado", href: "/saude/centro-especializado", icon: "accessibility" },
    ],
  },
  {
    title: "Regulação e apoio",
    items: [
      { title: "Regulação", href: "/saude/regulacao", icon: "clipboardList" },
      { title: "Prestador", href: "/saude/prestador", icon: "handshake" },
      { title: "TFD", href: "/saude/tfd", icon: "bus" },
      { title: "Produção SUS", href: "/saude/producao", icon: "factory" },
    ],
  },
  {
    title: "Atenção básica",
    items: [
      { title: "Território", href: "/saude/territorio", icon: "mapPin" },
      { title: "SISAB / e-SUS", href: "/saude/sisab", icon: "send" },
      { title: "Integração e-SUS", href: "/saude/esus", icon: "activity" },
    ],
  },
  {
    title: "Gestão e controle",
    items: [
      { title: "Vigilância", href: "/saude/vigilancia", icon: "shieldCheck" },
      { title: "Integrações", href: "/saude/integracoes", icon: "plugZap" },
      { title: "Unidades", href: "/saude/unidades", icon: "building2" },
      { title: "Profissionais", href: "/saude/profissionais", icon: "stethoscope" },
      { title: "Equipes ESF", href: "/saude/equipes", icon: "users" },
      { title: "Administração", href: "/saude/administracao", icon: "settings2" },
    ],
  },
];

export default function SaudeLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense>
      <ModuleShell moduleTitle="Saúde Pública" moduleCaption="Gestão municipal" moduleIcon="heart" navigation={navigation}>
        {children}
      </ModuleShell>
    </Suspense>
  );
}
