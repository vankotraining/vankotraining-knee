import type { Metadata } from "next";
import ClinicalExerciseMap from "./ClinicalExerciseMap";

export const metadata: Metadata = {
  title: "Clinical Map | Knee Data",
  description: "Read-only mapa klinicky používaných exercise families, kapacit a evidence guardrails.",
};

export default async function ClinicalExercisesPage({ searchParams }: { searchParams: Promise<{ node?: string }> }) {
  const { node } = await searchParams;
  return <ClinicalExerciseMap initialNode={typeof node === "string" ? node : undefined} />;
}
