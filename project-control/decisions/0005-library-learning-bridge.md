# Decision 0005 — Clinical Map / Library learning bridge

Status: CLOSED / VERIFIED — approved, merged and production verified; operating mode USE / OBSERVE.

Clinical Map owns clinical structure. Library owns reading and learning experience. CSB retains knowledge/evidence authority according to existing governance.

Use existing family/capacity IDs, disambiguated with family: and capacity: prefixes. First slice: family:knee_extension and capacity:strength_capacity. No new clinical taxonomy, mapping or protocol.

Library owns the versioned source-node many-to-many relation, relevance notes and educational reading order. GET https://library.vankotraining.cz/api/learning-map returns only public canonical source IDs/counts and validated topic destinations. Source identities remain CSB-owned.

Knee inspector links matching family/capacity nodes to Library. /clinical/exercises?node= selects the corresponding family/capacity card on return.

Topic routes use transport-safe slugs family--knee_extension and capacity--strength_capacity. Canonical IDs retain the colon and remain query values. The public manifest supplies those validated topic destinations.

Knee reads only the current user's existing library_progress shared reading-v1 rows through the normal authenticated client and RLS. No new table, policy, privileged API or write. Label counts Cloud; missing rows/local-only progress remain unknown. Refresh on focus and hide previous-account data immediately.

The original bridge slice linked PFP-004 and PFP-002; the later verified Library content expansion adds AMI-001, AMI-002, AMI-003, ACL-012 and ACL-014 to both existing nodes. Counts and reading order do not imply evidence weight, exercise effectiveness, clinical competence or plan recommendations.

## Release checkpoint — 2026-10-03 (Europe/Prague)

Status: **CLOSED / VERIFIED — KNEE LEARNING HUB V1; runtime remains in production.**

- Clinician approved V1.3 reasoning lens and coordinated release. Knee PR #29 and #30 and Library PR #10 are merged.
- Original bridge V1 runtime release commits were Knee `5cb052ce47000f6fa05f3c477f96e7f2b7617f32` and Library `1595e497aa911da61a3f16402e02abe728f21332`; these identify the original bridge release. Later Library content publication is recorded separately below; docs-only commits do not change runtime behavior.
- At bridge V1 acceptance, the production learning-map manifest returned HTTP 200 with the two canonical nodes and PFP-004/PFP-002. Live Map → topic → Deep Read → corresponding Map navigation PASS.
- Authenticated Library production sign-in and cloud persistence PASS. Canonical `library_progress` contains PFP-004 / shared / reading-v1 with state `reading`; authenticated own-row RLS read-back PASS.
- Authenticated production Knee browser read-back PASS: Knee extension shows `Cloud: 0 přečteno · 1 rozpracováno · 0 nepřečteno · další stav neznámý` and links to the canonical Library topic.
- Final live responsive/accessibility smoke PASS: Library topic 390/320 px has no horizontal overflow and 0 axe violations scoped to main; PFP-004 bilingual/backlink smoke at 390 px has no overflow and 0 axe violations scoped to main; authenticated Knee learning panel at 390 px has no overflow, 0 axe violations and no page errors.
- Final Vercel runtime-error scans found no runtime errors for Library or Knee in the inspected window.
- No production migration, clinical-data write, new evidence authority, new Deep Read or new feature scope was introduced by this closeout.
- Next operating mode: USE / OBSERVE. Open another feature workstream only from recurring decision-relevant friction/value; existing Deep Read publication gate remains unchanged.

### Subsequent Library content publication — verified current projection

Library PR #12 published AMI-001, AMI-002, AMI-003, ACL-012 and ACL-014 in CZ/EN at runtime commit `140f16e1561a52fd53dedcb5fb8fdb7ef9c051ae`; final documentation commit `f68678940d35c833691711ac483dd86536a24088` is production READY as `dpl_56GHFUWMS3Q41kTwry1kZobVX4eD`. Library now has 11 published Deep Reads. Each of the two existing Knee topics exposes 7 unique sources across Start here / Core / Deep dive / Context / Update. This content expansion is CLOSED / VERIFIED under its explicit one-off publication override; default future publication governance is restored. No new clinical taxonomy or evidence authority was created.

Knee final acceptance documentation commit `07dc0b940b3caecfe7e2842d890caae64b890c44` is production READY as `dpl_FV8J4qqnEHLvjRYxhwYkUKxnjmox`. Current deployment IDs are verification snapshots, not immutable aliases.

## Historical pre-release evidence

The following checkpoint records pre-release build evidence; pending merge statements here are historical.

## Verification checkpoint

The complete Map → topic → Deep Read → corresponding Map loop PASSes with canonical-domain requests proxied to exact local builds. Authentication/database remain fixtures; production smoke is still pending.

Runtime commit 6124450be8d8cf736266a87c9cb4001b987bf55d: Vercel Preview dpl_8kDstfVgpqaCUeMN8Mj4AaLfDSjn READY. Library companion runtime b3dd8aab8f7c0eaad0dfdf247284ee8d0a526ea8 / PR #10 has READY Preview dpl_FFee9z6aY71ErBWDCM8KBfXrD98S. This PR #30 depends on unmerged Clinical Map PR #29; no production deployment or acceptance is claimed.

Build/TypeScript, 138 unit tests, changed-file lint and project-control PASS. Browser checks ran exact-commit local production builds because interactive Preview access was blocked by protection. Map auth/database were synthetic fixtures, not Martin's data: correct node selection, Learn links, Cloud counts, current-user GET filter and 390px layout PASS. Library shared progress, assessment/prediction reload, bilingual topic retention, 1440/390/320 layout and topic-main axe smoke PASS. Protected Preview HTTP verifies the safe topic URL and public manifest. Live production RLS, cloud synchronization and the full production acceptance flow remain pending.
