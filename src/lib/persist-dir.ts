import { openDB, type DBSchema, type StoreNames, type IDBPDatabase } from 'idb';

export interface DBIdentifier {
  dbname: string;
  storeName: StoreNames<Schemas>;
};
interface Schemas extends DBSchema {
  directoryPersist: {
    key: string;
    value: {
      path: string;
      handle: FileSystemDirectoryHandle;
    };
  }
}
type UpgradeCallback = (db: IDBPDatabase<Schemas>, identifier: DBIdentifier, oldVersion: number, newVersion: number | null) => void;

const upgradeCallback: UpgradeCallback = (db, identifier, oldVer, newVer): void => {
  if (oldVer === 0) {
    if (!db.objectStoreNames.contains(identifier.storeName)) {
      db.createObjectStore(identifier.storeName, { keyPath: 'path' });
    }
  }
}
async function loadIndexedDB(identifier: DBIdentifier, upgradeCallback?: UpgradeCallback) {
  return await openDB<Schemas>(identifier.dbname, 1, {
    upgrade(db, oldVersion, newVersion) {
      if (upgradeCallback !== undefined) {
        upgradeCallback(db, identifier, oldVersion, newVersion);
      }
    }
  });
}

export async function saveHandle(identifier: DBIdentifier, dirHandle: FileSystemDirectoryHandle): Promise<void> {
  const db = await loadIndexedDB(identifier, upgradeCallback);

  try {
    if (!db.objectStoreNames.contains(identifier.storeName)) {
      throw new Error('object store not found');
    }
    const tx = db.transaction([identifier.storeName], 'readwrite');
    const store = tx.objectStore(identifier.storeName);
    try {
      await store.put({ 'path': dirHandle.name, handle: dirHandle });
      tx.commit();
    } catch (e) {
      tx.abort();
      throw e;
    }
  } finally {
    db.close();
  }
}

export async function loadHandle(identifier: DBIdentifier, path: string): Promise<FileSystemDirectoryHandle | null> {
  const db = await loadIndexedDB(identifier, upgradeCallback);
  try {
    if (!db.objectStoreNames.contains(identifier.storeName)) {
      return null;
    }
    const tx = db.transaction([identifier.storeName], 'readonly');
    const store = tx.objectStore(identifier.storeName);
    const data = await store.get(path);
    tx.commit();
    await tx.done;
    return data?.handle ?? null;
  } finally {
    db.close();
  }
}
