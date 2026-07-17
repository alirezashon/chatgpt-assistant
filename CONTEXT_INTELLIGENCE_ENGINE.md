# Context Intelligence Engine

The Context Intelligence Engine is the brain of the extension. It determines what the user is
doing, where they are doing it, what content is relevant, which actions are available, and how much
confidence the system has before any AI command is run.

The engine should make the product feel context-aware instead of prompt-driven.

The user should not be asked, “What do you want to do?” when the page already contains enough signal
to suggest the right next actions.

## 1. Context Types

The engine must support a broad and extensible context taxonomy. A page can contain multiple
contexts at once, and the current active context may be more specific than the overall page.

### Text Contexts

`plain_text`

- Generic selected or visible text.
- Used when no richer structure is detected.
- Actions: explain, summarize, rewrite, translate, extract tasks.

`markdown`

- Markdown content in editors, READMEs, comments, docs, and issues.
- Signals: headings, fenced code blocks, lists, tables, links.
- Actions: improve, summarize, convert format, extract outline.

`documentation`

- Technical or product documentation.
- Signals: docs hostnames, nav/sidebar, headings, API references, code examples.
- Actions: explain, summarize, extract steps, compare versions, generate examples.

`article`

- Long-form article, blog post, essay, news story.
- Signals: article element, Open Graph article metadata, reading-time structure, headings.
- Actions: TL;DR, key points, critique, extract claims, create notes.

`chat`

- Chat messages or conversation thread.
- Signals: repeated message bubbles, avatars, timestamps, chat app host, conversation layout.
- Actions: summarize, extract decisions, draft reply, find open questions.

`tweet`

- Short social post on X/Twitter or embedded tweet.
- Signals: tweet containers, character-limited post structure, social metadata.
- Actions: summarize thread, rewrite, draft reply, extract sentiment.

`linkedin_post`

- Professional social post, comment, or message.
- Signals: LinkedIn host, post composer, feed update, profile/company context.
- Actions: improve, shorten, make professional, draft comment, summarize profile.

`reddit_post`

- Reddit post or comment thread.
- Signals: subreddit, post body, nested comments, voting metadata.
- Actions: summarize discussion, extract consensus, draft reply, identify objections.

### Communication Contexts

`email`

- Email thread, inbox row, composer, or selected email text.
- Signals: message headers, recipients, subject, quoted thread, compose editor.
- Actions: reply, summarize, improve, translate, extract action items.

`message`

- Direct message or team chat message.
- Signals: conversation participants, chat composer, timestamped messages.
- Actions: draft reply, summarize thread, make concise, extract tasks.

### Developer Contexts

`code`

- Source code in a block, editor, diff, file viewer, StackOverflow answer, docs sample.
- Signals: syntax highlighting, monospace blocks, language class names, code fences.
- Actions: explain, refactor, optimize, debug, find bugs, generate tests.

`json`

- JSON document, payload, API response, config, log snippet.
- Signals: braces, quoted keys, arrays, MIME hints, code language markers.
- Actions: format, explain schema, validate, convert, extract fields.

`yaml`

- YAML config or data.
- Signals: indentation, key-value pairs, document markers, known config filenames.
- Actions: explain, validate, convert to JSON, find config issues.

`sql`

- SQL query or database error.
- Signals: SQL keywords, query formatting, database UI, code language markers.
- Actions: explain, optimize, debug, rewrite, identify indexes.

`logs`

- Application, server, browser, deployment, or CI logs.
- Signals: timestamps, severity levels, stack frames, repeated entries.
- Actions: summarize, find root cause, extract errors, group by type.

`stack_trace`

- Exception stack trace.
- Signals: error class, stack frames, file paths, line numbers, “at” frames.
- Actions: explain error, find likely cause, propose fix, create issue.

`terminal`

- Terminal session, shell command, CLI output, or terminal-like web UI.
- Signals: prompts, monospace output, command prefixes, ANSI-like text.
- Actions: explain command, debug output, suggest next command.

`console`

- Browser console, devtools-like logs, JavaScript errors.
- Signals: console formatting, error levels, stack traces, object previews.
- Actions: explain, debug, trace cause.

