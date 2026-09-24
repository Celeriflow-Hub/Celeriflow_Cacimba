"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { nextYearlyCode } from "@/lib/sequence";
import { getAttendanceContext, getAttendanceOperationalContextForOperation, getOmbudsmanOperationalContextForOperation, ombudsmanScope, ticketScope } from "@/lib/attendance/access";
import { createValidatedProcess } from "@/lib/protocols/service";
import { getTenantContextForModuleOperation } from "@/lib/platform/tenant-context";
import { requireValidCnpj, requireValidCpf } from "@/lib/identifiers/brazilian-identifiers";
import { assertRedactedOmbudsmanDisclosure } from "@/lib/attendance/ombudsman-disclosure-policy";
import type { Prisma } from "@prisma/client";

const TICKET_STATUSES = new Set(["Aberto", "Encaminhado", "Aguardando Recebimento", "Em Atendimento", "Aguardando Informação", "Resolvido", "Concluído", "Cancelado", "Reaberto"]);
const OMBUDSMAN_STATUSES = new Set(["Recebida", "Em Triagem", "Encaminhada", "Em Apuração", "Aguardando Resposta", "Concluída"]);

function stringValue(formData: FormData, name: string) {
  return String(formData.get(name) || "").trim();
}

function revalidateAttendance() {
  for (const path of ["/atendimento", "/atendimento/central", "/atendimento/fila", "/atendimento/configuracoes", "/atendimento/ouvidoria", "/atendimento/relatorios", "/protocolos/ouvidoria"]) {
    revalidatePath(path);
  }
}

function revalidateOmbudsman(id: string) {
  revalidateAttendance();
  revalidatePath(`/atendimento/ouvidoria/${id}`);
  revalidatePath(`/protocolos/ouvidoria/${id}`);
}

async function scopedTicket(id: string, operation: "create" | "update" = "update") {
  const context = await getAttendanceOperationalContextForOperation(operation);
  const ticket = await context.prisma.ticket.findFirst({
    where: { AND: [{ id }, ticketScope(context)] },
    include: { department: true },
  });
  if (!ticket) throw new Error("Chamado nao encontrado ou sem acesso ao seu setor.");
  return { context, ticket };
}

async function scopedOmbudsman(id: string, operation: "create" | "update" | "delete" = "update") {
  const context = await getOmbudsmanOperationalContextForOperation(operation);
  const ombudsman = await context.prisma.ombudsman.findFirst({
    where: { AND: [{ id }, ombudsmanScope(context)] },
    include: { identity: true },
  });
  if (!ombudsman) throw new Error("Manifestacao nao encontrada ou sem acesso.");
  return { context, ombudsman };
}

async function auditTicket(tx: Prisma.TransactionClient, ticketId: string, context: Awaited<ReturnType<typeof getAttendanceOperationalContextForOperation>>, action: string, details?: Prisma.InputJsonObject) {
  await tx.ticketAuditLog.create({
    data: { ticketId, userId: context.user.id, employeeId: context.employee.id, action, details },
  });
}

