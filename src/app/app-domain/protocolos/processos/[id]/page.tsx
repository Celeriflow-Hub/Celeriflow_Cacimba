import { ArrowLeft, Clock, FileText, User, CheckCircle2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { getProtocolContext, protocolScope } from "@/lib/protocols/access";
import { canViewModule } from "@/lib/platform/tenant-context";
import { notFound } from "next/navigation";
import ProcessControls from "./ProcessControls";
import { PageFrame } from "@/components/app-ui/PageFrame";

export const dynamic = "force-dynamic";

export default async function ProcessoDetalhesPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams?: Promise<{ returnTo?: string | string[] }>;
}) {
  const requestTime = new Date();
  const context = await getProtocolContext();
  const { prisma, user } = context;
  const requestedReturnTo = searchParams ? await searchParams : {};
  const rawReturnTo = Array.isArray(requestedReturnTo.returnTo) ? requestedReturnTo.returnTo[0] : requestedReturnTo.returnTo;
  const returnTo = rawReturnTo?.startsWith("/protocolos/processos") ? rawReturnTo : "/protocolos/processos";
  const processo = await prisma.process.findFirst({
    where: { id: params.id, ...protocolScope(context) },
    include: {
      processType: true,
      subject: true,
      person: true,
      company: true,
      currentDepartment: true,
      dispatches: {
        include: { employee: true },
        orderBy: { createdAt: 'desc' }
      },
      movements: {
        include: { fromDepartment: true, toDepartment: true, employee: true, receivedByEmployee: true },
        orderBy: { movedAt: 'desc' }
      },
      documents: {
        include: { employee: true, document: true },
        orderBy: { createdAt: 'desc' }
      },
      events: {
        include: { employee: true, department: true },
        orderBy: { createdAt: 'desc' }
      },
      genericWorkflowInstance: {
        include: { definition: { include: { stages: { orderBy: { position: "asc" } } } } },
      },
    }
  });

  if (!processo) {
    notFound();
  }

  const [departamentos, documentClasses, signers] = await Promise.all([
    prisma.department.findMany({ where: { isActive: true }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.documentClass.findMany({ where: { isActive: true, signaturePolicy: "INTERNAL_ALLOWED" }, select: { id: true, label: true }, orderBy: { label: "asc" } }),
    prisma.usuario.findMany({
      where: { ativo: true, perfil: { ativo: true } },
      include: { perfil: true, permissoesModulo: { include: { modulo: { select: { codigo: true } } } } },
      orderBy: { nome: "asc" },
    }),
  ]);
  const canOperate = context.protocolAccess.canUpdate && Boolean(
    user.employeeId && user.departmentId && user.departmentId === processo.currentDepartmentId,
  );
  const pendingMovement = processo.movements.find((movement) => movement.status === "AWAITING_RECEIPT" && !movement.receivedAt) || null;
  const canCancelPending = context.protocolAccess.canUpdate && Boolean(
    user.departmentId && pendingMovement?.fromDepartmentId === user.departmentId && processo.status === "Aguardando Recebimento",
  );
  const canRejectPending = context.protocolAccess.canUpdate && Boolean(
    user.departmentId && pendingMovement?.toDepartmentId === user.departmentId && processo.status === "Aguardando Recebimento",
  );

  const interessadoNome = processo.person?.fullName || processo.company?.corporateName || "Não Informado";
  const interessadoDoc = processo.person?.cpf || processo.company?.cnpj || "";
  const daysToDeadline = processo.expectedCompletionAt
    ? Math.ceil((processo.expectedCompletionAt.getTime() - requestTime.getTime()) / 86_400_000)
    : null;
  const genericStage = processo.genericWorkflowInstance?.definition.stages.find((stage) => stage.position === processo.genericWorkflowInstance?.currentPosition) || null;

  return (
    <PageFrame className="max-w-6xl space-y-3">
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Link href={returnTo} className="text-emerald-600 hover:text-emerald-700 text-sm font-semibold flex items-center gap-2 mb-4 w-fit transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Voltar para a Caixa do Setor
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Processo {processo.protocolNumber}</h1>
            <span className={`px-2.5 py-1 rounded-md text-xs font-semibold ${
              processo.status === 'Concluído' ? 'bg-emerald-100 text-emerald-700' : 
              processo.status === 'Aberto' ? 'bg-blue-100 text-blue-700' :
              processo.status === 'Arquivado' ? 'bg-slate-100 text-slate-600' :
              'bg-amber-100 text-amber-700'
            }`}>
              {processo.status}
            </span>
          </div>
          <p className="text-slate-500 mt-1">{processo.processType.name} - {processo.subject.name}</p>
        </div>
        
        <ProcessControls
          processId={processo.id}
          status={processo.status}
          currentDepartmentId={processo.currentDepartmentId}
          canOperate={canOperate}
          departments={departamentos}
          documentClasses={documentClasses}
          signableDocuments={processo.documents.flatMap((item) => item.document?.status === "Válido" && item.document.documentClassId ? [{ id: item.document.id, title: item.document.title }] : [])}
          signers={signers.filter((signer) => canViewModule({
            id: signer.id, firebaseUid: "", email: signer.email, name: signer.nome, role: signer.perfil.nome, profileCode: signer.perfil.codigo,
            permissions: signer.perfil.permissoes,
            modulePermissions: signer.permissoesModulo.map((permission) => ({ code: permission.modulo.codigo.toUpperCase(), canView: permission.canView, canEdit: permission.canEdit })),
            allowedBudgetUnitIds: [], employeeId: signer.employeeId, departmentId: null, secretariatId: null,
          }, "PROCESSOS")).map((signer) => ({ id: signer.id, nome: signer.nome, email: signer.email }))}
          canPublishPublicNotice={context.protocolAccess.isAdmin}
          pendingMovement={pendingMovement ? { id: pendingMovement.id, fromDepartmentName: pendingMovement.fromDepartment?.name || null, toDepartmentName: pendingMovement.toDepartment.name } : null}
          canCancelPending={canCancelPending}
          canRejectPending={canRejectPending}
          genericWorkflow={processo.genericWorkflowInstance && genericStage ? {
            currentPosition: processo.genericWorkflowInstance.currentPosition,
            totalStages: processo.genericWorkflowInstance.definition.stages.length,
            stageLabel: genericStage.label,
            status: processo.genericWorkflowInstance.status,
          } : null}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Coluna Principal - Histórico e Descrição */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Descrição Inicial</h3>
            <p className="text-slate-700 whitespace-pre-wrap">{processo.description || "Nenhuma descrição fornecida na abertura do protocolo."}</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50/50">
              <h3 className="text-sm font-semibold text-slate-800">Despachos e Pareceres</h3>
            </div>
            <div className="divide-y divide-slate-100">
              {processo.dispatches.length === 0 ? (
                <div className="p-6 text-center text-slate-500 text-sm">Nenhum despacho adicionado a este processo.</div>
              ) : (
                processo.dispatches.map(dispatch => (
                  <div key={dispatch.id} className="p-4 sm:p-6">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-xs">
                          {dispatch.employee.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{dispatch.employee.name}</p>
                          <p className="text-xs text-slate-500">{dispatch.dispatchType}</p>
                        </div>
                      </div>
                      <div className="text-xs text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(dispatch.createdAt).toLocaleString('pt-BR')}
                      </div>
                    </div>
                    <div className="pl-10 text-slate-700 text-sm mt-2 whitespace-pre-wrap">
                      {dispatch.content}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50/50">
              <h3 className="text-sm font-semibold text-slate-800">Timeline do Processo</h3>
            </div>
            <div className="divide-y divide-slate-100">
              {processo.events.length === 0 ? (
                <p className="p-6 text-center text-sm text-slate-500">Nenhum evento operacional registrado.</p>
              ) : processo.events.map(event => (
                <div key={event.id} className="p-4 sm:p-5">
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-sm font-semibold text-slate-800">{event.description || event.eventType}</p>
                    <p className="whitespace-nowrap text-xs text-slate-400">{new Date(event.createdAt).toLocaleString('pt-BR')}</p>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {event.employee?.name || "Sistema"}{event.department ? ` · ${event.department.name}` : ""}
                    {event.previousStatus && event.newStatus ? ` · ${event.previousStatus} → ${event.newStatus}` : ""}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Coluna Lateral - Informações e Tramitações */}
        <div className="space-y-6">
          
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 space-y-4">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Informações Gerais</h3>
            
            <div>
              <p className="text-xs text-slate-400 font-medium">Interessado</p>
              <div className="flex items-center gap-2 mt-1">
                <User className="w-4 h-4 text-slate-400" />
                <p className="text-sm font-semibold text-slate-800">{interessadoNome}</p>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">{interessadoDoc}</p>
            </div>

            <div>
              <p className="text-xs text-slate-400 font-medium">Setor Atual</p>
              <p className="text-sm font-semibold text-slate-800 mt-1">{processo.currentDepartment?.name || "Não atribuído"}</p>
              {genericStage && <p className="mt-1 text-xs text-indigo-700">Fluxo genérico v{processo.genericWorkflowInstance?.definitionVersion} · etapa {genericStage.position}: {genericStage.label}</p>}
            </div>

            <div>
              <p className="text-xs text-slate-400 font-medium">Data de Abertura</p>
              <p className="text-sm font-semibold text-slate-800 mt-1">{new Date(processo.createdAt).toLocaleDateString('pt-BR')} às {new Date(processo.createdAt).toLocaleTimeString('pt-BR')}</p>
            </div>

            <div>
              <p className="text-xs text-slate-400 font-medium">Prazo previsto</p>
              {processo.expectedCompletionAt ? <><p className="text-sm font-semibold text-slate-800 mt-1">{new Date(processo.expectedCompletionAt).toLocaleDateString('pt-BR')}</p><p className={`text-xs mt-0.5 ${daysToDeadline !== null && daysToDeadline < 0 ? "text-red-600" : daysToDeadline !== null && daysToDeadline <= 3 ? "text-amber-600" : "text-emerald-600"}`}>{daysToDeadline !== null && daysToDeadline < 0 ? `${Math.abs(daysToDeadline)} dia(s) atrasado` : `${daysToDeadline} dia(s) restante(s)`}</p></> : <p className="text-sm text-slate-500 mt-1">Sem prazo definido</p>}
            </div>

            <div>
              <p className="text-xs text-slate-400 font-medium">Prioridade</p>
              <div className="flex items-center gap-1.5 mt-1">
                {processo.priority === 'Urgente' ? <AlertCircle className="w-4 h-4 text-red-500" /> : <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                <p className="text-sm font-semibold text-slate-800">{processo.priority}</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center">
              <h3 className="text-sm font-semibold text-slate-800">Documentos</h3>
              <span className="bg-slate-200 text-slate-600 text-xs font-bold px-2 py-0.5 rounded-full">{processo.documents.length}</span>
            </div>
            <div className="divide-y divide-slate-100">
              {processo.documents.length === 0 ? (
                <div className="p-4 text-center text-slate-500 text-sm">Nenhum anexo.</div>
              ) : (
                processo.documents.map(doc => (
                  doc.document ? <a key={doc.id} href={`/api/download?url=${encodeURIComponent(doc.document.fileUrl)}`} target="_blank" rel="noreferrer" className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-indigo-500" />
                      <div>
                        <p className="text-sm font-medium text-slate-800">{doc.document.title}</p>
                        <p className="text-xs text-slate-400">{new Date(doc.createdAt).toLocaleDateString('pt-BR')}</p>
                      </div>
                    </div>
                  </a> : null
                ))
              )}
            </div>
          </div>
          
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50/50">
              <h3 className="text-sm font-semibold text-slate-800">Histórico de Tramitação</h3>
            </div>
            <div className="p-4 space-y-4">
              {processo.movements.length === 0 ? (
                <p className="text-sm text-slate-500 text-center">Processo ainda não foi tramitado.</p>
              ) : (
                <div className="relative border-l-2 border-slate-200 ml-3 space-y-6">
                  {processo.movements.map((mov) => (
                    <div key={mov.id} className="relative pl-6">
                      <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-white border-2 border-slate-300"></div>
                      <p className="text-xs font-semibold text-slate-500">{new Date(mov.movedAt).toLocaleDateString('pt-BR')} {new Date(mov.movedAt).toLocaleTimeString('pt-BR')}</p>
                      <p className="text-sm font-bold text-slate-800 mt-1">
                        Encaminhado para {mov.toDepartment.name}
                      </p>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Por: {mov.employee?.name || "Sistema"}
                      </p>
                      <p className="mt-1 text-xs font-semibold text-slate-500">
                        {mov.status === "AWAITING_RECEIPT" ? "Aguardando recebimento" : mov.status === "RECEIVED" ? `Recebido${mov.receivedByEmployee ? ` por ${mov.receivedByEmployee.name}` : ""}` : mov.status === "CANCELLED" ? "Encaminhamento cancelado" : mov.status === "REJECTED" ? `Recebimento recusado${mov.receivedByEmployee ? ` por ${mov.receivedByEmployee.name}` : ""}` : mov.status}
                      </p>
                       {mov.reason && <p className="text-sm text-slate-500 mt-2 italic">&quot;{mov.reason}&quot;</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </PageFrame>
  );
}
