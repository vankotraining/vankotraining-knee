import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  "https://zxvndqicslyulrinbpyn.supabase.co";
const legacyAnonKey =
  "eyJhbGciOiJIUzI1NiIsInJlZiI6Inp4dm5kcWljc2x5dWxyaW5icHluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMwNjAyODYsImV4cCI6MjA5ODYzNjI4Nn0.46uqGVRE04E5nV7s2BtVotm7ikExkTBX7SftZe42DS8";
const configuredAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseAnonKey = configuredAnonKey?.startsWith("eyJ")
  ? configuredAnonKey
  : legacyAnonKey;

function fetchWithActiveAthletesFilter(input: RequestInfo | URL, init?: RequestInit) {
  const method = (
    init?.method ?? (input instanceof Request ? input.method : "GET")
  ).toUpperCase();

  if (method !== "GET") {
    return fetch(input, init);
  }

  const sourceUrl = input instanceof Request ? input.url : input.toString();

  try {
    const url = new URL(sourceUrl);

    if (
      url.pathname.endsWith("/rest/v1/athletes") &&
      !url.searchParams.has("deleted_at")
    ) {
      url.searchParams.set("deleted_at", "is.null");

      if (input instanceof Request) {
        return fetch(new Request(url.toString(), input), init);
      }

      return fetch(url.toString(), init);
    }
  } catch {
    return fetch(input, init);
  }

  return fetch(input, init);
}

export function hasSupabaseConfig() {
  return Boolean(supabaseUrl && supabaseAnonKey);
}

export function createBrowserSupabaseClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase environment variables.");
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      fetch: fetchWithActiveAthletesFilter,
    },
  });
}
