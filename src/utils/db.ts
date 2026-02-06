import { openDB, type IDBPDatabase } from 'idb';
import type { MaterialImage } from '../types';

const DB_NAME = 'material-image-search';
const DB_VERSION = 1;
const IMAGE_STORE = 'images';
const BLOB_STORE = 'blobs';

let dbInstance: IDBPDatabase | null = null;

async function getDB(): Promise<IDBPDatabase> {
  if (dbInstance) return dbInstance;
  dbInstance = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(IMAGE_STORE)) {
        const store = db.createObjectStore(IMAGE_STORE, { keyPath: 'id' });
        store.createIndex('category', 'category');
        store.createIndex('createdAt', 'createdAt');
      }
      if (!db.objectStoreNames.contains(BLOB_STORE)) {
        db.createObjectStore(BLOB_STORE);
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

export async function getImagesByCategory(category: string): Promise<MaterialImage[]> {
  if (category === '全部') return getAllImages();
  const db = await getDB();
  const images = await db.getAllFromIndex(IMAGE_STORE, 'category', category);
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
