"use client";

import { useState } from "react";
import { ErpPagination } from "@/components/app-ui/erp/ErpPagination";
import { format } from "date-fns";
import { FileCheck, Plus, Search, Ban } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MoneyInput } from "@/components/ui/MoneyInput";
import { createSettlement, cancelSettlement, updateSettlement } from "./actions";

type Settlement = {
  id: string;
  date: Date;
  value: number;
  documentRef: string | null;
  fiscalDocumentNumber: string | null;
  fiscalDocumentSeries: string | null;
  fiscalDocumentIssueDate: Date | null;
  fiscalDocumentAccessKey: string | null;
  document: { id: string; title: string } | null;
  financialDocument: { id: string; number: string; title: string } | null;
  notes: string | null;
  status: string;
  paidValue: number;
  commitment: {
    id: string;
    number: string;
    supplier: {
      company?: { corporateName: string } | null;
      person?: { fullName: string } | null;
    };
    purchaseReceipt: { number: string } | null;
  };
  author: {
    id: string;
    name: string;
  };
};

type CommitmentOption = { id: string; number: string; availableToSettle: number; purchaseReceipt: { number: string } | null };
type EmployeeOption = { id: string; name: string };
type RetentionRule = { id: string; code: string; type: string; description: string; calculationBasePercentage: number; ratePercentage: number; serviceCode: string | null };

