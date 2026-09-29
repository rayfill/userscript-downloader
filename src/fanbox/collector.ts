import { addHook, removeHook, type HookHandlerType } from '../lib/hooks.js';
import { postInfoType } from './types.js';
import { z } from 'zod';

const fanboxUrlPattern = /^https:\/\/www\.fanbox\.cc\/[^/]+\/posts\/(?<postId>[0-9]+)$/;
export function getPostId(url: string) {
  const matches = fanboxUrlPattern.exec(url);
  if (matches === null) {
    return null;
  }
  return matches.groups!.postId!;
}

export const postInfoPattern = /^https:\/\/api\.fanbox\.cc\/post\.info\?postId=(?<postId>[0-9]+)$/;

type ResponseType = 'text' | 'json' | 'arraybuffer' | 'blob';
type ResponseDataTypeMap = {
  text: string;
  json: unknown;
  arraybuffer: ArrayBuffer;
  blob: Blob;
};

const postInfoMap = new Map<string, z.infer<typeof postInfoType>>();
export function getPostInfo(postId: string): z.infer<typeof postInfoType> {
  const maybePostInfo = postInfoMap.get(postId);
  if (maybePostInfo === undefined) {
    throw new Error();
  }
  return maybePostInfo;
}

async function postInfoHandler<T extends ResponseType>(type: T, data: ResponseDataTypeMap[T], url: string, contentType: string) {
  const matches = postInfoPattern.exec(url);
  if (matches === null || !contentType.includes('application/json')) {
    return;
  }

  const postId = matches.groups!.postId!;
  try {
    const jsonData = await (async (): Promise<unknown> => {
      switch (type) {
        case 'arraybuffer':
          return JSON.parse(Buffer.from(data as ArrayBuffer).toString());
        case 'blob':
          return JSON.parse(await (data as Blob).text());
        case 'text':
          return JSON.parse(data as string);
        case 'json':
          return data as unknown;
      }
    })();

    const parsed = await postInfoType.safeParseAsync(jsonData);
    if (parsed.success) {
      postInfoMap.set(postId, parsed.data);
      console.log(JSON.stringify(parsed.data, null, 2));
    } else {
      debugger;
      console.error('parse error');
      console.error(parsed.error.message);
    }
  } catch (e) {
    debugger;
    console.error(e);
  }
}

const hook: HookHandlerType = {
  load(type, data, url, contentType) {
    if (type !== 'document' && contentType !== null) {
      postInfoHandler(type, data, url, contentType).catch((e) => {
        debugger;
        console.error(e);
      });
    }
  }
};

export function startCollector() {
  addHook(hook);
}

export function stopCollector() {
  removeHook(hook);
}