`terminal_output`

- Captured output from build, test, deployment, or shell execution.
- Signals: exit codes, test failures, compiler errors, paths.
- Actions: summarize failure, identify next fix, extract failing tests.

`error_message`

- Short error message without full stack trace.
- Signals: error keywords, status codes, exception names.
- Actions: explain, troubleshoot, search docs, suggest fix.

### Product And Work Contexts

`issue`

- Jira, Linear, GitHub issue, Asana task, or similar work item.
- Signals: title, description, status, assignee, priority, comments.
- Actions: summarize, estimate, refine acceptance criteria, create subtasks.

`pull_request`

- GitHub/GitLab/Bitbucket PR or merge request.
- Signals: diff, changed files, review state, checks, comments.
- Actions: review, summarize changes, find risks, draft review.

`commit`

- Commit details, commit list item, or selected commit message.
- Signals: hash, author, files changed, commit message.
- Actions: summarize, explain change, generate release note.

`spreadsheet`

- Table, Google Sheets, Excel web, Airtable, CSV preview.
- Signals: grid, rows/columns, formulas, sheet controls, tab names.
- Actions: analyze, summarize, find anomalies, generate formulas.

`presentation`

- Slides, speaker notes, deck editor, exported presentation.
- Signals: slide canvas, thumbnails, speaker notes.
- Actions: summarize, improve slide copy, generate speaker notes.

### Media Contexts

`image`

- Image on page, selected image, screenshot-like content.
- Signals: image element, alt text, dimensions, surrounding captions.
- Actions: describe, extract text, analyze, generate alt text.

`video`

- Video page or embedded video.
- Signals: video element, YouTube/Vimeo, transcript, captions, duration.
- Actions: summarize, chapters, timeline, quiz, extract decisions.

`audio`

- Audio player, podcast, voice note, transcript-backed audio.
- Signals: audio element, podcast metadata, captions/transcript if available.
- Actions: summarize, transcript actions, extract highlights.

`pdf`

- PDF viewer or embedded PDF.
- Signals: PDF MIME, browser PDF viewer, text layer, page count.
- Actions: summarize, explain section, extract citations, ask questions.

### Input Contexts

`editable_field`

- Textarea, input, contenteditable, editor block, rich text editor.
- Signals: focused editable element.
- Actions: improve writing, continue, change tone, translate, insert draft.

`search_box`

- Search input on Google, docs, marketplaces, internal tools, site search.
- Signals: search role, placeholder, form action, focused input.
- Actions: improve query, broaden/narrow, generate advanced search.

`comment_editor`

- Comment box on GitHub, docs, social apps, issue trackers.
- Signals: editable field plus surrounding comment/thread context.
- Actions: draft comment, improve tone, summarize before replying.

## 2. Detection Pipeline

Detection should be multi-stage, cheap-first, and progressively deeper only when needed.

### Stage 0: Runtime Preconditions

Before detection:

- Check whether the extension is enabled for the site.
- Check privacy mode.
- Check incognito and sensitive-site policy.
- Check whether the page is accessible to content scripts.

If detection is restricted, return a safe minimal context.

### Stage 1: URL And Platform Signals

Inputs:

- URL.
- hostname.
- pathname.
- query parameters.
- known platform patterns.
- file extension.

Purpose:

- Fast platform classification.
- Adapter candidate selection.
- Avoid expensive DOM work.

Examples:

- `github.com/.../pull/...` suggests `pull_request`.
- `mail.google.com` suggests `email`.
- `.pdf` suggests `pdf`.
- `youtube.com/watch` suggests `video`.

### Stage 2: Document Metadata

Inputs:

- title.
- meta tags.
- Open Graph.
- Twitter cards.
- canonical URL.
- Schema.org structured data.
- document MIME/content type.

Purpose:

- Detect article, video, product, documentation, social, or PDF context.
- Improve confidence with structured metadata.

### Stage 3: Active Element And Focus

Inputs:

- focused element.
- input type.
- ARIA role.
- contenteditable.
- editor framework hints.
- placeholder.
- nearby labels.

Purpose:

