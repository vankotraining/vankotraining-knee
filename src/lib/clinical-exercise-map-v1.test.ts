import assert from "node:assert/strict";
import test from "node:test";
import {
  CAPACITY_STAGES,
  CLINICAL_EXERCISE_CARDS,
  CLINICAL_EXERCISE_MAP_SNAPSHOT,
  CLINICAL_FAMILIES,
  getCardsForCell,
} from "./clinical-exercise-map-v1.js";

test("V1 keeps the approved six-capacity axis and all canonical families", () => {
  assert.deepEqual(
    CAPACITY_STAGES.map((stage) => stage.id),
    ["tolerance", "force_activation", "strength_capacity", "deep_rom", "dynamic", "sport"],
  );
  assert.equal(CLINICAL_FAMILIES.length, 13);
  assert.equal(new Set(CLINICAL_FAMILIES.map((family) => family.id)).size, 13);
});

test("projection snapshot records fresh provenance counts", () => {
  assert.equal(CLINICAL_EXERCISE_MAP_SNAPSHOT.snapshotDate, "2026-10-02");
  assert.equal(CLINICAL_EXERCISE_MAP_SNAPSHOT.canonicalVisits, 201);
  assert.equal(CLINICAL_EXERCISE_MAP_SNAPSHOT.primaryKneeContextEpisodes, 15);
  assert.equal(CLINICAL_EXERCISE_MAP_SNAPSHOT.primaryKneeContextVisits, 55);
});

test("card identities are unique and every card belongs to the canonical grid", () => {
  const ids = CLINICAL_EXERCISE_CARDS.map((card) => card.id);
  assert.equal(new Set(ids).size, ids.length);

  const families = new Set(CLINICAL_FAMILIES.map((family) => family.id));
  const capacities = new Set(CAPACITY_STAGES.map((stage) => stage.id));

  for (const card of CLINICAL_EXERCISE_CARDS) {
    assert.ok(families.has(card.family));
    assert.ok(capacities.has(card.capacity));
    assert.ok(card.provenance.length > 0);
    assert.ok(card.evidence.length > 0);
  }
});

test("confidence A always has direct Visit provenance", () => {
  for (const card of CLINICAL_EXERCISE_CARDS.filter((item) => item.mappingConfidence === "A")) {
    assert.ok(card.provenance.some((item) => item.kind === "visit" && item.visitId));
  }
});

test("probable mappings keep a Training candidate and Visit provenance", () => {
  for (const card of CLINICAL_EXERCISE_CARDS.filter((item) => item.mappingConfidence === "B")) {
    assert.ok(card.trainingExerciseId);
    assert.ok(card.expectedTrainingName);
    assert.ok(card.provenance.some((item) => item.kind === "visit" && item.visitId));
  }
});

test("known unresolved queue is explicit rather than silently canonicalized", () => {
  const unresolvedIds = new Set(
    CLINICAL_EXERCISE_CARDS.filter((card) => card.mappingState === "unresolved").map((card) => card.id),
  );

  for (const id of [
    "step-down",
    "sl-squat-stepper",
    "trx-sit-to-heel",
    "medball-drop-split-squat",
    "assisted-full-rom-split-squat",
    "wall-supported-split-squat",
  ]) {
    assert.ok(unresolvedIds.has(id), `${id} should remain unresolved`);
  }
});

test("matrix selector returns only the requested family/capacity cell", () => {
  const cards = getCardsForCell("split_squat", "deep_rom");
  assert.ok(cards.length > 0);
  assert.ok(cards.every((card) => card.family === "split_squat" && card.capacity === "deep_rom"));
});
