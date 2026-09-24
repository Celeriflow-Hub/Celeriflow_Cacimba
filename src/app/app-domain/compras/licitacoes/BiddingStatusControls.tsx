"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { transitionBiddingStatus } from "./actions";

type BiddingStatusControlsProps = {
  id: string;
  currentStatus: string;
  allowedStatuses: string[];
};

export function BiddingStatusControls({ id, currentStatus, allowedStatuses }: BiddingStatusControlsProps) {
  const router = useRouter();
  const [selectedStatus, setSelectedStatus] = useState(allowedStatuses[0] ?? "");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleTransition() {
    if (!selectedStatus) return;
    setError("");
    startTransition(async () => {
      const result = await transitionBiddingStatus(id, selectedStatus);
      if (!result.success) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  if (!allowedStatuses.length) {
    return <p className="text-sm text-muted-foreground">Não há transições disponíveis para a situação atual.</p>;
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="bidding-next-status">Alterar situação de {currentStatus}</Label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Select value={selectedStatus} onValueChange={(value) => setSelectedStatus(value ?? "")}>
          <SelectTrigger id="bidding-next-status" className="w-full sm:max-w-xs">
            <SelectValue placeholder="Selecione a próxima situação" />
          </SelectTrigger>
          <SelectContent>
            {allowedStatuses.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button type="button" onClick={handleTransition} disabled={isPending || !selectedStatus}>
          {isPending ? <LoaderCircle className="size-4 animate-spin" /> : <ArrowRight className="size-4" />}
          {isPending ? "Atualizando" : "Confirmar transição"}
        </Button>
      </div>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
