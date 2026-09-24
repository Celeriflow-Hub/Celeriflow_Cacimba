import { ModuleShell, type ModuleNavGroup } from "@/components/app-ui/erp/ModuleShell";

const navigation: ModuleNavGroup[] = [{
  title: "Cultura e lazer",
  items: [
    { title: "Painel", href: "/cultura", icon: "layoutDashboard", exact: true },
    { title: "Gestão Cultural", href: "/cultura/gestao-cultural", icon: "palette" },
    { title: "Fomento e Projetos", href: "/cultura/fomento-projetos", icon: "sparkles" },
    { title: "Esporte e Lazer", href: "/cultura/esporte-lazer", icon: "trophy" },
    { title: "Espaços e Reservas", href: "/cultura/espacos-reservas", icon: "mapPin" },
    { title: "Eventos", href: "/cultura/eventos", icon: "calendar" },
    { title: "Conselhos e Fundos", href: "/cultura/conselhos-fundos", icon: "shieldAlert" },
    { title: "Documentos", href: "/cultura/documentos", icon: "fileText" },
  ],
}];

export default function CulturaLayout({ children }: { children: React.ReactNode }) {
  return <ModuleShell moduleTitle="Cultura e Lazer" moduleCaption="Secretaria e esportes" moduleIcon="palette" navigation={navigation}>{children}</ModuleShell>;
}