export async function createTicket(formData: FormData): Promise<void> {
  const context = await getAttendanceOperationalContextForOperation("create");
  const requesterType = stringValue(formData, "requesterType") || "anonymous";
  const channelId = stringValue(formData, "channelId");
  const serviceSubjectId = stringValue(formData, "serviceSubjectId") || null;
  const selectedDepartmentId = stringValue(formData, "departmentId") || null;
  const subject = stringValue(formData, "subject");
  const description = stringValue(formData, "description");
  const requestedPriority = stringValue(formData, "priority") || "Normal";

  if (!channelId || !subject || !description) throw new Error("Canal, assunto e descricao sao obrigatorios.");
  if (!["person", "company", "anonymous"].includes(requesterType)) throw new Error("Tipo de solicitante invalido.");

  const created = await context.prisma.$transaction(async (tx) => {
    const channel = await tx.supportChannel.findFirst({ where: { id: channelId, isActive: true } });
    if (!channel) throw new Error("Selecione um canal de atendimento ativo.");

    const serviceSubject = serviceSubjectId
      ? await tx.serviceSubject.findFirst({ where: { id: serviceSubjectId, isActive: true } })
      : null;
    if (serviceSubjectId && !serviceSubject) throw new Error("Assunto de atendimento invalido ou inativo.");

    const departmentId = serviceSubject?.defaultDepartmentId || selectedDepartmentId;
    if (departmentId) {
      const department = await tx.department.findFirst({ where: { id: departmentId, isActive: true }, select: { id: true } });
      if (!department) throw new Error("Setor responsavel invalido ou inativo.");
    }

    let personId: string | null = null;
    let companyId: string | null = null;
    if (requesterType === "person") {
      const cpf = requireValidCpf(stringValue(formData, "cpf"));
      const fullName = stringValue(formData, "fullName");
      const phone = stringValue(formData, "phone");
      if (!cpf || !fullName) throw new Error("Informe CPF e nome da pessoa solicitante.");
      const person = await tx.person.upsert({
        where: { cpf },
        create: { cpf, fullName, phonePrimary: phone || null, status: "Ativo" },
        update: { fullName, ...(phone ? { phonePrimary: phone } : {}) },
      });
      personId = person.id;
    }
    if (requesterType === "company") {
      const cnpj = requireValidCnpj(stringValue(formData, "cnpj"));
      const corporateName = stringValue(formData, "corporateName");
      const phone = stringValue(formData, "companyPhone");
      if (!cnpj || !corporateName) throw new Error("Informe CNPJ e razao social da empresa solicitante.");
      const company = await tx.company.upsert({
        where: { cnpj },
        create: { cnpj, corporateName, phone: phone || null, status: "Ativo" },
        update: { corporateName, ...(phone ? { phone } : {}) },
      });
      companyId = company.id;
    }

    const ticketNumber = await nextYearlyCode({
      prisma: tx,
      key: "ATD",
      prefix: "ATD",
      padding: 6,
      existingCodes: await tx.ticket.findMany({ select: { ticketNumber: true } }).then((rows: { ticketNumber: string }[]) => rows.map(({ ticketNumber }) => ({ code: ticketNumber }))),
    });
    const dueAt = serviceSubject?.defaultDueDays ? new Date(Date.now() + serviceSubject.defaultDueDays * 86400000) : null;
    const priority = serviceSubject?.defaultPriority || requestedPriority;
    const ticket = await tx.ticket.create({
      data: {
        ticketNumber,
        subject,
        description,
        priority,
        isAnonymous: requesterType === "anonymous",
        channelId,
        personId,
        companyId,
        departmentId,
        serviceSubjectId: serviceSubject?.id || null,
        dueAt,
        interactions: { create: { type: "Registro", message: "Atendimento registrado.", isInternal: true, employeeId: context.employee.id } },
      },
    });
    if (departmentId) {
      await tx.ticketMovement.create({
        data: { ticketId: ticket.id, toDepartmentId: departmentId, employeeId: context.employee.id, reason: "Distribuicao inicial" },
      });
    }
    await auditTicket(tx, ticket.id, context, "CREATED", { departmentId, requesterType, serviceSubjectId, dueAt: dueAt?.toISOString() ?? null });
    return ticket;
  });

  revalidateAttendance();
  redirect(`/atendimento/chamados/${created.id}`);
}

