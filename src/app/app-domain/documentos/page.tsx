import { Folder, FileText, FileSignature, UploadCloud } from "lucide-react";
import Link from "next/link";
import { PageFrame } from "@/components/app-ui/PageFrame";
import { PageHeader } from "@/components/app-ui/PageHeader";
import { getTenantContextForModule } from "@/lib/platform/tenant-context";

export const dynamic = "force-dynamic";

export default async function DocumentosDashboardPage() {
  const { prisma } = await getTenantContextForModule("DOCUMENTOS");
  const totalDocuments = await prisma.document.count({
    where: { documentType: { not: 'Modelo' } }
  });
  const totalFolders = await prisma.folder.count();
  const pendentesAssinatura = await prisma.document.count({
    where: { status: 'Pendente Assinatura' }
  });

  const stats = [
    { title: "Total de Documentos", value: totalDocuments.toString(), icon: FileText, href: "/documentos/ged", color: "text-indigo-600", bg: "bg-indigo-100" },
    { title: "Pastas Criadas", value: totalFolders.toString(), icon: Folder, href: "/documentos/ged", color: "text-emerald-600", bg: "bg-emerald-100" },
    { title: "Assinaturas Pendentes", value: pendentesAssinatura.toString(), icon: FileSignature, href: "/documentos/assinaturas", color: "text-amber-600", bg: "bg-amber-100" },
  ];

  return (
    <PageFrame className="space-y-2">
      <PageHeader title="Documentos e GED" icon={<Folder className="size-4 shrink-0 text-indigo-600" />} />

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <Link key={stat.title} href={stat.href} className="block group">
            <div className="flex items-center justify-between rounded-md border border-slate-200 bg-white p-3 shadow-sm transition-colors hover:border-slate-300 hover:shadow-md">
              <div>
                <p className="text-sm font-medium text-slate-500">{stat.title}</p>
                <p className="mt-0.5 text-2xl font-bold text-slate-900">{stat.value}</p>
              </div>
              <div className={`flex size-9 items-center justify-center rounded-md ${stat.bg} ${stat.color} transition-transform duration-200 group-hover:scale-105`}>
                <stat.icon className="size-5" strokeWidth={2.5} />
              </div>
            </div>
          </Link>
        ))}
      </div>
      
      <div className="rounded-md border border-indigo-100 bg-indigo-50 p-4 text-center">
        <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full border border-indigo-200 bg-white shadow-sm">
          <UploadCloud className="size-6 text-indigo-500" />
        </div>
        <h2 className="text-base font-bold text-indigo-900">Armazenamento em Nuvem</h2>
        <p className="mx-auto mt-1 max-w-lg text-sm text-indigo-700">
          O CeleriFlow armazena os arquivos de forma segura, mantendo rastreabilidade e versionamento para auditorias e acessos rápidos.
        </p>
        <Link href="/documentos/ged" className="mt-3 inline-flex h-8 items-center rounded-md bg-indigo-600 px-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700">
          Acessar o GED
        </Link>
      </div>
    </PageFrame>
  );
}
