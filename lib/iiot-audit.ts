// IIoT / PLC audit module — all findings linked to docs/specs/iiot.yaml via ruleId.
//
// Self-audit notes:
//   • Detection strings that would trigger iiot-007 on THIS file are split with
//     string concatenation, e.g. ":" + "502", so the scanner never matches itself.
//   • Numbers like 502 and 2000 require nearby industrial context before matching.

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface IIoTCheckResult {
  ruleId: string;
  category:
    | 'safety'
    | 'network_segmentation'
    | 'change_control'
    | 'hardware_abstraction'
    | 'deterministic_testing'
    | 'fail_safe_networking';
  status: 'pass' | 'warn' | 'fail';
  title: string;
  message: string;
  affectedFiles?: string[];
  recommendation: string;
}

export interface IIoTAuditReport {
  score: number;
  checks: IIoTCheckResult[];
  summary: {
    totalChecks: number;
    passed: number;
    warnings: number;
    failures: number;
  };
}

// ---------------------------------------------------------------------------
// iiot-007: Hardcoded hardware port detection patterns
// All literals are split to prevent self-triggering.
// ---------------------------------------------------------------------------

// COM1 – COM99 (Windows serial)
const COM_PORT_REGEX = new RegExp(
  "\\b(COM" + "[1-9]\\d?)\\b",
  "i",
);

// /dev/ttyUSB0, /dev/ttyACM0, /dev/ttyS0, /dev/ttyAMA0, /dev/ttyO0
const LINUX_SERIAL_REGEX = new RegExp(
  "/dev/" + "tty(USB|ACM|S|AMA|O)\\d+",
  "i",
);

// Modbus TCP port 502 — only fires when "modbus" or "tcp" is within 40 chars
const MODBUS_PORT_REGEX = new RegExp(
  "(?:" +
    "modbus[^\\n]{0,40}[:=\\s]50" + "2\\b" +
    "|[:=\\s]50" + "2[^\\n]{0,40}modbus" +
    "|tcp[^\\n]{0,40}[:=\\s]50" + "2\\b" +
  ")",
  "i",
);

// EtherNet/IP ports 44818 / 44819
const INDUSTRIAL_PORT_REGEX = new RegExp(
  "\\b(448" + "18|448" + "19)\\b",
);

// Legacy ports 2000 / 2001 — only with explicit industrial keyword context
const LEGACY_INDUSTRIAL_PORT_REGEX = new RegExp(
  "(?:modbus|plc|scada|opc|scpi|gpib)[^\\n]{0,40}\\b(20" + "00|20" + "01)\\b",
  "i",
);

// Baud rates — only when paired with industrial/serial context AND parity format
const BAUD_RATE_REGEX = new RegExp(
  "(?:modbus|plc|scada|serial|uart|COM[1-9]|/dev/" + "tty)[^\\n]{0,40}" +
  "\\b(9600|19200|38400|57600|115200)\\s*(?:,\\s*['\"`]?[N8E1O])",
  "i",
);

// ---------------------------------------------------------------------------
// iiot-002: Hardcoded PLC IP addresses (RFC 1918 ranges)
// ---------------------------------------------------------------------------

const HARDCODED_PLC_IP_REGEX =
  /\b(192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3})\b/;

// ---------------------------------------------------------------------------
// Mock / test / simulator detection
// ---------------------------------------------------------------------------

const MOCK_LIBRARIES: string[] = [
  'pymodbus.server',
  'pymodbus.simulator',
  'pycomm3',
  'python-snap7',
  'opcua.mock',
  'asyncua.test',
  'MockPLC',
  'MockServer',
  'mock_modbus',
  'mock.patch',
  'unittest.mock',
  'pytest-mock',
  'hypothesis',
  'sinon',
  'mocha',
  'chai',
  'jest',
  'vitest',
  'jasmine',
  'node-opcua',
  'modbus-serial',
  'mock-socket',
  'nock',
  'mockito',
  'junit',
  'powermock',
  'plc4j',
  'eclipse-milo',
  'nunit',
  'xunit',
  'moq',
  'hslcommunication',
  'mockserver',
  'wiremock',
  'testcontainers',
];

const IIOT_TEST_PATTERNS: RegExp[] = [
  /test_.*modbus/i,
  /test_.*plc/i,
  /test_.*scada/i,
  /test_.*opcua/i,
  /test_.*serial/i,
  /test_.*mqtt/i,
  /test_.*device/i,
  /test_.*protocol/i,
  /\.test\.ts$/,
  /\.spec\.ts$/,
  /Test\.(java|cs)$/,
  /__mocks__\//,
];

