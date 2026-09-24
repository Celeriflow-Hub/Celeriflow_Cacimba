import DownloadExtratosClient from "./DownloadExtratosClient";
import { getDownloadHistoryAction } from "./extratos-actions";

export default async function DownloadExtratosPage() {
  const historyRes = await getDownloadHistoryAction();
  const history = historyRes.data || [];

  return <DownloadExtratosClient initialHistory={JSON.parse(JSON.stringify(history))} />;
}
