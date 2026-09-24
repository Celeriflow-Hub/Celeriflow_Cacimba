"use client";

import { useState } from "react";
import { ActionButtons } from "./ActionButtons";
import { EditGreenAreaSheet } from "./EditGreenAreaSheet";
import { inactivateEnvGreenArea } from "../actions";

interface GreenArea {
  id: string;
  name: string;
  areaType: string;
  sizeSqm: number | null;
  location: string | null;
  status: string;
  notes: string | null;
}

export function GreenAreaRowActions({ area }: { area: GreenArea }) {
  const [editOpen, setEditOpen] = useState(false);
  return (
    <>
      <ActionButtons
        id={area.id}
        onEdit={() => setEditOpen(true)}
        onInactivate={inactivateEnvGreenArea}
        inactivateLabel="Marcar como Degradado"
      />
      <EditGreenAreaSheet area={area} open={editOpen} onClose={() => setEditOpen(false)} />
    </>
  );
}
