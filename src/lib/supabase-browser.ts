import { createClient } from "@supabase/supabase-js";

export function getConfiguredSupabaseUrl() {
  return process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
}

export function getConfiguredSupabaseBrowserKey() {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    ""
  );
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
  return Boolean(getConfiguredSupabaseUrl() && getConfiguredSupabaseBrowserKey());
}

export function createBrowserSupabaseClient() {
  const supabaseUrl = getConfiguredSupabaseUrl();
  const supabaseBrowserKey = getConfiguredSupabaseBrowserKey();
  const testStorageKey = process.env.NEXT_PUBLIC_SUPABASE_AUTH_STORAGE_KEY?.trim();

  if (!supabaseUrl || !supabaseBrowserKey) {
    throw new Error("Missing Supabase environment variables.");
  }

  return createClient(supabaseUrl, supabaseBrowserKey, {
    ...(testStorageKey ? { auth: { storageKey: testStorageKey } } : {}),
    global: {
      fetch: fetchWithActiveAthletesFilter,
    },
  });
}
