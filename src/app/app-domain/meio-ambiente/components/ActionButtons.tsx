"use client";

import { useState, useTransition } from "react";
import { Pencil, Trash2, Ban, Loader2 } from "lucide-react";

interface ActionButtonsProps {
  id: string;
  /** Callback chamado quando usuario clica em Editar. Abre o sheet externamente. */
  onEdit?: () => void;
  /** Action de excluir permanentemente */
  onDelete?: (id: string) => Promise<{ success?: boolean; error?: string }>;
  /** Action de inativar (muda status, nao exclui) */
  onInactivate?: (id: string) => Promise<{ success?: boolean; error?: string }>;
  deleteLabel?: string;
  inactivateLabel?: string;
}

export function ActionButtons({
  id,
  onEdit,
  onDelete,
  onInactivate,
  deleteLabel = "Excluir",
  inactivateLabel = "Inativar",
}: ActionButtonsProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const handleAction = (action: (id: string) => Promise<{ success?: boolean; error?: string }>, label: string) => {
    if (!confirm(`Tem certeza que deseja ${label.toLowerCase()} este registro?`)) return;
    setError("");
    startTransition(async () => {
      const result = await action(id);
      if (result?.error) setError(result.error);
    });
  };

  return (
    <div className="flex items-center justify-end gap-1">
      {error && <span className="text-xs text-red-600 max-w-[140px] text-right mr-1">{error}</span>}

      {/* Editar */}
      {onEdit && (
        <button
          onClick={onEdit}
          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
          title="Editar"
          aria-label="Editar registro"
          type="button"
        >
          <Pencil className="w-4 h-4" />
        </button>
      )}

      {/* Inativar */}
      {onInactivate && (
        <button
          onClick={() => handleAction(onInactivate, inactivateLabel)}
          disabled={isPending}
          className="p-1.5 text-amber-600 hover:bg-amber-50 rounded transition-colors disabled:opacity-40"
          title={inactivateLabel}
          aria-label={inactivateLabel}
          type="button"
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ban className="w-4 h-4" />}
        </button>
      )}

      {/* Excluir */}
      {onDelete && (
        <button
          onClick={() => handleAction(onDelete, deleteLabel)}
          disabled={isPending}
          className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-40"
          title={deleteLabel}
          aria-label={deleteLabel}
          type="button"
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
        </button>
      )}
    </div>
  );
}