export default function LiquidacoesClient({
  settlements,
  commitments,
  employees,
  documents,
  retentionRules,
}: {
  settlements: Settlement[];
  commitments: CommitmentOption[];
  employees: EmployeeOption[];
  documents: { id: string; title: string; documentType: string }[];
  retentionRules: RetentionRule[];
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterMonth, setFilterMonth] = useState("ALL");
  const [filterYear, setFilterYear] = useState("ALL");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().substring(0, 10),
    value: 0,
    documentRef: "",
    fiscalDocumentNumber: "",
    fiscalDocumentSeries: "",
    fiscalDocumentIssueDate: "",
    fiscalDocumentAccessKey: "",
    documentId: "",
    commitmentId: "",
    authorId: "",
    notes: "",
    serviceCode: "",
    retentionRuleIds: [] as string[],
  });

  const filteredSettlements = settlements.filter(s => {
    const matchesSearch = s.commitment.number.includes(searchTerm) || (s.documentRef && s.documentRef.includes(searchTerm));
    const matchesStatus = filterStatus === "ALL" || s.status === filterStatus;

    const d = new Date(s.date);
    const matchesMonth = filterMonth === "ALL" || (d.getMonth() + 1).toString() === filterMonth;
    const matchesYear = filterYear === "ALL" || d.getFullYear().toString() === filterYear;

    return matchesSearch && matchesStatus && matchesMonth && matchesYear;
  });
  const pageSize = 20;
  const pageCount = Math.max(1, Math.ceil(filteredSettlements.length / pageSize));
  const pagedSettlements = filteredSettlements.slice((page - 1) * pageSize, page * pageSize);

  const handleOpenNew = () => {
    setEditingId(null);
    setFormData({
      date: new Date().toISOString().substring(0, 10),
      value: 0,
      documentRef: "",
      fiscalDocumentNumber: "",
      fiscalDocumentSeries: "",
      fiscalDocumentIssueDate: "",
      fiscalDocumentAccessKey: "",
      documentId: "",
      commitmentId: "",
      authorId: "",
      notes: "",
      serviceCode: "",
      retentionRuleIds: [],
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const dataToSubmit = {
        ...formData,
        date: new Date(formData.date),
        fiscalDocumentIssueDate: formData.fiscalDocumentIssueDate ? new Date(formData.fiscalDocumentIssueDate) : undefined,
      };

      if (editingId) {
        const result = await updateSettlement(editingId, dataToSubmit);
        if (result.error) throw new Error(result.error);
      } else {
        const result = await createSettlement(dataToSubmit);
        if (result.error) throw new Error(result.error);
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error saving settlement:", error);
      alert(error instanceof Error ? error.message : "Ocorreu um erro ao salvar a liquidação.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelSettlement = async (id: string) => {
    if (window.confirm('Deseja realmente cancelar esta liquidação? Esta ação não pode ser desfeita.')) {
      const result = await cancelSettlement(id);
      if (result.error) alert(result.error);
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-2 overflow-hidden px-1 py-1 sm:px-2">
      <div className="flex flex-col gap-2 border-b border-slate-300 bg-white px-3 py-2 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-sm font-bold tracking-tight text-slate-900">Liquidações</h1>
          <p className="text-xs text-muted-foreground">Ateste de notas fiscais e recebimento de serviços</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button size="sm" onClick={handleOpenNew}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Liquidação
          </Button>
        </div>
      </div>

      <Card size="sm" className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-md shadow-none [&_[data-slot=table-container]]:min-h-0 [&_[data-slot=table-container]]:flex-1 [&_[data-slot=table-container]]:overflow-x-hidden [&_[data-slot=table-container]]:overflow-y-auto [&_[data-slot=table]]:table-fixed [&_[data-slot=table-header]]:sticky [&_[data-slot=table-header]]:top-0 [&_[data-slot=table-header]]:z-10 [&_[data-slot=table-row]]:h-[38px]">
        <CardHeader className="border-b pb-2">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <CardTitle>Listagem de Liquidações</CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar..."
                  className="pl-8 w-[150px]"
                  value={searchTerm}
                  onChange={e => { setSearchTerm(e.target.value); setPage(1); }}
                />
              </div>
              <Select value={filterStatus} onValueChange={(val) => { setFilterStatus(val as string); setPage(1); }}>
                <SelectTrigger className="w-[120px]"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos</SelectItem>
                  <SelectItem value="Liquidado">Liquidado</SelectItem>
                  <SelectItem value="Cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterMonth} onValueChange={(val) => { setFilterMonth(val as string); setPage(1); }}>
                <SelectTrigger className="w-[110px]"><SelectValue placeholder="Mês" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Mês</SelectItem>
                  <SelectItem value="1">Jan</SelectItem>
                  <SelectItem value="2">Fev</SelectItem>
                  <SelectItem value="3">Mar</SelectItem>
                  <SelectItem value="4">Abr</SelectItem>
                  <SelectItem value="5">Mai</SelectItem>
                  <SelectItem value="6">Jun</SelectItem>
                  <SelectItem value="7">Jul</SelectItem>
                  <SelectItem value="8">Ago</SelectItem>
                  <SelectItem value="9">Set</SelectItem>
                  <SelectItem value="10">Out</SelectItem>
                  <SelectItem value="11">Nov</SelectItem>
                  <SelectItem value="12">Dez</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterYear} onValueChange={(val) => { setFilterYear(val as string); setPage(1); }}>
                <SelectTrigger className="w-[100px]"><SelectValue placeholder="Ano" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Ano</SelectItem>
                  <SelectItem value="2026">2026</SelectItem>
                  <SelectItem value="2025">2025</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex min-h-0 flex-1 flex-col overflow-hidden pt-3">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Empenho / recebimento</TableHead>
                <TableHead>Fornecedor</TableHead>
                <TableHead>Documento (NF/Recibo)</TableHead>
                <TableHead>Responsável (Ateste)</TableHead>
                <TableHead>Valor (R$)</TableHead>
                <TableHead>Documento interno</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSettlements.length === 0 ? (
                <TableRow>
                    <TableCell colSpan={9} className="text-center text-muted-foreground h-32">
                    <div className="flex flex-col items-center justify-center">
                      <FileCheck className="h-8 w-8 mb-2 opacity-20" />
                      Nenhuma liquidação encontrada.
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                pagedSettlements.map((settlement) => (
                  <TableRow key={settlement.id}>
                    <TableCell>{format(new Date(settlement.date), 'dd/MM/yyyy')}</TableCell>
                    <TableCell className="font-medium">{settlement.commitment.number}{settlement.commitment.purchaseReceipt && <span className="block text-xs text-muted-foreground">{settlement.commitment.purchaseReceipt.number}</span>}</TableCell>
                    <TableCell>
                      {settlement.commitment.supplier.company?.corporateName || settlement.commitment.supplier.person?.fullName || 'Não identificado'}
                    </TableCell>
                       <TableCell>
                         {settlement.fiscalDocumentNumber ? <><strong>NF {settlement.fiscalDocumentNumber}{settlement.fiscalDocumentSeries ? ` / Série ${settlement.fiscalDocumentSeries}` : ""}</strong><span className="block text-xs text-muted-foreground">{settlement.fiscalDocumentIssueDate ? format(new Date(settlement.fiscalDocumentIssueDate), "dd/MM/yyyy") : ""}</span></> : settlement.documentRef || "-"}
                         <span className="block text-xs text-muted-foreground">GED: {settlement.document?.title || "-"}</span>
                       </TableCell>
                    <TableCell>{settlement.author.name}</TableCell>
                    <TableCell>
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(settlement.value)}
                      {settlement.paidValue > 0 && <span className="block text-xs text-muted-foreground">Pago: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(settlement.paidValue)}</span>}
                    </TableCell>
                    <TableCell className="text-sm">{settlement.financialDocument?.number || "-"}</TableCell>
                    <TableCell>
                      <Badge variant={
                        settlement.status === 'Liquidado' ? 'default' :
                        settlement.status === 'Cancelado' ? 'destructive' :
                        'secondary'
                      }>
                        {settlement.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleCancelSettlement(settlement.id)} title="Cancelar Liquidação" disabled={settlement.status === 'Cancelado'}>
                        <Ban className="h-4 w-4 text-rose-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
              <ErpPagination page={Math.min(page, pageCount)} total={filteredSettlements.length} pageSize={pageSize} previousHref="#" nextHref="#" onPageChange={setPage} />
</Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-[680px]">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Liquidação" : "Nova Liquidação"}</DialogTitle>
            <DialogDescription>Ateste o recebimento de materiais ou serviços vinculados a um empenho.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="date">Data da Liquidação</Label>
                <Input id="date" type="date" required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="value">Valor (R$)</Label>
                <MoneyInput id="value" required value={formData.value} onChange={val => setFormData({...formData, value: val})} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="commitmentId">Empenho de Referência</Label>
              <Select value={formData.commitmentId} onValueChange={v => setFormData({...formData, commitmentId: v as string})}>
                <SelectTrigger><SelectValue placeholder="Selecione o empenho" /></SelectTrigger>
                <SelectContent>
                  {commitments.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.number}{c.purchaseReceipt ? ` · ${c.purchaseReceipt.number}` : ""} - Saldo: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(c.availableToSettle)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="documentId">Documento GED</Label>
                <Select value={formData.documentId} onValueChange={v => setFormData({...formData, documentId: v as string})}>
                  <SelectTrigger><SelectValue placeholder="Selecione o documento GED" /></SelectTrigger>
                  <SelectContent>
                    {documents.map(document => (
                      <SelectItem key={document.id} value={document.id}>{document.title} ({document.documentType})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="documentRef">Documento Ref. (NF, Recibo)</Label>
                <Input id="documentRef" value={formData.documentRef} onChange={e => setFormData({...formData, documentRef: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="authorId">Responsável pelo Ateste</Label>
                <Select value={formData.authorId} onValueChange={v => setFormData({...formData, authorId: v as string})}>
                  <SelectTrigger><SelectValue placeholder="Selecione o servidor" /></SelectTrigger>
                  <SelectContent>
                    {employees.map(e => (
                      <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="rounded-md border p-3 space-y-3">
              <p className="text-sm font-medium">Dados do documento fiscal</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="fiscalDocumentNumber">Número</Label>
                  <Input id="fiscalDocumentNumber" value={formData.fiscalDocumentNumber} onChange={e => setFormData({ ...formData, fiscalDocumentNumber: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fiscalDocumentSeries">Série</Label>
                  <Input id="fiscalDocumentSeries" value={formData.fiscalDocumentSeries} onChange={e => setFormData({ ...formData, fiscalDocumentSeries: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fiscalDocumentIssueDate">Data de emissão</Label>
                  <Input id="fiscalDocumentIssueDate" type="date" value={formData.fiscalDocumentIssueDate} onChange={e => setFormData({ ...formData, fiscalDocumentIssueDate: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fiscalDocumentAccessKey">Chave de acesso (quando houver)</Label>
                  <Input id="fiscalDocumentAccessKey" inputMode="numeric" value={formData.fiscalDocumentAccessKey} onChange={e => setFormData({ ...formData, fiscalDocumentAccessKey: e.target.value })} />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Informe número e data de emissão juntos. A chave é somente registrada, sem consulta externa de NF.</p>
            </div>

            <div className="rounded-md border p-3 space-y-3">
              <p className="text-sm font-medium">Retenções parametrizadas</p>
              <Input placeholder="Código do serviço (opcional)" value={formData.serviceCode} onChange={event => setFormData({ ...formData, serviceCode: event.target.value })} />
              {retentionRules.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma regra ativa cadastrada.</p>
              ) : (
                <div className="space-y-2">
                  {retentionRules.map((rule) => {
                    const selected = formData.retentionRuleIds.includes(rule.id);
                    const disabled = Boolean(rule.serviceCode && rule.serviceCode !== formData.serviceCode.trim());
                    return <label key={rule.id} className="flex items-start gap-2 rounded border p-2 text-sm"><input type="checkbox" checked={selected} disabled={disabled} onChange={() => setFormData({ ...formData, retentionRuleIds: selected ? formData.retentionRuleIds.filter((id) => id !== rule.id) : [...formData.retentionRuleIds, rule.id] })} /><span><strong>{rule.code} - {rule.type}</strong><br />{rule.description} ({rule.calculationBasePercentage}% x {rule.ratePercentage}%)</span></label>;
                  })}
                </div>
              )}
              <p className="text-xs text-muted-foreground">O cálculo é registrado na liquidação e será rateado nas ordens de pagamento posteriores.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Observações</Label>
              <Input id="notes" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Salvando..." : "Confirmar Liquidação"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
