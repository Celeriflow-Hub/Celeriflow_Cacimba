"use client";

import { ModuleShell, type ModuleIconName, type ModuleNavGroup } from "@/components/app-ui/erp/ModuleShell";
import { fleetNavigationGroups } from "./navigation";

const areaIcons: Record<string, ModuleIconName> = {
  frota: "truck",
  utilizacao: "route",
  rotas: "map",
  planos: "calendarClock",
  ordens: "clipboardList",
  manutencoes: "wrench",
  consumos: "fuel",
  gastos: "receiptText",
  seguros: "shieldCheck",
  obrigacoes: "fileCheck2",
  documentos: "fileText",
  ocorrencias: "clipboardList",
  relatorios: "barChart3",
};

const navigation: ModuleNavGroup[] = fleetNavigationGroups.map((group) => ({
  title: group.title,
  items: group.items.map((item) => ({
    title: item.title,
    href: `/frotas?area=${item.area}`,
    icon: areaIcons[item.area],
    query: {
      key: "area",
      values: item.area === "frota" ? ["", "frota"] : [item.area],
    },
  })),
}));

export default function FrotasLayout({ children }: { children: React.ReactNode }) {
  return (
    <ModuleShell
      moduleTitle="Frotas"
      moduleCaption="Gestão operacional"
      moduleIcon="truck"
      navigation={navigation}
    >
      {children}
    </ModuleShell>
  );
}