export async function createOmbudsman(formData: FormData): Promise<void> {
  const context = await getOmbudsmanOperationalContextForOperation("create");
  const openedFromProtocols = formData.get("originModule") === "PROCESSOS" && context.attendanceAccess.authorizationModule === "PROCESSOS";
  if (!context.attendanceAccess.isOmbudsman) throw new Error("Somente a Ouvidoria pode registrar manifestacoes.");
  const type = stringValue(formData, "type");
  const subject = stringValue(formData, "subject");
  const description = stringValue(formData, "description");
  const channelId = stringValue(formData, "channelId");
  const departmentId = stringValue(formData, "departmentId") || null;
  const isAnonymous = formData.get("isAnonymous") === "on";
  const isConfidential = formData.get("isConfidential") === "on";
  if (!new Set(["Denúncia", "Reclamação", "Sugestão", "Elogio"]).has(type) || !subject || !description || !channelId) {
    throw new Error("Informe tipo, canal, assunto e descricao da manifestacao.");
  }

  const created = await context.prisma.$transaction(async (tx) => {
    const channel = await tx.supportChannel.findFirst({ where: { id: channelId, isActive: true }, select: { id: true } });
    if (!channel) throw new Error("Selecione um canal de atendimento ativo.");
    if (departmentId) {
      const department = await tx.department.findFirst({ where: { id: departmentId, isActive: true }, select: { id: true } });
      if (!department) throw new Error("Setor inicial invalido ou inativo.");
    }
    let personId: string | null = null;
    if (!isAnonymous) {
      const cpf = requireValidCpf(stringValue(formData, "cpf"));
      const fullName = stringValue(formData, "fullName");
      if (!cpf || !fullName) throw new Error("Informe CPF e nome ou marque a manifestacao como anonima.");
      personId = (await tx.person.upsert({ where: { cpf }, create: { cpf, fullName, status: "Ativo" }, update: { fullName } })).id;
    }
    const protocolNumber = await nextYearlyCode({
      prisma: tx,
      key: "OUV",
      prefix: "OUV",
      padding: 6,
      existingCodes: await tx.ombudsman.findMany({ select: { protocolNumber: true } }).then((rows: { protocolNumber: string }[]) => rows.map(({ protocolNumber }) => ({ code: protocolNumber }))),
    });
    const ombudsman = await tx.ombudsman.create({
      data: {
        protocolNumber, type, subject, description, channelId, departmentId,
        // New identities are stored separately so a department cannot obtain them from the body record.
        personId: null, isAnonymous, isConfidential,
        ...(personId ? { identity: { create: { personId } } } : {}),
        interactions: { create: { type: "Registro", message: "Manifestacao registrada.", employeeId: context.employee.id } },
      },
    });
    if (departmentId) {
      await tx.ombudsmanMovement.create({ data: { ombudsmanId: ombudsman.id, toDepartmentId: departmentId, employeeId: context.employee.id, reason: "Distribuicao inicial" } });
    }
    await tx.ombudsmanAuditLog.create({ data: { ombudsmanId: ombudsman.id, userId: context.user.id, employeeId: context.employee.id, action: "CREATED", details: { type, departmentId, isAnonymous, isConfidential } } });
    return ombudsman;
  });
  revalidateAttendance();
  redirect(openedFromProtocols ? `/protocolos/ouvidoria/${created.id}` : `/atendimento/ouvidoria/${created.id}`);
}

export async function assumeTicket(formData: FormData): Promise<void> {
  const id = stringValue(formData, "ticketId");
  const { context, ticket } = await scopedTicket(id);
  if (["Resolvido", "Concluído", "Cancelado"].includes(ticket.status)) throw new Error("Este chamado nao pode mais ser assumido.");
  if (ticket.assigneeId && ticket.assigneeId !== context.employee.id && !context.attendanceAccess.isManager) throw new Error("O chamado ja possui outro responsavel.");
  await context.prisma.$transaction(async (tx) => {
    await tx.ticket.update({ where: { id }, data: { assigneeId: context.employee.id, status: "Em Atendimento" } });
    await tx.ticketInteraction.create({ data: { ticketId: id, type: "Assunção", message: "Chamado assumido pelo servidor responsavel.", isInternal: true, employeeId: context.employee.id } });
    await auditTicket(tx, id, context, "ASSUMED", { previousAssigneeId: ticket.assigneeId });
  });
  revalidateAttendance();
  revalidatePath(`/atendimento/chamados/${id}`);
}

export async function assignTicket(formData: FormData): Promise<void> {
  const id = stringValue(formData, "ticketId");
  const assigneeId = stringValue(formData, "assigneeId");
  const { context, ticket } = await scopedTicket(id);
  if (!context.attendanceAccess.isManager) throw new Error("Somente gestores podem atribuir chamados a outro servidor.");
  if (!assigneeId) throw new Error("Selecione o responsavel.");
  const assignee = await context.prisma.employee.findFirst({ where: { id: assigneeId, isActive: true, departmentId: ticket.departmentId || undefined } });
  if (!assignee) throw new Error("O responsavel deve estar ativo e vinculado ao setor atual.");
  await context.prisma.$transaction(async (tx) => {
    await tx.ticket.update({ where: { id }, data: { assigneeId, status: "Em Atendimento" } });
    await tx.ticketInteraction.create({ data: { ticketId: id, type: "Assunção", message: `Chamado atribuido a ${assignee.name}.`, isInternal: true, employeeId: context.employee.id } });
    await auditTicket(tx, id, context, "ASSIGNED", { fromAssigneeId: ticket.assigneeId, toAssigneeId: assigneeId });
  });
  revalidateAttendance();
  revalidatePath(`/atendimento/chamados/${id}`);
}

