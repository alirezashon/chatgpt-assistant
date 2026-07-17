import type { PageContextSnapshot } from './context-types';

/** Creates a complete context snapshot from older minimal context inputs. */
export function createMinimalPageContext(
  input: Pick<PageContextSnapshot, 'capturedAt' | 'hostname' | 'pageKind' | 'title' | 'url'> &
    Partial<PageContextSnapshot>,
): PageContextSnapshot {
  return {
    application: input.application ?? 'generic-web',
    availableActions: input.availableActions ?? [],
    capturedAt: input.capturedAt,
    content: input.content ?? [],
    domain: input.domain ?? input.hostname,
    entities: input.entities ?? [],
    hostname: input.hostname,
    metadata: input.metadata ?? {
      structuredDataTypes: [],
    },
    pageKind: input.pageKind,
    permissions: input.permissions ?? [],
    privacy: input.privacy ?? {
      containsSensitiveFields: false,
      dataClasses: [],
      redactions: [],
      safeForAI: true,
    },
    title: input.title,
    url: input.url,
    ...(input.focusedElement === undefined ? {} : { focusedElement: input.focusedElement }),
    ...(input.selectedText === undefined ? {} : { selectedText: input.selectedText }),
    ...(input.selection === undefined ? {} : { selection: input.selection }),
  };
}
