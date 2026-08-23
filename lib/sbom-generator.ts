// lib/sbom-generator.ts
import {
  Bom, Component, ExternalReference, Hash,
  LicenseChoice, Tool, Metadata
} from '@cyclonedx/cyclonedx-library';

export interface SBOMResult {
  bom: any;
  ecosystem: 'npm' | 'python' | 'cargo' | 'maven' | 'unknown';
  componentCount: number;
}

/**
 * Detects which package manager/ecosystem the repo uses
 * based on dependency files present in the tree.
 */
function detectEcosystem(treePaths: string[]): string {
  const paths = treePaths.map(p => p.toLowerCase());
  
  if (paths.some(p => p === 'package.json' || p.endsWith('/package.json'))) return 'npm';
  if (paths.some(p => p === 'pyproject.toml' || p.endsWith('/requirements.txt'))) return 'python';
  if (paths.some(p => p === 'cargo.toml' || p.endsWith('/cargo.toml'))) return 'cargo';
  if (paths.some(p => p === 'pom.xml' || p.endsWith('/build.gradle'))) return 'maven';
  return 'unknown';
}

/**
 * Clean version string: remove ^, ~, >=, etc.
 */
function cleanVersion(version: string): string {
  return version.replace(/^[\^~>=<]+/, '').trim() || '0.0.0';
}

/**
 * Generate CycloneDX SBOM from parsed dependency file contents.
 * 
 * @param dependencyContents - Record of file path → file content string
 *                             e.g. { 'package.json': '{...}', 'requirements.txt': '...' }
 */
export function generateSBOM(dependencyContents: Record<string, string>): SBOMResult {
  const bom = new Bom();
  
  // Metadata
  bom.metadata = new Metadata();
  bom.metadata.timestamp = new Date();
  bom.metadata.tools = [new Tool('RepoScope', 'RepoScope SBOM Generator', '1.0.0')];
  
  const allPaths = Object.keys(dependencyContents);
  const ecosystem = detectEcosystem(allPaths);
  let componentCount = 0;

  // ─── NPM (package.json) ───
  const packageJsonPath = allPaths.find(p => p.toLowerCase().endsWith('package.json'));
  if (packageJsonPath) {
    try {
      const pkg = JSON.parse(dependencyContents[packageJsonPath]);
      const deps = { 
        ...(pkg.dependencies || {}), 
        ...(pkg.devDependencies || {}),
        ...(pkg.peerDependencies || {}),
      };

      for (const [name, version] of Object.entries(deps)) {
        const component = new Component(Component.Type.LIBRARY, name);
        component.version = cleanVersion(version as string);
        component.purl = `pkg:npm/${encodeURIComponent(name)}@${component.version}`;
        component.scope = pkg.devDependencies?.[name] 
          ? Component.Scope.DEV 
          : Component.Scope.REQUIRED;
        
        // Add npm registry as external reference
        component.externalReferences = [
          new ExternalReference(
            ExternalReference.Type.DISTRIBUTION,
            `https://registry.npmjs.org/${name}`
          )
        ];
        
        bom.addComponent(component);
        componentCount++;
      }
    } catch (e) {
      console.warn('Failed to parse package.json:', e);
    }
  }

  // ─── Python (requirements.txt) ───
  const reqPath = allPaths.find(p => p.toLowerCase().endsWith('requirements.txt'));
  if (reqPath) {
    const lines = dependencyContents[reqPath].split('\n');
    for (const line of lines) {
      const clean = line.trim();
      if (!clean || clean.startsWith('#') || clean.startsWith('-')) continue;
      
      // Parse "package==1.2.3" or "package>=1.2.3"
      const match = clean.match(/^([a-zA-Z0-9_-]+)\s*([=<>!]+)\s*([0-9.]+)/);
      if (match) {
        const [, name, , version] = match;
        const component = new Component(Component.Type.LIBRARY, name);
        component.version = version;
        component.purl = `pkg:pypi/${name}@${version}`;
        bom.addComponent(component);
        componentCount++;
      } else {
        // Package without version pinning
        const nameMatch = clean.match(/^([a-zA-Z0-9_-]+)/);
        if (nameMatch) {
          const component = new Component(Component.Type.LIBRARY, nameMatch[1]);
          component.purl = `pkg:pypi/${nameMatch[1]}`;
          bom.addComponent(component);
          componentCount++;
        }
      }
    }
  }

  // ─── Python (pyproject.toml) — basic parse ───
  const pyprojectPath = allPaths.find(p => p.toLowerCase().endsWith('pyproject.toml'));
  if (pyprojectPath && !reqPath) {
    const content = dependencyContents[pyprojectPath];
    // Very basic TOML extraction for [project.dependencies]
    const depMatches = content.matchAll(/"([^"]+)"/g);
    const inDepsSection = content.includes('[project.dependencies]') || 
                          content.includes('[tool.poetry.dependencies]');
    
    if (inDepsSection) {
      for (const match of depMatches) {
        const value = match[1];
        if (/^[a-zA-Z0-9_-]+$/.test(value) && value.length < 50) {
          const component = new Component(Component.Type.LIBRARY, value);
          component.purl = `pkg:pypi/${value}`;
          bom.addComponent(component);
          componentCount++;
        }
      }
    }
  }

  return {
    bom: bom.toJSON(),
    ecosystem,
    componentCount,
  };
}