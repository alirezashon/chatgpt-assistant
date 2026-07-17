import { DomAnalyzer } from './dom-analyzer';
import { DomChangeObserver } from './dom-change-observer';
import type {
  BrowserUnderstandingValue,
  OcrAnalyzer,
  SemanticDiff,
  SemanticPageModel,
  SemanticTargetQuery,
  SemanticTargetResult,
  VisualAnalyzer,
} from './browser-understanding-types';
import { PrivacyRedactor } from './privacy-redactor';
import { SemanticDiffEngine } from './semantic-diff';
import { SemanticGraphBuilder } from './semantic-graph-builder';
import { MemorySemanticStateStore, type SemanticStateStore } from './semantic-state-store';
import { SemanticTargetingEngine } from './semantic-targeting';
import { stableHash } from './semantic-utils';
import type { Disposable } from '@/runtime/utils';

/** Browser Understanding Engine dependencies. */
export interface BrowserUnderstandingEngineDependencies {
  /** State store for semantic snapshots. */
  readonly store?: SemanticStateStore;
  /** Optional visual analyzer. */
  readonly visual?: VisualAnalyzer;
  /** Optional OCR analyzer. */
  readonly ocr?: OcrAnalyzer;
}

/** Public semantic perception facade for agents, context engine, and action engine. */
export class BrowserUnderstandingEngine {
  private readonly dom = new DomAnalyzer();
  private readonly graph = new SemanticGraphBuilder();
  private readonly targeting = new SemanticTargetingEngine();
  private readonly diffEngine = new SemanticDiffEngine();
  private readonly privacy = new PrivacyRedactor();
  private readonly observer = new DomChangeObserver();
  private readonly store: SemanticStateStore;
  private readonly visual: VisualAnalyzer | undefined;
  private readonly ocr: OcrAnalyzer | undefined;

  public constructor(dependencies: BrowserUnderstandingEngineDependencies = {}) {
    this.store = dependencies.store ?? new MemorySemanticStateStore();
    this.visual = dependencies.visual;
    this.ocr = dependencies.ocr;
  }

  /** Analyzes a document and persists the semantic snapshot. */
  public async analyze(document: Document, now = Date.now()): Promise<SemanticPageModel> {
    const dom = this.dom.analyze(document);
    const visual = await this.visual?.analyze(document);
    const ocr = await this.ocr?.extract(document);
    const pageId = `page-${stableHash(`${document.location.href}:${document.title}`)}`;
    const elements =
      visual === undefined
        ? dom.elements
        : dom.elements.map((element) => ({
            ...element,
            evidence: [...element.evidence, ...visual.evidence],
          }));
    const graph = this.graph.build({
      elements,
      pageId,
      sections: dom.sections,
      title: document.title,
      url: document.location.href,
    });
    const model: SemanticPageModel = {
      capturedAt: now,
      elements,
      fingerprint: stableHash(
        `${document.location.href}:${document.title}:${elements
          .map(
            (element) =>
              `${element.reference.fingerprint}:${element.text}:${element.state.disabled.toString()}`,
          )
          .join('|')}:${ocr?.map((region) => region.text).join('|') ?? ''}`,
      ),
      graph,
      id: crypto.randomUUID(),
      language: document.documentElement.lang || 'unknown',
      risk: this.privacy.assess(elements, document.location.href),
      sections: dom.sections,
      title: document.title,
      url: document.location.href,
    };

    await this.store.save(model);
    return model;
  }

  /** Computes semantic diff between two snapshots. */
  public diff(previous: SemanticPageModel, next: SemanticPageModel): SemanticDiff {
    return this.diffEngine.diff(previous, next);
  }

  /** Finds semantic element targets without exposing selector dependency. */
  public findTargets(
    model: SemanticPageModel,
    query: SemanticTargetQuery,
    limit?: number,
  ): readonly SemanticTargetResult[] {
    return this.targeting.find(model, query, limit);
  }

  /** Exports compact agent-readable page context. */
  public exportContext(model: SemanticPageModel): BrowserUnderstandingValue {
    return this.graph.exportContext(model);
  }

  /** Lists persisted snapshots. */
  public snapshots(): Promise<readonly SemanticPageModel[]> {
    return this.store.list();
  }

  /** Observes semantic invalidation signals from DOM mutation and SPA navigation. */
  public observe(document: Document, listener: () => void, debounceMs?: number): Disposable {
    return this.observer.observe(document, listener, debounceMs);
  }
}
