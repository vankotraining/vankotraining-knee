export const CAPACITY_STAGES = [
  { id: "tolerance", label: "Tolerance", description: "Nízká až řízená expozice a symptomová/load tolerance." },
  { id: "force_activation", label: "Force / activation", description: "Produkce síly, aktivace a izometrická kapacita." },
  { id: "strength_capacity", label: "Strength / capacity", description: "Vyšší silová a pracovní kapacita bez předpokladu lineární fáze." },
  { id: "deep_rom", label: "Deep ROM / knee-forward", description: "Tolerance větší flexe kolene a/nebo knee-forward požadavku." },
  { id: "dynamic", label: "Dynamic", description: "Rychlost, landing, decelerace a plyometrická zátěž." },
  { id: "sport", label: "Sport", description: "Přenos do sportovních požadavků; ne automatický RTS verdikt." },
] as const;

export type CapacityStageId = (typeof CAPACITY_STAGES)[number]["id"];

export const CLINICAL_FAMILIES = [
  { id: "knee_extension", label: "Knee extension" },
  { id: "wall_isometric", label: "Wall isometric" },
  { id: "split_squat", label: "Split squat" },
  { id: "squat", label: "Squat / deep flexion" },
  { id: "step", label: "Step" },
  { id: "single_leg_squat", label: "Single-leg squat" },
  { id: "hip_hinge", label: "Hip hinge" },
  { id: "bridge", label: "Bridge / hip thrust" },
  { id: "hamstring_curl", label: "Hamstring curl" },
  { id: "calf", label: "Calf" },
  { id: "landing", label: "Landing" },
  { id: "hop_jump", label: "Hop / jump" },
  { id: "mobility_adjunct", label: "Mobility adjunct" },
] as const;

export type ClinicalFamilyId = (typeof CLINICAL_FAMILIES)[number]["id"];
export type MappingConfidence = "A" | "B" | "C";
export type MappingState = "exact" | "probable" | "unresolved";

export type LoadSignature = {
  contraction: string | null;
  laterality: string | null;
  romKneeFlexionDemand: string | null;
  kneeForwardDemand: string | null;
  velocity: string | null;
  impactLoadingRateDemand: string | null;
  decelerationDemand: string | null;
  assistance: string | null;
  externalLoad: string | null;
};

export type ClinicalProvenance = {
  kind: "visit" | "training" | "historical";
  label: string;
  visitId?: string;
  visitDate?: string;
  note: string;
};

export type EvidenceGuardrail = {
  claimId: string;
  context: string;
  guardrail: string;
};

export type ClinicalGoalId = "restore_extension_quadriceps_control";
export type ClinicalGoalComponentId =
  | "extension_rom"
  | "quadriceps_activation"
  | "terminal_extension_control"
  | "early_load_acceptance";
export type ClinicalLimiterId =
  | "extension_loss"
  | "effusion_pain_limited_activation"
  | "poor_quad_activation"
  | "quadriceps_force_deficit"
  | "poor_terminal_control";

export type ClinicalGoalLink = {
  goalId: ClinicalGoalId;
  role: "primary" | "supporting" | "progression";
  componentIds: readonly ClinicalGoalComponentId[];
  limiterIds: readonly ClinicalLimiterId[];
  note: string;
};

export type ClinicalGoal = {
  id: ClinicalGoalId;
  label: string;
  scope: string;
  description: string;
  components: readonly {
    id: ClinicalGoalComponentId;
    label: string;
    description: string;
  }[];
  limiters: readonly {
    id: ClinicalLimiterId;
    label: string;
  }[];
  evidence: readonly EvidenceGuardrail[];
  reviewNote: string;
};

export type ClinicalExerciseCard = {
  id: string;
  canonicalName: string;
  family: ClinicalFamilyId;
  variant: string;
  capacity: CapacityStageId;
  trainingExerciseId: string | null;
  expectedTrainingName: string | null;
  mappingConfidence: MappingConfidence;
  mappingState: MappingState;
  clinicalContexts: string[];
  clinicalGoalLinks?: readonly ClinicalGoalLink[];
  loadSignature: LoadSignature;
  provenance: ClinicalProvenance[];
  evidence: EvidenceGuardrail[];
  unresolvedQuestions: string[];
};

