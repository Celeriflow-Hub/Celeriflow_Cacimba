import assert from "node:assert/strict";
import test from "node:test";
import {
  assertGenericWorkflowDefinitionCanPublish,
  assertGenericWorkflowDefinitionMutable,
  assertGenericWorkflowTransition,
  assertRequiredSignedProcessDocument,
  calculateGenericWorkflowDeadline,
} from "../generic-workflow-policy";

const signedStage = { position: 1, slaCalendarDays: 3, requiresSignedDocument: true, requiredDocumentClassId: "class-a" };

test("published workflow versions are not mutable and publication requires sequential stages", () => {
  assert.throws(() => assertGenericWorkflowDefinitionMutable("PUBLISHED"), /imutaveis/);
  assert.throws(() => assertGenericWorkflowDefinitionCanPublish("PUBLISHED", [signedStage]), /rascunho/);
  assert.throws(() => assertGenericWorkflowDefinitionCanPublish("DRAFT", [{ ...signedStage, position: 2 }]), /sequenciais/);
  assert.doesNotThrow(() => assertGenericWorkflowDefinitionCanPublish("DRAFT", [signedStage]));
});

test("generic workflow only advances one stage, returns one stage, and preserves opener segregation", () => {
  assert.deepEqual(assertGenericWorkflowTransition({ action: "APPROVE", currentPosition: 1, totalStages: 3, openedByUsuarioId: "opener", actorUsuarioId: "reviewer" }), { fromPosition: 1, toPosition: 2 });
  assert.deepEqual(assertGenericWorkflowTransition({ action: "RETURN", currentPosition: 3, totalStages: 3, openedByUsuarioId: "opener", actorUsuarioId: "opener" }), { fromPosition: 3, toPosition: 2 });
  assert.throws(() => assertGenericWorkflowTransition({ action: "RETURN", currentPosition: 1, totalStages: 3, openedByUsuarioId: "opener", actorUsuarioId: "reviewer" }), /primeira etapa/);
  assert.throws(() => assertGenericWorkflowTransition({ action: "APPROVE", currentPosition: 1, totalStages: 3, openedByUsuarioId: "opener", actorUsuarioId: "opener" }), /abriu/);
  assert.throws(() => assertGenericWorkflowTransition({ action: "CONCLUDE", currentPosition: 3, totalStages: 3, openedByUsuarioId: "opener", actorUsuarioId: "opener" }), /abriu/);
});

test("required evidence must be process-linked, final, and signed", () => {
  assert.throws(() => assertRequiredSignedProcessDocument(signedStage, [{ documentClassId: "class-a", hasSignedFinalVersion: false }]), /finalizado e assinado/);
  assert.throws(() => assertRequiredSignedProcessDocument(signedStage, [{ documentClassId: "class-b", hasSignedFinalVersion: true }]), /finalizado e assinado/);
  assert.doesNotThrow(() => assertRequiredSignedProcessDocument(signedStage, [{ documentClassId: "class-a", hasSignedFinalVersion: true }]));
});

test("SLA uses calendar days in the instance timezone", () => {
  const deadline = calculateGenericWorkflowDeadline(new Date("2026-10-31T12:00:00.000Z"), 3, "America/New_York");
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(deadline);
  const value = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value;
  assert.deepEqual([value("year"), value("month"), value("day")], ["2026", "11", "03"]);
});
