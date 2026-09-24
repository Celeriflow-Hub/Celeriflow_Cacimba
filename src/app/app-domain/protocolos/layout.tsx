"use client";

import { ModuleShell, type ModuleNavGroup } from "@/components/app-ui/erp/ModuleShell";

const navigation: ModuleNavGroup[] = [
  {
    title: "Visão geral",
    items: [{ title: "Painel de protocolos", href: "/protocolos", icon: "layoutDashboard", exact: true }],
  },
  {
    title: "Operação",
    items: [
      { title: "Caixa do setor", href: "/protocolos/processos", icon: "fileBox" },
      { title: "Acompanhamento", href: "/protocolos/acompanhamento", icon: "chartNoAxesCombined" },
      { title: "Buscar processo", href: "/protocolos/busca", icon: "fileSearch" },
    ],
  },
  {
    title: "Atendimento",
    items: [
      { title: "Ouvidoria", href: "/protocolos/ouvidoria", icon: "messageSquareWarning" },
      { title: "Notificações", href: "/protocolos/notificacoes", icon: "bell" },
    ],
  },
  {
    title: "Gestão",
    items: [
      { title: "Assinaturas", href: "/protocolos/assinaturas", icon: "fileSignature" },
      { title: "Relatórios", href: "/protocolos/relatorios", icon: "barChart3" },
      { title: "Arquivados", href: "/protocolos/arquivados", icon: "archive" },
    ],
  },
];

export default function ProtocolosLayout({ children }: { children: React.ReactNode }) {
  return (
    <ModuleShell
      moduleTitle="Protocolos e Processos"
      moduleCaption="Processo digital"
      moduleIcon="fileBox"
      navigation={navigation}
    >
      {children}
    </ModuleShell>
  );
}
