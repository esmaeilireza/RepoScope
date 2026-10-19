// scripts/verify-knowledge-registry.ts
import {
  KNOWN_BOOKS,
  KNOWN_STANDARDS,
  KNOWN_SOURCES,
} from "../lib/knowledge/books";

const requiredBookKeys = [
  "industrial network security",
  "practical industrial data networks",
  "automating manufacturing systems with plcs",
  "opc unified architecture",
  "plc controls with structured text",

  "analytics engineering with sql and dbt",
  "data quality fundamentals",
  "data management at scale",
  "fundamentals of data engineering",
  "practical dataops",
  "designing data-intensive applications",
  "the data warehouse toolkit",

  "web application security",
  "api design patterns",
  "building microservices",
  "clean architecture",
  "continuous delivery",
  "designing web apis",
  "site reliability engineering",
  "production-ready microservices",
  "the devops handbook",
];

const requiredStandardKeys = [
  "iec 62443",
  "iec 61131-3",
  "nfpa 70e",
  "owasp top 10",
  "owasp asvs",
  "iso 27001",
];

const missingBooks = requiredBookKeys.filter(
  (title) => !KNOWN_BOOKS.includes(title)
);

const missingStandards = requiredStandardKeys.filter(
  (standard) => !KNOWN_STANDARDS.includes(standard)
);

if (missingBooks.length > 0) {
  console.error("MISSING BOOKS:");
  console.error(missingBooks);
}

if (missingStandards.length > 0) {
  console.error("MISSING STANDARDS:");
  console.error(missingStandards);
}

if (missingBooks.length > 0 || missingStandards.length > 0) {
  process.exit(1);
}

// Optional but important:
// Verify that long human-readable titles are still matched by the citation gate.
const longTitlesThatShouldMatch = [
  "Fundamentals of Data Engineering: Plan and Build Robust Data Systems",
  "Building Microservices: Designing Fine-Grained Systems",
  "Clean Architecture: A Craftsman's Guide to Software Structure and Design",
  "Continuous Delivery: Reliable Software Releases through Build, Test, and Deployment Automation",
  "Designing Web APIs: Building APIs That Developers Love",
  "Production-Ready Microservices: Building Standardized Systems Across an Engineering Organization",
  "Site Reliability Engineering: How Google Runs Production Systems",
  "The DevOps Handbook: How to Create World-Class Agility, Reliability, and Security in Technology Organizations",
];

const unmatchedLongTitles = longTitlesThatShouldMatch.filter((title) => {
  const lower = title.toLowerCase();
  return !KNOWN_SOURCES.some((source) => lower.includes(source));
});

if (unmatchedLongTitles.length > 0) {
  console.error("LONG TITLES NOT MATCHED BY CITATION KEYS:");
  console.error(unmatchedLongTitles);
  process.exit(1);
}

console.log(
  `OK — books: ${KNOWN_BOOKS.length}, standards: ${KNOWN_STANDARDS.length}, sources: ${KNOWN_SOURCES.length}`
);