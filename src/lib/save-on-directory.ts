export async function openDirectory(mode: 'read' | 'readwrite' = 'readwrite', id?: string): Promise<FileSystemDirectoryHandle | null> {
  try {
    const dirHandle = await (id === undefined ? showDirectoryPicker({ mode }) : showDirectoryPicker({ id, mode }));
    return dirHandle;
  } catch (e) {
    console.error(e);
    return null;
  }
}

export type DirectoryFunc = (dir: FileSystemDirectoryHandle) => Promise<void>;
export async function withOpenDirectory(func: DirectoryFunc): Promise<void> {
  try {
    const dir = await openDirectory();
    if (dir !== null) {
      await func(dir);
    }
  } finally {
  }
}
