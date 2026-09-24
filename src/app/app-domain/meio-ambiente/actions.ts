"use server";

import { getTenantContextForModuleOperation, type ModuleOperation } from "@/lib/platform/tenant-context";
import { revalidatePath } from "next/cache";
import { uploadFile } from "@/lib/platform/blob";

async function getTenantPrisma(operation: ModuleOperation) {
  return (await getTenantContextForModuleOperation("MEIO_AMBIENTE", operation)).prisma;
}

// ─── EnvEnterprise ───────────────────────────────────────────────────────────

export async function createEnvEnterprise(formData: FormData) {
  const prisma = await getTenantPrisma("create");
  const name = formData.get("name") as string;
  const cnpjCpf = formData.get("cnpjCpf") as string;
  const activityType = formData.get("activityType") as string;
  const potentialRisk = formData.get("potentialRisk") as string;
  const address = formData.get("address") as string;
  if (!name) return { error: "Nome e obrigatorio." };
  try {
    const enterprise = await prisma.envEnterprise.create({ data: { name, cnpjCpf, activityType, potentialRisk, address } });
    revalidatePath("/meio-ambiente/empreendimentos");
    revalidatePath("/meio-ambiente");
    return { success: true, enterprise };
  } catch (error) {
    console.error(error);
    return { error: "Erro ao criar empreendimento. Tente novamente." };
  }
}

export async function updateEnvEnterprise(id: string, formData: FormData) {
  const prisma = await getTenantPrisma("update");
  const name = formData.get("name") as string;
  const cnpjCpf = formData.get("cnpjCpf") as string;
  const activityType = formData.get("activityType") as string;
  const potentialRisk = formData.get("potentialRisk") as string;
  const address = formData.get("address") as string;
  const status = formData.get("status") as string;
  if (!name) return { error: "Nome e obrigatorio." };
  try {
    await prisma.envEnterprise.update({ where: { id }, data: { name, cnpjCpf, activityType, potentialRisk, address, ...(status && { status }) } });
    revalidatePath("/meio-ambiente/empreendimentos");
    revalidatePath("/meio-ambiente");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Erro ao atualizar empreendimento." };
  }
}

export async function inactivateEnvEnterprise(id: string) {
  const prisma = await getTenantPrisma("update");
  try {
    await prisma.envEnterprise.update({ where: { id }, data: { status: "Inativo" } });
    revalidatePath("/meio-ambiente/empreendimentos");
    revalidatePath("/meio-ambiente");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Erro ao inativar empreendimento." };
  }
}

// ─── EnvLicense ──────────────────────────────────────────────────────────────

export async function createEnvLicense(formData: FormData) {
  const prisma = await getTenantPrisma("create");
  const licenseNumber = formData.get("licenseNumber") as string;
  const licenseType = formData.get("licenseType") as string;
  const enterpriseId = formData.get("enterpriseId") as string;
  const validUntilStr = formData.get("validUntil") as string;
  if (!licenseNumber || !licenseType || !enterpriseId) return { error: "Numero, Tipo e Empreendimento sao obrigatorios." };
  try {
    const validUntil = validUntilStr ? new Date(validUntilStr) : null;
    const license = await prisma.envLicense.create({ data: { licenseNumber, licenseType, enterpriseId, validUntil } });
    revalidatePath("/meio-ambiente/licenciamento");
    revalidatePath("/meio-ambiente");
    return { success: true, license };
  } catch (error) {
    console.error(error);
    return { error: "Erro ao criar licenca. Verifique se o numero ja existe." };
  }
}

export async function updateEnvLicense(id: string, formData: FormData) {
  const prisma = await getTenantPrisma("update");
  const licenseNumber = formData.get("licenseNumber") as string;
  const licenseType = formData.get("licenseType") as string;
  const validUntilStr = formData.get("validUntil") as string;
  const status = formData.get("status") as string;
  if (!licenseNumber || !licenseType) return { error: "Numero e Tipo sao obrigatorios." };
  try {
    const validUntil = validUntilStr ? new Date(validUntilStr) : null;
    await prisma.envLicense.update({ where: { id }, data: { licenseNumber, licenseType, validUntil, ...(status && { status }) } });
    revalidatePath("/meio-ambiente/licenciamento");
    revalidatePath("/meio-ambiente");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Erro ao atualizar licenca." };
  }
}

