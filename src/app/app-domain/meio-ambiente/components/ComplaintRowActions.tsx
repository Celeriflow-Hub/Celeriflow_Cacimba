"use client";

import { useState } from "react";
import { ActionButtons } from "./ActionButtons";
import { EditComplaintSheet } from "./EditComplaintSheet";
import { deleteEnvComplaint } from "../actions";

interface Complaint {
  id: string;
  complaintType: string;
  description: string;
  address: string | null;
  status: string;
}

export function ComplaintRowActions({ complaint }: { complaint: Complaint }) {
  const [editOpen, setEditOpen] = useState(false);
  return (
    <>
      <ActionButtons
        id={complaint.id}
        onEdit={() => setEditOpen(true)}
        onDelete={deleteEnvComplaint}
        deleteLabel="Excluir Denuncia"
      />
      <EditComplaintSheet complaint={complaint} open={editOpen} onClose={() => setEditOpen(false)} />
    </>
  );
}
