const fallbackSupabaseUrl = "https://zxvndqicslyulrinbpyn.supabase.co";
const fallbackLegacyAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp4dm5kcWljc2x5dWxyaW5icHluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMwNjAyODYsImV4cCI6MjA5ODYzNjI4Nn0.46uqGVRE04E5nV7s2BtVotm7ikExkTBX7SftZe42DS8";

export function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? fallbackSupabaseUrl;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    fallbackLegacyAnonKey;

  return { url, key };
}

export function hasSupabaseConfig() {
  const { url, key } = getSupabaseConfig();
  return Boolean(url && key);
}
