import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { requireTindeqUser } from "@/lib/tindeq/auth";
import { TindeqImportError } from "@/lib/tindeq/errors";
import { importTindeqFile, logTindeqImportError } from "@/lib/tindeq/import-service";

export const runtime = "nodejs";
export const maxDuration = 60;

function getFile(formData: FormData) {
  const candidate = formData.get("tindeqFile") ?? formData.get("file");
  return candidate instanceof File ? candidate : null;
}

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();

  let user;
  try {
    user = await requireTindeqUser(supabase);
  } catch (error) {
    const known = error instanceof TindeqImportError
      ? error
      : new TindeqImportError("UNAUTHORIZED", undefined, 401);
    return NextResponse.json(
      { success: false, code: known.code, message: known.message },
      { status: known.status },
    );
  }

  let file: File | null = null;
  try {
    file = getFile(await request.formData());
    if (!file) throw new TindeqImportError("NO_FILE");
    const result = await importTindeqFile(supabase, user.id, file);
    return NextResponse.json(result);
  } catch (error) {
    const known = error instanceof TindeqImportError
      ? error
      : new TindeqImportError("IMPORT_FAILED", undefined, 500);
    console.error("Tindeq import failed", {
      code: known.code,
      fileName: file?.name,
      detail: error instanceof Error ? error.stack ?? error.message : String(error),
    });
    await logTindeqImportError(
      supabase,
      user.id,
      file,
      known.code,
      known.message,
      error instanceof Error ? error.stack ?? error.message : String(error),
    );
    return NextResponse.json(
      { success: false, code: known.code, message: known.message },
      { status: known.status },
    );
  }
}
