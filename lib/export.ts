// lib/export.ts

import type { Finding } from './types';

export type AuditExportResult = {
  meta: {
    full_name: string;
    html_url: string;
    default_branch: string;
    description?: string;
  };
  tree: Array<{ path: string; type: string; size?: number }>;
  branches: Array<{ name: string; protected?: boolean }>;
  claims: Array<{
    line?: number | string;
    target: string;
    status: string;
    detail: string;
  }>;
  findings: Finding[];
  expl: {
    score: number;
    critical: number;
    errors: number;
    warnings: number;
    infos: number;
    summary: string;
  };
};

export function buildAuditJson(result: AuditExportResult) {
  return {
    exportedAt: new Date().toISOString(),
    repository: {
      fullName: result.meta.full_name,
      htmlUrl: result.meta.html_url,
      defaultBranch: result.meta.default_branch,
      description: result.meta.description || '',
    },
    score: {
      value: result.expl.score,
      summary: result.expl.summary,
      counts: {
        critical: result.expl.critical,
        errors: result.expl.errors,
        warnings: result.expl.warnings,
        infos: result.expl.infos,
      },
    },
    findings: result.findings,
    readmeClaims: result.claims,
    branches: result.branches.map((branch) => ({
      name: branch.name,
      protected: branch.protected,
    })),
    tree: result.tree.map((entry) => ({
      path: entry.path,
      type: entry.type,
      size: entry.size,
    })),
  };
}

function escapeMarkdown(value: unknown): string {
  return String(value ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ');
}

export function buildAuditMarkdown(result: AuditExportResult): string {
  const lines = [
    `# RepoScope audit: ${result.meta.full_name}`,
    '',
    `- **Repository:** ${result.meta.html_url}`,
    `- **Default branch:** ${result.meta.default_branch}`,
    `- **Exported:** ${new Date().toISOString()}`,
    '',
    `## Health score: ${result.expl.summary}`,
    '',
    `| Critical | Errors | Warnings | Info |`,
    `| ---: | ---: | ---: | ---: |`,
    `| ${result.expl.critical} | ${result.expl.errors} | ${result.expl.warnings} | ${result.expl.infos} |`,
    '',
    '## Findings',
    '',
  ];

  if (result.findings.length === 0) {
    lines.push('No findings were reported.', '');
  } else {
    lines.push(
      '| Rule ID | Severity | Finding | Details | Suggested fix |',
      '| --- | --- | --- | --- | --- |'
    );
    result.findings.forEach((finding) => {
      lines.push(
        `| \`${escapeMarkdown(finding.ruleId)}\` | ${escapeMarkdown(finding.severity)} | ${escapeMarkdown(finding.title)} | ${escapeMarkdown(finding.detail)} | ${escapeMarkdown(finding.fix)} |`
      );
    });
    lines.push('');
  }

  lines.push('## README claims', '');
  if (result.claims.length === 0) {
    lines.push('No README claims were analyzed.', '');
  } else {
    lines.push('| Line | Target | Status | Detail |', '| ---: | --- | --- | --- |');
    result.claims.forEach((claim) => {
      lines.push(
        `| ${claim.line ?? ''} | ${escapeMarkdown(claim.target)} | ${escapeMarkdown(claim.status)} | ${escapeMarkdown(claim.detail)} |`
      );
    });
    lines.push('');
  }

  return lines.join('\n');
}