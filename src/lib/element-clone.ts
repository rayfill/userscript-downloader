
function clearAllProperties(style: CSSStyleDeclaration) {
    new Array(style.length).fill(undefined).map((_, index) => {
    return style.item(index);
  }).forEach((styleKey) => {
    style.removeProperty(styleKey);
  });
}
function copyStyles(src: HTMLElement, dest: HTMLElement) {
  const destStyle = dest.style;
  clearAllProperties(destStyle);
  const srcStyle = window.getComputedStyle(src);

  for (let offset = 0; offset < srcStyle.length; ++offset) {
    const propKey = srcStyle.item(offset);
    destStyle.setProperty(propKey, srcStyle.getPropertyValue(propKey));
  }
}

function assert(expression: boolean) {
  if (!expression) {
    debugger;
    throw new Error('expression is false');
  }
}

type TraverseCallbackType = (src: HTMLElement, dest: HTMLElement) => void;
function traverse(src: HTMLElement, dest: HTMLElement, callback: TraverseCallbackType) {

  const srcChildren = Array.from(src.children);
  const destChildren = Array.from(dest.children);

  assert(srcChildren.length === destChildren.length);
  for (let offset = 0; offset < srcChildren.length; ++offset) {
    const srcChild = srcChildren[offset];
    const destChild = destChildren[offset];
    if (srcChild instanceof HTMLElement && destChild instanceof HTMLElement) {
      traverse(srcChild, destChild, callback);
      callback(srcChild, destChild);
    }
  }

  callback(src, dest);
}

export function elementClone(src: HTMLElement): HTMLElement {
  const dest = src.cloneNode(true) as HTMLElement;
  traverse(src, dest, (src, dest) => {
    copyStyles(src, dest);
  });

  return dest;
}
