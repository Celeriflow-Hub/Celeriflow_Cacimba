"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function AppDomainError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("AppDomain Error:", error);
  }, [error]);

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-background p-4 text-center">
      <div className="space-y-4 max-w-md">
        <h1 className="text-4xl font-bold text-destructive">Oops!</h1>
        <h2 className="text-xl font-semibold">
          Erro Interno do Servidor
        </h2>
         <p className="text-muted-foreground">
           Ocorreu um erro inesperado ao carregar esta página. Nossa equipe foi notificada.
         </p>
          {error.digest && <p className="break-all text-xs text-muted-foreground">Referência do erro: {error.digest}</p>}
          <div className="pt-4 flex gap-4 justify-center">
          <Button onClick={() => window.location.href = "/"}>Voltar ao Início</Button>
          <Button variant="outline" onClick={() => reset()}>Tentar Novamente</Button>
        </div>
      </div>
    </div>
  );
}
