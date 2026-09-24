"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { savePurchaseRequest } from "./actions";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Save, Plus, Trash2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MoneyInput } from "@/components/ui/MoneyInput";
import { PageFrame } from "@/components/app-ui/PageFrame";
import { PageHeader } from "@/components/app-ui/PageHeader";

type RequestItem = {
  id?: string;
  catalogItemId: string;
  customName: string;
  quantity: number;
  estimatedUnitValue: number;
  allocations: BudgetAllocation[];
};

type BudgetAllocation = {
  budgetAppropriationId: string;
  quantity: number;
  value: number;
};

type RequestData = {
  id: string;
  number: string;
  secretariatId: string;
  departmentId: string;
  object: string;
  justification: string;
  priority: string;
  estimatedValue: number | null;
  items?: RequestItem[];
};

type CatalogItemOption = {
  id: string;
  code?: string | null;
  name: string;
  estimatedValue?: number | null;
};

type SecretariatOption = { id: string; name: string };
type DepartmentOption = { id: string; name: string; secretariatId: string };
type BudgetAppropriationOption = {
  id: string;
  code: string;
  secretariatId: string;
  budgetUnitName: string;
  expenseNatureCode: string;
  expenseNatureName: string;
  resourceSourceCode: string;
  resourceSourceName: string;
  financialYear: number;
};
type Origin = { secretariatId: string; departmentId: string };

type SolicitacaoFormProps = {
  data?: RequestData;
  catalogItems?: CatalogItemOption[];
  secretarias?: SecretariatOption[];
  departments?: DepartmentOption[];
  budgetAppropriations?: BudgetAppropriationOption[];
  initialOrigin?: Origin | null;
  originLocked?: boolean;
};

