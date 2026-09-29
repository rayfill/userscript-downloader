import { hookXMLHttpRequest, addHook, type HookHandlerType, removeHook, toJson, type LoadArgsType } from './lib/hooks.js';
import { startCollector, getPostInfo, getPostId, postInfoPattern } from './fanbox/collector.js';
import { drawInfoArea, type HandlerType } from './lib/ui.js';
import { postInfoType, postArticleBodyType, fileMapType, imageMapType, postImageBodyType, postFileBodyType } from './fanbox/types.js';
import { htmlWrapper } from './lib/html-wapper.js';
import { openDirectory } from './lib/save-on-directory.js';
import { AsyncQueue } from './lib/async-queue.js';
import { z } from 'zod';
import { download } from './lib/download.js';
import type { XHRResult } from './lib/xhr.js';
import { createZipData, type ZipCallbackType } from './lib/zip.js';

function parse(postInfo: z.infer<typeof postInfoType>) {
  const { creatorId, updatedDatetime, title, coverImageUrl, type } = postInfo.body.post;
  const updated = new Date(updatedDatetime);
  const typedContent = postInfo.body.post.body;
  return {
    creatorId,
    updated,
    title,
    coverImageUrl,
    type,
    body: typedContent,
  } as const;
}

export type FileValueType = z.infer<typeof fileMapType>[string] & { data: XHRResult; } ;
async function loadFileMap(fileMap: z.infer<typeof fileMapType>) {
  const keys = Object.keys(fileMap) as Array<keyof z.infer<typeof fileMapType>>;
  const fileMaps = await Promise.all(keys.map(async (key) => {
    const file = fileMap[key]!;
    return {
      ...file,
      data: await download(file.url),
    } as const;
  }));

  return fileMaps.reduce((state, fileMap) => {
    return {
      ...state,
      [fileMap.id]: fileMap
    } as const;
  }, {} as Record<string, FileValueType>);
}

export type ImageValueType = z.infer<typeof imageMapType>[string] & { data: XHRResult; thumbData: XHRResult; };
async function loadImageMap(imageMap: z.infer<typeof imageMapType>) {
  const keys = Object.keys(imageMap) as Array<keyof z.infer<typeof imageMapType>>;
  const imageMaps = await Promise.all(keys.map(async (key) => {
    const image = imageMap[key]!;
    return {
      ...image,
      data: await download(image.originalUrl),
      thumbData: await download(image.thumbnailUrl),
    } as const;
  }));

    return imageMaps.reduce((state, imageMap) => {
    return {
      ...state,
      [imageMap.id]: imageMap
    } as const;
  }, {} as Record<string, ImageValueType>);
}

type RecordValue<T> = T extends Record<any, infer U> ? U : never;

function createFilePath(file: FileValueType): string {
  return `files/${file.id}.${file.extension}`;
}

function createImagePath(image: ImageValueType): string {
  return `images/${image.id}.${image.extension}`;
}

function createThumbImagePath(image: ImageValueType): string {
  return `thumbs/${image.id}.${image.extension}`;
}

async function constructFile(fileBody: z.infer<typeof postFileBodyType>) {
  const text = fileBody.text;
  const resolvedFileMap = (await Promise.all(fileBody.files.map(async (file): Promise<FileValueType> => {
    const data = await download(file.url);
    return {
      ...file,
      size: data.data.size,
      data: data,
    } as const;
  }))).reduce((state, file) => {
    return {
      ...state,
      [file.id]: file,
    };
  }, {} as Record<string, FileValueType>);

  return {
    text,
    fileMap: resolvedFileMap
  } as const;
}

async function constructImage(imageBody: z.infer<typeof postImageBodyType>) {
  const text = imageBody.text;

    const resolvedImageMap = (await Promise.all(imageBody.images.map(async (image): Promise<ImageValueType> => {
      const data = await download(image.originalUrl);
      const thumbData = await download(image.thumbnailUrl);
      return {
        ...image,
        data: data,
        thumbData: thumbData
      } as const;
    }))).reduce((state, image) => {
      return {
        ...state,
        [image.id]: image,
      };
    }, {} as Record<string, ImageValueType>);

  return {
    text,
    imageMap: resolvedImageMap
  } as const;
}

