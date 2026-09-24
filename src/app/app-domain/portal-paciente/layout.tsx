import { ModuleShell, type ModuleNavGroup } from "@/components/app-ui/erp/ModuleShell";

const navigation: ModuleNavGroup[] = [{
  title: "Portal do Paciente",
  items: [
    { title: "Início", href: "/portal-paciente", icon: "home", exact: true },
    { title: "Minha agenda", href: "/portal-paciente/agenda", icon: "calendar" },
    { title: "Minha saúde", href: "/portal-paciente/saude", icon: "fileHeart" },
    { title: "Ouvidoria", href: "/portal-paciente/ouvidoria", icon: "megaphone" },
    { title: "Meus dados", href: "/portal-paciente/dados", icon: "userRound" },
  ],
}];

export default function PortalPacienteLayout({ children }: { children: React.ReactNode }) {
  return <ModuleShell moduleTitle="Portal do Paciente" moduleCaption="Serviços pessoais de saúde" moduleIcon="heartHandshake" navigation={navigation}>{children}</ModuleShell>;
}
