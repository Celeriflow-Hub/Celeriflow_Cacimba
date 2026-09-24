import { ModuleShell, type ModuleNavGroup } from "@/components/app-ui/erp/ModuleShell";

const navigation: ModuleNavGroup[] = [{
  title: "Gestão escolar",
  items: [
    { title: "Painel", href: "/educacao", icon: "layoutDashboard", exact: true },
    { title: "Escolas", href: "/educacao/escolas", icon: "school" },
    { title: "Matrículas e Turmas", href: "/educacao/matriculas", icon: "users" },
    { title: "Professores", href: "/educacao/professores", icon: "bookOpen" },
    { title: "Calendário", href: "/educacao/calendario", icon: "calendar" },
    { title: "Merenda Escolar", href: "/educacao/merenda", icon: "utensils" },
    { title: "Transporte Escolar", href: "/educacao/transporte", icon: "bus" },
  ],
}];

export default function EducacaoLayout({ children }: { children: React.ReactNode }) {
  return <ModuleShell moduleTitle="Educação" moduleCaption="Gestão escolar" moduleIcon="graduationCap" navigation={navigation}>{children}</ModuleShell>;
}
