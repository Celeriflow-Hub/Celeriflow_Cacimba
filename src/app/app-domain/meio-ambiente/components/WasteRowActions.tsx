"use client";

import { useState } from "react";
import { ActionButtons } from "./ActionButtons";
import { EditWasteSheet } from "./EditWasteSheet";
import { deleteEnvWaste } from "../actions";

interface Waste {
  id: string;
  generatorName: string;
  wasteType: string;
  quantityKg: number;
  destination: string;
  notes: string | null;
  enterpriseId: string | null;
}

export function WasteRowActions({ waste, enterprises }: { waste: Waste; enterprises: { id: string; name: string }[] }) {
  const [editOpen, setEditOpen] = useState(false);
  return (
    <>
      <ActionButtons
        id={waste.id}
        onEdit={() => setEditOpen(true)}
        onDelete={deleteEnvWaste}
        deleteLabel="Excluir Registro"
      />
      <EditWasteSheet waste={waste} enterprises={enterprises} open={editOpen} onClose={() => setEditOpen(false)} />
    </>
  );
}