- Detect whether the user is writing.
- Distinguish reading context from editing context.
- Prioritize editable actions.

### Stage 4: Selection Analysis

Inputs:

- selected text.
- selection range.
- surrounding DOM.
- selected element type.
- selected code block or table.

Purpose:

- Selection is often the strongest signal of intent.
- A selected code block on an article page should produce code actions.
- Selected text inside an email composer should produce rewrite actions.

### Stage 5: DOM Structure Analysis

Inputs:

- landmarks.
- article tags.
- headings.
- nav structure.
- tables.
- code blocks.
- forms.
- repeated message/thread structures.
- editor containers.

Purpose:

- Detect generic contexts when no site adapter exists.
- Identify nested contexts.

### Stage 6: ARIA And Accessibility Semantics

Inputs:

- roles.
- labels.
- grids.
- menus.
- textboxes.
- search boxes.
- tables.

Purpose:

- Detect web app structure more reliably than CSS classes.
- Improve spreadsheet, search, editor, and list detection.

### Stage 7: Structured Data And Embedded Objects

Inputs:

- JSON-LD.
- microdata.
- embedded transcript.
- media metadata.
- PDF text layer.
- table schemas.

Purpose:

- Extract rich context without scraping brittle UI.

### Stage 8: Content Heuristics

Inputs:

- text density.
- language patterns.
- code syntax.
- stack trace patterns.
- log timestamps.
- email headers.
- issue labels.
- PR diff markers.

Purpose:

- Classify content type when platform signals are absent.

### Stage 9: Language And Format Detection

Inputs:

- selected text.
- code fences.
- syntax highlighting classes.
- MIME types.
- file names.
- content patterns.

Purpose:

- Identify natural language, programming language, JSON, YAML, SQL, logs, stack traces.

### Stage 10: Adapter Deep Detection

Inputs:

- candidate site adapters from previous stages.
- adapter-specific DOM/API extraction.

Purpose:

- Confirm high-confidence site-specific contexts.
- Extract metadata such as PR files changed, email subject, video transcript, issue status.

This stage should be lazy-loaded and only deep-run after the cheap stages indicate a likely match.

### Stage 11: Context Composition

The engine composes:

- page context.
- active/focus context.
- selection context.
- platform context.
- nested contexts.
- recommended actions.
- confidence scores.

The result is a ranked list of context candidates plus one active context.

## 3. Context Score

Every detected context receives a confidence score from 0 to 100.

### Score Inputs

`platform_score`

- URL and hostname match.
- Known route pattern.
- Adapter match.

`structure_score`

- DOM structure matches expected pattern.
- ARIA roles match.
- Required containers exist.

`content_score`

- Text/content heuristics match.
- Syntax or format patterns match.
- Metadata confirms type.

`interaction_score`

- User selection.
- Focused element.
- Recent keyboard/mouse event.
- Context menu invocation target.

`adapter_score`

- Site adapter confirms context.
- Adapter extracts required metadata.

`negative_score`

- Conflicting signals.
- Sensitive/restricted site.
- Missing required structures.
- Weak or generic text.

### Confidence Bands

`95-100`

- Very high confidence.
- Safe to show highly specific recommended actions.
- Example: Gmail composer focused, GitHub PR route with diff detected.

`80-94`

- High confidence.
- Show specific actions with generic fallback.
- Example: article detected by structure and metadata.

`60-79`

- Medium confidence.
- Show broader actions.
- Avoid destructive or highly specific assumptions.

`40-59`

- Low confidence.
- Use generic actions only.
- Prefer command palette over proactive toolbar suggestions.

`0-39`

- Insufficient confidence.
- Return generic page/input context.

### Example Scores

GitHub PR:

- URL route match: strong.
- Diff DOM exists: strong.
- PR metadata exists: strong.
- Confidence: 95-99.

Article:

- Article tag: medium.
- Meta article tags: strong.
- Text density: strong.
- Confidence: 80-90.

Email:

- Gmail host: strong.
- Compose/thread DOM: strong.
- Focused editable message body: strong.
- Confidence: 95-99.

Selected Code:

- Selection inside code block: strong.
- Syntax class present: strong.
- Code heuristics pass: strong.
- Confidence: 90-98.

