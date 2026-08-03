"use client";

import { useState } from "react";
import ArchivedClients from "./ArchivedClients";
import ArchivedMeasurements from "./ArchivedMeasurements";
import ClientDeletion from "./ClientDeletion";
import KneeDashboard from "./KneeDashboard";
import TindeqClientRecords from "./TindeqClientRecords";
import type { SelectedClient } from "./selected-client";

export default function KneeApp() {
  const [selectedClient, setSelectedClient] = useState<SelectedClient>(null);

  return (
    <>
      <KneeDashboard onSelectedClientChange={setSelectedClient} />
      <TindeqClientRecords selectedClient={selectedClient} />
      <ArchivedClients />
      <ClientDeletion selectedClient={selectedClient} />
      <ArchivedMeasurements selectedClient={selectedClient} />
    </>
  );
}
