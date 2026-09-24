"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UploadCloud, CheckCircle, Loader2 } from "lucide-react";

interface FileUploadProps {
  name: string;
  defaultValue?: string | null;
  onUploadSuccess?: (url: string) => void;
}

export function FileUpload({ name, defaultValue, onUploadSuccess }: FileUploadProps) {
  const [fileUrl, setFileUrl] = useState<string | null>(defaultValue || null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Erro ao fazer upload");
      }

      const data = await response.json();
      setFileUrl(data.url);
      if (onUploadSuccess) onUploadSuccess(data.url);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Erro ao fazer upload");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <input type="hidden" name={name} value={fileUrl || ""} />
      
      <div className="flex items-center gap-4">
        <Button 
          type="button" 
          variant="outline" 
          onClick={() => document.getElementById(`file-upload-${name}`)?.click()}
          disabled={isUploading}
        >
          {isUploading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <UploadCloud className="h-4 w-4 mr-2" />
          )}
          {isUploading ? "Enviando..." : "Selecionar Arquivo"}
        </Button>
        <Input 
          id={`file-upload-${name}`}
          type="file" 
          className="hidden" 
          onChange={handleFileChange}
        />
        
        {fileUrl && !isUploading && (
          <div className="flex items-center text-sm text-emerald-600">
            <CheckCircle className="h-4 w-4 mr-1" />
            Upload concluído
            <a href={fileUrl} target="_blank" rel="noreferrer" className="ml-2 text-blue-600 hover:underline">
              Ver
            </a>
          </div>
        )}

        {error && (
          <div className="text-sm text-red-600">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
