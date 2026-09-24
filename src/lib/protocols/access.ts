import type { Prisma } from "@prisma/client";
import { canEditModule, canPerformModuleOperation, getTenantContextForModule, getTenantContextForModuleEdit, getTenantContextForModuleOperation, isSystemAdministrator, type AppContext, type ModuleOperation } from "@/lib/platform/tenant-context";

export type ProtocolContext = AppContext & {
  protocolAccess: {
    isAdmin: boolean;
    canView: boolean;
    canEdit: boolean;
    canCreate: boolean;
    canUpdate: boolean;
  };
};

function withProtocolAccess(context: AppContext): ProtocolContext {
  const isAdmin = isSystemAdministrator(context.user);
  return {
    ...context,
    protocolAccess: {
      isAdmin,
      canView: true,
      canEdit: canEditModule(context.user, "PROCESSOS"),
      canCreate: canPerformModuleOperation(context.user, "PROCESSOS", "create"),
      canUpdate: canPerformModuleOperation(context.user, "PROCESSOS", "update"),
    },
  };
}

export async function getProtocolContext(required: "view" | "edit" = "view"): Promise<ProtocolContext> {
  const context = required === "edit"
    ? await getTenantContextForModuleEdit("PROCESSOS")
    : await getTenantContextForModule("PROCESSOS");
  return withProtocolAccess(context);
}

export async function getProtocolContextForOperation(
  operation: Extract<ModuleOperation, "create" | "update" | "delete">,
): Promise<ProtocolContext> {
  const context = await getTenantContextForModuleOperation("PROCESSOS", operation);
  return withProtocolAccess(context);
}

export function protocolScope(context: ProtocolContext): Prisma.ProcessWhereInput {
  if (context.protocolAccess.isAdmin) return {};
  if (!context.user.departmentId) return { id: "__sem-departamento__" };

  // A sector must retain read access to the processes it has formally received or sent.
  // Operational mutations still verify the current sector in their own server action.
  return {
    OR: [
      { currentDepartmentId: context.user.departmentId },
      {
        movements: {
          some: {
            OR: [
              { fromDepartmentId: context.user.departmentId },
              { toDepartmentId: context.user.departmentId },
            ],
          },
        },
      },
    ],
  };
}
