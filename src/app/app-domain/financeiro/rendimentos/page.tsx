import RendimentosClient from "./RendimentosClient";
import { getYieldHistoryAction } from "./rendimentos-actions";

export default async function RendimentosPage() {
  const historyRes = await getYieldHistoryAction();
  const history = historyRes.data || [];

  return <RendimentosClient initialHistory={JSON.parse(JSON.stringify(history))} />;
}
