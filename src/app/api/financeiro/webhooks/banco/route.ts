import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { isPocVirtualBank } from "@/lib/poc/poc-config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Webhook para recepção de notificações de repasses e receitas externas enviadas pelo Simulador Bancário
 */
export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    const secretKey = process.env.SIMULADOR_WEBHOOK_SECRET;
    if (!secretKey) {
      return NextResponse.json({ error: "Webhook bancário não configurado." }, { status: 503 });
    }

    if (authHeader !== `Bearer ${secretKey}`) {
      return NextResponse.json({ error: "Não autorizado: Token de Webhook inválido." }, { status: 401 });
    }

    const payload = await req.json();

    const {
      siglaReceita,
      nomeReceita,
      valor,
      banco,
      agencia,
      contaNumero,
      autenticacaoBancaria,
      dataCredito,
    } = payload;

    if (!siglaReceita || !autenticacaoBancaria || !contaNumero || !agencia || !banco || !Number.isFinite(Number(valor)) || Number(valor) <= 0) {
      return NextResponse.json({ error: "Payload do webhook incompleto." }, { status: 400 });
    }
    if (!isPocVirtualBank(banco)) {
      return NextResponse.json({ error: "A POC aceita webhooks somente do Banco Virtual Robonuvem." }, { status: 422 });
    }

    const [account, technicalUser] = await Promise.all([
      prisma.bankAccount.findFirst({ where: { bankName: banco, agency: agencia, accountNumber: contaNumero, isActive: true, budgetUnitId: { not: null } }, select: { id: true, budgetUnitId: true } }),
      prisma.usuario.findFirst({ where: { ativo: true }, orderBy: { createdAt: "asc" }, select: { id: true } }),
    ]);
    if (!account) return NextResponse.json({ error: "Conta bancária do webhook não cadastrada, ativa e vinculada a uma Unidade Gestora." }, { status: 422 });
    if (!technicalUser) return NextResponse.json({ error: "Usuário técnico de auditoria não provisionado." }, { status: 503 });

    const item = await prisma.$transaction(async (tx) => {
      const existing = await tx.bankStatementItem.findFirst({
        where: { banco, agencia, contaNumero, codigoTransacao: autenticacaoBancaria },
      });
      if (existing) return existing;
      const created = await tx.bankStatementItem.create({
        data: {
          banco,
          agencia,
          contaNumero,
          tipoConta: "CORRENTE",
          date: dataCredito ? new Date(dataCredito) : new Date(),
          description: `${siglaReceita} - ${nomeReceita || "REPASSE EXTERNO CONSTITUCIONAL"}`,
          reference: autenticacaoBancaria,
          codigoTransacao: autenticacaoBancaria,
          sinal: "CREDITO",
          direction: "CREDIT",
          valueDecimal: new Prisma.Decimal(valor),
          status: "Pendente",
          categoriaClassificada: "RECEITA_CONSTITUCIONAL",
        },
      });
      await tx.financialAuditLog.create({
        data: {
          action: "WEBHOOK_RECEITA_EXTERNA_RECEBIDA",
          entityType: "BankStatementItem",
          entityId: created.id,
          authorUsuarioId: technicalUser.id,
          budgetUnitId: account.budgetUnitId,
          payload: { siglaReceita, valor, autenticacaoBancaria, bankAccountId: account.id },
        },
      });
      await tx.exceptionQueueItem.create({
        data: {
          statementItemId: created.id,
          descricao: created.description || siglaReceita,
          valorDecimal: new Prisma.Decimal(valor),
          dataMovimento: created.date,
          banco,
          contaNumero,
          sinal: "CREDITO",
          scoreConfianca: 0.98,
          sugestaoTipo: siglaReceita,
          motivoExcecao: "Receita externa aguardando confirmação do operador financeiro.",
        },
      });
      return created;
    });

    return NextResponse.json({
      success: true,
      message: `Receita ${siglaReceita} no valor de R$ ${valor} registrada via Webhook com sucesso.`,
      statementItemId: item.id,
    });
  } catch (err: unknown) {
    console.error("[Webhook Banco Error]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erro ao processar webhook bancário." }, { status: 500 });
  }
}
