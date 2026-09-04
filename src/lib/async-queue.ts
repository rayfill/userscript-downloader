
type WakerFunc = () => void;
export class AsyncQueue<T> {
  private queue: Array<T> = [];
  private wakers: Array<WakerFunc> = [];

  public constructor() {}

  public async push(value: T): Promise<void> {
    this.queue.push(value);
    this.wakers.forEach((waker) => waker());
  }

  public async take(): Promise<T> {
    while (this.queue.length === 0) {
      await new Promise<void>((resolve) => this.wakers.push(resolve));
    }

    return this.queue.shift()!;
  }
}
