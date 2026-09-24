import type { FleetArea } from "@/lib/frotas/contract";

export type FleetNavigationGroup = {
  title: string;
  items: { area: FleetArea; title: string }[];
};

export const fleetNavigationGroups: FleetNavigationGroup[] = [
  {
    title: "Frota",
    items: [{ area: "frota", title: "Cadastro da frota" }],
  },
  {
    title: "Operação",
    items: [
      { area: "utilizacao", title: "Utilização" },
      { area: "rotas", title: "Rotas" },
    ],
  },
  {
    title: "Manutenção",
    items: [
      { area: "planos", title: "Planos de manutenção" },
      { area: "ordens", title: "Ordens de serviço" },
      { area: "manutencoes", title: "Manutenções efetuadas" },
    ],
  },
  {
    title: "Custos e documentos",
    items: [
      { area: "consumos", title: "Abastecimentos e lubrificantes" },
      { area: "gastos", title: "Gastos realizados" },
      { area: "seguros", title: "Seguros" },
      { area: "obrigacoes", title: "Obrigações" },
      { area: "documentos", title: "Documentos e vencimentos" },
      { area: "ocorrencias", title: "Ocorrências" },
    ],
  },
  {
    title: "Análises",
    items: [{ area: "relatorios", title: "Emissões e relatórios" }],
  },
];

export const fleetAreaTitle = Object.fromEntries(
  fleetNavigationGroups.flatMap((group) => group.items.map((item) => [item.area, item.title])),
) as Record<FleetArea, string>;