export async function inactivateEnvLicense(id: string) {
  const prisma = await getTenantPrisma("update");
  try {
    await prisma.envLicense.update({ where: { id }, data: { status: "Suspensa" } });
    revalidatePath("/meio-ambiente/licenciamento");
    revalidatePath("/meio-ambiente");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Erro ao suspender licenca." };
  }
}

export async function deleteEnvLicense(id: string) {
  const prisma = await getTenantPrisma("delete");
  try {
    await prisma.envLicense.delete({ where: { id } });
    revalidatePath("/meio-ambiente/licenciamento");
    revalidatePath("/meio-ambiente");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Erro ao excluir licenca." };
  }
}

// ─── EnvComplaint ─────────────────────────────────────────────────────────────

export async function createEnvComplaint(formData: FormData) {
  const prisma = await getTenantPrisma("create");
  const complaintType = formData.get("complaintType") as string;
  const description = formData.get("description") as string;
  const address = formData.get("address") as string;
  const isAnonymous = formData.get("isAnonymous") === "true";
  if (!complaintType || !description) return { error: "Tipo e descricao sao obrigatorios." };
  try {
    const complaint = await prisma.envComplaint.create({ data: { complaintType, description, address, isAnonymous } });
    revalidatePath("/meio-ambiente/denuncias");
    revalidatePath("/meio-ambiente");
    return { success: true, complaint };
  } catch (error) {
    console.error(error);
    return { error: "Erro ao registrar denuncia. Tente novamente." };
  }
}

export async function updateEnvComplaint(id: string, formData: FormData) {
  const prisma = await getTenantPrisma("update");
  const status = formData.get("status") as string;
  const address = formData.get("address") as string;
  const description = formData.get("description") as string;
  try {
    await prisma.envComplaint.update({ where: { id }, data: { status, address, description } });
    revalidatePath("/meio-ambiente/denuncias");
    revalidatePath("/meio-ambiente");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Erro ao atualizar denuncia." };
  }
}

export async function deleteEnvComplaint(id: string) {
  const prisma = await getTenantPrisma("delete");
  try {
    await prisma.envComplaint.delete({ where: { id } });
    revalidatePath("/meio-ambiente/denuncias");
    revalidatePath("/meio-ambiente");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Erro ao excluir denuncia." };
  }
}

// ─── EnvInspection ────────────────────────────────────────────────────────────

export async function createEnvInspection(formData: FormData) {
  const prisma = await getTenantPrisma("create");
  const dateScheduledStr = formData.get("dateScheduled") as string;
  const inspector = formData.get("inspector") as string;
  const notes = formData.get("notes") as string;
  const enterpriseId = formData.get("enterpriseId") as string;
  if (!dateScheduledStr || !inspector) return { error: "Data agendada e Fiscal sao obrigatorios." };
  try {
    const dateScheduled = new Date(dateScheduledStr);
    const inspection = await prisma.envInspection.create({ data: { dateScheduled, inspector, notes, enterpriseId: enterpriseId || null } });
    revalidatePath("/meio-ambiente/fiscalizacao");
    revalidatePath("/meio-ambiente");
    return { success: true, inspection };
  } catch (error) {
    console.error(error);
    return { error: "Erro ao agendar vistoria. Tente novamente." };
  }
}

export async function updateEnvInspection(id: string, formData: FormData) {
  const prisma = await getTenantPrisma("update");
  const dateScheduledStr = formData.get("dateScheduled") as string;
  const inspector = formData.get("inspector") as string;
  const notes = formData.get("notes") as string;
  const status = formData.get("status") as string;
  const enterpriseId = formData.get("enterpriseId") as string;
  try {
    const dateScheduled = dateScheduledStr ? new Date(dateScheduledStr) : undefined;
    await prisma.envInspection.update({ where: { id }, data: { ...(dateScheduled && { dateScheduled }), inspector, notes, status, enterpriseId: enterpriseId || null } });
    revalidatePath("/meio-ambiente/fiscalizacao");
    revalidatePath("/meio-ambiente");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Erro ao atualizar vistoria." };
  }
}

export async function deleteEnvInspection(id: string) {
  const prisma = await getTenantPrisma("delete");
  try {
    await prisma.envInspection.delete({ where: { id } });
    revalidatePath("/meio-ambiente/fiscalizacao");
    revalidatePath("/meio-ambiente");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Erro ao excluir vistoria." };
  }
}

// ─── EnvGreenArea ─────────────────────────────────────────────────────────────

