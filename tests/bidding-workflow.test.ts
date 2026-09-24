import assert from "node:assert/strict";
import test from "node:test";
import {
  BIDDING_LOT_STATUS,
  BIDDING_PHASE_DEFINITIONS,
  BIDDING_PHASE_STATUS,
  BIDDING_STATUS,
  BiddingWorkflowError,
  assertBiddingStatusTransition,
  biddingModalityPrefix,
  biddingSequenceKey,
  canEditBiddingDetails,
  canDecideBiddingResult,
  canRegisterBiddingParticipant,
  getAllowedBiddingStatusTransitions,
  getBiddingPhaseCodeForStatus,
  getBiddingPhasePlan,
  getBiddingPhaseProgress,
  isBiddingBidSubmissionOpen,
  isTerminalBiddingStatus,
  normalizeBiddingStatus,
} from "../src/lib/compras/bidding-workflow";

test("CLC-034 keeps automatic bidding sequences independent by modality", () => {
  assert.equal(biddingModalityPrefix("Pregão Eletrônico"), "PE");
  assert.equal(biddingModalityPrefix("Concorrência"), "CC");
  assert.equal(biddingSequenceKey("Pregão Eletrônico"), "compras-licitacao:PE");
  assert.equal(biddingSequenceKey("Concorrência"), "compras-licitacao:CC");
});

test("CLC-037 permits only the configured lifecycle transitions", () => {
  assert.deepEqual(getAllowedBiddingStatusTransitions(BIDDING_STATUS.DRAFT), [
    BIDDING_STATUS.PUBLISHED,
    BIDDING_STATUS.CANCELLED,
    BIDDING_STATUS.ANNULLED,
    BIDDING_STATUS.REVOKED,
    BIDDING_STATUS.INACTIVE,
  ]);
  assert.deepEqual(
    assertBiddingStatusTransition(BIDDING_STATUS.DRAFT, BIDDING_STATUS.PUBLISHED),
    { current: BIDDING_STATUS.DRAFT, next: BIDDING_STATUS.PUBLISHED },
  );
  assert.throws(
    () => assertBiddingStatusTransition(BIDDING_STATUS.DRAFT, BIDDING_STATUS.HOMOLOGATED),
    BiddingWorkflowError,
  );
  assert.deepEqual(getAllowedBiddingStatusTransitions(BIDDING_STATUS.SUSPENDED), [
    BIDDING_STATUS.PUBLISHED,
    BIDDING_STATUS.OPEN,
    BIDDING_STATUS.JUDGMENT,
    BIDDING_STATUS.CANCELLED,
    BIDDING_STATUS.ANNULLED,
    BIDDING_STATUS.REVOKED,
    BIDDING_STATUS.INACTIVE,
  ]);
  assert.throws(
    () => assertBiddingStatusTransition(BIDDING_STATUS.CONCLUDED, BIDDING_STATUS.OPEN),
    BiddingWorkflowError,
  );
});

test("legacy status labels remain readable but details remain protected after preparation", () => {
  assert.equal(normalizeBiddingStatus("Cancelado"), BIDDING_STATUS.CANCELLED);
  assert.equal(normalizeBiddingStatus("Em Andamento"), BIDDING_STATUS.OPEN);
  assert.equal(canEditBiddingDetails("Rascunho"), true);
  assert.equal(canEditBiddingDetails("Aberto"), false);
  assert.equal(isTerminalBiddingStatus(BIDDING_STATUS.SUSPENDED), false);
  assert.equal(isTerminalBiddingStatus(BIDDING_STATUS.CANCELLED), true);
  assert.equal(getBiddingPhaseProgress(BIDDING_STATUS.HOMOLOGATED), 4);
  assert.equal(getBiddingPhaseProgress(BIDDING_STATUS.CONCLUDED), 6);
});

test("persistent phases mirror the bidding lifecycle", () => {
  const openPlan = getBiddingPhasePlan(BIDDING_STATUS.OPEN);
  assert.ok(openPlan);
  assert.equal(openPlan.length, BIDDING_PHASE_DEFINITIONS.length);
  assert.equal(openPlan[0].status, BIDDING_PHASE_STATUS.COMPLETED);
  assert.equal(openPlan[1].status, BIDDING_PHASE_STATUS.COMPLETED);
  assert.equal(openPlan[2].status, BIDDING_PHASE_STATUS.IN_PROGRESS);
  assert.equal(openPlan[2].isCurrent, true);
  assert.equal(getBiddingPhaseCodeForStatus(BIDDING_STATUS.JUDGMENT), "JUDGMENT");
  assert.equal(getBiddingPhasePlan(BIDDING_STATUS.SUSPENDED), null);
});

test("portal bids require an open lot, open bidding, and an unexpired deadline", () => {
  const deadline = new Date("2026-09-20T12:00:00.000Z");
  assert.equal(isBiddingBidSubmissionOpen({
    biddingStatus: BIDDING_STATUS.OPEN,
    lotStatus: BIDDING_LOT_STATUS.OPEN,
    deadline,
    now: new Date("2026-09-20T11:59:59.000Z"),
  }), true);
  assert.equal(isBiddingBidSubmissionOpen({
    biddingStatus: BIDDING_STATUS.OPEN,
    lotStatus: BIDDING_LOT_STATUS.OPEN,
    deadline,
    now: deadline,
  }), false);
  assert.equal(isBiddingBidSubmissionOpen({
    biddingStatus: BIDDING_STATUS.JUDGMENT,
    lotStatus: BIDDING_LOT_STATUS.OPEN,
    deadline,
    now: new Date("2026-09-20T11:00:00.000Z"),
  }), false);
  assert.equal(canRegisterBiddingParticipant(BIDDING_STATUS.PUBLISHED), true);
  assert.equal(canRegisterBiddingParticipant(BIDDING_STATUS.OPEN), false);
  assert.equal(canDecideBiddingResult(BIDDING_STATUS.JUDGMENT), true);
  assert.equal(canDecideBiddingResult(BIDDING_STATUS.OPEN), false);
});
