// IndexedDB persistence for FileSystemDirectoryHandle
// Allows Kosha to remember granted storage access across reloads

const DB_NAME = 'kosha-fs-db';
const DB_VERSION = 1;
const STORE_NAME = 'handles';
const HANDLE_KEY = 'root-directory';

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      e.target.result.createObjectStore(STORE_NAME);
    };
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror = (e) => reject(e.target.error);
  });
}

export async function saveHandle(handle) {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put(handle, HANDLE_KEY);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    return false;
  }
}

export async function loadHandle() {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const req = tx.objectStore(STORE_NAME).get(HANDLE_KEY);
      req.onsuccess = (e) => resolve(e.target.result || null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

export async function clearHandle() {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).delete(HANDLE_KEY);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    return false;
  }
}

// Verify a stored handle still has permission (may need re-grant)
export async function verifyHandlePermission(handle) {
  if (!handle) return false;
  try {
    const perm = await handle.queryPermission({ mode: 'read' });
    if (perm === 'granted') return true;
    const req = await handle.requestPermission({ mode: 'read' });
    return req === 'granted';
  } catch {
    return false;
  }
}
