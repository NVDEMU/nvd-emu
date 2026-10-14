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
  // Use the final Wikimedia upload URLs directly. Special:FilePath redirects through
  // Commons and can fail CORS checks in cross-origin-isolated browsers such as Orion.
  const commonsDirectFiles =   {
      "Atari 2600 logo-01-06.svg": "https://upload.wikimedia.org/wikipedia/commons/0/0c/Atari_2600_logo-01-06.svg",
      "Atari 7800 logo.svg": "https://upload.wikimedia.org/wikipedia/commons/4/47/Atari_7800_logo.svg",
      "Atari Lynx logo.svg": "https://upload.wikimedia.org/wikipedia/commons/c/c6/Atari_Lynx_logo.svg",
      "NES logo.svg": "https://upload.wikimedia.org/wikipedia/commons/0/0d/NES_logo.svg",
      "Nintendo logo.svg": "https://upload.wikimedia.org/wikipedia/commons/5/51/Nintendo_logo.svg",
      "SNES logo.svg": "https://upload.wikimedia.org/wikipedia/commons/2/2c/SNES_logo.svg",
      "Gameboy logo.svg": "https://upload.wikimedia.org/wikipedia/commons/3/39/Gameboy_logo.svg",
      "Game Boy Advance logo.svg": "https://upload.wikimedia.org/wikipedia/commons/5/50/Game_Boy_Advance_logo.svg",
      "Nintendo 64 wordmark.svg": "https://upload.wikimedia.org/wikipedia/commons/5/5f/Nintendo_64_wordmark.svg",
      "Nintendo DS Logo.svg": "https://upload.wikimedia.org/wikipedia/commons/a/af/Nintendo_DS_Logo.svg",
      "PlayStation logo.svg": "https://upload.wikimedia.org/wikipedia/commons/0/00/PlayStation_logo.svg",
      "PSP Logo.svg": "https://upload.wikimedia.org/wikipedia/commons/0/0e/PSP_Logo.svg",
      "Master System Logo.svg": "https://upload.wikimedia.org/wikipedia/commons/8/83/Master_System_Logo.svg",
      "Game gear us-jp logo.svg": "https://upload.wikimedia.org/wikipedia/commons/4/41/Game_gear_us-jp_logo.svg",
      "Sega genesis logo.svg": "https://upload.wikimedia.org/wikipedia/commons/7/74/Sega_genesis_logo.svg",
      "Sega CD Logo.svg": "https://upload.wikimedia.org/wikipedia/commons/f/ff/Sega_CD_Logo.svg",
      "Sega 32X logo.svg": "https://upload.wikimedia.org/wikipedia/commons/a/a4/Sega_32X_logo.svg",
      "Sega Saturn Black Logo.svg": "https://upload.wikimedia.org/wikipedia/commons/7/78/Sega_Saturn_Black_Logo.svg",
      "Virtualboy logo.svg": "https://upload.wikimedia.org/wikipedia/commons/9/96/Virtualboy_logo.svg",
      "PC engine logo red.svg": "https://upload.wikimedia.org/wikipedia/commons/2/21/PC_engine_logo_red.svg",
      "Bandai WonderSwan horizontal logo.svg": "https://upload.wikimedia.org/wikipedia/commons/7/71/Bandai_WonderSwan_horizontal_logo.svg",
      "Neo Geo logo.svg": "https://upload.wikimedia.org/wikipedia/commons/f/f3/Neo_Geo_logo.svg",
      "Atari 5200 logo.svg": "https://upload.wikimedia.org/wikipedia/commons/6/6d/Atari_5200_logo.svg",
      "Atari Jaguar logo.svg": "https://upload.wikimedia.org/wikipedia/commons/f/f4/Atari_Jaguar_logo.svg",
      "COLECO VISION LOGO.svg": "https://upload.wikimedia.org/wikipedia/commons/9/9a/COLECO_VISION_LOGO.svg",
      "Commodore 64 logo (2).svg": "https://upload.wikimedia.org/wikipedia/commons/3/3a/Commodore_64_logo_(2).svg",
      "Commodore VIC 20 logo.svg": "https://upload.wikimedia.org/wikipedia/commons/9/98/Commodore_VIC_20_logo.svg",
      "Neo Geo Pocket logo.svg": "https://upload.wikimedia.org/wikipedia/commons/3/35/Neo_Geo_Pocket_logo.svg",
      "3DO Logo.svg": "https://upload.wikimedia.org/wikipedia/commons/a/aa/3DO_Logo.svg",
      "Amiga-Logo.svg": "https://upload.wikimedia.org/wikipedia/commons/d/df/Amiga-Logo.svg",
      "MS-DOS logo.svg": "https://upload.wikimedia.org/wikipedia/commons/7/71/MS-DOS_logo.svg",
      "Microsoft logo (2012).svg": "https://upload.wikimedia.org/wikipedia/commons/9/96/Microsoft_logo_(2012).svg",
      "Commodore PET logo-16.svg": "https://upload.wikimedia.org/wikipedia/commons/9/99/Commodore_PET_logo-16.svg",
      "Commodore Plus 4 logo-13.svg": "https://upload.wikimedia.org/wikipedia/commons/4/4d/Commodore_Plus_4_logo-13.svg",
      "Family Computer Disk System logo.svg": "https://upload.wikimedia.org/wikipedia/commons/3/35/Family_Computer_Disk_System_logo.svg",
      "MAMELogo.svg": "https://upload.wikimedia.org/wikipedia/commons/c/c3/MAMELogo.svg",
      "Philips CD-i logo.svg": "https://upload.wikimedia.org/wikipedia/commons/e/e5/Philips_CD-i_logo.svg",
      "Nintendo 3DS logo.svg": "https://upload.wikimedia.org/wikipedia/commons/8/89/Nintendo_3DS_logo.svg",
      "Nintendo GameCube Official Logo.svg": "https://upload.wikimedia.org/wikipedia/commons/2/29/Nintendo_GameCube_Official_Logo.svg",
      "Wii.svg": "https://upload.wikimedia.org/wikipedia/commons/b/bc/Wii.svg",
      "PlayStation 2 logo.svg": "https://upload.wikimedia.org/wikipedia/commons/7/76/PlayStation_2_logo.svg",
      "Dreamcast logo.svg": "https://upload.wikimedia.org/wikipedia/commons/7/7e/Dreamcast_logo.svg",
      "SG-1000 Logo.svg": "https://upload.wikimedia.org/wikipedia/commons/9/90/SG-1000_Logo.svg",
      "Atari ST logo-01.svg": "https://upload.wikimedia.org/wikipedia/commons/7/7c/Atari_ST_logo-01.svg",
      "BANDAI.svg": "https://upload.wikimedia.org/wikipedia/commons/f/f7/BANDAI.svg",
      "WonderSwan logo.svg": "https://upload.wikimedia.org/wikipedia/commons/c/cd/WonderSwan_logo.svg"
  };
  function logoSource(value) {
    if (!value) return "";
    if (/^(https?:)?\\/\\//i.test(value) || value.startsWith("./") || value.startsWith("../")) return value;
    return commonsDirectFiles[value] || "";
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