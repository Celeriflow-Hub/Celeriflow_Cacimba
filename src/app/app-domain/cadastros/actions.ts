"use server";

import { getTenantContextForModuleOperation, type ModuleOperation } from "@/lib/platform/tenant-context";
import { requireValidCnpj, requireValidCpf } from "@/lib/identifiers/brazilian-identifiers";
import { dispatchSiaficEvents } from "@/lib/siafic/dispatcher";
import { createSupplierWithSiaficEvent, queueSupplierSnapshot, setSupplierStatusWithSiaficEvent, type SupplierUpdateInput } from "@/lib/siafic/source";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { formText, optionalSupplierText, parseSupplierCnaes, parseSupplierDate, parseSupplierIdentity, validateSubmittedSupplierDocument, validateSupplierIdentityDocument } from "./fornecedores/supplier-form";
import { auditEventTypes, writeAuditEvent } from "@/lib/platform/audit-evidence";

type PersonUpdateData = {
  fullName?: string;
  cpf?: string;
  email?: string | null;
  phonePrimary?: string | null;
  isTaxpayer?: boolean;
  municipalInsc?: string;
};

type CompanyUpdateData = {
  corporateName?: string;
  cnpj?: string;
  emailPrimary?: string | null;
  phone?: string | null;
  isTaxpayer?: boolean;
  municipalInsc?: string;
};

type RealEstateUpdateData = {
  municipalInsc?: string | null;
  propertyType?: string | null;
  streetName?: string | null;
  number?: string | null;
};

type SupplierUpdateData = {
  category?: string | null;
  businessBranch?: string | null;
  certificationsValidUntil?: string | null;
  bankData?: string | null;
  notes?: string | null;
  primaryCnae?: string | null;
  secondaryCnaes?: string | null;
};

type DocumentUpdateData = {
  title?: string;
  documentType?: string;
};

async function getTenantPrisma(operation: ModuleOperation) {
  return (await getTenantContextForModuleOperation("CADASTROS", operation)).prisma;
}

function textValue(formData: FormData, name: string) {
  return String(formData.get(name) || "").trim();
}

function hasField(input: object, field: string) {
  return Object.prototype.hasOwnProperty.call(input, field);
}

type SupplierActionResult = { error?: string };

function supplierActionError(error: unknown, fallback: string): SupplierActionResult {
  console.error(error);
  return { error: error instanceof Error ? error.message : fallback };
}

export async function createPerson(formData: FormData): Promise<void> {
  const context = await getTenantContextForModuleOperation("CADASTROS", "create");
  const fullName = textValue(formData, "fullName");
  const cpf = requireValidCpf(textValue(formData, "cpf"));
  const birthDate = textValue(formData, "birthDate");
  const gender = textValue(formData, "gender");
  const raceColor = textValue(formData, "raceColor");
  const motherName = textValue(formData, "motherName");
  const zipCode = textValue(formData, "zipCode");
  const streetName = textValue(formData, "streetName");
  const number = textValue(formData, "number");
  if (!fullName) throw new Error("Nome completo é obrigatório.");
  if (!birthDate || !gender || !raceColor || !motherName || !zipCode || !streetName || !number) throw new Error("Nascimento, sexo, raça/cor, nome da mãe e endereço residencial são obrigatórios.");
  await context.prisma.$transaction(async tx => {
    const person = await tx.person.create({
      data: {
        fullName, cpf, gender, raceColor, motherName,
        email: textValue(formData, "email") || null,
        phonePrimary: textValue(formData, "phonePrimary") || null,
        birthDate: new Date(`${birthDate}T12:00:00.000Z`),
        status: "Ativo",
        addresses: { create: { addressType: "Residencial", zipCode, streetName, number, complement: textValue(formData, "complement") || null } },
      },
    });
    await writeAuditEvent(tx, { actorUsuarioId: context.user.id, eventType: auditEventTypes.administrativeMutation, targetType: "PERSON", targetId: person.id });
  });
  revalidatePath("/cadastros/pessoas-fisicas");
}

export async function createCompany(formData: FormData): Promise<void> {
  const context = await getTenantContextForModuleOperation("CADASTROS", "create");
  const corporateName = textValue(formData, "corporateName");
  const tradeName = textValue(formData, "tradeName");
  const cnpj = requireValidCnpj(textValue(formData, "cnpj"));
  if (!corporateName || !tradeName) throw new Error("Razão social e nome fantasia são obrigatórios.");
  await context.prisma.$transaction(async tx => {
    const company = await tx.company.create({
      data: {
        corporateName, cnpj, tradeName,
        emailPrimary: textValue(formData, "emailPrimary") || null,
        phone: textValue(formData, "phone") || null,
        municipalInsc: textValue(formData, "municipalInsc") || null,
        companyType: textValue(formData, "companyType") || null,
        status: "Ativo",
      },
    });
    await writeAuditEvent(tx, { actorUsuarioId: context.user.id, eventType: auditEventTypes.administrativeMutation, targetType: "COMPANY", targetId: company.id });
  });
  revalidatePath("/cadastros/pessoas-juridicas");
}