## 4. Multi-Context Handling

A page often contains multiple valid contexts. The engine should preserve all candidates while
choosing one active context.

Example:

```txt
Page: GitHub PR
Nested: Markdown description
Nested: Code diff
Selection: Selected code line
Focus: Comment editor
```

### Priority Model

Priority is based on user intent proximity.

Highest priority:

1. Explicit invocation target.
2. Text selection.
3. Focused editable element.
4. Context menu target.
5. Active viewport object.
6. Site-specific page context.
7. Generic page context.

### Selection Overrides Page

If selected text is code inside an article, active context should be `code`, while parent context is
`article`.

### Focus Overrides Reading

If an email thread is open but the composer is focused, active context should be
`editable_field/email_composer`, while parent context is `email_thread`.

### Site Context Remains Available

Even when selection/focus wins, parent context remains available for commands that need it.

Example:

- Active: selected code.
- Parent: GitHub PR.
- Recommended action: explain selected code.
- Secondary action: review PR.

### Context Stack

The engine should expose a context stack:

```txt
root: platform/page
section: article/email/pr/issue
object: code block/table/video/comment
interaction: selection/focus/context-menu target
```

Commands declare which stack level they require.

## 5. Website Adapters

Adapters provide platform-specific detection and extraction.

### Adapter Responsibilities

Each adapter may provide:

- platform detection.
- route matching.
- DOM detection.
- context extraction.
- nested context extraction.
- recommended actions.
- apply/insert behavior.
- permission requirements.
- privacy restrictions.

### Adapter Registration

Adapters register metadata:

- `id`
- `platform`
- `version`
- `hostPatterns`
- `routePatterns`
- `priority`
- `capabilities`
- `detectors`
- `extractors`
- `actions`
- `privacyPolicy`

Registration is declarative and side-effect free.

### Adapter Loading

Adapter loading should be lazy:

1. URL/host selects candidate adapters.
2. Candidate adapter lightweight detector runs.
3. Deep adapter code loads only when likely relevant.

### First-Party Adapter Examples

`github`

- PRs, issues, commits, code, diffs, comments, markdown.

`jira`

- tickets, descriptions, comments, status, estimates.

`linear`

- issues, projects, comments, cycles.

`notion`

- docs, pages, blocks, databases, editable content.

`gmail`

- inbox, email thread, composer, selected message.

`google_docs`

- document editing, selection, comments, headings.

`google_sheets`

- spreadsheet grid, selected range, formulas.

`youtube`

- video, transcript, comments, chapters.

`twitter_x`

- posts, threads, composer, DMs where allowed.

`linkedin`

- posts, profile, messages, composer.

`reddit`

- posts, comments, threads.

`medium`

- article, highlights, comments.

`devto`

- article, code blocks, comments.

`stackoverflow`

- questions, answers, code blocks, errors.

`chatgpt`

- conversation, selected assistant/user message, composer.

`claude`

- conversation, artifacts, composer.

`gemini`

- conversation, generated answer, composer.

`pdf_viewer`

- browser PDF viewer, embedded PDFs, text layer.

### Adapter Safety

Adapters must:

- isolate brittle selectors.
- fail gracefully.
- never leak platform-specific internals into generic context APIs.
- expose normalized context objects.
- declare sensitive surfaces.

## 6. Context API

The Context API should expose a universal normalized object.

### Context Object

Fields:

- `id`
- `type`
- `subType`
- `confidence`
- `source`
- `platform`
- `url`
- `title`
- `language`
- `contentLanguage`
- `programmingLanguage`
- `selection`
- `editable`
- `media`
- `document`
- `code`
- `table`
- `issue`
- `pullRequest`
- `email`
- `chat`
- `metadata`
- `permissions`
- `privacy`
- `actions`
- `parents`
- `children`
- `capturedAt`
- `expiresAt`

### Selection

Fields:

- `text`
- `html`
- `rangeKind`
- `characterCount`
- `wordCount`
- `isPartial`
- `containerType`
- `surroundingText`

### Editable

Fields:

