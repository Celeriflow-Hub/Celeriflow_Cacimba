import Link from "next/link";
import { LockKeyhole } from "lucide-react";
import { getCurrentTenantContext } from "@/lib/platform/tenant-context";
import { isBiddingBidSubmissionOpen, isBiddingParticipantEligible } from "@/lib/compras/bidding-workflow";
import { SupplierBiddingPortal } from "./SupplierBiddingPortal";

export const dynamic = "force-dynamic";

function supplierName(supplier: {
  company: { corporateName: string; tradeName: string | null } | null;
  person: { fullName: string } | null;
}) {
  return supplier.company?.tradeName || supplier.company?.corporateName || supplier.person?.fullName || "Fornecedor";
}

function PortalUnavailable() {
  return <main className="mx-auto flex min-h-[calc(100dvh-5rem)] w-full max-w-xl items-center px-4 py-8"><section className="w-full rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm"><div className="mx-auto flex size-11 items-center justify-center rounded-full bg-amber-50 text-amber-800"><LockKeyhole className="size-5" /></div><h1 className="mt-4 text-lg font-semibold text-slate-900">Acesso indisponível</h1><p className="mt-2 text-sm leading-6 text-slate-600">Sua conta não possui uma identidade ativa para esta participação ou o certame não está disponível.</p><Link href="/compras/licitacoes/portal" className="mt-5 inline-flex min-h-11 items-center justify-center rounded-md border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50">Minhas participações</Link></section></main>;
}

async function loadSupplierPortal(participantId: string) {
  try {
    const context = await getCurrentTenantContext();
    const participant = await context.prisma.biddingParticipant.findFirst({
      where: {
        id: participantId,
        supplier: {
          is: {
            status: "Ativo",
            supplierPortalIdentities: { some: { usuarioId: context.user.id, status: "Ativo" } },
          },
        },
      },
      include: {
        supplier: {
          select: {
            company: { select: { corporateName: true, tradeName: true } },
            person: { select: { fullName: true } },
          },
        },
        bidding: {
          include: {
            process: { select: { number: true, object: true } },
            biddingLots: {
              orderBy: { number: "asc" },
              include: {
                items: {
                  include: {
                    purchaseProcessItem: {
                      include: {
                        catalogItem: { select: { name: true, unit: true } },
                        material: { select: { name: true, unitOfMeasure: true } },
                      },
                    },
                  },
                },
                eligibilityDecisions: {
                  where: { participantId },
                  orderBy: [{ decidedAt: "desc" }, { createdAt: "desc" }],
                  take: 1,
                },
                bids: {
                  where: { participantId },
                  orderBy: { sequence: "desc" },
                  select: { id: true, sequence: true, totalValueDecimal: true, status: true, submittedAt: true },
                },
              },
            },
          },
        },
      },
    });
    if (!participant) return null;

    const now = new Date();
    return {
      participantId: participant.id,
      supplierName: supplierName(participant.supplier),
      participantLabel: participant.displayCode || supplierName(participant.supplier),
      bidding: {
        number: participant.bidding.number,
        modality: participant.bidding.modality,
        status: participant.bidding.status,
        deadline: participant.bidding.sessionDate?.toISOString() ?? null,
        processNumber: participant.bidding.process.number,
        object: participant.bidding.process.object,
      },
      lots: participant.bidding.biddingLots.map((lot) => {
        const eligibility = lot.eligibilityDecisions[0] ?? null;
        return {
          id: lot.id,
          number: lot.number,
          description: lot.description,
          status: lot.status,
          estimatedValue: lot.estimatedValueDecimal?.toString() ?? null,
          eligibility: eligibility ? { status: eligibility.status, reason: eligibility.reason } : null,
          canSubmit: isBiddingBidSubmissionOpen({
            biddingStatus: participant.bidding.status,
            lotStatus: lot.status,
            deadline: participant.bidding.sessionDate,
            now,
          }) && isBiddingParticipantEligible(eligibility?.status),
          items: lot.items.map((item) => ({
            id: item.purchaseProcessItemId,
            label: item.purchaseProcessItem.catalogItem?.name || item.purchaseProcessItem.material?.name || item.purchaseProcessItem.customName || "Item sem descrição",
            quantity: item.quantity,
            unit: item.purchaseProcessItem.catalogItem?.unit || item.purchaseProcessItem.material?.unitOfMeasure || "UN",
          })),
          bids: lot.bids.map((bid) => ({
            id: bid.id,
            sequence: bid.sequence,
            totalValue: bid.totalValueDecimal.toString(),
            status: bid.status,
            submittedAt: bid.submittedAt.toISOString(),
          })),
        };
      }),
    };
  } catch {
    return null;
  }
}

export default async function SupplierBiddingPortalPage({ params }: { params: Promise<{ participantId: string }> }) {
  const { participantId } = await params;
  const portal = await loadSupplierPortal(participantId);
  if (!portal) return <PortalUnavailable />;
  return <SupplierBiddingPortal {...portal} />;
}
