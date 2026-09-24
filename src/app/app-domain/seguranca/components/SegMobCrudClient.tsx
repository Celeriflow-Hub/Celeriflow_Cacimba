"use client";

import { useMemo, useState } from "react";
import { Check, Eye, Filter, Pencil, Plus, Search, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { PageFrame } from "@/components/app-ui/PageFrame";
import { PageHeader } from "@/components/app-ui/PageHeader";
import { ErpListFrame } from "@/components/app-ui/erp/ErpListFrame";
import { ErpPagination } from "@/components/app-ui/erp/ErpPagination";
import { createSegMobItem, toggleSegMobItemStatus, updateSegMobItem } from "../actions";
import type { SegMobFormData, SegMobItem, SegMobPageConfig } from "../types";

const defaultForm: SegMobFormData = {
  code: "",
  title: "",
  type: "",
  status: "Ativo",
  isActive: true,
  location: "",
  district: "",
  responsible: "",
  priority: "Normal",
  date: "",
  description: "",
  plate: "",
  value: 0,
  category: "",
  relatedModule: "",
  relatedId: "",
};

const PAGE_SIZE = 20;

function toDateInput(value?: Date | string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function formatDate(value?: Date | string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("pt-BR");
}

function statusClass(status: string, isActive: boolean) {
  if (!isActive) return "bg-slate-100 text-slate-600 hover:bg-slate-100";
  if (["Resolvida", "Encerrada", "Pago", "Concluida", "Ativo", "Operacional", "Publicado"].includes(status)) {
    return "bg-emerald-100 text-emerald-700 hover:bg-emerald-100";
  }
  if (["Alta", "Urgente", "Interditada", "Cancelado", "Critico"].includes(status)) {
    return "bg-rose-100 text-rose-700 hover:bg-rose-100";
  }
  if (["Em Atendimento", "Em Execucao", "Em Analise", "Pendente", "Notificado"].includes(status)) {
    return "bg-amber-100 text-amber-700 hover:bg-amber-100";
  }
  return "bg-cyan-100 text-cyan-700 hover:bg-cyan-100";
}

export default function SegMobCrudClient({
  items,
  config,
}: {
  items: SegMobItem[];
  config: SegMobPageConfig;
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [typeFilter, setTypeFilter] = useState("Todos");
  const [activeFilter, setActiveFilter] = useState("Ativos");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingKind, setEditingKind] = useState(config.kind);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<SegMobFormData>(defaultForm);
  const [page, setPage] = useState(1);
  const [detailItem, setDetailItem] = useState<SegMobItem | null>(null);

  const typeOptions = useMemo(() => {
    return Array.from(new Set([...config.typeOptions, ...items.map((item) => item.type).filter(Boolean)]));
  }, [config.typeOptions, items]);

  const statusOptions = useMemo(() => {
    return Array.from(new Set([...config.statusOptions, ...items.map((item) => item.status).filter(Boolean)]));
  }, [config.statusOptions, items]);

  const filteredItems = items.filter((item) => {
    const search = searchTerm.toLowerCase();
    const matchesSearch = [item.code, item.title, item.type, item.status, item.location, item.district, item.responsible, item.category]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(search));
    const matchesStatus = statusFilter === "Todos" || item.status === statusFilter;
    const matchesType = typeFilter === "Todos" || item.type === typeFilter || item.category === typeFilter;
    const matchesActive = activeFilter === "Todos" || (activeFilter === "Ativos" ? item.isActive : !item.isActive);
    return matchesSearch && matchesStatus && matchesType && matchesActive;
  });
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));
  const activePage = Math.min(page, totalPages);
  const paginatedItems = filteredItems.slice((activePage - 1) * PAGE_SIZE, activePage * PAGE_SIZE);

  const updateFilter = (callback: () => void) => {
    callback();
    setPage(1);
  };

  const openNew = () => {
    setEditingId(null);
    setEditingKind(config.kind);
    setFormData({
      ...defaultForm,
      type: config.typeOptions[0] || "",
      status: config.statusOptions[0] || "Ativo",
      priority: config.priorityOptions?.[0] || "Normal",
      category: config.categories?.[0] || "",
      date: toDateInput(new Date()),
    });
    setIsModalOpen(true);
  };

  const openEdit = (item: SegMobItem) => {
    setEditingId(item.id);
    setFormData({
      code: item.code,
      title: item.title,
      type: item.type,
      status: item.status,
      isActive: item.isActive,
      location: item.location || "",
      district: item.district || "",
      responsible: item.responsible || "",
      priority: item.priority || "Normal",
      date: toDateInput(item.date),
      description: item.description || "",
      plate: item.plate || "",
      value: item.value || 0,
      category: item.category || config.categories?.[0] || "",
      relatedModule: item.relatedModule || "",
      relatedId: item.relatedId || "",
    });
    setIsModalOpen(true);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    const result = editingId
      ? await updateSegMobItem(editingKind, editingId, formData)
      : await createSegMobItem(config.kind, formData);
    setIsSubmitting(false);
    if (result?.error) {
      window.alert(result.error);
      return;
    }
    setIsModalOpen(false);
  };

  const toggleActive = async (item: SegMobItem) => {
    const action = item.isActive ? "inativar" : "ativar";
    if (!window.confirm(`Deseja ${action} este registro?`)) return;
    const result = await toggleSegMobItemStatus(item.kind, item.id, !item.isActive);
    if (result?.error) window.alert(result.error);
  };

  return (
    <PageFrame className="flex h-full min-h-0 flex-col gap-2 overflow-hidden p-2 sm:p-3">
      <PageHeader
        title={config.title}
        action={(
          <Button size="sm" onClick={openNew} className={`${config.accentClass} text-white`}>
            <Plus />
            {config.newLabel}
          </Button>
        )}
      />

      <ErpListFrame
        toolbar={<div className="grid gap-2 md:grid-cols-[minmax(12rem,1fr)_10rem_10rem_8rem]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input className="h-8 pl-9 text-xs" placeholder="Buscar código, local ou responsável..." value={searchTerm} onChange={(event) => updateFilter(() => setSearchTerm(event.target.value))} />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <select className="h-8 w-full rounded-md border border-input bg-background pl-9 pr-2 text-xs" value={statusFilter} onChange={(event) => updateFilter(() => setStatusFilter(event.target.value))}>
                <option>Todos</option>
                {statusOptions.map((status) => <option key={status}>{status}</option>)}
              </select>
            </div>
            <select className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs" value={typeFilter} onChange={(event) => updateFilter(() => setTypeFilter(event.target.value))}>
              <option>Todos</option>
              {typeOptions.map((type) => <option key={type}>{type}</option>)}
              {config.categories?.map((category) => <option key={category}>{category}</option>)}
            </select>
            <select className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs" value={activeFilter} onChange={(event) => updateFilter(() => setActiveFilter(event.target.value))}>
              <option>Ativos</option>
              <option>Inativos</option>
              <option>Todos</option>
            </select>
          </div>}
        summary={<p className="text-[11px] text-slate-500">{filteredItems.length} registros · {config.description}</p>}
        pagination={<ErpPagination page={activePage} total={filteredItems.length} pageSize={PAGE_SIZE} previousHref="#" nextHref="#" label="registros" onPageChange={setPage} />}
      >
        <div className="hidden h-full min-h-0 overflow-y-auto md:block">
          <Table className="w-full table-fixed text-xs">
            <TableHeader className="sticky top-0 z-10 bg-slate-100">
              <TableRow>
                <TableHead>{config.codeLabel}</TableHead>
                <TableHead>{config.titleLabel}</TableHead>
                <TableHead>{config.typeLabel || "Tipo"}</TableHead>
                <TableHead>{config.locationLabel || "Local/Equipe"}</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Acoes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-28 text-center text-slate-500">Nenhum registro encontrado.</TableCell>
                </TableRow>
              ) : (
                paginatedItems.map((item) => (
                  <TableRow key={item.id} className="h-9">
                    <TableCell className="truncate py-1.5 font-medium text-slate-900">{item.code}</TableCell>
                    <TableCell className="truncate py-1.5 font-medium text-slate-900" title={item.title}>{item.title}</TableCell>
                    <TableCell className="truncate py-1.5 text-slate-700" title={item.category || item.type}>{item.type || item.category || "-"}</TableCell>
                    <TableCell className="truncate py-1.5" title={[item.location, item.district].filter(Boolean).join(" · ")}>{item.location || item.district || "-"}</TableCell>
                    <TableCell>
                      <Badge className={`${statusClass(item.status, item.isActive)} max-w-full truncate px-1.5 py-0 text-[10px]`}>{item.isActive ? item.status : "Inativo"}</Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap py-1.5">{formatDate(item.date)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-0.5">
                        <Button variant="ghost" size="icon" className="size-7" onClick={() => setDetailItem(item)} title="Ver detalhes"><Eye className="size-3.5 text-slate-600" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => toggleActive(item)} title={item.isActive ? "Inativar" : "Ativar"}>
                          {item.isActive ? <X className="h-4 w-4 text-rose-500" /> : <Check className="h-4 w-4 text-emerald-600" />}
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => openEdit(item)} title="Editar">
                          <Pencil className="h-4 w-4 text-cyan-700" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        <div className="space-y-2 overflow-y-auto p-2 md:hidden">
          {filteredItems.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-500">Nenhum registro encontrado.</p>
          ) : (
            paginatedItems.map((item) => (
              <article key={item.id} className="rounded-lg border border-slate-200 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-slate-500">{item.code}</p>
                    <h2 className="truncate font-semibold text-slate-900">{item.title}</h2>
                  </div>
                  <Badge className={`${statusClass(item.status, item.isActive)} shrink-0`}>{item.status}</Badge>
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
                  <div><dt className="text-slate-500">{config.typeLabel || "Tipo"}</dt><dd className="font-medium text-slate-700">{item.type || "-"}</dd></div>
                  <div><dt className="text-slate-500">Data</dt><dd className="font-medium text-slate-700">{formatDate(item.date)}</dd></div>
                  <div className="col-span-2"><dt className="text-slate-500">{config.locationLabel || "Local/Equipe"}</dt><dd className="font-medium text-slate-700">{item.location || item.district || "-"}</dd></div>
                </dl>
                <div className="mt-3 flex justify-end gap-1 border-t border-slate-100 pt-2">
                  <Button variant="ghost" size="sm" onClick={() => setDetailItem(item)}><Eye />Detalhes</Button>
                  <Button variant="ghost" size="sm" onClick={() => toggleActive(item)}>
                    {item.isActive ? <X className="text-rose-500" /> : <Check className="text-emerald-600" />}
                    {item.isActive ? "Inativar" : "Ativar"}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => openEdit(item)}><Pencil className="text-cyan-700" />Editar</Button>
                </div>
              </article>
            ))
          )}
        </div>
      </ErpListFrame>

      <Dialog open={Boolean(detailItem)} onOpenChange={(open) => !open && setDetailItem(null)}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-[680px]">
          <DialogHeader><DialogTitle>{detailItem?.title}</DialogTitle><DialogDescription>{detailItem?.code} · {detailItem?.type}</DialogDescription></DialogHeader>
          {detailItem && <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div><dt className="text-xs font-semibold text-slate-500">Local</dt><dd>{detailItem.location || "-"}</dd></div>
            <div><dt className="text-xs font-semibold text-slate-500">Bairro/região</dt><dd>{detailItem.district || "-"}</dd></div>
            <div><dt className="text-xs font-semibold text-slate-500">Responsável</dt><dd>{detailItem.responsible || "-"}</dd></div>
            <div><dt className="text-xs font-semibold text-slate-500">Data</dt><dd>{formatDate(detailItem.date)}</dd></div>
            <div><dt className="text-xs font-semibold text-slate-500">Situação</dt><dd>{detailItem.status}</dd></div>
            <div><dt className="text-xs font-semibold text-slate-500">Prioridade</dt><dd>{detailItem.priority || "-"}</dd></div>
            <div className="sm:col-span-2"><dt className="text-xs font-semibold text-slate-500">Descrição</dt><dd className="mt-1 whitespace-pre-wrap break-words">{detailItem.description || "Sem descrição."}</dd></div>
          </dl>}
          <DialogFooter><Button type="button" onClick={() => setDetailItem(null)}>Fechar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[720px]">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar registro" : config.newLabel}</DialogTitle>
            <DialogDescription>Use informacoes administrativas da prefeitura, equipes responsaveis, local e situacao operacional.</DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="code">{config.codeLabel}</Label>
                <Input id="code" required={Boolean(editingId)} value={formData.code} placeholder="Deixe em branco para gerar automaticamente" onChange={(event) => setFormData({ ...formData, code: event.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">{config.typeLabel || "Tipo"}</Label>
                <select id="type" className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={formData.type} onChange={(event) => setFormData({ ...formData, type: event.target.value })}>
                  {typeOptions.map((type) => <option key={type}>{type}</option>)}
                </select>
              </div>
            </div>

            {config.showCategory && config.categories && (
              <div className="space-y-2">
                <Label htmlFor="category">Categoria</Label>
                <select id="category" className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={formData.category} onChange={(event) => setFormData({ ...formData, category: event.target.value })}>
                  {config.categories.map((category) => <option key={category}>{category}</option>)}
                </select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="title">{config.titleLabel}</Label>
              <Input id="title" required value={formData.title} onChange={(event) => setFormData({ ...formData, title: event.target.value })} />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="location">{config.locationLabel || "Local/Equipe"}</Label>
                <Input id="location" value={formData.location} onChange={(event) => setFormData({ ...formData, location: event.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="district">Bairro/Regiao</Label>
                <Input id="district" value={formData.district} onChange={(event) => setFormData({ ...formData, district: event.target.value })} />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <select id="status" className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={formData.status} onChange={(event) => setFormData({ ...formData, status: event.target.value })}>
                  {statusOptions.map((status) => <option key={status}>{status}</option>)}
                </select>
              </div>
              {config.showPriority && (
                <div className="space-y-2">
                  <Label htmlFor="priority">Prioridade</Label>
                  <select id="priority" className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={formData.priority} onChange={(event) => setFormData({ ...formData, priority: event.target.value })}>
                    {(config.priorityOptions || ["Normal"]).map((priority) => <option key={priority}>{priority}</option>)}
                  </select>
                </div>
              )}
              {config.showDate && (
                <div className="space-y-2">
                  <Label htmlFor="date">Data</Label>
                  <Input id="date" type="date" value={formData.date} onChange={(event) => setFormData({ ...formData, date: event.target.value })} />
                </div>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {config.showResponsible && (
                <div className="space-y-2 md:col-span-1">
                  <Label htmlFor="responsible">Responsavel</Label>
                  <Input id="responsible" value={formData.responsible} onChange={(event) => setFormData({ ...formData, responsible: event.target.value })} />
                </div>
              )}
              {config.showPlate && (
                <div className="space-y-2">
                  <Label htmlFor="plate">Placa/Prefixo</Label>
                  <Input id="plate" value={formData.plate} onChange={(event) => setFormData({ ...formData, plate: event.target.value.toUpperCase() })} />
                </div>
              )}
              {config.showValue && (
                <div className="space-y-2">
                  <Label htmlFor="value">Valor/Estimativa</Label>
                  <Input id="value" type="number" step="0.01" value={formData.value} onChange={(event) => setFormData({ ...formData, value: Number(event.target.value) })} />
                </div>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="relatedModule">Modulo vinculado</Label>
                <Input id="relatedModule" placeholder="Ex: Obras, Patrimonio, Protocolos" value={formData.relatedModule} onChange={(event) => setFormData({ ...formData, relatedModule: event.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="relatedId">Referencia interna</Label>
                <Input id="relatedId" placeholder="Ex: OS-2026-014" value={formData.relatedId} onChange={(event) => setFormData({ ...formData, relatedId: event.target.value })} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Observacoes administrativas</Label>
              <Textarea id="description" value={formData.description} onChange={(event) => setFormData({ ...formData, description: event.target.value })} />
            </div>

            <label className="flex items-center gap-2 text-sm font-medium">
              <input type="checkbox" checked={formData.isActive} onChange={(event) => setFormData({ ...formData, isActive: event.target.checked })} />
              Registro ativo na gestao municipal
            </label>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={isSubmitting} className={`${config.accentClass} text-white`}>
                {isSubmitting ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </PageFrame>
  );
}