- `isEditable`
- `fieldType`
- `placeholder`
- `currentText`
- `selectedText`
- `supportsInsertion`
- `supportsReplacement`
- `editorKind`

### Platform

Fields:

- `id`
- `name`
- `adapterId`
- `routeKind`
- `workspaceOrOrg`
- `resourceId`

### Permissions

Fields:

- `canReadSelection`
- `canReadVisibleText`
- `canReadFullPage`
- `canWriteToPage`
- `requiresHostPermission`
- `requiresUserConfirmation`

### Privacy

Fields:

- `sensitivity`
- `redactionRequired`
- `externalProcessingAllowed`
- `storageAllowed`
- `reason`

### Actions

Actions are recommended command references, not implementation details.

Fields:

- `commandId`
- `label`
- `rank`
- `reason`
- `requiredContextLevel`
- `requiresConfirmation`

## 7. Recommended Actions

Recommended actions are generated from context, confidence, user history, feature availability, and
permissions.

### Recommendation Inputs

- active context type.
- context stack.
- confidence.
- selected text.
- focused element.
- platform adapter.
- user command history.
- enabled features.
- granted permissions.
- privacy mode.
- provider availability.

### Recommendation Rules

Specific beats generic.

- Selected code should recommend code actions before generic text actions.
- Email composer should recommend reply/improve before summarize page.

High confidence enables specific actions.

- GitHub PR at 97% can recommend “Review PR.”
- Generic page at 55% should recommend “Summarize page” and “Ask about page.”

User intent proximity wins.

- Focused editor suggests writing actions.
- Selection suggests transform/explain actions.
- Page reading suggests summarize/extract actions.

Risk affects ranking.

- Non-destructive actions rank higher.
- Destructive/apply actions require confirmation and lower default rank.

### Action Examples

`code`

- Explain.
- Refactor.
- Debug.
- Optimize.
- Find bugs.
- Generate tests.
- Add comments.
- Convert language.

`email`

- Reply.
- Summarize.
- Improve.
- Translate.
- Make shorter.
- Extract action items.

`pull_request`

- Review PR.
- Summarize changes.
- Identify risks.
- Draft review comment.
- Explain failing checks.

`issue`

- Summarize.
- Estimate.
- Clarify acceptance criteria.
- Create subtasks.
- Draft response.

`video`

- Summarize.
- Generate timeline.
- Create chapters.
- Extract key moments.
- Make quiz.

`pdf`

- Summarize.
- Explain selected section.
- Extract citations.
- Find definitions.
- Create notes.

`spreadsheet`

- Analyze selected range.
- Explain formula.
- Find anomalies.
- Summarize table.
- Generate formula.

`editable_field`

- Improve writing.
- Continue.
- Change tone.
- Fix grammar.
- Translate.
- Insert draft.

## 8. Performance

Detection must feel instant and must not degrade page performance.

### Detection Frequency

Run cheap detection:

- on page load.
- on history/navigation changes.
- on tab activation.
- on focus change.
- on selection change.
- on context menu target.
- after meaningful DOM changes.

Run deep detection:

- on explicit user action.
- when opening command palette.
- when opening sidebar.
- when high-confidence adapter requires deeper metadata.
- during idle time if privacy policy allows.

### Debouncing And Throttling

Selection:

- debounce briefly until selection stabilizes.
- avoid recomputing on every mouse movement.

MutationObserver:

- throttle.
- scope to relevant containers.
- avoid full-document rescans.

Focus:

- handle immediately but extract lightly.

Navigation:

- run immediately after route changes, then refine after idle.

### Caching

Cache:

- platform match.
- route kind.
- stable metadata.
- article extraction.
- code block inventory.
- adapter detection result.

Invalidate on:

- URL change.
- history state change.
- major DOM replacement.
- focused editor change.
- selection change for active context.
- adapter-defined invalidation.

### Observers

`MutationObserver`

- Detect SPA changes, editors, dynamic comments, video transcript availability.
- Scope narrowly after adapter identifies containers.

`IntersectionObserver`

- Track visible blocks.
- Prioritize viewport context.
- Avoid extracting hidden/offscreen content.

`ResizeObserver`

