import { ModuleShell, type ModuleNavGroup } from "@/components/app-ui/erp/ModuleShell";

const navigation: ModuleNavGroup[] = [{
  title: "Legislativo",
  items: [
    { title: "Painel", href: "/camara", icon: "layoutDashboard", exact: true },
    { title: "Legislaturas", href: "/camara/legislaturas", icon: "landmark" },
    { title: "Vereadores", href: "/camara/vereadores", icon: "users" },
    { title: "Comissões", href: "/camara/comissoes", icon: "users" },
    { title: "Sessões", href: "/camara/sessoes", icon: "calendar" },
    { title: "Proposições", href: "/camara/proposicoes", icon: "fileText" },
    { title: "Leis e Atos", href: "/camara/leis", icon: "scale" },
    { title: "Audiências", href: "/camara/audiencias", icon: "mic" },
    { title: "Portal Legislativo", href: "/camara/portal", icon: "globe" },
  ],
}];

export default function CamaraLayout({ children }: { children: React.ReactNode }) {
  return <ModuleShell moduleTitle="Câmara Municipal" moduleCaption="Gestão legislativa" moduleIcon="landmark" navigation={navigation}>{children}</ModuleShell>;
}
