"use client";

import { useEffect, useMemo, useState } from "react";
import {
  createBrowserSupabaseClient,
  hasSupabaseConfig,
} from "@/lib/supabase-browser";

type SelectedClient = {
  id: string;
  name: string;
} | null;

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

function isMissingRpcSignature(error: { code?: string; message?: string } | null) {
  return (
    error?.code === "PGRST202" ||
    Boolean(error?.message?.toLowerCase().includes("could not find the function"))
  );
}

export default function ClientDeletion() {
  const [selectedClient, setSelectedClient] = useState<SelectedClient>(null);
  const [message, setMessage] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const supabase = useMemo(
    () => (hasSupabaseConfig() ? createBrowserSupabaseClient() : null),
    [],
  );

  useEffect(() => {
    const syncSelectedClient = () => setSelectedClient(readSelectedClient());
    const observer = new MutationObserver(syncSelectedClient);

    syncSelectedClient();
    document.addEventListener("change", syncSelectedClient, true);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });

    return () => {
      document.removeEventListener("change", syncSelectedClient, true);
      observer.disconnect();
    };
  }, []);

  async function handleDeleteClient() {
    if (!supabase || !selectedClient || isDeleting) return;

    const confirmed = window.confirm(
      `Opravdu archivovat klienta ${selectedClient.name}?\n\nKlient a jeho knee mereni se skryji z aplikace, ale zustanou bezpecne ulozene v databazi.`,
    );

    if (!confirmed) return;

    setIsDeleting(true);
    setMessage("");

    let { error } = await supabase.rpc("soft_delete_athlete", {
      p_athlete_id: selectedClient.id,
      p_reason: "Archived from knee app",
    });

    if (isMissingRpcSignature(error)) {
      const fallback = await supabase.rpc("soft_delete_athlete", {
        p_id: selectedClient.id,
      });
      error = fallback.error;
    }

    setIsDeleting(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Klient je archivovany.");
    window.location.reload();
  }

  if (!selectedClient) return null;

  return (
    <section
      aria-label="Archivace klienta"
      style={{
        margin: "0 auto 56px",
        maxWidth: "1280px",
        padding: "0 14px",
      }}
    >
      <div
        style={{
          alignItems: "center",
          background: "#fff8f7",
          border: "1px solid rgba(155, 44, 44, 0.22)",
          borderRadius: "8px",
          display: "flex",
          gap: "10px",
          justifyContent: "space-between",
          padding: "10px 12px",
        }}
      >
        <div style={{ minWidth: 0 }}>
          <span style={{ color: "#687063", display: "block", fontSize: "12px", fontWeight: 800, textTransform: "uppercase" }}>
            Archivace klienta
          </span>
          <strong style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {selectedClient.name}
          </strong>
        </div>
        <button
          disabled={isDeleting}
          type="button"
          onClick={handleDeleteClient}
          style={{
            background: "#9b2c2c",
            color: "#fff",
            minHeight: "38px",
            padding: "8px 11px",
            whiteSpace: "nowrap",
          }}
        >
          {isDeleting ? "Archivuji..." : "Archivovat"}
        </button>
      </div>
      {message ? <p className="status error" style={{ marginTop: "8px" }}>{message}</p> : null}
    </section>
  );
}
