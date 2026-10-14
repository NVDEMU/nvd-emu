(() => {
  "use strict";
  const logoBase = "https://cdn.simpleicons.org/";
  const palette = {
    atari: "FFFFFF", nintendo: "FFFFFF", playstation: "FFFFFF",
    sega: "FFFFFF", bandai: "FFFFFF", nec: "FFFFFF", coleco: "FFFFFF",
    commodore: "FFFFFF", snk: "FFFFFF", "3do": "FFFFFF", microsoft: "FFFFFF"
  };
  function setSystemLogo(img, system) {
    img.loading = "lazy";
    img.decoding = "async";
    img.alt = (system.name || "Console") + " logo";
    const fallback = img.parentElement && img.parentElement.querySelector(".logo-fallback");
    const showFallback = () => {
      img.style.display = "none";
      if (fallback) fallback.style.display = "grid";
    };
    img.onload = () => {
      img.style.display = "block";
      if (fallback) fallback.style.display = "none";
    };
    img.onerror = showFallback;
    const slug = system.logo || "gamepad";
    img.src = logoBase + encodeURIComponent(slug) + "/" + (palette[slug] || "FFFFFF");
  }
  function candidatesFor(entry, system) {
    const base = (entry.name || "").replace(/\.[^.]+$/, "").trim();
    const cleaned = base
      .replace(/[&*\/:<>?\\|"]/g, "_")
      .replace(/\s*\[[^\]]*\]/g, "")
      .trim();
    const noRegion = base.replace(/\s*\([^)]*\)/g, "").replace(/\s*\[[^\]]*\]/g, "").trim();
    const shortName = base.split(/\s(?:\(|\[)/)[0].trim();
    const names = [...new Set([base, cleaned, noRegion, shortName].filter(Boolean))];
    const extension = ((entry.name || "").split(".").pop() || "").toLowerCase();
    const playlists = [system.boxartPlaylist];
    if (system.name === "Game Boy / Game Boy Color") {
      playlists.push(extension === "gbc" ? "Nintendo - Game Boy Color" : "Nintendo - Game Boy");
    }
    if (system.name === "Neo Geo Pocket / Color" && extension === "ngc") playlists.unshift("SNK - Neo Geo Pocket Color");
    if (system.name === "WonderSwan / Color" && extension === "wsc") playlists.unshift("Bandai - WonderSwan Color");
    const urls = [];
    for (const playlist of [...new Set(playlists.filter(Boolean))]) {
      for (const name of names) {
        urls.push("https://thumbnails.libretro.com/" +
          playlist.split("/").map(encodeURIComponent).join("/") +
          "/Named_Boxarts/" + encodeURIComponent(name) + ".png");
      }
    }
    return urls;
  }
  function setBoxArt(img, entry, system) {
    img.loading = "lazy";
    img.decoding = "async";
    img.alt = (entry.name || "Game") + " cover art";
    const fallback = img.parentElement && img.parentElement.querySelector(".cover-fallback");
    const urls = candidatesFor(entry, system);
    let index = 0;
    const fail = () => {
      index += 1;
      if (index < urls.length) {
        img.src = urls[index];
        return;
      }
      img.onerror = () => {
        img.style.display = "none";
        if (fallback) fallback.style.display = "grid";
      };
      img.onload = () => {
        img.style.display = "block";
        if (fallback) fallback.style.display = "none";
      };
      const slug = system.logo || "gamepad";
      img.src = logoBase + encodeURIComponent(slug) + "/" + (palette[slug] || "FFFFFF");
    };
    img.onerror = fail;
    img.onload = () => {
      img.style.display = "block";
      if (fallback) fallback.style.display = "none";
    };
    if (urls.length) img.src = urls[0];
    else fail();
  }
  window.NVD_ARTWORK = { setSystemLogo, setBoxArt };
})();