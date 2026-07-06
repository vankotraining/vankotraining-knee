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
        alignItems: "center",
        background: "#fff8f7",
        border: "1px solid rgba(155, 44, 44, 0.28)",
        borderRadius: "8px",
        bottom: "calc(74px + env(safe-area-inset-bottom))",
        boxShadow: "0 12px 28px rgba(22, 26, 21, 0.12)",
        display: "grid",
        gap: "10px",
        gridTemplateColumns: "minmax(0, 1fr) auto",
        left: "max(12px, calc((100vw - 1280px) / 2 + 14px))",
        maxWidth: "520px",
        padding: "10px 12px",
        position: "fixed",
        right: "12px",
        zIndex: 34,
      }}
    >
      <div style={{ minWidth: 0 }}>
        <strong style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{selectedClient.name}</strong>
        <span style={{ color: "#687063", display: "block", fontSize: "12px", marginTop: "2px" }}>Skryje klienta vcetne jeho mereni. Data zustanou obnovitelna.</span>
      </div>
      <button
        disabled={isDeleting}
        type="button"
        onClick={handleDeleteClient}
        style={{
          background: "#9b2c2c",
          color: "#fff",
          minHeight: "40px",
          padding: "9px 12px",
          whiteSpace: "nowrap",
        }}
      >
        {isDeleting ? "Archivuji..." : "Archivovat klienta"}
      </button>
      {message ? <p className="status error" style={{ gridColumn: "1 / -1" }}>{message}</p> : null}
    </section>
  );
}
