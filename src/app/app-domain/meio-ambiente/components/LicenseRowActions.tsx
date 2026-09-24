"use client";

import { useState } from "react";
import { ActionButtons } from "./ActionButtons";
import { EditLicenseSheet } from "./EditLicenseSheet";
import { inactivateEnvLicense } from "../actions";

interface License {
  id: string;
  licenseNumber: string;
  licenseType: string;
  validUntil: Date | null;
  status: string;
}

export function LicenseRowActions({ license }: { license: License }) {
  const [editOpen, setEditOpen] = useState(false);
  return (
    <>
      <ActionButtons
        id={license.id}
        onEdit={() => setEditOpen(true)}
        onInactivate={inactivateEnvLicense}
        inactivateLabel="Suspender Licenca"
      />
      <EditLicenseSheet license={license} open={editOpen} onClose={() => setEditOpen(false)} />
    </>
  );
}
