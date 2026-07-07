import { ActionEngine } from '@/features/actions/action-engine';

let defaultActionEngine: ActionEngine | null = null;

export function getActionEngine(): ActionEngine {
  defaultActionEngine ??= new ActionEngine();

  return defaultActionEngine;
}