- Use sparingly for surface positioning, not context intelligence unless layout affects target
  detection.

Idle callbacks:

- Run non-urgent extraction.
- Precompute command availability.
- Warm adapter context.

### Performance Budgets

Cheap detection should target single-digit milliseconds.

Deep extraction should be cancellable and deferred.

Content scripts should not:

- serialize the whole DOM by default.
- run expensive regex over entire documents repeatedly.
- observe every subtree without filters.
- block input, scrolling, or selection.

## 9. Privacy

The Context Engine must treat page content as sensitive by default.

### Sensitivity Levels

`public`

- Public articles, docs, open-source pages.

`personal`

- Email, social DMs, personal docs.

`confidential`

- Work apps, internal dashboards, private repositories, customer data.

`restricted`

- Banking, healthcare, password managers, legal portals, government services, auth pages.

### Sensitive Content Handling

Passwords:

- Never read password fields.
- Never include nearby secret fields.
- Disable proactive context on password manager pages.

Banking:

- Minimal context only.
- No full-page extraction.
- No external AI by default.

Healthcare:

- Minimal context.
- Require explicit user action and consent for extraction.

Private Documents:

- Respect per-site settings.
- Preview what context will be sent before AI processing when sensitivity is high.

Incognito:

- Disabled by default unless user explicitly enables extension in incognito.
- No persistent history unless user opts in.

Enterprise Apps:

- Detect internal hostnames and admin dashboards.
- Prefer manual mode.
- Avoid background/deep extraction.

### Privacy Rules

- No automatic external AI calls.
- No raw page storage unless user saves or history setting allows it.
- No full-page extraction without explicit action.
- Redact secrets before context leaves content script.
- Context objects should carry privacy policy metadata.
- Recommended actions should be filtered by privacy state.

### Secret Detection

The engine should identify and redact:

- API keys.
- access tokens.
- private keys.
- passwords.
- credit card numbers.
- SSNs and similar identifiers.
- auth cookies or headers.
- environment variable secrets.

## 10. Future AI Vision

The architecture must support richer context without redesign.

### OCR

Future OCR should be a detector and extractor.

Use cases:

- screenshots.
- image text.
- scanned PDFs.
- video frames.

It should produce normalized text/image contexts with confidence and privacy metadata.

### Voice

Voice context should support:

- dictated commands.
- meeting audio.
- video/audio transcripts.
- voice notes.

Voice should enter as `audio` or `transcript` context and use the same action recommendation
system.

### Screen Understanding

Screen understanding should be modeled as a context source, not a separate architecture.

It can provide:

- visible UI elements.
- screenshot regions.
- spatial relationships.
- element labels.

It must obey the same privacy and permission rules.

### Image Context

Image understanding should produce:

- image description.
- OCR text.
- detected objects.
- UI screenshot structure.
- chart/table extraction.

It should attach to the same context stack as page/image selection.

### Automation

Automation should consume Context API outputs.

Examples:

- Click target suggested by context.
- Fill editable field.
- Navigate workflow.
- Extract data from repeated rows.

Automation must require high confidence, permissions, and user-visible control.

### Workflows

Workflows should be context-aware command graphs.

Example:

```txt
detect GitHub PR -> extract diff -> review risk -> draft comments -> present in sidebar
```

The Context Engine supplies the stable context objects; the Workflow Engine coordinates execution.

### Agents

Agents should use the Context Engine as their perception layer.

Rules:

- Agents cannot scrape arbitrary page content outside approved context levels.
- Agents must request deeper context through the Context Service.
- Agents must respect confidence, privacy, and permissions.

### Browser Control

Browser control should be grounded in context:

- Current tab.
- active element.
- visible elements.
- site adapter.
- user-confirmed target.

The engine should expose enough normalized structure that automation does not depend on brittle
visual guesses alone.

## Engine North Star

The Context Intelligence Engine should make the extension feel like it understands the web without
being invasive.

It should be:

- instant by default.
- extensible by adapter.
- conservative with privacy.
- honest about confidence.
- able to handle multiple contexts.
- useful before the user writes a prompt.

The best outcome is that the extension rarely asks what the user wants because the right command is
already visible.
