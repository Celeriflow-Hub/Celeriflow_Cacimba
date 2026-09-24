"use server";

import { revalidatePath } from "next/cache";
import { assertAdministratorLifecycleChange, isSystemAdministratorEmail, isSystemAdministratorProfileCode, SYSTEM_ADMIN_PROFILE_CODE } from "@/lib/administration/c3-policy";
import { auditEventTypes, writeAuditEvent } from "@/lib/platform/audit-evidence";
import { AccessError, getTenantContextForSystemAdministration } from "@/lib/platform/tenant-context";
import { adminAuth } from "@/lib/firebase/server";
import { createFirebaseUserProvisioner } from "@/lib/firebase/user-provisioning";

export async function upsertUsuario(data: {
  id?: string;
  nome: string;
  email: string;
  perfilId: string;
  employeeId?: string;
  ativo: boolean;
  permissoes: { moduloId: string; canView: boolean; canEdit: boolean }[];
}) {
  try {
    const context = await getTenantContextForSystemAdministration();
    const { prisma } = context;
    const perfil = await prisma.configuracaoPerfil.findFirst({ where: { id: data.perfilId, ativo: true }, select: { id: true, codigo: true } });
    if (!perfil) return { error: "Selecione um perfil de acesso ativo." };

    const email = data.email.trim().toLowerCase();
    if (!data.nome.trim() || !email) return { error: "Nome e e-mail são obrigatórios." };
    if (isSystemAdministratorEmail(email) || isSystemAdministratorProfileCode(perfil.codigo)) {
      return { error: "A conta técnica do administrador do sistema é gerenciada automaticamente." };
    }
    const existing = data.id
      ? await prisma.usuario.findUnique({ where: { id: data.id }, include: { perfil: { select: { codigo: true } } } })
      : null;
    if (data.id && !existing) return { error: "Usuário não encontrado." };
    if (existing && (isSystemAdministratorEmail(existing.email) || isSystemAdministratorProfileCode(existing.perfil.codigo))) {
      return { error: "A conta técnica do administrador do sistema não pode ser alterada nesta tela." };
    }
    const duplicateEmailUser = await prisma.usuario.findUnique({ where: { email }, select: { id: true } });
    if (duplicateEmailUser && duplicateEmailUser.id !== existing?.id) return { error: "Já existe um usuário com este e-mail." };

    const employeeId = data.employeeId || null;
    if (employeeId) {
      const employee = await prisma.employee.findFirst({
        where: { id: employeeId, isActive: true },
        select: { id: true },
      });
      if (!employee) return { error: "Selecione um servidor ativo para vincular ao usuário." };

      const linkedUser = await prisma.usuario.findUnique({ where: { employeeId }, select: { id: true } });
      if (linkedUser && linkedUser.id !== existing?.id) {
        return { error: "Este servidor já está vinculado a outro usuário." };
      }
    }

    if (existing) {
      const activeSystemAdministratorCount = await prisma.usuario.count({ where: { ativo: true, perfil: { codigo: SYSTEM_ADMIN_PROFILE_CODE } } });
      try {
        assertAdministratorLifecycleChange({
          actorUsuarioId: context.user.id,
          targetUsuarioId: existing.id,
          targetIsSystemAdministrator: isSystemAdministratorProfileCode(existing.perfil.codigo),
          targetWillBeSystemAdministrator: isSystemAdministratorProfileCode(perfil.codigo),
          targetWillBeActive: data.ativo,
          activeSystemAdministratorCount,
        });
      } catch (error) {
        return { error: error instanceof Error ? error.message : "Não foi possível alterar o acesso administrativo." };
      }
    }

    const provisioner = createFirebaseUserProvisioner(adminAuth);
    const { firebaseUid } = await provisioner.provision({
      email,
      displayName: data.nome.trim(),
      disabled: !data.ativo,
      firebaseUid: existing?.firebaseUid,
    });

    await prisma.$transaction(async (tx) => {
      const user = existing
        ? await tx.usuario.update({
          where: { id: existing.id },
          data: {
            nome: data.nome.trim(), email, firebaseUid, perfilId: data.perfilId, employeeId, ativo: data.ativo,
            permissoesModulo: { deleteMany: {}, create: data.permissoes.map((permission) => ({ moduloId: permission.moduloId, canView: permission.canView, canEdit: permission.canEdit })) },
          },
        })
        : await tx.usuario.create({
          data: {
            nome: data.nome.trim(), email, firebaseUid, perfilId: data.perfilId, employeeId, ativo: data.ativo,
            permissoesModulo: { create: data.permissoes.map((permission) => ({ moduloId: permission.moduloId, canView: permission.canView, canEdit: permission.canEdit })) },
          },
        });
      await writeAuditEvent(tx, { actorUsuarioId: context.user.id, eventType: auditEventTypes.administrativeMutation, targetType: "USUARIO", targetId: user.id });
    });
    revalidatePath("/configuracoes/usuarios");
    revalidatePath("/portal-servidor");
    return { error: null };
  } catch (error) {
    console.error(error);
    return { error: error instanceof AccessError ? error.message : "Não foi possível salvar o usuário. Tente novamente." };
  }
}

