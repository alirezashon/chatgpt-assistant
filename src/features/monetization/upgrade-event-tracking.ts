import { STORAGE_KEYS } from '@/constants/storage';
import type { PremiumFeatureId } from '@/features/entitlements';
import type { StorageDriver } from '@/storage';

export type UpgradeEventName =
  | 'billing-portal-opened'
  | 'premium-diagnostics-exported'
  | 'upgrade-clicked'
  | 'upgrade-prompt-viewed';

export interface UpgradeEvent {
  readonly createdAt: string;
  readonly featureId?: PremiumFeatureId;
  readonly id: string;
  readonly metadata: Readonly<Record<string, string | number | boolean>>;
  readonly name: UpgradeEventName;
  readonly surface: 'action-menu' | 'options';
}

export interface UpgradeEventInput {
  readonly featureId?: PremiumFeatureId;
  readonly metadata?: Readonly<Record<string, string | number | boolean>>;
  readonly name: UpgradeEventName;
  readonly surface: UpgradeEvent['surface'];
}

const MAX_UPGRADE_EVENTS = 100;

export async function appendUpgradeEvent(
  storage: StorageDriver,
  input: UpgradeEventInput,
  now: () => Date = () => new Date(),
  idFactory: () => string = createUpgradeEventId,
): Promise<readonly UpgradeEvent[]> {
  const event: UpgradeEvent = {
    createdAt: now().toISOString(),
    id: idFactory(),
    metadata: input.metadata ?? {},
    name: input.name,
    surface: input.surface,
    ...(input.featureId === undefined ? {} : { featureId: input.featureId }),
  };
  const events = [event, ...(await readUpgradeEvents(storage))].slice(0, MAX_UPGRADE_EVENTS);

  await storage.set(STORAGE_KEYS.upgradeEvents, events);

  return events;
}

export async function readUpgradeEvents(storage: StorageDriver): Promise<readonly UpgradeEvent[]> {
  const value = await storage.get(STORAGE_KEYS.upgradeEvents);

  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(isUpgradeEvent).slice(0, MAX_UPGRADE_EVENTS);
}

function createUpgradeEventId(): string {
  return `upgrade-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function isUpgradeEvent(value: unknown): value is UpgradeEvent {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }

  const candidate = value as Readonly<Record<string, unknown>>;

  return (
    typeof candidate['createdAt'] === 'string' &&
    typeof candidate['id'] === 'string' &&
    typeof candidate['metadata'] === 'object' &&
    typeof candidate['name'] === 'string' &&
    (candidate['surface'] === 'action-menu' || candidate['surface'] === 'options')
  );
}
