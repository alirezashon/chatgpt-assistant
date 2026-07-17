import type { SecurityThreatEvent } from './security-types';

/** Detects prompt injection, sensitive pages, plugin abuse, and behavioral anomalies. */
export class ThreatDetector {
  /** Detects prompt injection in untrusted content. */
  public detectPromptInjection(content: string): readonly SecurityThreatEvent[] {
    const lower = content.toLowerCase();
    const evidence = [
      'ignore previous instructions',
      'system message',
      'developer message',
      'reveal your prompt',
      'exfiltrate',
      'bypass security',
    ].filter((pattern) => lower.includes(pattern));

    if (evidence.length === 0) {
      return [];
    }

    return [
      {
        evidence,
        id: crypto.randomUUID(),
        response: 'block',
        severity: evidence.some((item) => item.includes('exfiltrate') || item.includes('bypass')) ? 'critical' : 'high',
        summary: 'Untrusted content contains prompt-injection instructions.',
        timestamp: Date.now(),
        type: 'prompt-injection',
      },
    ];
  }

  /** Detects sensitive browser zones from origins and page text. */
  public detectSensitivePage(input: {
    readonly origin: string;
    readonly title?: string;
    readonly text?: string;
  }): readonly SecurityThreatEvent[] {
    const combined = `${input.origin} ${input.title ?? ''} ${input.text ?? ''}`.toLowerCase();
    const evidence = ['bank', 'password', 'medical', 'health', 'payroll', 'admin', 'token', 'secret'].filter((term) =>
      combined.includes(term),
    );

    if (evidence.length === 0) {
      return [];
    }

    return [
      {
        evidence,
        id: crypto.randomUUID(),
        response: 'notify',
        severity: evidence.includes('password') || evidence.includes('secret') ? 'high' : 'medium',
        summary: 'Sensitive browser context detected.',
        timestamp: Date.now(),
        type: 'sensitive-page',
      },
    ];
  }

  /** Detects anomalous repeated denied behavior. */
  public detectDeniedBurst(input: {
    readonly deniedCount: number;
    readonly principalId: string;
  }): readonly SecurityThreatEvent[] {
    if (input.deniedCount < 5) {
      return [];
    }

    return [
      {
        evidence: [`principal=${input.principalId}`, `deniedCount=${input.deniedCount.toString()}`],
        id: crypto.randomUUID(),
        response: 'quarantine',
        severity: 'high',
        summary: 'Principal produced repeated denied security decisions.',
        timestamp: Date.now(),
        type: 'anomaly',
      },
    ];
  }
}
