import type { Metadata } from "next";
import { PortalShell } from "@/components/portal-institucional/PortalShell";

export const metadata: Metadata = {
  title: "Portal Oficial | Prefeitura Municipal de Divino de São Lourenço",
  description: "Portal oficial da Prefeitura Municipal de Divino de São Lourenço — informações institucionais, serviços, notícias e transparência.",
};

export default function InstitutionalPortalLayout({ children }: { children: React.ReactNode }) {
  return <PortalShell>{children}</PortalShell>;
}