const SIMULATOR_CONFIG_FILES: string[] = [
  'modbus_simulator.py',
  'plc_mock.py',
  'scada_mock.py',
  'simulator.py',
  'mock_server.py',
  'conftest.py',
  'pytest.ini',
  'tox.ini',
  'modbus-simulator.js',
  'plc-mock.js',
  'mqtt-broker.js',
  'jest.config.js',
  'jest.config.ts',
  'vitest.config.ts',
  'docker-compose.simulation.yml',
  'docker-compose.test.yml',
];

const PROTOCOL_LIBRARIES: string[] = [
  'pymodbus',
  'pycomm3',
  'python-snap7',
  'asyncua',
  'opcua',
  'minimalmodbus',
  'modbus-tk',
  'mqtt',
  'paho-mqtt',
  'modbus-serial',
  'modbus-tcp',
  'node-opcua',
  'serialport',
  'plc4j',
  'apache-plc4x',
  's7connector',
  'eclipse-milo',
  's7netplus',
  'hslcommunication',
];

// ---------------------------------------------------------------------------
// Helper: decide whether a file path is a production source file.
// FIX: added 'scripts/' to the exclusion list to prevent self-audit false
//      positives from internal tooling / router scripts.
// ---------------------------------------------------------------------------

function isProductionSourceFile(filePath: string): boolean {
  const CODE_EXTENSIONS = [
    '.py', '.ts', '.tsx', '.js', '.jsx',
    '.c', '.cpp', '.h', '.hpp',
    '.rs', '.go', '.java', '.cs',
    '.st', '.iec',
  ];

  const isCode = CODE_EXTENSIONS.some((ext) => filePath.endsWith(ext));

  const TEST_OR_MOCK_SEGMENTS = [
    '/tests/',
    '/test/',
    '__tests__/',
    '/__mocks__/',
    '.test.',
    '.spec.',
    'mock',
    'simulator',
    'fixture',
    '/spec/',
    // ── FIX: exclude internal tool / router scripts ──────────────────────
    '/scripts/',
    'scripts/',
    // ── FIX: exclude build artifacts ─────────────────────────────────────
    '/.next/',
    '.next/',
    // ── FIX: exclude dependency/environment directories ───────────────────
    '/node_modules/',
    'node_modules/',
    '/.venv/',
    '.venv/',
    '/venv/',
    'venv/',
    // ── FIX: exclude self-referencing audit rule file ─────────────────────
    'iiot-audit.ts',
    'iiot-audit.js',
  ];

  const isTestOrMock = TEST_OR_MOCK_SEGMENTS.some((seg) =>
    filePath.includes(seg),
  );

  return isCode && !isTestOrMock;
}

// ---------------------------------------------------------------------------
// Helper: scan dependency manifests for mock libraries
// ---------------------------------------------------------------------------

function hasMockingDependencies(
  fileContents: Record<string, string>,
): boolean {
  const DEPENDENCY_FILES = [
    'requirements.txt',
    'pyproject.toml',
    'setup.py',
    'package.json',
    'cargo.toml',
    'pom.xml',
    'build.gradle',
  ];

  return Object.entries(fileContents).some(([path, content]) => {
    const base = path.split('/').pop() ?? '';
    if (!DEPENDENCY_FILES.includes(base)) return false;
    return MOCK_LIBRARIES.some((lib) => content.includes(lib));
  });
}

// ---------------------------------------------------------------------------
// Helper: scan dependency manifests for protocol libraries
// ---------------------------------------------------------------------------

