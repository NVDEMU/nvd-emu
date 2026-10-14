(() => {
  "use strict";
  const defaultBrandLogos = {
    atari: "./assets/logos/atari.svg",
    nintendo: "Nintendo logo.svg",
    playstation: "./assets/logos/playstation.svg",
    sega: "./assets/logos/sega.svg",
    bandai: "BANDAI.svg",
    wonderswan: "WonderSwan logo.svg",
    nec: "./assets/logos/nec.svg",
    coleco: "COLECO VISION LOGO.svg",
    commodore: "./assets/logos/commodore.svg",
    snk: "Neo Geo logo.svg",
    "3do": "3DO Logo.svg",
    microsoft: "Microsoft logo (2012).svg",
    philips: "Philips CD-i logo.svg",
    arcade: ""
  };
  function displayGameName(name) {
    const clean = String(name || "Unknown game").replace(/\\/g,"/").split("/").pop();
    return clean.replace(/\.[^.]+$/,"").replace(/_/g," ").trim() || "Untitled game";
  }
  function logoSource(value) {
    if (!value) return "";
    if (/^(https?:)?\/\//i.test(value) || value.startsWith("./") || value.startsWith("../")) return value;
    return "https://commons.wikimedia.org/wiki/Special:FilePath/" + encodeURIComponent(value);
  }
  function setSystemLogo(img, system) {
    img.loading = "lazy";
    img.decoding = "async";
    img.referrerPolicy = "no-referrer";
    if (window.NVD_COI_MODE === "require-corp") img.crossOrigin = "anonymous";
    img.alt = (system.name || "Console") + " logo";
    const fallback = img.parentElement && img.parentElement.querySelector(".logo-fallback");
    const candidates = [...new Set([
      logoSource(system.logoFile),
      logoSource(system.brandLogoFile),
      logoSource(defaultBrandLogos[system.logo])
    ].filter(Boolean))];
    let index = 0;
    if (fallback) {
      fallback.textContent = "Logo unavailable";
      fallback.setAttribute("aria-label", "Logo unavailable for " + (system.name || "this system"));
      fallback.style.display = "none";
    }
    img.onload = () => {
      img.style.display = "block";
      if (fallback) fallback.style.display = "none";
    };
    img.onerror = () => {
      index += 1;
      if (index < candidates.length) {
        img.src = candidates[index];
        return;
      }
      // Never fabricate a replacement logo. A missing asset gets a neutral status label.
      img.style.display = "none";
      if (fallback) fallback.style.display = "grid";
    };
    if (candidates.length) img.src = candidates[0];
    else img.onerror();
  }
  function candidatesFor(entry,system) {
    const fileName=String(entry.name||"").replace(/\\/g,"/").split("/").pop();
    const original=fileName.replace(/\.[^.]+$/,"").trim();
    const base=displayGameName(fileName);
    const clean=base.replace(/[&*\/:<>?\\|"]/g,"_").trim();
    const noRegion=base.replace(/\s*\([^)]*\)/g,"").replace(/\s*\[[^\]]*\]/g,"").trim();
    const shortName=base.split(/\s(?:\(|\[)/)[0].trim();
    const names=[...new Set([original,base,clean,noRegion,shortName].filter(Boolean))];
    const hasRegion=/\([^)]*\)|\[[^\]]*\]/.test(original);
    const regionSuffixes=[" (World)"," (USA)"," (USA, Europe)"," (Europe)"," (Japan)"," (Japan, USA)"];
    const regionNames=[];
    if(!hasRegion) {
      for(const name of [...new Set([original,base,clean].filter(Boolean))]) {
        for(const region of regionSuffixes) regionNames.push(name+region);
      }
    }
    const extension=(fileName.split(".").pop()||"").toLowerCase();
    const playlists=[system.boxartPlaylist];
    if(entry.systemId==="gb"||system.name==="Game Boy / Game Boy Color") {
      playlists.push(extension==="gbc"?"Nintendo - Game Boy Color":"Nintendo - Game Boy");
    }
    if(entry.systemId==="ngp"&&extension==="ngc") playlists.unshift("SNK - Neo Geo Pocket Color");
    if(entry.systemId==="wonderswan"&&extension==="wsc") playlists.unshift("Bandai - WonderSwan Color");
    const urls=[];
    for(const playlist of [...new Set(playlists.filter(Boolean))]) {
      const prefix="https://thumbnails.libretro.com/"+playlist.split("/").map(encodeURIComponent).join("/");
      // Try the source filename and common cleaned variants as box art first.
      for(const name of [...names,...regionNames].slice(0,12)) {
        urls.push(prefix+"/Named_Boxarts/"+encodeURIComponent(name)+".png");
      }
      // A title screen or snapshot is a useful visual fallback, but never substitute console branding.
      for(const folder of ["Named_Titles","Named_Snaps"]) {
        for(const name of names.slice(0,2)) urls.push(prefix+"/"+folder+"/"+encodeURIComponent(name)+".png");
      }
    }
    return [...new Set(urls)];
  }
  function setBoxArt(img,entry,system) {
    img.loading="lazy";
    img.decoding="async";
    img.referrerPolicy="no-referrer";
    if(window.NVD_COI_MODE==="require-corp") img.crossOrigin="anonymous";
    img.alt=displayGameName(entry.name)+" cover art";
    const fallback=img.parentElement&&img.parentElement.querySelector(".cover-fallback");
    const urls=candidatesFor(entry,system);
    if(fallback){fallback.textContent=displayGameName(entry.name);fallback.classList.add("is-title-art","family-"+(system.art||"other"));fallback.style.display="grid";}
    let index=0;
    img.onload=()=>{img.style.display="block";if(fallback)fallback.style.display="none";};
    img.onerror=()=>{
      index++;
      if(index<urls.length){img.src=urls[index];return;}
      // Do not substitute a console/company logo for missing game art.
      img.style.display="none";
      if(fallback){
        fallback.textContent=displayGameName(entry.name);
        fallback.classList.add("is-title-art","family-"+(system.art||"other"));
        fallback.style.display="grid";
      }
    };
    if(urls.length)img.src=urls[0];else img.onerror();
  }
  window.NVD_ARTWORK={setSystemLogo,setBoxArt,displayGameName};
})();