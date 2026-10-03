# Decision 0005 — Clinical Map / Library learning bridge

Status: implemented in a dependent preview branch; production pending existing PR #29 approval.

Clinical Map owns clinical structure. Library owns reading and learning experience. CSB retains knowledge/evidence authority according to existing governance.

Use existing family/capacity IDs, disambiguated with family: and capacity: prefixes. First slice: family:knee_extension and capacity:strength_capacity. No new clinical taxonomy, mapping or protocol.

Library owns the versioned source-node many-to-many relation, relevance notes and educational reading order. GET https://library.vankotraining.cz/api/learning-map returns only public canonical source IDs/counts and validated topic destinations. Source identities remain CSB-owned.

Knee inspector links matching family/capacity nodes to Library. /clinical/exercises?node= selects the corresponding family/capacity card on return.

Knee reads only the current user's existing library_progress shared reading-v1 rows through the normal authenticated client and RLS. No new table, policy, privileged API or write. Label counts Cloud; missing rows/local-only progress remain unknown. Refresh on focus and hide previous-account data immediately.

This slice links PFP-004 and PFP-002. Counts and reading order do not imply evidence weight, exercise effectiveness, clinical competence or plan recommendations.

Production remains unchanged. Merge PR #29 only after its existing explicit approval gate, then release the bridge and Library together and perform production smoke.
