"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { approvePurchaseRequest } from "./actions";

export function ApprovePurchaseRequestButton({ id }: { id: string }) {
  const [pending, setPending] = useState(false);

  async function approve() {
    setPending(true);
    const result = await approvePurchaseRequest(id);
    setPending(false);
    if (!result.success) window.alert(result.error);
    else window.location.reload();
  }

  return <Button onClick={approve} disabled={pending}><Check className="mr-2 h-4 w-4" />{pending ? "Aprovando..." : "Aprovar solicitação"}</Button>;
}
