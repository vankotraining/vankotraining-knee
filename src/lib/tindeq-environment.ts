export const TINDEQ_PRODUCTION_SUPABASE_REF = "zxvndqicslyulrinbpyn";
export const TINDEQ_DEVELOPMENT_SUPABASE_REF = "twndqnmrvefhwuwuglju";

export type TindeqEnvironmentKind = "production" | "development";

export type TindeqEnvironmentValidation = {
  allowed: boolean;
  environment: TindeqEnvironmentKind | null;
  expectedProjectRef: string | null;
  actualProjectRef: string | null;
  reason: string | null;
};

function isTindeqPath(pathname: string) {
  return pathname === "/tindeq" || pathname.startsWith("/tindeq/");
}

function expectedProjectForHostname(hostname: string): {
  environment: TindeqEnvironmentKind;
  projectRef: string;
} | null {
  if (hostname === "knee.vankotraining.cz") {
    return {
      environment: "production",
      projectRef: TINDEQ_PRODUCTION_SUPABASE_REF,
    };
  }

  const isLocal = hostname === "localhost" || hostname === "127.0.0.1";
  const isVercelPreview =
    hostname === "vankotraining-knee.vercel.app" ||
    (hostname.startsWith("vankotraining-knee-") && hostname.endsWith(".vercel.app"));

  if (isLocal || isVercelPreview) {
    return {
      environment: "development",
      projectRef: TINDEQ_DEVELOPMENT_SUPABASE_REF,
    };
  }

  return null;
}

export function extractSupabaseProjectRef(supabaseUrl: string | null | undefined) {
  if (!supabaseUrl) return null;

  try {
    const parsed = new URL(supabaseUrl);
    if (parsed.protocol !== "https:") return null;
    const match = /^([a-z0-9]+)\.supabase\.co$/i.exec(parsed.hostname);
    return match?.[1]?.toLowerCase() ?? null;
  } catch {
    return null;
  }
}

export function validateTindeqEnvironment(
  locationHref: string,
  supabaseUrl: string | null | undefined,
): TindeqEnvironmentValidation {
  let currentUrl: URL;
  try {
    currentUrl = new URL(locationHref);
  } catch {
    return {
      allowed: false,
      environment: null,
      expectedProjectRef: null,
      actualProjectRef: extractSupabaseProjectRef(supabaseUrl),
      reason: "Aktuální Knee adresa není platná URL.",
    };
  }

  const expected = expectedProjectForHostname(currentUrl.hostname);
  const actualProjectRef = extractSupabaseProjectRef(supabaseUrl);

  if (!isTindeqPath(currentUrl.pathname) || !expected) {
    return {
      allowed: false,
      environment: expected?.environment ?? null,
      expectedProjectRef: expected?.projectRef ?? null,
      actualProjectRef,
      reason: "Toto není povolená Knee adresa pro modul Tindeq.",
    };
  }

  if (!actualProjectRef) {
    return {
      allowed: false,
      environment: expected.environment,
      expectedProjectRef: expected.projectRef,
      actualProjectRef: null,
      reason: "NEXT_PUBLIC_SUPABASE_URL chybí nebo neobsahuje platný Supabase project ref.",
    };
  }

  if (actualProjectRef !== expected.projectRef) {
    return {
      allowed: false,
      environment: expected.environment,
      expectedProjectRef: expected.projectRef,
      actualProjectRef,
      reason: "Knee adresa a nakonfigurovaný Supabase projekt si neodpovídají.",
    };
  }

  return {
    allowed: true,
    environment: expected.environment,
    expectedProjectRef: expected.projectRef,
    actualProjectRef,
    reason: null,
  };
}