export async function forwardTicket(formData: FormData): Promise<void> {
  const id = stringValue(formData, "ticketId");
  const toDepartmentId = stringValue(formData, "toDepartmentId");
  const reason = stringValue(formData, "reason");
  const { context, ticket } = await scopedTicket(id);
  if (!toDepartmentId || !reason) throw new Error("Informe o setor de destino e o motivo do encaminhamento.");
  if (ticket.departmentId === toDepartmentId) throw new Error("Selecione um setor diferente do atual.");
  const destination = await context.prisma.department.findFirst({ where: { id: toDepartmentId, isActive: true }, select: { id: true, name: true } });
  if (!destination) throw new Error("Setor de destino invalido ou inativo.");
  await context.prisma.$transaction(async (tx) => {
    await tx.ticket.update({ where: { id }, data: { departmentId: destination.id, assigneeId: null, status: "Aguardando Recebimento" } });
    await tx.ticketMovement.create({ data: { ticketId: id, fromDepartmentId: ticket.departmentId, toDepartmentId: destination.id, fromAssigneeId: ticket.assigneeId, employeeId: context.employee.id, reason } });
    await tx.ticketInteraction.create({ data: { ticketId: id, type: "Encaminhamento", message: `Encaminhado para ${destination.name}: ${reason}`, isInternal: true, employeeId: context.employee.id } });
    await auditTicket(tx, id, context, "FORWARDED", { fromDepartmentId: ticket.departmentId, toDepartmentId, reason });
  });
  revalidateAttendance();
  revalidatePath(`/atendimento/chamados/${id}`);
}

export async function addTicketInteraction(formData: FormData): Promise<void> {
  const id = stringValue(formData, "ticketId");
  const message = stringValue(formData, "message");
  const type = stringValue(formData, "type") || "Comentário";
  const { context } = await scopedTicket(id, "create");
  if (!message) throw new Error("Informe a interacao.");
  if (!new Set(["Registro", "Comentário", "Resposta", "Solicitação de Informação"]).has(type)) throw new Error("Tipo de interacao invalido.");
  await context.prisma.$transaction(async (tx) => {
    await tx.ticketInteraction.create({ data: { ticketId: id, type, message, isInternal: true, employeeId: context.employee.id } });
    await auditTicket(tx, id, context, "INTERACTION_ADDED", { type });
  });
  revalidateAttendance();
  revalidatePath(`/atendimento/chamados/${id}`);
}

export async function resolveTicket(formData: FormData): Promise<void> {
  const id = stringValue(formData, "ticketId");
  const solution = stringValue(formData, "solution");
  const { context } = await scopedTicket(id);
  if (!solution) throw new Error("Registre a solucao ou providencia adotada.");
  await context.prisma.$transaction(async (tx) => {
    await tx.ticket.update({ where: { id }, data: { status: "Resolvido", solution, resolvedAt: new Date(), resolvedById: context.employee.id } });
    await tx.ticketInteraction.create({ data: { ticketId: id, type: "Solução", message: solution, isInternal: true, employeeId: context.employee.id } });
    await auditTicket(tx, id, context, "RESOLVED");
  });
  revalidateAttendance();
  revalidatePath(`/atendimento/chamados/${id}`);
}

export async function concludeTicket(formData: FormData): Promise<void> {
  const id = stringValue(formData, "ticketId");
  const { context, ticket } = await scopedTicket(id);
  if (ticket.status !== "Resolvido") throw new Error("O chamado precisa estar resolvido antes da conclusao.");
  await context.prisma.$transaction(async (tx) => {
    await tx.ticket.update({ where: { id }, data: { status: "Concluído", concludedAt: new Date(), concludedById: context.employee.id } });
    await tx.ticketInteraction.create({ data: { ticketId: id, type: "Conclusão", message: "Chamado concluido.", isInternal: true, employeeId: context.employee.id } });
    await auditTicket(tx, id, context, "CONCLUDED");
  });
  revalidateAttendance();
  revalidatePath(`/atendimento/chamados/${id}`);
}

export async function reopenTicket(formData: FormData): Promise<void> {
  const id = stringValue(formData, "ticketId");
  const reason = stringValue(formData, "reason");
  const { context, ticket } = await scopedTicket(id);
  if (!["Resolvido", "Concluído", "Cancelado"].includes(ticket.status)) throw new Error("Somente chamados finalizados podem ser reabertos.");
  if (!reason) throw new Error("Informe o motivo da reabertura.");
  await context.prisma.$transaction(async (tx) => {
    await tx.ticket.update({ where: { id }, data: { status: "Reaberto", concludedAt: null, concludedById: null } });
    await tx.ticketInteraction.create({ data: { ticketId: id, type: "Reabertura", message: reason, isInternal: true, employeeId: context.employee.id } });
    await auditTicket(tx, id, context, "REOPENED", { reason });
  });
  revalidateAttendance();
  revalidatePath(`/atendimento/chamados/${id}`);
}