async function constructArticle(articleBody: z.infer<typeof postArticleBodyType>) {
  const { blocks, embedMap: _, fileMap, imageMap, urlEmbedMap } = articleBody;
  const [resolvedFileMap, resolvedImageMap] = await Promise.all([loadFileMap(fileMap), loadImageMap(imageMap)]);
  const elements = blocks.map((block): HTMLElement => {
    switch (block.type) {
      case 'p':
        const paragraph = document.createElement('p');
        paragraph.innerText = block.text;
        return paragraph;
      case 'header':
        const header = document.createElement('header');
        header.innerText = block.text;
        return header;

      case 'file':
        const file = resolvedFileMap[block.fileId];
        if (file === undefined) {
          throw new Error('fileId entry not defined');
        }
        const fileAnchor = document.createElement('a');
        const fileLink = createFilePath(file);
        fileAnchor.href = fileLink;
        fileAnchor.innerText = file.name;
        return fileAnchor;

      case 'image':
        const image = resolvedImageMap[block.imageId];
        if (image === undefined) {
          throw new Error('imageId entry not defined');
        }
        const imageAnchor = document.createElement('a');
        const img = document.createElement('img');
        imageAnchor.appendChild(img);
        const imageLink = createImagePath(image);
        const thumbLink = createThumbImagePath(image);
        img.src = thumbLink;
        imageAnchor.href = imageLink;
        return imageAnchor;

      case 'url_embed':
        const urlEmbed = urlEmbedMap[block.urlEmbedId];
        if (urlEmbed === undefined) {
          throw new Error('urlEmbedId entry not defined');
        }
        const urlEmbedAnchor = document.createElement('a');
        const div = document.createElement('div');

        urlEmbedAnchor.appendChild(div);
        if (urlEmbed.html !== undefined) {
          div.innerHTML = urlEmbed.html;
          return urlEmbedAnchor;
        }
        if (urlEmbed.url !== undefined) {
          urlEmbedAnchor.href = urlEmbed.url;
          div.innerText = urlEmbed.host!;
        }
        return urlEmbedAnchor;

      case 'embed':
        throw new Error('embed type not supported');
    }
  });
  const root = document.createElement('div');
  elements.forEach((child) => root.appendChild(child));
  const html = htmlWrapper(root);

  return {
    html,
    fileMap: resolvedFileMap,
    imageMap: resolvedImageMap,
  } as const;
}

type ZipArgsType = Awaited<ReturnType<typeof constructArticle> | ReturnType<typeof constructFile> | ReturnType<typeof constructImage>>;
async function toZip(data: ZipArgsType) {

  const generator: ZipCallbackType = async (zip) => {
    if ('html' in data) {
      const htmlData = data.html;
      
      zip.add
    } else {}
  }

  for await (const chunk of createZipData(generator)) {}
}

async function handle() {
  const postId = getPostId(window.location.href);
  if (postId === null) {
    throw new Error('postId not found');
  }

  const postInfo = getPostInfo(postId);
  const parsed = parse(postInfo);

  const f = async () => {
    switch (parsed.type) {
      case 'article': {
        const article = parsed.body;
        return constructArticle(await postArticleBodyType.parseAsync(article));
      }
      case 'file': {
        const file = parsed.body;
        return constructFile(await postFileBodyType.parseAsync(file));
      }
      case 'image': {
        const image = parsed.body;
        return constructImage(await postImageBodyType.parseAsync(image));
      }
    }
  };
  const data = await f();

}

async function main() {
  const isLocal = GM_info.script.name.endsWith('(local)');

  try {
    hookXMLHttpRequest();
    startCollector();
    window.addEventListener('DOMContentLoaded', () => {
      const downloadFunc = () => {
        handle().then(() => {
          console.log('handle processed');
        }).catch((e) => {
          console.error(e);
        });
      };
      let directorySaveToggle = false;
      const queue = new AsyncQueue<[postId: string, data: unknown]>();
      const dirHook: HookHandlerType = {
        async load(type, data, url, _contentType) {
          const matches = postInfoPattern.exec(url);
          if (type !== 'document' && matches !== null) {
            const postId = matches.groups!.postId!;
            const jsonData = await toJson([type, data] as unknown as LoadArgsType);
            queue.push([postId, jsonData]);
          }
        }
      }
      const queueSaveFunc = async (dir: FileSystemDirectoryHandle, as: AbortSignal) => {
        let [postId, data]: [string, unknown] = ['', ''];
        while ([postId, data] = await queue.take(as)) {
          console.log(`save ${postId} data`);
          const fileHandle = await dir.getFileHandle(`post.info.${postId}.json`, { create: true });
          const writeStream = await fileHandle.createWritable({
            keepExistingData: false
          });
          await writeStream.write(JSON.stringify(data));
          await writeStream.close();
        }
      }
      let abortController = new AbortController();
      const directoryOpenFunc = async () => {
        try {
          if (!directorySaveToggle) {
            const handle = await openDirectory();
            if (handle === null) {
              alert('directory handle is null');
              return;
            }
            addHook(dirHook);
            queueSaveFunc(handle, abortController.signal);
            directorySaveToggle = true;
          } else {
            removeHook(dirHook);
            abortController.abort();
            abortController = new AbortController();
            directorySaveToggle = false;
          }
        } catch (e) {
          console.error(e);
        }
      };
      const args: Array<[(() => string) | string, HandlerType]> = [
        ['download', downloadFunc],
      ];
      if (isLocal) {
        args.push(['save post.info', directoryOpenFunc]);
      }
      drawInfoArea(...args);
    });
  } catch (e) {
    console.error(e);
  }
}

main();
