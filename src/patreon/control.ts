export function findCloseButton() {
  return document.querySelector('button[data-tag="close"]') as HTMLButtonElement | null;
};

export async function findLightboxImage() {
  const img = document.querySelector('img[data-tag="lightboxImage"]') as HTMLImageElement | null;
  if (img === null) {
    return null;
  }
  for (; ;) {
    await new Promise<void>((resolve) => {
      if (img.complete) {
        resolve();
        return;
      }
      setTimeout(() => resolve(), 100);
    });
    if (img.complete) {
      break;
    }
  }
  return img;
}
