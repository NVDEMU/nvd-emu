(() => {
  "use strict";
  const DB_NAME = "nvd-emu-library-v1";
  const DB_VERSION = 2;
  const STORE = "games";
  let dbPromise;
  function openDB() {
    if (!("indexedDB" in window)) return Promise.reject(new Error("This browser does not provide IndexedDB storage."));
    if (!dbPromise) {
      dbPromise = new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = event => {
          const db = request.result;
          const tx = request.transaction;
          const store = db.objectStoreNames.contains(STORE)
            ? tx.objectStore(STORE)
            : db.createObjectStore(STORE, { keyPath: "key" });
          if (!store.indexNames.contains("duplicateKey")) {
            store.createIndex("duplicateKey", "duplicateKey", { unique: false });
          }
          // Add an index without loading entire ROM files into memory during duplicate checks.
          if (event.oldVersion < 2) {
            const cursorRequest = store.openCursor();
            cursorRequest.onsuccess = () => {
              const cursor = cursorRequest.result;
              if (!cursor) return;
              const record = cursor.value;
              if (!record.duplicateKey && record.systemId && record.name) {
                record.duplicateKey = duplicateKey(record.systemId, record.name, record.size);
                cursor.update(record);
              }
              cursor.continue();
            };
          }
        };
        request.onsuccess = () => {
          const db = request.result;
          db.onversionchange = () => { db.close(); dbPromise = null; };
          resolve(db);
        };
        request.onerror = () => { dbPromise = null; reject(request.error || new Error("Could not open the game library database.")); };
        request.onblocked = () => reject(new Error("The game library is blocked by another open tab. Close older NVD-EMU tabs and reload."));
      });
    }
    return dbPromise;
  }
  function transact(mode, configure) {
    return openDB().then(db => new Promise((resolve, reject) => {
      let result;
      let settled = false;
      const tx = db.transaction(STORE, mode);
      const finish = value => { result = value; };
      tx.oncomplete = () => { if (!settled) { settled = true; resolve(result); } };
      tx.onerror = () => { if (!settled) { settled = true; reject(tx.error || new Error("The browser could not save the game library.")); } };
      tx.onabort = () => { if (!settled) { settled = true; reject(tx.error || new Error("The library operation was aborted.")); } };
      try { configure(tx.objectStore(STORE), finish, tx); }
      catch (error) { try { tx.abort(); } catch (_) {} if (!settled) { settled = true; reject(error); } }
    }));
  }
  function duplicateKey(systemId, name, size) {
    return String(systemId) + ":" + String(name || "").toLowerCase() + ":" + Number(size || 0);
  }
  function gameKey(file, systemId) {
    return systemId + ":" + file.name.toLowerCase() + ":" + file.size + ":" + file.lastModified;
  }
  async function save(file, systemId) {
    if (!(file instanceof Blob)) throw new Error("Choose a game file first.");
    const dupeKey = duplicateKey(systemId, file.name, file.size);
    const data = await file.arrayBuffer();
    const record = {
      key: gameKey(file, systemId), duplicateKey: dupeKey, systemId, name: file.name,
      size: file.size, lastModified: file.lastModified,
      type: file.type || "application/octet-stream", addedAt: Date.now(), data
    };
    return await transact("readwrite", (store, finish, tx) => {
      const lookup = store.index("duplicateKey").getKey(dupeKey);
      lookup.onsuccess = () => {
        if (lookup.result !== undefined) {
          // Return lightweight metadata only; don't read the existing ROM bytes again.
          finish({
            key: lookup.result, duplicateKey: dupeKey, systemId, name: file.name,
            size: file.size, lastModified: file.lastModified,
            type: file.type || "application/octet-stream", alreadyExists: true
          });
          return;
        }
        const add = store.add(record);
        add.onsuccess = () => finish({ ...record, alreadyExists: false });
        add.onerror = () => { try { tx.abort(); } catch (_) {} };
      };
      lookup.onerror = () => { try { tx.abort(); } catch (_) {} };
    });
  }
  async function list() {
    return await transact("readonly", (store, finish) => {
      const request = store.getAll();
      request.onsuccess = () => finish(request.result || []);
      request.onerror = () => { try { request.transaction.abort(); } catch (_) {} };
    });
  }
  async function get(key) {
    return await transact("readonly", (store, finish) => {
      const request = store.get(key);
      request.onsuccess = () => finish(request.result || null);
      request.onerror = () => { try { request.transaction.abort(); } catch (_) {} };
    });
  }
  async function remove(key) {
    await transact("readwrite", store => { store.delete(key); });
  }
  async function clear() {
    await transact("readwrite", store => { store.clear(); });
  }
  function toFile(record) {
    if (!record) return null;
    let content = null;
    if (record.data instanceof ArrayBuffer || ArrayBuffer.isView(record.data)) content = record.data;
    else if (record.blob instanceof Blob || record.blob instanceof ArrayBuffer) content = record.blob;
    if (!content) return null;
    return new File([content], record.name || "game.rom", {
      type: record.type || "application/octet-stream",
      lastModified: Number(record.lastModified) || Date.now()
    });
  }
  async function requestPersistence() {
    try {
      if (navigator.storage && typeof navigator.storage.persist === "function") return await navigator.storage.persist();
    } catch (_) {}
    return false;
  }
  async function storageEstimate() {
    try {
      if (navigator.storage && typeof navigator.storage.estimate === "function") return await navigator.storage.estimate();
    } catch (_) {}
    return null;
  }
  async function isPersistent() {
    try {
      if (navigator.storage && typeof navigator.storage.persisted === "function") return await navigator.storage.persisted();
    } catch (_) {}
    return false;
  }
  window.NVDLibrary = { openDB, save, list, get, remove, clear, toFile, requestPersistence, storageEstimate, isPersistent, gameKey };
})();