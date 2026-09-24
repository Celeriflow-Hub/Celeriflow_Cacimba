import { ModuleShell, type ModuleNavGroup } from "@/components/app-ui/erp/ModuleShell";

const navigation: ModuleNavGroup[] = [{
  title: "Operação",
  items: [
    { title: "Painel", href: "/seguranca", icon: "layoutDashboard", exact: true },
    { title: "Guarda e Equipes", href: "/seguranca/guardas", icon: "users" },
    { title: "Ocorrências", href: "/seguranca/ocorrencias", icon: "alertTriangle" },
    { title: "Rondas e Câmeras", href: "/seguranca/rondas", icon: "camera" },
    { title: "Defesa Civil", href: "/seguranca/defesa-civil", icon: "shield" },
    { title: "Trânsito", href: "/seguranca/transito", icon: "carFront" },
    { title: "Autos de Infração", href: "/seguranca/infracoes", icon: "clipboardCheck" },
    { title: "Mobilidade e Rotas", href: "/seguranca/mobilidade", icon: "route" },
    { title: "OS e Equipamentos", href: "/seguranca/ordens", icon: "wrench" },
    { title: "Documentos e Relatórios", href: "/seguranca/documentos", icon: "fileText" },
  ],
}];

export default function SegurancaLayout({ children }: { children: React.ReactNode }) {
  return <ModuleShell moduleTitle="Segurança e Mobilidade" moduleCaption="Gestão municipal" moduleIcon="map" navigation={navigation}>{children}</ModuleShell>;
}
