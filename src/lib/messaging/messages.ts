import type { PageContextSnapshot } from '@/features/context/context-types';
import type {
  CommandId,
  CommandInvocation,
  CommandResult,
} from '@/features/commands/command-types';

export type ExtensionSurface = 'background' | 'content' | 'options' | 'popup' | 'sidebar';

export interface RuntimeMessagePayloads {
  readonly 'command.openPalette': {
    readonly query?: string;
  };
  readonly 'command.run': CommandInvocation;
  readonly 'command.result': CommandResult;
  readonly 'context.changed': PageContextSnapshot;
  readonly 'context.getActive': undefined;
  readonly 'runtime.openOptions': undefined;
  readonly 'runtime.openSidebar': undefined;
  readonly 'runtime.ping': {
    readonly requestId?: string;
  };
  readonly 'selection.changed': {
    readonly context: PageContextSnapshot;
    readonly selectedText: string;
  };
  readonly 'shortcut.triggered': {
    readonly commandId: CommandId;
  };
}

export type RuntimeMessageType = keyof RuntimeMessagePayloads;

export interface RuntimeMessage<Type extends RuntimeMessageType = RuntimeMessageType> {
  readonly createdAt: string;
  readonly id: string;
  readonly payload: RuntimeMessagePayloads[Type];
  readonly source: ExtensionSurface;
  readonly target?: ExtensionSurface;
  readonly type: Type;
}

export type AnyRuntimeMessage = {
  readonly [Type in RuntimeMessageType]: RuntimeMessage<Type>;
}[RuntimeMessageType];

export type RuntimeMessageResponse<Data = unknown> =
  | {
      readonly data: Data;
      readonly ok: true;
    }
  | {
      readonly error: string;
      readonly ok: false;
    };

export function createRuntimeMessage<Type extends RuntimeMessageType>(
  input: Omit<RuntimeMessage<Type>, 'createdAt' | 'id'> & {
    readonly id?: string;
  },
): RuntimeMessage<Type> {
  return {
    ...input,
    createdAt: new Date().toISOString(),
    id: input.id ?? crypto.randomUUID(),
  };
}

export function isRuntimeMessage(value: unknown): value is AnyRuntimeMessage {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }

  const candidate = value as Readonly<Record<string, unknown>>;

  return (
    typeof candidate['createdAt'] === 'string' &&
    typeof candidate['id'] === 'string' &&
    typeof candidate['source'] === 'string' &&
    typeof candidate['type'] === 'string' &&
    'payload' in candidate
  );
}
