"use client";

import { useState } from "react";
import { ErpPagination } from "@/components/app-ui/erp/ErpPagination";
import { format } from "date-fns";
import { Wallet, Plus, Search, Ban } from "lucide-react";
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
import { createPayment, cancelPayment, updatePaymentStatus, reversePaymentAction, settleWithholdingPayableAction } from "./actions";

type PendingWithholding = {
  id: string;
  type: string;
  description: string | null;
  value: number;
  orderNumber: string;
  dueDate: string | null;
};

type Payment = {
  id: string;
  orderNumber: string;
  date: Date;
  value: number;
  netValue: number;
  retentionValue: number;
  paymentMethod: string;
  status: string;
  isExceptional: boolean;
  financialDocument: { id: string; number: string; title: string } | null;
  settlement: { id: string; documentRef: string | null } | null;
  commitment: {
    id: string;
    number: string;
    purchaseReceipt: { number: string } | null;
  };
  bankAccount: {
    id: string;
    bankName: string;
    agency: string;
    accountNumber: string;
  };
  supplier: {
    id: string;
    company?: { corporateName: string } | null;
    person?: { fullName: string } | null;
  };
};

type CommitmentOption = { id: string; number: string; value: number; supplierId: string; purchaseReceipt: { number: string } | null };
type SettlementOption = { id: string; commitmentId: string; documentRef: string | null; availableToPay: number };
type BankAccountOption = { id: string; bankName: string; agency: string; accountNumber: string };
type SupplierOption = { id: string; company?: { corporateName: string } | null; person?: { fullName: string } | null };

