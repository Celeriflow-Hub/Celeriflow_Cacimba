import { Prisma, type PrismaClient } from "@prisma/client";
import { FinanceError, postAccountingEventInTransaction, type FinanceActor } from "@/lib/financeiro";

export class AssetLifecycleError extends Error {}

export type DepreciationInput = {
  acquisitionValue: number;
  bookValue: number;
  lifeSpanMonths: number;
  periodNumber: number;
};

export type AssetDisposalInput = {
  assetId: string;
  date: Date;
  type: "Baixa" | "Alienação";
  reason: string;
  justification: string;
  disposalValue?: number;
  actor?: FinanceActor;
};

export type AssetValueAdjustmentType = "REVALUATION" | "IMPAIRMENT" | "SUBSEQUENT_COST";

export type AssetValueAdjustmentInput = {
  assetId: string;
  date: Date;
  type: AssetValueAdjustmentType;
  value: number;
  justification: string;
  evidence: string;
};

function roundCurrency(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function normalizeReferenceMonth(value: Date) {
  if (Number.isNaN(value.valueOf())) throw new AssetLifecycleError("Competência de depreciação inválida.");
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), 1, 12));
}

export function calculateStraightLineDepreciation(input: DepreciationInput) {
  if (!Number.isFinite(input.acquisitionValue) || input.acquisitionValue < 0) {
    throw new AssetLifecycleError("O valor de aquisição do bem é inválido.");
  }
  if (!Number.isFinite(input.bookValue) || input.bookValue < 0) {
    throw new AssetLifecycleError("O valor contábil do bem é inválido.");
  }
  if (!Number.isInteger(input.lifeSpanMonths) || input.lifeSpanMonths <= 0) {
    throw new AssetLifecycleError("A categoria do bem deve ter vida útil em meses maior que zero.");
  }
  if (input.periodNumber < 1 || input.periodNumber > input.lifeSpanMonths) return 0;

  const regularInstallment = roundCurrency(input.acquisitionValue / input.lifeSpanMonths);
  const finalInstallment = roundCurrency(input.acquisitionValue - regularInstallment * (input.lifeSpanMonths - 1));
  const scheduledAmount = input.periodNumber === input.lifeSpanMonths ? finalInstallment : regularInstallment;
  return roundCurrency(Math.min(input.bookValue, scheduledAmount));
}

export function calculateAssetDisposal(bookValue: number, disposalValue: number) {
  if (!Number.isFinite(bookValue) || bookValue < 0 || !Number.isFinite(disposalValue) || disposalValue < 0) {
    throw new AssetLifecycleError("Os valores da baixa patrimonial são inválidos.");
  }
  const normalizedBookValue = roundCurrency(bookValue);
  const normalizedDisposalValue = roundCurrency(disposalValue);
  return {
    bookValue: normalizedBookValue,
    disposalValue: normalizedDisposalValue,
    gainLoss: roundCurrency(normalizedDisposalValue - normalizedBookValue),
  };
}

export function calculateAssetValueAdjustment(bookValue: number, type: AssetValueAdjustmentType, value: number) {
  if (!Number.isFinite(bookValue) || bookValue < 0 || !Number.isFinite(value)) {
    throw new AssetLifecycleError("Os valores do ajuste patrimonial são inválidos.");
  }
  const openingValue = roundCurrency(bookValue);
  const normalizedValue = roundCurrency(value);
  if (type === "SUBSEQUENT_COST") {
    if (normalizedValue <= 0) throw new AssetLifecycleError("O custo subsequente deve ser maior que zero.");
    return { openingValue, adjustmentValue: normalizedValue, closingValue: roundCurrency(openingValue + normalizedValue) };
  }
  if (normalizedValue < 0) throw new AssetLifecycleError("O valor contábil ajustado deve ser maior ou igual a zero.");
  if (type === "IMPAIRMENT" && normalizedValue >= openingValue) {
    throw new AssetLifecycleError("A perda por impairment deve reduzir o valor contábil do bem.");
  }
  if (type === "REVALUATION" && normalizedValue === openingValue) {
    throw new AssetLifecycleError("A reavaliação deve alterar o valor contábil do bem.");
  }
  return {
    openingValue,
    adjustmentValue: roundCurrency(normalizedValue - openingValue),
    closingValue: normalizedValue,
  };
}

