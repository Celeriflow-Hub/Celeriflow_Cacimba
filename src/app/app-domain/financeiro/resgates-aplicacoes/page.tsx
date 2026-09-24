import ResgatesAplicacoesClient from "./ResgatesAplicacoesClient";
import { getBankStatementItemsAction } from "./resgates-actions";

export default async function ResgatesAplicacoesPage() {
  const itemsRes = await getBankStatementItemsAction();
  const items = itemsRes.data || [];

  return <ResgatesAplicacoesClient initialItems={JSON.parse(JSON.stringify(items))} />;
}