// Person
export async function updatePerson(id: string, data: PersonUpdateData) {
  const prisma = await getTenantPrisma("update");
  const { isTaxpayer, municipalInsc, ...personData } = data;
  
  const result = await prisma.person.update({ where: { id }, data: personData });
  
  if (isTaxpayer !== undefined) {
    if (isTaxpayer) {
      await prisma.taxpayer.upsert({
        where: { personId: id },
        update: { municipalInsc: municipalInsc || null },
        create: { personId: id, taxpayerType: 'PF', municipalInsc: municipalInsc || null }
      });
    } else {
      await prisma.taxpayer.deleteMany({ where: { personId: id } });
    }
  }
  
  revalidatePath("/cadastros/pessoas-fisicas");
  return result;
}
export async function deactivatePerson(id: string) {
  const prisma = await getTenantPrisma("update");
  const result = await prisma.person.update({ where: { id }, data: { status: 'Inativo' } });
  revalidatePath("/cadastros/pessoas-fisicas");
  return result;
}
export async function activatePerson(id: string) {
  const prisma = await getTenantPrisma("update");
  const result = await prisma.person.update({ where: { id }, data: { status: 'Ativo' } });
  revalidatePath("/cadastros/pessoas-fisicas");
  return result;
}

// Company
export async function updateCompany(id: string, data: CompanyUpdateData) {
  const prisma = await getTenantPrisma("update");
  const { isTaxpayer, municipalInsc, ...companyData } = data;
  
  const result = await prisma.company.update({ where: { id }, data: companyData });
  
  if (isTaxpayer !== undefined) {
    if (isTaxpayer) {
      await prisma.taxpayer.upsert({
        where: { companyId: id },
        update: { municipalInsc: municipalInsc || null },
        create: { companyId: id, taxpayerType: 'PJ', municipalInsc: municipalInsc || null }
      });
    } else {
      await prisma.taxpayer.deleteMany({ where: { companyId: id } });
    }
  }
  
  revalidatePath("/cadastros/pessoas-juridicas");
  return result;
}
export async function deactivateCompany(id: string) {
  const prisma = await getTenantPrisma("update");
  const result = await prisma.company.update({ where: { id }, data: { status: 'Inativo' } });
  revalidatePath("/cadastros/pessoas-juridicas");
  return result;
}
export async function activateCompany(id: string) {
  const prisma = await getTenantPrisma("update");
  const result = await prisma.company.update({ where: { id }, data: { status: 'Ativo' } });
  revalidatePath("/cadastros/pessoas-juridicas");
  return result;
}

// Taxpayer endpoints removed as it's now handled by Person/Company

// RealEstate
export async function updateRealEstate(id: string, data: RealEstateUpdateData) {
  const prisma = await getTenantPrisma("update");
  const result = await prisma.realEstate.update({ where: { id }, data });
  revalidatePath("/cadastros/imoveis");
  return result;
}
export async function deactivateRealEstate(id: string) {
  const prisma = await getTenantPrisma("update");
  const result = await prisma.realEstate.update({ where: { id }, data: { status: 'Inativo' } });
  revalidatePath("/cadastros/imoveis");
  return result;
}
export async function activateRealEstate(id: string) {
  const prisma = await getTenantPrisma("update");
  const result = await prisma.realEstate.update({ where: { id }, data: { status: 'Regular' } });
  revalidatePath("/cadastros/imoveis");
  return result;
}

// Supplier
export async function createSupplier(formData: FormData): Promise<void> {
  const context = await getTenantContextForModuleOperation("CADASTROS", "create");
  const selection = parseSupplierIdentity({
    supplierType: formText(formData, "supplierType"),
    personId: formText(formData, "personId"),
    companyId: formText(formData, "companyId"),
  });
  const cnaeFieldsSubmitted = formData.has("primaryCnae") || formData.has("secondaryCnaes");
  const cnaes = cnaeFieldsSubmitted ? parseSupplierCnaes({
    primaryCnae: formText(formData, "primaryCnae"),
    secondaryCnaes: formText(formData, "secondaryCnaes"),
  }) : null;

  if (selection.supplierType === "PF") {
    const person = await context.prisma.person.findUnique({ where: { id: selection.personId! }, select: { id: true, cpf: true } });
    if (!person) throw new Error("A pessoa física selecionada não existe.");
    const canonicalDocument = validateSupplierIdentityDocument(selection, person);
    validateSubmittedSupplierDocument(selection, { cpf: formText(formData, "cpf"), cnpj: formText(formData, "cnpj") }, canonicalDocument);
    if (cnaes?.primaryCnae || cnaes?.secondaryCnaes) {
      throw new Error("CNAE só pode ser informado para fornecedor pessoa jurídica.");
    }
    const existing = await context.prisma.supplier.findUnique({ where: { personId: selection.personId! }, select: { id: true } });
    if (existing) throw new Error("A pessoa física selecionada já está cadastrada como fornecedora.");
  } else {
    const company = await context.prisma.company.findUnique({ where: { id: selection.companyId! }, select: { id: true, cnpj: true } });
    if (!company) throw new Error("A pessoa jurídica selecionada não existe.");
    const canonicalDocument = validateSupplierIdentityDocument(selection, company);
    validateSubmittedSupplierDocument(selection, { cpf: formText(formData, "cpf"), cnpj: formText(formData, "cnpj") }, canonicalDocument);
    const existing = await context.prisma.supplier.findUnique({ where: { companyId: selection.companyId! }, select: { id: true } });
    if (existing) throw new Error("A pessoa jurídica selecionada já está cadastrada como fornecedora.");
    if (cnaes) {
      await context.prisma.company.update({
        where: { id: selection.companyId! },
        data: cnaes,
      });
    }
  }

  const result = await createSupplierWithSiaficEvent(context.prisma, { usuarioId: context.user.id }, {
    personId: selection.personId,
    companyId: selection.companyId,
    category: formText(formData, "category") || null,
    businessBranch: formText(formData, "businessBranch") || null,
    certificationsValidUntil: parseSupplierDate(formText(formData, "certificationsValidUntil")),
    bankData: formText(formData, "bankData") || null,
    notes: formText(formData, "notes") || null,
  });
  await dispatchSiaficEvents(context.prisma, result.eventIds);
  revalidatePath("/cadastros/fornecedores");
  redirect("/cadastros/fornecedores");
}

