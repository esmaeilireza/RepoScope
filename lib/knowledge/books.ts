// lib/knowledge/books.ts
//
// Canonical citation registry for books.
//
// The citation gate compares normalized strings. This module therefore:
//   1. stores raw human-readable titles,
//   2. normalizes them to lowercase ASCII-friendly strings,
//   3. deduplicates the result,
//   4. exports stable readonly arrays.

import { KNOWN_STANDARDS as ImportedKnownStandards } from "./standards";

export function normalizeSourceName(value: string): string {
  return value
    .toLowerCase()
    .replace(/[\u2018\u2019\u02BC]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

const RAW_KNOWN_BOOKS: readonly string[] = [
  // ── Industrial / PLC & SCADA (Layer P: iiot) ───────────────────
  "Industrial Network Security",
  "Industrial Network Security: Securing Critical Infrastructure Networks for Smart Grid, SCADA, and Other Industrial Control Systems",
  "Practical Industrial Data Networks",
  "Practical Industrial Data Networks: Design, Installation and Troubleshooting",
  "Automating Manufacturing Systems with PLCs",
  "OPC Unified Architecture",
  "PLC Controls with Structured Text",
  "PLC Controls with Structured Text (ST)",

  // ── DataOps & Analytics (Layer P: dataops) ─────────────────────
  "Analytics Engineering with SQL and dbt",
  "Data Quality Fundamentals",
  "Data Quality Fundamentals: A Practitioner's Guide to Building Trustworthy Data Pipelines",
  "Data Management at Scale",
  "Fundamentals of Data Engineering",
  "Fundamentals of Data Engineering: Plan and Build Robust Data Systems",
  "Practical DataOps",
  "Designing Data-Intensive Applications",
  "The Data Warehouse Toolkit",
  "The Data Warehouse Toolkit: The Definitive Guide to Dimensional Modeling",

  // ── General Web App (Layer P: webapp) ──────────────────────────
  "Web Application Security",
  "Web Application Security: A Guide for Developers",
  "API Design Patterns",
  "API Design Patterns: Collaborating with Web Services in the Enterprise",
  "Building Microservices",
  "Building Microservices: Designing Fine-Grained Systems",
  "Clean Architecture",
  "Clean Architecture: A Craftsman's Guide to Software Structure and Design",
  "Continuous Delivery",
  "Continuous Delivery: Reliable Software Releases through Build, Test, and Deployment Automation",
  "Designing Web APIs",
  "Designing Web APIs: Building APIs That Developers Love",
  "Site Reliability Engineering",
  "Site Reliability Engineering: How Google Runs Production Systems",
  "Production-Ready Microservices",
  "Production-Ready Microservices: Building Standardized Systems Across an Engineering Organization",
  "The DevOps Handbook",
  "The DevOps Handbook: How to Create World-Class Agility, Reliability, & Security in Technology Organizations",

  // ── Graph RAG (Layer G: grounding — ALWAYS applied) ────────────
  "Agentic GraphRAG",
  "Agentic GraphRAG: Integrating Knowledge Graphs, Reasoning, and Agency for Enterprise AI",
  "Essential GraphRAG",
  "Essential GraphRAG: Knowledge Graph-Enhanced RAG",
  "Graph Algorithms",
  "Graph Algorithms: Practical Examples in Apache Spark and Neo4j",
  "Graph Algorithms: Exploring Power Graph Analytics",
  "Graph Databases",
  "Graph Databases: New Opportunities for Connected Data",
  "Graph Databases: New Opportunities for Connected Data (2nd Edition)",
  "Graph-Powered Machine Learning",

  // ── Industrial ML (Layer M: global lens — ALWAYS applied) ──────
  // 01-realtime-streams
  "Designing Event-Driven Systems",
  "Streaming Systems",
  "Streaming Systems: The What, Where, When, and How of Large-Scale Data Processing",

  // 02-iiot-edge-digital-twins
  "Building Industrial Digital Twins",
  "Building Industrial Digital Twins: Design, develop, and deploy digital twin solutions for real-world industries using Azure Digital Twins",
  "Hands-On AI for IoT",
  "Hands-On Artificial Intelligence for IoT, Second Edition",
  "Hands-On Industrial IoT",
  "Hands-On Industrial Internet of Things, Second Edition",

  // 03-time-series-sensor-analytics
  "Deep Learning for Time Series Forecasting",
  "Machine Learning for Time-Series with Python",
  "Machine Learning for Time Series Forecasting with Python",

  // 04-industrial-mlops
  "Designing Machine Learning Systems",
  "Designing Machine Learning Systems: An Iterative Process for Production-Ready Applications",
  "Industrial Machine Learning",
  "Industrial Machine Learning: Integrating Digital Twins, Prototyping, and the Internet of Things for Industrial Applications",
  "Outlier Analysis",
  "Outlier Analysis: Algorithms and Applications",
];

export const KNOWN_BOOKS: readonly string[] = Array.from(
  new Set(RAW_KNOWN_BOOKS.map(normalizeSourceName)),
);

export const KNOWN_STANDARDS: readonly string[] = ImportedKnownStandards;

export const KNOWN_SOURCES: readonly string[] = Array.from(
  new Set([
    ...KNOWN_BOOKS,
    ...KNOWN_STANDARDS.map(normalizeSourceName),
  ]),
);

export function listKnownSources(): readonly string[] {
  return KNOWN_SOURCES;
}