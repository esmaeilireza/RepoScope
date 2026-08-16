// lib/environment-parity.ts

export interface EnvironmentInfo {
  node: string;
  pnpm: string;
  npm: string;
  os: string;
}

export interface ParityCheck {
  local: EnvironmentInfo;
  ci: EnvironmentInfo;
  matches: boolean;
  mismatches: string[];
}

export async function checkEnvironmentParity(
  owner: string,
  repo: string,
  token: string
): Promise<ParityCheck> {
  // Get CI environment from latest successful workflow
  const runsPath = `/repos/${owner}/${repo}/actions/runs?status=success&per_page=1`;
  const runsRes = await fetch(
    `/api/github?endpoint=${encodeURIComponent(runsPath)}`,
    { headers: { 'x-github-token': token } }
  );
  
  const ci: EnvironmentInfo = {
    node: 'unknown',
    pnpm: 'unknown',
    npm: 'unknown',
    os: 'ubuntu-latest',
  };
  
  if (runsRes.ok) {
    const runsData = await runsRes.json();
    if (runsData.workflow_runs?.length > 0) {
      const run = runsData.workflow_runs[0];
      // Parse environment from logs (simplified)
      ci.node = '20.x'; // Default, would parse from logs
      ci.os = run.runner_name || 'ubuntu-latest';
    }
  }
  
  // Local environment (would be passed from client)
  const local: EnvironmentInfo = {
    node: typeof process !== 'undefined' ? process.version : 'unknown',
    pnpm: 'unknown',
    npm: 'unknown',
    os: typeof process !== 'undefined' ? process.platform : 'unknown',
  };
  
  // Compare
  const mismatches: string[] = [];
  
  if (local.node !== 'unknown' && ci.node !== 'unknown') {
    const localMajor = parseInt(local.node.replace('v', '').split('.')[0]);
    const ciMajor = parseInt(ci.node.split('.')[0]);
    if (localMajor !== ciMajor) {
      mismatches.push(`Node.js: Local ${local.node} vs CI ${ci.node}`);
    }
  }
  
  return {
    local,
    ci,
    matches: mismatches.length === 0,
    mismatches,
  };
}