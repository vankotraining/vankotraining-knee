"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import {
  createBrowserSupabaseClient,
  hasSupabaseConfig,
} from "@/lib/supabase-browser";

type ArchivedClient = {
  id: string;
  display_name: string;
  name_key: string | null;
  note: string | null;
  deleted_at: string | null;
  delete_reason: string | null;
  deleted_context: string | null;
  archived_measurement_count: number | string | null;
};

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

function formatCount(value: number | string | null | undefined) {
  if (value === null || value === undefined) return "0";

  const number = Number(value);
  if (!Number.isFinite(number)) return String(value);

  return number.toFixed(0);
}

export default function ArchivedClients() {
  const [session, setSession] = useState<Session | null>(null);
  const [archivedClients, setArchivedClients] = useState<ArchivedClient[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const supabase = useMemo(
    () => (hasSupabaseConfig() ? createBrowserSupabaseClient() : null),
    [],
  );

  const loadArchivedClients = useCallback(async () => {
    if (!supabase || !session) return;

    setIsLoading(true);
    setMessage("");

    const { data, error } = await supabase.rpc("list_archived_athletes");

    setIsLoading(false);

    if (error) {
      setArchivedClients([]);
      setMessage(
        isMissingRpcSignature(error)
          ? "Archiv klientu jeste neni aktivni. Spust migraci archived_clients_restore."
          : error.message,
      );
      return;
    }

    setArchivedClients((data ?? []) as ArchivedClient[]);
  }, [session, supabase]);

  useEffect(() => {
    if (!supabase) return;

    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  useEffect(() => {
    if (!session) {
      setArchivedClients([]);
      setMessage("");
      return;
    }

    void loadArchivedClients();
  }, [loadArchivedClients, session]);

  async function handleRestore(client: ArchivedClient) {
    if (!supabase || restoringId) return;

    const confirmed = window.confirm(
      `Obnovit klienta ${client.display_name}?\n\nKlient se vrati do aktivniho seznamu.`,
    );

    if (!confirmed) return;

    setRestoringId(client.id);
    setMessage("");

    let { error } = await supabase.rpc("restore_athlete", {
      p_athlete_id: client.id,
    });

    if (isMissingRpcSignature(error)) {
      const fallback = await supabase.rpc("restore_athlete", {
        p_id: client.id,
      });
      error = fallback.error;
    }

    setRestoringId(null);

    if (error) {
      setMessage(error.message);
      return;
    }

    setArchivedClients((current) => current.filter((item) => item.id !== client.id));
    setMessage("Klient je obnoveny. Stranku obnovim, aby se vratil do seznamu.");
    window.location.reload();
  }

  if (!supabase || !session) return null;

  return (
    <section
      aria-label="Archiv klientu"
      style={{
        margin: "0 auto 16px",
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
              Archiv klientu
            </span>
            <strong style={{ display: "block" }}>
              Archivovani klienti
            </strong>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button className="ghost-button" disabled={isLoading} type="button" onClick={() => void loadArchivedClients()}>
              {isLoading ? "Nacitam..." : "Obnovit seznam"}
            </button>
            <button type="button" onClick={() => setIsOpen((current) => !current)}>
              {isOpen ? "Zavrit" : `Otevrit (${archivedClients.length})`}
            </button>
          </div>
        </div>

        {message ? <p className={message.includes("neni aktivni") ? "status error" : "status"} style={{ marginTop: "8px" }}>{message}</p> : null}
        {isLoading ? <p className="status" style={{ marginTop: "8px" }}>Nacitam archiv klientu...</p> : null}

        {isOpen ? (
          <div style={{ display: "grid", gap: "8px", marginTop: "12px" }}>
            {archivedClients.length === 0 && !isLoading ? <p className="status">Archiv klientu je prazdny.</p> : null}
            {archivedClients.map((client) => (
              <article
                key={client.id}
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
                  <strong>{client.display_name}</strong>
                  <p className="status" style={{ fontSize: "13px" }}>
                    Archivovano {formatDate(client.deleted_at)} | archivovana mereni {formatCount(client.archived_measurement_count)}
                  </p>
                  {client.delete_reason ? (
                    <p className="status" style={{ fontSize: "12px" }}>
                      Duvod: {client.delete_reason}
                    </p>
                  ) : null}
                </div>
                <button disabled={restoringId === client.id} type="button" onClick={() => void handleRestore(client)}>
                  {restoringId === client.id ? "Obnovuji..." : "Obnovit klienta"}
                </button>
              </article>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
