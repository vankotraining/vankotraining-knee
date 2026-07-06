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
      `Opravdu smazat klienta ${selectedClient.name}?\n\nSmazou se i vsechna jeho knee mereni a profilove udaje. Tuto akci nejde vratit zpet.`,
    );

    if (!confirmed) return;

    setIsDeleting(true);
    setMessage("");

    const testsResult = await supabase
      .from("knee_extension_tests")
      .delete()
      .eq("athlete_id", selectedClient.id);

    if (testsResult.error) {
      setIsDeleting(false);
      setMessage(testsResult.error.message);
      return;
    }

    const profilesResult = await supabase
      .from("athlete_profiles")
      .delete()
      .eq("athlete_id", selectedClient.id);

    if (profilesResult.error) {
      setIsDeleting(false);
      setMessage(profilesResult.error.message);
      return;
    }

    const athleteResult = await supabase
      .from("athletes")
      .delete()
      .eq("id", selectedClient.id);

    setIsDeleting(false);

    if (athleteResult.error) {
      setMessage(athleteResult.error.message);
      return;
    }

    setMessage("Klient je smazany.");
    window.location.reload();
  }

  if (!selectedClient) return null;

  return (
    <section
      aria-label="Smazani klienta"
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
        <span style={{ color: "#687063", display: "block", fontSize: "12px", marginTop: "2px" }}>Smaze klienta vcetne jeho mereni a profilu.</span>
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
        {isDeleting ? "Mazu..." : "Smazat klienta"}
      </button>
      {message ? <p className="status error" style={{ gridColumn: "1 / -1" }}>{message}</p> : null}
    </section>
  );
}
