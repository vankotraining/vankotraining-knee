import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  "https://zxvndqicslyulrinbpyn.supabase.co";
const legacyAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp4dm5kcWljc2x5dWxyaW5icHluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMwNjAyODYsImV4cCI6MjA5ODYzNjI4Nn0.46uqGVRE04E5nV7s2BtVotm7ikExkTBX7SftZe42DS8";
const configuredAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseAnonKey = configuredAnonKey?.startsWith("eyJ")
  ? configuredAnonKey
  : legacyAnonKey;

export function hasSupabaseConfig() {
  return Boolean(supabaseUrl && supabaseAnonKey);
}

export function createBrowserSupabaseClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase environment variables.");
  }

  return createClient(supabaseUrl, supabaseAnonKey);
}
