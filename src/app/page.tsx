import { redirect } from "next/navigation";
import KneeApp from "./components/KneeApp";
import { createServerSupabaseClient } from "@/lib/supabase-server";

type HomeProps = {
  searchParams: Promise<{ code?: string }>;
};

export default async function Home({ searchParams }: HomeProps) {
  const { code } = await searchParams;

  if (code) {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) redirect("/");
  }

  return <KneeApp />;
}
