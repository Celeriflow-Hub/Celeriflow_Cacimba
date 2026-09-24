"use client";

import { useState } from "react";
import { ArrowRightLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MoneyInput } from "@/components/ui/MoneyInput";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createTreasuryTransferAction } from "./actions";

type BankAccountOption = {
  id: string;
  bankName: string;
  agency: string;
  accountNumber: string;
  isActive: boolean;
};

type TreasuryTransfer = {
  id: string;
  date: string;
  value: number;
  history: string | null;
  sourceBankAccount: BankAccountOption;
  destinationBankAccount: BankAccountOption;
};

const formatMoney = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
const accountLabel = (account: BankAccountOption) => `${account.bankName} - Ag. ${account.agency} / ${account.accountNumber}`;

export default function TreasuryTransferSection({ accounts, transfers }: { accounts: BankAccountOption[]; transfers: TreasuryTransfer[] }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().slice(0, 10),
    value: 0,
    sourceBankAccountId: "",
    destinationBankAccountId: "",
    history: "",
  });
  const activeAccounts = accounts.filter((account) => account.isActive);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    const result = await createTreasuryTransferAction(formData);
    setIsSubmitting(false);
    if (result.error) {
      alert(result.error);
      return;
    }
    setFormData({
      date: new Date().toISOString().slice(0, 10),
      value: 0,
      sourceBankAccountId: "",
      destinationBankAccountId: "",
      history: "",
    });
  }

  return (
    <Card size="sm" className="rounded-md shadow-none">
      <CardHeader className="border-b pb-2">
        <CardTitle className="flex items-center gap-2"><ArrowRightLeft className="h-5 w-5" />Transferência entre contas</CardTitle>
        <CardDescription>Movimente valores entre contas acessíveis com a mesma fonte de recursos.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 pt-3">
        <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="transfer-date">Data</Label>
            <Input id="transfer-date" type="date" required value={formData.date} onChange={(event) => setFormData({ ...formData, date: event.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="transfer-value">Valor</Label>
            <MoneyInput id="transfer-value" required value={formData.value} onChange={(value) => setFormData({ ...formData, value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="source-bank-account">Conta de origem</Label>
            <Select value={formData.sourceBankAccountId} onValueChange={(value) => setFormData({ ...formData, sourceBankAccountId: value as string })}>
              <SelectTrigger id="source-bank-account"><SelectValue placeholder="Selecione a conta" /></SelectTrigger>
              <SelectContent>{activeAccounts.map((account) => <SelectItem key={account.id} value={account.id}>{accountLabel(account)}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="destination-bank-account">Conta de destino</Label>
            <Select value={formData.destinationBankAccountId} onValueChange={(value) => setFormData({ ...formData, destinationBankAccountId: value as string })}>
              <SelectTrigger id="destination-bank-account"><SelectValue placeholder="Selecione a conta" /></SelectTrigger>
              <SelectContent>{activeAccounts.map((account) => <SelectItem key={account.id} value={account.id}>{accountLabel(account)}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="transfer-history">Histórico</Label>
            <Input id="transfer-history" maxLength={500} value={formData.history} onChange={(event) => setFormData({ ...formData, history: event.target.value })} placeholder="Motivo ou referência da transferência" />
          </div>
          <div className="flex justify-end sm:col-span-2">
            <Button type="submit" disabled={isSubmitting || activeAccounts.length < 2}>{isSubmitting ? "Transferindo..." : "Registrar transferência"}</Button>
          </div>
        </form>

        <div className="space-y-3">
          <h3 className="font-semibold">Transferências recentes</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Origem</TableHead>
                <TableHead>Destino</TableHead>
                <TableHead>Histórico</TableHead>
                <TableHead className="text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transfers.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="h-20 text-center text-muted-foreground">Nenhuma transferência registrada.</TableCell></TableRow>
              ) : transfers.map((transfer) => (
                <TableRow key={transfer.id}>
                  <TableCell>{new Date(transfer.date).toLocaleDateString("pt-BR", { timeZone: "UTC" })}</TableCell>
                  <TableCell>{accountLabel(transfer.sourceBankAccount)}</TableCell>
                  <TableCell>{accountLabel(transfer.destinationBankAccount)}</TableCell>
                  <TableCell>{transfer.history || "-"}</TableCell>
                  <TableCell className="text-right font-medium">{formatMoney(transfer.value)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
