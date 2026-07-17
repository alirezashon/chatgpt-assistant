import type {
  BrowserUnderstandingValue,
  SemanticElement,
  SemanticGraph,
  SemanticGraphEdge,
  SemanticGraphNode,
  SemanticPageModel,
  SemanticSection,
} from './browser-understanding-types';

/** Builds a semantic knowledge graph from page sections and elements. */
export class SemanticGraphBuilder {
  /** Builds a graph for a page. */
  public build(input: {
    readonly pageId: string;
    readonly title: string;
    readonly url: string;
    readonly sections: readonly SemanticSection[];
    readonly elements: readonly SemanticElement[];
  }): SemanticGraph {
    const pageNode: SemanticGraphNode = {
      data: {
        title: input.title,
        url: input.url,
      },
      id: input.pageId,
      kind: 'page',
      label: input.title,
    };
    const sectionNodes = input.sections.map((section): SemanticGraphNode => ({
      data: {
        elementIds: section.elementIds,
      },
      id: section.id,
      kind: 'section',
      label: section.label,
    }));
    const elementNodes = input.elements.map((element): SemanticGraphNode => ({
      data: elementToData(element),
      id: element.id,
      kind: element.actionability > 0.5 ? 'action' : 'element',
      label: element.name || element.role,
    }));
    const sectionEdges = input.sections.map((section): SemanticGraphEdge => ({
      confidence: section.confidence,
      from: input.pageId,
      id: `${input.pageId}->${section.id}`,
      to: section.id,
      type: 'inside',
    }));
    const elementEdges = input.sections.flatMap((section) =>
      section.elementIds.map((elementId): SemanticGraphEdge => ({
        confidence: 0.8,
        from: section.id,
        id: `${section.id}->${elementId}`,
        to: elementId,
        type: 'inside',
      })),
    );
    const dependencyEdges = input.elements.flatMap((element) =>
      element.dependencies.map((dependency): SemanticGraphEdge => ({
        confidence: 0.65,
        from: dependency,
        id: `${dependency}->${element.id}`,
        to: element.id,
        type: 'describes',
      })),
    );

    return {
      edges: [...sectionEdges, ...elementEdges, ...dependencyEdges],
      nodes: [pageNode, ...sectionNodes, ...elementNodes],
    };
  }

  /** Exports a compact agent-readable context. */
  public exportContext(model: SemanticPageModel): BrowserUnderstandingValue {
    return {
      actions: model.elements
        .filter((element) => element.actionability > 0.5)
        .map((element) => ({
          id: element.id,
          name: element.name,
          purpose: element.purpose,
          risk: element.risk,
          role: element.role,
        })),
      page: {
        risk: model.risk.risk,
        title: model.title,
        url: model.url,
      },
      sections: model.sections.map((section) => ({
        elementCount: section.elementIds.length,
        id: section.id,
        label: section.label,
      })),
    };
  }
}

function elementToData(element: SemanticElement): BrowserUnderstandingValue {
  return {
    actionability: element.actionability,
    confidence: element.confidence,
    intent: element.intent,
    purpose: element.purpose,
    risk: element.risk,
    role: element.role,
    state: {
      disabled: element.state.disabled,
      hidden: element.state.hidden,
      redacted: element.state.redacted,
    },
  };
}
