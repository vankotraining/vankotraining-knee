"use client";

import { useEffect, useState } from "react";
import type { Session, SupabaseClient } from "@supabase/supabase-js";
import styles from "./clinical-exercise-map.module.css";

type LearningNode = { nodeId: string; label: string; href: string; sourceIds: string[] };
type Result = { userId: string; nodes: LearningNode[]; states: Record<string, string> | null; error: boolean };
const libraryOrigin = "https://library.vankotraining.cz";

function parseNodes(value: unknown): LearningNode[] {
  if (!value || typeof value !== "object" || !("nodes" in value) || !Array.isArray(value.nodes)) return [];
  return value.nodes.filter((node): node is LearningNode => {
    if (!node || typeof node !== "object") return false;
    if (typeof node.nodeId !== "string" || typeof node.label !== "string" || typeof node.href !== "string") return false;
    if (!Array.isArray(node.sourceIds) || !node.sourceIds.every((id: unknown) => typeof id === "string")) return false;
    const expected = `${libraryOrigin}/learn/knee/${encodeURIComponent(node.nodeId.replace(":", "--"))}`;
    return node.href === expected;
  });
}

export default function ClinicalLearningBridge({ nodeIds, supabase, session }: {
  nodeIds: string[]; supabase: SupabaseClient | null; session: Session | null;
}) {
  const [result, setResult] = useState<Result | null>(null);
  const userId = session?.user.id ?? "";
  useEffect(() => {
    if (!userId) return;
    const controller = new AbortController();
    let generation = 0;
    const refresh = async () => {
      const requestGeneration = ++generation;
      try {
        const response = await fetch(`${libraryOrigin}/api/learning-map`, { signal: controller.signal });
        if (!response.ok) throw new Error("Learning manifest unavailable");
        const nodes = parseNodes(await response.json());
        if (!nodes.length) throw new Error("Invalid learning manifest");
        let states: Record<string, string> | null = null;
        if (supabase) {
          const sourceIds = [...new Set(nodes.flatMap((node) => node.sourceIds))];
          const { data, error } = await supabase.from("library_progress")
            .select("source_id,payload").eq("user_id", userId).eq("locale", "shared")
            .eq("asset_version", "reading-v1").in("source_id", sourceIds).abortSignal(controller.signal);
          if (!error && data?.length) {
            // Missing cloud rows mean unknown, not unread: local-only reading is not visible here.
            states = Object.fromEntries(data.flatMap((row) => {
              const state = row.payload?.state;
              return ["unread", "reading", "read", "revisit"].includes(state) ? [[row.source_id, state]] : [];
            }));
          }
        }
        if (!controller.signal.aborted && requestGeneration === generation) setResult({ userId, nodes, states, error: false });
      } catch {
        if (!controller.signal.aborted && requestGeneration === generation) setResult({ userId, nodes: [], states: null, error: true });
      }
    };
    void refresh();
    const onFocus = () => { void refresh(); };
    window.addEventListener("focus", onFocus);
    return () => { controller.abort(); window.removeEventListener("focus", onFocus); };
  }, [supabase, userId]);

  const current = result?.userId === userId ? result : null;
  const nodes = current?.nodes.filter((node) => nodeIds.includes(node.nodeId)) ?? [];
  return <section className={styles.inspectorSection} aria-labelledby="learning-bridge-title">
    <h3 id="learning-bridge-title">Learn / Evidence</h3>
    {!current ? <p>Načítám literaturu…</p> : current.error ? <p>Literaturu nyní nelze načíst. <a href={`${libraryOrigin}/learn/knee`}>Otevřít Library ↗</a></p>
      : nodes.length === 0 ? <p>Pro tuto oblast zatím není připraven čtecí výběr.</p>
      : nodes.map((node) => {
        const states = current.states;
        const known = node.sourceIds.filter((id) => states?.[id]);
        const read = known.filter((id) => states?.[id] === "read").length;
        const reading = known.filter((id) => states?.[id] === "reading" || states?.[id] === "revisit").length;
        const unread = known.filter((id) => states?.[id] === "unread").length;
        return <div className={styles.learningTopic} key={node.nodeId}>
          <a className={styles.primaryLink} href={node.href}>{node.label} · otevřít čtení ↗</a>
          <p>{node.sourceIds.length} zdroje</p>
          <p className={styles.caution}>{known.length ? `Cloud: ${read} přečteno · ${reading} rozpracováno · ${unread} nepřečteno${known.length < node.sourceIds.length ? " · další stav neznámý" : ""}`
            : "Osobní pokrok zobrazí Library; lokální čtení se mezi doménami nesdílí."}</p>
        </div>;
      })}
    <p className={styles.caution}>Čtecí pořadí není evidence ranking ani doporučení pro vybraný cvik.</p>
  </section>;
}
