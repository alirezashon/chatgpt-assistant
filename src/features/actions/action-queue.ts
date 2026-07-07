export class ActionQueue {
  private active = false;
  private readonly tasks: (() => Promise<void>)[] = [];

  public enqueue(task: () => Promise<void>): void {
    this.tasks.push(task);
    void this.flush();
  }

  public async flush(): Promise<void> {
    if (this.active) {
      return;
    }

    this.active = true;

    try {
      while (this.tasks.length > 0) {
        const task = this.tasks.shift();

        if (task !== undefined) {
          await task();
        }
      }
    } finally {
      this.active = false;
    }
  }
}
