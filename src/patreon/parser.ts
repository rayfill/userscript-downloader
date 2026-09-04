import { elementClone } from '../lib/element-clone.js';

export function parser(window: Window) {

  const articles = Array.from(window.document.querySelectorAll('div[data-tag="post-card"]'));
  if (articles.length !== 1) {
    throw new Error('article does not once');
  }

  const article = articles[0]!;
  // title
  const titles = Array.from(article.querySelectorAll('h1 > div[data-is-key-element]')).filter((elm) => elm.checkVisibility());
  if (titles.length !== 1) {
    throw new Error('title element not found: div[data-tag="post-card"] h1 > div[data-is-key-element]');
  }

  // creator id
  const iconUrlPattern = /^https:\/\/[^.]+\.patreonusercontent\.com\/[0-9]+\/patreon-media\/p\/campaign\/([0-9]+)\/.*$/;
  const ids = Array.from(window.document.head.querySelectorAll('link[href*="patreon-media/p/campaign/"]')).map((link) => {
    const href = (link as HTMLLinkElement).href;
    return href.replace(iconUrlPattern, "$1");
  });
  if (ids.length === 0) {
    throw new Error('invalid icon urls');
  }
  const creatorId = ids[0];

  // post id
  const postIdPattern = /^\/.*\/posts\/.*?([0-9]+)$/;
  const currentUrl = new URL(window.location.href);
  const postId = currentUrl.pathname.replace(postIdPattern, "$1");

  // post date
  const meta = window.document.head.querySelector('meta[property="og:image"]');
  if (meta === null || !('content' in meta && typeof meta.content === 'string')) {
    throw new Error('meta[property="og:image"] element not found');
  }
  const contentUrl = new URL(meta.content);
  const postTimeString = contentUrl.searchParams.get('v');
  const postTime = new Date(Number(postTimeString));

  // header images
  const imgs = Array.from(article.querySelectorAll('img[data-tag="gallery-image"]')) as Array<HTMLImageElement>;

  // content text
  const contents = Array.from(article.querySelectorAll('div.patreon-post-content'));
  if (contents.length !== 1) {
    throw new Error('content element not found: div[data-tag="post-card"] div.patreon-post-control');
  }
  const content = contents[0];
  if (!(content instanceof HTMLElement)) {
    throw new Error('content is not HTMLElement');
  }
  const styledContent = elementClone(content);

  // attachment files
  const attachments = Array.from(article.querySelectorAll('a[href^="https://www.patreon.com/file?"][data-tag="post-attachment-link"]')) as Array<HTMLAnchorElement>;

  return {
    creatorId: creatorId,
    postId: postId,
    postTime: postTime,
    title: titles[0]!.textContent,
    contents: styledContent,
    imgs: imgs,
    attachments: attachments.map((attachment) => {
      return {
        link: attachment.href,
        filename: attachment.textContent,
      } as const;
    })
  } as const;
}