export async function updateSupplier(id: string, data: SupplierUpdateData): Promise<SupplierActionResult> {
  try {
    const context = await getTenantContextForModuleOperation("CADASTROS", "update");
    const update: SupplierUpdateInput = {};
    if (hasField(data, "category")) update.category = optionalSupplierText(data.category);
    if (hasField(data, "businessBranch")) update.businessBranch = optionalSupplierText(data.businessBranch);
    if (hasField(data, "certificationsValidUntil")) update.certificationsValidUntil = parseSupplierDate(data.certificationsValidUntil);
    if (hasField(data, "bankData")) update.bankData = optionalSupplierText(data.bankData);
    if (hasField(data, "notes")) update.notes = optionalSupplierText(data.notes);

    const result = await context.prisma.$transaction(async (tx) => {
      const supplier = await tx.supplier.findUnique({ where: { id }, select: { companyId: true } });
      if (!supplier) throw new Error("Fornecedor não encontrado.");

      const cnaeFieldsSubmitted = hasField(data, "primaryCnae") || hasField(data, "secondaryCnaes");
      if (cnaeFieldsSubmitted) {
        if (!supplier.companyId) throw new Error("CNAE só pode ser alterado em fornecedor pessoa jurídica.");
        await tx.company.update({
          where: { id: supplier.companyId },
          data: {
            ...(hasField(data, "primaryCnae") ? { primaryCnae: optionalSupplierText(data.primaryCnae) } : {}),
            ...(hasField(data, "secondaryCnaes") ? { secondaryCnaes: optionalSupplierText(data.secondaryCnaes) } : {}),
          },
        });
      }

      const updatedSupplier = await tx.supplier.update({ where: { id }, data: update });
      // Queue the existing SIAFIC snapshot only after all canonical supplier fields are written.
      const eventIds = await queueSupplierSnapshot(tx, { usuarioId: context.user.id }, updatedSupplier.id, "UPDATE");
      return { eventIds };
    });
    await dispatchSiaficEvents(context.prisma, result.eventIds);
    revalidatePath("/cadastros/fornecedores");
    return {};
  } catch (error) {
    return supplierActionError(error, "Não foi possível atualizar o fornecedor.");
  }
}
export async function deactivateSupplier(id: string): Promise<SupplierActionResult> {
  try {
    const context = await getTenantContextForModuleOperation("CADASTROS", "update");
    const result = await setSupplierStatusWithSiaficEvent(context.prisma, { usuarioId: context.user.id }, id, "Inativo");
    await dispatchSiaficEvents(context.prisma, result.eventIds);
    revalidatePath("/cadastros/fornecedores");
    return {};
  } catch (error) {
    return supplierActionError(error, "Não foi possível inativar o fornecedor.");
  }
}
export async function activateSupplier(id: string): Promise<SupplierActionResult> {
  try {
    const context = await getTenantContextForModuleOperation("CADASTROS", "update");
    const result = await setSupplierStatusWithSiaficEvent(context.prisma, { usuarioId: context.user.id }, id, "Ativo");
    await dispatchSiaficEvents(context.prisma, result.eventIds);
    revalidatePath("/cadastros/fornecedores");
    return {};
  } catch (error) {
    return supplierActionError(error, "Não foi possível reativar o fornecedor.");
  }
}

// Address endpoints removed as they don't have a standalone page anymore

// Document
export async function updateDocument(id: string, data: DocumentUpdateData) {
  const prisma = await getTenantPrisma("update");
  const result = await prisma.document.update({ where: { id }, data });
  revalidatePath("/cadastros/documentos");
  return result;
}
export async function deleteDocument(id: string) {
  const prisma = await getTenantPrisma("delete");
  const result = await prisma.document.delete({ where: { id } });
  revalidatePath("/cadastros/documentos");
  return result;
}
