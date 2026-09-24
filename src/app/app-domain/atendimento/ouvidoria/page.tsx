import { MessageSquareWarning, EyeOff } from "lucide-react";
import Link from "next/link";
import { canViewOmbudsmanIdentity, getAttendanceContext, ombudsmanScope } from "@/lib/attendance/access";
import { PageFrame } from "@/components/app-ui/PageFrame";
import { PageHeader } from "@/components/app-ui/PageHeader";
import OuvidoriaClient from "./OuvidoriaClient";

export const dynamic = "force-dynamic";

export default async function OuvidoriaPage() {
  const context = await getAttendanceContext();
  const { prisma } = context;
  const manifestacoes = await prisma.ombudsman.findMany({
    where: ombudsmanScope(context),
    orderBy: { createdAt: 'desc' },
    select: { id: true, protocolNumber: true, type: true, subject: true, isAnonymous: true, isConfidential: true, status: true, createdAt: true, person: { select: { fullName: true } }, accessGrants: { where: { userId: context.user.id }, select: { canViewIdentity: true } } },
  });
  const safeManifestacoes = manifestacoes.map((manifestacao) => ({
    ...manifestacao,
    person: canViewOmbudsmanIdentity(context, manifestacao.isConfidential, manifestacao.accessGrants.some((grant) => grant.canViewIdentity)) ? manifestacao.person : null,
  }));

  return (
    <PageFrame className="flex h-full min-h-0 flex-col">
      <PageHeader title="Ouvidoria" icon={<MessageSquareWarning className="size-4 shrink-0 text-amber-600" />} action={context.attendanceAccess.isOmbudsman ? <Link href="/atendimento/ouvidoria/nova" className="inline-flex h-7 items-center rounded bg-amber-700 px-3 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-amber-800">Nova manifestação</Link> : undefined} />

      <div className="mb-2 flex shrink-0 gap-2 rounded border border-amber-200 bg-amber-50 p-2 text-xs text-amber-800">
        <EyeOff className="mt-0.5 size-4 shrink-0" />
        <div>
          <strong className="mb-0.5 block">Área Restrita (LGPD)</strong>
          Denúncias anônimas e informações sigilosas são protegidas por lei. O vazamento de dados desta tela configura infração grave.
        </div>
      </div>

      <OuvidoriaClient initialManifestacoes={safeManifestacoes} canManage={context.attendanceAccess.isOmbudsman} />
    </PageFrame>
  );
}
