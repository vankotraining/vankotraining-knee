"use client";

import { useState } from "react";
import ArchivedClients from "./ArchivedClients";
import ArchivedMeasurements from "./ArchivedMeasurements";
import ClientDeletion from "./ClientDeletion";
import KneeDashboard from "./KneeDashboard";
import type { SelectedClient } from "./selected-client";

export default function KneeApp() {
  const [selectedClient, setSelectedClient] = useState<SelectedClient>(null);

  return (
    <>
      <KneeDashboard onSelectedClientChange={setSelectedClient} />
      <ArchivedClients />
      <ClientDeletion selectedClient={selectedClient} />
      <ArchivedMeasurements selectedClient={selectedClient} />
    </>
  );
}
