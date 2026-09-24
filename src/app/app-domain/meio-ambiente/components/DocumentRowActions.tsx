"use client";

import { useState } from "react";
import { ActionButtons } from "./ActionButtons";
import { EditDocumentSheet } from "./EditDocumentSheet";
import { deleteEnvDocument } from "../actions";

interface EnvDoc {
  id: string;
  title: string;
  docType: string;
  enterpriseId: string | null;
}

export function DocumentRowActions({ doc, enterprises }: { doc: EnvDoc; enterprises: { id: string; name: string }[] }) {
  const [editOpen, setEditOpen] = useState(false);
  return (
    <>
      <ActionButtons
        id={doc.id}
        onEdit={() => setEditOpen(true)}
        onDelete={deleteEnvDocument}
        deleteLabel="Excluir Documento"
      />
      <EditDocumentSheet doc={doc} enterprises={enterprises} open={editOpen} onClose={() => setEditOpen(false)} />
    </>
  );
}
