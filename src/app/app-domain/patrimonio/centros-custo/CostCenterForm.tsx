import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PageFrame } from "@/components/app-ui/PageFrame";
import { PageHeader } from "@/components/app-ui/PageHeader";

export function CostCenterForm({ title, submitLabel, action, initial }: {
  title: string;
  submitLabel: string;
  action: (formData: FormData) => void | Promise<void>;
  initial?: { code: string; name: string; description: string | null };
}) {
  return (
    <PageFrame className="max-w-3xl space-y-2">
      <PageHeader title={title} action={<Link href="/patrimonio/centros-custo"><Button size="sm" variant="outline">Cancelar</Button></Link>} />
      <form action={action} className="grid gap-3 rounded-md border bg-white p-4 md:grid-cols-2">
        <label className="grid gap-1 text-sm font-medium">Código<input name="code" required maxLength={60} defaultValue={initial?.code || ""} className="h-9 rounded-md border bg-background px-3 text-sm" placeholder="Ex.: CC-ADM-001" /></label>
        <label className="grid gap-1 text-sm font-medium">Nome<input name="name" required maxLength={180} defaultValue={initial?.name || ""} className="h-9 rounded-md border bg-background px-3 text-sm" placeholder="Ex.: Administração" /></label>
        <label className="grid gap-1 text-sm font-medium md:col-span-2">Descrição<textarea name="description" rows={5} defaultValue={initial?.description || ""} className="rounded-md border bg-background px-3 py-2 text-sm" placeholder="Finalidade e unidade responsável." /></label>
        <div className="flex justify-end gap-2 border-t pt-3 md:col-span-2"><Link href="/patrimonio/centros-custo"><Button type="button" variant="outline">Cancelar</Button></Link><Button type="submit">{submitLabel}</Button></div>
      </form>
    </PageFrame>
  );
}
