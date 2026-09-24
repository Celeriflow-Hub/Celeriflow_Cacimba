import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { findPublicNoticeValidation } from "@/lib/transparencia/public-notices";

export const dynamic = "force-dynamic";

export default async function PublicNoticeValidationPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  if (!/^CFN-[A-Z0-9]{20}$/.test(code)) notFound();
  const notice = await findPublicNoticeValidation(prisma, code);
  if (!notice) notFound();

  return (
    <main className="mx-auto max-w-xl p-6 sm:p-10">
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold text-emerald-700">Validação de aviso público</p>
        <h1 className="mt-2 text-xl font-bold text-slate-900">{notice.title}</h1>
        <dl className="mt-6 space-y-3 text-sm text-slate-700">
          <div><dt className="font-semibold">Categoria</dt><dd>{notice.category}</dd></div>
          <div><dt className="font-semibold">Data de publicação</dt><dd>{new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(notice.publishedAt)}</dd></div>
        </dl>
      </section>
    </main>
  );
}
