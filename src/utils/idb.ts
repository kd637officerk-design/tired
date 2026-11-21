import { Track, WallpaperAutoMeta, WallpaperThumb } from '../types/player';

const DB_NAME = 'bzplayer';
const DB_VERSION = 2;

let dbPromise: Promise<IDBDatabase | null> | null = null;

export function openDB(): Promise<IDBDatabase | null> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve) => {
    try {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const d = req.result;
        ['tracks', 'walls', 'wthumbs'].forEach((name) => {
          if (!d.objectStoreNames.contains(name)) {
            d.createObjectStore(name, { keyPath: 'id' });
          }
        });
        if (!d.objectStoreNames.contains('meta')) {
          d.createObjectStore('meta');
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
  return dbPromise;
}

export async function idbTx<T = unknown>(
  storeName: string,
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T> | void
): Promise<T | undefined> {
  const db = await openDB();
  if (!db) return undefined;
  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction(storeName, mode);
      const store = tx.objectStore(storeName);
      const req = fn(store);
      tx.oncomplete = () => resolve(req ? req.result : undefined);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    } catch (e) {
      reject(e);
    }
  });
}

export async function getAllTracks(): Promise<Track[]> {
  try {
    return (await idbTx<Track[]>('tracks', 'readonly', (s) => s.getAll())) || [];
  } catch {
    return [];
  }
}

export async function putTrack(track: Track): Promise<void> {
  try {
    await idbTx('tracks', 'readwrite', (s) => s.put(track));
  } catch {
    // ignore storage quota errors silently here
  }
}

export async function deleteTrackRecord(id: number): Promise<void> {
  try {
    await idbTx('tracks', 'readwrite', (s) => s.delete(id));
  } catch {
    // ignore
  }
}

export async function getMeta<T = unknown>(key: string): Promise<T | undefined> {
  try {
    return await idbTx<T>('meta', 'readonly', (s) => s.get(key));
  } catch {
    return undefined;
  }
}

export async function putMeta(key: string, value: unknown): Promise<void> {
  try {
    if (value === null || value === undefined) {
      await idbTx('meta', 'readwrite', (s) => s.delete(key));
    } else {
      await idbTx('meta', 'readwrite', (s) => s.put(value, key));
    }
  } catch {
    // ignore
  }
}

export async function getAllWallpaperThumbs(): Promise<WallpaperThumb[]> {
  try {
    const res = (await idbTx<WallpaperThumb[]>('wthumbs', 'readonly', (s) => s.getAll())) || [];
    return res.sort((a, b) => b.added - a.added);
  } catch {
    return [];
  }
}

export async function getWallpaperBlob(id: string): Promise<Blob | null> {
  try {
    const rec = await idbTx<{ id: string; blob: Blob }>('walls', 'readonly', (s) => s.get(id));
    return rec?.blob || null;
  } catch {
    return null;
  }
}

export async function saveWallpaperRecord(
  id: string,
  blob: Blob,
  thumbMeta: WallpaperThumb
): Promise<void> {
  const db = await openDB();
  if (!db) throw new Error('IndexedDB unavailable');
  return new Promise((resolve, reject) => {
    const t = db.transaction(['walls', 'wthumbs'], 'readwrite');
    t.objectStore('walls').put({ id, blob });
    t.objectStore('wthumbs').put(thumbMeta);
    t.oncomplete = () => resolve();
    t.onerror = () => reject(t.error || new Error('Failed to save wallpaper'));
  });
}

export async function deleteWallpapers(ids: string[]): Promise<void> {
  if (!ids.length) return;
  for (let i = 0; i < ids.length; i += 200) {
    const part = ids.slice(i, i + 200);
    await idbTx('walls', 'readwrite', (s) => {
      part.forEach((x) => s.delete(x));
    }).catch(() => {});
    await idbTx('wthumbs', 'readwrite', (s) => {
      part.forEach((x) => s.delete(x));
    }).catch(() => {});
  }
}

export async function getWallpaperAutoMeta(): Promise<WallpaperAutoMeta | undefined> {
  return getMeta<WallpaperAutoMeta>('wallpaperAuto');
}

export async function putWallpaperAutoMeta(meta: WallpaperAutoMeta): Promise<void> {
  return putMeta('wallpaperAuto', meta);
}
