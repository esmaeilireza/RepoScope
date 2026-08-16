// lib/github-health-monitor.ts

export interface HealthIssue {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  category: 'dependencies' | 'security' | 'maintenance' | 'performance';
  title: string;
  description: string;
  solution: string;
  metrics?: Record<string, number | string>;
}

export interface HealthReport {
  score: number; // 0-100
  issues: HealthIssue[];
  checkedAt: string;
  repository: {
    name: string;
    owner: string;
    defaultBranch: string;
  };
}

export async function runHealthCheck(
  owner: string,
  repo: string,
  token: string
): Promise<HealthReport> {
  const issues: HealthIssue[] = [];
  
  // Check 1: Recent workflow failures
  const runsPath = `/repos/${owner}/${repo}/actions/runs?per_page=10&status=failure`;
  const runsRes = await fetch(
    `/api/github?endpoint=${encodeURIComponent(runsPath)}`,
    { headers: { 'x-github-token': token } }
  );
  
  if (runsRes.ok) {
    const runsData = await runsRes.json();
    const failedRuns = runsData.workflow_runs || [];
    
    if (failedRuns.length > 5) {
      issues.push({
        id: 'many-failed-runs',
        severity: 'critical',
        category: 'maintenance',
        title: `${failedRuns.length} Recent Workflow Failures`,
        description: 'Multiple recent CI failures indicate systemic issues.',
        solution: 'Review failed runs and fix root causes. Clean up old failed runs.',
        metrics: { failedRuns: failedRuns.length },
      });
    }
  }
  
  // Check 2: Stale branches
  const branchesPath = `/repos/${owner}/${repo}/branches?per_page=100`;
  const branchesRes = await fetch(
    `/api/github?endpoint=${encodeURIComponent(branchesPath)}`,
    { headers: { 'x-github-token': token } }
  );
  
  if (branchesRes.ok) {
    const branches = await branchesRes.json();
    const staleBranches = branches.filter((b: any) => {
      const lastCommit = new Date(b.commit.commit.author.date);
      const daysAgo = (Date.now() - lastCommit.getTime()) / (1000 * 60 * 60 * 24);
      return daysAgo > 90 && b.name !== 'main' && b.name !== 'master';
    });
    
    if (staleBranches.length > 3) {
      issues.push({
        id: 'stale-branches',
        severity: 'warning',
        category: 'maintenance',
        title: `${staleBranches.length} Stale Branches`,
        description: 'Branches with no activity for 90+ days.',
        solution: 'Delete stale branches to reduce clutter.',
        metrics: { staleBranches: staleBranches.length },
      });
    }
  }
  
  // Check 3: Open PRs pile-up
  const prsPath = `/repos/${owner}/${repo}/pulls?state=open&per_page=100`;
  const prsRes = await fetch(
    `/api/github?endpoint=${encodeURIComponent(prsPath)}`,
    { headers: { 'x-github-token': token } }
  );
  
  if (prsRes.ok) {
    const prs = await prsRes.json();
    
    if (prs.length > 10) {
      issues.push({
        id: 'prs-pile-up',
        severity: 'warning',
        category: 'maintenance',
        title: `${prs.length} Open Pull Requests`,
        description: 'Too many open PRs can block development.',
        solution: 'Review and merge/close stale PRs.',
        metrics: { openPRs: prs.length },
      });
    }
  }
  
  // Check 4: Outdated dependencies (via Dependabot alerts)
  const alertsPath = `/repos/${owner}/${repo}/dependabot/alerts?state=open`;
  const alertsRes = await fetch(
    `/api/github?endpoint=${encodeURIComponent(alertsPath)}`,
    { headers: { 'x-github-token': token } }
  );
  
  if (alertsRes.ok) {
    const alerts = await alertsRes.json();
    const criticalAlerts = alerts.filter((a: any) => 
      a.security_advisory?.severity === 'critical' || 
      a.security_advisory?.severity === 'high'
    );
    
    if (criticalAlerts.length > 0) {
      issues.push({
        id: 'security-vulnerabilities',
        severity: 'critical',
        category: 'security',
        title: `${criticalAlerts.length} Critical Security Vulnerabilities`,
        description: 'Dependencies with known critical vulnerabilities.',
        solution: 'Update affected dependencies immediately.',
        metrics: { vulnerabilities: criticalAlerts.length },
      });
    }
  }
  
  // Check 5: Missing community health files
  const communityPath = `/repos/${owner}/${repo}/community/profile`;
  const communityRes = await fetch(
    `/api/github?endpoint=${encodeURIComponent(communityPath)}`,
    { headers: { 'x-github-token': token } }
  );
  
  if (communityRes.ok) {
    const profile = await communityRes.json();
    const missing: string[] = [];
    
    if (!profile.files?.contributing) missing.push('CONTRIBUTING.md');
    if (!profile.files?.code_of_conduct) missing.push('CODE_OF_CONDUCT.md');
    if (!profile.files?.issue_template) missing.push('Issue Templates');
    if (!profile.files?.pull_request_template) missing.push('PR Template');
    
    if (missing.length > 0) {
      issues.push({
        id: 'missing-community-files',
        severity: 'info',
        category: 'maintenance',
        title: `Missing Community Files`,
        description: `Repository is missing: ${missing.join(', ')}`,
        solution: 'Add these files to improve project health.',
        metrics: { missing: missing.join(', ') },
      });
    }
  }
  
  // Calculate health score
  const score = calculateHealthScore(issues);
  
  return {
    score,
    issues,
    checkedAt: new Date().toISOString(),
    repository: {
      name: repo,
      owner,
      defaultBranch: 'main',
    },
  };
}

function calculateHealthScore(issues: HealthIssue[]): number {
  let score = 100;
  
  issues.forEach(issue => {
    switch (issue.severity) {
      case 'critical': score -= 20; break;
      case 'warning': score -= 10; break;
      case 'info': score -= 3; break;
    }
  });
  
  return Math.max(0, Math.min(100, score));
}