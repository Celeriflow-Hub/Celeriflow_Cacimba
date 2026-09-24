import { SYSTEM_ADMIN_PROFILE_CODE } from "@/lib/administration/c3-policy";

export type PurchaseRequestUserScope = {
  profileCode: string;
  employeeId: string | null;
  secretariatId: string | null;
  departmentId: string | null;
};

export type PurchaseRequestOrigin = {
  secretariatId: string;
  departmentId: string;
};

export type ManagedPurchaseRequest = PurchaseRequestOrigin & {
  requesterId: string;
  status: string;
};

export class PurchaseRequestOriginError extends Error {}

export function canSelectAnyPurchaseRequestOrigin(user: PurchaseRequestUserScope) {
  return user.profileCode === SYSTEM_ADMIN_PROFILE_CODE;
}

export function purchaseRequestOriginScope(user: PurchaseRequestUserScope): PurchaseRequestOrigin | null {
  if (canSelectAnyPurchaseRequestOrigin(user)) return null;
  if (!user.employeeId || !user.secretariatId || !user.departmentId) return null;
  return { secretariatId: user.secretariatId, departmentId: user.departmentId };
}

export function assertPurchaseRequestOrigin(user: PurchaseRequestUserScope, origin: PurchaseRequestOrigin) {
  if (canSelectAnyPurchaseRequestOrigin(user)) return;
  const scope = purchaseRequestOriginScope(user);
  if (!scope) throw new PurchaseRequestOriginError("O usuario autenticado deve estar vinculado a um servidor, secretaria e departamento solicitantes.");
  if (scope.secretariatId !== origin.secretariatId || scope.departmentId !== origin.departmentId) {
    throw new PurchaseRequestOriginError("A solicitacao deve ser registrada na secretaria e no departamento do servidor solicitante.");
  }
}

export function canManagePurchaseRequest(user: PurchaseRequestUserScope, request: ManagedPurchaseRequest) {
  if (request.status !== "Rascunho") return false;
  if (canSelectAnyPurchaseRequestOrigin(user)) return true;
  const scope = purchaseRequestOriginScope(user);
  return Boolean(scope && request.requesterId === user.employeeId
    && request.secretariatId === scope.secretariatId
    && request.departmentId === scope.departmentId);
}
