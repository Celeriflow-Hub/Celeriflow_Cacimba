import { getTenantContextForSystemAdministration } from "@/lib/platform/tenant-context";
import { getSystemAdministratorEmail, SYSTEM_ADMIN_PROFILE_CODE } from "@/lib/administration/c3-policy";
import UsuariosClient from "./components/UsuariosClient";

export default async function UsuariosPage() {
  const { prisma } = await getTenantContextForSystemAdministration();
  const [usuarios, perfis, modulos, servidores] = await Promise.all([
    prisma.usuario.findMany({
      where: {
        email: { not: getSystemAdministratorEmail() },
        perfil: { codigo: { not: SYSTEM_ADMIN_PROFILE_CODE } },
      },
      include: {
        perfil: true,
        permissoesModulo: true,
        employee: { include: { department: true } }
      },
      orderBy: { nome: 'asc' }
    }),
    prisma.configuracaoPerfil.findMany({
      orderBy: { nome: 'asc' }
    }),
    prisma.configuracaoModulo.findMany({
      where: { ativo: true },
      orderBy: { nome: 'asc' }
    }),
    prisma.employee.findMany({
      where: { isActive: true },
      include: { department: true, secretariat: true },
      orderBy: { name: 'asc' }
    })
  ]);

  return <UsuariosClient usuarios={usuarios} perfis={perfis} modulos={modulos} servidores={servidores} />;
}
