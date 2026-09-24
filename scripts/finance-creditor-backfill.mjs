import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";

config({ path: ".env.local" });
config();

const connectionString = process.env.DATABASE_URL?.trim();
if (!connectionString) throw new Error("DATABASE_URL nao configurada.");

neonConfig.webSocketConstructor = ws;
const prisma = new PrismaClient({ adapter: new PrismaNeon({ connectionString }) });

async function main() {
  const suppliers = await prisma.supplier.findMany({
    include: { person: true, company: true },
  });
  let created = 0;

  for (const supplier of suppliers) {
    const name = supplier.company?.corporateName ?? supplier.person?.fullName;
    const document = supplier.company?.cnpj ?? supplier.person?.cpf;
    if (!name) continue;

    const existing = await prisma.creditor.findFirst({
      where: {
        OR: [
          { supplierId: supplier.id },
          ...(supplier.personId ? [{ personId: supplier.personId }] : []),
          ...(supplier.companyId ? [{ companyId: supplier.companyId }] : []),
        ],
      },
    });
    if (existing) {
      await prisma.creditor.update({
        where: { id: existing.id },
        data: { supplierId: supplier.id, name, document, status: supplier.status },
      });
    } else {
      await prisma.creditor.create({
        data: {
          supplierId: supplier.id,
          name,
          document,
          status: supplier.status,
          personId: supplier.personId ?? undefined,
          companyId: supplier.companyId ?? undefined,
        },
      });
      created += 1;
    }
  }

  console.log(JSON.stringify({ suppliers: suppliers.length, created }, null, 2));
}

main()
  .finally(async () => prisma.$disconnect())
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
