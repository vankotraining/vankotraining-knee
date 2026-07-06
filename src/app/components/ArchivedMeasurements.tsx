"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createBrowserSupabaseClient,
  hasSupabaseConfig,
} from "@/lib/supabase-browser";

type SelectedClient = {
  id: string;
  name: string;
} | null;

type ArchivedMeasurement = {
  id: string;
  athlete_id: string;
  athlete_display_name: string;
  test_date: string | null;
  right_force_kg: string | null;
  left_force_kg: string | null;
  asymmetry_pct: string | null;
  deleted_at: string | null;
  delete_reason: string | null;
  deleted_context: string | null;
};

function readSelectedClient(): SelectedClient {
  const selects = Array.from(document.querySelectorAll("select"));
  const clientSelect = selects.find((select) => select.value && select.selectedOptions[0]);
  const selectedOption = clientSelect?.selectedOptions[0];

  if (!clientSelect?.value || !selectedOption) return null;

  return {
    id: clientSelect.value,
    name: selectedOption.textContent?.trim() || "vybraneho klienta",
  };
}

function isSameClient(left: SelectedClient, right: SelectedClient) {
  return left?.id === right?.id && left?.name === right?.name;
}

function isMissingRpcSignature(error: { code?: string; message?: string } | null) {
  return (
    error?.code === "PGRST202" ||
    Boolean(error?.message?.toLowerCase().includes("could not find the function"))
  );
}

function formatDate(value: string | null | undefined) {
  if (!value) return "-";

  const date = new Date(value.includes("T") ? value : `${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("cs-CZ").format(date);
}

function formatNumber(value: string | null | undefined, suffix = "") {
  if (!value) return "-";

  const number = Number(value);
  if (!Number.isFinite(number)) return value;

  return `${number.toFixed(1)}${suffix}`;
}

export default function ArchivedMeasurements() {
  const [selectedClient, setSelectedClient] = useState<SelectedClient>(null);
  const [archivedMeasurements, setArchivedMeasurements] = useState<ArchivedMeasurement[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const supabase = useMemo(
    () => (hasSupabaseConfig() ? createBrowserSupabaseClient() : null),
    [],
  );

  const loadArchivedMeasurements = useCallback(async (athleteId: string) => {
    if (!supabase) return;

    setIsLoading(true);
    setMessage("");

    const { data, error } = await supabase.rpc("list_archived_knee_extension_tests", {
      p_athlete_id: athleteId,
    });

    setIsLoading(false);

    if (error) {
      setArchivedMeasurements([]);
      setMessage(
        isMissingRpcSignature(error)
          ? "Archiv obnovy jeste neni aktivni. Spust migraci archived_measurements_restore."
          : error.message,
      );
      return;
    }

    setArchivedMeasurements((data ?? []) as ArchivedMeasurement[]);
  }, [supabase]);

  useEffect(() => {
    const syncSelectedClient = () => {
      const nextClient = readSelectedClient();
      setSelectedClient((currentClient) => isSameClient(currentClient, nextClient) ? currentClient : nextClient);
    };
    const observer = new MutationObserver(syncSelectedClient);

    syncSelectedClient();
    document.addEventListener("change", syncSelectedClient, true);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });

    return () => {
      document.removeEventListener("change", syncSelectedClient, true);
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!selectedClient?.id) {
      setArchivedMeasurements([]);
      setMessage("");
      return;
    }

    void loadArchivedMeasurements(selectedClient.id);
  }, [loadArchivedMeasurements, selectedClient?.id]);

  async function handleRestore(measurement: ArchivedMeasurement) {
    if (!supabase || restoringId) return;

    const confirmed = window.confirm(
      `Obnovit mereni z ${formatDate(measurement.test_date)} pro klienta ${measurement.athlete_display_name}?`,
    );

    if (!confirmed) return;

    setRestoringId(measurement.id);
    setMessage("");

    const { error } = await supabase.rpc("restore_knee_extension_test", {
      p_test_id: measurement.id,
    });

    setRestoringId(null);

    if (error) {
      setMessage(error.message);
      return;
    }

    setArchivedMeasurements((current) => current.filter((item) => item.id !== measurement.id));
    setMessage("Mereni je obnovene. Stranku obnovim, aby se vratilo do prehledu.");
    window.location.reload();
  }

  if (!supabase || !selectedClient) return null;

  return (
    <section
      aria-label="Archiv mereni"
      style={{
        margin: "0 auto 56px",
        maxWidth: "1280px",
        padding: "0 14px",
      }}
    >
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #dfe4d8",
          borderRadius: "8px",
          padding: "12px",
        }}
      >
        <div
          style={{
            alignItems: "center",
            display: "flex",
            gap: "10px",
            justifyContent: "space-between",
          }}
        >
          <div style={{ minWidth: 0 }}>
            <span style={{ color: "#23604a", display: "block", fontSize: "12px", fontWeight: 800, textTransform: "uppercase" }}>
              Archiv mereni
            </span>
            <strong style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {selectedClient.name}
            </strong>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button className="ghost-button" type="button" onClick={() => void loadArchivedMeasurements(selectedClient.id)}>
              Obnovit seznam
            </button>
            <button type="button" onClick={() => setIsOpen((current) => !current)}>
              {isOpen ? "Zavrit" : `Otevrit (${archivedMeasurements.length})`}
            </button>
          </div>
        </div>

        {message ? <p className={message.includes("neni aktivni") ? "status error" : "status"} style={{ marginTop: "8px" }}>{message}</p> : null}
        {isLoading ? <p className="status" style={{ marginTop: "8px" }}>Nacitam archiv...</p> : null}

        {isOpen ? (
          <div style={{ display: "grid", gap: "8px", marginTop: "12px" }}>
            {archivedMeasurements.length === 0 && !isLoading ? <p className="status">Pro vybraneho klienta neni zadne archivovane mereni.</p> : null}
            {archivedMeasurements.map((measurement) => (
              <article
                key={measurement.id}
                style={{
                  alignItems: "center",
                  background: "#f6f7f4",
                  border: "1px solid #dfe4d8",
                  borderRadius: "8px",
                  display: "grid",
                  gap: "10px",
                  gridTemplateColumns: "minmax(0, 1fr) auto",
                  padding: "10px",
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <strong>{formatDate(measurement.test_date)}</strong>
                  <p className="status" style={{ fontSize: "13px" }}>
                    Leva {formatNumber(measurement.left_force_kg, " kg")} | Prava {formatNumber(measurement.right_force_kg, " kg")} | Asym {formatNumber(measurement.asymmetry_pct, " %")}
                  </p>
                  <p className="status" style={{ fontSize: "12px" }}>
                    Archivovano {formatDate(measurement.deleted_at)}
                  </p>
                </div>
                <button disabled={restoringId === measurement.id} type="button" onClick={() => void handleRestore(measurement)}>
                  {restoringId === measurement.id ? "Obnovuji..." : "Obnovit"}
                </button>
              </article>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
