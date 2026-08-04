import { createClient } from "@supabase/supabase-js";

const PRODUCTION_SUPABASE_URL = "https://zxvndqicslyulrinbpyn.supabase.co";
const PRODUCTION_LEGACY_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp4dm5kcWljc2x5dWxyaW5icHluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMwNjAyODYsImV4cCI6MjA5ODYzNjI4Nn0.46uqGVRE04E5nV7s2BtVotm7ikExkTBX7SftZe42DS8";

const TINDEQ_PREVIEW_HOST =
  "vankotraining-knee-git-agent-tin-857ca9-vankotrainings-projects.vercel.app";
const TINDEQ_DEV_SUPABASE_URL = "https://twndqnmrvefhwuwuglju.supabase.co";
const TINDEQ_DEV_PUBLISHABLE_KEY =
  "sb_publishable_xv4M1xvvYpMWIyy3XvVUhQ_bwVD8qy-";

function isTindeqDevPreview() {
  return typeof window !== "undefined" && window.location.hostname === TINDEQ_PREVIEW_HOST;
}

function resolveSupabaseConfig() {
  if (isTindeqDevPreview()) {
    return {
      url: TINDEQ_DEV_SUPABASE_URL,
      anonKey: TINDEQ_DEV_PUBLISHABLE_KEY,
    };
  }

  const configuredUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const configuredAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  return {
    url: configuredUrl ?? PRODUCTION_SUPABASE_URL,
    anonKey:
      configuredAnonKey?.startsWith("eyJ") || configuredAnonKey?.startsWith("sb_publishable_")
        ? configuredAnonKey
        : PRODUCTION_LEGACY_ANON_KEY,
  };
}

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
  const { url, anonKey } = resolveSupabaseConfig();
  return Boolean(url && anonKey);
}

export function createBrowserSupabaseClient() {
  const { url, anonKey } = resolveSupabaseConfig();

  if (!url || !anonKey) {
    throw new Error("Missing Supabase environment variables.");
  }

  return createClient(url, anonKey, {
    global: {
      fetch: fetchWithActiveAthletesFilter,
    },
  });
}
