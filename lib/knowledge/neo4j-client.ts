// lib/knowledge/neo4j-client.ts
import { spawnSync } from 'child_process';
import * as path from 'path';

export interface GroundingRecord {
  rule_id: string;
  rule_title: string;
  severity: string;
  concept: string;
  book: string;
}

/**
 * Queries Neo4j for grounding information for a given rule.
 * Calls the Python ground.py script and parses the JSON output.
 */
export function groundRule(ruleId: string): GroundingRecord[] {
  const scriptPath = path.join(process.cwd(), 'scripts', 'kg', 'ground.py');
  
  // Use spawnSync for more reliable execution on Windows
  const result = spawnSync('python', [scriptPath, ruleId], {
    encoding: 'utf-8',
    timeout: 10000,
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  });

  // Check for execution errors
  if (result.error) {
    console.warn(`[neo4j-client] Failed to execute ground.py: ${result.error.message}`);
    return [];
  }

  // Check for non-zero exit code
  if (result.status !== 0) {
    console.warn(`[neo4j-client] ground.py exited with code ${result.status}`);
    if (result.stderr) {
      console.warn(`[neo4j-client] stderr: ${result.stderr}`);
    }
    return [];
  }

  // Parse the JSON output
  try {
    const output = result.stdout.trim();
    if (!output) {
      console.warn(`[neo4j-client] ground.py returned empty output for ${ruleId}`);
      return [];
    }
    
    const records = JSON.parse(output) as GroundingRecord[];
    return records;
  } catch (err) {
    console.warn(`[neo4j-client] Failed to parse JSON from ground.py: ${err}`);
    console.warn(`[neo4j-client] Raw output: ${result.stdout}`);
    return [];
  }
}