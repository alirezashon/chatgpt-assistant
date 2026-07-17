import type {
  MarketplacePackageBundle,
  MarketplaceSecurityFinding,
  MarketplaceSecurityScan,
} from './marketplace-types';

const CRITICAL_PERMISSIONS = ['filesystem.write', 'browser.click', 'browser.type', 'network.request', 'memory.read'];
const SUSPICIOUS_PATTERNS = ['eval(', 'new Function', 'document.cookie', 'localStorage', 'chrome.cookies', 'fetch("http://'];

/** Publishing security pipeline: static analysis, permissions, dependencies, malware, AI behavior, sandbox. */
export class MarketplaceSecurityScanner {
  /** Scans package bundle. */
  public scan(versionId: string, bundle: MarketplacePackageBundle): MarketplaceSecurityScan {
    const findings: MarketplaceSecurityFinding[] = [];
    findings.push(...permissionFindings(bundle));
    findings.push(...staticAnalysisFindings(bundle));
    findings.push(...dependencyFindings(bundle));
    findings.push(...aiBehaviorFindings(bundle));
    findings.push(...sandboxFindings(bundle));
    const maxSeverity = findings.reduce(
      (max, finding) => Math.max(max, severityRank(finding.severity)),
      severityRank('low'),
    );
    const score = Math.max(0, 100 - findings.reduce((sum, finding) => sum + severityPenalty(finding.severity), 0));
    const requiresHumanReview = findings.some((finding) => finding.severity === 'critical' || finding.severity === 'high');

    return {
      createdAt: Date.now(),
      findings,
      id: crypto.randomUUID(),
      requiresHumanReview,
      score,
      status: findings.some((finding) => finding.severity === 'critical')
        ? 'blocked'
        : requiresHumanReview || maxSeverity >= severityRank('high')
          ? 'needs-human-review'
          : 'approved',
      versionId,
    };
  }
}

function permissionFindings(bundle: MarketplacePackageBundle): readonly MarketplaceSecurityFinding[] {
  return bundle.manifest.permissions
    .filter((permission) => CRITICAL_PERMISSIONS.includes(permission))
    .map((permission) => ({
      evidence: [permission],
      id: crypto.randomUUID(),
      message: `Sensitive permission requested: ${permission}`,
      severity: permission === 'memory.read' ? 'critical' : 'high',
      type: 'permission' as const,
    }));
}

function staticAnalysisFindings(bundle: MarketplacePackageBundle): readonly MarketplaceSecurityFinding[] {
  const joined = Object.values(bundle.codeFiles).join('\n');
  return SUSPICIOUS_PATTERNS.filter((pattern) => joined.includes(pattern)).map((pattern) => ({
    evidence: [pattern],
    id: crypto.randomUUID(),
    message: `Suspicious code pattern detected: ${pattern}`,
    severity: pattern.includes('cookie') ? 'critical' : 'high',
    type: 'static-analysis' as const,
  }));
}

function dependencyFindings(bundle: MarketplacePackageBundle): readonly MarketplaceSecurityFinding[] {
  return bundle.manifest.dependencies
    .filter((dependency) => dependency.versionRange === '*' || dependency.versionRange.includes('latest'))
    .map((dependency) => ({
      evidence: [`${dependency.packageName}@${dependency.versionRange}`],
      id: crypto.randomUUID(),
      message: 'Dependency uses an unsafe floating version range.',
      severity: 'medium' as const,
      type: 'dependency' as const,
    }));
}

function aiBehaviorFindings(bundle: MarketplacePackageBundle): readonly MarketplaceSecurityFinding[] {
  const docs = Object.values(bundle.docs).join('\n').toLowerCase();
  return docs.includes('ignore user approval') || docs.includes('bypass policy')
    ? [
        {
          evidence: ['unsafe-ai-behavior-docs'],
          id: crypto.randomUUID(),
          message: 'Package documentation describes unsafe AI behavior.',
          severity: 'critical',
          type: 'ai-behavior',
        },
      ]
    : [];
}

function sandboxFindings(bundle: MarketplacePackageBundle): readonly MarketplaceSecurityFinding[] {
  return bundle.manifest.entrypoints.some((entrypoint) => entrypoint.includes('..'))
    ? [
        {
          evidence: bundle.manifest.entrypoints,
          id: crypto.randomUUID(),
          message: 'Entrypoint escapes package sandbox path.',
          severity: 'critical',
          type: 'sandbox',
        },
      ]
    : [];
}

function severityPenalty(severity: MarketplaceSecurityFinding['severity']): number {
  if (severity === 'critical') {
    return 100;
  }

  if (severity === 'high') {
    return 35;
  }

  if (severity === 'medium') {
    return 15;
  }

  return 5;
}

function severityRank(severity: MarketplaceSecurityFinding['severity']): number {
  if (severity === 'critical') {
    return 4;
  }

  if (severity === 'high') {
    return 3;
  }

  if (severity === 'medium') {
    return 2;
  }

  return 1;
}
