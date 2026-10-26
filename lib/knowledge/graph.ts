// lib/knowledge/graph.ts — SERVER ONLY.
//
// Loads the static knowledge graph produced by scripts/kg/assemble_graph.py
// and provides bounded traversal helpers for grounding and citation gating.
//
// Graceful degradation:
//   If public/knowledge/graph.json is missing or malformed, grounding is
//   silently disabled and the deterministic audit engine continues working.
//   This is intentional resilience-by-design behavior.

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
  source?: {
    book?: string;
    chapter?: string;
    page_range?: string;
  };
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

export interface CrossDomainResult {
  crossDomain: boolean;
  domains: string[];
}

let cached: KnowledgeGraph | null | undefined; // undefined = not yet loaded

const nodeById = new Map<string, GraphNode>();
const edgesFrom = new Map<string, GraphEdge[]>();
let indexed = false;

function graphFilePath(): string {
  return path.join(process.cwd(), "public", "knowledge", "graph.json");
}

export function loadGraph(): KnowledgeGraph | null {
  if (cached !== undefined) return cached;

  try {
    const file = graphFilePath();

    if (!fs.existsSync(file)) {
      cached = null;
      return cached;
    }

    const raw = fs.readFileSync(file, "utf-8");
    const parsed = JSON.parse(raw) as KnowledgeGraph;

    if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.nodes) || !Array.isArray(parsed.edges)) {
      console.warn("[graph] graph.json has unexpected shape — grounding disabled");
      cached = null;
      return cached;
    }

    cached = parsed;
  } catch (err) {
    console.warn("[graph] failed to load graph.json — grounding disabled:", err);
    cached = null;
  }

  return cached;
}

export function graphIsAvailable(): boolean {
  return loadGraph() !== null;
}

export function resetGraphCache(): void {
  cached = undefined;
  nodeById.clear();
  edgesFrom.clear();
  indexed = false;
}

function ensureIndex(): void {
  if (indexed) return;

  const graph = loadGraph();

  if (graph) {
    for (const node of graph.nodes) {
      nodeById.set(node.id, node);
    }

    for (const edge of graph.edges) {
      const existing = edgesFrom.get(edge.source);
      if (existing) {
        existing.push(edge);
      } else {
        edgesFrom.set(edge.source, [edge]);
      }
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

  for (const [id, node] of nodeById.entries()) {
    if (node.type === "rule") {
      ids.add(id.replace(/^rule:/, ""));
    }
  }

  return ids;
}

/**
 * One-hop BFS from a rule node.
 *
 * This is intentionally bounded. Graph traversal in grounding contexts should
 * never be unbounded; see Graph Databases / Graph algorithms guidance on
 * bounded multi-hop traversal.
 */
export function expandOneHop(ruleId: string): OneHop {
  ensureIndex();

  const rid = `rule:${ruleId.toLowerCase()}`;
  const rule = nodeById.get(rid) ?? null;

  if (!rule) {
    return { rule: null, concepts: [], books: [] };
  }

  const concepts: ConceptRef[] = [];
  const books: string[] = [];

  const outgoing = edgesFrom.get(rid) ?? [];

  for (const edge of outgoing) {
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

export function subgraphForProfile(profile: string): {
  nodes: GraphNode[];
  edges: GraphEdge[];
} {
  const graph = loadGraph();
  if (!graph) return { nodes: [], edges: [] };

  const p = profile.toLowerCase();

  const nodes = graph.nodes.filter(
    (node) =>
      node.profile?.toLowerCase() === p ||
      node.domain?.toLowerCase() === p ||
      (node.type === "rule" && node.id.toLowerCase().startsWith(`rule:${p}`)),
  );

  const ids = new Set(nodes.map((node) => node.id));

  const edges = graph.edges.filter(
    (edge) => ids.has(edge.source) && ids.has(edge.target),
  );

  return { nodes, edges };
}

export function graphStats(): Record<string, number> {
  return loadGraph()?.stats ?? {};
}

/**
 * Detect whether a set of findings spans more than one audit profile.
 *
 * Used by grounding/citation layers to avoid silently mixing domain evidence
 * from unrelated profiles.
 */
export function detectCrossDomain(
  findings: ReadonlyArray<{ profile?: string | null }>,
): CrossDomainResult {
  const domains = Array.from(
    new Set(
      findings
        .map((finding) =>
          typeof finding.profile === "string"
            ? finding.profile.trim().toLowerCase()
            : "",
        )
        .filter((profile): profile is string => profile.length > 0),
    ),
  ).sort();

  return {
    crossDomain: domains.length > 1,
    domains,
  };
}