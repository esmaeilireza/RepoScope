// lib/github-auto-fix.ts

import { AutoFixPatch, ErrorPattern } from './github-error-patterns';

export interface FixProposal {
  pattern: ErrorPattern;
  patch: AutoFixPatch;
  confidence: number;
  risk: 'low' | 'medium' | 'high';
  preview: {
    before: string;
    after: string;
  };
}

export function generateFixProposals(patterns: ErrorPattern[]): FixProposal[] {
  return patterns
    .filter(p => p.solution.autoFix)
    .map(pattern => ({
      pattern,
      patch: pattern.solution.autoFix!,
      confidence: calculateConfidence(pattern),
      risk: assessRisk(pattern),
      preview: {
        before: pattern.solution.autoFix!.originalContent || '(empty file)',
        after: pattern.solution.autoFix!.fixedContent || '(generated content)',
      },
    }));
}

function calculateConfidence(pattern: ErrorPattern): number {
  // Higher confidence for well-known, safe fixes
  const safeFixes = [
    'use-client-missing',
    'nextjs-image-unconfigured',
    'pnpm-workspace-invalid',
  ];
  
  if (safeFixes.includes(pattern.id)) return 95;
  if (pattern.severity === 'info') return 80;
  return 70;
}

function assessRisk(pattern: ErrorPattern): 'low' | 'medium' | 'high' {
  const lowRisk = ['use-client-missing', 'nextjs-image-unconfigured'];
  const highRisk = ['npm-install-failed', 'git-merge-conflict'];
  
  if (lowRisk.includes(pattern.id)) return 'low';
  if (highRisk.includes(pattern.id)) return 'high';
  return 'medium';
}

export function applyAutoFix(
  fileContent: string,
  patch: AutoFixPatch
): string {
  // Simple patch application for demonstration
  // In production, use a proper diff library like 'diff'
  if (patch.originalContent && fileContent.includes(patch.originalContent)) {
    return fileContent.replace(patch.originalContent, patch.fixedContent || '');
  }
  
  // Fallback: append if original not found
  if (!fileContent.trim()) {
    return patch.fixedContent || '';
  }
  
  return fileContent + '\n' + (patch.fixedContent || '');
}

export function generateFixCommands(
  fix: FixProposal,
  owner: string,
  repo: string
): string[] {
  return [
    `# ═══ Auto-Fix: ${fix.pattern.title} ═══`,
    `# Confidence: ${fix.confidence}% | Risk: ${fix.risk}`,
    '',
    `# 1. Create/modify the file`,
    `cat > ${fix.patch.file} << 'EOF'`,
    fix.patch.fixedContent || '',
    'EOF',
    '',
    `# 2. Stage the changes`,
    `git add ${fix.patch.file}`,
    '',
    `# 3. Commit with descriptive message`,
    `git commit -m "fix: ${fix.pattern.title.toLowerCase()}"`,
    '',
    `# 4. Push to trigger CI`,
    `git push origin main`,
    '',
    `# 5. Verify the fix`,
    `gh run list --repo ${owner}/${repo} --branch main --limit 1`,
  ];
}