(() => {
"use strict";
const DB_NAME="nvd-emu-library-v1",DB_VERSION=2,STORE="games";
const LEGACY_DB_NAMES=[DB_NAME,"nvd-emu-library","nvd-emu","nvd-emu-games","nvdemu","nvdemu-library-v1","nvdemu-games","nvd123-emu-library"];
const APP_NAME_RE=/^(?:nvd[-_ ]?emu|nvdemu|nvd123[-_ ]?emu)(?:[-_.].*)?$/i;
let dbPromise=null,dbInstance=null;
const isAppName=name=>typeof name==="string"&&APP_NAME_RE.test(name);
function openDB(){
 if(!("indexedDB"in window))return Promise.reject(new Error("This browser does not provide IndexedDB storage."));
 if(!dbPromise){
  const opening=new Promise((resolve,reject)=>{
   const request=indexedDB.open(DB_NAME,DB_VERSION);
   request.onupgradeneeded=event=>{
    const db=request.result,tx=request.transaction;
    const store=db.objectStoreNames.contains(STORE)?tx.objectStore(STORE):db.createObjectStore(STORE,{keyPath:"key"});
    if(!store.indexNames.contains("duplicateKey"))store.createIndex("duplicateKey","duplicateKey",{unique:false});
    if(event.oldVersion<2){const cursorRequest=store.openCursor();cursorRequest.onsuccess=()=>{const cursor=cursorRequest.result;if(!cursor)return;const record=cursor.value;if(!record.duplicateKey&&record.systemId&&record.name){record.duplicateKey=duplicateKey(record.systemId,record.name,record.size);cursor.update(record);}cursor.continue();};}
   };
   request.onsuccess=()=>{dbInstance=request.result;dbInstance.onversionchange=()=>{try{dbInstance.close();}catch(_){}dbInstance=null;dbPromise=null;};resolve(dbInstance);};
   request.onerror=()=>reject(request.error||new Error("Could not open the game library database."));
   request.onblocked=()=>reject(new Error("The game library is blocked by another open tab. Close older NVD-EMU tabs and reload."));
  });
  dbPromise=opening;opening.catch(()=>{if(dbPromise===opening)dbPromise=null;});
 }
 return dbPromise;
}
function transact(mode,configure){return openDB().then(db=>new Promise((resolve,reject)=>{
 let result,settled=false;const tx=db.transaction(STORE,mode),finish=value=>{result=value;};
 tx.oncomplete=()=>{if(!settled){settled=true;resolve(result);}};
 tx.onerror=()=>{if(!settled){settled=true;reject(tx.error||new Error("The browser could not save the game library."));}};
 tx.onabort=()=>{if(!settled){settled=true;reject(tx.error||new Error("The library operation was aborted."));}};
 try{configure(tx.objectStore(STORE),finish,tx);}catch(error){try{tx.abort();}catch(_){}if(!settled){settled=true;reject(error);}}
}));}
function duplicateKey(systemId,name,size){return String(systemId)+":"+String(name||"").toLowerCase()+":"+Number(size||0);}
function gameKey(file,systemId){return systemId+":"+file.name.toLowerCase()+":"+file.size+":"+file.lastModified;}
function duplicateRecord(primaryKey,systemId,file,dupeKey){return{key:primaryKey,duplicateKey:dupeKey,systemId,name:file.name,size:file.size,lastModified:file.lastModified,type:file.type||"application/octet-stream",alreadyExists:true};}
async function save(file,systemId){
 if(!(file instanceof Blob))throw new Error("Choose a game file first.");
 const dupeKey=duplicateKey(systemId,file.name,file.size);
 const existingKey=await transact("readonly",(store,finish,tx)=>{const lookup=store.index("duplicateKey").getKey(dupeKey);lookup.onsuccess=()=>finish(lookup.result);lookup.onerror=()=>{try{tx.abort();}catch(_){} };});
 if(existingKey!==undefined)return duplicateRecord(existingKey,systemId,file,dupeKey);
 const data=await file.arrayBuffer(),record={key:gameKey(file,systemId),duplicateKey:dupeKey,systemId,name:file.name,size:file.size,lastModified:file.lastModified,type:file.type||"application/octet-stream",addedAt:Date.now(),data};
 return transact("readwrite",(store,finish,tx)=>{const lookup=store.index("duplicateKey").getKey(dupeKey);lookup.onsuccess=()=>{if(lookup.result!==undefined){finish(duplicateRecord(lookup.result,systemId,file,dupeKey));return;}const add=store.add(record);add.onsuccess=()=>finish({...record,alreadyExists:false});add.onerror=()=>{try{tx.abort();}catch(_){} };};lookup.onerror=()=>{try{tx.abort();}catch(_){} };});
}
async function list(){return transact("readonly",(store,finish)=>{const request=store.getAll();request.onsuccess=()=>finish(request.result||[]);request.onerror=()=>{try{request.transaction.abort();}catch(_){} };});}
async function get(key){return transact("readonly",(store,finish)=>{const request=store.get(key);request.onsuccess=()=>finish(request.result||null);request.onerror=()=>{try{request.transaction.abort();}catch(_){} };});}
async function remove(key){await transact("readwrite",store=>{store.delete(key);});}
async function clear(){await transact("readwrite",store=>{store.clear();});}
function toFile(record){if(!record)return null;let content=null;if(record.data instanceof ArrayBuffer||ArrayBuffer.isView(record.data))content=record.data;else if(record.blob instanceof Blob||record.blob instanceof ArrayBuffer)content=record.blob;if(!content)return null;return new File([content],record.name||"game.rom",{type:record.type||"application/octet-stream",lastModified:Number(record.lastModified)||Date.now()});}
async function requestPersistence(){try{if(navigator.storage&&typeof navigator.storage.persist==="function")return await navigator.storage.persist();}catch(_){}return false;}
async function storageEstimate(){try{if(navigator.storage&&typeof navigator.storage.estimate==="function")return await navigator.storage.estimate();}catch(_){}return null;}
async function isPersistent(){try{if(navigator.storage&&typeof navigator.storage.persisted==="function")return await navigator.storage.persisted();}catch(_){}return false;}
async function inspectAppStorage(){
 let databases=[],databaseEnumerationSupported=false;
 try{if(typeof indexedDB.databases==="function"){databaseEnumerationSupported=true;databases=(await indexedDB.databases()).map(entry=>entry.name).filter(Boolean);}}catch(_){}
 let cacheNames=[];try{if("caches"in window)cacheNames=await caches.keys();}catch(_){}
 let opfsNames=[],opfsAvailable=false;
 try{if(navigator.storage&&typeof navigator.storage.getDirectory==="function"){opfsAvailable=true;const root=await navigator.storage.getDirectory();for await(const [name]of root.entries())if(isAppName(name))opfsNames.push(name);}}catch(_){}
 const isLegacyDataKey=key=>isAppName(key)&&!/settings|prefs|preferences/i.test(key)&&/rom|game|save|library|cache|storage|database/i.test(key);
 const countKeys=storage=>{let n=0;try{for(let i=0;i<storage.length;i++)if(isLegacyDataKey(storage.key(i)||""))n++;}catch(_){}return n;};
 return{indexedDBSupported:"indexedDB"in window,databaseEnumerationSupported,databases,appDatabases:databases.filter(isAppName),cacheNames,appCaches:cacheNames.filter(isAppName),opfsAvailable,appOpfsEntries:opfsNames,legacyLocalStorageKeys:countKeys(window.localStorage),legacySessionStorageKeys:countKeys(window.sessionStorage)};
}
function deleteDatabase(name){return new Promise((resolve,reject)=>{let request;try{request=indexedDB.deleteDatabase(name);}catch(error){reject(error);return;}request.onsuccess=()=>resolve(true);request.onerror=()=>reject(request.error||new Error("Could not delete database "+name+"."));request.onblocked=()=>reject(new Error("Database "+name+" is open in another tab. Close other NVD-EMU tabs, then run Clear All again."));});}
async function clearAllAppData(){
 const beforeEstimate=await storageEstimate(),inventory=await inspectAppStorage(),result={databasesRemoved:[],cachesRemoved:[],opfsEntriesRemoved:[],legacyKeysRemoved:0,errors:[]};
 try{if(dbInstance)dbInstance.close();}catch(_){}dbInstance=null;dbPromise=null;
 // Delete full NVD-EMU databases, not just visible rows: this recovers orphaned ROM blobs from older versions.
 const names=inventory.databaseEnumerationSupported?new Set([...inventory.appDatabases,...LEGACY_DB_NAMES]):new Set(LEGACY_DB_NAMES);
 for(const name of names){try{await deleteDatabase(name);result.databasesRemoved.push(name);}catch(error){result.errors.push(error&&error.message?error.message:String(error));}}
 try{if("caches"in window)for(const name of await caches.keys()){if(!isAppName(name))continue;try{if(await caches.delete(name))result.cachesRemoved.push(name);}catch(error){result.errors.push("Cache "+name+": "+(error.message||String(error)));}}}catch(error){result.errors.push("Cache scan: "+(error.message||String(error)));}
 try{if(navigator.storage&&typeof navigator.storage.getDirectory==="function"){const root=await navigator.storage.getDirectory();for await(const [name]of root.entries())if(isAppName(name)){try{await root.removeEntry(name,{recursive:true});result.opfsEntriesRemoved.push(name);}catch(error){result.errors.push("File-system entry "+name+": "+(error.message||String(error));}}}}catch(error){result.errors.push("Private file-system scan: "+(error.message||String(error)));}
 const isLegacyDataKey=key=>isAppName(key)&&!/settings|prefs|preferences/i.test(key)&&/rom|game|save|library|cache|storage|database/i.test(key);
 for(const storage of [window.localStorage,window.sessionStorage]){try{const keys=[];for(let i=0;i<storage.length;i++){const key=storage.key(i)||"";if(isLegacyDataKey(key))keys.push(key);}for(const key of keys){storage.removeItem(key);result.legacyKeysRemoved++;}}catch(error){result.errors.push("Legacy storage cleanup: "+(error.message||String(error)));}}
 result.beforeEstimate=beforeEstimate;result.afterEstimate=await storageEstimate();return result;
}
window.NVDLibrary={openDB,save,list,get,remove,clear,toFile,requestPersistence,storageEstimate,isPersistent,gameKey,inspectAppStorage,clearAllAppData};
})();