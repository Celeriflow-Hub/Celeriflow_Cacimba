import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getTenantContextForModule } from "@/lib/platform/tenant-context";
import Link from "next/link";
import { notFound } from "next/navigation";
import { InventoryCountClient } from "../InventoryCountClient";
import { PageFrame } from "@/components/app-ui/PageFrame";
import { PageHeader } from "@/components/app-ui/PageHeader";

export default async function InventarioDetalhePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { prisma } = await getTenantContextForModule("PATRIMONIO");
  const session = await prisma.inventorySession.findUnique({
    where: { id },
    include: {
      warehouse: { select: { name: true } },
      createdByUsuario: { select: { nome: true } },
      approvedByUsuario: { select: { nome: true } },
      items: { orderBy: { stock: { material: { name: "asc" } } }, include: { stock: { include: { material: { select: { code: true, name: true, unitOfMeasure: true } } } } } },
    },
  });
  if (!session) notFound();

  const divergenceCount = session.items.filter((item) => item.countedQuantity !== null && item.countedQuantity !== item.expectedQuantity).length;
  return (
    <PageFrame className="space-y-2"><PageHeader title="Relatório de Inventário" action={<Link href="/patrimonio/inventarios" className="text-xs font-semibold text-slate-600 underline">Voltar à listagem</Link>} /><p className="text-xs text-muted-foreground">{session.warehouse.name} · iniciado em {session.startedAt.toLocaleString("pt-BR")}</p><Card className="rounded-md"><CardHeader className="border-b p-3"><CardTitle className="text-sm">Rastreabilidade</CardTitle><CardDescription className="text-xs">Situação: {session.status}. Responsável pela abertura: {session.createdByUsuario.nome}. Itens com ajuste: {divergenceCount}.</CardDescription></CardHeader><CardContent className="grid gap-2 p-3 text-sm md:grid-cols-2"><p>Bloqueio de movimentos: {session.lockMovements ? "ativo" : "liberado"}</p><p>Enviado para aprovação: {session.submittedAt?.toLocaleString("pt-BR") ?? "não enviado"}</p><p>Aprovado por: {session.approvedByUsuario?.nome ?? "pendente"}</p><p>Evidência da aprovação: {session.approvalEvidence ?? "pendente"}</p></CardContent></Card><Card className="rounded-md"><CardHeader className="border-b p-3"><CardTitle className="text-sm">Contagem e divergências</CardTitle><CardDescription className="text-xs">O relatório preserva o saldo esperado, a contagem informada, justificativas e a evidência da aprovação.</CardDescription></CardHeader><CardContent className="p-3"><InventoryCountClient sessionId={session.id} status={session.status} items={session.items} /></CardContent></Card></PageFrame>
  );
}
