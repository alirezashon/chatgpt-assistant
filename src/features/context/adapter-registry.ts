import { ChatGPTAdapter } from './adapters/chatgpt-adapter';
import { DocsAdapter } from './adapters/docs-adapter';
import { GenericWebAdapter } from './adapters/generic-web-adapter';
import { GitHubAdapter } from './adapters/github-adapter';
import { GmailAdapter } from './adapters/gmail-adapter';
import { JiraAdapter } from './adapters/jira-adapter';
import { NotionAdapter } from './adapters/notion-adapter';
import { StackOverflowAdapter } from './adapters/stackoverflow-adapter';
import { YouTubeAdapter } from './adapters/youtube-adapter';
import type { ContextAdapter } from './adapters/context-adapter';

/** Registry for website-specific context adapters. */
export class ContextAdapterRegistry {
  private readonly adapters: readonly ContextAdapter[];

  public constructor(
    adapters: readonly ContextAdapter[] = [
      new ChatGPTAdapter(),
      new GitHubAdapter(),
      new YouTubeAdapter(),
      new GmailAdapter(),
      new JiraAdapter(),
      new DocsAdapter(),
      new NotionAdapter(),
      new StackOverflowAdapter(),
      new GenericWebAdapter(),
    ],
  ) {
    this.adapters = adapters;
  }

  /** Returns the first matching adapter. */
  public match(input: { readonly documentRef: Document; readonly url: URL }): ContextAdapter {
    return (
      this.adapters.find((adapter) =>
        adapter.detect({
          documentRef: input.documentRef,
          url: input.url,
        }),
      ) ?? new GenericWebAdapter()
    );
  }
}
