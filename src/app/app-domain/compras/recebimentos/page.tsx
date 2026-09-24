import { getTenantContextForModule } from "@/lib/platform/tenant-context";
import { ReceiptForm } from "./ReceiptForm";
import { PackageCheck } from "lucide-react";
import { PageFrame } from "@/components/app-ui/PageFrame";
import { PageHeader } from "@/components/app-ui/PageHeader";

export default async function RecebimentosPage() {
  const { prisma } = await getTenantContextForModule("COMPRAS");
  const [contracts, documents, employees, warehouses, receipts] = await Promise.all([
    prisma.contract.findMany({
      where: { status: "Vigente" },
      select: { id: true, number: true, process: { select: { items: { select: { id: true, quantity: true, estimatedUnitValue: true, material: { select: { id: true, name: true, type: true } } } } } } },
      orderBy: { number: "asc" },
    }),
    prisma.document.findMany({ where: { status: "Válido", documentType: { not: "Modelo" } }, select: { id: true, title: true }, orderBy: { createdAt: "desc" }, take: 100 }),
    prisma.employee.findMany({ where: { isActive: true }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.warehouse.findMany({ where: { isActive: true }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.purchaseReceipt.findMany({ include: { contract: { select: { number: true } }, items: { include: { material: { select: { name: true } } } } }, orderBy: { receivedAt: "desc" }, take: 30 }),
  ]);

  return <PageFrame className="space-y-2"><PageHeader title="Recebimentos de Compra" icon={<PackageCheck className="size-4 shrink-0 text-emerald-600" />} /><p className="text-xs text-muted-foreground">O recebimento aprovado gera entrada rastreável no almoxarifado e a AL de Compras; não cria liquidação financeira ou pagamento.</p><div className="rounded-md border bg-white p-3"><ReceiptForm contracts={contracts} documents={documents} employees={employees} warehouses={warehouses} /></div><section className="rounded-md border bg-white p-3"><h2 className="mb-3 text-sm font-semibold">Recebimentos recentes</h2><div className="space-y-2">{receipts.length ? receipts.map((receipt) => <div key={receipt.id} className="flex flex-wrap justify-between gap-2 rounded border p-3 text-sm"><span className="font-medium">{receipt.number} · {receipt.contract.number}</span><span>{receipt.items.map((item) => `${item.material.name} (${item.quantity})`).join(", ")}</span><span>{receipt.status}</span></div>) : <p className="text-sm text-muted-foreground">Nenhum recebimento registrado.</p>}</div></section></PageFrame>;
}
