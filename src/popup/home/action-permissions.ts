import { containsPermissions, getTab, requestPermissions } from '@/lib/chrome/chrome-api';

export interface ActionPermissionResult {
  readonly granted: boolean;
  readonly reason?: string;
}

/** Ensures the active page origin is available before starting an action. */
export async function ensureActionPermissions(
  tabId: number | undefined,
): Promise<ActionPermissionResult> {
  if (tabId === undefined) {
    return {
      granted: false,
      reason: 'No active browser tab was available for this action.',
    };
  }

  const tab = await getTab(tabId);
  const url = tab?.url;

  if (url === undefined || (!url.startsWith('http://') && !url.startsWith('https://'))) {
    return {
      granted: false,
      reason: 'This action only works on normal http or https pages.',
    };
  }

  const origin = `${new URL(url).origin}/*`;
  const permissions = { origins: [origin] };

  if (await containsPermissions(permissions)) {
    return { granted: true };
  }

  const granted = await requestPermissions(permissions);

  return granted
    ? { granted: true }
    : {
        granted: false,
        reason: `Permission for ${origin} was not granted.`,
      };
}
