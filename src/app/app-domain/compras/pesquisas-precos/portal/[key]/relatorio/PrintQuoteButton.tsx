"use client";

export function PrintQuoteButton() {
  return <button type="button" onClick={() => window.print()} className="min-h-11 rounded-md bg-emerald-700 px-4 text-sm font-semibold text-white hover:bg-emerald-800 print:hidden">Imprimir ou salvar em PDF</button>;
}
