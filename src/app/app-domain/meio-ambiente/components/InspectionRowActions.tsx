"use client";

import { useState } from "react";
import { ActionButtons } from "./ActionButtons";
import { EditInspectionSheet } from "./EditInspectionSheet";
import { deleteEnvInspection } from "../actions";

interface Inspection {
  id: string;
  dateScheduled: Date | null;
  inspector: string | null;
  notes: string | null;
  status: string;
  enterpriseId: string | null;
}

export function InspectionRowActions({ inspection, enterprises }: { inspection: Inspection; enterprises: { id: string; name: string }[] }) {
  const [editOpen, setEditOpen] = useState(false);
  return (
    <>
      <ActionButtons
        id={inspection.id}
        onEdit={() => setEditOpen(true)}
        onDelete={deleteEnvInspection}
        deleteLabel="Excluir Vistoria"
      />
      <EditInspectionSheet inspection={inspection} enterprises={enterprises} open={editOpen} onClose={() => setEditOpen(false)} />
    </>
  );
}
