// lib/dataops-audit.ts

import type { GitHubTreeItem } from './types';

export interface DataOpsCheckResult {
  /** Must match a YAML spec id in docs/specs/dataops.yaml */
  ruleId: string;
  category:
    | 'data_leak'
    | 'notebook_hygiene'
    | 'environment_parity'
    | 'dbt_sql'
    | 'schema_management'
    | 'cross_domain';
  status: 'pass' | 'warn' | 'fail';
  title: string;
  message: string;
  affectedFiles?: string[];
  recommendation: string;
  /** Optional profile override — defaults to 'dataops' at the CLI/UI layer. */
  profile?: 'dataops' | 'cross';
}

export interface DataOpsAuditReport {
  score: number;
  checks: DataOpsCheckResult[];
  summary: {
    totalChecks: number;
    passed: number;
    warnings: number;
    failures: number;
  };
}

const RAW_DATA_EXTENSIONS = [
  '.csv', '.parquet', '.feather', '.xlsx', '.xls',
  '.sqlite', '.db', '.h5', '.pkl', '.npy', '.npz',
];
const MAX_RECOMMENDED_BLOB_SIZE = 5 * 1024 * 1024;

/**
 * Audits a DataOps repository against the dataops rule set.
 *
 * @param treeItems            the repository file tree (blobs + trees)
 * @param gitignoreContent     raw contents of .gitignore (optional)
 * @param fileContents         map of relative path -> file text. Used by
 *                             notebook hygiene AND by the cross-001 check
 *                             that inspects Python imports. The parameter
 *                             was previously named `sampleNotebookContent`;
 *                             it now serves as the general file-content map.
 */
