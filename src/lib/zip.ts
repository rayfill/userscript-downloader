import { Zip, type FlateError } from 'fflate/browser';
import { AsyncQueue } from './async-queue.js';

type QueueContent = {
  type: 'data';
  content: Uint8Array<ArrayBuffer>;
} | {
  type: 'error';
  error: FlateError;
} | {
  type: 'eos';
};
type CallbackType = (zip: Zip) => void | Promise<void>;
export function createZipData(callback: CallbackType): AsyncIterable<Blob> {

  const queue = new AsyncQueue<QueueContent>();
  const zip = new Zip((err, data, final) => {
    if (err !== null) {
      queue.push({
        type: 'error',
        error: err
      });
    } else {
      queue.push({
        type: 'data',
        content: data
      });
    }

    if (final) {
      queue.push({
        type: 'eos'
      });
    }
  });

  const callbackWrapper = async () => {
    try {
      await callback(zip);
    } catch (e) {
      console.error(e);
    } finally {
      zip.end();
    };
  };
  setTimeout(() => callbackWrapper(), 0);

  const asyncIterator: AsyncIterator<Blob> = {
    async next(): Promise<IteratorResult<Blob>> {
      const container = await queue.take();
      switch (container.type) {
        case 'data': {
          return { done: false, value: new Blob([container.content]) };
        }
        case 'eos': {
          return { done: true, value: new Blob([]) };
        }
        case 'error': {
          throw container.error;
        }
      }
    }
  };

  return {
    [Symbol.asyncIterator]: () => asyncIterator
  };

}
