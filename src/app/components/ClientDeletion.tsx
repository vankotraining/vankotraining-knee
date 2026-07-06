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
    <section className="client-delete-bar" aria-label="Smazani klienta">
      <div>
        <strong>{selectedClient.name}</strong>
        <span>Smaze klienta vcetne jeho mereni a profilu.</span>
      </div>
      <button
        className="danger-button"
        disabled={isDeleting}
        type="button"
        onClick={handleDeleteClient}
      >
        {isDeleting ? "Mazu klienta..." : "Smazat klienta"}
      </button>
      {message ? <p className="status error">{message}</p> : null}
    </section>
  );
}
