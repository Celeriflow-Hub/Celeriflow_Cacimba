"use server";
import { revalidatePath } from "next/cache";
import { getTenantContextForModuleOperation } from "@/lib/platform/tenant-context";
import { communicateDesifFiscalCase, createDesifAgency, createDesifCatalog, createDesifInstitution, issueDesifGuide, openDesifFiscalCase, processDesifImport, receiveDesifImport, validateDesifImport } from "@/lib/tributacao/s6-service";

const path = "/tributacao/iss-bancario";
const result = (error?: unknown) => ({ error: error instanceof Error ? error.message : error ? "Não foi possível concluir a operação." : undefined });
async function ctx(operation: "create" | "update") { return getTenantContextForModuleOperation("TRIBUTACAO", operation); }
const actor = (context: Awaited<ReturnType<typeof ctx>>) => ({ usuarioId: context.user.id, employeeId: context.user.employeeId });

export async function createInstitutionAction(input: Parameters<typeof createDesifInstitution>[1]) { try { const context = await ctx("create"); await createDesifInstitution(context.prisma, input); revalidatePath(path); return result(); } catch (error) { return result(error); } }
export async function createAgencyAction(input: Parameters<typeof createDesifAgency>[1]) { try { const context = await ctx("create"); await createDesifAgency(context.prisma, input); revalidatePath(path); return result(); } catch (error) { return result(error); } }
export async function validateImportAction(id: string) { try { const context = await ctx("update"); await validateDesifImport(context.prisma, actor(context), id); revalidatePath(path); return result(); } catch (error) { return result(error); } }
export async function processImportAction(id: string) { try { const context = await ctx("update"); await processDesifImport(context.prisma, actor(context), id); revalidatePath(path); return result(); } catch (error) { return result(error); } }
export async function receiveImportAction(input: Parameters<typeof receiveDesifImport>[2]) { try { const context = await ctx("create"); await receiveDesifImport(context.prisma, actor(context), input); revalidatePath(path); return result(); } catch (error) { return result(error); } }
export async function issueGuideAction(id: string) { try { const context = await ctx("create"); await issueDesifGuide(context.prisma, id); revalidatePath(path); return result(); } catch (error) { return result(error); } }
export async function openFiscalCaseAction(id: string, findingType: "OMISSAO" | "DIFERENCA" | "SEM_MOVIMENTO", processId?: string) { try { const context = await ctx("create"); await openDesifFiscalCase(context.prisma, actor(context), { assessmentId: id, findingType, processId }); revalidatePath(path); return result(); } catch (error) { return result(error); } }
export async function communicateFiscalCaseAction(id: string) { try { const context = await ctx("update"); await communicateDesifFiscalCase(context.prisma, actor(context), id); revalidatePath(path); return result(); } catch (error) { return result(error); } }

export async function seedDesifScenarioAction(taxpayerId: string) {
  try {
    const context = await ctx("create"); const db = context.prisma; const who = actor(context);
    const taxpayer = await db.taxpayer.findUnique({ where: { id: taxpayerId }, include: { company: true, economicRegistrations: { where: { status: "Ativo" }, take: 1 } } });
    if (!taxpayer?.company?.cnpj) throw new Error("Selecione um contribuinte pessoa jurídica com CNPJ.");
    const fullCnpj = taxpayer.company.cnpj.replace(/\D/g, ""); const institution = await createDesifInstitution(db, { taxpayerId, name: taxpayer.company.corporateName, baseCnpj: fullCnpj.slice(0, 8), validFrom: "2026-01-01" });
    const agency = await createDesifAgency(db, { institutionId: institution.id, economicRegistrationId: taxpayer.economicRegistrations[0]?.id, code: "0001", name: "Agência Matriz Demonstrativa", fullCnpj, municipalRegistration: taxpayer.municipalInsc ?? undefined, validFrom: "2026-01-01" });
    const catalog = await createDesifCatalog(db, { institutionId: institution.id, version: "PGCC-DEMO-1", validFrom: "2026-01-01", pgccCode: "7.1.1.00", pgccName: "Receitas de serviços bancários", cosifCode: "7.1.7.99.00-9", cosifName: "Rendas de outros serviços", subtitleCode: "SUB-15.01", subtitleName: "Administração de contas", rate: 5, tariffCode: "TAR-CONTA", tariffName: "Pacote mensal de conta", tariffAmount: 30, packageCode: "PAC-ESSENCIAL", packageName: "Pacote Essencial" });
    const batch = await receiveDesifImport(db, who, { institutionId: institution.id, agencyId: agency.id, competence: "2026-09", moduleType: "APURACAO_BALANCETE_TARIFAS", fileName: "desif-cenario-obrigatorio-2026-09.json", abrasfVersion: "DEMO_INTERNO_REV01", signaturePolicy: "NAO_CONFIGURADA", payload: { assessments: [{ agencyId: agency.id, subtitleId: catalog.subtitle.id, revenue: 10000, deduction: 1000, rate: 5, credit: 50, debitAdjustment: 0 }], trialBalances: [{ agencyId: agency.id, pgccAccountId: catalog.pgcc.id, openingBalance: 1000, credits: 500, debits: 200, declaredClose: 1300, nature: "CREDORA" }], packageMovements: [{ agencyId: agency.id, packageId: catalog.package.id, accountHolders: 100, collectedRevenue: 2800, rate: 5 }] } });
    if (batch.status === "RECEBIDO" || batch.status === "INCONSISTENTE") await validateDesifImport(db, who, batch.id);
    const validated = await db.desifImportBatch.findUniqueOrThrow({ where: { id: batch.id } }); if (validated.status === "VALIDADO") await processDesifImport(db, who, batch.id);
    revalidatePath(path); return result();
  } catch (error) { return result(error); }
}
