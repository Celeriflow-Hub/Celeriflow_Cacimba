import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowLeft, Edit, Gavel } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageFrame } from "@/components/app-ui/PageFrame";
import { PageHeader } from "@/components/app-ui/PageHeader";
import { canPerformModuleOperation, getTenantContextForModule } from "@/lib/platform/tenant-context";
import {
  BIDDING_PHASE_DEFINITIONS,
  biddingStatusLabel,
  canEditBiddingDetails,
  getAllowedBiddingStatusTransitions,
} from "@/lib/compras/bidding-workflow";
import { BiddingStatusControls } from "../BiddingStatusControls";
import { BiddingWorkflowPanel } from "../BiddingWorkflowPanel";

function formatDate(value: Date | null, pattern: string) {
  return value ? format(value, pattern, { locale: ptBR }) : "Não informada";
}

function supplierName(supplier: {
  company: { corporateName: string; tradeName: string | null } | null;
  person: { fullName: string } | null;
}) {
  return supplier.company?.tradeName || supplier.company?.corporateName || supplier.person?.fullName || "Fornecedor sem identificação";
}

export default async function LicitacaoDetalhesPage({ params }: { params: Promise<{ id: string }> }) {
  const context = await getTenantContextForModule("COMPRAS");
  const { id } = await params;
  const licitacao = await context.prisma.bidding.findUnique({
    where: { id },
    include: {
      process: {
        include: {
          secretariat: { select: { name: true } },
          purchaseRequest: { select: { number: true, status: true } },
          items: {
            include: {
              catalogItem: { select: { name: true, unit: true } },
              material: { select: { name: true, unitOfMeasure: true } },
            },
            orderBy: { createdAt: "asc" },
          },
        },
      },
      biddingAppointmentAssignments: {
        where: { status: "Ativa" },
        orderBy: { assignedAt: "desc" },
        include: {
          appointment: {
            include: {
              members: {
                where: { status: "Ativo" },
                orderBy: { createdAt: "asc" },
                include: { employee: { select: { name: true } } },
              },
            },
          },
        },
      },
      biddingPhases: {
        where: { version: 1 },
        orderBy: { sequence: "asc" },
      },
      biddingActs: {
        orderBy: { occurredAt: "desc" },
        take: 60,
        include: {
          phase: { select: { name: true } },
          biddingLot: { select: { number: true } },
          actorUsuario: { select: { nome: true } },
        },
      },
      biddingParticipants: {
        orderBy: { registeredAt: "asc" },
        include: {
          supplier: {
            select: {
              id: true,
              company: { select: { corporateName: true, tradeName: true } },
              person: { select: { fullName: true } },
            },
          },
        },
      },
      biddingLots: {
        orderBy: { number: "asc" },
        include: {
          items: {
            include: {
              purchaseProcessItem: {
                include: {
                  catalogItem: { select: { name: true, unit: true } },
                  material: { select: { name: true, unitOfMeasure: true } },
                },
              },
            },
          },
          eligibilityDecisions: {
            orderBy: [{ decidedAt: "desc" }, { createdAt: "desc" }],
          },
          bids: {
            orderBy: { sequence: "desc" },
            include: {
              participant: {
                include: {
                  supplier: {
                    select: {
                      company: { select: { corporateName: true, tradeName: true } },
                      person: { select: { fullName: true } },
                    },
                  },
                },
              },
            },
          },
          results: {
            where: { isCurrent: true },
            include: {
              participant: {
                include: {
                  supplier: {
                    select: {
                      company: { select: { corporateName: true, tradeName: true } },
                      person: { select: { fullName: true } },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });
  if (!licitacao) notFound();

  const participantSupplierIds = licitacao.biddingParticipants.map((participant) => participant.supplierId);
  const assignedAppointmentIds = new Set(licitacao.biddingAppointmentAssignments.map((assignment) => assignment.appointmentId));
  const [availableAppointments, employees, suppliers, users, portalIdentities, lifecycleEvents] = await Promise.all([
    context.prisma.biddingAppointment.findMany({
      where: { status: "Ativa" },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        members: {
          where: { status: "Ativo" },
          orderBy: { createdAt: "asc" },
          include: { employee: { select: { name: true } } },
        },
      },
    }),
    context.prisma.employee.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, role: { select: { name: true } } },
    }),
    context.prisma.supplier.findMany({
      where: { status: "Ativo" },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        company: { select: { corporateName: true, tradeName: true } },
        person: { select: { fullName: true } },
      },
    }),
    context.prisma.usuario.findMany({
      where: { ativo: true },
      orderBy: { nome: "asc" },
      take: 150,
      select: { id: true, nome: true, email: true },
    }),
    context.prisma.supplierPortalIdentity.findMany({
      where: { supplierId: { in: participantSupplierIds } },
      orderBy: { createdAt: "asc" },
      include: { usuario: { select: { nome: true, email: true } } },
    }),
    context.prisma.procurementLifecycleEvent.findMany({
      where: { entityType: "BIDDING", entityId: licitacao.id },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { actorUsuario: { select: { nome: true } } },
    }),
  ]);

  const canUpdate = canPerformModuleOperation(context.user, "COMPRAS", "update");
  const canEditDetails = canUpdate && canEditBiddingDetails(licitacao.status);
  const allowedStatuses = getAllowedBiddingStatusTransitions(licitacao.status);

  return (
    <PageFrame className="space-y-2">
      <PageHeader
        title="Detalhes da Licitação"
        icon={<Gavel className="size-4 shrink-0 text-amber-600" />}
        action={(
          <>
            <Link href="/compras/licitacoes" aria-label="Voltar"><Button variant="outline" size="icon"><ArrowLeft className="size-4" /></Button></Link>
            {canEditDetails ? <Link href={`/compras/licitacoes/${licitacao.id}/editar`}><Button variant="outline" size="sm"><Edit className="size-3.5" /><span className="hidden sm:inline">Editar</span></Button></Link> : null}
          </>
        )}
      />

      <Card className="rounded-md">
        <CardHeader className="border-b p-3"><CardTitle className="text-sm">Informações gerais</CardTitle></CardHeader>
        <CardContent className="space-y-3 p-3 text-sm">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div><p className="font-medium text-muted-foreground">Número</p><p className="text-lg font-semibold">{licitacao.number}</p></div>
            <div><p className="font-medium text-muted-foreground">Situação</p><Badge variant="secondary">{biddingStatusLabel(licitacao.status)}</Badge></div>
            <div><p className="font-medium text-muted-foreground">Modalidade</p><p>{licitacao.modality}</p></div>
            <div><p className="font-medium text-muted-foreground">Secretaria</p><p>{licitacao.process.secretariat.name}</p></div>
          </div>
          <div className="border-t pt-3"><p className="font-medium text-muted-foreground">Objeto</p><p>{licitacao.process.object}</p></div>
          <div className="grid gap-3 border-t pt-3 sm:grid-cols-3">
            <div><p className="font-medium text-muted-foreground">Processo de compra</p><p>{licitacao.process.number}</p></div>
            <div><p className="font-medium text-muted-foreground">Publicação</p><p>{formatDate(licitacao.publicationDate, "dd/MM/yyyy")}</p></div>
            <div><p className="font-medium text-muted-foreground">Prazo para lances</p><p>{formatDate(licitacao.sessionDate, "dd/MM/yyyy HH:mm")}</p></div>
          </div>
          <p className="border-t pt-3 text-xs text-muted-foreground">No POC, a data da sessão é o limite para apresentação de lances no portal do fornecedor.</p>
        </CardContent>
      </Card>

      <Card className="rounded-md">
        <CardHeader className="border-b p-3"><CardTitle className="text-sm">Situação do certame</CardTitle><CardDescription className="text-xs">As transições atualizam fases, lotes e atos persistidos.</CardDescription></CardHeader>
        <CardContent className="p-3">
          {canUpdate ? <BiddingStatusControls id={licitacao.id} currentStatus={biddingStatusLabel(licitacao.status)} allowedStatuses={allowedStatuses} /> : <p className="text-sm text-muted-foreground">Seu perfil possui acesso somente para consulta.</p>}
        </CardContent>
      </Card>

      <BiddingWorkflowPanel
        biddingId={licitacao.id}
        biddingStatus={licitacao.status}
        canUpdate={canUpdate}
        workflowInitialized={licitacao.biddingPhases.length >= BIDDING_PHASE_DEFINITIONS.length}
        phases={licitacao.biddingPhases.map((phase) => ({
          id: phase.id,
          code: phase.code,
          name: phase.name,
          sequence: phase.sequence,
          status: phase.status,
          isCurrent: phase.isCurrent,
          startedAt: phase.startedAt?.toISOString() ?? null,
          completedAt: phase.completedAt?.toISOString() ?? null,
        }))}
        appointments={licitacao.biddingAppointmentAssignments.map((assignment) => ({
          id: assignment.id,
          kind: assignment.appointment.kind,
          name: assignment.appointment.name,
          status: assignment.status,
          assignedAt: assignment.assignedAt.toISOString(),
          role: assignment.role,
          members: assignment.appointment.members.map((member) => ({
            id: member.id,
            employeeName: member.employee.name,
            role: member.role,
            status: member.status,
          })),
        }))}
        availableAppointments={availableAppointments.filter((appointment) => !assignedAppointmentIds.has(appointment.id)).map((appointment) => ({
          id: appointment.id,
          kind: appointment.kind,
          name: appointment.name,
          status: appointment.status,
          assignedAt: appointment.createdAt.toISOString(),
          role: null,
          members: appointment.members.map((member) => ({
            id: member.id,
            employeeName: member.employee.name,
            role: member.role,
            status: member.status,
          })),
        }))}
        employees={employees.map((employee) => ({ id: employee.id, name: employee.name, role: employee.role?.name ?? null }))}
        suppliers={suppliers.map((supplier) => ({ id: supplier.id, name: supplierName(supplier) }))}
        users={users.map((user) => ({ id: user.id, name: user.nome, email: user.email }))}
        participants={licitacao.biddingParticipants.map((participant) => ({
          id: participant.id,
          supplierId: participant.supplierId,
          supplierName: supplierName(participant.supplier),
          displayCode: participant.displayCode,
          status: participant.status,
          registeredAt: participant.registeredAt.toISOString(),
          notes: participant.notes,
        }))}
        portalIdentities={portalIdentities.map((identity) => ({
          id: identity.id,
          supplierId: identity.supplierId,
          usuarioId: identity.usuarioId,
          userName: identity.usuario.nome,
          userEmail: identity.usuario.email,
          status: identity.status,
        }))}
        processItems={licitacao.process.items.map((item) => ({
          id: item.id,
          label: item.catalogItem?.name || item.material?.name || item.customName || "Item sem descrição",
          unit: item.catalogItem?.unit || item.material?.unitOfMeasure || "UN",
          quantity: item.quantity,
          estimatedUnitValue: item.estimatedUnitValue,
        }))}
        lots={licitacao.biddingLots.map((lot) => {
          const latestEligibility = new Map<string, typeof lot.eligibilityDecisions[number]>();
          for (const decision of lot.eligibilityDecisions) {
            if (!latestEligibility.has(decision.participantId)) latestEligibility.set(decision.participantId, decision);
          }
          const result = lot.results[0] ?? null;
          return {
            id: lot.id,
            number: lot.number,
            description: lot.description,
            status: lot.status,
            estimatedValue: lot.estimatedValueDecimal?.toString() ?? null,
            items: lot.items.map((item) => ({
              id: item.purchaseProcessItemId,
              label: item.purchaseProcessItem.catalogItem?.name || item.purchaseProcessItem.material?.name || item.purchaseProcessItem.customName || "Item sem descrição",
              quantity: item.quantity,
              unit: item.purchaseProcessItem.catalogItem?.unit || item.purchaseProcessItem.material?.unitOfMeasure || "UN",
            })),
            eligibility: [...latestEligibility.values()].map((decision) => ({
              id: decision.id,
              participantId: decision.participantId,
              status: decision.status,
              reason: decision.reason,
              decidedAt: decision.decidedAt.toISOString(),
            })),
            bids: lot.bids.map((bid) => ({
              id: bid.id,
              participantId: bid.participantId,
              participantLabel: bid.participant.displayCode || supplierName(bid.participant.supplier),
              sequence: bid.sequence,
              status: bid.status,
              totalValue: bid.totalValueDecimal.toString(),
              unitValue: bid.unitValueDecimal?.toString() ?? null,
              submittedAt: bid.submittedAt.toISOString(),
            })),
            result: result ? {
              id: result.id,
              participantLabel: result.participant.displayCode || supplierName(result.participant.supplier),
              status: result.status,
              totalValue: result.totalValueDecimal.toString(),
              decidedAt: result.decidedAt.toISOString(),
            } : null,
          };
        })}
        acts={licitacao.biddingActs.map((act) => ({
          id: act.id,
          type: act.type,
          description: act.description,
          occurredAt: act.occurredAt.toISOString(),
          phaseName: act.phase?.name ?? null,
          lotNumber: act.biddingLot?.number ?? null,
          actorName: act.actorUsuario.nome,
        }))}
      />

      <Card className="rounded-md">
        <CardHeader className="border-b p-3"><CardTitle className="text-sm">Histórico do ciclo de compras</CardTitle><CardDescription className="text-xs">Eventos anteriores permanecem visíveis para rastreabilidade.</CardDescription></CardHeader>
        <CardContent className="p-3">
          {lifecycleEvents.length ? <div className="space-y-2">{lifecycleEvents.map((event) => <div key={event.id} className="flex flex-col gap-1 rounded-md border p-3 text-sm sm:flex-row sm:items-center sm:justify-between"><div><p className="font-medium">{event.eventType === "BIDDING_STATUS_TRANSITION" ? `${biddingStatusLabel(event.sourceType)} para ${biddingStatusLabel(event.sourceId)}` : event.eventType}</p><p className="text-xs text-muted-foreground">Por {event.actorUsuario.nome}</p></div><time className="text-xs text-muted-foreground">{format(event.createdAt, "dd/MM/yyyy HH:mm", { locale: ptBR })}</time></div>)}</div> : <p className="text-sm text-muted-foreground">Não há eventos anteriores registrados.</p>}
        </CardContent>
      </Card>
    </PageFrame>
  );
}