export async function updateTicketStatus(id: string, status: string) {
  try {
    if (!TICKET_STATUSES.has(status) || ["Resolvido", "Concluído"].includes(status)) throw new Error("Use a tela do chamado para registrar solucao e conclusao.");
    const { context, ticket } = await scopedTicket(id);
    await context.prisma.$transaction(async (tx) => {
      await tx.ticket.update({ where: { id }, data: { status } });
      await tx.ticketInteraction.create({ data: { ticketId: id, type: "Registro", message: `Status alterado para ${status}.`, isInternal: true, employeeId: context.employee.id } });
      await auditTicket(tx, id, context, "STATUS_CHANGED", { from: ticket.status, to: status });
    });
    revalidateAttendance();
    return { success: true as const };
  } catch (error) {
    console.error("Failed to update ticket status:", error);
    return { success: false as const, error: error instanceof Error ? error.message : "Falha ao atualizar o status do chamado." };
  }
}

export async function updateOmbudsmanStatus(id: string, requestedStatus: string) {
  try {
    const context = await getOmbudsmanOperationalContextForOperation("update");
    if (!context.attendanceAccess.isOmbudsman) throw new Error("Somente a Ouvidoria pode alterar manifestacoes.");
    const status = requestedStatus === "Em Análise" ? "Em Triagem" : requestedStatus;
    if (!OMBUDSMAN_STATUSES.has(status)) throw new Error("Status de manifestacao invalido.");
    const ombudsman = await context.prisma.ombudsman.findFirst({ where: { AND: [{ id }, ombudsmanScope(context)] }, select: { id: true, status: true } });
    if (!ombudsman) throw new Error("Manifestacao nao encontrada ou sem acesso.");
    const transitions: Record<string, string[]> = {
      "Recebida": ["Em Triagem"],
      "Em Triagem": ["Encaminhada"],
      "Encaminhada": ["Em Apuração"],
      "Em Apuração": ["Aguardando Resposta"],
    };
    if (!transitions[ombudsman.status]?.includes(status)) throw new Error("Transicao de status nao permitida para esta manifestacao.");
    await context.prisma.$transaction(async (tx) => {
      await tx.ombudsman.update({ where: { id }, data: { status } });
      await tx.ombudsmanInteraction.create({ data: { ombudsmanId: id, type: "Status", message: `Status alterado para ${status}.`, employeeId: context.employee.id } });
      await tx.ombudsmanAuditLog.create({ data: { ombudsmanId: id, userId: context.user.id, employeeId: context.employee.id, action: "STATUS_CHANGED", details: { from: ombudsman.status, to: status } } });
    });
    revalidateAttendance();
    return { success: true as const };
  } catch (error) {
    console.error("Failed to update ombudsman status:", error);
    return { success: false as const, error: error instanceof Error ? error.message : "Falha ao atualizar o status da manifestacao." };
  }
}

export async function createProcessFromTicket(formData: FormData): Promise<void> {
  await getTenantContextForModuleOperation("PROCESSOS", "create");
  const id = stringValue(formData, "ticketId");
  const { context, ticket } = await scopedTicket(id, "create");
  if (ticket.processId) throw new Error("Este chamado ja possui um processo relacionado.");
  const processTypeId = stringValue(formData, "processTypeId");
  const subjectId = stringValue(formData, "subjectId");
  const initialDepartmentId = stringValue(formData, "initialDepartmentId") || null;
  const priority = stringValue(formData, "priority") || null;
  const process = await context.prisma.$transaction(async (tx) => {
    const created = await createValidatedProcess(tx, context.employee, context.user.id, {
      processTypeId, subjectId, initialDepartmentId, priority,
      personId: ticket.personId, companyId: ticket.companyId,
      description: `Atendimento ${ticket.ticketNumber}: ${ticket.subject}\n\n${ticket.description}`,
    });
    await tx.ticket.update({ where: { id }, data: { processId: created.id, status: "Encaminhado" } });
    await tx.ticketInteraction.create({ data: { ticketId: id, type: "Encaminhamento", message: `Protocolo ${created.protocolNumber} gerado a partir do atendimento.`, isInternal: true, employeeId: context.employee.id } });
    await auditTicket(tx, id, context, "PROCESS_CREATED", { processId: created.id, protocolNumber: created.protocolNumber });
    return created;
  });
  revalidateAttendance();
  revalidatePath(`/atendimento/chamados/${id}`);
  revalidatePath(`/protocolos/processos/${process.id}`);
}

