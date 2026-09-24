import { getTenantContextForSystemAdministration } from "@/lib/platform/tenant-context";
import { SYSTEM_ADMIN_PROFILE_CODE } from "@/lib/administration/c3-policy";
import PerfisClient from "./PerfisClient";

export const dynamic = "force-dynamic";

export default async function PerfisPage() {
  const { prisma } = await getTenantContextForSystemAdministration();

  // Fetch profiles ordered by name
  const allPerfis = await prisma.configuracaoPerfil.findMany({
    where: { codigo: { not: SYSTEM_ADMIN_PROFILE_CODE } },
    orderBy: { createdAt: "asc" },
    include: {
      usuarios: {
        select: {
          permissoesModulo: {
            include: { modulo: { select: { codigo: true } } },
          },
        },
      },
    },
  });

  // Display duplicates without mutating authorization configuration during a page read.
  const seenNames = new Map<string, typeof allPerfis[0]>();

  for (const perfil of allPerfis) {
    const key = perfil.nome.trim().toLowerCase();
    if (!seenNames.has(key)) {
      seenNames.set(key, perfil);
    } else {
      // Keep the one that has description or valid permissions json
      const existing = seenNames.get(key)!;
      if (!existing.descricao && perfil.descricao) {
        seenNames.set(key, perfil);
      }
    }
  }

  const perfisDeduplicados = Array.from(seenNames.values())
    .sort((a, b) => a.nome.localeCompare(b.nome))
    .map(({ usuarios, ...perfil }) => ({
      ...perfil,
      legacyModuleCodes: [...new Set(usuarios.flatMap((user) => user.permissoesModulo
        .filter((permission) => permission.canView || permission.canEdit)
        .map((permission) => permission.modulo.codigo.toUpperCase())))],
    }));

  return <PerfisClient perfis={perfisDeduplicados} />;
}
