export interface ActionConfig {
  readonly historyLimit: number;
  readonly longPressMs: number;
}

export const DEFAULT_ACTION_CONFIG: ActionConfig = {
  historyLimit: 50,
  longPressMs: 500,
};
