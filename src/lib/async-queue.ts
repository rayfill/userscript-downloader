
type WakerFunc = () => void;
export class AsyncQueue<T> {
  private queue: Array<T> = [];
  private wakers: Array<WakerFunc> = [];

  public constructor() {}

  public async push(value: T): Promise<void> {
    this.queue.push(value);
    this.wakers.forEach((waker) => waker());
  }

  public async take(as?: AbortSignal): Promise<T> {
    while (this.queue.length === 0) {
      await new Promise<void>((resolve) => {
        if (as !== undefined) {
          const resolveListenFunc = () => {
            as.removeEventListener('abort', resolveListenFunc);
            resolve();
          }
          as.addEventListener('abort', resolveListenFunc);
          this.wakers.push(resolveListenFunc);
        } else {
          this.wakers.push(resolve);
        }
      });
      if (as?.aborted ?? false) {
        throw as;
      }
    }

    return this.queue.shift()!;
  }
}
