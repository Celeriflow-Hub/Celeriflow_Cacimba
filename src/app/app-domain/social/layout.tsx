import { ModuleShell, type ModuleNavGroup } from "@/components/app-ui/erp/ModuleShell";

const navigation: ModuleNavGroup[] = [{
  title: "Atendimento SUAS",
  items: [
    { title: "Painel Social", href: "/social", icon: "layoutDashboard", exact: true },
    { title: "Atendimentos", href: "/social/atendimentos", icon: "heartHandshake" },
    { title: "Famílias e Indivíduos", href: "/social/familias", icon: "users" },
    { title: "Prontuário Eletrônico", href: "/social/prontuario", icon: "fileText" },
    { title: "Visitas", href: "/social/visitas", icon: "home" },
    { title: "Unidades", href: "/social/unidades", icon: "building2" },
    { title: "Programas e Benefícios", href: "/social/beneficios", icon: "gift" },
  ],
}];

export default function SocialLayout({ children }: { children: React.ReactNode }) {
  return <ModuleShell moduleTitle="Assistência Social" moduleCaption="Gestão SUAS" moduleIcon="heartHandshake" navigation={navigation}>{children}</ModuleShell>;
}
