import { normalizeError } from '@/lib/errors';
import {
  sendRuntimeMessage as sendChromeRuntimeMessage,
  sendTabMessage as sendChromeTabMessage,
} from '@/lib/chrome/chrome-api';
import {
  createRuntimeMessage,
  isRuntimeMessage,
  type AnyRuntimeMessage,
  type ExtensionSurface,
  type RuntimeMessage,
  type RuntimeMessagePayloads,
  type RuntimeMessageResponse,
  type RuntimeMessageType,
} from '@/lib/messaging/messages';

type RuntimeMessageHandler = (
  message: AnyRuntimeMessage,
  sender: chrome.runtime.MessageSender,
) => Promise<RuntimeMessageResponse | undefined> | RuntimeMessageResponse | undefined;

export function createMessage<Type extends RuntimeMessageType>(
  source: ExtensionSurface,
  type: Type,
  payload: RuntimeMessagePayloads[Type],
  target?: ExtensionSurface,
): RuntimeMessage<Type> {
  return createRuntimeMessage({
    payload,
    source,
    type,
    ...(target === undefined ? {} : { target }),
  });
}

export async function requestRuntime<
  Response = unknown,
  Type extends RuntimeMessageType = RuntimeMessageType,
>(
  source: ExtensionSurface,
  type: Type,
  payload: RuntimeMessagePayloads[Type],
  target?: ExtensionSurface,
): Promise<RuntimeMessageResponse<Response>> {
  return sendChromeRuntimeMessage<RuntimeMessageResponse<Response>>(
    createMessage(source, type, payload, target),
  );
}

export async function requestTab<
  Response = unknown,
  Type extends RuntimeMessageType = RuntimeMessageType,
>(
  tabId: number,
  source: ExtensionSurface,
  type: Type,
  payload: RuntimeMessagePayloads[Type],
  target?: ExtensionSurface,
): Promise<RuntimeMessageResponse<Response>> {
  return sendChromeTabMessage<RuntimeMessageResponse<Response>>(
    tabId,
    createMessage(source, type, payload, target),
  );
}

export function installRuntimeMessageHandler(handler: RuntimeMessageHandler): () => void {
  const listener = (
    message: unknown,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response: RuntimeMessageResponse) => void,
  ): true | undefined => {
    if (!isRuntimeMessage(message)) {
      return undefined;
    }

    void Promise.resolve(handler(message, sender))
      .then((response) => {
        sendResponse(response ?? { ok: true, data: undefined });
      })
      .catch((error: unknown) => {
        const normalized = normalizeError(error);

        sendResponse({
          error: normalized.message,
          ok: false,
        });
      });

    return true;
  };

  chrome.runtime.onMessage.addListener(listener);

  return () => {
    chrome.runtime.onMessage.removeListener(listener);
  };
}