export async function createEnvGreenArea(formData: FormData) {
  const prisma = await getTenantPrisma("create");
  const name = formData.get("name") as string;
  const areaType = formData.get("areaType") as string;
  const sizeSqmStr = formData.get("sizeSqm") as string;
  const location = formData.get("location") as string;
  const status = formData.get("status") as string;
  const notes = formData.get("notes") as string;
  if (!name || !areaType) return { error: "Nome e Tipo da Area sao obrigatorios." };
  try {
    const sizeSqm = sizeSqmStr ? parseFloat(sizeSqmStr) : null;
    const greenArea = await prisma.envGreenArea.create({ data: { name, areaType, sizeSqm, location, status: status || "Preservado", notes } });
    revalidatePath("/meio-ambiente/areas-verdes");
    revalidatePath("/meio-ambiente");
    return { success: true, greenArea };
  } catch (error) {
    console.error(error);
    return { error: "Erro ao criar area verde. Tente novamente." };
  }
}

export async function updateEnvGreenArea(id: string, formData: FormData) {
  const prisma = await getTenantPrisma("update");
  const name = formData.get("name") as string;
  const areaType = formData.get("areaType") as string;
  const sizeSqmStr = formData.get("sizeSqm") as string;
  const location = formData.get("location") as string;
  const status = formData.get("status") as string;
  const notes = formData.get("notes") as string;
  if (!name || !areaType) return { error: "Nome e Tipo da Area sao obrigatorios." };
  try {
    const sizeSqm = sizeSqmStr ? parseFloat(sizeSqmStr) : null;
    await prisma.envGreenArea.update({ where: { id }, data: { name, areaType, sizeSqm, location, status, notes } });
    revalidatePath("/meio-ambiente/areas-verdes");
    revalidatePath("/meio-ambiente");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Erro ao atualizar area verde." };
  }
}

export async function inactivateEnvGreenArea(id: string) {
  const prisma = await getTenantPrisma("update");
  try {
    await prisma.envGreenArea.update({ where: { id }, data: { status: "Degradado" } });
    revalidatePath("/meio-ambiente/areas-verdes");
    revalidatePath("/meio-ambiente");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Erro ao atualizar status da area verde." };
  }
}

// ─── EnvWaste ─────────────────────────────────────────────────────────────────

export async function createEnvWaste(formData: FormData) {
  const prisma = await getTenantPrisma("create");
  const generatorName = formData.get("generatorName") as string;
  const wasteType = formData.get("wasteType") as string;
  const quantityKgStr = formData.get("quantityKg") as string;
  const destination = formData.get("destination") as string;
  const notes = formData.get("notes") as string;
  const enterpriseId = formData.get("enterpriseId") as string;
  if (!generatorName || !wasteType || !quantityKgStr || !destination) return { error: "Gerador, Tipo, Quantidade e Destino sao obrigatorios." };
  try {
    const quantityKg = parseFloat(quantityKgStr);
    const waste = await prisma.envWaste.create({ data: { generatorName, wasteType, quantityKg, destination, notes, enterpriseId: enterpriseId || null } });
    revalidatePath("/meio-ambiente/residuos");
    revalidatePath("/meio-ambiente");
    return { success: true, waste };
  } catch (error) {
    console.error(error);
    return { error: "Erro ao registrar residuo. Tente novamente." };
  }
}

export async function updateEnvWaste(id: string, formData: FormData) {
  const prisma = await getTenantPrisma("update");
  const generatorName = formData.get("generatorName") as string;
  const wasteType = formData.get("wasteType") as string;
  const quantityKgStr = formData.get("quantityKg") as string;
  const destination = formData.get("destination") as string;
  const notes = formData.get("notes") as string;
  const enterpriseId = formData.get("enterpriseId") as string;
  if (!generatorName || !wasteType || !quantityKgStr || !destination) return { error: "Gerador, Tipo, Quantidade e Destino sao obrigatorios." };
  try {
    const quantityKg = parseFloat(quantityKgStr);
    await prisma.envWaste.update({ where: { id }, data: { generatorName, wasteType, quantityKg, destination, notes, enterpriseId: enterpriseId || null } });
    revalidatePath("/meio-ambiente/residuos");
    revalidatePath("/meio-ambiente");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Erro ao atualizar residuo." };
  }
}

export async function deleteEnvWaste(id: string) {
  const prisma = await getTenantPrisma("delete");
  try {
    await prisma.envWaste.delete({ where: { id } });
    revalidatePath("/meio-ambiente/residuos");
    revalidatePath("/meio-ambiente");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Erro ao excluir registro de residuo." };
  }
}

