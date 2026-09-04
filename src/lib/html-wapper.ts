

export function htmlWrapper(element: HTMLElement): string {

  const contentSource = `<html><head><meta charset="utf-8"></head><body>${element.outerHTML}</body></html>`;
  return contentSource;
}
