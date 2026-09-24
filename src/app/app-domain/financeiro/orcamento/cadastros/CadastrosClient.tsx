"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ErpPagination } from "@/components/app-ui/erp/ErpPagination";
import { createMasterData, deleteMasterData, updateMasterData } from "../actions";

type ProcurementOriginPolicy = "NONE" | "PROCUREMENT_SOURCE" | "CONTRACT";
type Item = { id: string; code: string; name: string; secretariatId?: string; secretariat?: { name: string }; procurementOriginPolicy?: ProcurementOriginPolicy };
type Type = "budgetUnit" | "resourceSource" | "revenueNature" | "expenseNature";
const labels: Record<Type, string> = { budgetUnit: "Unidades orçamentárias", resourceSource: "Fontes de recursos", revenueNature: "Naturezas de receita", expenseNature: "Naturezas de despesa" };

export default function CadastrosClient({ secretariats, budgetUnits, resourceSources, revenueNatures, expenseNatures }: { secretariats: { id: string; name: string }[]; budgetUnits: Item[]; resourceSources: Item[]; revenueNatures: Item[]; expenseNatures: Item[] }) {
  const [type, setType] = useState<Type>("budgetUnit");
  const [editing, setEditing] = useState<Item | null>(null);
  const [form, setForm] = useState<{ code: string; name: string; secretariatId: string; procurementOriginPolicy: ProcurementOriginPolicy }>({ code: "", name: "", secretariatId: "", procurementOriginPolicy: "NONE" });
  const [pending, setPending] = useState(false);
  const [page, setPage] = useState(1);
  const items = type === "budgetUnit" ? budgetUnits : type === "resourceSource" ? resourceSources : type === "revenueNature" ? revenueNatures : expenseNatures;
  const pageSize = 20;
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const pagedItems = items.slice((page - 1) * pageSize, page * pageSize);
  const reset = () => { setEditing(null); setForm({ code: "", name: "", secretariatId: "", procurementOriginPolicy: "NONE" }); };
  const submit = async (event: React.FormEvent) => { event.preventDefault(); setPending(true); const result = editing ? await updateMasterData(type, editing.id, form) : await createMasterData(type, form); setPending(false); if (result.error) return alert(result.error); reset(); };
  const edit = (item: Item) => { setEditing(item); setForm({ code: item.code, name: item.name, secretariatId: item.secretariatId ?? "", procurementOriginPolicy: item.procurementOriginPolicy ?? "NONE" }); };
  const remove = async (id: string) => { if (!window.confirm("Excluir este cadastro? Registros vinculados impedirão a exclusão.")) return; const result = await deleteMasterData(type, id); if (result.error) alert(result.error); };

  return <div className="flex h-full min-h-0 flex-col gap-2 overflow-hidden px-1 py-1 sm:px-2">
    <header className="shrink-0 border-b border-slate-300 bg-white px-3 py-2 shadow-sm"><h1 className="text-sm font-bold tracking-tight text-slate-900">Cadastros Orçamentários</h1><p className="text-xs text-muted-foreground">Estruturas administrativas e classificações da LOA.</p></header>
    <div className="flex shrink-0 flex-wrap gap-1 border border-slate-300 bg-white p-1">{(Object.keys(labels) as Type[]).map(key => <Button key={key} size="sm" variant={type === key ? "default" : "outline"} onClick={() => { setType(key); setPage(1); reset(); }}>{labels[key]}</Button>)}</div>
    <details className="shrink-0 rounded-md border border-slate-200 bg-white"><summary className="cursor-pointer px-3 py-2 text-xs font-semibold">{editing ? `Editar ${labels[type].slice(0, -1)}` : `Novo cadastro: ${labels[type]}`}</summary><div className="p-3">
      <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div><Label>Código</Label><Input required value={form.code} onChange={event => setForm({ ...form, code: event.target.value })} /></div>
        <div className="md:col-span-2"><Label>Nome</Label><Input required value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} /></div>
        {type === "budgetUnit" && <div><Label>Secretaria</Label><Select value={form.secretariatId} onValueChange={value => setForm({ ...form, secretariatId: value ?? "" })}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>{secretariats.map(secretariat => <SelectItem key={secretariat.id} value={secretariat.id}>{secretariat.name}</SelectItem>)}</SelectContent></Select></div>}
        {type === "expenseNature" && <div><Label>Origem da contratação</Label><Select value={form.procurementOriginPolicy} onValueChange={value => setForm({ ...form, procurementOriginPolicy: value as ProcurementOriginPolicy })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="NONE">Sem exigência</SelectItem><SelectItem value="PROCUREMENT_SOURCE">Exigir origem de contratação</SelectItem><SelectItem value="CONTRACT">Exigir contrato</SelectItem></SelectContent></Select></div>}
        <div className="flex items-end gap-2"><Button type="submit" disabled={pending}>{editing ? <Pencil className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}{pending ? "Salvando..." : editing ? "Atualizar" : "Adicionar"}</Button>{editing && <Button type="button" variant="outline" onClick={reset}>Cancelar</Button>}</div>
      </form>
    </div></details>
    <Card size="sm" className="flex min-h-0 flex-1 flex-col overflow-hidden [&_[data-slot=table-container]]:min-h-0 [&_[data-slot=table-container]]:flex-1 [&_[data-slot=table-container]]:overflow-x-hidden [&_[data-slot=table-container]]:overflow-y-auto [&_[data-slot=table]]:table-fixed [&_[data-slot=table-header]]:sticky [&_[data-slot=table-header]]:top-0 [&_[data-slot=table-header]]:z-10 [&_[data-slot=table-row]]:h-[38px]"><CardContent className="min-h-0 flex-1 overflow-hidden pt-0"><Table><TableHeader><TableRow><TableHead>Código</TableHead><TableHead>Nome</TableHead>{type === "budgetUnit" && <TableHead>Secretaria</TableHead>}{type === "expenseNature" && <TableHead>Origem da contratação</TableHead>}<TableHead className="text-right">Ações</TableHead></TableRow></TableHeader><TableBody>{pagedItems.map(item => <TableRow key={item.id}><TableCell>{item.code}</TableCell><TableCell className="truncate" title={item.name}>{item.name}</TableCell>{type === "budgetUnit" && <TableCell>{item.secretariat?.name}</TableCell>}{type === "expenseNature" && <TableCell>{item.procurementOriginPolicy === "CONTRACT" ? "Contrato" : item.procurementOriginPolicy === "PROCUREMENT_SOURCE" ? "Origem de contratação" : "Sem exigência"}</TableCell>}<TableCell className="text-right"><Button variant="ghost" size="icon-sm" onClick={() => edit(item)}><Pencil className="h-4 w-4" /></Button><Button variant="ghost" size="icon-sm" onClick={() => remove(item.id)}><Trash2 className="h-4 w-4 text-rose-600" /></Button></TableCell></TableRow>)}</TableBody></Table></CardContent><ErpPagination page={Math.min(page, pageCount)} total={items.length} pageSize={pageSize} previousHref="#" nextHref="#" onPageChange={setPage} /></Card>
  </div>;
}
