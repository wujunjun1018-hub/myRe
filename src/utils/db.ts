import { openDB, type IDBPDatabase } from 'idb';
import type { MaterialImage } from '../types';

const DB_NAME = 'material-image-search';
const DB_VERSION = 2;
const IMAGE_STORE = 'images';
const BLOB_STORE = 'blobs';

let dbInstance: IDBPDatabase | null = null;

async function getDB(): Promise<IDBPDatabase> {
  if (dbInstance) return dbInstance;
  dbInstance = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion, _newVersion, transaction) {
      if (oldVersion < 1) {
        const store = db.createObjectStore(IMAGE_STORE, { keyPath: 'id' });
        store.createIndex('createdAt', 'createdAt');
        db.createObjectStore(BLOB_STORE);
      }
      if (oldVersion < 2) {
        // Remove category index from v1
        const store = transaction.objectStore(IMAGE_STORE);
        if (store.indexNames.contains('category')) {
          store.deleteIndex('category');
        }
      }
    },
  });
  return dbInstance;
}

export async function saveImage(image: MaterialImage, blob: Blob): Promise<void> {
  const db = await getDB();
  const tx = db.transaction([IMAGE_STORE, BLOB_STORE], 'readwrite');
  await tx.objectStore(IMAGE_STORE).put(image);
  await tx.objectStore(BLOB_STORE).put(blob, image.blobKey);
  await tx.done;
}

export async function getAllImages(): Promise<MaterialImage[]> {
  const db = await getDB();
  const images = await db.getAll(IMAGE_STORE);
  return images.sort((a: MaterialImage, b: MaterialImage) => b.createdAt - a.createdAt);
}

export async function getImageBlob(blobKey: string): Promise<Blob | undefined> {
  const db = await getDB();
  return db.get(BLOB_STORE, blobKey);
}

export async function deleteImage(id: string, blobKey: string): Promise<void> {
  const db = await getDB();
  const tx = db.transaction([IMAGE_STORE, BLOB_STORE], 'readwrite');
  await tx.objectStore(IMAGE_STORE).delete(id);
  await tx.objectStore(BLOB_STORE).delete(blobKey);
  await tx.done;
}

export async function getImageCount(): Promise<number> {
  const db = await getDB();
  return db.count(IMAGE_STORE);
}

export async function clearAll(): Promise<void> {
  const db = await getDB();
  const tx = db.transaction([IMAGE_STORE, BLOB_STORE], 'readwrite');
  await tx.objectStore(IMAGE_STORE).clear();
  await tx.objectStore(BLOB_STORE).clear();
  await tx.done;
}
