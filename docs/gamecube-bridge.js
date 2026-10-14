(() => {
"use strict";
const params=new URLSearchParams(window.location.search),notice=document.getElementById("nvd-engine-notice");
function showNotice(message,kind){if(!notice)return;notice.hidden=false;notice.textContent=message;notice.dataset.kind=kind||"info";}
function systemName(id){return id==="wii"?"Wii":"GameCube";}
function setSystem(id){
 const name=systemName(id);document.title=name+" · NVD-EMU";
 const heading=document.querySelector(".brand h1");if(heading)heading.textContent="NVD-EMU "+name;
 const input=document.getElementById("romInput");if(input)input.accept=".iso,.nkit.iso,.gcm,.rvz,.wbfs,.ciso,.wia,.gcz,.dol,.elf";
 const openLabel=document.querySelector("#dropZone .btn-text");if(openLabel)openLabel.textContent=id==="wii"?"Open Wii disc":"Open disc";
}
function addBackLink(){const actions=document.querySelector(".topbar-actions");if(!actions||document.getElementById("nvd-back-link"))return;const link=document.createElement("a");link.id="nvd-back-link";link.className="icon-button";link.href="../library.html";link.textContent="NVD-EMU Library";link.title="Return to the NVD-EMU game library";actions.prepend(link);}
function capabilities(id){
 const chromium=/Chrome|Chromium|Edg|OPR/i.test(navigator.userAgent||""),missing=[];
 if(!chromium)missing.push("desktop Chromium is recommended");if(!navigator.gpu)missing.push("WebGPU is unavailable");
 if(window.crossOriginIsolated!==true||typeof SharedArrayBuffer!=="function")missing.push("SharedArrayBuffer isolation is not active");
 const note=id==="wii"?"Wii disc boot is experimental; Wii Remote motion/pointer input is not implemented, so many Wii games may boot without playable controls.":"GameCube compatibility and performance vary.";
 const requirement=missing.length?" Requirements: "+missing.join("; ")+". Use current Chrome/Edge on desktop, allow service workers, and reload if the screen stays blank.":"";
 showNotice("Experimental "+systemName(id)+" browser/WASM player. "+note+requirement+" No game or firmware is bundled.",id==="wii"||missing.length?"warning":"info");
}
async function restoreGame(){
 addBackLink();let selected=params.get("system")==="wii"?"wii":"gamecube";setSystem(selected);capabilities(selected);
 if(params.has("storage-error")){showNotice("NVD-EMU could not save this game to the local library. Choose Open disc to select it again, or use Settings → Game data recovery.","warning");return;}
 const key=params.get("launch");if(!key)return;
 try{
  if(!window.NVDLibrary)throw new Error("NVD-EMU storage helpers did not load.");
  const record=await window.NVDLibrary.get(key);if(!record)throw new Error("Saved game entry not found.");
  if(record.systemId!=="wii"&&record.systemId!=="gamecube")throw new Error("Saved entry is not a GameCube/Wii game.");
  if(params.has("system")&&record.systemId!==selected)throw new Error("Saved entry is "+systemName(record.systemId)+", but the player was opened as "+systemName(selected)+".");
  selected=record.systemId;setSystem(selected);capabilities(selected);
  const file=window.NVDLibrary.toFile(record);if(!file)throw new Error("The local disc image is unreadable. Select the file again.");
  let input=document.getElementById("romInput");for(let i=0;!input&&i<80;i++){await new Promise(resolve=>setTimeout(resolve,100));input=document.getElementById("romInput");}
  if(!input)throw new Error("The disc picker did not initialize.");
  const transfer=new DataTransfer();transfer.items.add(file);input.files=transfer.files;input.dispatchEvent(new Event("change",{bubbles:true}));
  showNotice("Loaded "+file.name+" from your NVD-EMU library. The file stays in this browser profile.",selected==="wii"?"warning":"info");
 }catch(error){showNotice((error&&error.message?error.message:String(error))+" Choose Open disc to select the local file again.","warning");}
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",()=>restoreGame().catch(error=>showNotice(String(error),"warning")),{once:true});else restoreGame().catch(error=>showNotice(String(error),"warning"));
})();