"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PrintInstrumentReportButton() {
  return <Button type="button" variant="outline" size="sm" onClick={() => window.print()}><Printer className="size-3.5" />Imprimir</Button>;
}
