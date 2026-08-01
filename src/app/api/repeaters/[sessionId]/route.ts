import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { validateClinicalScale } from "@/lib/tindeq/validation";

type RouteContext = {
  params: Promise<{ sessionId: string }>;
};

export async function PATCH(request: Request, { params }: RouteContext) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ success: false, code: "UNAUTHORIZED" }, { status: 401 });
  }

  try {
    const { sessionId } = await params;
    const body = await request.json() as {
      painDuring?: unknown;
      rpe?: unknown;
      clinicalNote?: unknown;
    };
    const painDuring = validateClinicalScale(body.painDuring, "pain");
    const rpe = validateClinicalScale(body.rpe, "rpe");
    const clinicalNote = typeof body.clinicalNote === "string"
      ? body.clinicalNote.trim().slice(0, 2000) || null
      : null;
    const { error } = await supabase
      .from("tindeq_repeaters_sessions")
      .update({
        pain_during: painDuring,
        rpe,
        clinical_note: clinicalNote,
      })
      .eq("id", sessionId)
      .eq("owner_user_id", user.id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Tindeq clinical data update failed", error);
    return NextResponse.json(
      { success: false, code: "INVALID_CLINICAL_DATA", message: "Údaje se nepodařilo uložit." },
      { status: 400 },
    );
  }
}
