import { Trophy } from "lucide-react";
import { getTenantContextForModule } from "@/lib/platform/tenant-context";
import AtividadesEsporteLazerClient from "../components/AtividadesEsporteLazerClient";
import { PageFrame } from "@/components/app-ui/PageFrame";
import { PageHeader } from "@/components/app-ui/PageHeader";

export const dynamic = "force-dynamic";

export default async function EsporteLazerPage() {
  const { prisma } = await getTenantContextForModule("CULTURA");
  const activities = await prisma.culturaAtividade.findMany({
    include: {
      space: {
        include: {
          asset: {
            include: {
              realEstate: true,
            },
          },
          realEstate: true,
        },
      },
      instructorEmployee: true,
      agent: {
        include: {
          person: true,
          company: true,
        },
      },
    },
    orderBy: [{ active: "desc" }, { startsAt: "desc" }],
  });

  const activeActivities = activities.filter((activity) => activity.active);
  const activeModalities = new Set(
    activeActivities.map((activity) => activity.modalidade.trim().toLocaleLowerCase("pt-BR")),
  );
  const usedSpaces = new Set(
    activeActivities.flatMap((activity) => (activity.space ? [activity.space.id] : [])),
  );

  const serializedActivities = activities.map((activity) => ({
    id: activity.id,
    nome: activity.nome,
    modalidade: activity.modalidade,
    publicoAlvo: activity.publicoAlvo,
    startsAt: activity.startsAt.toISOString(),
    endsAt: activity.endsAt?.toISOString() ?? null,
    status: activity.status,
    active: activity.active,
    space: activity.space
      ? {
          nome: activity.space.nome,
          tipo: activity.space.tipo,
          asset: activity.space.asset
            ? {
                nome: activity.space.asset.name,
                patrimonio: activity.space.asset.patrimonyNumber,
                realEstate: activity.space.asset.realEstate
                  ? {
                      inscricao: activity.space.asset.realEstate.municipalInsc,
                      endereco: [
                        activity.space.asset.realEstate.streetName,
                        activity.space.asset.realEstate.number,
                      ]
                        .filter(Boolean)
                        .join(", "),
                    }
                  : null,
              }
            : null,
          realEstate: activity.space.realEstate
            ? {
                inscricao: activity.space.realEstate.municipalInsc,
                endereco: [activity.space.realEstate.streetName, activity.space.realEstate.number]
                  .filter(Boolean)
                  .join(", "),
              }
            : null,
        }
      : null,
    instructorName: activity.instructorEmployee?.name ?? null,
    agentName:
      activity.agent?.person?.socialName ??
      activity.agent?.person?.fullName ??
      activity.agent?.company?.tradeName ??
      activity.agent?.company?.corporateName ??
      activity.agent?.nome ??
      null,
  }));

  return (
    <PageFrame className="flex h-full min-h-0 flex-col gap-2 overflow-hidden p-2 sm:p-3">
      <PageHeader title="Esporte e Lazer" icon={<Trophy className="size-4 shrink-0 text-rose-600 dark:text-rose-300" />} className="dark:border-slate-700 dark:bg-slate-800 dark:[&>h1]:text-white" />
      <p className="shrink-0 text-xs text-slate-500">Atividades: {activities.length} · Ativas: {activeActivities.length} · Modalidades: {activeModalities.size} · Espaços: {usedSpaces.size}</p>

      <AtividadesEsporteLazerClient activities={serializedActivities} />
    </PageFrame>
  );
}
