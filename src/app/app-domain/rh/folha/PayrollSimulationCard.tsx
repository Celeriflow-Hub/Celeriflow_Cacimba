"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calculator, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { processPayroll } from "./actions";

export function PayrollSimulationCard({ payrollId, status }: { payrollId: string, status: string }) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleProcess = async () => {
    if (confirm("Deseja simular/processar esta folha? Os cálculos serão gerados com base no salário e benefícios atuais dos servidores. Itens gerados anteriormente para esta competência serão sobrescritos.")) {
      setIsProcessing(true);
      const result = await processPayroll(payrollId);
      setIsProcessing(false);
      
      if (!result.success) {
        alert(result.error);
      }
    }
  };

  return (
    <Card size="sm" className="mt-1 rounded-md border-blue-200 shadow-none dark:border-blue-900">
      <CardHeader className="border-b bg-blue-50/50 pb-2">
        <CardTitle className="text-blue-800 flex items-center">
          <Calculator className="w-5 h-5 mr-2" />
          Simulação e Processamento
        </CardTitle>
        <CardDescription>
          Calcule automaticamente os vencimentos e descontos para todos os servidores ativos com base nas regras cadastradas (Salário Base e Benefícios).
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center space-y-3 pt-3">
        {status === "Fechada" || status === "Paga" ? (
          <div className="flex flex-col items-center justify-center p-4 text-emerald-700 bg-emerald-50 rounded-lg w-full">
            <CheckCircle2 className="h-8 w-8 mb-2" />
            <p className="font-semibold">Folha já processada e consolidada.</p>
            <p className="text-sm">Para recalcular, reabra a folha mudando seu status.</p>
          </div>
        ) : (
          <Button 
            size="lg" 
            className="w-full max-w-sm" 
            onClick={handleProcess}
            disabled={isProcessing}
          >
            {isProcessing ? "Processando Cálculos..." : "Gerar Simulação de Folha"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
