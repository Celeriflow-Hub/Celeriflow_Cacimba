"use client";

import { useState, useRef } from "react";
import { Download, Upload, Loader2 } from "lucide-react";

interface ImportExportDropdownProps {
  onExport?: () => void;
  onImport?: (file: File) => void;
  isLoading?: boolean;
}

export function ImportExportDropdown({ onExport, onImport, isLoading = false }: ImportExportDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    setIsOpen(false);
    if (onExport) onExport();
  };

  const handleImportClick = () => {
    setIsOpen(false);
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onImport) {
      onImport(file);
    }
    // Reset the input so the same file can be selected again if needed
    if (e.target) {
      e.target.value = '';
    }
  };

  return (
    <div className="relative inline-block text-left">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
        className="px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-semibold rounded-lg shadow-sm flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
        Ações em Lote
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          ></div>
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-100 z-20 py-1 origin-top-right animate-in fade-in zoom-in-95 duration-100">
            <button
              onClick={handleExport}
              className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors"
            >
              <Download className="w-4 h-4 text-slate-400" />
              Baixar Planilha (CSV)
            </button>
            <button
              onClick={handleImportClick}
              className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors"
            >
              <Upload className="w-4 h-4 text-slate-400" />
              Importar Planilha
            </button>
          </div>
        </>
      )}

      {/* Hidden file input for import */}
      <input
        type="file"
        accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileChange}
      />
    </div>
  );
}
