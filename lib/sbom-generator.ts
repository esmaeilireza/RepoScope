// lib/sbom-generator.ts

export interface SBOMResult {
  bom: Record<string, unknown>;
  ecosystem: 'npm' | 'python' | 'cargo' | 'maven' | 'unknown';
  componentCount: number;
}

interface CycloneDXComponent {
  type: string;
  name: string;
  version?: string;
  purl?: string;
  scope?: string;
}

/**
 * Detects which package manager/ecosystem the repo uses
 */
function detectEcosystem(treePaths: string[]): 'npm' | 'python' | 'cargo' | 'maven' | 'unknown' {
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
 */
export function generateSBOM(dependencyContents: Record<string, string>): SBOMResult {
  const components: CycloneDXComponent[] = [];
  const allPaths = Object.keys(dependencyContents);
  const ecosystem = detectEcosystem(allPaths);

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
        const cleanedVersion = cleanVersion(version as string);
        const isDev = !!pkg.devDependencies?.[name];
        
        components.push({
          type: 'library',
          name,
          version: cleanedVersion,
          purl: `pkg:npm/${encodeURIComponent(name)}@${cleanedVersion}`,
          scope: isDev ? 'optional' : 'required',
        });
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
      
      const match = clean.match(/^([a-zA-Z0-9_-]+)\s*([=<>!]+)\s*([0-9.]+)/);
      if (match) {
        const [, name, , version] = match;
        components.push({
          type: 'library',
          name,
          version,
          purl: `pkg:pypi/${name}@${version}`,
        });
      } else {
        const nameMatch = clean.match(/^([a-zA-Z0-9_-]+)/);
        if (nameMatch) {
          components.push({
            type: 'library',
            name: nameMatch[1],
            purl: `pkg:pypi/${nameMatch[1]}`,
          });
        }
      }
    }
  }

  // ─── Python (pyproject.toml) — basic parse ───
  const pyprojectPath = allPaths.find(p => p.toLowerCase().endsWith('pyproject.toml'));
  if (pyprojectPath && !reqPath) {
    const content = dependencyContents[pyprojectPath];
    const inDepsSection = content.includes('[project.dependencies]') || 
                          content.includes('[tool.poetry.dependencies]');
    
    if (inDepsSection) {
      const depRegex = /"([^"]+)"/g;
      let match: RegExpExecArray | null;
      while ((match = depRegex.exec(content)) !== null) {
        const value = match[1];
        if (/^[a-zA-Z0-9_-]+$/.test(value) && value.length < 50) {
          components.push({
            type: 'library',
            name: value,
            purl: `pkg:pypi/${value}`,
          });
        }
      }
    }
  }

  // ─── Build CycloneDX BOM ───
  const bom = {
    bomFormat: 'CycloneDX',
    specVersion: '1.4',
    version: 1,
    metadata: {
      timestamp: new Date().toISOString(),
      tools: [{
        vendor: 'RepoScope',
        name: 'RepoScope SBOM Generator',
        version: '1.0.0',
      }],
    },
    components,
  };

  return {
    bom,
    ecosystem,
    componentCount: components.length,
  };
}