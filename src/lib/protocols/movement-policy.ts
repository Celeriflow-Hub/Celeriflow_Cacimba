export const PENDING_MOVEMENT_STATUS = "AWAITING_RECEIPT";

type PendingMovementInput = {
  processStatus: string;
  movementStatus: string;
  fromDepartmentId: string | null;
  toDepartmentId: string;
  currentDepartmentId: string | null;
  actorDepartmentId: string;
  isGenericWorkflow: boolean;
};

function assertPendingMovement(input: PendingMovementInput) {
  if (input.isGenericWorkflow) {
    throw new Error("O fluxo genérico possui regras próprias de devolução e rejeição.");
  }
  if (input.processStatus !== "Aguardando Recebimento" || input.movementStatus !== PENDING_MOVEMENT_STATUS) {
    throw new Error("A tramitação não está mais aguardando recebimento.");
  }
  if (input.currentDepartmentId !== input.toDepartmentId) {
    throw new Error("A tramitação pendente não corresponde ao setor atual do processo.");
  }
  if (!input.fromDepartmentId) {
    throw new Error("A distribuição inicial não pode ser cancelada ou rejeitada por esta operação.");
  }
}

export function assertMovementCanBeCancelled(input: PendingMovementInput) {
  assertPendingMovement(input);
  if (input.fromDepartmentId !== input.actorDepartmentId) {
    throw new Error("Somente o setor de origem pode cancelar o encaminhamento antes do recebimento.");
  }
}

export function assertMovementCanBeRejected(input: PendingMovementInput) {
  assertPendingMovement(input);
  if (input.toDepartmentId !== input.actorDepartmentId) {
    throw new Error("Somente o setor de destino pode rejeitar o encaminhamento pendente.");
  }
}
