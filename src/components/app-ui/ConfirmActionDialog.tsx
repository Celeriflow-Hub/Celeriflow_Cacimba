"use client";

import { cloneElement, type ReactElement, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type ConfirmActionDialogProps = {
  trigger: ReactElement<{ onClick?: () => void }>;
  title: string;
  description: string;
  confirmLabel: string;
  action: () => Promise<{ error?: string }>;
  destructive?: boolean;
};

export function ConfirmActionDialog({ trigger, title, description, confirmLabel, action, destructive = false }: ConfirmActionDialogProps) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function confirm() {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (result.error) {
        setError(result.error);
        return;
      }
      setOpen(false);
    });
  }

  return (
    <>
      {cloneElement(trigger, { onClick: () => setOpen(true) })}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent showCloseButton={!isPending}>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          {error && <p role="alert" className="rounded border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" disabled={isPending} onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="button" variant={destructive ? "destructive" : "default"} disabled={isPending} onClick={confirm}>{isPending ? "Confirmando..." : confirmLabel}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
