import assert from "node:assert/strict";
import test from "node:test";
import {
  CAPACITY_STAGES,
  CLINICAL_EXERCISE_CARDS,
  CLINICAL_EXERCISE_MAP_SNAPSHOT,
  CLINICAL_FAMILIES,
  CLINICAL_GOALS,
  EARLY_KNEE_REASONING_LENS,
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

test("V1.3 early-knee lens is a compact reasoning map rather than a protocol", () => {
  assert.equal(EARLY_KNEE_REASONING_LENS.label, "Early knee function");
  assert.ok(EARLY_KNEE_REASONING_LENS.stateVariables.includes("Effusion / swelling"));
  assert.ok(EARLY_KNEE_REASONING_LENS.limiters.includes("Apprehension / low confidence"));
  assert.ok(EARLY_KNEE_REASONING_LENS.modifiers.includes("ROM"));
  assert.ok(
    EARLY_KNEE_REASONING_LENS.optionGroups.some(
      (group) => group.label === "Used exercise options" && group.items.includes("Machine knee extension"),
    ),
  );
  assert.ok(EARLY_KNEE_REASONING_LENS.responseVariables.includes("Delayed response"));
  assert.ok(EARLY_KNEE_REASONING_LENS.evidence.some((item) => item.claimId === "AMI-CLM-003"));
});

test("V1.2 clinical goal layer separates early goals and limiters from exercise identity", () => {
  const goal = CLINICAL_GOALS.find((item) => item.id === "restore_extension_quadriceps_control");
  assert.ok(goal);
  assert.deepEqual(
    goal.components.map((item) => item.id),
    ["extension_rom", "quadriceps_activation", "terminal_extension_control", "early_load_acceptance"],
  );
  assert.ok(goal.limiters.some((item) => item.id === "poor_quad_activation"));
  assert.ok(goal.evidence.some((item) => item.claimId === "ACL-CLM-008"));
  assert.ok(goal.evidence.some((item) => item.claimId === "AMI-CLM-001"));
  assert.ok(goal.evidence.some((item) => item.claimId === "AMI-CLM-002"));
});

test("terminal extension is a reviewed exercise option under the goal, not the goal itself", () => {
  const card = CLINICAL_EXERCISE_CARDS.find(
    (item) => item.id === "terminal-knee-extension-quad-activation",
  );
  assert.ok(card);
  assert.equal(card.capacity, "force_activation");
  assert.equal(card.mappingConfidence, "A");
  assert.equal(card.trainingExerciseId, null);
  assert.ok(
    card.provenance.some(
      (item) => item.kind === "visit" && item.visitId === "7d26481e-3e88-46ab-9b7c-9f0fcf93d862",
    ),
  );
  assert.ok(
    card.clinicalGoalLinks?.some(
      (link) =>
        link.goalId === "restore_extension_quadriceps_control" &&
        link.componentIds.includes("terminal_extension_control"),
    ),
  );
  assert.ok(card.evidence.some((item) => item.claimId === "ACL-CLM-008"));
  assert.ok(card.evidence.some((item) => item.claimId === "AMI-CLM-002"));
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
    "trx-sit-to-heel",
    "medball-drop-split-squat",
  ]) {
    assert.ok(unresolvedIds.has(id), `${id} should remain unresolved`);
  }
});

test("visit-reviewed variants now resolve to exact canonical Training exercises", () => {
  const expected = new Map([
    ["step-down", "8afce6cb-db60-4b74-ac86-828e790cc52f"],
    ["sl-squat-stepper", "11b49897-c658-4171-a480-b51093f424c7"],
    ["assisted-full-rom-split-squat", "91d3d034-bc09-49df-9eda-e7e4eb57e87f"],
    ["wall-supported-split-squat", "919629f2-c34a-4514-ae65-4b55ab4bb88e"],
  ]);

  for (const [id, trainingExerciseId] of expected) {
    const card = CLINICAL_EXERCISE_CARDS.find((item) => item.id === id);
    assert.ok(card);
    assert.equal(card.mappingState, "exact");
    assert.equal(card.mappingConfidence, "A");
    assert.equal(card.trainingExerciseId, trainingExerciseId);
    assert.deepEqual(card.unresolvedQuestions, []);
  }
});

test("all reviewed clinical-goal links reference declared goals/components/limiters", () => {
  const goals = new Map(CLINICAL_GOALS.map((goal) => [goal.id, goal]));

  for (const card of CLINICAL_EXERCISE_CARDS) {
    for (const link of card.clinicalGoalLinks ?? []) {
      const goal = goals.get(link.goalId);
      assert.ok(goal, `${card.id} links to an unknown clinical goal`);
      const components = new Set(goal.components.map((item) => item.id));
      const limiters = new Set(goal.limiters.map((item) => item.id));
      assert.ok(link.componentIds.every((id) => components.has(id)));
      assert.ok(link.limiterIds.every((id) => limiters.has(id)));
    }
  }
});

test("matrix selector returns only the requested family/capacity cell", () => {
  const cards = getCardsForCell("split_squat", "deep_rom");
  assert.ok(cards.length > 0);
  assert.ok(cards.every((card) => card.family === "split_squat" && card.capacity === "deep_rom"));
});
