import { createHash } from "node:crypto";
import type { AppContext } from "@/lib/platform/tenant-context";
import { assertHealthUnitAccess } from "@/lib/platform/tenant-context";
import { validateEsusFields } from "./sisab-form-config";

export class SisabError extends Error {}

// Adaptador controlado SISAB/e-SUS: gera lote real a partir das fichas
// finalizadas, valida cada registro e devolve aceites/rejeições.
// Não inventa protocolo oficial do Ministério nem confirmação nacional:
// o retorno é o do validador local configurado, com histórico rastreável.
export async function createBatch(context: AppContext, competence: string) {
  if (!/^\d{4}-\d{2}$/.test(competence)) throw new SisabError("Informe a competência no formato AAAA-MM.");
  const forms = await context.prisma.healthEsusForm.findMany({
    where: { period: competence, status: "FINALIZADA" },
    select: { id: true, kind: true, unitId: true, professionalId: true, personId: true, patientId: true, householdId: true, familyId: true, teamId: true },
    orderBy: { createdAt: "asc" },
    take: 2000,
  });
  if (forms.length === 0) throw new SisabError("Não há fichas finalizadas para a competência.");
  for (const f of forms) {
    if (f.unitId) assertHealthUnitAccess(context.user, f.unitId);
  }
  const lines = forms.map(f => ["ESUS", competence.replace("-", ""), f.kind, f.unitId || "", f.professionalId || "", f.patientId || f.personId || f.familyId || f.householdId || "", f.id].join("|"));
  const content = [`#SISAB|COMPETENCIA:${competence}|FICHAS:${forms.length}|GERADO_EM:${new Date().toISOString()}`, ...lines].join("\n");
  const hash = createHash("sha256").update(content).digest("hex");
  const batch = await context.prisma.healthEsusBatch.create({
    data: { competence, fileContent: content, hash, total: forms.length, createdByUsuarioId: context.user.id },
    select: { id: true },
  });
  for (const f of forms) {
    await context.prisma.healthEsusBatchItem.upsert({
      where: { batchId_formId: { batchId: batch.id, formId: f.id } },
      create: { batchId: batch.id, formId: f.id },
      update: {},
    });
  }
  return batch;
}

function validateForm(form: { kind: string; unitId: string | null; professionalId: string | null; personId: string | null; patientId: string | null; householdId: string | null; familyId: string | null; teamId: string | null; payload: unknown }): string | null {
  if (!form.unitId) return "Unidade ausente.";
  if (!form.professionalId) return "Profissional ausente.";
  if (form.kind === "DOMICILIAR" && !form.householdId && !form.familyId) return "Ficha domiciliar sem domicílio/família.";
  if (form.kind === "ATIVIDADE_COLETIVA" && !form.teamId) return "Atividade coletiva sem equipe.";
  if (["INDIVIDUAL","VISITA","ATENDIMENTO_INDIVIDUAL","ODONTO","PROCEDIMENTOS","CONSUMO_ALIMENTAR","ATENDIMENTO_DOMICILIAR"].includes(form.kind) && !form.personId && !form.patientId) return "Ficha sem cidadão vinculado.";
  return validateEsusFields(form.kind, (form.payload || {}) as Record<string, unknown>);
}

export async function processBatch(context: AppContext, batchId: string) {
  const batch = await context.prisma.healthEsusBatch.findUnique({ where: { id: batchId }, select: { id: true, competence: true, status: true } });
  if (!batch) throw new SisabError("Lote não encontrado.");
  await context.prisma.healthEsusBatch.update({ where: { id: batchId }, data: { status: "PROCESSANDO" } });
  const items = await context.prisma.healthEsusBatchItem.findMany({ where: { batchId }, include: { form: true } });
  const errors: Array<{ formId: string; reason: string }> = [];
  let accepted = 0;
  for (const item of items) {
    const reason = validateForm(item.form);
    if (reason) {
      errors.push({ formId: item.formId, reason });
      await context.prisma.healthEsusBatchItem.update({ where: { id: item.id }, data: { status: "REJEITADO", message: reason } });
    } else {
      accepted += 1;
      await context.prisma.healthEsusBatchItem.update({ where: { id: item.id }, data: { status: "ACEITO", message: null } });
    }
  }
  const rejected = errors.length;
  const status = rejected === 0 ? "ACEITO" : accepted === 0 ? "REJEITADO" : "PARCIAL";
  return context.prisma.healthEsusBatch.update({
    where: { id: batchId },
    data: { status, accepted, rejected, errors, processedAt: new Date() },
    select: { id: true, status: true, accepted: true, rejected: true },
  });
}
