import { ModuleShell, type ModuleNavGroup } from "@/components/app-ui/erp/ModuleShell";

const navigation: ModuleNavGroup[] = [{
  title: "Documentos",
  items: [
    { title: "Painel", href: "/documentos", icon: "layoutDashboard", exact: true },
    { title: "GED", href: "/documentos/ged", icon: "folder" },
    { title: "Modelos", href: "/documentos/modelos", icon: "fileText" },
    { title: "Assinaturas", href: "/documentos/assinaturas", icon: "fileSignature" },
  ],
}];

export default function DocumentosLayout({ children }: { children: React.ReactNode }) {
  return <ModuleShell moduleTitle="Documentos e GED" moduleCaption="Gestão eletrônica" moduleIcon="folder" navigation={navigation}>{children}</ModuleShell>;
}