function depreciationPeriod(acquisitionDate: Date, referenceMonth: Date) {
  return (referenceMonth.getUTCFullYear() - acquisitionDate.getUTCFullYear()) * 12
    + referenceMonth.getUTCMonth() - acquisitionDate.getUTCMonth() + 1;
}

export async function depreciateAssetsForMonth(db: PrismaClient, referenceDate: Date) {
  const referenceMonth = normalizeReferenceMonth(referenceDate);
  const assets = await db.asset.findMany({
    where: { status: { notIn: ["Baixado", "Inativo"] } },
    select: {
      id: true,
      acquisitionDate: true,
      acquisitionValue: true,
      currentValue: true,
      category: { select: { lifeSpan: true } },
    },
  });

  let processed = 0;
  let skipped = 0;
  for (const asset of assets) {
    const periodNumber = depreciationPeriod(asset.acquisitionDate, referenceMonth);
    const depreciation = calculateStraightLineDepreciation({
      acquisitionValue: asset.acquisitionValue,
      bookValue: asset.currentValue,
      lifeSpanMonths: asset.category.lifeSpan,
      periodNumber,
    });
    if (depreciation === 0) {
      skipped += 1;
      continue;
    }

    try {
      const created = await db.$transaction(async (tx) => {
        const existing = await tx.assetValueHistory.findUnique({
          where: { assetId_referenceMonth: { assetId: asset.id, referenceMonth } },
          select: { id: true },
        });
        if (existing) return false;

        const futureHistory = await tx.assetValueHistory.findFirst({
          where: { assetId: asset.id, referenceMonth: { gt: referenceMonth } },
          select: { id: true },
        });
        if (futureHistory) return false;

        const currentAsset = await tx.asset.findUniqueOrThrow({
          where: { id: asset.id },
          select: { currentValue: true, status: true },
        });
        if (currentAsset.status === "Baixado" || currentAsset.status === "Inativo") return false;

        // Recalculate over the remaining useful life so capitalized costs and
        // valuation changes are amortized prospectively, not retroactively.
        const remainingPeriods = asset.category.lifeSpan - periodNumber + 1;
        const actualDepreciation = remainingPeriods > 0
          ? roundCurrency(Math.min(currentAsset.currentValue, currentAsset.currentValue / remainingPeriods))
          : 0;
        if (actualDepreciation === 0) return false;
        const closingValue = roundCurrency(currentAsset.currentValue - actualDepreciation);

        await tx.assetValueHistory.create({
          data: {
            assetId: asset.id,
            referenceMonth,
            openingValue: currentAsset.currentValue,
            depreciation: actualDepreciation,
            closingValue,
            lifeSpanMonths: asset.category.lifeSpan,
          },
        });
        await tx.asset.update({ where: { id: asset.id }, data: { currentValue: closingValue } });
        return true;
      });
      if (created) processed += 1;
      else skipped += 1;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        skipped += 1;
        continue;
      }
      throw error;
    }
  }
  return { referenceMonth, processed, skipped };
}

export async function recordAssetValueAdjustment(db: PrismaClient, input: AssetValueAdjustmentInput) {
  if (!input.assetId.trim() || !input.justification.trim() || !input.evidence.trim()) {
    throw new AssetLifecycleError("Bem, justificativa e evidência são obrigatórios.");
  }
  if (!["REVALUATION", "IMPAIRMENT", "SUBSEQUENT_COST"].includes(input.type)) {
    throw new AssetLifecycleError("Tipo de ajuste patrimonial inválido.");
  }
  if (Number.isNaN(input.date.valueOf())) throw new AssetLifecycleError("Data do ajuste inválida.");

  return db.$transaction(async (tx) => {
    const asset = await tx.asset.findUnique({
      where: { id: input.assetId },
      select: { id: true, status: true, acquisitionDate: true, acquisitionValue: true, currentValue: true },
    });
    if (!asset) throw new AssetLifecycleError("Bem patrimonial não encontrado.");
    if (asset.status === "Baixado" || asset.status === "Inativo") throw new AssetLifecycleError("Não é possível ajustar um bem baixado ou inativo.");
    if (input.date < asset.acquisitionDate) throw new AssetLifecycleError("O ajuste não pode ser anterior à aquisição do bem.");
    const latestDepreciation = await tx.assetValueHistory.findFirst({
      where: { assetId: asset.id }, orderBy: { referenceMonth: "desc" }, select: { referenceMonth: true },
    });
    if (latestDepreciation && input.date <= latestDepreciation.referenceMonth) {
      throw new AssetLifecycleError("O ajuste deve ser posterior à última competência de depreciação processada.");
    }

    const calculation = calculateAssetValueAdjustment(asset.currentValue, input.type, input.value);
    const updated = await tx.asset.updateMany({
      where: { id: asset.id, currentValue: asset.currentValue, status: { notIn: ["Baixado", "Inativo"] } },
      data: {
        currentValue: calculation.closingValue,
        ...(input.type === "SUBSEQUENT_COST" ? { acquisitionValue: roundCurrency(asset.acquisitionValue + calculation.adjustmentValue) } : {}),
      },
    });
    if (updated.count !== 1) throw new AssetLifecycleError("O valor do bem foi alterado por outra operação. Revise e tente novamente.");
    return tx.assetValueAdjustment.create({
      data: {
        assetId: asset.id,
        type: input.type,
        date: input.date,
        ...calculation,
        justification: input.justification.trim(),
        evidence: input.evidence.trim(),
      },
    });
  });
}

