import { Truck, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { getTenantContextForModuleOperation } from "@/lib/platform/tenant-context";
import { PageFrame } from "@/components/app-ui/PageFrame";
import { PageHeader } from "@/components/app-ui/PageHeader";
import { createSupplier } from "../../actions";
import NovoFornecedorForm from "./NovoFornecedorForm";

export default async function NovoFornecedorPage() {
  const { prisma } = await getTenantContextForModuleOperation("CADASTROS", "create");
  const persons = await prisma.person.findMany({
    select: { id: true, fullName: true, cpf: true },
    orderBy: { fullName: "asc" },
  });
  const companies = await prisma.company.findMany({
    select: { id: true, corporateName: true, cnpj: true, companyType: true, primaryCnae: true, secondaryCnaes: true },
    orderBy: { corporateName: "asc" },
  });

  return (
    <PageFrame className="flex h-[calc(100vh-4rem)] max-w-4xl min-h-0 flex-col gap-2 overflow-hidden">
      <PageHeader title="Novo Fornecedor" className="mb-0 shrink-0" icon={<Truck className="size-4 shrink-0 text-fuchsia-600" />} action={<Link href="/cadastros/fornecedores" className="inline-flex min-h-9 items-center gap-1.5 rounded border border-slate-300 bg-white px-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 sm:h-7 sm:min-h-0"><ArrowLeft className="size-3.5" />Voltar</Link>} />
      <NovoFornecedorForm persons={persons} companies={companies} action={createSupplier} />
    </PageFrame>
  );
}
