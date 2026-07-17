import { extractPageContext, type PageContextSnapshot } from '@/features/context';

/** Provides the current browser context to command systems. */
export class CommandContextProvider {
  /** Captures the latest page context snapshot. */
  public getCurrentContext(): PageContextSnapshot {
    return extractPageContext();
  }
}
