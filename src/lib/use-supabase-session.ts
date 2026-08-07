"use client";

import { useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import {
  createBrowserSupabaseClient,
  hasSupabaseConfig,
} from "./supabase-browser";

export type SupabaseSessionState = "loading" | "signed-in" | "signed-out" | "unconfigured" | "error";

export function useSupabaseSession() {
  const isConfigured = hasSupabaseConfig();
  const supabase = useMemo(
    () => (isConfigured ? createBrowserSupabaseClient() : null),
    [isConfigured],
  );
  const [session, setSession] = useState<Session | null>(null);
  const [state, setState] = useState<SupabaseSessionState>(
    isConfigured ? "loading" : "unconfigured",
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) return;

    let active = true;
    supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (!active) return;
      if (sessionError) {
        setError(sessionError.message);
        setState("error");
        return;
      }
      setSession(data.session);
      setState(data.session ? "signed-in" : "signed-out");
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!active) return;
      setSession(nextSession);
      setError(null);
      setState(nextSession ? "signed-in" : "signed-out");
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  return { supabase, session, state, error, isConfigured };
}
