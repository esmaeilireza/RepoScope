// lib/profiles.ts
const PUBLIC_PROFILES = ["webapp", "dataops", "iiot"] as const;
const HIDDEN_PROFILES = ["general", "cross"] as const;

export type PublicProfile = (typeof PUBLIC_PROFILES)[number];
export type InternalProfile = PublicProfile | (typeof HIDDEN_PROFILES)[number];

const ALL_PROFILES: readonly string[] = [
  ...PUBLIC_PROFILES,
  ...HIDDEN_PROFILES,
];

function toInternalProfiles(values: readonly string[]): InternalProfile[] {
  const out: InternalProfile[] = [];

  for (const value of values) {
    if (ALL_PROFILES.includes(value)) {
      out.push(value as InternalProfile);
    }
  }

  return out;
}

function uniqueProfiles(values: readonly InternalProfile[]): InternalProfile[] {
  const seen = new Set<InternalProfile>();
  const out: InternalProfile[] = [];

  for (const value of values) {
    if (!seen.has(value)) {
      seen.add(value);
      out.push(value);
    }
  }

  return out;
}

export function resolveProfiles(
  requested: readonly string[] | undefined,
  inferred: readonly string[] | undefined,
): InternalProfile[] {
  const requestedProfiles = toInternalProfiles(requested ?? []);

  if (requestedProfiles.length > 0) {
    return uniqueProfiles([...requestedProfiles, ...HIDDEN_PROFILES]);
  }

  const inferredProfiles = toInternalProfiles(inferred ?? []);

  if (inferredProfiles.length > 0) {
    return uniqueProfiles([...inferredProfiles, ...HIDDEN_PROFILES]);
  }

  return uniqueProfiles(["webapp", ...HIDDEN_PROFILES]);
}