(() => {
"use strict";
const params=new URLSearchParams(window.location.search),notice=document.getElementById("nvd-engine-notice");
function showNotice(message,kind){if(!notice)return;notice.hidden=false;notice.textContent=message;notice.dataset.kind=kind||"info";}
function addBackLink(){const actions=document.querySelector(".topbar-actions");if(!actions||document.getElementById("nvd-back-link"))return;const link=document.createElement("a");link.id="nvd-back-link";link.className="icon-button";link.href="../library.html";link.textContent="NVD-EMU Library";link.title="Return to the NVD-EMU game library";actions.prepend(link);}
function capabilities(){const chromium=/Chrome|Chromium|Edg|OPR/i.test(navigator.userAgent||""),missing=[];if(!chromium)missing.push("desktop Chromium is recommended");if(!navigator.gpu)missing.push("WebGPU is unavailable");if(window.crossOriginIsolated!==true||typeof SharedArrayBuffer!=="function")missing.push("SharedArrayBuffer isolation is not active");showNotice(missing.length?"Experimental GameCube engine requirements: "+missing.join("; ")+". If the screen remains blank, use current Chrome/Edge on desktop, allow service workers, and reload.":"Experimental GameCube/WASM player. Compatibility and performance vary; no game or firmware is bundled.",missing.length?"warning":"info");}
async function restoreGame(){
 addBackLink();capabilities();
 const key=params.get("launch");
 if(params.has("storage-error")){showNotice("NVD-EMU could not save this disc to the local library. Choose Open disc to select it again, or use Settings → Game data recovery.","warning");return;}
 if(!key)return;
 try{
  if(!window.NVDLibrary)throw new Error("NVD-EMU storage helpers did not load.");
  const record=await window.NVDLibrary.get(key);
  if(!record)throw new Error("Saved GameCube entry not found.");
  if(record.systemId!=="gamecube")throw new Error("This saved entry is not a GameCube game.");
  const file=window.NVDLibrary.toFile(record);if(!file)throw new Error("The local disc image is unreadable. Select the file again.");
  let input=document.getElementById("romInput");
  for(let i=0;!input&&i<80;i++){await new Promise(resolve=>setTimeout(resolve,100));input=document.getElementById("romInput");}
  if(!input)throw new Error("The GameCube file picker did not initialize.");
  const transfer=new DataTransfer();transfer.items.add(file);input.files=transfer.files;
  input.dispatchEvent(new Event("change",{bubbles:true}));
  showNotice("Loaded "+file.name+" from your NVD-EMU library. The disc image stays in this browser profile.","info");
 }catch(error){showNotice((error&&error.message?error.message:String(error))+" Choose Open disc to select the local file again.","warning");}
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",()=>restoreGame().catch(error=>showNotice(String(error),"warning")),{once:true});else restoreGame().catch(error=>showNotice(String(error),"warning"));
})();