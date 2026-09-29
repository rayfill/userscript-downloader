

const originalXMLHttpRequest = unsafeWindow.XMLHttpRequest;
//const originalFetch = fetch;

interface ResponseTypeMap {
  text: string;
  arraybuffer: ArrayBuffer;
  blob: Blob;
  document: Document;
  json: object;
};
export type LoadArgsType = ['text', ResponseTypeMap['text'], url: string, contentType: string | null] |
['arraybuffer', ResponseTypeMap['arraybuffer'], url: string, contentType: string | null] |
['blob', ResponseTypeMap['blob'], url: string, cnotentType: string | null] |
['document', ResponseTypeMap['document'], url: string, contentType: string | null] |
['json', ResponseTypeMap['json'], url: string, contentType: string | null];

type ProgressHandlerType = (url: string, chunkSize: number, total?: number, complete?: boolean) => void;


export interface HookHandlerType {
  progress?: ProgressHandlerType;
  error?: (url: string, error: Error) => void;
  load?: (...args: LoadArgsType) => void;
};

let hooks: Array<HookHandlerType> = [];
export function removeHook(hook: HookHandlerType) {
  hooks = hooks.filter((registeredHook) => {
    return registeredHook !== hook;
  });
}
export function addHook(hook: HookHandlerType) {
  removeHook(hook);
  hooks.push(hook);
}

export async function toJson(args: LoadArgsType): Promise<unknown> {
  const [type, data] = args;
  switch (type) {
    case 'arraybuffer':
      return JSON.parse(Buffer.from(data as ArrayBuffer).toString());
    case 'blob':
      return JSON.parse(await (data as Blob).text());
    case 'text':
      return JSON.parse(data as string);
    case 'json':
      return data as unknown;
    default:
      throw new Error('invalid response type');
  }
};


// export function HookFetch() {
//   if (fetch === _originalFetch) {
//     return;
//   }

//   fetch = new Proxy(fetch, {
//     construct(target, args,
//   });
// }

export function hookXMLHttpRequest() {
  if (unsafeWindow.XMLHttpRequest !== originalXMLHttpRequest) {
    console.warn('already hooked');
    return;
  }

  unsafeWindow.XMLHttpRequest = new Proxy(XMLHttpRequest, {
    construct(self, args, newTarget) {
      const xhr = Reflect.construct(self, args, newTarget) as XMLHttpRequest;

      xhr.addEventListener('error', () => {
        hooks.forEach((hook) => {
          if (hook.error !== undefined) {
            hook.error(xhr.responseURL, new Error());
          }
        });
      });
      let current = 0;
      xhr.addEventListener('progress', (ev) => {
        const chunkCurrent = ev.loaded - current;
        if (ev.lengthComputable) {
          const total = ev.total;
          const sum = ev.loaded;
          hooks.forEach((hook) => {
            if (hook.progress !== undefined) {
              hook.progress(xhr.responseURL, chunkCurrent, total, sum === total);
            }
          });
        } else {
          hooks.forEach((hook) => {
            if (hook.progress !== undefined) {
              hook.progress(xhr.responseURL, chunkCurrent);
            }
          });
        }
      });

      xhr.addEventListener('load', (_event) => {
        const type: keyof ResponseTypeMap = xhr.responseType === '' ? 'text' : xhr.responseType;
        const data = xhr.response;
        const url = xhr.responseURL;
        const contentType = xhr.getResponseHeader('content-type');

        hooks.forEach((hook) => {
          if (hook.load !== undefined) {
            hook.load(type, data, url, contentType);
          }
        });
      });

      const originalSend = xhr.send;
      xhr.send = (...init) => {
        return originalSend.apply(xhr, init);
      };
      return xhr;
    }
  });
}