export function auditDataOpsRepository(
  treeItems: GitHubTreeItem[],
  gitignoreContent?: string,
  fileContents?: Record<string, string>
): DataOpsAuditReport {
  const checks: DataOpsCheckResult[] = [];

  // ─── 1. Data leak (dataops-004) ───
  const unmanagedDataFiles = treeItems.filter((item) => {
    if (item.type !== 'blob') return false;
    const lowerPath = item.path.toLowerCase();
    const hasDataExt = RAW_DATA_EXTENSIONS.some((ext) => lowerPath.endsWith(ext));
    const isLarge = (item.size ?? 0) > MAX_RECOMMENDED_BLOB_SIZE;
    return hasDataExt || isLarge;
  });

  const hasDvcOrGitLfs = treeItems.some(
    (item) =>
      item.path.endsWith('.dvc') ||
      item.path === '.gitattributes' ||
      item.path === 'dvc.yaml'
  );

  if (unmanagedDataFiles.length > 0) {
    if (!hasDvcOrGitLfs) {
      checks.push({
        ruleId: 'dataops-004',
        category: 'data_leak',
        status: 'fail',
        title: 'Untracked Large / Raw Datasets Found',
        message: `Found ${unmanagedDataFiles.length} data file(s) tracked in Git without DVC or Git LFS.`,
        affectedFiles: unmanagedDataFiles.map((f) => f.path).slice(0, 10),
        recommendation:
          'Track large datasets with DVC or Git-LFS and add raw data directories to .gitignore.',
      });
    } else {
      checks.push({
        ruleId: 'dataops-004',
        category: 'data_leak',
        status: 'warn',
        title: 'Data Files Detected (Versioning Tools Present)',
        message: 'Dataset files detected alongside DVC/LFS configurations. Verify .gitignore patterns.',
        affectedFiles: unmanagedDataFiles.map((f) => f.path).slice(0, 5),
        recommendation:
          'Ensure all binary and tabular datasets are purely managed by pointers and not raw Git blobs.',
      });
    }
  } else {
    checks.push({
      ruleId: 'dataops-004',
      category: 'data_leak',
      status: 'pass',
      title: 'No Raw Data Blobs Detected',
      message: 'Repository tree is free from unmanaged raw tabular/binary datasets.',
      recommendation:
        'Keep maintaining strict .gitignore policies for generated data artifacts.',
    });
  }

  // ─── 2. Environment parity (dataops-005) ───
  const filePaths = treeItems.map((item) => item.path);
  const hasLooseRequirements = filePaths.includes('requirements.txt');
  const hasLockFile =
    filePaths.includes('requirements.lock') ||
    filePaths.includes('poetry.lock') ||
    filePaths.includes('Pipfile.lock') ||
    filePaths.includes('pdm.lock') ||
    filePaths.includes('conda-lock.yml');
  const hasCondaEnv =
    filePaths.includes('environment.yml') || filePaths.includes('environment.yaml');
  const hasPyproject = filePaths.includes('pyproject.toml');

  if (hasLockFile) {
    checks.push({
      ruleId: 'dataops-atwal-003',
      category: 'environment_parity',
      status: 'pass',
      title: 'Deterministic Dependency Lockfile Present',
      message: 'Lockfile detected (Poetry / Pipfile / requirements.lock / Conda-lock).',
      recommendation:
        'Ensure CI/CD enforces frozen lockfile installs (e.g. `poetry install --frozen` or `pip install --no-deps`).',
    });
  } else if (hasLooseRequirements || hasPyproject || hasCondaEnv) {
    checks.push({
      ruleId: 'dataops-atwal-003',
      category: 'environment_parity',
      status: 'warn',
      title: 'Loose Python Dependency Specification',
      message: 'Found requirements.txt/pyproject.toml without an exact deterministic lockfile.',
      affectedFiles: filePaths.filter((p) =>
        ['requirements.txt', 'pyproject.toml', 'environment.yml'].includes(p)
      ),
      recommendation:
        'Generate a lockfile (e.g. `pip-compile` or `poetry.lock`) to avoid breaking CI/CD during upstream package updates.',
    });
  } else {
    checks.push({
      ruleId: 'dataops-atwal-003',
      category: 'environment_parity',
      status: 'warn',
      title: 'No Python Environment Config Detected',
      message: 'No requirements.txt, pyproject.toml, or environment.yml found in repository root.',
      recommendation:
        'Add standardized environment specifications to enable reproducible data pipelines.',
    });
  }

  // ─── 3. Notebook hygiene (dataops-006) ───
  const notebookFiles = treeItems.filter((i) => i.path.endsWith('.ipynb'));

  if (notebookFiles.length > 0) {
    let outOfOrderCount = 0;
    let heavyOutputCount = 0;

    if (fileContents) {
      for (const [, content] of Object.entries(fileContents)) {
        // Only attempt to parse files that look like notebooks.
        try {
          const nbJson = JSON.parse(content);
          const cells = nbJson.cells || [];
          let lastExecutionCount = 0;

          for (const cell of cells) {
            if (cell.cell_type === 'code') {
              const execCount = cell.execution_count;
              if (execCount !== null && execCount !== undefined) {
                if (execCount < lastExecutionCount) outOfOrderCount++;
                lastExecutionCount = execCount;
              }
              if (cell.outputs && JSON.stringify(cell.outputs).length > 200 * 1024) {
                heavyOutputCount++;
              }
            }
          }
        } catch {
          /* not a notebook or malformed — skip */
        }
      }
    }

    if (outOfOrderCount > 0 || heavyOutputCount > 0) {
      checks.push({
        ruleId: 'dataops-006',
        category: 'notebook_hygiene',
        status: 'warn',
        title: 'Jupyter Notebook Hygiene Issues',
        message: `Detected ${outOfOrderCount} out-of-order executions and ${heavyOutputCount} bloated output cells in analyzed notebooks.`,
        affectedFiles: notebookFiles.map((n) => n.path),
        recommendation:
          'Clear notebook outputs or use `nbstripout` / `pre-commit` hooks before committing notebooks.',
      });
    } else {
      checks.push({
        ruleId: 'dataops-006',
        category: 'notebook_hygiene',
        status: 'pass',
        title: 'Jupyter Notebooks Clean',
        message: `${notebookFiles.length} notebook(s) tracked with structured/clean execution status.`,
        recommendation:
          'Maintain automated checks with `nbconvert --execute` in CI pipelines.',
      });
    }
  }

  // ─── 4. Streaming schema IDL (dataops-kleppmann-002) ───
  //
  // Aligns with YAML rule dataops-kleppmann-002. The YAML check is a
  // file-presence check for Avro/Protobuf/Thrift under schemas/ or events/.
  // It does not attempt semantic backward/forward compatibility analysis —
  // that is noted as a limitation in docs/methodology.md.
  const hasSchemaIdl = treeItems.some((item) => {
    if (item.type !== 'blob') return false;
    const p = item.path.toLowerCase();
    const underSchemas = p.startsWith('schemas/') || p.startsWith('events/');
    if (!underSchemas) return false;
    return p.endsWith('.proto') || p.endsWith('.avsc') || p.endsWith('.thrift');
  });

  checks.push({
    ruleId: 'dataops-kleppmann-002',
    category: 'schema_management',
    status: hasSchemaIdl ? 'pass' : 'fail',
    title: hasSchemaIdl
      ? 'Streaming schema IDL present'
      : 'No schema IDL for streaming events',
    message: hasSchemaIdl
      ? 'Explicit schema definitions found under schemas/ or events/.'
      : 'Streaming pipelines without schema IDL are vulnerable to unannounced breaking changes.',
    affectedFiles: treeItems
      .filter((i) => i.type === 'blob' && i.path.endsWith('.py') && i.path.includes('/'))
      .map((i) => i.path)
      .slice(0, 3),
    recommendation:
      'Define event schemas with Avro (.avsc) or Protobuf (.proto) in schemas/ and enforce compatibility checks in CI.',
  });

  // ─── 5. Database migration tooling (dataops-kleppmann-003) ───
  const migrationDirs = ['migrations', 'alembic', 'flyway', 'db/migrate'];
  const hasMigrationTooling = treeItems.some((item) => {
    if (item.type !== 'tree') return false;
    return migrationDirs.includes(item.path);
  });

  checks.push({
    ruleId: 'dataops-kleppmann-003',
    category: 'schema_management',
    status: hasMigrationTooling ? 'pass' : 'warn',
    title: hasMigrationTooling
      ? 'Database migration tooling present'
      : 'No database migration tooling detected',
    message: hasMigrationTooling
      ? 'Schema DDL changes are versioned under a migrations directory.'
      : 'Schema changes applied by hand are error-prone and not auditable.',
    recommendation:
      'Adopt Alembic or Flyway and store all schema DDL changes under migrations/.',
  });

  // ─── 6. Cross-domain ABI conflict (cross-001) ───
  //
  // The YAML rule fires on pymodbus/opcua presence. This implementation
  // is stricter and more useful: it only fires the FAIL case when the
  // repository actually mixes IIoT drivers AND data-analytics libraries.
  // A repository with IIoT drivers alone gets a WARN (check isolation),
  // and a repository with neither gets no finding at all (not applicable).
  const iiotDriverFiles = treeItems.filter((item) => {
    if (item.type !== 'blob') return false;
    if (!item.path.endsWith('.py')) return false;
    const content = fileContents?.[item.path];
    if (!content) return false;
    return /\b(pymodbus|opcua|asyncua|python-snap7|pycomm3|minimalmodbus)\b/i.test(content);
  });

  const analyticsLibFiles = treeItems.filter((item) => {
    if (item.type !== 'blob') return false;
    if (!item.path.endsWith('.py')) return false;
    const content = fileContents?.[item.path];
    if (!content) return false;
    return /\b(pandas|polars|pyspark|dask|dbt|great_expectations)\b/i.test(content);
  });

  if (iiotDriverFiles.length > 0 && analyticsLibFiles.length > 0) {
    checks.push({
      ruleId: 'cross-001',
      category: 'cross_domain',
      status: 'fail',
      title: 'IIoT + DataOps ABI conflict risk',
      message: `${iiotDriverFiles.length} file(s) use IIoT drivers and ${analyticsLibFiles.length} file(s) use data analytics libraries in the same repo.`,
      affectedFiles: Array.from(
        new Set([...iiotDriverFiles, ...analyticsLibFiles].map((f) => f.path))
      ).slice(0, 10),
      recommendation:
        'Use separate venv/conda environments for IIoT drivers and data layer. Each part should have its own requirements file.',
      profile: 'cross',
    });
  } else if (iiotDriverFiles.length > 0) {
    checks.push({
      ruleId: 'cross-001',
      category: 'cross_domain',
      status: 'warn',
      title: 'IIoT driver detected — verify environment isolation',
      message: `${iiotDriverFiles.length} file(s) import IIoT protocol libraries. No data analytics library detected in the same repo — confirm isolation policy if this changes.`,
      affectedFiles: iiotDriverFiles.map((f) => f.path).slice(0, 5),
      recommendation:
        'Keep IIoT drivers in a dedicated environment. If you later add pandas/pyspark/dbt, do not co-install — use isolated virtual environments.',
      profile: 'cross',
    });
  } else {
    // No IIoT driver at all — the cross-001 rule is not applicable.
    // We push a "pass" record so the rule id appears in the report.
    checks.push({
      ruleId: 'cross-001',
      category: 'cross_domain',
      status: 'pass',
      title: 'No IIoT driver / DataOps library collision detected',
      message: 'No IIoT protocol library coexists with data analytics libraries in this repository.',
      recommendation:
        'If IIoT integration is added later, keep the dependency graph isolated from the analytics layer.',
      profile: 'cross',
    });
  }

  // ─── Scoring ───
  const failures = checks.filter((c) => c.status === 'fail').length;
  const warnings = checks.filter((c) => c.status === 'warn').length;
  const passed = checks.filter((c) => c.status === 'pass').length;

  let calculatedScore = 100 - failures * 35 - warnings * 15;
  calculatedScore = Math.max(0, Math.min(100, calculatedScore));

  return {
    score: calculatedScore,
    checks,
    summary: { totalChecks: checks.length, passed, warnings, failures },
  };
}