export async function forwardOmbudsman(formData: FormData): Promise<void> {
  const id = stringValue(formData, "ombudsmanId");
  const toDepartmentId = stringValue(formData, "toDepartmentId");
  const reason = stringValue(formData, "reason");
  const { context, ombudsman } = await scopedOmbudsman(id);
  if (!context.attendanceAccess.isOmbudsman || !toDepartmentId || !reason) throw new Error("Informe o setor de destino e o motivo do encaminhamento.");
  if (!["Em Triagem", "Em Apuração", "Aguardando Resposta"].includes(ombudsman.status)) throw new Error("A manifestação precisa estar em triagem ou apuração antes do encaminhamento.");
  if (ombudsman.departmentId === toDepartmentId) throw new Error("Selecione um setor diferente do atual.");
  const destination = await context.prisma.department.findFirst({ where: { id: toDepartmentId, isActive: true }, select: { id: true, name: true } });
  if (!destination) throw new Error("Setor de destino invalido ou inativo.");
  await context.prisma.$transaction(async (tx) => {
    await tx.ombudsman.update({ where: { id }, data: { departmentId: destination.id, assigneeId: null, status: "Encaminhada" } });
    await tx.ombudsmanMovement.create({ data: { ombudsmanId: id, fromDepartmentId: ombudsman.departmentId, toDepartmentId: destination.id, employeeId: context.employee.id, reason } });
    await tx.ombudsmanInteraction.create({ data: { ombudsmanId: id, type: "Encaminhamento", message: `Encaminhada para ${destination.name}: ${reason}`, employeeId: context.employee.id } });
    await tx.ombudsmanAuditLog.create({ data: { ombudsmanId: id, userId: context.user.id, employeeId: context.employee.id, action: "FORWARDED", details: { fromDepartmentId: ombudsman.departmentId, toDepartmentId, reason } } });
  });
  revalidateOmbudsman(id);
}

export async function startOmbudsmanTriage(formData: FormData): Promise<void> {
  const id = stringValue(formData, "ombudsmanId");
  const { context, ombudsman } = await scopedOmbudsman(id);
  if (!context.attendanceAccess.isOmbudsman || ombudsman.status !== "Recebida") throw new Error("Somente manifestações recebidas podem iniciar triagem.");
  await context.prisma.$transaction(async (tx) => {
    await tx.ombudsman.update({ where: { id }, data: { status: "Em Triagem", assigneeId: context.employee.id } });
    await tx.ombudsmanInteraction.create({ data: { ombudsmanId: id, type: "Triagem", message: "Manifestação recebida para triagem pela Ouvidoria.", employeeId: context.employee.id } });
    await tx.ombudsmanAuditLog.create({ data: { ombudsmanId: id, userId: context.user.id, employeeId: context.employee.id, action: "TRIAGE_STARTED" } });
  });
  revalidateOmbudsman(id);
}

export async function startOmbudsmanInvestigation(formData: FormData): Promise<void> {
  const id = stringValue(formData, "ombudsmanId");
  const { context, ombudsman } = await scopedOmbudsman(id);
  if (ombudsman.status !== "Encaminhada") throw new Error("A manifestação precisa estar encaminhada antes da apuração.");
  await context.prisma.$transaction(async (tx) => {
    await tx.ombudsman.update({ where: { id }, data: { status: "Em Apuração", assigneeId: context.employee.id } });
    await tx.ombudsmanInteraction.create({ data: { ombudsmanId: id, type: "Apuração", message: "Apuração iniciada pelo setor responsável.", employeeId: context.employee.id } });
    await tx.ombudsmanAuditLog.create({ data: { ombudsmanId: id, userId: context.user.id, employeeId: context.employee.id, action: "INVESTIGATION_STARTED" } });
  });
  revalidateOmbudsman(id);
}

export async function addOmbudsmanInteraction(formData: FormData): Promise<void> {
  const id = stringValue(formData, "ombudsmanId");
  const message = stringValue(formData, "message");
  const { context } = await scopedOmbudsman(id, "update");
  if (!message) throw new Error("Informe o registro da apuracao.");
  await context.prisma.$transaction(async (tx) => {
    await tx.ombudsmanInteraction.create({ data: { ombudsmanId: id, type: "Apuração", message, employeeId: context.employee.id } });
    await tx.ombudsmanAuditLog.create({ data: { ombudsmanId: id, userId: context.user.id, employeeId: context.employee.id, action: "INTERACTION_ADDED" } });
  });
  revalidateOmbudsman(id);
}

