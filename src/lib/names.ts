export function toSafename(original: string): string {
  return original.replaceAll(/[\/\\:*?"<>|]/g, '_');
}

export function zeroPadding(source: string, len: number) {
  return `${'0'.repeat(len)}${source}`.slice(-len);
}
