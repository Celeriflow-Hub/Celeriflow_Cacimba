"use client";

import { Suspense } from "react";
import { ModuleShell, type ModuleNavGroup } from "@/components/app-ui/erp/ModuleShell";

const navigation: ModuleNavGroup[] = [
  {
    title: "Painel",
    items: [
      { title: "Painel Tributário", href: "/tributacao", icon: "layoutDashboard", exact: true },
    ],
  },
  {
    title: "Cadastros Fiscais",
    items: [
      { title: "Pessoas e Cadastro Fiscal", href: "/tributacao/pessoas", icon: "userRound" },
      { title: "Cadastro Econômico", href: "/tributacao/economico", icon: "building2" },
      { title: "Imóveis (IPTU)", href: "/tributacao/imoveis", icon: "mapPin" },
      { title: "Recadastramento", href: "/tributacao/recadastramento", icon: "clipboardCheck" },
      { title: "Base Territorial", href: "/tributacao/base-territorial", icon: "mapPinned" },
      { title: "REDESIM", href: "/tributacao/redesim", icon: "network" },
      { title: "Fontes Cadastrais", href: "/tributacao/fontes-cadastrais", icon: "databaseZap" },
    ],
  },
  {
    title: "Documentos e Arrecadação",
    items: [
      { title: "Motor Fiscal e Arrecadação", href: "/tributacao/motor-fiscal", icon: "calculator" },
      { title: "ITBI — Transmissões", href: "/tributacao/itbi", icon: "landmark" },
      { title: "Domicílio Tributário", href: "/tributacao/domicilio-tributario", icon: "mailOpen" },
      { title: "Alvarás e Licenças", href: "/tributacao/alvaras", icon: "fileCheck" },
      { title: "NFS-e", href: "/tributacao/nfse", icon: "fileText" },
      { title: "Simples Nacional", href: "/tributacao/simples-nacional", icon: "scale" },
      { title: "ISS Bancário / DES-IF", href: "/tributacao/iss-bancario", icon: "landmark" },
      { title: "Guias e Arrecadação", href: "/tributacao/guias", icon: "receipt" },
      { title: "Cobrança e Parcelamentos", href: "/tributacao/cobranca", icon: "handCoins" },
      { title: "Dívida Ativa, Protesto e Execução", href: "/tributacao/divida-ativa", icon: "gavel" },
      { title: "Dívida Ativa", href: "/tributacao/divida", icon: "banknote" },
      { title: "Cemitérios", href: "/tributacao/cemiterios", icon: "cross" },
      { title: "VAF — Valor Adicionado", href: "/tributacao/vaf", icon: "landmark" },
      { title: "BI Tributário", href: "/tributacao/bi-tributario", icon: "barChart3" },
      { title: "Certidões", href: "/tributacao/certidoes", icon: "fileBadge" },
    ],
  },
  {
    title: "Controle",
    items: [
      { title: "Fiscalização", href: "/tributacao/fiscalizacao", icon: "shieldAlert" },
      { title: "Operações Internas", href: "/tributacao/operacoes", icon: "scale" },
    ],
  },
];

export default function TributacaoLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense>
      <ModuleShell
        moduleTitle="Tributação"
        moduleCaption="Gestão Fiscal"
        moduleIcon="building2"
        navigation={navigation}
      >
        {children}
      </ModuleShell>
    </Suspense>
  );
}