export async function respondOmbudsman(formData: FormData): Promise<void> {
  const id = stringValue(formData, "ombudsmanId");
  const response = stringValue(formData, "response");
  const { context, ombudsman } = await scopedOmbudsman(id);
  if (!context.attendanceAccess.isOmbudsman || !response) throw new Error("Somente a Ouvidoria pode registrar uma resposta.");
  if (!["Em Apuração", "Aguardando Resposta"].includes(ombudsman.status)) throw new Error("A manifestacao precisa estar em apuracao ou aguardando resposta.");
  await context.prisma.$transaction(async (tx) => {
    await tx.ombudsman.update({ where: { id }, data: { response, respondedAt: new Date(), respondedById: context.employee.id, status: "Aguardando Resposta" } });
    await tx.ombudsmanInteraction.create({ data: { ombudsmanId: id, type: "Resposta", message: response, employeeId: context.employee.id, isInternal: false } });
    await tx.ombudsmanAuditLog.create({ data: { ombudsmanId: id, userId: context.user.id, employeeId: context.employee.id, action: "RESPONDED" } });
  });
  revalidateOmbudsman(id);
}

export async function concludeOmbudsman(formData: FormData): Promise<void> {
  const id = stringValue(formData, "ombudsmanId");
  const { context, ombudsman } = await scopedOmbudsman(id);
  if (!context.attendanceAccess.isOmbudsman) throw new Error("Somente a Ouvidoria pode concluir manifestacoes.");
  if (!ombudsman.response) throw new Error("Registre a resposta antes de concluir a manifestacao.");
  if (ombudsman.status !== "Aguardando Resposta") throw new Error("A manifestacao precisa aguardar resposta antes da conclusao.");
  await context.prisma.$transaction(async (tx) => {
    await tx.ombudsman.update({ where: { id }, data: { status: "Concluída", concludedAt: new Date(), concludedById: context.employee.id } });
    await tx.ombudsmanInteraction.create({ data: { ombudsmanId: id, type: "Conclusão", message: "Manifestacao concluida.", employeeId: context.employee.id } });
    await tx.ombudsmanAuditLog.create({ data: { ombudsmanId: id, userId: context.user.id, employeeId: context.employee.id, action: "CONCLUDED" } });
  });
  revalidateOmbudsman(id);
}

export async function createProcessFromOmbudsman(formData: FormData): Promise<void> {
  await getTenantContextForModuleOperation("PROCESSOS", "create");
  const id = stringValue(formData, "ombudsmanId");
  const disclosure = assertRedactedOmbudsmanDisclosure(stringValue(formData, "disclosure"));
  const { context, ombudsman } = await scopedOmbudsman(id, "update");
  if (!context.attendanceAccess.isOmbudsman) throw new Error("Somente a Ouvidoria pode formalizar manifestacoes.");
  if (ombudsman.processId) throw new Error("Esta manifestacao ja possui um processo relacionado.");
  if (ombudsman.isConfidential) throw new Error("A formalizacao de manifestacao confidencial exige classificação e aprovação específicas, ainda não configuradas.");
  const process = await context.prisma.$transaction(async (tx) => {
    const created = await createValidatedProcess(tx, context.employee, context.user.id, {
      processTypeId: stringValue(formData, "processTypeId"), subjectId: stringValue(formData, "subjectId"),
      initialDepartmentId: stringValue(formData, "initialDepartmentId") || null,
      priority: stringValue(formData, "priority") || null,
      // Identity and original narrative are deliberately never copied to a formal process.
      description: `Manifestacao ${ombudsman.protocolNumber}. Resumo autorizado para apuracao formal:\n\n${disclosure}`,
    });
    await tx.ombudsman.update({ where: { id }, data: { processId: created.id } });
    await tx.ombudsmanInteraction.create({ data: { ombudsmanId: id, type: "Processo", message: `Processo ${created.protocolNumber} gerado com resumo autorizado.`, employeeId: context.employee.id } });
    await tx.ombudsmanAuditLog.create({ data: { ombudsmanId: id, userId: context.user.id, employeeId: context.employee.id, action: "PROCESS_CREATED", details: { processId: created.id, redactedSummaryLength: disclosure.length } } });
    return created;
  });
  revalidateOmbudsman(id);
  revalidatePath(`/protocolos/processos/${process.id}`);
}