export async function toggleUsuarioStatus(id: string, ativo: boolean) {
  try {
    const context = await getTenantContextForSystemAdministration();
    const { prisma } = context;
    const target = await prisma.usuario.findUnique({ where: { id }, include: { perfil: { select: { codigo: true } } } });
    if (!target) return { error: "Usuário não encontrado." };
    if (isSystemAdministratorEmail(target.email) || isSystemAdministratorProfileCode(target.perfil.codigo)) {
      return { error: "A conta técnica do administrador do sistema não pode ser desativada." };
    }
    const activeSystemAdministratorCount = await prisma.usuario.count({ where: { ativo: true, perfil: { codigo: SYSTEM_ADMIN_PROFILE_CODE } } });
    try {
      assertAdministratorLifecycleChange({
        actorUsuarioId: context.user.id,
        targetUsuarioId: target.id,
        targetIsSystemAdministrator: isSystemAdministratorProfileCode(target.perfil.codigo),
        targetWillBeSystemAdministrator: isSystemAdministratorProfileCode(target.perfil.codigo),
        targetWillBeActive: ativo,
        activeSystemAdministratorCount,
      });
    } catch (error) {
      return { error: error instanceof Error ? error.message : "Não foi possível alterar o acesso administrativo." };
    }
    const provisioner = createFirebaseUserProvisioner(adminAuth);
    const { firebaseUid } = await provisioner.provision({ email: target.email, displayName: target.nome, disabled: !ativo, firebaseUid: target.firebaseUid });
    await prisma.$transaction(async (tx) => {
      await tx.usuario.update({ where: { id }, data: { ativo, firebaseUid } });
      await writeAuditEvent(tx, { actorUsuarioId: context.user.id, eventType: auditEventTypes.administrativeMutation, targetType: "USUARIO", targetId: id });
    });
    revalidatePath("/configuracoes/usuarios");
    return { error: null };
  } catch (error) {
    console.error(error);
    return { error: error instanceof AccessError ? error.message : "Não foi possível alterar o status do usuário. Tente novamente." };
  }
}

export async function deleteUsuario(id: string) {
  try {
    const context = await getTenantContextForSystemAdministration();
    const { prisma } = context;
    const target = await prisma.usuario.findUnique({ where: { id }, include: { perfil: { select: { codigo: true } } } });
    if (!target) return { error: "Usuário não encontrado." };
    if (isSystemAdministratorEmail(target.email) || isSystemAdministratorProfileCode(target.perfil.codigo)) {
      return { error: "A conta técnica do administrador do sistema não pode ser excluída." };
    }
    if (target.id === context.user.id) return { error: "Você não pode excluir seu próprio usuário." };

    const activeSystemAdministratorCount = await prisma.usuario.count({ where: { ativo: true, perfil: { codigo: SYSTEM_ADMIN_PROFILE_CODE } } });
    try {
      assertAdministratorLifecycleChange({
        actorUsuarioId: context.user.id,
        targetUsuarioId: target.id,
        targetIsSystemAdministrator: isSystemAdministratorProfileCode(target.perfil.codigo),
        targetWillBeSystemAdministrator: false,
        targetWillBeActive: false,
        activeSystemAdministratorCount,
      });
    } catch (error) {
      return { error: error instanceof Error ? error.message : "Não foi possível alterar o acesso administrativo." };
    }

    await prisma.$transaction(async (tx) => {
      await tx.usuario.delete({ where: { id } });
      await writeAuditEvent(tx, { actorUsuarioId: context.user.id, eventType: auditEventTypes.administrativeMutation, targetType: "USUARIO", targetId: id });
    });
    revalidatePath("/configuracoes/usuarios");
    return { error: null };
  } catch (error) {
    console.error(error);
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2003") {
      return { error: "Não é possível excluir este usuário porque ele possui histórico ou registros vinculados. Inative-o para revogar o acesso." };
    }
    return { error: error instanceof AccessError ? error.message : "Não foi possível excluir o usuário. Tente novamente." };
  }
}
