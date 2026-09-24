import { Suspense } from "react";
import { ModuleShell, type ModuleNavGroup } from "@/components/app-ui/erp/ModuleShell";

const navigation: ModuleNavGroup[] = [{
  title: "Cadastros",
  items: [
    { title: "Painel", href: "/cadastros", icon: "layoutDashboard", exact: true },
    { title: "Pessoas Físicas", href: "/cadastros/pessoas-fisicas", icon: "users" },
    { title: "Pessoas Jurídicas", href: "/cadastros/pessoas-juridicas", icon: "building2" },
    { title: "Fornecedores", href: "/cadastros/fornecedores", icon: "truck" },
    { title: "Imóveis", href: "/cadastros/imoveis", icon: "home" },
    { title: "Documentos", href: "/cadastros/documentos", icon: "fileBox" },
  ],
}];

export default function CadastrosLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense>
      <ModuleShell moduleTitle="Cadastros Gerais" moduleCaption="Cadastro único" moduleIcon="users" navigation={navigation}>
        {children}
      </ModuleShell>
    </Suspense>
  );
}
