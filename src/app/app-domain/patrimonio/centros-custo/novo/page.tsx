import { CostCenterForm } from "../CostCenterForm";
import { createCostCenterAction } from "../actions";

export default function NovoCentroCustoPage() {
  return <CostCenterForm title="Novo Centro de Custo" submitLabel="Salvar centro de custo" action={createCostCenterAction} />;
}
