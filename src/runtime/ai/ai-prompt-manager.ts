import { RuntimeError } from '@/runtime/utils';

import type { AIPromptMessage, AIPromptTemplate } from './ai-types';

/** Versioned prompt template manager. */
export class AIPromptManager {
  private readonly templates = new Map<string, AIPromptTemplate>();

  /** Registers a prompt template. */
  public register(template: AIPromptTemplate): void {
    const key = getTemplateKey(template.id, template.version);
    this.templates.set(key, template);
  }

  /** Builds provider messages from a template and variables. */
  public build(
    templateId: string,
    variables: Readonly<Record<string, string>>,
  ): readonly AIPromptMessage[] {
    const template = this.getLatest(templateId);

    if (template === undefined) {
      throw new RuntimeError('NOT_FOUND', `Prompt template not found: ${templateId}`);
    }

    return [
      {
        content: interpolate(template.system, variables),
        role: 'system',
      },
      {
        content: interpolate(template.user, variables),
        role: 'user',
      },
    ];
  }

  private getLatest(templateId: string): AIPromptTemplate | undefined {
    return [...this.templates.values()]
      .filter((template) => template.id === templateId)
      .sort((left, right) => right.version - left.version)[0];
  }
}

function getTemplateKey(id: string, version: number): string {
  return `${id}@${version.toString()}`;
}

function interpolate(template: string, variables: Readonly<Record<string, string>>): string {
  return template.replaceAll(
    /\{\{([a-zA-Z0-9_.-]+)\}\}/g,
    (_match, key: string) => variables[key] ?? '',
  );
}
