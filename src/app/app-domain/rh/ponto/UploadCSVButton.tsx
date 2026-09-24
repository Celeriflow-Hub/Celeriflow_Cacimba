"use client";

import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

export function UploadCSVButton() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const router = useRouter();

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    
    // Simulate API call for CSV processing
    setTimeout(() => {
      setIsUploading(false);
      alert("Arquivo CSV processado com sucesso! Espelho de ponto e banco de horas atualizados.");
      router.refresh();
    }, 1500);
  };

  return (
    <>
      <input 
        type="file" 
        accept=".csv, .txt" 
        className="hidden" 
        ref={fileInputRef} 
        onChange={handleUpload} 
      />
      <Button variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
        <Upload className="mr-2 h-4 w-4" />
        <span className="hidden sm:inline">{isUploading ? "Processando..." : "Importar Arquivo de Relógio (CSV)"}</span>
        <span className="sm:hidden">{isUploading ? "Processando" : "Importar CSV"}</span>
      </Button>
    </>
  );
}