export default function PagamentosClient({
  payments,
  commitments,
  settlements,
  bankAccounts,
  suppliers,
  pendingWithholdings = [],
  receiptDocuments,
}: {
  payments: Payment[];
  commitments: CommitmentOption[];
  settlements: SettlementOption[];
  bankAccounts: BankAccountOption[];
  suppliers: SupplierOption[];
  pendingWithholdings?: PendingWithholding[];
  receiptDocuments: { id: string; title: string; documentType: string }[];
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterMonth, setFilterMonth] = useState("ALL");
  const [filterYear, setFilterYear] = useState("ALL");
  const [filterAccount, setFilterAccount] = useState("ALL");
  const [filterMethod, setFilterMethod] = useState("ALL");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRetentionModalOpen, setIsRetentionModalOpen] = useState(false);
  const [selectedBankAccountId, setSelectedBankAccountId] = useState(bankAccounts[0]?.id || "");
  const [receiptDocumentId, setReceiptDocumentId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    orderNumber: "",
    date: new Date().toISOString().substring(0, 10),
    value: 0,
    commitmentId: "",
    settlementId: "",
    bankAccountId: "",
      supplierId: "",
      paymentMethod: "Transferência",
  });

  const filteredPayments = payments.filter(p => {
    const matchesSearch = p.orderNumber.includes(searchTerm) ||
      (p.supplier.company?.corporateName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.supplier.person?.fullName || "").toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === "ALL" || p.status === filterStatus;
    const matchesAccount = filterAccount === "ALL" || p.bankAccount.id === filterAccount;
    const matchesMethod = filterMethod === "ALL" || p.paymentMethod === filterMethod;

    const d = new Date(p.date);
    const matchesMonth = filterMonth === "ALL" || (d.getMonth() + 1).toString() === filterMonth;
    const matchesYear = filterYear === "ALL" || d.getFullYear().toString() === filterYear;

    return matchesSearch && matchesStatus && matchesMonth && matchesYear && matchesAccount && matchesMethod;
  });
  const pageSize = 20;
  const pageCount = Math.max(1, Math.ceil(filteredPayments.length / pageSize));
  const pagedPayments = filteredPayments.slice((page - 1) * pageSize, page * pageSize);

  const handleOpenNew = () => {
    setFormData({
      orderNumber: "",
      date: new Date().toISOString().substring(0, 10),
      value: 0,
      commitmentId: "",
      settlementId: "",
      bankAccountId: "",
      supplierId: "",
      paymentMethod: "Transferência",
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.settlementId) {
      alert("Selecione uma liquidação ativa vinculada ao empenho.");
      return;
    }
    setIsSubmitting(true);
    try {
      const dataToSubmit = {
        orderNumber: formData.orderNumber,
        date: new Date(formData.date),
        value: formData.value,
        commitmentId: formData.commitmentId,
        settlementId: formData.settlementId,
        bankAccountId: formData.bankAccountId,
        supplierId: formData.supplierId,
        paymentMethod: formData.paymentMethod,
      };

      const result = await createPayment(dataToSubmit);
      if (result.error) throw new Error(result.error);
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error creating payment:", error);
      alert(error instanceof Error ? error.message : "Ocorreu um erro ao salvar o pagamento.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChangeStatus = async (id: string, newStatus: string) => {
    if (newStatus === "Cancelada") {
      if (window.confirm('Deseja realmente cancelar este pagamento? Esta ação não pode ser desfeita.')) {
        const result = await cancelPayment(id);
        if (result.error) alert(result.error);
      }
    } else {
      const result = await updatePaymentStatus(id, newStatus);
      if (result.error) alert(result.error);
    }
  };

  const handleReversePayment = async (id: string) => {
    const justification = window.prompt("Informe a justificativa obrigatória para o estorno do pagamento:");
    if (!justification || !justification.trim()) return;
    const result = await reversePaymentAction(id, justification.trim());
    if (result.error) alert(result.error);
  };

  const handleSettleWithholding = async (withholdingPayableId: string) => {
    if (!selectedBankAccountId) {
      alert("Selecione uma conta bancária ativa para o recolhimento.");
      return;
    }
    if (!receiptDocumentId) {
      alert("Selecione o comprovante de recolhimento cadastrado no GED.");
      return;
    }
    const result = await settleWithholdingPayableAction(withholdingPayableId, selectedBankAccountId, receiptDocumentId);
    if (result.error) alert(result.error);
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-2 overflow-hidden px-1 py-1 sm:px-2">
      <div className="flex flex-col gap-2 border-b border-slate-300 bg-white px-3 py-2 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-sm font-bold tracking-tight text-slate-900">Pagamentos</h1>
          <p className="text-xs text-muted-foreground">Ordens de pagamento e execução financeira</p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {pendingWithholdings.length > 0 && (
            <Button size="sm" variant="outline" onClick={() => setIsRetentionModalOpen(true)}>
              <Wallet className="mr-2 h-4 w-4 text-amber-500" />
              Recolher Retenções Pendentes ({pendingWithholdings.length})
            </Button>
          )}
          <Button size="sm" onClick={handleOpenNew}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Ordem de Pagamento
          </Button>
        </div>
      </div>

      <Card size="sm" className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-md shadow-none [&_[data-slot=table-container]]:min-h-0 [&_[data-slot=table-container]]:flex-1 [&_[data-slot=table-container]]:overflow-x-hidden [&_[data-slot=table-container]]:overflow-y-auto [&_[data-slot=table]]:table-fixed [&_[data-slot=table-header]]:sticky [&_[data-slot=table-header]]:top-0 [&_[data-slot=table-header]]:z-10 [&_[data-slot=table-row]]:h-[38px]">
        <CardHeader className="border-b pb-2">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <CardTitle>Listagem de Pagamentos</CardTitle>
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
                  <SelectItem value="ALL">Todos (Status)</SelectItem>
                  <SelectItem value="Emitida">Emitida</SelectItem>
                  <SelectItem value="Paga">Paga</SelectItem>
                  <SelectItem value="Cancelada">Cancelada</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterMonth} onValueChange={(val) => { setFilterMonth(val as string); setPage(1); }}>
                <SelectTrigger className="w-[100px]"><SelectValue placeholder="Mês" /></SelectTrigger>
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
              <Select value={filterAccount} onValueChange={(val) => setFilterAccount(val as string)}>
                <SelectTrigger className="w-[150px]"><SelectValue placeholder="Conta" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todas Contas</SelectItem>
                  {bankAccounts.map(b => (
                    <SelectItem key={b.id} value={b.id}>{b.bankName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterMethod} onValueChange={(val) => setFilterMethod(val as string)}>
                <SelectTrigger className="w-[130px]"><SelectValue placeholder="Forma" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todas Formas</SelectItem>
                  <SelectItem value="Transferência">Transferência</SelectItem>
                  <SelectItem value="Boleto">Boleto</SelectItem>
                  <SelectItem value="Cheque">Cheque</SelectItem>
                  <SelectItem value="PIX">PIX</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex min-h-0 flex-1 flex-col overflow-hidden pt-3">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ordem</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Fornecedor</TableHead>
                <TableHead>Empenho / recebimento</TableHead>
                <TableHead>Conta Bancária</TableHead>
                <TableHead>Forma Pgto.</TableHead>
                <TableHead>Bruto / Líquido (R$)</TableHead>
                <TableHead>Documento interno</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayments.length === 0 ? (
                <TableRow>
                    <TableCell colSpan={10} className="text-center text-muted-foreground h-32">
                    <div className="flex flex-col items-center justify-center">
                      <Wallet className="h-8 w-8 mb-2 opacity-20" />
                      Nenhum pagamento encontrado.
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                pagedPayments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-medium">{payment.orderNumber}</TableCell>
                    <TableCell>{format(new Date(payment.date), 'dd/MM/yyyy')}</TableCell>
                    <TableCell>
                      {payment.supplier.company?.corporateName || payment.supplier.person?.fullName || 'Não identificado'}
                    </TableCell>
                    <TableCell>{payment.commitment.number}{payment.commitment.purchaseReceipt && <span className="block text-xs text-muted-foreground">{payment.commitment.purchaseReceipt.number}</span>}</TableCell>
                    <TableCell>
                      {payment.bankAccount.bankName} - Ag: {payment.bankAccount.agency} Cc: {payment.bankAccount.accountNumber}
                    </TableCell>
                    <TableCell>{payment.paymentMethod}</TableCell>
                    <TableCell>
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(payment.value)}
                      {(payment.retentionValue > 0 || payment.netValue !== payment.value) && <span className="block text-xs text-muted-foreground">Líquido: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(payment.netValue)}{payment.retentionValue > 0 ? ` | Retido: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(payment.retentionValue)}` : ''}</span>}
                      {payment.isExceptional && <span className="block text-xs text-amber-600">Exceção justificada</span>}
                    </TableCell>
                    <TableCell className="text-sm">{payment.financialDocument?.number || "-"}</TableCell>
                    <TableCell>
                      <Badge variant={
                        payment.status === 'Paga' ? 'default' :
                        payment.status === 'Emitida' ? 'secondary' :
                        payment.status === 'Cancelada' ? 'destructive' :
                        'outline'
                      }>
                        {payment.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right flex justify-end gap-2">
                      {payment.status === 'Paga' && (
                        <Button variant="outline" size="sm" onClick={() => handleReversePayment(payment.id)} title="Estornar Pagamento Pago">
                          Estornar
                        </Button>
                      )}
                      {payment.status === 'Emitida' && (
                        <Button variant="ghost" size="icon" onClick={() => handleChangeStatus(payment.id, 'Cancelada')} title="Cancelar Pagamento">
                          <Ban className="h-4 w-4 text-rose-500" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
              <ErpPagination page={Math.min(page, pageCount)} total={filteredPayments.length} pageSize={pageSize} previousHref="#" nextHref="#" onPageChange={setPage} />
</Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Nova Ordem de Pagamento</DialogTitle>
            <DialogDescription>Crie uma ordem de pagamento vinculada a um empenho.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="orderNumber">Número da Ordem</Label>
                <Input id="orderNumber" required value={formData.orderNumber} onChange={e => setFormData({...formData, orderNumber: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Data do Pagamento</Label>
                <Input id="date" type="date" required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="paymentMethod">Forma de Pagamento</Label>
                <Select value={formData.paymentMethod} onValueChange={v => setFormData({...formData, paymentMethod: v as string})}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Transferência">Transferência</SelectItem>
                    <SelectItem value="Boleto">Boleto</SelectItem>
                    <SelectItem value="Cheque">Cheque</SelectItem>
                    <SelectItem value="PIX">PIX</SelectItem>
                  </SelectContent>
                </Select>
              </div>
                <div className="space-y-2">
                  <Label htmlFor="value">Valor (R$)</Label>
                  <MoneyInput id="value" required value={formData.value} onChange={val => setFormData({...formData, value: val})} />
                </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="supplierId">Fornecedor / Credor</Label>
              <Select value={formData.supplierId} onValueChange={v => setFormData({...formData, supplierId: v as string})}>
                <SelectTrigger><SelectValue placeholder="Selecione o fornecedor" /></SelectTrigger>
                <SelectContent>
                  {suppliers.map(s => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.company?.corporateName || s.person?.fullName || 'Fornecedor Sem Nome'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="commitmentId">Empenho de Referência</Label>
              <Select value={formData.commitmentId} onValueChange={v => {
                const commitment = commitments.find(c => c.id === v);
                setFormData({...formData, commitmentId: v as string, settlementId: "", supplierId: commitment?.supplierId ?? formData.supplierId});
              }}>
                <SelectTrigger><SelectValue placeholder="Selecione o empenho" /></SelectTrigger>
                <SelectContent>
                  {commitments.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.number}{c.purchaseReceipt ? ` · ${c.purchaseReceipt.number}` : ""} - Saldo: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(c.value)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="settlementId">Liquidação de Referência *</Label>
              <Select value={formData.settlementId} onValueChange={v => setFormData({...formData, settlementId: v as string})}>
                <SelectTrigger><SelectValue placeholder="Selecione a liquidação" /></SelectTrigger>
                <SelectContent>
                  {settlements.filter(s => !formData.commitmentId || s.commitmentId === formData.commitmentId).map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.documentRef || "Liquidação"} - Saldo: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(s.availableToPay)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <p className="text-xs text-muted-foreground">As retenções são calculadas na liquidação selecionada e rateadas automaticamente nesta ordem de pagamento.</p>

            <div className="space-y-2">
              <Label htmlFor="bankAccountId">Conta Bancária Pagadora</Label>
              <Select value={formData.bankAccountId} onValueChange={v => setFormData({...formData, bankAccountId: v as string})}>
                <SelectTrigger><SelectValue placeholder="Selecione a conta" /></SelectTrigger>
                <SelectContent>
                  {bankAccounts.map(b => (
                    <SelectItem key={b.id} value={b.id}>{b.bankName} (Ag: {b.agency} Cc: {b.accountNumber})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Salvando..." : "Confirmar Pagamento"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isRetentionModalOpen} onOpenChange={setIsRetentionModalOpen}>
        <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Recolhimento de Retenções Tributárias</DialogTitle>
            <DialogDescription>Selecione a conta bancária e confirme a quitação da retenção tributária / consignação.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Conta Bancária para Débito do Recolhimento</Label>
              <Select value={selectedBankAccountId} onValueChange={(v) => setSelectedBankAccountId(v as string)}>
                <SelectTrigger><SelectValue placeholder="Selecione a conta" /></SelectTrigger>
                <SelectContent>
                  {bankAccounts.map(b => (
                    <SelectItem key={b.id} value={b.id}>{b.bankName} (Ag: {b.agency} Cc: {b.accountNumber})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Comprovante de Recolhimento (GED)</Label>
              <Select value={receiptDocumentId} onValueChange={(v) => setReceiptDocumentId(v as string)}>
                <SelectTrigger><SelectValue placeholder="Selecione o comprovante válido" /></SelectTrigger>
                <SelectContent>
                  {receiptDocuments.map((document) => <SelectItem key={document.id} value={document.id}>{document.title} ({document.documentType})</SelectItem>)}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">O recolhimento gera um registro interno vinculado a este comprovante, à retenção e à ordem de pagamento de origem.</p>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ordem</TableHead>
                  <TableHead>Tipo / Descrição</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead className="text-right">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingWithholdings.map((pw) => (
                  <TableRow key={pw.id}>
                    <TableCell className="font-medium">{pw.orderNumber}</TableCell>
                    <TableCell>
                      <strong>{pw.type}</strong>
                      {pw.description && <span className="block text-xs text-muted-foreground">{pw.description}</span>}
                    </TableCell>
                    <TableCell>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(pw.value)}</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" onClick={() => handleSettleWithholding(pw.id)}>
                        Recolher
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRetentionModalOpen(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
