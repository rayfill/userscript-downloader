
abstract class Lockable {
  constructor() {}
  public abstract acquire(): Promise<void>;
  public abstract release(): void;
  public async with<T = void>(func: () => T | Promise<T>): Promise<T> {
    try {
      await this.acquire();
      return await func();
    } finally {
      this.release();
    }
  }
};


type WakerFunc = () => void;
export class Semaphore extends Lockable {
  private wakers: Array<WakerFunc> = [];
  private current: number = 0;

  constructor(private permit: number = 1) {
    super();
  }

  public async acquire(): Promise<void> {
    if (this.current < this.permit) {
      ++this.current;
      return;
    }

    await new Promise<void>((resolve) => {
      this.wakers.push(resolve);
    });

    return this.acquire();
  }

  public release() {
    --this.current;
    this.wakers.forEach((waker) => waker());
    this.wakers.length = 0;
  }
}
