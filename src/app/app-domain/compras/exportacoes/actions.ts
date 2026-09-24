"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { notifyPendingPriceResearchInvitations } from "@/lib/integrations/procurement-invitation-notifications";
import {
  ProcurementExportError,
  queueProcurementExport,
  recordProcurementExportOutcome,
} from "@/lib/integrations/procurement-exports";
import { canViewModule, getTenantContextForModuleOperation, type AppContext } from "@/lib/platform/tenant-context";

type ActionResult = {
  error?: string;
  data?: { runId?: string; status?: string; message: string; notificationsCreated?: number };
};

const queueSchema = z.object({
  packageCode: z.enum([
    "TCE_BIDDING_ACCOUNTABILITY",
    "TCE_CONTRACT_ACCOUNTABILITY",
    "PNCP_PROCUREMENT",
    "PNCP_PROCEDURE_RESULT",
    "PNCP_CONTRACT",
  ]),
  targetId: z.string().trim().min(1).max(191),
});

const outcomeSchema = z.object({
  runId: z.string().trim().min(1).max(191),
  status: z.enum(["CONFIRMED", "REJECTED"]),
  externalReference: z.string().trim().min(1).max(200),
});

function paths() {
  revalidatePath("/compras/exportacoes");
  revalidatePath("/configuracoes/integracoes");
}

function actionError(error: unknown, fallback: string) {
  if (error instanceof ProcurementExportError) return error.message;
  if (error instanceof z.ZodError) return "Dados do pacote de exportacao invalidos.";
  return fallback;
}

function hasProcurementModuleAccess(recipient: {
  id: string;
  perfil: { codigo: string; permissoes: string; ativo: boolean; nome: string };
  permissoesModulo: { modulo: { codigo: string }; canView: boolean; canEdit: boolean }[];
}) {
  const user: AppContext["user"] = {
    id: recipient.id,
    firebaseUid: "",
    email: "",
    name: "",
    role: recipient.perfil.nome,
    profileCode: recipient.perfil.codigo,
    permissions: recipient.perfil.permissoes,
    modulePermissions: recipient.permissoesModulo.map((permission) => ({
      code: permission.modulo.codigo.toUpperCase(),
      canView: permission.canView,
      canEdit: permission.canEdit,
    })),
    allowedBudgetUnitIds: [],
    employeeId: null,
    departmentId: null,
    secretariatId: null,
  };
  return recipient.perfil.ativo && canViewModule(user, "COMPRAS");
}

export async function queueProcurementExportAction(rawInput: unknown): Promise<ActionResult> {
  try {
    const input = queueSchema.parse(rawInput);
    const context = await getTenantContextForModuleOperation("COMPRAS", "issueReports");
    const result = await queueProcurementExport(context.prisma, { ...input, actorUsuarioId: context.user.id });
    paths();
    return {
      data: {
        runId: result.runId,
        status: result.status,
        message: result.reused ? "Pacote identico recuperado do historico." : result.message,
      },
    };
  } catch (error) {
    return { error: actionError(error, "Nao foi possivel preparar o pacote de exportacao.") };
  }
}

export async function recordProcurementExportOutcomeAction(rawInput: unknown): Promise<ActionResult> {
  try {
    const input = outcomeSchema.parse(rawInput);
    const context = await getTenantContextForModuleOperation("COMPRAS", "update");
    const result = await recordProcurementExportOutcome(context.prisma, { ...input, actorUsuarioId: context.user.id });
    paths();
    return {
      data: {
        runId: result.runId,
        status: result.status,
        message: result.reused ? "O retorno externo ja estava registrado." : "Retorno externo registrado no historico auditavel.",
      },
    };
  } catch (error) {
    return { error: actionError(error, "Nao foi possivel registrar o retorno externo.") };
  }
}

export async function notifyPendingPriceResearchInvitationsAction(): Promise<ActionResult> {
  try {
    const context = await getTenantContextForModuleOperation("COMPRAS", "create");
    const result = await context.prisma.$transaction(async (tx) => {
      const recipients = await tx.usuario.findMany({
        where: { ativo: true },
        include: {
          perfil: { select: { codigo: true, permissoes: true, ativo: true, nome: true } },
          permissoesModulo: { include: { modulo: { select: { codigo: true } } } },
        },
      });
      return notifyPendingPriceResearchInvitations(tx, {
        actorUsuarioId: context.user.id,
        recipientUserIds: recipients.filter(hasProcurementModuleAccess).map((recipient) => recipient.id),
      });
    });
    paths();
    return {
      data: {
        notificationsCreated: result.notificationsCreated,
        message: result.pendingInvitations
          ? `${result.notificationsCreated} notificacao(oes) interna(s) criada(s) para ${result.pendingInvitations} convite(s) pendente(s). Nenhum e-mail foi enviado.`
          : "Nao ha convites de pesquisa de precos pendentes de entrega.",
      },
    };
  } catch (error) {
    return { error: actionError(error, "Nao foi possivel criar os lembretes internos.") };
  }
}
