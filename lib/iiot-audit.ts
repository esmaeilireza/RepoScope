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
 * This module translates these physical-world constraints into automated static analysis checks
 * suitable for modern CI/CD pipelines.
 *
 * [FIX #3] Multi-Language Support:
 * Previously only detected Python IIoT ecosystems. Now supports JavaScript/TypeScript,
 * Python, Java, and C# ecosystems commonly used in industrial automation.
 */

export interface GitHubTreeItem {
  path: string;
  mode?: string;
  type: 'blob' | 'tree';
  sha?: string;
  size?: number;
  url?: string;
}

export interface IIoTCheckResult {
  category: 'hardware_abstraction' | 'deterministic_testing' | 'fail_safe_networking';
  status: 'pass' | 'warn' | 'fail';
  title: string;
  message: string;
  affectedFiles?: string[];
  recommendation: string;
}

export interface IIoTAuditReport {
  score: number; // 0 to 100
  checks: IIoTCheckResult[];
  summary: {
    totalChecks: number;
    passed: number;
    warnings: number;
    failures: number;
  };
}

// =====================================================================
// 1. HARDWARE ABSTRACTION PATTERNS
// Theory: The 12-Factor App methodology dictates that environment-specific
// configurations (like hardware ports and IPs) must be strictly separated
// from code to ensure portability across edge, on-premise, and cloud deployments.
// =====================================================================

/** Windows COM ports (COM1..COM99) */
const COM_PORT_REGEX = /\b(COM[1-9]\d?)\b/i;

/** Linux serial devices (e.g., /dev/ttyUSB0, /dev/ttyACM0) */
const LINUX_SERIAL_REGEX = /\/dev\/tty(USB|ACM|S|AMA|O)\d+/i;

/** Modbus TCP default ports (502 is the standard IANA-assigned port) */
const MODBUS_PORT_REGEX = /[:\s](502|5020|50200)\b/;

/** Common industrial Ethernet ports (EtherNet/IP: 44818, PROFINET hints) */
const INDUSTRIAL_PORT_REGEX = /\b(44818|44819|2000|2001)\b/;

/** Hardcoded private IPs commonly used for PLCs in code (not configs) */
const HARDCODED_PLC_IP_REGEX = /['"`]192\.168\.\d{1,3}\.\d{1,3}['"`]/;

/** Baud rate hardcoding (common industrial values) */
const BAUD_RATE_REGEX = /\b(9600|19200|38400|57600|115200)\s*(,\s*['"`]?[N8E1O])/i;

// =====================================================================
// 2. DETERMINISTIC TESTING & MOCKING PATTERNS (MULTI-LANGUAGE)
// Theory: Physical hardware cannot be reliably provisioned in ephemeral CI/CD
// runners. Relying on physical PLCs for unit tests introduces non-determinism
// and pipeline flakiness. Mocking is mandatory for IIoT CI/CD.
// =====================================================================

/**
 * [FIX #3] Expanded to support multiple language ecosystems.
 * Different languages use different mocking/testing libraries for IIoT work.
 */
const MOCK_LIBRARIES = [
  // Python ecosystem
  'pymodbus.server', 'pymodbus.simulator', 'pycomm3', 'python-snap7',
  'opcua.mock', 'asyncua.test', 'MockPLC', 'MockServer', 'mock_modbus',
  'faker', 'mock.patch', 'unittest.mock', 'pytest-mock', 'hypothesis',
  'modbus-tk', 'minimalmodbus',
  
  // JavaScript/TypeScript ecosystem
  'sinon', 'mocha', 'chai', 'jest', 'vitest', 'jasmine',
  'mqtt', 'mqtt.js', 'modbus-serial', 'modbus-tcp', 'node-opcua',
  'serialport', 'node-serialport', 'socket.io-client',
  'mock-socket', 'nock', 'proxyquire', 'rewire',
  'ioredis-mock', 'redis-mock',
  
  // Java ecosystem
  'mockito', 'junit', 'powermock', 's7connector',
  'apache-plc4x', 'plc4j', 'eclipse-milo',
  
  // C# / .NET ecosystem
  'nunit', 'xunit', 'moq', 'hslcommunication',
  's7netplus', 'opcfoundation',
  
  // General industrial
  'mockserver', 'wiremock', 'testcontainers',
];

/**
 * [FIX #3] Expanded test file patterns for multi-language IIoT projects.
 */
const IIOT_TEST_PATTERNS = [
  // Python test patterns
  /test_.*modbus/i, /test_.*plc/i, /test_.*scada/i, /test_.*opcua/i,
  /test_.*serial/i, /test_.*mqtt/i, /test_.*device/i, /test_.*protocol/i,
  
  // JS/TS test patterns
  /.*\.(test|spec)\.(ts|js|tsx|jsx)$/,
  /test.*device/i, /test.*protocol/i, /test.*connection/i,
  
  // Java test patterns
  /.*Test\.java$/, /.*IT\.java$/,
  
  // C# test patterns
  /.*Tests?\.cs$/,
  
  // General test/mock directories
  /tests\/.*mock/i, /test\/.*mock/i,
  /__tests__\/.*device/i, /__tests__\/.*protocol/i,
  /__mocks__\//i,
];

/**
 * [FIX #3] Added device-specific test directory patterns.
 * Many IIoT projects organize tests by device/protocol type.
 */
const IIOT_TEST_DIRECTORIES = [
  /\/test\/devices?\//i,
  /\/tests\/devices?\//i,
  /\/test\/protocols?\//i,
  /\/tests\/protocols?\//i,
  /\/test\/modbus/i,
  /\/test\/mqtt/i,
  /\/test\/opc/i,
  /\/test\/plc/i,
  /\/test\/scada/i,
  /\/test\/serial/i,
  /\/test\/hardware/i,
  /\/__tests__\/devices?\//i,
  /\/__tests__\/protocols?\//i,
];

/**
 * Simulator configuration files across ecosystems.
 */
const SIMULATOR_CONFIG_FILES = [
  // Python simulators
  'modbus_simulator.py', 'plc_mock.py', 'scada_mock.py', 'simulator.py',
  'mock_server.py', 'conftest.py', 'pytest.ini', 'tox.ini',
  
  // JS/TS simulators
  'modbus-simulator.js', 'plc-mock.js', 'mqtt-broker.js',
  'jest.config.js', 'jest.config.ts', 'vitest.config.ts',
  '.mocharc.js', '.mocharc.json', 'mocha.opts',
  
  // Docker-based simulators
  'docker-compose.simulation.yml', 'docker-compose.test.yml',
  'docker-compose.yml',
  
  // Java/C# simulators
  'application-test.yml', 'application-test.properties',
];

/**
 * [FIX #3] Protocol library detection across ecosystems.
 * Used to identify IIoT-related code that needs testing.
 */
const PROTOCOL_LIBRARIES = [
  // Python protocols
  'pymodbus', 'pycomm3', 'python-snap7', 'asyncua', 'opcua',
  'minimalmodbus', 'modbus-tk', 'mqtt', 'paho-mqtt',
  
  // JavaScript protocols
  'mqtt', 'modbus-serial', 'modbus-tcp', 'node-opcua',
  'serialport', 'socket.io', 'socket.io-client', 'ws', 'websocket',
  'amqplib', 'amqp', 'kafkajs', 'nats', 'ioredis',
  
  // Java protocols
  'plc4j', 'apache-plc4x', 's7connector', 'eclipse-milo',
  'paho-mqtt-client', 'eclipse-paho',
  
  // C# protocols
  's7netplus', 'hslcommunication', 'mqtt', 'rabbitmq',
];

// =====================================================================
// HELPER FUNCTIONS (Engineering Excellence: Separation of Concerns)
// =====================================================================

/**
 * Determines if a file is a production source file, excluding tests, mocks, and configs.
 * We only want to flag hardcoded values in production logic, not in test fixtures.
 *
 * [FIX #3] Expanded code extensions to include all major IIoT languages.
 */
function isProductionSourceFile(path: string): boolean {
  const lowerPath = path.toLowerCase();
  const codeExtensions = [
    '.py',           // Python
    '.ts', '.tsx',   // TypeScript
    '.js', '.jsx',   // JavaScript
    '.c', '.cpp', '.h', '.hpp',  // C/C++
    '.rs',           // Rust
    '.go',           // Go
    '.java',         // Java
    '.cs',           // C#
    '.st',           // Structured Text (PLC)
    '.iec',          // IEC 61131-3
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

/**
 * [FIX #3] Enhanced dependency file detection with multi-language support.
 * Checks if a dependency file contains required IIoT mocking libraries.
 */
function hasMockingDependencies(path: string, content: string | undefined): boolean {
  const lowerPath = path.toLowerCase();
  const isDependencyFile =
    lowerPath.endsWith('requirements.txt') ||
    lowerPath.endsWith('requirements-dev.txt') ||
    lowerPath.endsWith('pyproject.toml') ||
    lowerPath.endsWith('setup.py') ||
    lowerPath.endsWith('pipfile') ||
    lowerPath.endsWith('pipfile.lock') ||
    lowerPath.endsWith('poetry.lock') ||
    lowerPath.endsWith('package.json') ||
    lowerPath.endsWith('package-lock.json') ||
    lowerPath.endsWith('yarn.lock') ||
    lowerPath.endsWith('pnpm-lock.yaml') ||
    lowerPath.endsWith('cargo.toml') ||
    lowerPath.endsWith('pom.xml') ||
    lowerPath.endsWith('build.gradle') ||
    lowerPath.endsWith('build.gradle.kts') ||
    lowerPath.endsWith('packages.config') ||
    lowerPath.endsWith('.csproj') ||
    lowerPath.endsWith('gemfile');

  if (!isDependencyFile || !content) return false;

  const lowerContent = content.toLowerCase();
  
  // Check for any IIoT-related mocking or testing library
  return MOCK_LIBRARIES.some((lib) => lowerContent.includes(lib.toLowerCase()));
}

/**
 * [FIX #3] Detect if a dependency file contains IIoT protocol libraries.
 * This helps identify projects that NEED testing infrastructure.
 */
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

/**
 * [FIX #3] Detect test script definitions in configuration files.
 */
function hasTestScript(path: string, content: string | undefined): boolean {
  const lowerPath = path.toLowerCase();
  if (!lowerPath.endsWith('package.json') && !lowerPath.endsWith('pyproject.toml') && 
      !lowerPath.endsWith('makefile') && !lowerPath.endsWith('cargo.toml')) {
    return false;
  }
  
  if (!content) return false;
  
  const lowerContent = content.toLowerCase();
  return (
    lowerContent.includes('"test"') ||
    lowerContent.includes("'test'") ||
    lowerContent.includes('mocha') ||
    lowerContent.includes('jest') ||
    lowerContent.includes('pytest') ||
    lowerContent.includes('junit') ||
    lowerContent.includes('nunit') ||
    lowerContent.includes('cargo test')
  );
}

// =====================================================================
// MAIN AUDIT ORCHESTRATOR
// =====================================================================

export function auditIIoTRepository(
  treeItems: GitHubTreeItem[],
  fileContents?: Record<string, string>
): IIoTAuditReport {
  const checks: IIoTCheckResult[] = [];
  
  // Pre-filter files to reduce cognitive load and processing time
  const productionFiles = treeItems.filter((item) => item.type === 'blob' && isProductionSourceFile(item.path));
  const allBlobPaths = treeItems.filter((item) => item.type === 'blob').map((item) => item.path);

  // ───────────────────────────────────────────────
  // CHECK 1: Hardware Abstraction (Hardcoded Ports/IPs)
  // ───────────────────────────────────────────────
  const hardcodedPortFiles: string[] = [];
  const hardcodedIpFiles: string[] = [];

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

    if (HARDCODED_PLC_IP_REGEX.test(content)) {
      hardcodedIpFiles.push(file.path);
    }
  }

  if (hardcodedPortFiles.length > 0) {
    checks.push({
      category: 'hardware_abstraction',
      status: 'fail',
      title: 'Hardcoded Hardware Ports Detected in Production Code',
      message: `Found hardcoded serial/COM ports or Modbus port references in ${hardcodedPortFiles.length} file(s). This violates the 12-factor app methodology, making the code non-portable across edge and containerized environments.`,
      affectedFiles: hardcodedPortFiles.slice(0, 5),
      recommendation: 'Abstract hardware configurations into environment variables (e.g., `os.environ["PLC_PORT"]`). Document required hardware parameters in a `.env.example` file.',
    });
  } else {
    checks.push({
      category: 'hardware_abstraction',
      status: 'pass',
      title: 'Strict Hardware Abstraction Enforced',
      message: 'No hardcoded physical ports or baud rates detected in production logic.',
      recommendation: 'Maintain this boundary. Ensure deployment scripts (Helm, Docker) inject these variables at runtime.',
    });
  }

  if (hardcodedIpFiles.length > 0) {
    checks.push({
      category: 'hardware_abstraction',
      status: 'warn',
      title: 'Hardcoded PLC IP Addresses Detected',
      message: `Found direct IP literals for PLC/SCADA devices in ${hardcodedIpFiles.length} file(s). Production network topologies change; IPs should never be committed to source.`,
      affectedFiles: hardcodedIpFiles.slice(0, 5),
      recommendation: 'Replace hardcoded IPs with environment lookups. Centralize connection endpoints in a dedicated `config.py` or `network_config.ts` module.',
    });
  }

  // ───────────────────────────────────────────────
  // CHECK 2: Deterministic Testing (Mocks & Simulators)
  // [FIX #3] Enhanced with multi-language detection and broader heuristics
  // ───────────────────────────────────────────────
  
  // Check for mocking libraries in dependency files
  const hasMockLibs = treeItems.some((item) => hasMockingDependencies(item.path, fileContents?.[item.path]));
  
  // Check for test scripts defined in configuration
  const hasTestScripts = treeItems.some((item) => hasTestScript(item.path, fileContents?.[item.path]));
  
  // Check for simulator configuration files
  const hasSimulatorConfig = allBlobPaths.some((path) =>
    SIMULATOR_CONFIG_FILES.some((sim) => path.toLowerCase().endsWith(sim.toLowerCase()))
  );

  // Check for IIoT-specific test file patterns
  const hasIiotTestFiles = allBlobPaths.some((path) =>
    IIOT_TEST_PATTERNS.some((regex) => regex.test(path))
  );
  
  // [FIX #3] Check for device-specific test directories (e.g., server/test/devices/)
  const hasIiotTestDirs = allBlobPaths.some((path) =>
    IIOT_TEST_DIRECTORIES.some((regex) => regex.test(path))
  );

  // Check if project uses IIoT protocols (needs testing infrastructure)
  const hasProtocolDeps = treeItems.some((item) => hasProtocolDependencies(item.path, fileContents?.[item.path]));
  
  // Determine overall testing status using composite logic
  const hasComprehensiveTests = hasMockLibs && (hasIiotTestFiles || hasIiotTestDirs);
  const hasPartialTests = (hasMockLibs || hasSimulatorConfig) && hasTestScripts;
  const hasTestInfrastructure = hasTestScripts && (hasIiotTestFiles || hasIiotTestDirs);

  if (hasComprehensiveTests) {
    checks.push({
      category: 'deterministic_testing',
      status: 'pass',
      title: 'Deterministic IIoT Mock Testing Present',
      message: 'Repository includes mocking libraries and dedicated IIoT test files/directories, ensuring CI pipelines can validate protocol logic without physical hardware.',
      recommendation: 'Excellent. Consider adding property-based tests (e.g., `hypothesis` in Python, `fast-check` in JS) to simulate edge cases like packet fragmentation or malformed Modbus frames.',
    });
  } else if (hasPartialTests || hasTestInfrastructure) {
    checks.push({
      category: 'deterministic_testing',
      status: 'warn',
      title: 'Partial Test Infrastructure Detected',
      message: 'Some testing components exist (test scripts, directories, or mocking libs), but comprehensive IIoT-specific mock coverage could not be fully confirmed.',
      recommendation: hasProtocolDeps 
        ? 'Project uses IIoT protocols. Ensure all network-bound code paths have corresponding mock tests using sinon (JS), unittest.mock (Python), or mockito (Java).'
        : 'Ensure all network-bound code paths have corresponding mock tests. Consider adding protocol-specific test directories.',
    });
  } else if (hasProtocolDeps) {
    // Project uses IIoT protocols but has no testing infrastructure
    checks.push({
      category: 'deterministic_testing',
      status: 'fail',
      title: 'No Industrial Protocol Mock Testing Detected',
      message: 'Project uses IIoT protocol libraries but no mocking libraries, simulator configs, or test directories were found. Code interacting with physical hardware cannot be safely validated in ephemeral CI runners.',
      recommendation: 'Add protocol-appropriate mocking libraries: sinon/mocha/chai (JS), pytest-mock/pymodbus (Python), or mockito/junit (Java). Create dedicated test directories for device/protocol testing.',
    });
  } else {
    // No protocol deps and no tests - might not be an IIoT project
    checks.push({
      category: 'deterministic_testing',
      status: 'warn',
      title: 'Limited IIoT Testing Infrastructure',
      message: 'No IIoT-specific mocking libraries, simulator configs, or test directories were detected. If this project interacts with hardware, add testing infrastructure.',
      recommendation: 'If this project interacts with physical hardware, add appropriate mocking libraries and create test directories for device/protocol validation.',
    });
  }

  // ───────────────────────────────────────────────
  // CHECK 3: Fail-Safe Networking (Timeouts & Retries)
  // Theory: Network partitions are a certainty in industrial environments (EMI, cable faults).
  // Unbounded blocking calls will hang the control loop, violating deterministic execution.
  //
  // [FIX #3] Expanded protocol import detection to include JS/TS ecosystems
  // ───────────────────────────────────────────────
  const unsafeConnectionFiles: string[] = [];
  let robustConnectionCount = 0;

  for (const file of productionFiles) {
    const content = fileContents?.[file.path];
    if (!content) continue;

    // [FIX #3] Expanded protocol import detection across languages
    const hasProtocolImport = 
      /import.*modbus|from.*modbus/i.test(content) ||           // Python/JS
      /import.*plc|from.*snap7|from.*pycomm|from.*opcua/i.test(content) ||  // Python
      /require\s*\(['"](mqtt|serialport|node-opcua|modbus)/i.test(content) ||  // JS
      /import\s+.*\s+from\s+['"](mqtt|serialport|node-opcua|modbus)/i.test(content) ||  // TS/ES modules
      /const\s+.*\s*=\s*require\s*\(['"](mqtt|serialport|node-opcua)/i.test(content) ||  // JS CommonJS
      /import\s+.*mqtt.*|import\s+.*serialport/i.test(content) ||  // General
      /new\s+mqtt\.Client|mqtt\.connect/i.test(content) ||  // MQTT usage
      /new\s+SerialPort|serialport\.open/i.test(content);  // Serial usage

    if (!hasProtocolImport) continue;

    // Heuristic: Look for explicit timeout configurations
    // Note: This catches `timeout=3`, `timeout: 5000`, or `Timeout = 3000`.
    // It may miss complex object instantiations, which is an acceptable
    // trade-off for static regex analysis.
    const hasTimeout = /timeout\s*[=:]\s*\d+/i.test(content);
    const hasRetryLogic = /retry|reconnect|max_attempts|backoff|retries/i.test(content);
    const hasExceptionHandling = /try\s*:|try\s*{|catch\s*\(|\.catch\s*\(/.test(content);

    if (!hasTimeout) {
      unsafeConnectionFiles.push(file.path);
    } else {
      robustConnectionCount++;
      if (hasRetryLogic || hasExceptionHandling) robustConnectionCount++; // Bonus points for comprehensive safety
    }
  }

  if (unsafeConnectionFiles.length > 0) {
    checks.push({
      category: 'fail_safe_networking',
      status: 'warn',
      title: 'Industrial Connections Missing Fail-Safe Timeouts',
      message: `Found ${unsafeConnectionFiles.length} file(s) with protocol imports but no explicit timeout settings. Unbounded connections will hang the application during network partitions.`,
      affectedFiles: unsafeConnectionFiles.slice(0, 5),
      recommendation: 'Always set explicit timeouts on clients (e.g., `ModbusTcpClient(host, timeout=3)` or `mqtt.connect(url, {connectTimeout: 5000})`). Implement exponential backoff for critical PLC reconnections.',
    });
  } else if (robustConnectionCount > 0) {
    checks.push({
      category: 'fail_safe_networking',
      status: 'pass',
      title: 'Robust, Fail-Safe Connection Handling Detected',
      message: 'Industrial protocol connections include explicit timeouts and error handling, adhering to deterministic execution best practices.',
      recommendation: 'Document connection failure modes and fallback states in the README so operators understand system behavior during PLC downtime.',
    });
  }

  // ───────────────────────────────────────────────
  // SCORING ENGINE
  // ───────────────────────────────────────────────
  const failures = checks.filter((c) => c.status === 'fail').length;
  const warnings = checks.filter((c) => c.status === 'warn').length;
  const passed = checks.filter((c) => c.status === 'pass').length;

  // Hardware abstraction and Fail-safe networking are critical in IIoT.
  // Fails penalize heavily (-35), Warnings moderately (-15).
  let calculatedScore = 100 - (failures * 35) - (warnings * 15);
  calculatedScore = Math.max(0, Math.min(100, calculatedScore));

  return {
    score: calculatedScore,
    checks,
    summary: { totalChecks: checks.length, passed, warnings, failures },
  };
}