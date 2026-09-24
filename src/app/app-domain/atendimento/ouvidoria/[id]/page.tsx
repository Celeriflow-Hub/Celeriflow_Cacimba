import Link from "next/link";
import { notFound } from "next/navigation";
import { canPerformModuleOperation } from "@/lib/platform/tenant-context";
import { canViewOmbudsmanIdentity, getAttendanceContext, getOmbudsmanContextForProtocols, ombudsmanScope } from "@/lib/attendance/access";
import DocumentUpload from "../../DocumentUpload";
import { addOmbudsmanInteraction, concludeOmbudsman, createProcessFromOmbudsman, forwardOmbudsman, grantOmbudsmanAccess, respondOmbudsman, revokeOmbudsmanAccess, startOmbudsmanInvestigation, startOmbudsmanTriage } from "../../actions";
import { PageFrame } from "@/components/app-ui/PageFrame";
import { PageHeader } from "@/components/app-ui/PageHeader";

export const dynamic = "force-dynamic";

export async function OmbudsmanDetailView({
  id,
  origin = "atendimento",
  returnTo,
}: {
  id: string;
  origin?: "atendimento" | "protocolos";
  returnTo?: string;
}) {
  const context = origin === "protocolos" ? await getOmbudsmanContextForProtocols() : await getAttendanceContext();
  const ombudsman = await context.prisma.ombudsman.findFirst({
    where: { AND: [{ id }, ombudsmanScope(context)] },
    include: {
      channel: true, department: true, assignee: true, process: true,
      identity: { select: { personId: true } },
      accessGrants: { where: { userId: context.user.id }, select: { canViewIdentity: true } },
      movements: { include: { fromDepartment: { select: { name: true } }, toDepartment: { select: { name: true } }, employee: { select: { name: true } } }, orderBy: { createdAt: "asc" } },
      interactions: { include: { employee: { select: { name: true } } }, orderBy: { createdAt: "asc" } },
      documents: { include: { document: true }, orderBy: { createdAt: "desc" } },
      auditLogs: { include: { user: { select: { nome: true } } }, orderBy: { createdAt: "desc" }, take: 50 },
    },
  });
  if (!ombudsman) notFound();
  const identityAllowed = canViewOmbudsmanIdentity(context, ombudsman.isConfidential, ombudsman.accessGrants.some((grant) => grant.canViewIdentity));
  const identityId = ombudsman.identity?.personId || ombudsman.personId;
  const [identity, departments, processTypes, users, grants] = await Promise.all([
    identityAllowed && identityId ? context.prisma.person.findUnique({ where: { id: identityId }, select: { fullName: true, cpf: true } }) : null,
    context.prisma.department.findMany({ where: { isActive: true }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    context.prisma.processType.findMany({ where: { isActive: true }, include: { subjects: { where: { isActive: true } } }, orderBy: { name: "asc" } }),
    context.attendanceAccess.isAdmin && ombudsman.isConfidential ? context.prisma.usuario.findMany({ where: { ativo: true }, select: { id: true, nome: true, email: true }, orderBy: { nome: "asc" } }) : [],
    context.attendanceAccess.isAdmin && ombudsman.isConfidential ? context.prisma.ombudsmanAccess.findMany({ where: { ombudsmanId: id }, include: { user: { select: { nome: true, email: true } } }, orderBy: { createdAt: "asc" } }) : [],
  ]);
  await context.prisma.ombudsmanAuditLog.create({ data: { ombudsmanId: id, userId: context.user.id, employeeId: context.user.employeeId, action: "VIEWED", details: { confidential: ombudsman.isConfidential } } });
  if (identityAllowed && identityId) {
    await context.prisma.ombudsmanAuditLog.create({ data: { ombudsmanId: id, userId: context.user.id, employeeId: context.user.employeeId, action: "IDENTITY_VIEWED" } });
  }
  const canManage = context.attendanceAccess.isOmbudsman && context.attendanceAccess.canUpdate;
  const canCreateProcess = canManage && canPerformModuleOperation(context.user, "PROCESSOS", "create");
  const backHref = returnTo || (origin === "protocolos" ? "/protocolos/ouvidoria" : "/atendimento/ouvidoria");
  return <PageFrame className="space-y-2"><PageHeader title={ombudsman.protocolNumber} action={<div className="flex items-center gap-2">{ombudsman.isConfidential && <span className="hidden rounded bg-amber-100 px-2 py-1 text-[10px] font-bold text-amber-800 sm:inline">Confidencial</span>}<Link href={backHref} className="inline-flex h-7 items-center rounded border border-slate-300 bg-white px-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">Voltar</Link></div>} /><p className="text-xs text-slate-500">{ombudsman.type} · {ombudsman.status}</p>
    <div className="grid lg:grid-cols-3 gap-6"><section className="lg:col-span-2 bg-white border rounded-xl p-5 space-y-5"><div className="grid sm:grid-cols-2 gap-4 text-sm"><p><span className="block text-slate-500">Manifestante</span>{ombudsman.isAnonymous ? "Anônimo" : identity ? `${identity.fullName} · CPF ${identity.cpf}` : "Identidade restrita"}</p><p><span className="block text-slate-500">Canal</span>{ombudsman.channel.name}</p><p><span className="block text-slate-500">Setor atual</span>{ombudsman.department?.name || "Ouvidoria"}</p><p><span className="block text-slate-500">Responsável</span>{ombudsman.assignee?.name || "Não atribuído"}</p></div><div><h2 className="font-semibold">Assunto</h2><p>{ombudsman.subject}</p></div><div><h2 className="font-semibold">Narrativa restrita</h2><p className="whitespace-pre-wrap text-slate-700 mt-2">{ombudsman.description}</p></div>{ombudsman.response && <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4"><h2 className="font-semibold text-emerald-900">Resposta registrada</h2><p className="whitespace-pre-wrap text-emerald-800">{ombudsman.response}</p></div>}</section>
      <aside className="space-y-4"><section className="bg-white border rounded-xl p-4"><h2 className="font-semibold mb-2">Anexos GED</h2>{canManage && <DocumentUpload entityType="ombudsman" entityId={id} />}{ombudsman.documents.map((link) => <a key={link.id} href={`/api/download?url=${encodeURIComponent(link.document.fileUrl)}`} target="_blank" rel="noreferrer" className="block mt-2 text-sm text-amber-700">{link.document.title}</a>)}</section>{canManage && ombudsman.status === "Recebida" && <form action={startOmbudsmanTriage} className="bg-white border rounded-xl p-4"><input type="hidden" name="ombudsmanId" value={id} /><button className="w-full p-2 bg-amber-600 text-white rounded-lg text-sm">Iniciar triagem</button></form>}{ombudsman.status === "Encaminhada" && context.attendanceAccess.canUpdate && <form action={startOmbudsmanInvestigation} className="bg-white border rounded-xl p-4"><input type="hidden" name="ombudsmanId" value={id} /><button className="w-full p-2 border rounded-lg text-sm">Iniciar apuração</button></form>}{canManage && <form action={forwardOmbudsman} className="bg-white border rounded-xl p-4 space-y-2"><input type="hidden" name="ombudsmanId" value={id} /><h2 className="font-semibold">Encaminhar</h2><select name="toDepartmentId" required className="w-full p-2 border rounded-lg"><option value="">Setor de destino</option>{departments.filter((department) => department.id !== ombudsman.departmentId).map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}</select><textarea name="reason" required rows={2} placeholder="Motivo do encaminhamento" className="w-full p-2 border rounded-lg" /><button className="w-full p-2 border rounded-lg text-sm">Encaminhar</button></form>}</aside></div>
    <div className="grid lg:grid-cols-2 gap-6"><section className="bg-white border rounded-xl p-5 space-y-4"><h2 className="font-bold">Histórico e apuração</h2>{context.attendanceAccess.canUpdate && <form action={addOmbudsmanInteraction} className="space-y-2 border-b pb-4"><input type="hidden" name="ombudsmanId" value={id} /><textarea name="message" required rows={3} placeholder="Registro interno de apuração" className="w-full p-2 border rounded-lg" /><button className="px-3 py-2 bg-slate-800 text-white rounded-lg text-sm">Registrar</button></form>}{ombudsman.interactions.map((interaction) => <div key={interaction.id} className="border-l-2 border-amber-300 pl-3"><p className="text-sm font-semibold">{interaction.type} · {interaction.employee?.name || "Sistema"}</p><p className="whitespace-pre-wrap text-sm text-slate-700">{interaction.message}</p><small className="text-slate-500">{interaction.createdAt.toLocaleString("pt-BR")}</small></div>)}</section>
      <section className="space-y-4">{canManage && <form action={respondOmbudsman} className="bg-white border rounded-xl p-5 space-y-2"><input type="hidden" name="ombudsmanId" value={id} /><h2 className="font-bold">Resposta da Ouvidoria</h2><textarea name="response" required rows={4} defaultValue={ombudsman.response || ""} placeholder="Resposta ou providência, sem expor dados sensíveis." className="w-full p-2 border rounded-lg" /><button className="px-3 py-2 bg-emerald-600 text-white rounded-lg text-sm">Registrar resposta</button></form>}{canManage && <form action={concludeOmbudsman} className="bg-white border rounded-xl p-5 flex justify-between gap-3"><span className="text-sm">Concluir após registrar a resposta.</span><input type="hidden" name="ombudsmanId" value={id} /><button disabled={ombudsman.status !== "Aguardando Resposta" || !ombudsman.response} className="px-3 py-2 bg-slate-800 text-white rounded-lg text-sm disabled:opacity-50">Concluir</button></form>}<section className="bg-white border rounded-xl p-5"><h2 className="font-bold mb-3">Tramitação</h2>{ombudsman.movements.length ? ombudsman.movements.map((movement) => <p key={movement.id} className="text-sm mb-3"><strong>{movement.fromDepartment?.name || "Ouvidoria"} → {movement.toDepartment.name}</strong><br />{movement.reason}<br /><small className="text-slate-500">{movement.employee.name} · {movement.createdAt.toLocaleString("pt-BR")}</small></p>) : <p className="text-sm text-slate-500">Sem encaminhamentos.</p>}</section></section></div>
    <div className="grid lg:grid-cols-2 gap-6"><section className="bg-white border rounded-xl p-5 space-y-3"><h2 className="font-bold">Processo formal</h2>{ombudsman.process ? <Link href={`/protocolos/processos/${ombudsman.process.id}`} className="font-semibold text-emerald-700">{ombudsman.process.protocolNumber} · {ombudsman.process.status}</Link> : canCreateProcess && <form action={createProcessFromOmbudsman} className="space-y-2"><input type="hidden" name="ombudsmanId" value={id} /><select name="processTypeId" required className="w-full p-2 border rounded-lg"><option value="">Tipo de processo</option>{processTypes.map((type) => <option key={type.id} value={type.id}>{type.name}</option>)}</select><select name="subjectId" required className="w-full p-2 border rounded-lg"><option value="">Assunto do processo</option>{processTypes.flatMap((type) => type.subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name} ({type.name})</option>))}</select><select name="initialDepartmentId" className="w-full p-2 border rounded-lg"><option value="">Setor configurado</option>{departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}</select><textarea name="disclosure" required rows={4} placeholder="Resumo autorizado. Não inclua identidade, CPF, contatos ou detalhes sigilosos." className="w-full p-2 border rounded-lg" /><button className="px-3 py-2 bg-emerald-600 text-white rounded-lg text-sm">Gerar processo com resumo autorizado</button></form>}</section>{context.attendanceAccess.isAdmin && ombudsman.isConfidential && <section className="bg-white border rounded-xl p-5"><h2 className="font-bold mb-3">Conceder acesso confidencial</h2><form action={grantOmbudsmanAccess} className="space-y-2"><input type="hidden" name="ombudsmanId" value={id} /><select name="userId" required className="w-full p-2 border rounded-lg"><option value="">Usuário autorizado</option>{users.map((user) => <option key={user.id} value={user.id}>{user.nome} · {user.email}</option>)}</select><label className="flex gap-2 text-sm"><input name="canViewIdentity" type="checkbox" /> Permitir visualizar identidade</label><button className="px-3 py-2 border rounded-lg text-sm">Conceder ou atualizar acesso</button></form>{grants.length > 0 && <div className="mt-4 space-y-2 text-sm">{grants.map((grant) => <form key={grant.id} action={revokeOmbudsmanAccess} className="flex items-center justify-between gap-2 border-t pt-2"><input type="hidden" name="ombudsmanId" value={id} /><input type="hidden" name="userId" value={grant.userId} /><span>{grant.user.nome} {grant.canViewIdentity && "(identidade)"}</span><button className="text-red-700">Revogar</button></form>)}</div>}</section>}</div>
    {context.attendanceAccess.isManager && <section className="bg-white border rounded-xl p-5"><h2 className="font-bold mb-3">Auditoria</h2>{ombudsman.auditLogs.map((log) => <p key={log.id} className="text-sm mb-2">{log.action} · {log.user.nome} · {log.createdAt.toLocaleString("pt-BR")}</p>)}</section>}
  </PageFrame>;
}

export default async function OmbudsmanDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ returnTo?: string | string[] }>;
}) {
  const { id } = await params;
  const requestedReturnTo = searchParams ? await searchParams : {};
  const rawReturnTo = Array.isArray(requestedReturnTo.returnTo) ? requestedReturnTo.returnTo[0] : requestedReturnTo.returnTo;
  const returnTo = rawReturnTo?.startsWith("/atendimento/ouvidoria") ? rawReturnTo : undefined;
  return <OmbudsmanDetailView id={id} returnTo={returnTo} />;
}