const unknownLoad: LoadSignature = {
  contraction: null,
  laterality: null,
  romKneeFlexionDemand: null,
  kneeForwardDemand: null,
  velocity: null,
  impactLoadingRateDemand: null,
  decelerationDemand: null,
  assistance: null,
  externalLoad: null,
};

const PFP: EvidenceGuardrail = {
  claimId: "PFP-CLM-003",
  context: "PFP / anterior knee pain",
  guardrail: "Education plus structured hip/knee exercise is a first-line foundation; reassessment anchors are not rigid biological cut-offs.",
};

const PATELLAR_TENDON: EvidenceGuardrail = {
  claimId: "PT-CLM-001",
  context: "Patellar / quadriceps tendon context",
  guardrail: "Use load management and progressive quadriceps/tendon loading; do not diagnose from imaging or one test and do not claim universal superiority of one loading method.",
};

const MENISCUS: EvidenceGuardrail = {
  claimId: "MEN-CLM-002",
  context: "Meniscus repair",
  guardrail: "Progression must reflect tear morphology, repair stability, tissue factors and concomitant procedures; there is no universal repair protocol.",
};

const MENISCUS_RTS: EvidenceGuardrail = {
  claimId: "MEN-CLM-006",
  context: "Meniscus / return to sport",
  guardrail: "RTS combines biological healing with symptoms, ROM/effusion, strength, functional performance, sport demands and psychological readiness; time alone is not clearance.",
};

const ACL: EvidenceGuardrail = {
  claimId: "ACL-CLM-005",
  context: "ACL / ACLR / non-operative",
  guardrail: "Treatment and progression are trajectory-specific; do not convert sport ambition, laxity or a single exercise result into an automatic treatment or RTS verdict.",
};

const ACL_REHAB: EvidenceGuardrail = {
  claimId: "ACL-CLM-008",
  context: "ACL reconstruction rehabilitation",
  guardrail: "Use exercise-based, progressive and criteria-driven rehabilitation; early active ROM, controlled weight bearing and quadriceps restoration are priorities when surgical and concomitant-procedure constraints allow. Exact timing and cut-points are not universal.",
};

const AMI_PATTERN: EvidenceGuardrail = {
  claimId: "AMI-CLM-001",
  context: "Quadriceps activation after knee injury",
  guardrail: "Quadriceps activation failure can occur after knee injury/ACLR and may be bilateral; do not assume the contralateral limb is a normal reference or diagnose AMI from weakness alone.",
};

const AMI_MANAGEMENT: EvidenceGuardrail = {
  claimId: "AMI-CLM-002",
  context: "AMI / quadriceps activation management",
  guardrail: "Progressive exercise is the foundation; early NMES may be an adjunct when voluntary activation is limited. Passive modalities should not replace progressive quadriceps loading.",
};

export const CLINICAL_EXERCISE_MAP_SNAPSHOT = {
  snapshotDate: "2026-10-02",
  canonicalVisits: 201,
  primaryKneeContextEpisodes: 15,
  primaryKneeContextVisits: 55,
  trainingExercisesActiveAtAudit: 158,
  authorityNote:
    "CLIENTS supplies documented clinical use, Training supplies canonical exercise IDs, and Clinical Second Brain supplies evidence guardrails. This file is a read-only projection manifest, not a new clinical authority.",
} as const;

