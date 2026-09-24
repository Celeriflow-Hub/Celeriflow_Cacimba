import { getActiveReconciliationSessionsAction } from "./actions";
import ConciliacaoBancariaClient from "./ConciliacaoBancariaClient";

export default async function ConciliacaoBancariaPage() {
  const sessionsRes = await getActiveReconciliationSessionsAction();
  const sessions = sessionsRes.data || [];

  return <ConciliacaoBancariaClient initialSessions={JSON.parse(JSON.stringify(sessions))} />;
}
