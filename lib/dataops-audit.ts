export interface GitHubTreeItem {
  path: string;
  mode?: string;
  type: 'blob' | 'tree';
  sha?: string;
  size?: number;
  url?: string;
}

export interface DataOpsCheckResult {
  category: 'data_leak' | 'notebook_hygiene' | 'environment_parity' | 'dbt_sql';
  status: 'pass' | 'warn' | 'fail';
  title: string;
  message: string;
  affectedFiles?: string[];
  recommendation: string;
}

export interface DataOpsAuditReport {
  score: number; // 0 to 100
  checks: DataOpsCheckResult[];
  summary: {
    totalChecks: number;
    passed: number;
    warnings: number;
    failures: number;
  };
}

// Extensions for heavy data files that should not be committed directly to Git
const RAW_DATA_EXTENSIONS = ['.csv', '.parquet', '.feather', '.xlsx', '.xls', '.sqlite', '.db', '.h5', '.pkl', '.npy', '.npz'];
const MAX_RECOMMENDED_BLOB_SIZE = 5 * 1024 * 1024; // 5 MB

export function auditDataOpsRepository(
  treeItems: GitHubTreeItem[],
  gitignoreContent?: string,
  sampleNotebookContent?: Record<string, string> // key: path, value: json string
): DataOpsAuditReport {
  const checks: DataOpsCheckResult[] = [];

  // ----------------------------------------------------
  // 1. Check for Large/Raw Data Leakage
  // ----------------------------------------------------
  const unmanagedDataFiles = treeItems.filter((item) => {
    if (item.type !== 'blob') return false;
    const lowerPath = item.path.toLowerCase();
    const hasDataExt = RAW_DATA_EXTENSIONS.some((ext) => lowerPath.endsWith(ext));
    const isLarge = (item.size ?? 0) > MAX_RECOMMENDED_BLOB_SIZE;
    return hasDataExt || isLarge;
  });

  const hasDvcOrGitLfs = treeItems.some(
    (item) => item.path.endsWith('.dvc') || item.path === '.gitattributes' || item.path === 'dvc.yaml'
  );

  if (unmanagedDataFiles.length > 0) {
    if (!hasDvcOrGitLfs) {
      checks.push({
        category: 'data_leak',
        status: 'fail',
        title: 'Untracked Large / Raw Datasets Found',
        message: `Found ${unmanagedDataFiles.length} data file(s) tracked in Git without DVC or Git LFS.`,
        affectedFiles: unmanagedDataFiles.map((f) => f.path).slice(0, 10),
        recommendation: 'Track large datasets with DVC or Git-LFS and add raw data directories to .gitignore.',
      });
    } else {
      checks.push({
        category: 'data_leak',
        status: 'warn',
        title: 'Data Files Detected (Versioning Tools Present)',
        message: `Dataset files detected alongside DVC/LFS configurations. Verify .gitignore patterns.`,
        affectedFiles: unmanagedDataFiles.map((f) => f.path).slice(0, 5),
        recommendation: 'Ensure all binary and tabular datasets are purely managed by pointers and not raw Git blobs.',
      });
    }
  } else {
    checks.push({
      category: 'data_leak',
      status: 'pass',
      title: 'No Raw Data Blobs Detected',
      message: 'Repository tree is free from unmanaged raw tabular/binary datasets.',
      recommendation: 'Keep maintaining strict .gitignore policies for generated data artifacts.',
    });
  }

  // ----------------------------------------------------
  // 2. Check Python Environment Parity
  // ----------------------------------------------------
  const filePaths = treeItems.map((item) => item.path);
  const hasLooseRequirements = filePaths.includes('requirements.txt');
  const hasLockFile =
    filePaths.includes('requirements.lock') ||
    filePaths.includes('poetry.lock') ||
    filePaths.includes('Pipfile.lock') ||
    filePaths.includes('pdm.lock') ||
    filePaths.includes('conda-lock.yml');
  const hasCondaEnv = filePaths.includes('environment.yml') || filePaths.includes('environment.yaml');
  const hasPyproject = filePaths.includes('pyproject.toml');

  if (hasLockFile) {
    checks.push({
      category: 'environment_parity',
      status: 'pass',
      title: 'Deterministic Dependency Lockfile Present',
      message: 'Lockfile detected (Poetry / Pipfile / requirements.lock / Conda-lock).',
      recommendation: 'Ensure CI/CD enforces frozen lockfile installs (e.g. `poetry install --frozen` or `pip install --no-deps`).',
    });
  } else if (hasLooseRequirements || hasPyproject || hasCondaEnv) {
    checks.push({
      category: 'environment_parity',
      status: 'warn',
      title: 'Loose Python Dependency Specification',
      message: 'Found requirements.txt/pyproject.toml without an exact deterministic lockfile.',
      affectedFiles: filePaths.filter((p) => ['requirements.txt', 'pyproject.toml', 'environment.yml'].includes(p)),
      recommendation: 'Generate a lockfile (e.g. `pip-compile` or `poetry.lock`) to avoid breaking CI/CD during upstream package updates.',
    });
  } else {
    checks.push({
      category: 'environment_parity',
      status: 'warn',
      title: 'No Python Environment Config Detected',
      message: 'No requirements.txt, pyproject.toml, or environment.yml found in repository root.',
      recommendation: 'Add standardized environment specifications to enable reproducible data pipelines.',
    });
  }

  // ----------------------------------------------------
  // 3. Check Jupyter Notebook Cleanliness
  // ----------------------------------------------------
  const notebookFiles = treeItems.filter((i) => i.path.endsWith('.ipynb'));

  if (notebookFiles.length > 0) {
    let outOfOrderCount = 0;
    let heavyOutputCount = 0;

    if (sampleNotebookContent) {
      for (const [path, content] of Object.entries(sampleNotebookContent)) {
        try {
          const nbJson = JSON.parse(content);
          const cells = nbJson.cells || [];
          let lastExecutionCount = 0;

          for (const cell of cells) {
            if (cell.cell_type === 'code') {
              const execCount = cell.execution_count;
              if (execCount !== null && execCount !== undefined) {
                if (execCount < lastExecutionCount) {
                  outOfOrderCount++;
                }
                lastExecutionCount = execCount;
              }
              // Check size of stored outputs
              if (cell.outputs && JSON.stringify(cell.outputs).length > 200 * 1024) {
                heavyOutputCount++;
              }
            }
          }
        } catch {
          // Notebook parsing error
        }
      }
    }

    if (outOfOrderCount > 0 || heavyOutputCount > 0) {
      checks.push({
        category: 'notebook_hygiene',
        status: 'warn',
        title: 'Jupyter Notebook Hygiene Issues',
        message: `Detected ${outOfOrderCount} out-of-order executions and ${heavyOutputCount} bloated output cells in analyzed notebooks.`,
        affectedFiles: notebookFiles.map((n) => n.path),
        recommendation: 'Clear notebook outputs or use `nbstripout` / `pre-commit` hooks before committing notebooks.',
      });
    } else {
      checks.push({
        category: 'notebook_hygiene',
        status: 'pass',
        title: 'Jupyter Notebooks Clean',
        message: `${notebookFiles.length} notebook(s) tracked with structured/clean execution status.`,
        recommendation: 'Maintain automated checks with `nbconvert --execute` in CI pipelines.',
      });
    }
  }

  // ----------------------------------------------------
  // Score Calculation
  // ----------------------------------------------------
  const failures = checks.filter((c) => c.status === 'fail').length;
  const warnings = checks.filter((c) => c.status === 'warn').length;
  const passed = checks.filter((c) => c.status === 'pass').length;

  let calculatedScore = 100 - failures * 35 - warnings * 15;
  calculatedScore = Math.max(0, Math.min(100, calculatedScore));

  return {
    score: calculatedScore,
    checks,
    summary: {
      totalChecks: checks.length,
      passed,
      warnings,
      failures,
    },
  };
}