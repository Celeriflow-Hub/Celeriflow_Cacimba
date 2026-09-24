import { getTenantContextForModule } from "@/lib/platform/tenant-context";
import { canManagePurchaseRequest } from "@/lib/compras/purchase-request-policy";
import { SolicitacoesListClient } from "./SolicitacoesListClient";

export default async function SolicitacoesPage() {
  const { prisma, user } = await getTenantContextForModule("COMPRAS");
  const solicitacoes = await prisma.purchaseRequest.findMany({
    include: {
      secretariat: true,
      department: true,
      requester: true,
      _count: { select: { items: true } },
    },
    orderBy: { createdAt: "desc" },
  }).catch(() => []);

  return <SolicitacoesListClient requests={solicitacoes.map((request) => ({
    id: request.id,
    number: request.number,
    object: request.object,
    status: request.status,
    priority: request.priority,
    estimatedValue: request.estimatedValue,
    createdAt: request.createdAt.toISOString(),
    secretariatName: request.secretariat.acronym || request.secretariat.name,
    departmentName: request.department.name,
    requesterName: request.requester.name,
    itemCount: request._count.items,
    canManage: canManagePurchaseRequest(user, request),
  }))} />;
}
