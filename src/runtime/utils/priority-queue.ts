/** Item stored in a priority queue. Lower priority numbers run first. */
export interface PriorityQueueItem<Value> {
  /** Stable insertion order used for deterministic ties. */
  readonly sequence: number;
  /** Numeric priority where lower values are processed first. */
  readonly priority: number;
  /** Stored value. */
  readonly value: Value;
}

/** Deterministic binary heap priority queue. */
export class PriorityQueue<Value> {
  private readonly heap: PriorityQueueItem<Value>[] = [];
  private nextSequence = 0;

  /** Number of queued items. */
  public get size(): number {
    return this.heap.length;
  }

  /** Adds a value to the queue. */
  public enqueue(value: Value, priority = 0): void {
    const item: PriorityQueueItem<Value> = {
      priority,
      sequence: this.nextSequence,
      value,
    };

    this.nextSequence += 1;
    this.heap.push(item);
    this.bubbleUp(this.heap.length - 1);
  }

  /** Removes and returns the next value, or undefined when empty. */
  public dequeue(): Value | undefined {
    const first = this.heap[0];

    if (first === undefined) {
      return undefined;
    }

    const last = this.heap.pop();

    if (last !== undefined && this.heap.length > 0) {
      this.heap[0] = last;
      this.bubbleDown(0);
    }

    return first.value;
  }

  private bubbleUp(index: number): void {
    let current = index;

    while (current > 0) {
      const parent = Math.floor((current - 1) / 2);

      if (!this.lessThan(current, parent)) {
        return;
      }

      this.swap(current, parent);
      current = parent;
    }
  }

  private bubbleDown(index: number): void {
    let current = index;

    for (;;) {
      const left = current * 2 + 1;
      const right = left + 1;
      let smallest = current;

      if (left < this.heap.length && this.lessThan(left, smallest)) {
        smallest = left;
      }

      if (right < this.heap.length && this.lessThan(right, smallest)) {
        smallest = right;
      }

      if (smallest === current) {
        return;
      }

      this.swap(current, smallest);
      current = smallest;
    }
  }

  private lessThan(leftIndex: number, rightIndex: number): boolean {
    const left = this.heap[leftIndex];
    const right = this.heap[rightIndex];

    if (left === undefined || right === undefined) {
      return false;
    }

    return (
      left.priority < right.priority ||
      (left.priority === right.priority && left.sequence < right.sequence)
    );
  }

  private swap(left: number, right: number): void {
    const leftValue = this.heap[left];
    const rightValue = this.heap[right];

    if (leftValue === undefined || rightValue === undefined) {
      return;
    }

    this.heap[left] = rightValue;
    this.heap[right] = leftValue;
  }
}
