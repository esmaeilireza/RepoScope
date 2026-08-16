export interface TreeItem { path: string; sha: string; type: string }
export interface BranchDiff { branch: string; added: string[]; modified: string[]; deleted: string[]; totalChanges: number; error?: string }

const PEN: Record<string, number> = { error: 15, warning: 8, info: 3 };
const DAY = 86400000;

export function evaluateTarget(target: string, tree: TreeItem[]) {
  if (/^(https?:|mailto:|ftp:|tel:)/i.test(target)) return { status: 'external', detail: 'External URL' };
  if (target.startsWith('#')) return { status: 'anchor', detail: 'Anchor' };
  const clean = String(target || '').replace(/^\.\//, '').split('#')[0].split('?')[0];
  if (!clean) return { status: 'skip', detail: 'Empty' };
  if ((clean.startsWith('/') && !/\.[a-zA-Z0-9]+$/.test(clean)) || /[{:]/.test(clean))
    return { status: 'route', detail: 'API route' };
  const bare = clean.replace(/^\//, '');
  const ok = tree.some((i) => i.path === bare || i.path.endsWith('/' + bare));
  return ok ? { status: 'verified', detail: 'Exists' } : { status: 'broken', detail: 'Missing' };
}

export function diffBranches(defTree: TreeItem[], brTree: TreeItem[]) {
  const defMap = new Map<string, string>();
  defTree.forEach((i) => defMap.set(i.path, i.sha));
  const brMap = new Map<string, string>();
  brTree.forEach((i) => brMap.set(i.path, i.sha));
  const added: string[] = []; const modified: string[] = []; const deleted: string[] = [];
  brMap.forEach((sha, p) => { if (!defMap.has(p)) added.push(p); else if (defMap.get(p) !== sha) modified.push(p); });
  defMap.forEach((_s, p) => { if (!brMap.has(p)) deleted.push(p); });
  return { added, modified, deleted, totalChanges: added.length + modified.length + deleted.length };
}

const has = (tree: TreeItem[], re: RegExp) => tree.some((i) => re.test(String(i.path || '').split('/').pop() || ''));
const hasPath = (tree: TreeItem[], p: string) => tree.some((i) => i.path.startsWith(p));

export function generateFindings(meta: any, tree: TreeItem[], claims: any[], diffs: BranchDiff[], pulls: any[], def: string) {
  const out: any[] = [];
  const now = Date.now();

  if (!has(tree, /^readme/i)) out.push({ severity: 'error', category: 'documentation', title: 'README missing', description: 'No README on ' + def, cause: 'No documentation', fix: 'Add README.md' });
  if (!has(tree, /^licen[cs]e/i)) out.push({ severity: 'error', category: 'legal', title: 'No license file', description: 'Proprietary by default', cause: 'No LICENSE', fix: 'Add LICENSE' });
  if (!has(tree, /^contributing/i)) out.push({ severity: 'warning', category: 'community', title: 'No CONTRIBUTING guide', description: 'No contribution process', cause: 'Missing CONTRIBUTING.md', fix: 'Add CONTRIBUTING.md' });
  if (!has(tree, /^changelog/i)) out.push({ severity: 'warning', category: 'documentation', title: 'No CHANGELOG', description: 'No version history', cause: 'Missing CHANGELOG.md', fix: 'Add CHANGELOG.md' });
  if (!has(tree, /^security/i)) out.push({ severity: 'warning', category: 'security', title: 'No SECURITY policy', description: 'No vulnerability reporting', cause: 'Missing SECURITY.md', fix: 'Add SECURITY.md' });
  if (!hasPath(tree, '.github/dependabot')) out.push({ severity: 'warning', category: 'security', title: 'No Dependabot', description: 'Dependencies not auto-updated', cause: 'No dependabot.yml', fix: 'Enable Dependabot' });
  if (has(tree, /\.env$/i)) out.push({ severity: 'error', category: 'security', title: 'Environment file committed', description: 'Secrets may be exposed', cause: '.env in repo', fix: 'Remove and rotate secrets' });

  if (!hasPath(tree, '.github/workflows/')) out.push({ severity: 'error', category: 'ci', title: 'No CI workflow', description: 'No automated testing', cause: 'No workflows', fix: 'Add GitHub Actions' });
  if (!has(tree, /^\.gitignore$/i)) out.push({ severity: 'warning', category: 'hygiene', title: 'No .gitignore', description: 'Risk of committing artifacts', cause: 'Missing .gitignore', fix: 'Add .gitignore' });
  if (!has(tree, /^\.editorconfig$/i)) out.push({ severity: 'info', category: 'hygiene', title: 'No .editorconfig', description: 'Inconsistent code style possible', cause: 'Missing .editorconfig', fix: 'Add .editorconfig' });

  const issues = Math.max(0, (meta.open_issues_count || 0) - pulls.length);
  if (issues > 30) out.push({ severity: 'error', category: 'issues', title: issues + ' open issues', description: 'Critical backlog', cause: 'Issues growing fast', fix: 'Triage immediately' });
  else if (issues > 10) out.push({ severity: 'warning', category: 'issues', title: issues + ' open issues', description: 'Maintenance pressure', cause: 'Not enough triage', fix: 'Close stale issues' });
  else if (issues > 5) out.push({ severity: 'info', category: 'issues', title: issues + ' open issues', description: 'Some backlog', cause: 'Normal activity', fix: 'Regular triage' });

  const stalePRs = pulls.filter((p) => now - new Date(p.created_at).getTime() > 60 * DAY);
  if (pulls.length > 5) out.push({ severity: 'warning', category: 'pulls', title: pulls.length + ' open PRs', description: 'Review capacity exceeded', cause: 'Too many unmerged PRs', fix: 'Review or close' });
  if (stalePRs.length > 0) out.push({ severity: 'error', category: 'pulls', title: stalePRs.length + ' stale PRs (>60 days)', description: 'Unreviewed contributions', cause: 'PRs abandoned', fix: 'Review or close stale PRs' });

  if (meta.archived) out.push({ severity: 'error', category: 'maintenance', title: 'Repository archived', description: 'Read-only, unmaintained', cause: 'Owner archived it', fix: 'Unarchive or note in README' });
  const pushedAge = now - new Date(meta.pushed_at || meta.updated_at).getTime();
  if (!meta.archived && pushedAge > 180 * DAY) out.push({ severity: 'warning', category: 'maintenance', title: 'No commits for ' + Math.floor(pushedAge / (30 * DAY)) + ' months', description: 'Last push: ' + String(meta.pushed_at).slice(0, 10), cause: 'Possibly unmaintained', fix: 'Archive or resume' });
  if (!meta.description) out.push({ severity: 'warning', category: 'discovery', title: 'No repository description', description: 'Empty About box', cause: 'Missing description', fix: 'Add description in Settings' });

  const diverged = diffs.filter((d) => !d.error && d.totalChanges > 0);
  if (diverged.length > 3) out.push({ severity: 'error', category: 'branches', title: diverged.length + ' diverged branches', description: 'Many unmerged branches', cause: 'Branch hygiene poor', fix: 'Merge or delete stale branches' });
  else if (diverged.length > 0) out.push({ severity: 'warning', category: 'branches', title: diverged.length + ' diverged branch(es)', description: 'Some work not merged', cause: 'Branches not cleaned up', fix: 'Merge or delete' });

  const broken = claims.filter((c) => c.status === 'broken');
  if (broken.length > 5) out.push({ severity: 'error', category: 'readme', title: broken.length + ' broken README references', description: 'Documentation severely out of sync', cause: 'Many files moved/deleted', fix: 'Fix all broken links' });
  else if (broken.length > 0) out.push({ severity: 'error', category: 'readme', title: broken.length + ' broken README reference(s)', description: broken.slice(0, 3).map((b) => b.target).join(', '), cause: 'Files renamed/deleted', fix: 'Update or remove broken links' });

  const files = tree.filter((i) => i.type !== 'tree').length;
  if (files === 0) out.push({ severity: 'error', category: 'code', title: 'Empty repository', description: 'No files on ' + def, cause: 'No code committed', fix: 'Add code' });

  return out;
}

export function buildSections(meta: any, tree: TreeItem[], claims: any[], diffs: BranchDiff[], pulls: any[], def: string) {
  const files = tree.filter((i) => i.type !== 'tree').length;
  const issues = Math.max(0, (meta.open_issues_count || 0) - pulls.length);
  const stalePRs = pulls.filter((p) => Date.now() - new Date(p.created_at).getTime() > 60 * DAY).length;
  const wf = hasPath(tree, '.github/workflows/');
  const lic = has(tree, /^licen[cs]e/i);
  const sec = has(tree, /^security/i);
  const dep = hasPath(tree, '.github/dependabot');
  const broken = claims.filter((c) => c.status === 'broken').length;
  const div = diffs.filter((d) => !d.error && d.totalChanges > 0).length;
  const stale = Date.now() - new Date(meta.pushed_at || meta.updated_at).getTime() > 180 * DAY;
  return [
    { label: 'Code', icon: '📄', status: files > 5 ? 'pass' : files > 0 ? 'warn' : 'fail', detail: files + ' files on ' + def },
    { label: 'Issues', icon: '⚠️', status: issues > 30 ? 'fail' : issues > 10 ? 'warn' : 'pass', detail: issues + ' open' },
    { label: 'Pull requests', icon: '🔀', status: pulls.length > 5 || stalePRs > 0 ? 'warn' : 'pass', detail: pulls.length + ' open' + (stalePRs ? ', ' + stalePRs + ' stale' : '') },
    { label: 'Agents', icon: '🤖', status: 'info', detail: 'Not exposed by API' },
    { label: 'Actions', icon: '⚡', status: wf ? 'pass' : 'fail', detail: wf ? 'Workflows present' : 'No CI' },
    { label: 'Projects', icon: '📋', status: 'info', detail: meta.has_projects ? 'Enabled' : 'Disabled' },
    { label: 'Wiki', icon: '📖', status: 'info', detail: meta.has_wiki ? 'Enabled' : 'Disabled' },
    { label: 'Security and quality', icon: '🛡️', status: !lic ? 'fail' : !sec || !dep ? 'warn' : 'pass', detail: (lic ? 'License' : 'No license') + ' · ' + (sec ? 'SECURITY' : 'no SECURITY') + ' · ' + (dep ? 'Dependabot' : 'no Dependabot') },
    { label: 'Insights', icon: '📊', status: div > 3 ? 'fail' : div > 0 ? 'warn' : 'pass', detail: (diffs.length + 1) + ' branches' + (div ? ', ' + div + ' diverged' : '') },
    { label: 'Settings', icon: '⚙️', status: meta.archived ? 'fail' : stale ? 'warn' : 'pass', detail: (meta.private ? 'Private' : 'Public') + (meta.archived ? ' · archived' : stale ? ' · stale (6mo+)' : ' · default: ' + def) },
    { label: 'README audit', icon: '📝', status: broken > 5 ? 'fail' : broken > 0 ? 'warn' : 'pass', detail: broken ? broken + ' broken refs' : 'All refs OK' },
  ];
}

export function scoreAndExplain(findings: any[]) {
  const items = findings.map((f) => ({ title: f.title, severity: f.severity, category: f.category, penalty: PEN[f.severity] || 0, cause: f.cause || '', fix: f.fix || '' })).sort((a, b) => b.penalty - a.penalty);
  const total = items.reduce((s, i) => s + i.penalty, 0);
  const counts = { error: items.filter((i) => i.severity === 'error').length, warning: items.filter((i) => i.severity === 'warning').length, info: items.filter((i) => i.severity === 'info').length };
  return { score: Math.round(Math.max(0, Math.min(100, 100 - total))), total: parseFloat(total.toFixed(1)), counts, items };
}