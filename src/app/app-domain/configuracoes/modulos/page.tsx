import React from "react";
import { getTenantContextForModule } from "@/lib/platform/tenant-context";
import ModulosClient from "./ModulosClient";

export const dynamic = "force-dynamic";

export default async function ModulosPage() {
  const { prisma } = await getTenantContextForModule("CONFIGURACOES");
  
  const modulos = await prisma.configuracaoModulo.findMany({
    orderBy: { nome: "asc" },
  });

  return <ModulosClient initialModulos={modulos} />;
}
