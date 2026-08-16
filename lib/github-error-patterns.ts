// lib/github-error-patterns.ts

export interface ErrorPattern {
  id: string;
  patterns: RegExp[];
  title: string;
  description: string;
  severity: 'critical' | 'error' | 'warning' | 'info';
  category: 'build' | 'dependency' | 'config' | 'network' | 'security' | 'runtime';
  solution: {
    explanation: string;
    steps: string[];
    commands: string[];
    autoFix?: AutoFixPatch;
    docsUrl?: string;
    preventInFuture: string;
  };
  relatedErrors?: string[];
}

export interface AutoFixPatch {
  description: string;
  file: string;
  originalContent?: string;
  fixedContent?: string;
  patch: string; // unified diff format
}

export const ERROR_PATTERNS: ErrorPattern[] = [
  // ═══════════════════════════════════════
  // NEXT.JS & REACT ERRORS
  // ═══════════════════════════════════════
  {
    id: 'nextjs-build-failed',
    patterns: [/Failed to compile/i, /Build error occurred/i, /next build.*failed/i],
    title: 'Next.js Build Failed',
    description: 'The Next.js production build encountered errors',
    severity: 'critical',
    category: 'build',
    solution: {
      explanation: 'Next.js cannot build your application. This usually means TypeScript errors, invalid JSX, or missing dependencies.',
      steps: [
        'Run the build locally to see the exact error',
        'Fix the reported TypeScript/JSX issues',
        'Verify the build passes locally before pushing',
      ],
      commands: [
        '# Reproduce locally',
        'npm run build',
        '',
        '# Or with pnpm',
        'pnpm build',
        '',
        '# Fix TypeScript errors',
        'npx tsc --noEmit',
      ],
      preventInFuture: 'Always run "npm run build" locally before pushing. Add a pre-push hook.',
      docsUrl: 'https://nextjs.org/docs/messages/build-error',
    },
  },
  {
    id: 'use-client-missing',
    patterns: [
      /useState is not defined/i,
      /useEffect is not defined/i,
      /useContext is not defined/i,
      /You're importing a component that needs/i,
      /React\.useState.*client component/i,
    ],
    title: 'Missing "use client" Directive',
    description: 'React hooks used without client component marker',
    severity: 'error',
    category: 'build',
    solution: {
      explanation: 'Next.js App Router treats files as Server Components by default. Components using hooks must have "use client" at the very top.',
      steps: [
        'Open the file mentioned in the error',
        'Add "use client"; as the VERY FIRST line (before any imports)',
        'Save and rebuild',
      ],
      commands: [
        '# Find files using hooks without "use client"',
        'grep -rL "use client" components/ --include="*.tsx" | xargs grep -l "useState\\|useEffect"',
        '',
        '# Add use client to a specific file',
        'sed -i \'1i "use client";\' components/YourFile.tsx',
      ],
      autoFix: {
        description: 'Add "use client" directive',
        file: 'components/YourFile.tsx',
        patch: `@@ -1,3 +1,4 @@
+"use client";
 import { useState } from 'react';`,
      },
      preventInFuture: 'Create a VS Code snippet for "use client" and always use it when creating new components.',
    },
  },
  {
    id: 'typescript-module-not-found',
    patterns: [/Cannot find module/i, /TS2307/i, /Module not found/i],
    title: 'TypeScript Module Not Found',
    description: 'Import path does not match any existing file',
    severity: 'error',
    category: 'build',
    solution: {
      explanation: 'A TypeScript import statement references a module that doesn\'t exist at the specified path.',
      steps: [
        'Check the exact import path in the error',
        'Verify the file exists at that location',
        'Fix the import path or create the missing file',
        'Check tsconfig.json paths alias configuration',
      ],
      commands: [
        '# Find the problematic import',
        'grep -rn "from \'@/" --include="*.tsx" --include="*.ts"',
        '',
        '# Check actual file structure',
        'find . -name "*.ts" -o -name "*.tsx" | grep -v node_modules | sort',
        '',
        '# Check tsconfig paths',
        'cat tsconfig.json | grep -A 5 "paths"',
      ],
      preventInFuture: 'Use TypeScript path aliases (@/) and let your editor auto-complete imports.',
    },
  },
  {
    id: 'nextjs-image-unconfigured',
    patterns: [
      /Invalid src prop.*next\/image/i,
      /hostname.*not configured/i,
      /Image Optimization.*configured/i,
    ],
    title: 'next/image Not Configured',
    description: 'Remote images need hostname configuration',
    severity: 'error',
    category: 'config',
    solution: {
      explanation: 'next/image requires explicit configuration for remote image hostnames for security reasons.',
      steps: [
        'Open next.config.js (or next.config.mjs)',
        'Add the hostname to images.remotePatterns',
        'Restart the dev server',
      ],
      commands: [
        '# Check current config',
        'cat next.config.js',
      ],
      autoFix: {
        description: 'Add remotePatterns to next.config.js',
        file: 'next.config.js',
        originalContent: `/** @type {import('next').NextConfig} */
const nextConfig = {};
module.exports = nextConfig;`,
        fixedContent: `/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      },
      {
        protocol: 'https',
        hostname: '**.githubusercontent.com',
      },
    ],
  },
};
module.exports = nextConfig;`,
        patch: `@@ -1,3 +1,13 @@
 /** @type {import('next').NextConfig} */
-const nextConfig = {};
+const nextConfig = {
+  images: {
+    remotePatterns: [
+      {
+        protocol: 'https',
+        hostname: 'avatars.githubusercontent.com',
+      },
+    ],
+  },
+};
 module.exports = nextConfig;`,
      },
      preventInFuture: 'Always configure remotePatterns when using external images.',
      docsUrl: 'https://nextjs.org/docs/app/api-reference/components/image#remotepatterns',
    },
  },

  // ═══════════════════════════════════════
  // PACKAGE MANAGER ERRORS
  // ═══════════════════════════════════════
  {
    id: 'pnpm-workspace-invalid',
    patterns: [
      /packages field missing/i,
      /pnpm-workspace\.yaml.*invalid/i,
      /ERR_PNPM_BAD_WORKSPACE/i,
    ],
    title: 'pnpm Workspace Configuration Invalid',
    description: 'Workspace file missing or malformed',
    severity: 'error',
    category: 'dependency',
    solution: {
      explanation: 'Your pnpm-workspace.yaml file is missing, empty, or has invalid syntax.',
      steps: [
        'Check if pnpm-workspace.yaml exists',
        'Verify it has the packages field',
        'Ensure valid YAML syntax',
      ],
      commands: [
        '# Check current content',
        'cat pnpm-workspace.yaml',
        '',
        '# Validate YAML',
        'npx yaml-lint pnpm-workspace.yaml',
      ],
      autoFix: {
        description: 'Create valid pnpm-workspace.yaml',
        file: 'pnpm-workspace.yaml',
        fixedContent: `packages:
  - 'packages/*'
  - 'apps/*'`,
        patch: `@@ -0,0 +1,3 @@
+packages:
+  - 'packages/*'
+  - 'apps/*'`,
      },
      preventInFuture: 'If this is not a monorepo, delete pnpm-workspace.yaml entirely.',
      docsUrl: 'https://pnpm.io/workspaces',
    },
  },
  {
    id: 'node-version-mismatch',
    patterns: [
      /Multiple versions of.*specified/i,
      /ERR_PNPM_BAD_PM_VERSION/i,
      /version mismatch/i,
    ],
    title: 'Node/pnpm Version Mismatch',
    description: 'Conflicting versions across config files',
    severity: 'error',
    category: 'config',
    solution: {
      explanation: 'Different Node.js/pnpm versions are specified in package.json, .nvmrc, and GitHub Actions.',
      steps: [
        'Check all version declarations',
        'Pick one source of truth (package.json packageManager field)',
        'Remove conflicting declarations',
      ],
      commands: [
        '# Find all version references',
        'grep -r "node-version\\|packageManager\\|engines" .github/ package.json .nvmrc 2>/dev/null',
        '',
        '# Remove explicit version from GitHub Action',
        '# Keep only: pnpm/action-setup@v4 (without version input)',
      ],
      preventInFuture: 'Use only packageManager field in package.json and let actions read from it.',
      docsUrl: 'https://nodejs.org/en/download/package-manager',
    },
  },
  {
    id: 'npm-install-failed',
    patterns: [
      /npm ERR!/,
      /pnpm ERR!/,
      /yarn install.*failed/i,
      /ERESOLVE unable to resolve/i,
    ],
    title: 'Package Installation Failed',
    description: 'Dependencies could not be installed',
    severity: 'critical',
    category: 'dependency',
    solution: {
      explanation: 'npm/pnpm/yarn failed to install dependencies. Common causes: version conflicts, network issues, or corrupted lock file.',
      steps: [
        'Delete node_modules and lock file',
        'Clear npm/pnpm cache',
        'Reinstall dependencies',
        'If ERESOLVE error: use --legacy-peer-deps or --force',
      ],
      commands: [
        '# Nuclear option - clean reinstall',
        'rm -rf node_modules pnpm-lock.yaml package-lock.json',
        'npm cache clean --force',
        'pnpm install',
        '',
        '# If peer dependency conflicts',
        'pnpm install --no-frozen-lockfile',
        '',
        '# Force install (last resort)',
        'pnpm install --force',
      ],
      preventInFuture: 'Commit a working lock file. Use Renovate/Dependabot for safe updates.',
    },
  },

  // ═══════════════════════════════════════
  // GITHUB ACTIONS SPECIFIC
  // ═══════════════════════════════════════
  {
    id: 'actions-permission-denied',
    patterns: [
      /permission denied/i,
      /Resource not accessible/i,
      /403 Forbidden/,
      /GITHUB_TOKEN.*scope/i,
    ],
    title: 'GitHub Actions Permission Denied',
    description: 'Workflow lacks required permissions',
    severity: 'error',
    category: 'security',
    solution: {
      explanation: 'The GitHub Actions workflow is trying to perform an action it doesn\'t have permission for.',
      steps: [
        'Add explicit permissions to workflow file',
        'Grant write access where needed',
        'For PRs from forks: use pull_request_target carefully',
      ],
      commands: [
        '# Check current permissions',
        'cat .github/workflows/ci.yml | grep -A 5 "permissions"',
      ],
      autoFix: {
        description: 'Add permissions to workflow',
        file: '.github/workflows/ci.yml',
        patch: `@@ -1,5 +1,11 @@
 name: CI
 on: [push, pull_request]
+
+permissions:
+  contents: read
+  pull-requests: write
+  issues: write
+
 jobs:
   build:`,
      },
      preventInFuture: 'Always explicitly declare minimum required permissions.',
      docsUrl: 'https://docs.github.com/en/actions/using-jobs/assigning-permissions-to-jobs',
    },
  },
  {
    id: 'actions-secret-missing',
    patterns: [
      /secret.*not found/i,
      /undefined.*env/i,
      /process\.env\..*is undefined/i,
    ],
    title: 'Missing Environment Secret',
    description: 'Required secret not configured in repo settings',
    severity: 'error',
    category: 'security',
    solution: {
      explanation: 'A secret referenced in the workflow is not configured in repository settings.',
      steps: [
        'Go to repo Settings → Secrets and variables → Actions',
        'Add the missing secret',
        'Re-run the workflow',
      ],
      commands: [
        '# Find referenced secrets in workflow',
        'grep -o "\\${{ secrets\\.[A-Z_]* }}" .github/workflows/*.yml | sort -u',
      ],
      preventInFuture: 'Document required secrets in README.md or .env.example.',
      docsUrl: 'https://docs.github.com/en/actions/security-guides/using-secrets-in-github-actions',
    },
  },
  {
    id: 'node-deprecation',
    patterns: [/Node\.js 20 is deprecated/i, /DEP0040/i, /actions.*Node 20/i],
    title: 'Node.js Version Deprecation Warning',
    description: 'GitHub Actions migrating from Node 20 to 24',
    severity: 'info',
    category: 'config',
    solution: {
      explanation: 'GitHub is deprecating Node.js 20 in Actions runners. This is a warning, not an error.',
      steps: [
        'Update actions to latest versions',
        'Test with Node 22/24 locally',
        'Most workflows will continue working',
      ],
      commands: [
        '# Update to latest action versions',
        '# Change @v4 to latest in workflow',
        '',
        '# Suppress warning temporarily (not recommended)',
        'echo "ACTIONS_ALLOW_USE_UNSECURE_NODE_VERSION=true" >> $GITHUB_ENV',
      ],
      preventInFuture: 'Use Dependabot to keep actions up to date.',
      docsUrl: 'https://github.blog/changelog/2025-09-19-deprecation-of-node-20-on-github-actions-runners/',
    },
  },

  // ═══════════════════════════════════════
  // LINTING & CODE QUALITY
  // ═══════════════════════════════════════
  {
    id: 'eslint-errors',
    patterns: [/ESLint.*error/i, /\d+ problems.*\d+ errors/i, /eslint.*failed/i],
    title: 'ESLint Errors',
    description: 'Code quality violations blocking build',
    severity: 'warning',
    category: 'build',
    solution: {
      explanation: 'ESLint found code quality issues that are treated as errors in CI.',
      steps: [
        'Run ESLint locally to see all issues',
        'Fix violations or update rules',
        'Consider using --fix for auto-fixable issues',
      ],
      commands: [
        '# Run ESLint locally',
        'npx eslint . --ext .ts,.tsx',
        '',
        '# Auto-fix what\'s possible',
        'npx eslint . --ext .ts,.tsx --fix',
        '',
        '# See specific rules failing',
        'npx eslint . --ext .ts,.tsx --format json | jq',
      ],
      preventInFuture: 'Install ESLint extension in VS Code and fix issues as you type.',
      docsUrl: 'https://eslint.org/docs/latest/use/',
    },
  },

  // ═══════════════════════════════════════
  // NETWORK & INFRASTRUCTURE
  // ═══════════════════════════════════════
  {
    id: 'network-timeout',
    patterns: [
      /TLS handshake timeout/i,
      /ETIMEDOUT/i,
      /ECONNRESET/i,
      /fetch failed/i,
    ],
    title: 'Network Connectivity Issue',
    description: 'Cannot reach external services',
    severity: 'warning',
    category: 'network',
    solution: {
      explanation: 'Network issues preventing connection to external services. This is often transient.',
      steps: [
        'Re-run the workflow',
        'Check GitHub status page',
        'If persistent, check your network/proxy settings',
      ],
      commands: [
        '# Re-run the failed workflow',
        'gh run rerun <RUN_ID>',
        '',
        '# Check GitHub status',
        'curl -s https://www.githubstatus.com/api/v2/status.json | jq',
      ],
      preventInFuture: 'Add retry logic to your workflows. Use actions with built-in retries.',
      docsUrl: 'https://www.githubstatus.com/',
    },
  },
  {
    id: 'rate-limit-exceeded',
    patterns: [
      /rate limit exceeded/i,
      /API rate limit/i,
      /403.*rate/i,
      /secondary rate limit/i,
    ],
    title: 'GitHub API Rate Limit Exceeded',
    description: 'Too many requests to GitHub API',
    severity: 'warning',
    category: 'network',
    solution: {
      explanation: 'You\'ve hit GitHub API rate limits. Unauthenticated: 60/hour, authenticated: 5000/hour.',
      steps: [
        'Wait for rate limit to reset (usually 1 hour)',
        'Use authenticated requests with GITHUB_TOKEN',
        'Reduce number of API calls in workflow',
      ],
      commands: [
        '# Check current rate limit',
        'gh api rate_limit',
        '',
        '# When it resets',
        'gh run rerun <RUN_ID>',
      ],
      preventInFuture: 'Cache API responses. Use conditional requests (If-None-Match header).',
      docsUrl: 'https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api',
    },
  },

  // ═══════════════════════════════════════
  // DEPLOYMENT ERRORS
  // ═══════════════════════════════════════
  {
    id: 'vercel-build-failed',
    patterns: [
      /Vercel.*build failed/i,
      /vercel.*error/i,
      /deployment failed/i,
    ],
    title: 'Vercel Deployment Failed',
    description: 'Build succeeded but deployment failed',
    severity: 'error',
    category: 'runtime',
    solution: {
      explanation: 'The build completed but Vercel failed to deploy. Often due to build output issues or configuration.',
      steps: [
        'Check Vercel dashboard for detailed error',
        'Verify next.config.js is correct',
        'Check build output exists in .next folder',
      ],
      commands: [
        '# Check Vercel deployment status',
        'vercel inspect',
        '',
        '# View deployment logs',
        'vercel logs <deployment-url>',
      ],
      preventInFuture: 'Use preview deployments for PRs before merging to main.',
      docsUrl: 'https://vercel.com/docs/deployments/troubleshoot-a-build',
    },
  },

  // ═══════════════════════════════════════
  // GIT ERRORS
  // ═══════════════════════════════════════
  {
    id: 'git-merge-conflict',
    patterns: [
      /Merge conflict/i,
      /CONFLICT.*content/i,
      /Automatic merge failed/i,
    ],
    title: 'Git Merge Conflict',
    description: 'Cannot automatically merge changes',
    severity: 'error',
    category: 'runtime',
    solution: {
      explanation: 'Git cannot automatically merge changes because of conflicting modifications to the same lines.',
      steps: [
        'Pull latest changes locally',
        'Resolve conflicts in editor',
        'Commit the resolution',
        'Push to trigger new CI run',
      ],
      commands: [
        '# Pull and rebase',
        'git pull --rebase origin main',
        '',
        '# Open conflicts in VS Code',
        'code .',
        '',
        '# After resolving',
        'git add .',
        'git rebase --continue',
        'git push origin main',
      ],
      preventInFuture: 'Pull frequently. Use smaller, focused commits. Communicate with team.',
    },
  },
];

export function matchErrorPattern(message: string): ErrorPattern | null {
  const normalizedMessage = message.toLowerCase();
  
  for (const pattern of ERROR_PATTERNS) {
    for (const regex of pattern.patterns) {
      if (regex.test(normalizedMessage) || regex.test(message)) {
        return pattern;
      }
    }
  }
  
  return null;
}

export function getPatternsByCategory(category: ErrorPattern['category']): ErrorPattern[] {
  return ERROR_PATTERNS.filter(p => p.category === category);
}

export function getPatternsBySeverity(severity: ErrorPattern['severity']): ErrorPattern[] {
  return ERROR_PATTERNS.filter(p => p.severity === severity);
}