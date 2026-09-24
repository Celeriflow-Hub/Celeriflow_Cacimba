import { ModuleShell, type ModuleNavGroup } from "@/components/app-ui/erp/ModuleShell";

const navigation: ModuleNavGroup[] = [{
  title: "Atendimento",
  items: [
    { title: "Painel Geral", href: "/atendimento", icon: "layoutDashboard", exact: true },
    { title: "Novo Chamado", href: "/atendimento/novo", icon: "plus" },
    { title: "Central de Demandas", href: "/atendimento/central", icon: "listTodo" },
    { title: "Fila do Setor", href: "/atendimento/fila", icon: "headphones" },
    { title: "Ouvidoria", href: "/atendimento/ouvidoria", icon: "messageSquareWarning" },
    { title: "Canais e Assuntos", href: "/atendimento/configuracoes", icon: "settings2" },
    { title: "Relatórios", href: "/atendimento/relatorios", icon: "barChart3" },
  ],
}];

export default function AtendimentoLayout({ children }: { children: React.ReactNode }) {
  return <ModuleShell moduleTitle="Atendimento Central" moduleCaption="Canais e chamados" moduleIcon="headphones" navigation={navigation}>{children}</ModuleShell>;
}
