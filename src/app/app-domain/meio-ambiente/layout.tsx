"use client";

import { Suspense } from "react";
import { ModuleShell, type ModuleNavGroup } from "@/components/app-ui/erp/ModuleShell";

const navigation: ModuleNavGroup[] = [
  { title: "Painel", items: [{ title: "Painel e Resumo", href: "/meio-ambiente", icon: "layoutDashboard", exact: true }] },
  { title: "Licenciamento e Controle", items: [
    { title: "Empreendimentos", href: "/meio-ambiente/empreendimentos", icon: "building2" },
    { title: "Licenciamento", href: "/meio-ambiente/licenciamento", icon: "shieldCheck" },
    { title: "Solicitações e Podas", href: "/meio-ambiente/solicitacoes", icon: "fileText" },
    { title: "Denúncias Ambientais", href: "/meio-ambiente/denuncias", icon: "alertTriangle" },
    { title: "Fiscalização e Autos", href: "/meio-ambiente/fiscalizacao", icon: "search" },
  ] },
  { title: "Gestão Ambiental", items: [
    { title: "Áreas Verdes", href: "/meio-ambiente/areas-verdes", icon: "sprout" },
    { title: "Controle de Resíduos", href: "/meio-ambiente/residuos", icon: "trash2" },
    { title: "Educação Ambiental", href: "/meio-ambiente/educacao", icon: "graduationCap" },
    { title: "Documentos Oficiais", href: "/meio-ambiente/documentos", icon: "folderOpen" },
  ] },
];

export default function MeioAmbienteLayout({ children }: { children: React.ReactNode }) {
  return <Suspense><ModuleShell moduleTitle="Meio Ambiente" moduleCaption="Gestão Sustentável" moduleIcon="leaf" navigation={navigation}>{children}</ModuleShell></Suspense>;
}