async function postDisposalGainLossOrRecordPending(
  tx: Prisma.TransactionClient,
  writeOff: { id: string; date: Date; gainLoss: number },
  actor?: FinanceActor,
) {
  if (writeOff.gainLoss === 0) return { accountingTransactionId: null, pending: false };
  const eventCode = writeOff.gainLoss > 0 ? "ASSET_DISPOSAL_GAIN" : "ASSET_DISPOSAL_LOSS";
  const reason = !actor?.employeeId
    ? "A baixa não possui servidor responsável apto a postar o evento contábil."
    : undefined;
  const [year, event] = reason ? [null, null] : await Promise.all([
    tx.financialYear.findFirst({ where: { status: "Aberto", startDate: { lte: writeOff.date }, endDate: { gte: writeOff.date } }, select: { id: true } }),
    tx.accountingEventCatalog.findUnique({ where: { code: eventCode }, include: { rules: { where: { isActive: true }, select: { isReference: true } } } }),
  ]);
  const configurationReason = reason
    ?? (!year ? "Não há exercício financeiro aberto para a data da baixa."
      : !event?.isActive || event.rules.length !== 1 ? `O evento ${eventCode} deve possuir exatamente uma regra ativa.`
        : event.rules[0].isReference && process.env.CELERIFLOW_ACCOUNTING_MODE !== "POC" ? "A regra do evento é apenas de referência e não está homologada para este ambiente."
          : undefined);
  if (configurationReason) {
    await tx.assetIntegrationPendingConfiguration.create({ data: { assetWriteOffId: writeOff.id, expectedEventCode: eventCode, reason: configurationReason } });
    return { accountingTransactionId: null, pending: true };
  }

  try {
    const transaction = await postAccountingEventInTransaction(tx, actor!, {
      financialYearId: year!.id,
      date: writeOff.date,
      eventCode,
      value: Math.abs(writeOff.gainLoss),
      history: `Resultado de baixa patrimonial ${writeOff.id}`,
      sourceModule: "PATRIMONIO",
      sourceType: "ASSET_WRITE_OFF",
      sourceId: writeOff.id,
      idempotencyKey: `PATRIMONIO:ASSET_WRITE_OFF:${writeOff.id}:${eventCode}`,
    });
    await tx.assetWriteOff.update({ where: { id: writeOff.id }, data: { accountingTransactionId: transaction.id } });
    return { accountingTransactionId: transaction.id, pending: false };
  } catch (error) {
    if (!(error instanceof FinanceError)) throw error;
    await tx.assetIntegrationPendingConfiguration.create({ data: { assetWriteOffId: writeOff.id, expectedEventCode: eventCode, reason: error.message } });
    return { accountingTransactionId: null, pending: true };
  }
}

