import { parser } from './patreon/parser.js';
import { findCloseButton, findLightboxImage } from './patreon/control.js';
import { createZipData } from './lib/zip.js';
import { download } from './lib/download.js';
import { htmlWrapper } from './lib/html-wapper.js';
import { toSafename, zeroPadding } from './lib/names.js';
import { ZipDeflate, ZipPassThrough, type Zip } from 'fflate/browser';
import { saveAs } from 'file-saver';
import { Buffer } from 'buffer';

async function getImageUrls(imgs: Array<HTMLImageElement>) {
  if (imgs.length === 0) {
    return [] as Array<string>;
  }
  const urls: Array<string> = [];
  const delta = 100;
  for (const img of imgs) {
    img.click();
    // 10秒間、100ms刻み
    for (let consumes = 0; consumes < 10 * 1000; consumes += delta) {
      const lightbox = await findLightboxImage();
      if (lightbox === null) {
        await new Promise<void>((resolve) => {
          setTimeout(() => resolve(), delta);
        });
        continue;
      }

      urls.push(lightbox.src);
      break;
    }
  }

  const closeButton = await (async () => {
    for (let count = 0; count < 10; ++count) {
      const closeButton = findCloseButton();
      if (closeButton === null) {
        await new Promise<void>((resolve) => {
          setTimeout(() => resolve(), delta);
        });
        continue;
      }
      return closeButton;
    }
    return null;
  })();
  if (closeButton === null) {
    throw new Error('close button not found.');
  }
  closeButton.click();

  if (urls.length < imgs.length) {
    throw new Error('dropped of image url');
  }

  return urls;
}

async function handle() {
  try {
    const parsed = parser(window);

    console.log('imgs', parsed.imgs);
    const images = await getImageUrls(parsed.imgs);
    console.log('imageUrls', images);

    const imageFiles = await Promise.all(images.map(async (image) => {
      const file = await download(image);
      const imageUrl = new URL(image);
      const proxyFilename = imageUrl.pathname.split('/').slice(-1)[0];
      return {
        data: file.data,
        filename: file.filename ?? proxyFilename
      };
    }));
    const attachFiles = await Promise.all(parsed.attachments.map(async (attachment) => {
      const file = await download(attachment.link);
      return {
        data: file.data,
        filename: file.filename ?? attachment.filename
      } as const;
    }));

    const yyyymm = `${zeroPadding(`${parsed.postTime.getFullYear()}`, 4)}${zeroPadding(`${parsed.postTime.getMonth() + 1}`, 2)}`;
    function replaceSpaces(src: string): string {
      return src.replaceAll(' ', '_');
    }
    const archiveName = toSafename(`${yyyymm}_${parsed.postId}_${replaceSpaces(parsed.title)}.zip`);
    console.log(`archiveName: ${archiveName}`);

    const contents = {
      ...parsed,
      imageFiles,
      attachFiles,
    };
    const zipFactory = async (zip: Zip) => {
      const html = new ZipDeflate('index.html');
      zip.add(html);
      html.push(Buffer.from(htmlWrapper(contents.contents)), true);
      const attachmentAppends = Promise.all(contents.attachFiles.map(async (attach) => {
        const attachmentFile = new ZipPassThrough(`content/${attach.filename}`);
        zip.add(attachmentFile);
        for await (const buffer of attach.data.stream()) {
          attachmentFile.push(buffer, false);
        }
        attachmentFile.push(new Uint8Array(0), true);
      }));
      const imageAppends = Promise.all(contents.imageFiles.map(async (image) => {
        const imageFile = new ZipPassThrough(`media/${image.filename}`);
        zip.add(imageFile);
        for await (const buffer of image.data.stream()) {
          imageFile.push(buffer, false);
        }
        imageFile.push(new Uint8Array(0), true);
      }));

      await Promise.all([attachmentAppends, imageAppends]);
    };

    const zipChunks: Array<Blob> = [];
    for await (const chunk of createZipData(zipFactory)) {
      zipChunks.push(chunk);
    }

    console.log('zip file created');
    saveAs(new Blob(zipChunks, { type: 'application/json' }), archiveName);
    console.log('download start');
  } catch (e) {
    console.error(e);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  const button = document.createElement('button');
  button.onclick = handle;
  button.value = 'download';
  button.innerText = 'download';
  button.style.position = 'fixed';
  button.style.bottom = '20px';
  button.style.right = '20px';
  button.style.zIndex = '1000';
  window.document.body.appendChild(button);
  // hydrationによって上書きされてしまった場合の再マウント
  requestIdleCallback(() => {
    if (button.parentElement === null) {
      window.document.body.appendChild(button);
    }
  });
});