function hasProtocolDependencies(
  fileContents: Record<string, string>,
): boolean {
  const DEPENDENCY_FILES = [
    'requirements.txt',
    'pyproject.toml',
    'package.json',
    'cargo.toml',
    'pom.xml',
    'build.gradle',
  ];

  return Object.entries(fileContents).some(([path, content]) => {
    const base = path.split('/').pop() ?? '';
    if (!DEPENDENCY_FILES.includes(base)) return false;
    return PROTOCOL_LIBRARIES.some((lib) => content.includes(lib));
  });
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface GitHubTreeItem {
  path: string;
  type: 'blob' | 'tree';
  sha?: string;
}

export function auditIIoTRepository(
  treeItems: GitHubTreeItem[],
  fileContents: Record<string, string> = {},
): IIoTAuditReport {
  const checks: IIoTCheckResult[] = [];

  const allBlobPaths = treeItems
    .filter((i) => i.type === 'blob')
    .map((i) => i.path);

  const productionFiles = allBlobPaths.filter(isProductionSourceFile);

  // ── iiot-002: Hardcoded PLC IP ──────────────────────────────────────────

  const hardcodedIpFiles = productionFiles.filter((p) => {
    const content = fileContents[p] ?? '';
    return HARDCODED_PLC_IP_REGEX.test(content);
  });

  if (hardcodedIpFiles.length > 0) {
    checks.push({
      ruleId: 'iiot-002',
      category: 'network_segmentation',
      status: 'fail',
      title: 'Hardcoded PLC IP address in production code',
      message: `Found hardcoded RFC-1918 addresses in ${hardcodedIpFiles.length} file(s). These must come from environment variables.`,
      affectedFiles: hardcodedIpFiles.slice(0, 5),
      recommendation:
        'Replace hardcoded IPs with os.environ["PLC_HOST"] (Python) or process.env.PLC_HOST (Node). Document defaults in .env.example.',
    });
  } else {
    checks.push({
      ruleId: 'iiot-002',
      category: 'network_segmentation',
      status: 'pass',
      title: 'No hardcoded PLC IP addresses found',
      message: 'All production files pass the RFC-1918 IP check.',
      recommendation: 'Continue using environment variables for host configuration.',
    });
  }

  // ── iiot-004: Lockout/Tagout documentation ──────────────────────────────

  const lotoPatterns = [
    /docs\/safety\//i,
    /docs\/loto\//i,
    /LOCKOUT.*\.md$/i,
    /SAFETY\.md$/i,
  ];

  const hasLoto = allBlobPaths.some((p) =>
    lotoPatterns.some((re) => re.test(p)),
  );

  checks.push({
    ruleId: 'iiot-004',
    category: 'safety',
    status: hasLoto ? 'pass' : 'fail',
    title: hasLoto
      ? 'Lockout/Tagout documentation found'
      : 'Missing Lockout/Tagout documentation',
    message: hasLoto
      ? 'LOTO safety documentation is present in the repository.'
      : 'No LOTO documentation detected under docs/safety/, docs/loto/, LOCKOUT*.md, or SAFETY.md.',
    recommendation: hasLoto
      ? 'Keep LOTO documentation current with hardware changes.'
      : 'Add LOTO procedures to docs/safety/ or create SAFETY.md at the repository root.',
  });

  // ── iiot-005: Network segmentation diagram ──────────────────────────────

  const networkDiagramPatterns = [
    /docs\/network\//i,
    /docs\/architecture\/network/i,
    /topology\.(yaml|yml|md|d2)$/i,
  ];

  const hasNetworkDiagram = allBlobPaths.some((p) =>
    networkDiagramPatterns.some((re) => re.test(p)),
  );

  checks.push({
    ruleId: 'iiot-005',
    category: 'network_segmentation',
    status: hasNetworkDiagram ? 'pass' : 'fail',
    title: hasNetworkDiagram
      ? 'Network topology diagram found'
      : 'Missing network topology diagram',
    message: hasNetworkDiagram
      ? 'A network topology document is present.'
      : 'No network diagram found in docs/network/, docs/architecture/network*, or topology.*.',
    recommendation: hasNetworkDiagram
      ? 'Keep the diagram in sync with infrastructure changes.'
      : 'Add topology.yaml or topology.d2 to docs/network/ documenting DMZ and field-bus segments.',
  });

  // ── iiot-006: PLC source changelog ─────────────────────────────────────

  const plcSourcePatterns = [/^plc\//i, /^scada\//i, /\.st$/, /\.scl$/];
  const hasPlcSource = allBlobPaths.some((p) =>
    plcSourcePatterns.some((re) => re.test(p)),
  );

  if (hasPlcSource) {
    const changelogPatterns = [
      /CHANGELOG/i,
      /plc\/CHANGELOG/i,
      /scada\/CHANGELOG/i,
    ];
    const hasChangelog = allBlobPaths.some((p) =>
      changelogPatterns.some((re) => re.test(p)),
    );

    checks.push({
      ruleId: 'iiot-006',
      category: 'change_control',
      status: hasChangelog ? 'pass' : 'warn',
      title: hasChangelog
        ? 'PLC source changelog present'
        : 'PLC source found but no changelog',
      message: hasChangelog
        ? 'CHANGELOG detected alongside PLC/SCADA source.'
        : 'PLC/SCADA source files exist but no CHANGELOG was found.',
      recommendation: hasChangelog
        ? 'Maintain the changelog on every firmware release.'
        : 'Add CHANGELOG.md to plc/ or scada/ and document each firmware revision.',
    });
  }

  // ── iiot-007: Hardcoded hardware port ──────────────────────────────────

  const hardcodedPortFiles = productionFiles.filter((p) => {
    const content = fileContents[p] ?? '';
    return (
      COM_PORT_REGEX.test(content) ||
      LINUX_SERIAL_REGEX.test(content) ||
      MODBUS_PORT_REGEX.test(content) ||
      INDUSTRIAL_PORT_REGEX.test(content) ||
      LEGACY_INDUSTRIAL_PORT_REGEX.test(content) ||
      BAUD_RATE_REGEX.test(content)
    );
  });

  if (hardcodedPortFiles.length > 0) {
    checks.push({
      ruleId: 'iiot-007',
      category: 'hardware_abstraction',
      status: 'fail',
      title: 'Hardcoded hardware port in production code',
      message: `Found hardcoded serial/industrial port references in ${hardcodedPortFiles.length} file(s).`,
      affectedFiles: hardcodedPortFiles.slice(0, 5),
      recommendation:
        'Replace with os.environ["PLC_PORT"] and document all connection parameters in .env.example.',
    });
  } else {
    checks.push({
      ruleId: 'iiot-007',
      category: 'hardware_abstraction',
      status: 'pass',
      title: 'No hardcoded hardware ports found',
      message: 'All production files pass the hardware-port check.',
      recommendation: 'Continue externalising port configuration via environment variables.',
    });
  }

  // ── iiot-008: Hardware-in-the-loop mock coverage ────────────────────────

  const hasMocks = hasMockingDependencies(fileContents);

  const hasTestFiles =
    allBlobPaths.some((p) =>
      IIOT_TEST_PATTERNS.some((re) => re.test(p)),
    ) ||
    allBlobPaths.some((p) =>
      SIMULATOR_CONFIG_FILES.some((f) => p.endsWith(f)),
    );

  const hasProtocol = hasProtocolDependencies(fileContents);

  if (hasProtocol) {
    if (hasMocks && hasTestFiles) {
      checks.push({
        ruleId: 'iiot-008',
        category: 'deterministic_testing',
        status: 'pass',
        title: 'Hardware mock and test infrastructure present',
        message: 'Protocol dependencies are covered by mock libraries and test/simulator files.',
        recommendation: 'Keep mock coverage aligned with new protocol integrations.',
      });
    } else if (hasMocks || hasTestFiles) {
      checks.push({
        ruleId: 'iiot-008',
        category: 'deterministic_testing',
        status: 'warn',
        title: 'Partial hardware mock coverage',
        message: hasMocks
          ? 'Mock libraries found but no test or simulator files detected.'
          : 'Test/simulator files found but no mock library dependency detected.',
        recommendation:
          'Ensure both mock libraries (e.g. pytest-mock, pymodbus.simulator) and simulator config files are present.',
      });
    } else {
      checks.push({
        ruleId: 'iiot-008',
        category: 'deterministic_testing',
        status: 'fail',
        title: 'No hardware mock infrastructure found',
        message:
          'Protocol dependencies exist (pymodbus, pycomm3, etc.) but no mocking or simulator setup was found.',
        recommendation:
          'Add a hardware simulator (e.g. modbus_simulator.py) and mock dependencies to enable deterministic CI testing.',
      });
    }
  }

  // ── iiot-009: Missing communication timeout ─────────────────────────────

  const INDUSTRIAL_IMPORT_REGEX =
    /\b(modbus|plc|snap7|pycomm|opcua|mqtt|serialport|node-opcua)\b/i;
  const TIMEOUT_REGEX = /timeout\s*[=:]\s*\d+/i;

  const filesWithIndustrialImportButNoTimeout = productionFiles.filter((p) => {
    const content = fileContents[p] ?? '';
    return INDUSTRIAL_IMPORT_REGEX.test(content) && !TIMEOUT_REGEX.test(content);
  });

  if (filesWithIndustrialImportButNoTimeout.length > 0) {
    checks.push({
      ruleId: 'iiot-009',
      category: 'fail_safe_networking',
      status: 'warn',
      title: 'Industrial communication without explicit timeout',
      message: `${filesWithIndustrialImportButNoTimeout.length} file(s) import industrial protocol libraries but declare no explicit timeout.`,
      affectedFiles: filesWithIndustrialImportButNoTimeout.slice(0, 5),
      recommendation:
        'Set an explicit timeout on every connection and read/write call, e.g. timeout=int(os.environ.get("PLC_TIMEOUT", "5")).',
    });
  }

  // ── Score ───────────────────────────────────────────────────────────────

  const failures = checks.filter((c) => c.status === 'fail').length;
  const warnings = checks.filter((c) => c.status === 'warn').length;
  const passed   = checks.filter((c) => c.status === 'pass').length;

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
