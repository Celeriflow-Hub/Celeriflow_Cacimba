"use client";

import { useState } from "react";
import { ActionButtons } from "./ActionButtons";
import { EditEduProgramSheet } from "./EditEduProgramSheet";
import { deleteEnvEduProgram } from "../actions";

interface EduProgram {
  id: string;
  title: string;
  description: string;
  targetAudience: string | null;
  startDate: Date;
  endDate: Date | null;
  participantsCount: number | null;
  status: string;
}

export function EduProgramRowActions({ program }: { program: EduProgram }) {
  const [editOpen, setEditOpen] = useState(false);
  return (
    <>
      <ActionButtons
        id={program.id}
        onEdit={() => setEditOpen(true)}
        onDelete={deleteEnvEduProgram}
        deleteLabel="Excluir Programa"
      />
      <EditEduProgramSheet program={program} open={editOpen} onClose={() => setEditOpen(false)} />
    </>
  );
}