// ─── EnvEduProgram ────────────────────────────────────────────────────────────

export async function createEnvEduProgram(formData: FormData) {
  const prisma = await getTenantPrisma("create");
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const targetAudience = formData.get("targetAudience") as string;
  const startDateStr = formData.get("startDate") as string;
  const endDateStr = formData.get("endDate") as string;
  const participantsCountStr = formData.get("participantsCount") as string;
  const status = formData.get("status") as string;
  if (!title || !description || !startDateStr) return { error: "Titulo, Descricao e Data de Inicio sao obrigatorios." };
  try {
    const startDate = new Date(startDateStr);
    const endDate = endDateStr ? new Date(endDateStr) : null;
    const participantsCount = participantsCountStr ? parseInt(participantsCountStr, 10) : null;
    const eduProgram = await prisma.envEduProgram.create({ data: { title, description, targetAudience, startDate, endDate, participantsCount, status: status || "Planejado" } });
    revalidatePath("/meio-ambiente/educacao");
    revalidatePath("/meio-ambiente");
    return { success: true, eduProgram };
  } catch (error) {
    console.error(error);
    return { error: "Erro ao criar projeto de educacao. Tente novamente." };
  }
}

export async function updateEnvEduProgram(id: string, formData: FormData) {
  const prisma = await getTenantPrisma("update");
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const targetAudience = formData.get("targetAudience") as string;
  const startDateStr = formData.get("startDate") as string;
  const endDateStr = formData.get("endDate") as string;
  const participantsCountStr = formData.get("participantsCount") as string;
  const status = formData.get("status") as string;
  if (!title || !description || !startDateStr) return { error: "Titulo, Descricao e Data de Inicio sao obrigatorios." };
  try {
    const startDate = new Date(startDateStr);
    const endDate = endDateStr ? new Date(endDateStr) : null;
    const participantsCount = participantsCountStr ? parseInt(participantsCountStr, 10) : null;
    await prisma.envEduProgram.update({ where: { id }, data: { title, description, targetAudience, startDate, endDate, participantsCount, status } });
    revalidatePath("/meio-ambiente/educacao");
    revalidatePath("/meio-ambiente");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Erro ao atualizar programa educativo." };
  }
}

export async function deleteEnvEduProgram(id: string) {
  const prisma = await getTenantPrisma("delete");
  try {
    await prisma.envEduProgram.delete({ where: { id } });
    revalidatePath("/meio-ambiente/educacao");
    revalidatePath("/meio-ambiente");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Erro ao excluir programa educativo." };
  }
}

// ─── EnvDocument ──────────────────────────────────────────────────────────────

export async function createEnvDocument(formData: FormData) {
  const prisma = await getTenantPrisma("create");
  const title = formData.get("title") as string;
  const docType = formData.get("docType") as string;
  const enterpriseId = formData.get("enterpriseId") as string;
  const file = formData.get("file") as File;
  if (!title || !docType) return { error: "Titulo e Tipo de Documento sao obrigatorios." };
  if (!file || file.size === 0) return { error: "O envio do arquivo e obrigatorio." };
  try {
    const blob = await uploadFile(file);
    const envDoc = await prisma.envDocument.create({ data: { title, docType, fileUrl: blob.url, enterpriseId: enterpriseId || null } });
    revalidatePath("/meio-ambiente/documentos");
    revalidatePath("/meio-ambiente");
    return { success: true, document: envDoc };
  } catch (error) {
    console.error(error);
    return { error: "Erro ao anexar documento. Verifique sua conexao e tente novamente." };
  }
}

export async function updateEnvDocument(id: string, formData: FormData) {
  const prisma = await getTenantPrisma("update");
  const title = formData.get("title") as string;
  const docType = formData.get("docType") as string;
  const enterpriseId = formData.get("enterpriseId") as string;
  if (!title || !docType) return { error: "Titulo e Tipo sao obrigatorios." };
  try {
    await prisma.envDocument.update({ where: { id }, data: { title, docType, enterpriseId: enterpriseId || null } });
    revalidatePath("/meio-ambiente/documentos");
    revalidatePath("/meio-ambiente");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Erro ao atualizar documento." };
  }
}

export async function deleteEnvDocument(id: string) {
  const prisma = await getTenantPrisma("delete");
  try {
    await prisma.envDocument.delete({ where: { id } });
    revalidatePath("/meio-ambiente/documentos");
    revalidatePath("/meio-ambiente");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Erro ao excluir documento." };
  }
}
