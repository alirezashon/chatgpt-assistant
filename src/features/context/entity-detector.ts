import type { ContextContentBlock, ContextEntity } from './context-types';

/** Detects lightweight entities from bounded page context. */
export class EntityDetector {
  /** Detects entities from URL, title, selected text, and extracted content blocks. */
  public detect(input: {
    readonly hostname: string;
    readonly pathname: string;
    readonly selectedText: string;
    readonly title: string;
    readonly content: readonly ContextContentBlock[];
  }): readonly ContextEntity[] {
    const text = [input.title, input.selectedText, ...input.content.map((block) => block.text)]
      .join('\n')
      .slice(0, 6000);
    const entities: ContextEntity[] = [];

    if (input.hostname.includes('github.com')) {
      const repositoryMatch = /^\/([^/]+)\/([^/]+)/u.exec(input.pathname);
      const owner = repositoryMatch?.[1];
      const repo = repositoryMatch?.[2];

      if (owner !== undefined && repo !== undefined) {
        entities.push({
          confidence: 0.92,
          label: 'Repository',
          type: 'repository',
          value: `${owner}/${repo}`,
        });
      }

      if (/\/pull\/\d+/u.test(input.pathname)) {
        entities.push({
          confidence: 0.96,
          label: 'Pull request',
          type: 'pull-request',
          value: input.pathname,
        });
      }
    }

    const issueKey = /\b[A-Z][A-Z0-9]+-\d+\b/u.exec(text)?.[0];

    if (issueKey !== undefined) {
      entities.push({
        confidence: 0.86,
        label: 'Issue',
        type: 'issue',
        value: issueKey,
      });
    }

    if (looksLikeError(text)) {
      entities.push({
        confidence: 0.82,
        label: 'Error',
        type: 'error',
        value: firstLine(text),
      });
    }

    if (input.content.some((block) => block.kind === 'table')) {
      entities.push({
        confidence: 0.74,
        label: 'Table',
        type: 'table',
        value: 'Visible table',
      });
    }

    return dedupeEntities(entities);
  }
}

function looksLikeError(value: string): boolean {
  return /\b(error|exception|traceback|failed|cannot read|undefined is not|stack trace)\b/iu.test(
    value,
  );
}

function firstLine(value: string): string {
  return value.split(/\r?\n/u)[0]?.slice(0, 120) ?? 'Detected error';
}

function dedupeEntities(entities: readonly ContextEntity[]): readonly ContextEntity[] {
  const seen = new Set<string>();
  const result: ContextEntity[] = [];

  for (const entity of entities) {
    const key = `${entity.type}:${entity.value}`;

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    result.push(entity);
  }

  return result;
}
