import { RuntimeError } from '@/runtime/utils';

import type { KnowledgeConnector, KnowledgeConnectorMetadata } from './knowledge-types';

/** Connector registry for browser pages, files, SaaS systems, and enterprise sources. */
export class KnowledgeConnectorRegistry {
  private readonly connectors = new Map<string, KnowledgeConnector>();

  /** Registers a connector. */
  public register(connector: KnowledgeConnector): void {
    if (this.connectors.has(connector.metadata.id)) {
      throw new RuntimeError('REGISTRATION_CONFLICT', `Knowledge connector already registered: ${connector.metadata.id}`);
    }

    this.connectors.set(connector.metadata.id, connector);
  }

  /** Returns connector metadata. */
  public metadata(): readonly KnowledgeConnectorMetadata[] {
    return [...this.connectors.values()].map((connector) => connector.metadata);
  }

  /** Returns all connectors. */
  public all(): readonly KnowledgeConnector[] {
    return [...this.connectors.values()];
  }

  /** Returns one connector. */
  public get(id: string): KnowledgeConnector | undefined {
    return this.connectors.get(id);
  }
}
