// lib/types.ts

export type AuditProfile = 'dataops' | 'iiot' | 'web';

export interface AuditProfileConfig {
  id: AuditProfile;
  label: string;
  description: string;
}

export const AUDIT_PROFILES: AuditProfileConfig[] = [
  {
    id: 'dataops',
    label: 'DataOps & Analytics',
    description: 'Checks notebooks, dbt models, lockfiles, and raw data leakage.',
  },
  {
    id: 'iiot',
    label: 'Industrial / PLC',
    description: 'Validates deterministic code, Modbus mocks, and SCADA tests.',
  },
  {
    id: 'web',
    label: 'General Web App',
    description: 'Standard CI/CD, README, dependency, and deployment audit.',
  },
];