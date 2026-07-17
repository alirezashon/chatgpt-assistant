/** Tracks favorite and pinned commands. */
export class CommandFavoriteManager {
  private readonly favorites = new Set<string>();

  public constructor(commandIds: readonly string[] = []) {
    for (const commandId of commandIds) {
      this.favorites.add(commandId);
    }
  }

  /** Adds a command to favorites. */
  public add(commandId: string): void {
    this.favorites.add(commandId);
  }

  /** Removes a command from favorites. */
  public remove(commandId: string): void {
    this.favorites.delete(commandId);
  }

  /** Returns true when command is favorite. */
  public has(commandId: string): boolean {
    return this.favorites.has(commandId);
  }

  /** Toggles favorite state. */
  public toggle(commandId: string): boolean {
    if (this.favorites.has(commandId)) {
      this.favorites.delete(commandId);
      return false;
    }

    this.favorites.add(commandId);
    return true;
  }

  /** Returns all favorite ids. */
  public all(): readonly string[] {
    return [...this.favorites.values()];
  }

  /** Replaces all favorites. */
  public replace(commandIds: readonly string[]): void {
    this.favorites.clear();

    for (const commandId of commandIds) {
      this.favorites.add(commandId);
    }
  }
}

/** Returns valid favorite command ids from persisted data. */
export function parseCommandFavorites(value: unknown): readonly string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((entry): entry is string => typeof entry === 'string');
}
