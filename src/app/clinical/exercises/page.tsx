import type { Metadata } from "next";
import ClinicalExerciseMap from "./ClinicalExerciseMap";

export const metadata: Metadata = {
  title: "Clinical Map | Knee Data",
  description: "Read-only mapa klinicky používaných exercise families, kapacit a evidence guardrails.",
};

export default function ClinicalExercisesPage() {
  return <ClinicalExerciseMap />;
}
