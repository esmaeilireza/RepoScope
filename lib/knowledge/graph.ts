// lib/knowledge/graph.ts — SERVER ONLY. Loads the static knowledge graph
// produced by scripts/kg/assemble_graph.py (Day 15) and provides traversal.
// Graceful degradation: if graph.json is missing, grounding silently
// disables and the audit engine keeps working (resilience by design).
import fs from "node:fs";
import path from "node:path";

export interface GraphNode {
  id: string;
  type: "rule" | "concept" | "book";
  label: string;
  severity?: string;
  profile?: string;
  rationale?: string;
  fix?: string;
  definition?: string;
  domain?: string;
  kind?: string; // for book nodes: "book" | "standard"
  source?: { book?: string; chapter?: string; page_range?: string };
}

export interface GraphEdge {
  source: string;
  target: string;
  type: string;
  weight?: number;
}

export interface KnowledgeGraph {
  version: string;
  generated_at?: string;
  stats?: Record<string, number>;
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface ConceptRef {
  label: string;
  definition: string;
  book?: string;
}

export interface OneHop {
  rule: GraphNode | null;
  concepts: ConceptRef[];
  books: string[];
}

let cached: KnowledgeGraph | null | undefined; // undefined = not yet loaded

export function loadGraph(): KnowledgeGraph | null {
  if (cached !== undefined) return cached;
  try {
    const file = path.join(process.cwd(), "public", "knowledge", "graph.json");
    if (!fs.existsSync(file)) {
      cached = null;
      return cached;
    }
    cached = JSON.parse(fs.readFileSync(file, "utf-8")) as KnowledgeGraph;
  } catch (err) {
    console.warn("[graph] failed to load graph.json — grounding disabled:", err);
    cached = null;
  }
  return cached;
}

export function graphIsAvailable(): boolean {
  return loadGraph() !== null;
}

// ---- lazy indexes ----
const nodeById = new Map<string, GraphNode>();
const edgesFrom = new Map<string, GraphEdge[]>();
let indexed = false;

function ensureIndex(): void {
  if (indexed) return;
  const g = loadGraph();
  if (g) {
    for (const n of g.nodes) nodeById.set(n.id, n);
    for (const e of g.edges) {
      const arr = edgesFrom.get(e.source) ?? [];
      arr.push(e);
      edgesFrom.set(e.source, arr);
    }
  }
  indexed = true;
}

export function hasRule(id: string): boolean {
  ensureIndex();
  return nodeById.has(`rule:${id.toLowerCase()}`);
}

export function getRule(id: string): GraphNode | null {
  ensureIndex();
  return nodeById.get(`rule:${id.toLowerCase()}`) ?? null;
}

export function loadValidRuleIds(): Set<string> {
  ensureIndex();
  const ids = new Set<string>();
  for (const [id, node] of nodeById) {
    if (node.type === "rule") ids.add(id.replace(/^rule:/, ""));
  }
  return ids;
}

/** One-hop BFS from a rule node (per Graph Algorithms, ch. 2 — bounded traversal). */
export function expandOneHop(ruleId: string): OneHop {
  ensureIndex();
  const rid = `rule:${ruleId.toLowerCase()}`;
  const rule = nodeById.get(rid) ?? null;
  if (!rule) return { rule: null, concepts: [], books: [] };

  const concepts: ConceptRef[] = [];
  const books: string[] = [];

  for (const edge of edgesFrom.get(rid) ?? []) {
    const target = nodeById.get(edge.target);
    if (!target) continue;
    if (target.type === "concept") {
      concepts.push({
        label: target.label,
        definition: target.definition ?? "",
        book: target.source?.book,
      });
    } else if (target.type === "book") {
      books.push(target.label);
    }
  }
  return { rule, concepts, books };
}

export function subgraphForProfile(profile: string): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const g = loadGraph();
  if (!g) return { nodes: [], edges: [] };
  const nodes = g.nodes.filter(
    (n) =>
      n.profile === profile ||
      n.domain === profile ||
      (n.type === "rule" && n.id.startsWith(`rule:${profile}`))
  );
  const ids = new Set(nodes.map((n) => n.id));
  const edges = g.edges.filter((e) => ids.has(e.source) && ids.has(e.target));
  return { nodes, edges };
}

export function graphStats(): Record<string, number> {
  return loadGraph()?.stats ?? {};
}
export function detectCrossDomain(
  findings: ReadonlyArray<{ profile?: string }>
): { crossDomain: boolean; domains: string[] } {
  const domains = Array.from(
    new Set(
      findings
        .map((f) => f.profile)
        .filter((p): p is string => typeof p === "string" && p.length > 0)
    )
  );

  return {
    crossDomain: domains.length > 1,
    domains,
  };
}