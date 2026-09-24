import dotenv from "dotenv";

dotenv.config();
dotenv.config({ path: ".env.local", override: true });

async function main() {
  const { prisma } = await import("../src/lib/prisma");
  try {
    const accounts = await prisma.bankAccount.findMany({
      where: { bankName: "001 - Banco Virtual Robonuvem", isActive: true },
      select: { id: true, bankName: true, agency: true, accountNumber: true },
    });
    let updated = 0;
    for (const account of accounts) {
      const result = await prisma.bankStatementItem.updateMany({
        where: {
          bankAccountId: null,
          banco: account.bankName,
          agencia: account.agency,
          contaNumero: account.accountNumber,
        },
        data: { bankAccountId: account.id },
      });
      updated += result.count;
    }
    console.log({ updated, accounts: accounts.length });
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
