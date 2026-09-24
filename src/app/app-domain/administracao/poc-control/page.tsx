import { getPocDataMetricsAction } from "./actions";
import PocControlClient from "./PocControlClient";
import { Database } from "lucide-react";
import { PageFrame } from "@/components/app-ui/PageFrame";
import { PageHeader } from "@/components/app-ui/PageHeader";

export const dynamic = "force-dynamic";

export default async function PocControlPage() {
  const { counts = {} } = await getPocDataMetricsAction();

  return (
    <PageFrame className="space-y-2">
      <PageHeader title="Controle POC" icon={<Database className="size-4 shrink-0 text-indigo-600" />} />
      <PocControlClient initialCounts={counts} />
    </PageFrame>
  );
}
