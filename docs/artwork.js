(() => {
  "use strict";
  const logoFiles = {
    atari: "Atari_logo.svg", nintendo: "Nintendo_logo.svg",
    playstation: "PlayStation_logo.svg", sega: "SEGA_logo.svg",
    bandai: "BANDAI.svg", wonderswan: "WonderSwan_logo.svg",
    nec: "NEC_logo.svg", coleco: "COLECO_VISION_LOGO_(SINGLE_LINE).svg",
    commodore: "Commodore_logo.svg", snk: "SNK_logo.svg",
    "3do": "3DO_Logo.svg", microsoft: "MS-DOS_logo.svg"
  };
  const brandNames = {
    atari:"ATARI", nintendo:"Nintendo", playstation:"PLAYSTATION", sega:"SEGA",
    bandai:"BANDAI", wonderswan:"WonderSwan", nec:"NEC", coleco:"COLECO VISION",
    commodore:"COMMODORE", snk:"SNK", "3do":"3DO", microsoft:"MS-DOS", arcade:"ARCADE"
  };
  const brandColors = {
    atari:"#ee6725", nintendo:"#d71920", playstation:"#244b8f", sega:"#087bc1",
    bandai:"#df1c32", wonderswan:"#26264f", nec:"#164b8d", coleco:"#176fba",
    commodore:"#2457a7", snk:"#009cdd", "3do":"#d4242c", microsoft:"#1b63aa", arcade:"#f2b544"
  };
  function displayGameName(name) {
    const clean = String(name || "Unknown game").replace(/\\/g,"/").split("/").pop();
    return clean.replace(/\.[^.]+$/,"").replace(/_/g," ").trim() || "Untitled game";
  }
  function fallbackLogoSvg(system) {
    const slug=system.logo||"arcade";
    const word=brandNames[slug]||String(system.name||"RETRO").toUpperCase();
    const color=brandColors[slug]||"#7a5bb8";
    let mark="";
    if(slug==="atari") {
      mark='<path d="M45 72 C44 41 60 16 80 10 C100 16 116 41 115 72 M62 67 C63 42 70 29 80 24 C90 29 97 42 98 67 M27 46 C45 45 58 48 65 58 M133 46 C115 45 102 48 95 58" fill="none" stroke="'+color+'" stroke-width="8" stroke-linecap="round"/>';
    } else if(slug==="nintendo") {
      mark='<rect x="13" y="24" width="174" height="54" rx="27" fill="none" stroke="'+color+'" stroke-width="6"/><text x="100" y="58" text-anchor="middle" font-family="Arial,sans-serif" font-size="23" font-weight="800" fill="'+color+'">Nintendo</text>';
    } else if(slug==="sega") {
      mark='<text x="100" y="65" text-anchor="middle" font-family="Arial Black,Arial,sans-serif" font-size="43" font-weight="900" letter-spacing="-2" fill="'+color+'">SEGA</text><path d="M26 72 H174" stroke="'+color+'" stroke-width="3"/>';
    } else if(slug==="playstation") {
      mark='<path d="M52 18 L52 78 L69 83 L69 29 Q69 23 78 27 Q89 31 89 39 Q89 48 75 53 L75 61 Q109 50 109 35 Q109 23 88 16 Q65 8 52 18Z" fill="'+color+'"/><path d="M40 79 Q65 64 100 68 Q123 69 139 79 L139 87 Q111 77 82 80 Q58 82 40 89Z" fill="'+color+'"/>';
    } else if(slug==="bandai") {
      mark='<rect x="62" y="14" width="76" height="76" rx="7" fill="'+color+'"/><text x="100" y="60" text-anchor="middle" font-family="Arial,sans-serif" font-size="18" font-weight="900" fill="#fff">BANDAI</text>';
    } else if(slug==="wonderswan") {
      mark='<path d="M17 34 L38 34 L46 58 L55 34 L70 34 L78 58 L87 34 L102 34 L110 58 L119 34 L135 34 L143 58 L153 34 L181 34 L171 49 L156 49 L148 75 L133 75 L124 49 L115 75 L99 75 L91 49 L82 75 L66 75 L58 49 L49 75 L33 75Z" fill="'+color+'"/><text x="100" y="91" text-anchor="middle" font-family="Arial,sans-serif" font-size="13" font-weight="800" fill="'+color+'">WonderSwan</text>';
    } else if(slug==="nec") {
      mark='<text x="100" y="64" text-anchor="middle" font-family="Arial,sans-serif" font-weight="900" font-size="47" letter-spacing="1" fill="'+color+'">NEC</text>';
    } else if(slug==="coleco") {
      mark='<text x="100" y="50" text-anchor="middle" font-family="Arial Black,Arial,sans-serif" font-weight="900" font-size="28" fill="'+color+'">COLECO</text><text x="100" y="76" text-anchor="middle" font-family="Arial,sans-serif" font-weight="900" font-size="21" fill="'+color+'">VISION</text><path d="M24 84 H176" stroke="'+color+'" stroke-width="3"/>';
    } else if(slug==="commodore") {
      mark='<circle cx="47" cy="50" r="26" fill="none" stroke="'+color+'" stroke-width="7"/><path d="M27 67 L68 32" stroke="'+color+'" stroke-width="7"/><text x="129" y="58" text-anchor="middle" font-family="Arial,sans-serif" font-weight="900" font-size="18" fill="'+color+'">COMMODORE</text>';
    } else if(slug==="snk") {
      mark='<text x="100" y="65" text-anchor="middle" font-family="Arial Black,Arial,sans-serif" font-weight="900" font-size="51" letter-spacing="-2" fill="'+color+'">SNK</text>';
    } else if(slug==="3do") {
      mark='<path d="M36 26 L77 9 L77 28 L55 38 L55 66 L77 78 L77 96 L36 77Z M84 9 L125 26 L125 77 L84 96 L84 77 L106 66 L106 38 L84 28Z M133 26 L164 26 L164 80 L133 80 L133 64 L148 64 L148 42 L133 42Z" fill="'+color+'"/>';
    } else if(slug==="microsoft") {
      mark='<path d="M28 21 L78 21 L78 46 L28 46Z M84 21 L134 21 L134 46 L84 46Z M28 52 L78 52 L78 77 L28 77Z M84 52 L134 52 L134 77 L84 77Z" fill="'+color+'"/><text x="153" y="47" font-family="Arial,sans-serif" font-weight="900" font-size="17" fill="'+color+'">MS-DOS</text>';
    } else if(slug==="arcade") {
      mark='<rect x="62" y="8" width="76" height="90" rx="9" fill="#1b2030" stroke="'+color+'" stroke-width="5"/><rect x="73" y="18" width="54" height="37" rx="3" fill="'+color+'"/><path d="M82 68 H118 M91 77 H109 M100 61 V68" stroke="'+color+'" stroke-width="5" stroke-linecap="round"/>';
    } else {
      mark='<text x="100" y="62" text-anchor="middle" font-family="Arial,sans-serif" font-size="30" font-weight="900" fill="'+color+'">'+word+'</text>';
    }
    const svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 104"><rect width="200" height="104" rx="9" fill="#fbfaf7"/>'+mark+'</svg>';
    return "data:image/svg+xml;charset=utf-8,"+encodeURIComponent(svg);
  }
  function logoUrl(system) {
    const slug=system.logo||"arcade";
    if(slug==="arcade")return "./assets/logos/arcade.svg";
    // Always have a locally generated logo available; external logo host failures must not create text-only cards.
    return fallbackLogoSvg(system);
  }
  function setSystemLogo(img,system) {
    img.loading="lazy";
    img.decoding="async";
    img.referrerPolicy="no-referrer";
    img.alt=(system.name||"Console")+" logo";
    const fallback=img.parentElement&&img.parentElement.querySelector(".logo-fallback");
    let fallbackTried=false;
    img.onload=()=>{img.style.display="block";if(fallback)fallback.style.display="none";};
    img.onerror=()=>{
      if(!fallbackTried){fallbackTried=true;img.src=fallbackLogoSvg(system);return;}
      img.style.display="none";
      if(fallback)fallback.style.display="grid";
    };
    const src=system.logoUrl||logoUrl(system);
    img.src=src||fallbackLogoSvg(system);
  }
  function candidatesFor(entry,system) {
    const original=String(entry.name||"").replace(/\\/g,"/").split("/").pop().replace(/\\.[^.]+$/,"").trim();
    const base=displayGameName(entry.name);
    const clean=base.replace(/[&*\/:<>?\\|"]/g,"_").trim();
    const noRegion=base.replace(/\s*\([^)]*\)/g,"").replace(/\s*\[[^\]]*\]/g,"").trim();
    const shortName=base.split(/\s(?:\(|\[)/)[0].trim();
    const regionSuffixes=[" (World)"," (USA)"," (USA, Europe)"," (Europe)"," (Japan)"," (Japan, USA)"," (USA, Europe, Japan)"," (En,Ja)"];
    const names=[...new Set([original,base,clean,noRegion,shortName].filter(Boolean))];
    const regionSuffixes=[" (World)"," (USA)"," (USA, Europe)"," (Europe)"," (Japan)"," (Japan, USA)"," (USA, Europe, Japan)"," (En,Ja)"];
    const regionalNames=[];
    if(!/\\([^)]*\\)|\\[[^\\]]*\\]/.test(original)){
      for(const name of [...new Set([original,base,clean])])for(const region of regionSuffixes)regionalNames.push(name+region);
    }
    const allBoxNames=[...new Set([...names,...regionalNames])];
    const extension=((entry.name||"").split(".").pop()||"").toLowerCase();
    const playlists=[system.boxartPlaylist];
    if(entry.systemId==="gb"||system.name==="Game Boy / Game Boy Color")playlists.push(extension==="gbc"?"Nintendo - Game Boy Color":"Nintendo - Game Boy");
    if(entry.systemId==="ngp"&&extension==="ngc")playlists.unshift("SNK - Neo Geo Pocket Color");
    if(entry.systemId==="wonderswan"&&extension==="wsc")playlists.unshift("Bandai - WonderSwan Color");
    const folders=["Named_Boxarts","Named_Titles","Named_Snaps"];
    const urls=[];
    for(const playlist of [...new Set(playlists.filter(Boolean))]){
      // Box art gets exact names plus likely region variants; title screens and snaps are a smaller fallback set.
      for(const name of allBoxNames)urls.push("https://thumbnails.libretro.com/"+playlist.split("/").map(encodeURIComponent).join("/")+"/Named_Boxarts/"+encodeURIComponent(name)+".png");
      for(const folder of folders.slice(1)){
        for(const name of names.slice(0,3))urls.push("https://thumbnails.libretro.com/"+playlist.split("/").map(encodeURIComponent).join("/")+"/"+folder+"/"+encodeURIComponent(name)+".png");
      }
    }
    return urls;
  }
  function setBoxArt(img,entry,system) {
    img.loading="lazy";
    img.decoding="async";
    img.referrerPolicy="no-referrer";
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
  window.NVD_ARTWORK={setSystemLogo,setBoxArt,displayGameName,fallbackLogoSvg};
})();