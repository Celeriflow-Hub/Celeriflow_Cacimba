import ReceitasConstitucionaisClient from "./ReceitasConstitucionaisClient";
import { getConstitutionalRulesAction, getExceptionQueueAction } from "./regras-receitas-actions";

export default async function ReceitasConstitucionaisPage() {
  const rulesRes = await getConstitutionalRulesAction();
  const exceptionsRes = await getExceptionQueueAction();

  const rules = rulesRes.data?.rules || [];
  const bankAccounts = rulesRes.data?.bankAccounts || [];
  const exceptions = exceptionsRes.data || [];

  return (
    <ReceitasConstitucionaisClient
      initialRules={JSON.parse(JSON.stringify(rules))}
      initialBankAccounts={JSON.parse(JSON.stringify(bankAccounts))}
      initialExceptions={JSON.parse(JSON.stringify(exceptions))}
    />
  );
}
