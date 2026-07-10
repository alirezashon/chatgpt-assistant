import type { WorkspaceRuntimeState } from '@/app/workspace';
import {
  createMarkdownExport,
  type MarkdownExportResult,
} from '@/features/actions/markdown-export';
import type { Conversation } from '@/features/conversations';
import type { EntityId } from '@/shared/types';

export type ConversationExportFormat = 'html' | 'json' | 'markdown' | 'pdf';

export interface ConversationExportResult {
  readonly content: BlobPart;
  readonly conversationCount: number;
  readonly filename: string;
  readonly mimeType: string;
}

interface ExportConversationRecord {
  readonly active: boolean;
  readonly archived: boolean;
  readonly favorite: boolean;
  readonly folder: string | null;
  readonly id: EntityId;
  readonly tags: readonly EntityId[];
  readonly title: string;
  readonly updatedAt: string;
  readonly url: string;
}

export function createConversationExport(
  workspace: WorkspaceRuntimeState,
  targetIds: readonly EntityId[],
  format: ConversationExportFormat,
  generatedAt = new Date().toISOString(),
): ConversationExportResult {
  if (format === 'markdown') {
    return fromMarkdownExport(createMarkdownExport(workspace, targetIds, generatedAt));
  }

  const conversations = getExportConversationRecords(workspace, targetIds);

  if (conversations.length === 0) {
    throw new Error('No conversations are available to export.');
  }

  if (format === 'json') {
    return createJsonExport(workspace, conversations, generatedAt);
  }

  if (format === 'html') {
    return createHtmlExport(workspace, conversations, generatedAt);
  }

  return createPdfExport(workspace, conversations, generatedAt);
}

