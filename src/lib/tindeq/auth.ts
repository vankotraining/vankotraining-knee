import type { SupabaseClient, User } from "@supabase/supabase-js";
import { TindeqImportError } from "./errors";

export async function requireTindeqUser(
  supabase: Pick<SupabaseClient, "auth">,
): Promise<User> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new TindeqImportError(
      "UNAUTHORIZED",
      "Pro import se nejprve přihlas.",
      401,
    );
  }

  return user;
}
