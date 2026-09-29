import { parse } from 'content-disposition';

export type XHRResult = {
  data: Blob;
  filename?: string;
};

function parseHeaders(headerString: string): Record<string, string> {
  const headers = headerString.split('\n');
  return headers.reduce((state, header) => {
    const separatorPos = header.search(':');
    if (separatorPos < 0) {
      throw new Error(`Bad header: ${header}`);
    }

    const key = header.substring(0, separatorPos);
    const value = header.substring(separatorPos + 1);
    return {
      ...state,
      [key.toLowerCase()]: value.trim(),
    };
  }, {} as Record<string, string>);
}

type FetchProgressHandlerType<T extends object | undefined> = (ctx: T | undefined, chunkSize: number, currentSize: number, totalSize: number, done: boolean) => void;

type GetOptions<T extends object | undefined> = {
  context?: T | undefined;
  anonymous?: boolean;
  nocache?: boolean;
  timeout?: number;
  progressHandler?: FetchProgressHandlerType<T>;
};
export function get<T extends object>(url: string, {
  context = undefined,
  anonymous = false,
  nocache = false,
  timeout = 5 * 60 * 1000,
  progressHandler
}: GetOptions<T>) {

  return new Promise<XHRResult>((resolve, reject) => {
    let previous = 0;
    GM_xmlhttpRequest({
      url,
      anonymous: anonymous,
      redirect: 'follow',
      binary: true,
      nocache: nocache,
      timeout: timeout,
      context: context,
      responseType: 'blob',
      onerror: (response) => {
        reject(response.error);
      },
      onprogress: (response) => {
        if (response.lengthComputable && progressHandler !== undefined) {
          progressHandler(response.context,
            response.loaded - previous,
            response.loaded,
            response.total,
            response.loaded === response.total);
          previous = response.loaded;
        }
      },
      onload: (response) => {
        try {
          const data = response.response as Blob;
          const headers = parseHeaders(response.responseHeaders);
          if ('content-disposition' in headers) {
            const disposition = parse(headers['content-disposition']);
            const params = disposition.parameters;
            if (!('filename' in params)) {
              throw new Error(`bad content disposition: ${headers['content-disposition']}`);
            }

            const filename = params.filename;
            const result: XHRResult = {
              data: data,
              filename: filename
            };
            resolve(result);
            return;
          }

          const result: XHRResult = {
            data: data,
          } satisfies XHRResult;
          resolve(result);
          return;
        } catch (e) {
          debugger;
          console.error(e);
          reject(e);
        }
      }
    });
  });
}