export async function recordAssetDisposal(db: PrismaClient, input: AssetDisposalInput) {
  if (!input.assetId.trim() || !input.reason.trim() || !input.justification.trim()) {
    throw new AssetLifecycleError("Bem, motivo e justificativa são obrigatórios.");
  }
  if (input.type !== "Baixa" && input.type !== "Alienação") {
    throw new AssetLifecycleError("Tipo de baixa patrimonial inválido.");
  }
  if (Number.isNaN(input.date.valueOf())) throw new AssetLifecycleError("Data da baixa inválida.");
  const disposalValue = roundCurrency(input.disposalValue ?? 0);
  if (!Number.isFinite(disposalValue) || disposalValue < 0) {
    throw new AssetLifecycleError("O valor de alienação deve ser maior ou igual a zero.");
  }
  if (input.type === "Baixa" && disposalValue !== 0) {
    throw new AssetLifecycleError("Baixa sem alienação não pode registrar valor recebido.");
  }

  return db.$transaction(async (tx) => {
    const asset = await tx.asset.findUnique({
      where: { id: input.assetId },
      select: { id: true, status: true, currentValue: true, name: true, maintenances: { where: { status: { in: ["Solicitada", "Em manutenção"] } }, select: { id: true }, take: 1 } },
    });
    if (!asset) throw new AssetLifecycleError("Bem patrimonial não encontrado.");
    if (asset.status === "Baixado" || asset.status === "Inativo") throw new AssetLifecycleError("Este bem está baixado ou inativo.");
    if (asset.maintenances.length) throw new AssetLifecycleError("Conclua as manutenções abertas antes da baixa patrimonial.");

    const existing = await tx.assetWriteOff.findFirst({ where: { assetId: asset.id }, select: { id: true } });
    if (existing) throw new AssetLifecycleError("Este bem já possui uma baixa registrada.");

    const calculation = calculateAssetDisposal(asset.currentValue, disposalValue);
    const writeOff = await tx.assetWriteOff.create({
      data: {
        assetId: asset.id,
        date: input.date,
        type: input.type,
        reason: input.reason.trim(),
        justification: input.justification.trim(),
        ...calculation,
      },
    });

    // Se for Alienação com valor recebido > 0, gera receita, tesouraria e contabilização automática
    let alienationRevenueId: string | null = null;
    let alienationTreasuryMovementId: string | null = null;

    if (input.type === "Alienação" && disposalValue > 0 && input.actor) {
      const [year, revenueNature, resourceSource, treasuryAccount] = await Promise.all([
        tx.financialYear.findFirst({
          where: { status: "Aberto", startDate: { lte: input.date }, endDate: { gte: input.date } },
        }),
        tx.revenueNature.findFirst(),
        tx.resourceSource.findFirst(),
        tx.bankAccount.findFirst({ where: { isActive: true } }),
      ]);

      if (year && revenueNature && resourceSource) {
        // Registro de Receita Arrecadada de Alienação de Bens (Patrimonial)
        const revenue = await tx.revenue.create({
          data: {
            financialYearId: year.id,
            revenueNatureId: revenueNature.id,
            resourceSourceId: resourceSource.id,
            classification: "ORCAMENTARIA",
            stage: "ARRECADADA",
            date: input.date,
            collectionDate: input.date,
            valueDecimal: new Prisma.Decimal(disposalValue),
            value: disposalValue,
            history: `Receita de alienação do bem patrimonial ${asset.name}`,
            sourceModule: "PATRIMONIO",
            sourceType: "ASSET_ALIENATION",
            sourceId: writeOff.id,
            eventType: "REVENUE_COLLECTED",
            idempotencyKey: `PATRIMONIO:ASSET_ALIENATION_REVENUE:${writeOff.id}`,
          },
        });
        alienationRevenueId = revenue.id;

        // Registro de Entrada em Tesouraria
        if (treasuryAccount) {
          const treasuryMovement = await tx.treasuryMovement.create({
            data: {
              type: "RECEITA",
              direction: "ENTRADA",
              date: input.date,
              valueDecimal: new Prisma.Decimal(disposalValue),
              bankAccountId: treasuryAccount.id,
              financialYearId: year.id,
              history: `Ingresso de receita de alienação do bem ${asset.name}`,
              sourceModule: "PATRIMONIO",
              sourceType: "ASSET_ALIENATION",
              sourceId: writeOff.id,
              eventType: "TREASURY_ENTRY",
              idempotencyKey: `PATRIMONIO:ASSET_ALIENATION_TREASURY:${writeOff.id}`,
            },
          });
          alienationTreasuryMovementId = treasuryMovement.id;
        }
      }
    }

    const integration = await postDisposalGainLossOrRecordPending(tx, writeOff, input.actor);
    await tx.asset.update({ where: { id: asset.id }, data: { status: "Baixado" } });
    return { ...writeOff, integration, alienationRevenueId, alienationTreasuryMovementId };
  });
}
