/** Tracks favorite and pinned commands. */
export class CommandFavoriteManager {
  private readonly favorites = new Set<string>();

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
}
