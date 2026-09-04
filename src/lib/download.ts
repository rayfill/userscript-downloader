import { Semaphore } from './sync.js';
import { get } from './xhr.js';

const semaphore = new Semaphore(6);
export async function download(url: string) {
  return await semaphore.with(async () => {
    const file = await get(url, {
      context: { url: url, },
      progressHandler: (ctx, chunkSize, currentSize, totalSize, done) => {
        console.log(`${ctx?.url}: chunk:${chunkSize}, current:${currentSize} total:${totalSize}, done:${done}`);
      }
    });
    return file;
  });
}