export const CLINICAL_GOALS: readonly ClinicalGoal[] = [
  {
    id: "restore_extension_quadriceps_control",
    label: "Restore knee extension & quadriceps control",
    scope:
      "Early knee rehabilitation when extension or quadriceps control is a relevant limiter. Current CSB evidence is strongest for ACL/ACLR; procedure-specific restrictions override the generic goal.",
    description:
      "Restore available knee extension, voluntary quadriceps activation and active terminal extension control, then transfer that control into early weight bearing and basic movement.",
    components: [
      {
        id: "extension_rom",
        label: "Extension ROM",
        description: "Restore the available extension range rather than accepting a persistent extension deficit as a normal endpoint.",
      },
      {
        id: "quadriceps_activation",
        label: "Quadriceps activation",
        description: "Restore purposeful voluntary quadriceps recruitment and identify activation-limited loading when present.",
      },
      {
        id: "terminal_extension_control",
        label: "Active terminal extension control",
        description: "Convert passive or assisted extension into active control near terminal knee extension.",
      },
      {
        id: "early_load_acceptance",
        label: "Early load acceptance / movement control",
        description: "Transfer extension and quadriceps control into gait, weight bearing and basic movement as constraints allow.",
      },
    ],
    limiters: [
      { id: "extension_loss", label: "Extension loss" },
      { id: "effusion_pain_limited_activation", label: "Effusion / pain-limited activation" },
      { id: "poor_quad_activation", label: "Poor voluntary quadriceps activation / AMI" },
      { id: "quadriceps_force_deficit", label: "Quadriceps force deficit" },
      { id: "poor_terminal_control", label: "Poor active terminal extension control" },
    ],
    evidence: [ACL_REHAB, AMI_PATTERN, AMI_MANAGEMENT],
    reviewNote:
      "This is a clinical goal layer, not a rigid postoperative phase or a prescription for one specific exercise. Exercise links are added only after clinical review.",
  },
];

