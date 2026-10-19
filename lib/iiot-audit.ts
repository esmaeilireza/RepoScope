// lib/iiot-audit.ts

/**
 * @module iiot-audit
 * @description
 * Evaluates repository adherence to Industrial IoT (IIoT) and PLC engineering best practices.
 *
 * Theoretical Foundation:
 * In industrial automation, software must exhibit deterministic behavior, fail-safe mechanisms,
 * and strict hardware abstraction. Unlike stateless web applications, IIoT systems interact
 * with physical processes where network latency, hardware unavailability, and state corruption
 * can lead to catastrophic physical or financial consequences.
 *
 * Every check carries a `ruleId` that MUST match a YAML spec id in
 * docs/specs/iiot.yaml. This is the join key used by the Week-4 Citation Gate.
 */

import type { GitHubTreeItem } from './types';

export interface IIoTCheckResult {
  /** Must match a YAML spec id in docs/specs/iiot.yaml (e.g. 'iiot-004'). */
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

// =====================================================================
// 1. HARDWARE ABSTRACTION PATTERNS (used by iiot-007)
// =====================================================================
const COM_PORT_REGEX = /\b(COM[1-9]\d?)\b/i;
const LINUX_SERIAL_REGEX = /\/dev\/tty(USB|ACM|S|AMA|O)\d+/i;
const MODBUS_PORT_REGEX = /[:\s](502|5020|50200)\b/;
const INDUSTRIAL_PORT_REGEX = /\b(44818|44819|2000|2001)\b/;
const BAUD_RATE_REGEX = /\b(9600|19200|38400|57600|115200)\s*(,\s*['"`]?[N8E1O])/i;

// =====================================================================
// 2. PLC IP DETECTION (used by iiot-002)
// Widened to match YAML pattern: 192.168.* | 10.0.* | 172.16-31.*
// =====================================================================
const HARDCODED_PLC_IP_REGEX =
  /\b(192\.168\.\d{1,3}\.\d{1,3}|10\.0\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2[0-9]|3[0-1])\.\d{1,3}\.\d{1,3})\b/;

// =====================================================================
// 3. DETERMINISTIC TESTING PATTERNS (used by iiot-008)
// =====================================================================
const MOCK_LIBRARIES = [
  'pymodbus.server', 'pymodbus.simulator', 'pycomm3', 'python-snap7',
  'opcua.mock', 'asyncua.test', 'MockPLC', 'MockServer', 'mock_modbus',
  'mock.patch', 'unittest.mock', 'pytest-mock', 'hypothesis',
  'sinon', 'mocha', 'chai', 'jest', 'vitest', 'jasmine',
  'node-opcua', 'modbus-serial', 'mock-socket', 'nock',
  'mockito', 'junit', 'powermock', 'plc4j', 'eclipse-milo',
  'nunit', 'xunit', 'moq', 'hslcommunication',
  'mockserver', 'wiremock', 'testcontainers',
];

const IIOT_TEST_PATTERNS = [
  /test_.*modbus/i, /test_.*plc/i, /test_.*scada/i, /test_.*opcua/i,
  /test_.*serial/i, /test_.*mqtt/i, /test_.*device/i, /test_.*protocol/i,
  /.*\.(test|spec)\.(ts|js|tsx|jsx)$/,
  /.*Test\.java$/, /.*Tests?\.cs$/,
  /__mocks__\//i,
];

const SIMULATOR_CONFIG_FILES = [
  'modbus_simulator.py', 'plc_mock.py', 'scada_mock.py', 'simulator.py',
  'mock_server.py', 'conftest.py', 'pytest.ini', 'tox.ini',
  'modbus-simulator.js', 'plc-mock.js', 'mqtt-broker.js',
  'jest.config.js', 'jest.config.ts', 'vitest.config.ts',
  'docker-compose.simulation.yml', 'docker-compose.test.yml',
];

const PROTOCOL_LIBRARIES = [
  'pymodbus', 'pycomm3', 'python-snap7', 'asyncua', 'opcua',
  'minimalmodbus', 'modbus-tk', 'mqtt', 'paho-mqtt',
  'modbus-serial', 'modbus-tcp', 'node-opcua', 'serialport',
  'plc4j', 'apache-plc4x', 's7connector', 'eclipse-milo',
  's7netplus', 'hslcommunication',
];

// =====================================================================
// HELPER FUNCTIONS
// =====================================================================

function isProductionSourceFile(path: string): boolean {
  const lowerPath = path.toLowerCase();
  const codeExtensions = [
    '.py', '.ts', '.tsx', '.js', '.jsx', '.c', '.cpp', '.h', '.hpp',
    '.rs', '.go', '.java', '.cs', '.st', '.iec',
  ];

  const isCode = codeExtensions.some((ext) => lowerPath.endsWith(ext));
  const isTestOrMock =
    lowerPath.includes('/tests/') ||
    lowerPath.includes('/test/') ||
    lowerPath.includes('__tests__/') ||
    lowerPath.includes('__mocks__/') ||
    lowerPath.includes('.test.') ||
    lowerPath.includes('.spec.') ||
    lowerPath.includes('mock') ||
    lowerPath.includes('simulator') ||
    lowerPath.includes('fixture') ||
    lowerPath.includes('/spec/');

  return isCode && !isTestOrMock;
}

function hasMockingDependencies(path: string, content: string | undefined): boolean {
  const lowerPath = path.toLowerCase();
  const isDependencyFile =
    lowerPath.endsWith('requirements.txt') ||
    lowerPath.endsWith('pyproject.toml') ||
    lowerPath.endsWith('setup.py') ||
    lowerPath.endsWith('package.json') ||
    lowerPath.endsWith('cargo.toml') ||
    lowerPath.endsWith('pom.xml') ||
    lowerPath.endsWith('build.gradle');

  if (!isDependencyFile || !content) return false;

  const lowerContent = content.toLowerCase();
  return MOCK_LIBRARIES.some((lib) => lowerContent.includes(lib.toLowerCase()));
}

function hasProtocolDependencies(path: string, content: string | undefined): boolean {
  const lowerPath = path.toLowerCase();
  const isDependencyFile =
    lowerPath.endsWith('requirements.txt') ||
    lowerPath.endsWith('pyproject.toml') ||
    lowerPath.endsWith('package.json') ||
    lowerPath.endsWith('cargo.toml') ||
    lowerPath.endsWith('pom.xml') ||
    lowerPath.endsWith('build.gradle');

  if (!isDependencyFile || !content) return false;

  const lowerContent = content.toLowerCase();
  return PROTOCOL_LIBRARIES.some((lib) => lowerContent.includes(lib.toLowerCase()));
}

// =====================================================================
// MAIN AUDIT ORCHESTRATOR
// =====================================================================

export function auditIIoTRepository(
  treeItems: GitHubTreeItem[],
  fileContents?: Record<string, string>
): IIoTAuditReport {
  const checks: IIoTCheckResult[] = [];

  const productionFiles = treeItems.filter(
    (item) => item.type === 'blob' && isProductionSourceFile(item.path)
  );
  const allBlobPaths = treeItems
    .filter((item) => item.type === 'blob')
    .map((item) => item.path);

  // ───────────────────────────────────────────────
  // iiot-002 — Hardcoded PLC IP address (YAML: severity error)
  // ───────────────────────────────────────────────
  const hardcodedIpFiles: string[] = [];
  for (const file of productionFiles) {
    const content = fileContents?.[file.path];
    if (!content) continue;
    if (HARDCODED_PLC_IP_REGEX.test(content)) {
      hardcodedIpFiles.push(file.path);
    }
  }

  if (hardcodedIpFiles.length > 0) {
    checks.push({
      ruleId: 'iiot-002',
      category: 'hardware_abstraction',
      status: 'fail',
      title: 'Hardcoded PLC IP address',
      message: `Hardcoded private IP found in ${hardcodedIpFiles.length} file(s) — use an environment variable instead.`,
      affectedFiles: hardcodedIpFiles.slice(0, 5),
      recommendation:
        'Put the address in .env: PLC_HOST=192.168.1.10. In code: os.getenv(\'PLC_HOST\', \'localhost\').',
    });
  } else {
    checks.push({
      ruleId: 'iiot-002',
      category: 'hardware_abstraction',
      status: 'pass',
      title: 'No hardcoded PLC IP address',
      message: 'No hardcoded private IPs detected in production code.',
      recommendation: 'Continue reading PLC_HOST from environment variables.',
    });
  }

  // ───────────────────────────────────────────────
  // iiot-004 — Inadequate Physical Lockout/Tagout (YAML: severity critical)
  // ───────────────────────────────────────────────
  const hasLotoDocs = allBlobPaths.some((path) => {
    if (path.startsWith('docs/safety/')) return true;
    if (path.startsWith('docs/loto/')) return true;
    if (/(^|\/)LOCKOUT[^/]*\.md$/i.test(path)) return true;
    if (/(^|\/)SAFETY\.md$/i.test(path)) return true;
    return false;
  });

  if (hasLotoDocs) {
    checks.push({
      ruleId: 'iiot-004',
      category: 'safety',
      status: 'pass',
      title: 'Site-level Lockout/Tagout reference present',
      message: 'Repository references a site-level LOTO / safety procedure.',
      recommendation: 'Keep the LOTO document synchronized with the physical interlock inventory.',
    });
  } else {
    checks.push({
      ruleId: 'iiot-004',
      category: 'safety',
      status: 'fail',
      title: 'Inadequate Physical Lockout/Tagout and Operational Safety Culture',
      message: 'No site-level Lockout/Tagout or safety documentation reference found.',
      recommendation:
        'Reference the site LOTO procedure from docs/safety/loto.md and link to the physical interlock inventory maintained outside source control.',
    });
  }

  // ───────────────────────────────────────────────
  // iiot-005 — OT network segmentation diagram (YAML: severity error)
  // ───────────────────────────────────────────────
  const hasNetworkDiagram = allBlobPaths.some((path) => {
    if (path.startsWith('docs/network/')) return true;
    if (/^docs\/architecture\/network[^/]*/i.test(path)) return true;
    if (/(^|\/)topology\.(yaml|yml|md|d2)$/i.test(path)) return true;
    return false;
  });

  if (hasNetworkDiagram) {
    checks.push({
      ruleId: 'iiot-005',
      category: 'network_segmentation',
      status: 'pass',
      title: 'OT network segmentation diagram present',
      message: 'Zone-and-conduit topology documented.',
      recommendation: 'Review the diagram when firewall rules change.',
    });
  } else {
    checks.push({
      ruleId: 'iiot-005',
      category: 'network_segmentation',
      status: 'fail',
      title: 'OT network segmentation diagram missing',
      message: 'No network topology / zone-conduit diagram found in docs/.',
      recommendation:
        'Commit a zone-and-conduit diagram under docs/network/topology.md (or .d2) showing enterprise, DMZ, supervisory, and control enclaves with the firewall rules between them.',
    });
  }

  // ───────────────────────────────────────────────
  // iiot-006 — Undocumented PLC program change (YAML: severity warning)
  // ───────────────────────────────────────────────
  const hasPlcSources = allBlobPaths.some((path) => {
    if (path.startsWith('plc/')) return true;
    if (path.startsWith('scada/')) return true;
    if (path.endsWith('.st')) return true;
    if (path.endsWith('.scl')) return true;
    return false;
  });

  if (hasPlcSources) {
    const hasPlcChangelog = allBlobPaths.some((path) => {
      if (/(^|\/)CHANGELOG(\.[a-z0-9]+)?$/i.test(path)) return true;
      if (/^plc\/CHANGELOG/i.test(path)) return true;
      if (/^scada\/CHANGELOG/i.test(path)) return true;
      return false;
    });

    if (hasPlcChangelog) {
      checks.push({
        ruleId: 'iiot-006',
        category: 'change_control',
        status: 'pass',
        title: 'PLC program change log present',
        message: 'PLC/SCADA sources are accompanied by a CHANGELOG.',
        recommendation: 'Continue recording change ticket IDs in commit messages.',
      });
    } else {
      checks.push({
        ruleId: 'iiot-006',
        category: 'change_control',
        status: 'warn',
        title: 'Undocumented PLC program change',
        message: 'PLC/SCADA sources present but no CHANGELOG recorded.',
        recommendation:
          'Track every PLC program change in a CHANGELOG at the plc/ or scada/ directory root, and reference the change ticket ID in the commit message.',
      });
    }
  }

  // ───────────────────────────────────────────────
  // iiot-007 — Hardcoded hardware port (bonus rule)
  // ───────────────────────────────────────────────
  const hardcodedPortFiles: string[] = [];
  for (const file of productionFiles) {
    const content = fileContents?.[file.path];
    if (!content) continue;
    if (
      COM_PORT_REGEX.test(content) ||
      LINUX_SERIAL_REGEX.test(content) ||
      MODBUS_PORT_REGEX.test(content) ||
      INDUSTRIAL_PORT_REGEX.test(content) ||
      BAUD_RATE_REGEX.test(content)
    ) {
      hardcodedPortFiles.push(file.path);
    }
  }

  if (hardcodedPortFiles.length > 0) {
    checks.push({
      ruleId: 'iiot-007',
      category: 'hardware_abstraction',
      status: 'fail',
      title: 'Hardcoded hardware port in production code',
      message: `Found hardcoded serial/COM ports or Modbus port references in ${hardcodedPortFiles.length} file(s).`,
      affectedFiles: hardcodedPortFiles.slice(0, 5),
      recommendation:
        'Abstract hardware configurations into environment variables (e.g., `os.environ["PLC_PORT"]`). Document required hardware parameters in a `.env.example` file.',
    });
  } else {
    checks.push({
      ruleId: 'iiot-007',
      category: 'hardware_abstraction',
      status: 'pass',
      title: 'No hardcoded hardware ports',
      message: 'No hardcoded physical ports or baud rates detected.',
      recommendation: 'Maintain this boundary. Ensure deployment scripts inject these at runtime.',
    });
  }

  // ───────────────────────────────────────────────
  // iiot-008 — No deterministic IIoT mock testing (bonus rule)
  // ───────────────────────────────────────────────
  const hasMockLibs = treeItems.some((item) =>
    hasMockingDependencies(item.path, fileContents?.[item.path])
  );
  const hasSimulatorConfig = allBlobPaths.some((path) =>
    SIMULATOR_CONFIG_FILES.some((sim) => path.toLowerCase().endsWith(sim.toLowerCase()))
  );
  const hasIiotTestFiles = allBlobPaths.some((path) =>
    IIOT_TEST_PATTERNS.some((regex) => regex.test(path))
  );

  if (hasMockLibs && (hasIiotTestFiles || hasSimulatorConfig)) {
    checks.push({
      ruleId: 'iiot-008',
      category: 'deterministic_testing',
      status: 'pass',
      title: 'Deterministic IIoT mock testing present',
      message:
        'Repository includes mocking libraries and dedicated IIoT test files or simulator config, ensuring CI can validate protocol logic without physical hardware.',
      recommendation:
        'Consider adding property-based tests (hypothesis in Python, fast-check in JS) to simulate malformed Modbus frames.',
    });
  } else if (hasMockLibs || hasIiotTestFiles || hasSimulatorConfig) {
    checks.push({
      ruleId: 'iiot-008',
      category: 'deterministic_testing',
      status: 'warn',
      title: 'Partial test infrastructure detected',
      message:
        'Some testing components exist, but comprehensive IIoT-specific mock coverage could not be fully confirmed.',
      recommendation:
        'Ensure all network-bound code paths have corresponding mock tests using sinon (JS), unittest.mock (Python), or mockito (Java).',
    });
  } else {
    const hasProtocolDeps = treeItems.some((item) =>
      hasProtocolDependencies(item.path, fileContents?.[item.path])
    );
    if (hasProtocolDeps) {
      checks.push({
        ruleId: 'iiot-008',
        category: 'deterministic_testing',
        status: 'fail',
        title: 'No deterministic IIoT mock testing detected',
        message:
          'Project uses IIoT protocol libraries but no mocking libraries, simulator configs, or test directories were found.',
        recommendation:
          'Add protocol-appropriate mocking libraries: sinon/mocha/chai (JS), pytest-mock/pymodbus (Python), or mockito/junit (Java).',
      });
    }
  }

  // ───────────────────────────────────────────────
  // iiot-009 — Missing fail-safe timeouts (bonus rule)
  // ───────────────────────────────────────────────
  const unsafeConnectionFiles: string[] = [];
  for (const file of productionFiles) {
    const content = fileContents?.[file.path];
    if (!content) continue;

    const hasProtocolImport =
      /import.*modbus|from.*modbus/i.test(content) ||
      /import.*plc|from.*snap7|from.*pycomm|from.*opcua/i.test(content) ||
      /require\s*\(['"](mqtt|serialport|node-opcua|modbus)/i.test(content) ||
      /import\s+.*\s+from\s+['"](mqtt|serialport|node-opcua|modbus)/i.test(content);

    if (!hasProtocolImport) continue;

    const hasTimeout = /timeout\s*[=:]\s*\d+/i.test(content);
    if (!hasTimeout) {
      unsafeConnectionFiles.push(file.path);
    }
  }

  if (unsafeConnectionFiles.length > 0) {
    checks.push({
      ruleId: 'iiot-009',
      category: 'fail_safe_networking',
      status: 'warn',
      title: 'Industrial connections missing fail-safe timeouts',
      message: `Found ${unsafeConnectionFiles.length} file(s) with protocol imports but no explicit timeout settings.`,
      affectedFiles: unsafeConnectionFiles.slice(0, 5),
      recommendation:
        'Always set explicit timeouts on clients (e.g., `ModbusTcpClient(host, timeout=3)` or `mqtt.connect(url, {connectTimeout: 5000})`). Implement exponential backoff for critical reconnections.',
    });
  }

  // ───────────────────────────────────────────────
  // SCORING
  // ───────────────────────────────────────────────
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