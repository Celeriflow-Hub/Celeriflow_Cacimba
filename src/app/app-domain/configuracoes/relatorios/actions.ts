"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auditEventTypes, writeAuditEvent } from "@/lib/platform/audit-evidence";
import { getTenantContextForSystemAdministration } from "@/lib/platform/tenant-context";
import { createReportTemplateFingerprint, reportTemplateScope, reportTemplateValuesSchema } from "@/lib/reports/report-template";

type ActionResult = { error?: string; message?: string };

const saveReportTemplateSchema = z.object({
  version: z.number().int().min(0),
  values: z.unknown(),
}).strict();

export async function saveReportTemplate(rawInput: unknown): Promise<ActionResult> {
  try {
    const input = saveReportTemplateSchema.parse(rawInput);
    const values = reportTemplateValuesSchema.parse(input.values);
    const context = await getTenantContextForSystemAdministration();
    const current = await context.prisma.reportTemplate.findUnique({ where: { scope: reportTemplateScope } });
    if (current && input.version !== current.version) return { error: "O modelo foi alterado por outro administrador. Atualize a página e tente novamente." };
    if (current && current.header === values.header && current.footer === values.footer && current.orientation === values.orientation && current.includeEmissionMetadata === values.includeEmissionMetadata) {
      return { message: "Nenhuma configuração foi alterada." };
    }

    const version = (current?.version ?? 0) + 1;
    const fingerprint = createReportTemplateFingerprint({ version, ...values });
    await context.prisma.$transaction(async (tx) => {
      await tx.reportTemplate.upsert({
        where: { scope: reportTemplateScope },
        create: { scope: reportTemplateScope, version, fingerprint, ...values },
        update: { version, fingerprint, ...values },
      });
      await writeAuditEvent(tx, {
        actorUsuarioId: context.user.id,
        eventType: auditEventTypes.instanceConfigurationChanged,
        targetType: "REPORT_TEMPLATE",
        targetId: reportTemplateScope,
      });
    });

    revalidatePath("/configuracoes/relatorios");
    revalidatePath("/financeiro/relatorios");
    return { message: "Modelo global de relatórios salvo e registrado na auditoria." };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Não foi possível salvar o modelo de relatórios." };
  }
}
