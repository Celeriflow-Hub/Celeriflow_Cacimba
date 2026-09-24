"use client";

import { useState } from "react";
import { ActionButtons } from "./ActionButtons";
import { EditEnterpriseSheet } from "./EditEnterpriseSheet";
import { inactivateEnvEnterprise } from "../actions";

interface Enterprise {
  id: string;
  name: string;
  cnpjCpf: string | null;
  activityType: string | null;
  potentialRisk: string | null;
  address: string | null;
  status: string;
}

export function EnterpriseRowActions({ enterprise }: { enterprise: Enterprise }) {
  const [editOpen, setEditOpen] = useState(false);
  return (
    <>
      <ActionButtons
        id={enterprise.id}
        onEdit={() => setEditOpen(true)}
        onInactivate={inactivateEnvEnterprise}
        inactivateLabel="Inativar"
      />
      <EditEnterpriseSheet enterprise={enterprise} open={editOpen} onClose={() => setEditOpen(false)} />
    </>
  );
}
