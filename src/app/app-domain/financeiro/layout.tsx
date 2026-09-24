"use client";

import { Suspense } from "react";
import { ModuleShell, type ModuleNavGroup } from "@/components/app-ui/erp/ModuleShell";

const navigation: ModuleNavGroup[] = [
  { title: "Visão Geral", items: [{ title: "Painel Financeiro", href: "/financeiro", icon: "layoutDashboard", exact: true }] },
  { title: "Planejamento e Orçamento", items: [
    { title: "Planejamento Orçamentário", href: "/financeiro/orcamento/planejamento", icon: "bookOpenCheck" },
    { title: "Cadastros Orçamentários", href: "/financeiro/orcamento/cadastros", icon: "fileText" },
    { title: "Dotações e Reservas", href: "/financeiro/orcamento", icon: "scale", exact: true },
  ] },
  { title: "Execução da Despesa", items: [
    { title: "Empenhos", href: "/financeiro/empenhos", icon: "fileText" },
    { title: "Liquidações", href: "/financeiro/liquidacoes", icon: "receipt" },
    { title: "Pagamentos", href: "/financeiro/pagamentos", icon: "walletCards" },
    { title: "Restos a Pagar", href: "/financeiro/restos-a-pagar", icon: "clipboardList" },
  ] },
  { title: "Receitas", items: [
    { title: "Lançamentos de Receita", href: "/financeiro/receitas", icon: "walletCards" },
    { title: "Regras Constitucionais", href: "/financeiro/receitas-constitucionais", icon: "landmark" },
  ] },
  { title: "Tesouraria e Bancos", items: [
    { title: "Contas e Transferências", href: "/financeiro/contas-bancarias", icon: "landmark" },
    { title: "Extratos Bancários", href: "/financeiro/download-extratos", icon: "download" },
    { title: "Monitoramento de Automações", href: "/financeiro/automacoes", icon: "activity" },
    { title: "Resgates e Aplicações", href: "/financeiro/resgates-aplicacoes", icon: "arrowRightLeft" },
    { title: "Rendimentos", href: "/financeiro/rendimentos", icon: "trendingUp" },
    { title: "Conciliação Bancária", href: "/financeiro/conciliacao-bancaria", icon: "gitCompare" },
  ] },
  { title: "Contabilidade e Saídas", items: [
    { title: "Contabilidade e Fechamento", href: "/financeiro/contabilidade", icon: "scale" },
    { title: "Relatórios Financeiros", href: "/financeiro/relatorios", icon: "fileText" },
  ] },
];

export default function FinanceiroLayout({ children }: { children: React.ReactNode }) {
  return <Suspense><ModuleShell moduleTitle="Financeiro" moduleCaption="Gestão e Contabilidade" moduleIcon="landmark" navigation={navigation}>{children}</ModuleShell></Suspense>;
}
