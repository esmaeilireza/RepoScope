// lib/knowledge/standards.ts
//
// Canonical citation registry for industry standards and regulatory frameworks.
//
// Exported KNOWN_STANDARDS values are normalized lowercase strings so they can
// be compared safely by the citation gate and registry verifier.

function normalizeStandardName(value: string): string {
  return value
    .toLowerCase()
    .replace(/[\u2018\u2019\u02BC]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[.,;:]+$/g, "")
    .trim();
}

export const RAW_KNOWN_STANDARDS: readonly string[] = [
  // Generic bodies
  "IEC",
  "IEEE",
  "ISO",
  "NFPA",
  "ISA",
  "NIST",
  "OWASP",

  // Industrial / OT / PLC / Safety
  "IEC 61131-3",
  "IEC 61508",
  "IEC 61508-6 Annex B",
  "IEC 62443",
  "IEC 62443-2-1",
  "IEC 62443-2-1 SP.03.02",
  "IEC 62443-3-2",
  "IEC 62443-3-2 ZCR 1",
  "IEC 62443-3-3",
  "IEC 62443-3-3 SR 3.5",
  "IEC 60909",
  "IEC 61439",
  "ISO 13849",
  "ISA-84",
  "ISA-95 / IEC 62443",
  "NIST SP 800-82",

  // Electrical / Safety / Arc Flash
  "NFPA 70",
  "NFPA 70E",
  "NFPA 70E Article 120",
  "IEEE 1584",

  // Security / Privacy / Governance
  "ISO 27001",
  "ISO/IEC 27001",
  "OWASP Top 10",
  "OWASP ASVS",
  "OWASP Application Security Verification Standard",
  "CIS Benchmark",
  "SOC 2",
];

export const KNOWN_STANDARDS: readonly string[] = Array.from(
  new Set(RAW_KNOWN_STANDARDS.map(normalizeStandardName)),
);