import type { ContextPermissionStatus } from './context-types';

/** Reports active context permissions in user-facing terms. */
export class ContextPermissionManager {
  /** Returns permissions used for the current context snapshot. */
  public getActivePermissions(): readonly ContextPermissionStatus[] {
    return [
      {
        active: true,
        label: 'Read current tab URL and title',
        permission: 'activeTab',
      },
      {
        active: true,
        label: 'Read selected text and visible page structure',
        permission: 'contentScript',
      },
      {
        active: false,
        label: 'Send filtered context to AI',
        permission: 'aiContext',
      },
    ];
  }
}
