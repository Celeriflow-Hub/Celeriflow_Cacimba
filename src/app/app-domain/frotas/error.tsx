"use client";

export default function FleetPageError({ error, unstable_retry }: { error: Error & { digest?: string }; unstable_retry: () => void }) {
  return (
    <div role="alert" className="space-y-3 rounded border border-slate-300 bg-white p-5 text-sm">
      <p>Não foi possível carregar Frotas. Tente novamente; se o problema persistir, informe a referência abaixo ao administrador.</p>
      {error.digest && <p className="break-all text-xs text-slate-500">Referência do erro: {error.digest}</p>}
      <button onClick={() => unstable_retry()} className="min-h-11 rounded bg-teal-700 px-4 text-white">Tentar novamente</button>
    </div>
  );
}