export const CLINICAL_EXERCISE_CARDS: readonly ClinicalExerciseCard[] = [
  {
    id: "single-leg-wall-sit",
    canonicalName: "Single-leg wall sit",
    family: "wall_isometric",
    variant: "Jednonožní wall sit",
    capacity: "tolerance",
    trainingExerciseId: "57256826-2c12-49c3-a0e6-7a29d11d37ea",
    expectedTrainingName: "Single leg wall sit",
    mappingConfidence: "A",
    mappingState: "exact",
    clinicalContexts: ["load-related knee pain", "quadriceps capacity", "deep-flexion tolerance"],
    loadSignature: {
      ...unknownLoad,
      contraction: "isometric",
      laterality: "unilateral",
      assistance: "wall support",
    },
    provenance: [
      {
        kind: "visit",
        label: "Direct clinical use",
        visitId: "a9cf49f5-117b-445f-b36d-9fa297a8a5e3",
        visitDate: "2026-09-29",
        note: "Visit explicitly records a single-leg wall sit.",
      },
      {
        kind: "training",
        label: "Canonical Training mapping",
        note: "Training contains an active exercise named “Single leg wall sit”.",
      },
    ],
    evidence: [PFP, PATELLAR_TENDON],
    unresolvedQuestions: [],
  },
  {
    id: "split-squat",
    canonicalName: "Split squat",
    family: "split_squat",
    variant: "Generic split squat",
    capacity: "strength_capacity",
    trainingExerciseId: "742d3714-3fa8-4aad-af13-4b187f32754f",
    expectedTrainingName: "Split squat",
    mappingConfidence: "A",
    mappingState: "exact",
    clinicalContexts: ["meniscus postoperative context", "load-related knee pain", "quadriceps capacity"],
    loadSignature: {
      ...unknownLoad,
      laterality: "unilateral",
    },
    provenance: [
      {
        kind: "visit",
        label: "Direct clinical use",
        visitId: "5466820a-570d-46c4-9923-974daed84aef",
        visitDate: "2026-08-14",
        note: "Visit explicitly records split squat work; the exact assisted variant remains separated below.",
      },
      {
        kind: "training",
        label: "Canonical Training mapping",
        note: "Training contains the canonical generic “Split squat”.",
      },
    ],
    evidence: [MENISCUS, PFP],
    unresolvedQuestions: [],
  },
  {
    id: "terminal-knee-extension-quad-activation",
    canonicalName: "Terminal extension / quadriceps activation",
    family: "knee_extension",
    variant: "Towel press / heel-supported active terminal extension",
    capacity: "force_activation",
    trainingExerciseId: null,
    expectedTrainingName: null,
    mappingConfidence: "A",
    mappingState: "unresolved",
    clinicalContexts: [
      "early knee rehabilitation",
      "terminal extension control",
      "quadriceps activation",
      "postoperative / post-traumatic knee",
    ],
    clinicalGoalLinks: [
      {
        goalId: "restore_extension_quadriceps_control",
        role: "primary",
        componentIds: ["extension_rom", "quadriceps_activation", "terminal_extension_control"],
        limiterIds: [
          "extension_loss",
          "effusion_pain_limited_activation",
          "poor_quad_activation",
          "poor_terminal_control",
        ],
        note: "Directly observed clinical option for extension/activation work; it is not a universal postoperative protocol or fixed phase.",
      },
    ],
    loadSignature: {
      ...unknownLoad,
      contraction: "isometric / active terminal extension",
      laterality: "unilateral",
      romKneeFlexionDemand: "terminal extension / near 0°",
      assistance: "towel or heel support depending on variant",
      externalLoad: "low / clinician-selected",
    },
    provenance: [
      {
        kind: "visit",
        label: "Direct clinical use",
        visitId: "7d26481e-3e88-46ab-9b7c-9f0fcf93d862",
        visitDate: "2026-09-29",
        note: "Visit documents difficult quadriceps activation in terminal extension, then full-extension work using a towel press under the knee and active terminal extension with the heel elevated.",
      },
    ],
    evidence: [ACL_REHAB, AMI_MANAGEMENT],
    unresolvedQuestions: [
      "Training has no reviewed exact canonical variant for this clinical option; keep exercise_id empty until clinician/library review.",
    ],
  },
  {
    id: "isometric-knee-extension",
    canonicalName: "Isometric knee extension",
    family: "knee_extension",
    variant: "Seated / externally resisted isometric",
    capacity: "force_activation",
    trainingExerciseId: "ed5bd1f9-b48c-4ac3-b41c-5b97950e5d62",
    expectedTrainingName: "Isometric seated leg extension with miniband",
    mappingConfidence: "B",
    mappingState: "probable",
    clinicalContexts: ["quadriceps deficit", "load-related knee pain", "postoperative capacity"],
    clinicalGoalLinks: [
      {
        goalId: "restore_extension_quadriceps_control",
        role: "supporting",
        componentIds: ["quadriceps_activation"],
        limiterIds: ["poor_quad_activation", "quadriceps_force_deficit"],
        note: "A reviewed activation/loading option within this goal; the exact Training setup remains a probable mapping rather than a Visit-stored exercise_id.",
      },
    ],
    loadSignature: {
      ...unknownLoad,
      contraction: "isometric",
      laterality: "unilateral",
    },
    provenance: [
      {
        kind: "visit",
        label: "Probable clinical mapping",
        visitId: "28b95d5d-000f-486e-816d-dc442422206f",
        visitDate: "2026-08-24",
        note: "Visit explicitly records unilateral knee extension/předkop with an isometric hold, but does not store a Training exercise_id or miniband identity.",
      },
      {
        kind: "training",
        label: "Probable Training mapping",
        note: "Training contains a closely matching unilateral isometric seated leg-extension variant.",
      },
    ],
    evidence: [PFP, PATELLAR_TENDON],
    unresolvedQuestions: ["Confirm whether the Visit variant used the same resistance setup as the Training exercise."],
  },
  {
    id: "knee-extension-machine",
    canonicalName: "Knee extension",
    family: "knee_extension",
    variant: "Machine knee extension",
    capacity: "strength_capacity",
    trainingExerciseId: "15de527f-6ede-4da4-8b7f-c09c2420e36e",
    expectedTrainingName: "Knee extension - machine",
    mappingConfidence: "B",
    mappingState: "probable",
    clinicalContexts: ["quadriceps capacity", "postoperative quadriceps deficit"],
    loadSignature: {
      ...unknownLoad,
      laterality: "bilateral",
      externalLoad: "machine resistance available",
    },
    provenance: [
      {
        kind: "visit",
        label: "Probable clinical mapping",
        visitId: "ba27aa11-2c32-444c-af59-89d9d32da25d",
        visitDate: "2026-09-10",
        note: "Visit documents continued knee-extension/předkop strengthening, but no explicit Training exercise_id or machine variant.",
      },
      {
        kind: "training",
        label: "Library availability",
        note: "Training contains an active machine knee-extension exercise.",
      },
    ],
    evidence: [PFP, PATELLAR_TENDON],
    unresolvedQuestions: ["Do not assume every Visit mention of předkop used the machine variant."],
  },
  {
    id: "staggered-stance-hinge",
    canonicalName: "Split-stance hip hinge",
    family: "hip_hinge",
    variant: "KB/DB staggered-stance hinge",
    capacity: "strength_capacity",
    trainingExerciseId: "360f1c13-2a4e-42f5-8403-6fb6a83e781e",
    expectedTrainingName: "Dumbbell/kettlebell staggered-stance deadlift",
    mappingConfidence: "B",
    mappingState: "probable",
    clinicalContexts: ["knee capacity", "posterior-chain capacity"],
    loadSignature: {
      ...unknownLoad,
      laterality: "unilateral",
      externalLoad: "KB/DB",
    },
    provenance: [
      {
        kind: "visit",
        label: "Probable clinical mapping",
        visitId: "3752a4dd-108d-4509-8c0d-e3522f87c3d3",
        visitDate: "2026-09-08",
        note: "Visit records split-stance hip hinge with a kettlebell.",
      },
      {
        kind: "training",
        label: "Probable Training mapping",
        note: "Training contains a dumbbell/kettlebell staggered-stance deadlift.",
      },
    ],
    evidence: [PFP],
    unresolvedQuestions: ["Visit text and Training naming differ; retain as probable rather than exact."],
  },
  {
    id: "single-leg-bridge",
    canonicalName: "Single-leg bridge",
    family: "bridge",
    variant: "Single-leg / split-stance bridge",
    capacity: "strength_capacity",
    trainingExerciseId: "20c129b2-497a-46e0-89c9-349985f6df73",
    expectedTrainingName: "Staggered stance hip lifts with dumbbell",
    mappingConfidence: "B",
    mappingState: "probable",
    clinicalContexts: ["posterior-chain capacity", "knee capacity adjunct"],
    loadSignature: {
      ...unknownLoad,
      laterality: "unilateral",
    },
    provenance: [
      {
        kind: "visit",
        label: "Probable clinical mapping",
        visitId: "28b95d5d-000f-486e-816d-dc442422206f",
        visitDate: "2026-08-24",
        note: "Visit records a split-stance bridge; Training has a close staggered-stance hip-lift variant but the exact external-load setup is not explicit in the Visit.",
      },
    ],
    evidence: [PFP],
    unresolvedQuestions: ["Confirm exact external-load and stance setup before promoting to an exact Training mapping."],
  },
  {
    id: "single-leg-calf-raise",
    canonicalName: "Single-leg calf raise",
    family: "calf",
    variant: "Single-leg calf raise",
    capacity: "strength_capacity",
    trainingExerciseId: "c72f5bf3-943d-482b-bd6a-0b91d5f371f1",
    expectedTrainingName: "Calf raises",
    mappingConfidence: "B",
    mappingState: "probable",
    clinicalContexts: ["lower-limb capacity", "running / jumping preparation"],
    loadSignature: {
      ...unknownLoad,
      laterality: "unilateral",
    },
    provenance: [
      {
        kind: "visit",
        label: "Probable clinical mapping",
        visitId: "a9cf49f5-117b-445f-b36d-9fa297a8a5e3",
        visitDate: "2026-09-29",
        note: "Visit explicitly records single-leg calf raises; the Visit does not store a Training exercise_id.",
      },
    ],
    evidence: [MENISCUS_RTS],
    unresolvedQuestions: [],
  },
  {
    id: "split-squat-jump",
    canonicalName: "Split squat jump",
    family: "hop_jump",
    variant: "Split-squat hopping/jump",
    capacity: "dynamic",
    trainingExerciseId: "bd44dc18-e5cd-496b-bfbf-e385e93a3afe",
    expectedTrainingName: "Split squat jump",
    mappingConfidence: "B",
    mappingState: "probable",
    clinicalContexts: ["dynamic knee capacity", "sport preparation"],
    loadSignature: {
      ...unknownLoad,
      laterality: "unilateral",
      velocity: "dynamic",
      impactLoadingRateDemand: "present",
      decelerationDemand: "present",
    },
    provenance: [
      {
        kind: "visit",
        label: "Probable clinical mapping",
        visitId: "4e010ce4-419b-40ca-842c-8693a263235a",
        visitDate: "2026-08-25",
        note: "Visit explicitly records split-squat hops; Training contains “Split squat jump”.",
      },
    ],
    evidence: [MENISCUS_RTS, ACL],
    unresolvedQuestions: ["Hop versus jump execution is not normalized in the Visit schema."],
  },
  {
    id: "step-down",
    canonicalName: "Step-down",
    family: "step",
    variant: "Step-down from medium step",
    capacity: "deep_rom",
    trainingExerciseId: null,
    expectedTrainingName: null,
    mappingConfidence: "C",
    mappingState: "unresolved",
    clinicalContexts: ["meniscus postoperative context", "eccentric / single-leg control"],
    loadSignature: {
      ...unknownLoad,
      laterality: "unilateral",
      decelerationDemand: "present",
    },
    provenance: [
      {
        kind: "visit",
        label: "Direct clinical use; Training unresolved",
        visitId: "5466820a-570d-46c4-9923-974daed84aef",
        visitDate: "2026-08-14",
        note: "Visit explicitly records step-down from a medium step. No safe exact Training exercise mapping was found.",
      },
    ],
    evidence: [MENISCUS, MENISCUS_RTS],
    unresolvedQuestions: ["Create or map an exact canonical Training step-down variant only after clinician/library review."],
  },
  {
    id: "sl-squat-stepper",
    canonicalName: "Single-leg squat on stepper",
    family: "single_leg_squat",
    variant: "SL squat / podřep on step",
    capacity: "deep_rom",
    trainingExerciseId: null,
    expectedTrainingName: null,
    mappingConfidence: "C",
    mappingState: "unresolved",
    clinicalContexts: ["deep-flexion capacity", "single-leg control"],
    loadSignature: {
      ...unknownLoad,
      laterality: "unilateral",
      externalLoad: "Visit-specific external load may be present",
    },
    provenance: [
      {
        kind: "visit",
        label: "Direct clinical use; Training unresolved",
        visitId: "3752a4dd-108d-4509-8c0d-e3522f87c3d3",
        visitDate: "2026-09-08",
        note: "Visit explicitly records an SL squat/podřep on a step.",
      },
      {
        kind: "visit",
        label: "Repeated clinical use",
        visitId: "a9cf49f5-117b-445f-b36d-9fa297a8a5e3",
        visitDate: "2026-09-29",
        note: "Visit again records SL squat on a stepper.",
      },
    ],
    evidence: [PFP, MENISCUS_RTS],
    unresolvedQuestions: ["No dedicated Training single-leg-squat/step family provides a safe exact mapping."],
  },
  {
    id: "trx-sit-to-heel",
    canonicalName: "TRX-assisted sit-to-heel",
    family: "squat",
    variant: "Kneeling sit-to-heel with TRX assistance",
    capacity: "deep_rom",
    trainingExerciseId: null,
    expectedTrainingName: null,
    mappingConfidence: "C",
    mappingState: "unresolved",
    clinicalContexts: ["deep-flexion tolerance", "load-related knee pain"],
    loadSignature: {
      ...unknownLoad,
      romKneeFlexionDemand: "deep",
      assistance: "TRX / upper-limb assistance",
    },
    provenance: [
      {
        kind: "visit",
        label: "Direct clinical use; Training unresolved",
        visitId: "3752a4dd-108d-4509-8c0d-e3522f87c3d3",
        visitDate: "2026-09-08",
        note: "Visit records sit-to-heel in kneeling with substantial TRX assistance.",
      },
      {
        kind: "visit",
        label: "Repeated clinical use",
        visitId: "ba27aa11-2c32-444c-af59-89d9d32da25d",
        visitDate: "2026-09-10",
        note: "Visit records single-leg sit-to-heel with TRX in deep flexion.",
      },
    ],
    evidence: [PFP],
    unresolvedQuestions: ["No safe exact Training exercise_id exists for this assisted deep-flexion variant."],
  },
  {
    id: "medball-drop-split-squat",
    canonicalName: "Medicine-ball drop to split squat",
    family: "landing",
    variant: "Drop into split squat",
    capacity: "dynamic",
    trainingExerciseId: null,
    expectedTrainingName: null,
    mappingConfidence: "C",
    mappingState: "unresolved",
    clinicalContexts: ["dynamic knee capacity", "deceleration / position control"],
    loadSignature: {
      ...unknownLoad,
      laterality: "unilateral",
      velocity: "dynamic",
      decelerationDemand: "present",
      externalLoad: "medicine ball",
    },
    provenance: [
      {
        kind: "visit",
        label: "Direct clinical use; Training unresolved",
        visitId: "3752a4dd-108d-4509-8c0d-e3522f87c3d3",
        visitDate: "2026-09-08",
        note: "Visit records a medicine-ball drop into split squat with the front foot on a wedge.",
      },
      {
        kind: "visit",
        label: "Repeated clinical use",
        visitId: "4930541b-38ba-4163-a97d-53e92d4c549e",
        visitDate: "2026-09-16",
        note: "Visit records medicine-ball drop in split squat with stabilization in the bottom position.",
      },
    ],
    evidence: [MENISCUS_RTS, ACL],
    unresolvedQuestions: ["Do not substitute a generic Training landing or split-squat exercise without clinician confirmation."],
  },
  {
    id: "assisted-full-rom-split-squat",
    canonicalName: "Assisted full-ROM split squat",
    family: "split_squat",
    variant: "Upper-limb assisted full/deep ROM",
    capacity: "deep_rom",
    trainingExerciseId: null,
    expectedTrainingName: null,
    mappingConfidence: "C",
    mappingState: "unresolved",
    clinicalContexts: ["meniscus postoperative context", "deep-flexion capacity"],
    loadSignature: {
      ...unknownLoad,
      laterality: "unilateral",
      romKneeFlexionDemand: "full/deep",
      assistance: "upper limbs / rack / TRX depending on Visit",
    },
    provenance: [
      {
        kind: "visit",
        label: "Direct clinical use; exact Training variant unresolved",
        visitId: "fd1a5574-979d-422c-9748-6e49cf2c8182",
        visitDate: "2026-08-05",
        note: "Visit explicitly records assisted split squat through full ROM.",
      },
      {
        kind: "visit",
        label: "Repeated clinical use",
        visitId: "4930541b-38ba-4163-a97d-53e92d4c549e",
        visitDate: "2026-09-16",
        note: "Visit again records full-ROM split squat with upper-limb assistance.",
      },
    ],
    evidence: [MENISCUS, MENISCUS_RTS],
    unresolvedQuestions: ["Generic Training split squat exists, but assistance and full-ROM variant are not encoded as an exact canonical exercise."],
  },
  {
    id: "wall-supported-split-squat",
    canonicalName: "Wall-supported split squat",
    family: "split_squat",
    variant: "Wall-supported / wall-contact split squat",
    capacity: "force_activation",
    trainingExerciseId: null,
    expectedTrainingName: null,
    mappingConfidence: "C",
    mappingState: "unresolved",
    clinicalContexts: ["quadriceps capacity", "graded knee loading"],
    loadSignature: {
      ...unknownLoad,
      laterality: "unilateral",
      assistance: "wall support/contact",
    },
    provenance: [
      {
        kind: "visit",
        label: "Direct clinical use; Training unresolved",
        visitId: "2f51df34-6fd8-469c-85a8-b70f35667a8d",
        visitDate: "2026-07-14",
        note: "Visit records an isometric split-squat hold at the wall.",
      },
      {
        kind: "visit",
        label: "Repeated clinical use",
        visitId: "564d0faa-edca-4dbd-9b82-7c79b59af4e8",
        visitDate: "2026-09-08",
        note: "Visit records wall-supported split-squat work.",
      },
    ],
    evidence: [PFP, PATELLAR_TENDON],
    unresolvedQuestions: ["Training has generic/isometric split-squat variants, but no exact wall-supported identity was confirmed."],
  },
  {
    id: "band-hamstring-curl",
    canonicalName: "Band-resisted hamstring curl",
    family: "hamstring_curl",
    variant: "Prone band-resisted knee flexion",
    capacity: "strength_capacity",
    trainingExerciseId: null,
    expectedTrainingName: null,
    mappingConfidence: "C",
    mappingState: "unresolved",
    clinicalContexts: ["posterior-chain capacity", "knee capacity adjunct"],
    loadSignature: {
      ...unknownLoad,
      contraction: "dynamic",
      externalLoad: "resistance band",
    },
    provenance: [
      {
        kind: "visit",
        label: "Direct clinical use; Training unresolved",
        visitId: "a9cf49f5-117b-445f-b36d-9fa297a8a5e3",
        visitDate: "2026-09-29",
        note: "Visit explicitly records prone hamstring flexion against a resistance band. Training has leg-curl exercises, but not this exact setup.",
      },
    ],
    evidence: [MENISCUS_RTS],
    unresolvedQuestions: ["Choose whether this should map to an existing leg-curl exercise or become a distinct Training variant."],
  },
  {
    id: "half-kneeling-ankle-dorsiflexion",
    canonicalName: "Half-kneeling ankle dorsiflexion",
    family: "mobility_adjunct",
    variant: "Half-kneeling dorsiflexion",
    capacity: "tolerance",
    trainingExerciseId: "a8dcae34-c45b-4e43-835a-611e164d43e3",
    expectedTrainingName: "Half kneeling ankle dorsiflexion",
    mappingConfidence: "C",
    mappingState: "unresolved",
    clinicalContexts: ["mobility adjunct", "squat / knee-forward constraint exploration"],
    loadSignature: {
      ...unknownLoad,
      contraction: "mobility",
      laterality: "unilateral",
      kneeForwardDemand: "present",
    },
    provenance: [
      {
        kind: "training",
        label: "Training library availability only",
        note: "Training contains this active mobility exercise. No exact knee-context Visit → exercise_id link was confirmed in the V1 audit.",
      },
      {
        kind: "historical",
        label: "Historical library provenance",
        note: "The same exercise is present in the historical Exercise Database / BV_knee_aid library layer; this is not direct clinical-use evidence.",
      },
    ],
    evidence: [PFP],
    unresolvedQuestions: ["Keep library availability separate from documented knee-context clinical use."],
  },
];

export function getCardsForCell(family: ClinicalFamilyId, capacity: CapacityStageId) {
  return CLINICAL_EXERCISE_CARDS.filter(
    (card) => card.family === family && card.capacity === capacity,
  );
}

export function getClinicalExerciseCard(id: string) {
  return CLINICAL_EXERCISE_CARDS.find((card) => card.id === id) ?? null;
}

export function getClinicalGoal(id: ClinicalGoalId) {
  return CLINICAL_GOALS.find((goal) => goal.id === id) ?? null;
}

export function getMappingConfidenceLabel(confidence: MappingConfidence) {
  if (confidence === "A") return "A · direct clinical use";
  if (confidence === "B") return "B · probable canonical mapping";
  return "C · unresolved / clinician decision";
}
