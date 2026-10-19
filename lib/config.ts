// lib/config.ts

export const MAX_BRANCH_COMPARE = 15;
export const BIG_TREE_THRESHOLD = 2000;
export const REL_PATH_REGEX = /(?:\.\.?\/)(?:[a-zA-Z0-9_\-\.]+\/?)+(?:\.[a-zA-Z0-9]+)?/g;
export const MD_LINK_REGEX = /(!?)\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;

const BT = String.fromCharCode(96);
export const CODE_SPAN_REGEX = new RegExp(BT + '([^' + BT + '\\n]+)' + BT, 'g');

// ═══════════════════════════════════════════════════════════════
// Knowledge-pipeline paths (Week 3-4).
// Used by scripts/build_knowledge.py (mirror), lib/knowledge/graph.ts,
// and scripts/kg/*.py — keep in sync with those scripts.
// ═══════════════════════════════════════════════════════════════
export const KNOWLEDGE_GRAPH_PATH = 'public/knowledge/graph.json';
export const SPECS_DIR = 'docs/specs';
export const KG_STATE_PATH = '.kg_state.json';