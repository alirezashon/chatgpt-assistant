import { AppError } from '@/shared/errors';
import {
  createConversationSnapshot,
  getConversationService,
  type ConversationService,
} from '@/features/conversations/conversation-service';
import {
  ConversationObserver,
  type ConversationObserverDisconnect,
} from '@/features/conversations/conversation-observer';
import { conversationStore } from '@/features/conversations/conversation-store';

export interface ConversationDetectorOptions {
  readonly document?: Document;
  readonly now?: () => Date;
  readonly service?: ConversationService;
  readonly window?: Window;
}

export class ConversationDetector {
  private readonly document: Document;
  private readonly now: () => Date;
  private readonly service: ConversationService;
  private readonly window: Window;
  private disconnectObserver: ConversationObserverDisconnect | null = null;
  private isDetecting = false;

  public constructor(options: ConversationDetectorOptions = {}) {
    this.document = options.document ?? document;
    this.now = options.now ?? createCurrentDate;
    this.service = options.service ?? getConversationService();
    this.window = options.window ?? window;
  }

  public start(): void {
    if (this.disconnectObserver !== null) {
      return;
    }

    conversationStore.setState({
      error: null,
      status: 'observing',
    });

    const observer = new ConversationObserver({
      document: this.document,
      onChange: () => {
        this.detect();
      },
      window: this.window,
    });

    this.disconnectObserver = observer.start();
    this.detect();
  }

  public stop(): void {
    this.disconnectObserver?.();
    this.disconnectObserver = null;
  }

  public detect(): void {
    if (this.isDetecting) {
      return;
    }

    this.isDetecting = true;

    try {
      const snapshot = createConversationSnapshot({
        document: this.document,
        location: this.window.location,
        now: this.now,
      });
      this.service.applySnapshot(snapshot);
    } catch (cause) {
      conversationStore.setState({
        error: new AppError('CONVERSATION_DETECTION_ERROR', 'Conversation detection failed.', {
          cause,
        }),
        status: 'error',
      });
    } finally {
      this.isDetecting = false;
    }
  }
}

let defaultConversationDetector: ConversationDetector | null = null;

export function startConversationDetection(): void {
  defaultConversationDetector ??= new ConversationDetector();
  defaultConversationDetector.start();
}

function createCurrentDate(): Date {
  return new Date();
}
