# Decision 0005 — Clinical Map / Library learning bridge

Status: implemented in a dependent preview branch; production pending existing PR #29 approval.

Clinical Map owns clinical structure. Library owns reading and learning experience. CSB retains knowledge/evidence authority according to existing governance.

Use existing family/capacity IDs, disambiguated with family: and capacity: prefixes. First slice: family:knee_extension and capacity:strength_capacity. No new clinical taxonomy, mapping or protocol.

Library owns the versioned source-node many-to-many relation, relevance notes and educational reading order. GET https://library.vankotraining.cz/api/learning-map returns only public canonical source IDs/counts and validated topic destinations. Source identities remain CSB-owned.

Knee inspector links matching family/capacity nodes to Library. /clinical/exercises?node= selects the corresponding family/capacity card on return.

Topic routes use transport-safe slugs family--knee_extension and capacity--strength_capacity. Canonical IDs retain the colon and remain query values. The public manifest supplies those validated topic destinations.

Knee reads only the current user's existing library_progress shared reading-v1 rows through the normal authenticated client and RLS. No new table, policy, privileged API or write. Label counts Cloud; missing rows/local-only progress remain unknown. Refresh on focus and hide previous-account data immediately.

This slice links PFP-004 and PFP-002. Counts and reading order do not imply evidence weight, exercise effectiveness, clinical competence or plan recommendations.

Production remains unchanged. Merge PR #29 only after its existing explicit approval gate, then release the bridge and Library together and perform production smoke.

## Verification checkpoint

The complete Map → topic → Deep Read → corresponding Map loop PASSes with canonical-domain requests proxied to exact local builds. Authentication/database remain fixtures; production smoke is still pending.

Runtime commit 6124450be8d8cf736266a87c9cb4001b987bf55d: Vercel Preview dpl_8kDstfVgpqaCUeMN8Mj4AaLfDSjn READY. Library companion runtime b3dd8aab8f7c0eaad0dfdf247284ee8d0a526ea8 / PR #10 has READY Preview dpl_FFee9z6aY71ErBWDCM8KBfXrD98S. This PR #30 depends on unmerged Clinical Map PR #29; no production deployment or acceptance is claimed.

Build/TypeScript, 138 unit tests, changed-file lint and project-control PASS. Browser checks ran exact-commit local production builds because interactive Preview access was blocked by protection. Map auth/database were synthetic fixtures, not Martin's data: correct node selection, Learn links, Cloud counts, current-user GET filter and 390px layout PASS. Library shared progress, assessment/prediction reload, bilingual topic retention, 1440/390/320 layout and topic-main axe smoke PASS. Protected Preview HTTP verifies the safe topic URL and public manifest. Live production RLS, cloud synchronization and the full production acceptance flow remain pending.
