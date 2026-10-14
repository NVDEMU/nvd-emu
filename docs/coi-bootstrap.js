/* Scope cross-origin isolation to the threaded 3DS player and the nested GameCube WASM page. */
(() => {
"use strict";
const path=window.location.pathname,params=new URLSearchParams(window.location.search);
const wants3ds=path.endsWith("/player.html")&&params.get("system")==="3ds";
const wantsGamecube=path.endsWith("/gamecube-engine/index.html");
const wantsIsolation=wants3ds||wantsGamecube;
const modeKey=wantsGamecube?"nvd-emu-coi-gamecube-reload-v1":"nvd-emu-coi-3ds-reload-v14";
const scriptUrl=document.currentScript&&document.currentScript.src?document.currentScript.src:window.location.href;
const swUrl=new URL("./sw.js",scriptUrl),swScope=new URL("./",scriptUrl),sw=navigator.serviceWorker;
const isolated=()=>window.crossOriginIsolated===true&&typeof SharedArrayBuffer==="function";
if(!wantsIsolation){window.NVD_COI_MODE="inactive";if(window.isSecureContext&&sw)sw.register(swUrl.href,{scope:swScope.pathname}).catch(error=>console.warn("NVD-EMU: service-worker registration failed.",error));return;}
const unavailable=()=>{window.NVD_COI_MODE="unavailable";console.warn("NVD-EMU: required cross-origin isolation could not be enabled.");};
if(isolated()){try{sessionStorage.removeItem(modeKey);}catch(_){}window.NVD_COI_MODE="isolated";return;}
if(!window.isSecureContext||!sw){unavailable();return;}
let reloadQueued=false;
const attemptReload=()=>{if(isolated()){try{sessionStorage.removeItem(modeKey);}catch(_){}window.NVD_COI_MODE="isolated";return;}if(reloadQueued)return;reloadQueued=true;let tried=false;try{tried=sessionStorage.getItem(modeKey)==="1";}catch(_){}if(tried){unavailable();return;}try{sessionStorage.setItem(modeKey,"1");}catch(_){}window.location.reload();};
if(sw.controller){attemptReload();return;}
sw.addEventListener("controllerchange",attemptReload,{once:true});
sw.register(swUrl.href,{scope:swScope.pathname}).catch(error=>{unavailable();console.warn("NVD-EMU: isolation service-worker registration failed.",error);});
})();