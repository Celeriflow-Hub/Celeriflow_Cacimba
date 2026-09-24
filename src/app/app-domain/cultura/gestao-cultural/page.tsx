import { Palette } from "lucide-react";
import { getTenantContextForModule } from "@/lib/platform/tenant-context";
import { GestaoCulturalClient, type CulturalRecord } from "../components/GestaoCulturalClient";
import { PageFrame } from "@/components/app-ui/PageFrame";
import { PageHeader } from "@/components/app-ui/PageHeader";

function assetReference(asset: { patrimonyNumber: string; name: string } | null) {
  return asset ? `${asset.patrimonyNumber} - ${asset.name}` : "Sem vínculo no Patrimônio";
}

function realEstateReference(realEstate: { municipalInsc: string | null; registration: string | null; streetName: string | null; number: string | null } | null) {
  if (!realEstate) return "Sem vínculo no Cadastro Imobiliário";

  const identification = realEstate.municipalInsc
    ? `Inscrição ${realEstate.municipalInsc}`
    : realEstate.registration
      ? `Matrícula ${realEstate.registration}`
      : "Imóvel sem inscrição informada";
  const address = [realEstate.streetName, realEstate.number].filter(Boolean).join(", ");

  return address ? `${identification} - ${address}` : identification;
}

export default async function GestaoCulturalPage() {
  const { prisma } = await getTenantContextForModule("CULTURA");
  const [agents, spaces, heritages] = await Promise.all([
    prisma.culturaAgente.findMany({
      include: { person: true, company: true },
      orderBy: { nome: "asc" },
    }),
    prisma.culturaEspaco.findMany({
      include: { asset: true, realEstate: true, responsibleEmployee: true },
      orderBy: { nome: "asc" },
    }),
    prisma.culturaPatrimonio.findMany({
      include: { asset: true, realEstate: true },
      orderBy: { nome: "asc" },
    }),
  ]);

  const records: CulturalRecord[] = [
    ...agents.map((agent) => ({
      id: agent.id,
      kind: "Agente" as const,
      name: agent.nome,
      classification: `${agent.tipo} / ${agent.segmento}`,
      status: agent.status,
      active: agent.active,
      references: [
        {
          label: "Cadastro Geral",
          value: agent.person
            ? `Pessoa Física: ${agent.person.fullName}${agent.person.cpf ? ` - CPF ${agent.person.cpf}` : ""}`
            : agent.company
              ? `Pessoa Jurídica: ${agent.company.corporateName}${agent.company.cnpj ? ` - CNPJ ${agent.company.cnpj}` : ""}`
              : "Sem vínculo no Cadastro Geral",
        },
      ],
    })),
    ...spaces.map((space) => ({
      id: space.id,
      kind: "Espaço" as const,
      name: space.nome,
      classification: space.tipo,
      status: space.status,
      active: space.active,
      references: [
        { label: "Patrimônio", value: assetReference(space.asset) },
        { label: "Cadastro Imobiliário", value: realEstateReference(space.realEstate) },
        {
          label: "RH",
          value: space.responsibleEmployee
            ? `${space.responsibleEmployee.name}${space.responsibleEmployee.registration ? ` - Matrícula ${space.responsibleEmployee.registration}` : ""}`
            : "Sem responsável vinculado no RH",
        },
      ],
    })),
    ...heritages.map((heritage) => ({
      id: heritage.id,
      kind: "Patrimônio" as const,
      name: heritage.nome,
      classification: [heritage.tipo, heritage.relevanciaCultural].filter(Boolean).join(" / "),
      status: heritage.status,
      active: heritage.active,
      references: [
        { label: "Patrimônio", value: assetReference(heritage.asset) },
        { label: "Cadastro Imobiliário", value: realEstateReference(heritage.realEstate) },
      ],
    })),
  ];

  const generalRegistryLinks = agents.filter((agent) => agent.personId || agent.companyId).length;
  const patrimonyLinks = [...spaces, ...heritages].filter((item) => item.assetId || item.realEstateId).length;
  const humanResourcesLinks = spaces.filter((space) => space.responsibleEmployeeId).length;

  return (
    <PageFrame className="flex h-full min-h-0 flex-col gap-2 overflow-hidden p-2 sm:p-3">
      <PageHeader title="Gestão Cultural" icon={<Palette className="size-4 shrink-0 text-pink-600" />} className="dark:border-slate-700 dark:bg-slate-800 dark:[&>h1]:text-white" />
      <p className="shrink-0 text-xs text-slate-500">Consulta integrada · Cadastro Geral: {generalRegistryLinks} · Patrimônio: {patrimonyLinks} · RH: {humanResourcesLinks}</p>

      <GestaoCulturalClient records={records} />
    </PageFrame>
  );
}