export async function grantOmbudsmanAccess(formData: FormData): Promise<void> {
  const id = stringValue(formData, "ombudsmanId");
  const userId = stringValue(formData, "userId");
  const canViewIdentity = formData.get("canViewIdentity") === "on";
  const { context, ombudsman } = await scopedOmbudsman(id, "update");
  if (!context.attendanceAccess.isAdmin || !ombudsman.isConfidential || !userId) throw new Error("Somente administradores podem conceder acesso a manifestacoes confidenciais.");
  const user = await context.prisma.usuario.findFirst({ where: { id: userId, ativo: true }, select: { id: true } });
  if (!user) throw new Error("Usuario invalido ou inativo.");
  await context.prisma.$transaction(async (tx) => {
    await tx.ombudsmanAccess.upsert({
      where: { ombudsmanId_userId: { ombudsmanId: id, userId } },
      create: { ombudsmanId: id, userId, grantedById: context.user.id, canViewIdentity },
      update: { canViewIdentity, grantedById: context.user.id },
    });
    await tx.ombudsmanAuditLog.create({ data: { ombudsmanId: id, userId: context.user.id, employeeId: context.employee.id, action: "ACCESS_GRANTED", details: { grantedUserId: userId, canViewIdentity } } });
  });
  revalidateOmbudsman(id);
}

export async function revokeOmbudsmanAccess(formData: FormData): Promise<void> {
  const id = stringValue(formData, "ombudsmanId");
  const userId = stringValue(formData, "userId");
  const { context, ombudsman } = await scopedOmbudsman(id, "update");
  if (!context.attendanceAccess.isAdmin || !ombudsman.isConfidential || !userId) throw new Error("Somente administradores podem revogar acesso confidencial.");
  await context.prisma.$transaction(async (tx) => {
    await tx.ombudsmanAccess.deleteMany({ where: { ombudsmanId: id, userId } });
    await tx.ombudsmanAuditLog.create({ data: { ombudsmanId: id, userId: context.user.id, employeeId: context.employee.id, action: "ACCESS_REVOKED", details: { revokedUserId: userId } } });
  });
  revalidateOmbudsman(id);
}

export async function saveSupportChannel(formData: FormData): Promise<void> {
  const context = await getAttendanceContext("edit");
  if (!context.attendanceAccess.isManager) throw new Error("Somente gestores podem configurar canais.");
  const id = stringValue(formData, "id");
  const name = stringValue(formData, "name");
  const description = stringValue(formData, "description") || null;
  const sortOrder = Number(stringValue(formData, "sortOrder") || "0");
  const isActive = formData.get("isActive") === "on";
  if (!name || !Number.isInteger(sortOrder) || sortOrder < 0) throw new Error("Informe nome e ordem valida para o canal.");
  await context.prisma.supportChannel.upsert({ where: { id: id || "__novo__" }, create: { name, description, sortOrder, isActive }, update: { name, description, sortOrder, isActive } });
  revalidateAttendance();
}

export async function saveServiceSubject(formData: FormData): Promise<void> {
  const context = await getAttendanceContext("edit");
  if (!context.attendanceAccess.isManager) throw new Error("Somente gestores podem configurar assuntos.");
  const id = stringValue(formData, "id");
  const name = stringValue(formData, "name");
  const description = stringValue(formData, "description") || null;
  const defaultDepartmentId = stringValue(formData, "defaultDepartmentId") || null;
  const defaultPriority = stringValue(formData, "defaultPriority") || "Normal";
  const dueDaysRaw = stringValue(formData, "defaultDueDays");
  const defaultDueDays = dueDaysRaw ? Number(dueDaysRaw) : null;
  const isActive = formData.get("isActive") === "on";
  if (!name || (defaultDueDays !== null && (!Number.isInteger(defaultDueDays) || defaultDueDays < 1))) throw new Error("Informe um assunto e prazo valido.");
  if (defaultDepartmentId) {
    const department = await context.prisma.department.findFirst({ where: { id: defaultDepartmentId, isActive: true }, select: { id: true } });
    if (!department) throw new Error("Setor padrao invalido.");
  }
  await context.prisma.serviceSubject.upsert({
    where: { id: id || "__novo__" },
    create: { name, description, defaultDepartmentId, defaultPriority, defaultDueDays, isActive },
    update: { name, description, defaultDepartmentId, defaultPriority, defaultDueDays, isActive },
  });
  revalidateAttendance();
}
