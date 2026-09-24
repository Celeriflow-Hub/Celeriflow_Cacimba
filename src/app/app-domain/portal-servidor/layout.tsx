"use client";

import { ModuleShell } from "@/components/app-ui/erp/ModuleShell";
import { portalServidorNavigation } from "./navigation";

export default function PortalServidorLayout({ children }: { children: React.ReactNode }) {
  return (
    <ModuleShell
      moduleTitle="Portal do Servidor"
      moduleCaption="Autosserviço funcional"
      moduleIcon="badgeCheck"
      navigation={portalServidorNavigation}
    >
      {children}
    </ModuleShell>
  );
}
