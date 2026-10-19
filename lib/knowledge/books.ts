// lib/knowledge/books.ts


import { KNOWN_STANDARDS } from "./standards";

// Re-export so downstream code can do:
//   import { KNOWN_STANDARDS } from "@/lib/knowledge/books";
export { KNOWN_STANDARDS } from "./standards";

export const KNOWN_BOOKS: readonly string[] = [
  // ── Industrial / PLC & SCADA (Layer P: iiot) ───────────────────
  "industrial network security",
  "industrial network security: securing critical infrastructure networks for smart grid, scada, and other industrial control systems",
  "practical industrial data networks",
  "automating manufacturing systems with plcs",
  "opc unified architecture",
  "plc controls with structured text",

  // ── DataOps & Analytics (Layer P: dataops) ─────────────────────
  "analytics engineering with sql and dbt",
  "data quality fundamentals",
  "data quality fundamentals: a practitioner's guide to building trustworthy data pipelines",
  "data management at scale",
  "fundamentals of data engineering",
  "fundamentals of data engineering: plan and build robust data systems",
  "practical dataops",
  "designing data-intensive applications",
  "the data warehouse toolkit",

  // ── General Web App (Layer P: webapp) ──────────────────────────
  "web application security",
  "api design patterns",
  "building microservices",
  "building microservices: designing fine-grained systems",
  "clean architecture",
  "clean architecture: a craftsman's guide to software structure and design",
  "continuous delivery",
  "continuous delivery: reliable software releases through build, test, and deployment automation",
  "designing web apis",
  "designing web apis: building apis that developers love",
  "site reliability engineering",
  "site reliability engineering: how google runs production systems",
  "production-ready microservices",
  "production-ready microservices: building standardized systems across an engineering organization",
  "the devops handbook",
  "the devops handbook: how to create world-class agility, reliability, & security in technology organizations",

  // ── Graph RAG (Layer G: grounding — ALWAYS applied) ────────────
  "agentic graphrag",
  "essential graphrag",
  "graph algorithms",
  "graph databases",
  "graph-powered machine learning",

  // ── Industrial ML (Layer M: global lens — ALWAYS applied) ──────
  // 01-realtime-streams
  "designing event-driven systems",
  "streaming systems",
  // 02-iiot-edge-digital-twins
  "building industrial digital twins",
  "hands-on ai for iot",
  "hands-on industrial iot",
  // 03-time-series-sensor-analytics
  "deep learning for time series forecasting",
  "machine learning for time-series with python",
  // 04-industrial-mlops
  "designing machine learning systems",
  "industrial machine learning",
  "outlier analysis",
];

export const KNOWN_SOURCES: readonly string[] = [...KNOWN_BOOKS, ...KNOWN_STANDARDS];

export function listKnownSources(): readonly string[] {
  return KNOWN_SOURCES;
}

/**
 * Normalize a source/book title for robust comparison.
 *
 * Handles:
 *   - Unicode curly quotes (’, “, ”, –, —)
 *   - Collapsing whitespace
 *   - Lowercasing
 *
 * Use this in citation-gate.ts before comparing against KNOWN_SOURCES.
 */
export function normalizeSourceName(value: string): string {
  return value
    .toLowerCase()
    .replace(/[\u2018\u2019\u02BC]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}