export function SolicitacaoForm({ data, catalogItems = [], secretarias = [], departments = [], budgetAppropriations = [], initialOrigin = null, originLocked = false }: SolicitacaoFormProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  
  const [items, setItems] = useState<RequestItem[]>(data?.items || []);
  const [secretariatId, setSecretariatId] = useState(data?.secretariatId || initialOrigin?.secretariatId || "");
  const [departmentId, setDepartmentId] = useState(data?.departmentId || initialOrigin?.departmentId || "");
  const [priority, setPriority] = useState(data?.priority || "Normal");
  const availableBudgetAppropriations = budgetAppropriations.filter((appropriation) => appropriation.secretariatId === secretariatId);
  const estimatedTotal = items.length > 0
    ? items.reduce((acc, curr) => acc + (curr.quantity * (curr.estimatedUnitValue ?? 0)), 0)
    : data?.estimatedValue ?? 0;

  const handleAddItem = () => {
    setItems([...items, { catalogItemId: "", customName: "", quantity: 1, estimatedUnitValue: 0, allocations: [] }]);
  };

  const handleRemoveItem = (index: number) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
  };

  const updateItem = <Field extends keyof RequestItem>(index: number, field: Field, value: RequestItem[Field]) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // Auto fill unit value if catalog item is selected
    if (field === 'catalogItemId' && value !== 'custom') {
      const catalogItem = catalogItems.find(c => c.id === value);
      if (catalogItem?.estimatedValue !== null && catalogItem?.estimatedValue !== undefined) {
        newItems[index].estimatedUnitValue = catalogItem.estimatedValue;
      }
      newItems[index].customName = ""; // clear custom name if selecting catalog
    }
    
    setItems(newItems);
  };

  const addAllocation = (itemIndex: number) => {
    setItems((currentItems) => currentItems.map((item, index) => {
      if (index !== itemIndex) return item;
      const allocatedQuantity = item.allocations.reduce((total, allocation) => total + allocation.quantity, 0);
      const allocatedValue = item.allocations.reduce((total, allocation) => total + allocation.value, 0);
      const itemValue = item.quantity * item.estimatedUnitValue;
      return {
        ...item,
        allocations: [
          ...item.allocations,
          {
            budgetAppropriationId: "",
            quantity: Math.max(0.01, Number((item.quantity - allocatedQuantity).toFixed(2))),
            value: Math.max(0, Number((itemValue - allocatedValue).toFixed(2))),
          },
        ],
      };
    }));
  };

  const updateAllocation = (itemIndex: number, allocationIndex: number, field: keyof BudgetAllocation, value: string | number) => {
    setItems((currentItems) => currentItems.map((item, index) => {
      if (index !== itemIndex) return item;
      const allocations = [...item.allocations];
      allocations[allocationIndex] = { ...allocations[allocationIndex], [field]: value } as BudgetAllocation;
      return { ...item, allocations };
    }));
  };

  const removeAllocation = (itemIndex: number, allocationIndex: number) => {
    setItems((currentItems) => currentItems.map((item, index) => index === itemIndex
      ? { ...item, allocations: item.allocations.filter((_, index) => index !== allocationIndex) }
      : item));
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSaving(true);
    
    const formData = new FormData(e.currentTarget);
    const payload = {
      id: data?.id,
      number: String(formData.get("number") ?? ""),
      object: String(formData.get("object") ?? ""),
      justification: String(formData.get("justification") ?? ""),
      priority,
      estimatedValue: estimatedTotal,
      items,
      secretariatId,
      departmentId,
    };

    const result = await savePurchaseRequest(payload);
    setIsSaving(false);
    
    if (result.success) {
      router.push("/compras/solicitacoes");
      router.refresh();
    } else {
      alert(result.error);
    }
  }

  return (
    <PageFrame className="space-y-2">
      <PageHeader title={data ? "Editar Solicitação" : "Nova Solicitação"} action={<Link href="/compras/solicitacoes" aria-label="Voltar"><Button variant="outline" size="icon"><ArrowLeft className="size-4" /></Button></Link>} />

      <Card className="max-w-5xl rounded-md">
        <CardHeader className="border-b p-3">
          <CardTitle className="text-sm">Dados da Solicitação</CardTitle>
        </CardHeader>
        <CardContent className="p-3">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="number">Número da Solicitação</Label>
                <Input id="number" name="number" defaultValue={data?.number || ""} placeholder="Ex: REQ-2026-001 (Auto-gerado se vazio)" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="secretariatId">Secretaria</Label>
                <Select disabled={originLocked} value={secretariatId} onValueChange={(value) => { setSecretariatId(value ?? ""); setDepartmentId(""); }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a Secretaria" />
                  </SelectTrigger>
                  <SelectContent>
                    {secretarias.map(sec => (
                      <SelectItem key={sec.id} value={sec.id}>{sec.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="departmentId">Departamento</Label>
                <Select disabled={originLocked} value={departmentId} onValueChange={(value) => setDepartmentId(value ?? "")}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o Departamento" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.filter((department) => department.secretariatId === secretariatId).map((department) => (
                      <SelectItem key={department.id} value={department.id}>{department.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Prioridade do planejamento</Label>
                <Select value={priority} onValueChange={(value) => setPriority(value ?? "Normal")}>
                  <SelectTrigger id="priority"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Baixa">Baixa</SelectItem>
                    <SelectItem value="Normal">Normal</SelectItem>
                    <SelectItem value="Alta">Alta</SelectItem>
                    <SelectItem value="Urgente">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {originLocked ? <p className="rounded-md border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-sky-800">A origem da solicitacao esta vinculada ao seu setor e secretaria autorizados.</p> : null}
            <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">Visão de planejamento POC: esta solicitação registra necessidade, itens, quantidades, estimativa e prioridade, sem gerar reserva ou empenho. O período esperado não possui campo estruturado no modelo atual.</p>

            <div className="space-y-2">
              <Label>Valor Estimado Total (R$)</Label>
              <div className="text-2xl font-bold text-slate-700">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(estimatedTotal)}
              </div>
              <input type="hidden" name="estimatedValue" value={estimatedTotal} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="object">Objeto / Finalidade Geral</Label>
              <Input id="object" name="object" defaultValue={data?.object || ""} required placeholder="Resumo do que está sendo solicitado" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="justification">Justificativa</Label>
              <Textarea id="justification" name="justification" defaultValue={data?.justification || ""} required rows={3} placeholder="Por que essa contratação/compra é necessária?" />
            </div>

            <div className="border-t border-slate-200 pt-3">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-semibold">Itens da Solicitação</h3>
                <Button type="button" variant="outline" size="sm" onClick={handleAddItem}>
                  <Plus className="mr-2 h-4 w-4" /> Adicionar Item
                </Button>
              </div>

              {items.length === 0 ? (
                <div className="text-center py-6 text-slate-500 border rounded-lg bg-slate-50">
                  Nenhum item adicionado. Clique em &quot;Adicionar Item&quot;.
                </div>
              ) : (
                <div className="space-y-3">
                  {items.map((item, index) => (
                    <div key={item.id ?? index} className="relative flex items-start gap-3 rounded-md border bg-slate-50 p-3">
                       <div className="grid flex-1 grid-cols-12 gap-3">
                        <div className="col-span-12 md:col-span-6 space-y-2">
                          <Label>Produto ou Serviço *</Label>
                          <Select 
                            value={item.catalogItemId || (item.customName ? "custom" : "")} 
                            onValueChange={(val) => updateItem(index, 'catalogItemId', val ?? "")}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione do Catálogo ou Serviço Customizado..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="custom">-- Serviço / Item Fora do Catálogo --</SelectItem>
                              {catalogItems.map(c => (
                                <SelectItem key={c.id} value={c.id}>{c.code ? `[${c.code}] ` : ''}{c.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          
                          {item.catalogItemId === "custom" && (
                            <Input 
                              placeholder="Descreva o serviço ou item..." 
                              value={item.customName} 
                              onChange={(e) => updateItem(index, 'customName', e.target.value)}
                              className="mt-2"
                              required
                            />
                          )}
                        </div>
                        <div className="col-span-6 md:col-span-3 space-y-2">
                          <Label>Quantidade *</Label>
                          <Input 
                            type="number" 
                            min="0.01" 
                            step="0.01" 
                            value={item.quantity} 
                            onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)} 
                            required 
                          />
                        </div>
                        <div className="col-span-6 md:col-span-3 space-y-2">
                          <Label>Valor Unit. (R$)</Label>
                          <MoneyInput 
                            value={item.estimatedUnitValue ?? 0}
                            onChange={(val) => updateItem(index, 'estimatedUnitValue', val)} 
                          />
                        </div>
                        <div className="col-span-12 space-y-2 border-t pt-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                              <Label>Alocações orçamentárias *</Label>
                              <p className="text-xs text-muted-foreground">Distribua toda a quantidade e o valor deste item entre as dotações da secretaria.</p>
                            </div>
                            <Button type="button" variant="outline" size="sm" onClick={() => addAllocation(index)} disabled={!secretariatId}>
                              <Plus className="mr-2 size-3.5" /> Adicionar alocação
                            </Button>
                          </div>
                          {!secretariatId ? <p className="text-xs text-amber-700">Selecione a secretaria antes de informar a dotação.</p> : null}
                          {secretariatId && availableBudgetAppropriations.length === 0 ? <p className="text-xs text-amber-700">Não há dotações disponíveis para esta secretaria.</p> : null}
                          {item.allocations.map((allocation, allocationIndex) => (
                            <div key={allocationIndex} className="grid grid-cols-12 items-end gap-2 rounded-md border bg-white p-2">
                              <div className="col-span-12 lg:col-span-6 space-y-1">
                                <Label className="text-xs">Dotação</Label>
                                <Select value={allocation.budgetAppropriationId} onValueChange={(value) => updateAllocation(index, allocationIndex, "budgetAppropriationId", value ?? "")}>
                                  <SelectTrigger><SelectValue placeholder="Selecione a dotação" /></SelectTrigger>
                                  <SelectContent>
                                    {availableBudgetAppropriations.map((appropriation) => (
                                      <SelectItem key={appropriation.id} value={appropriation.id}>
                                        {appropriation.code} · {appropriation.expenseNatureCode} · {appropriation.resourceSourceCode} ({appropriation.financialYear})
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="col-span-5 lg:col-span-2 space-y-1">
                                <Label className="text-xs">Quantidade</Label>
                                <Input type="number" min="0.01" step="0.01" value={allocation.quantity} onChange={(event) => updateAllocation(index, allocationIndex, "quantity", Number(event.target.value) || 0)} />
                              </div>
                              <div className="col-span-5 lg:col-span-3 space-y-1">
                                <Label className="text-xs">Valor (R$)</Label>
                                <MoneyInput value={allocation.value} onChange={(value) => updateAllocation(index, allocationIndex, "value", value)} />
                              </div>
                              <div className="col-span-2 lg:col-span-1">
                                <Button type="button" variant="ghost" size="icon" className="text-rose-500 hover:bg-rose-100 hover:text-rose-700" onClick={() => removeAllocation(index, allocationIndex)} title="Remover alocação">
                                  <Trash2 className="size-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                          <p className="text-xs text-muted-foreground">
                            Alocado: {item.allocations.reduce((total, allocation) => total + allocation.quantity, 0)} de {item.quantity} · {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.allocations.reduce((total, allocation) => total + allocation.value, 0))} de {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.quantity * item.estimatedUnitValue)}
                          </p>
                        </div>
                      </div>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon" 
                        className="text-rose-500 hover:text-rose-700 hover:bg-rose-100 mt-6"
                        onClick={() => handleRemoveItem(index)}
                        title="Remover Item"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 border-t pt-3">
              <Link href="/compras/solicitacoes">
                <Button type="button" variant="outline">Cancelar</Button>
              </Link>
              <Button type="submit" disabled={isSaving}>
                <Save className="mr-2 h-4 w-4" /> {isSaving ? "Salvando..." : "Salvar Solicitação"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </PageFrame>
  );
}