export function downloadConversationExport(result: ConversationExportResult): void {
  const blob = new Blob([result.content], { type: result.mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');

  anchor.href = url;
  anchor.download = result.filename;
  anchor.rel = 'noopener';
  anchor.style.display = 'none';

  document.body.append(anchor);
  anchor.click();
  anchor.remove();

  window.setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 0);
}

function fromMarkdownExport(result: MarkdownExportResult): ConversationExportResult {
  return {
    content: result.content,
    conversationCount: result.conversationCount,
    filename: result.filename,
    mimeType: 'text/markdown;charset=utf-8',
  };
}

function createJsonExport(
  workspace: WorkspaceRuntimeState,
  conversations: readonly ExportConversationRecord[],
  generatedAt: string,
): ConversationExportResult {
  return {
    content: `${JSON.stringify(
      {
        conversations,
        generatedAt,
        kind: 'chatgpt-workspace.conversation-export',
        workspace: workspace.workspace,
      },
      null,
      2,
    )}\n`,
    conversationCount: conversations.length,
    filename: createFilename('json', conversations, generatedAt),
    mimeType: 'application/json;charset=utf-8',
  };
}

function createHtmlExport(
  workspace: WorkspaceRuntimeState,
  conversations: readonly ExportConversationRecord[],
  generatedAt: string,
): ConversationExportResult {
  const body = conversations
    .map(
      (conversation, index) => `<section>
<h2>${(index + 1).toString()}. ${escapeHtml(conversation.title)}</h2>
<dl>
<dt>Link</dt><dd><a href="${escapeHtml(conversation.url)}">${escapeHtml(conversation.url)}</a></dd>
<dt>Folder</dt><dd>${escapeHtml(conversation.folder ?? 'Unassigned')}</dd>
<dt>Tags</dt><dd>${escapeHtml(conversation.tags.join(', ') || 'None')}</dd>
<dt>Favorite</dt><dd>${conversation.favorite ? 'Yes' : 'No'}</dd>
<dt>Updated</dt><dd>${escapeHtml(conversation.updatedAt)}</dd>
</dl>
</section>`,
    )
    .join('\n');

  return {
    content: `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(workspace.workspace.name)} Export</title>
</head>
<body>
<h1>ChatGPT Workspace Export</h1>
<p>Generated: ${escapeHtml(generatedAt)}</p>
<p>Workspace: ${escapeHtml(workspace.workspace.name)}</p>
${body}
</body>
</html>
`,
    conversationCount: conversations.length,
    filename: createFilename('html', conversations, generatedAt),
    mimeType: 'text/html;charset=utf-8',
  };
}

function createPdfExport(
  workspace: WorkspaceRuntimeState,
  conversations: readonly ExportConversationRecord[],
  generatedAt: string,
): ConversationExportResult {
  const textLines = [
    'ChatGPT Workspace Export',
    `Generated: ${generatedAt}`,
    `Workspace: ${workspace.workspace.name}`,
    ...conversations.flatMap((conversation, index) => [
      '',
      `${(index + 1).toString()}. ${conversation.title}`,
      `URL: ${conversation.url}`,
      `Folder: ${conversation.folder ?? 'Unassigned'}`,
      `Tags: ${conversation.tags.join(', ') || 'None'}`,
    ]),
  ];

  return {
    content: createSimplePdf(textLines),
    conversationCount: conversations.length,
    filename: createFilename('pdf', conversations, generatedAt),
    mimeType: 'application/pdf',
  };
}

function getExportConversationRecords(
  workspace: WorkspaceRuntimeState,
  targetIds: readonly EntityId[],
): readonly ExportConversationRecord[] {
  const targetIdSet = new Set(targetIds);

  return workspace.conversations.conversations
    .filter((conversation) => targetIdSet.has(conversation.id))
    .map((conversation) => createExportConversationRecord(workspace, conversation));
}

function createExportConversationRecord(
  workspace: WorkspaceRuntimeState,
  conversation: Conversation,
): ExportConversationRecord {
  return {
    active: conversation.isActive,
    archived: conversation.isArchived,
    favorite: conversation.favorite,
    folder: getFolderName(workspace, conversation.id),
    id: conversation.id,
    tags: conversation.tags,
    title: conversation.title,
    updatedAt: conversation.updatedAt,
    url: conversation.url,
  };
}

function getFolderName(workspace: WorkspaceRuntimeState, conversationId: EntityId): string | null {
  const assignment = workspace.assignments.assignments.find(
    (candidate) => candidate.conversationId === conversationId,
  );
  const folderId = assignment?.folderId ?? null;

  if (folderId === null) {
    return null;
  }

  return workspace.folders.folders.find((folder) => folder.id === folderId)?.name ?? null;
}

function createFilename(
  extension: ConversationExportFormat,
  conversations: readonly ExportConversationRecord[],
  generatedAt: string,
): string {
  const title = conversations.length === 1 ? conversations[0]?.title : 'bulk';
  const safeTitle = sanitizeFilename(title ?? 'conversation');

  return `chatgpt-workspace-${safeTitle}-${generatedAt.slice(0, 10)}.${extension}`;
}

function sanitizeFilename(value: string): string {
  const normalized = value
    .trim()
    .toLocaleLowerCase()
    .replace(/[^a-z0-9]+/gu, '-')
    .replace(/^-+|-+$/gu, '');

  return normalized.length > 0 ? normalized.slice(0, 48) : 'conversation';
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/gu, (character) => {
    const escapes: Readonly<Record<string, string>> = {
      '&': '&amp;',
      '"': '&quot;',
      "'": '&#39;',
      '<': '&lt;',
      '>': '&gt;',
    };

    return escapes[character] ?? character;
  });
}

function createSimplePdf(lines: readonly string[]): string {
  const contentLines = ['BT', '/F1 12 Tf', '72 760 Td'];

  for (const [index, line] of lines.entries()) {
    contentLines.push(`${index === 0 ? '' : '0 -16 Td'} (${escapePdfText(line)}) Tj`);
  }

  contentLines.push('ET');

  const stream = contentLines.join('\n');
  const objects = [
    '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj',
    '2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj',
    '3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj',
    '4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj',
    `5 0 obj << /Length ${stream.length.toString()} >> stream\n${stream}\nendstream endobj`,
  ];
  let pdf = '%PDF-1.4\n';
  const offsets = [0];

  for (const object of objects) {
    offsets.push(pdf.length);
    pdf += `${object}\n`;
  }

  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${offsets.length.toString()}\n0000000000 65535 f \n`;
  pdf += offsets
    .slice(1)
    .map((offset) => `${offset.toString().padStart(10, '0')} 00000 n \n`)
    .join('');
  pdf += `trailer << /Size ${offsets.length.toString()} /Root 1 0 R >>\nstartxref\n${xrefOffset.toString()}\n%%EOF\n`;

  return pdf;
}

function escapePdfText(value: string): string {
  return value.replace(/[()\\]/gu, (character) => `\\${character}`);
}
