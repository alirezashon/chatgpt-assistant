import { describe, expect, it } from 'vitest';

import { ContextEngine } from './context-engine';

describe('ContextEngine', () => {
  it('detects GitHub pull request context and relevant actions', () => {
    const documentRef = document.implementation.createHTMLDocument('Fix login bug by ali/app');
    documentRef.body.innerHTML = '<main><h1>Fix login bug</h1><pre>throw new Error("boom")</pre></main>';
    const engine = new ContextEngine();

    const context = engine.detect({
      documentRef,
      url: 'https://github.com/ali/app/pull/42',
    });

    expect(context.application).toBe('github');
    expect(context.pageKind).toBe('code');
    expect(context.entities.map((entity) => entity.type)).toContain('pull-request');
    expect(context.availableActions.map((action) => action.actionId)).toContain('github.reviewPr');
  });

  it('detects YouTube context and avoids generic action flooding', () => {
    const documentRef = document.implementation.createHTMLDocument('Architecture talk');
    documentRef.body.innerHTML = '<main><h1>Architecture talk</h1></main>';
    const engine = new ContextEngine();

    const context = engine.detect({
      documentRef,
      url: 'https://www.youtube.com/watch?v=abc',
    });

    expect(context.application).toBe('youtube');
    expect(context.availableActions.slice(0, 3).map((action) => action.actionId)).toContain(
      'youtube.summarize',
    );
    expect(context.availableActions.length).toBeLessThanOrEqual(8);
  });

  it('classifies selected errors for selection intelligence', () => {
    const documentRef = document.implementation.createHTMLDocument('Stack trace');
    const engine = new ContextEngine();

    const context = engine.detect({
      documentRef,
      selectedText: 'TypeError: Cannot read properties of undefined',
      url: 'https://stackoverflow.com/questions/1',
    });

    expect(context.selection?.kind).toBe('error');
    expect(context.availableActions.map((action) => action.actionId)).toContain('code.findBug');
  });

  it('marks sensitive payment-like content as not safe for AI', () => {
    const documentRef = document.implementation.createHTMLDocument('Billing');
    documentRef.body.innerHTML = '<main><p>Card 4111 1111 1111 1111</p></main>';
    const engine = new ContextEngine();

    const context = engine.detect({
      documentRef,
      selectedText: 'Card 4111 1111 1111 1111',
      url: 'https://billing.example.com/invoice',
    });

    expect(context.privacy.safeForAI).toBe(false);
    expect(context.privacy.dataClasses).toContain('payment-card');
    expect(context.selectedText).toContain('[payment-card]');
  });
});
