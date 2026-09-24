import { ModuleShell, type ModuleNavGroup } from "@/components/app-ui/erp/ModuleShell";

const navigation: ModuleNavGroup[] = [{
  title: "Configurações",
  items: [
    { title: "Painel", href: "/configuracoes", icon: "settings", exact: true },
    { title: "Conexões e Integrações", href: "/configuracoes/integracoes", icon: "cable" },
    { title: "Instância", href: "/configuracoes/instancia", icon: "server" },
    { title: "Módulos", href: "/configuracoes/modulos", icon: "layers" },
    { title: "Perfis de Acesso", href: "/configuracoes/perfis", icon: "shieldCheck" },
    { title: "Usuários", href: "/configuracoes/usuarios", icon: "users" },
    { title: "Workflows e Processos", href: "/configuracoes/processos", icon: "workflow" },
    { title: "Auditoria", href: "/configuracoes/auditoria", icon: "history" },
  ],
}];

export default function ConfiguracoesLayout({ children }: { children: React.ReactNode }) {
  return <ModuleShell moduleTitle="Configurações" moduleCaption="Integrações e sistema" moduleIcon="settings" navigation={navigation}>{children}</ModuleShell>;
}
