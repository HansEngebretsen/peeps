// ==========================================================================
// Pixel-art avatar generator (deterministic from a seed string)
// ==========================================================================

/**
 * Build a pixel avatar SVG string.
 * @param {string} seedStr   seed — same seed always gives the same person
 * @param {boolean} partyMode neon hair, wild hairdo, sunglasses
 * @param {'full'|'head'} view full body or head-and-shoulders crop
 * @param {{width?:number,height?:number}} [size] explicit pixel size (for canvas export)
 */
function buildPixelSVG(seedStr, partyMode, view, size) {
    let seed = 0;
    for (let i = 0; i < seedStr.length; i++) seed += seedStr.charCodeAt(i);
    const random = () => { const x = Math.sin(seed++) * 10000; return x - Math.floor(x); };
    const rndArr = (arr) => arr[Math.floor(random() * arr.length)];

    // Palettes inspired by retro sprites
    const skins = ["#f8d9ce", "#f1c2af", "#e4a88f", "#c78566", "#925c42", "#613c2c", "#3e2216"];
    const hairs = ["#2e2a2a", "#52433d", "#896652", "#cc6924", "#f59424", "#ffb03a", "#e0a15c", "#111111", "#d4af37"];
    const shirts = ["#1652f0", "#c22d2d", "#20a252", "#8b5cf6", "#f59e0b", "#ffffff", "#333333", "#4A90E2", "#e84393", "#d97706", "#059669"];
    const pants = ["#1e293b", "#334155", "#0f172a", "#172554", "#2d3748"];
    const secondaries = ["#ef4444", "#3b82f6", "#f59e0b", "#10b981", "#8b5cf6", "#eab308"];

    const skin = rndArr(skins);
    let hair = rndArr(hairs);
    const shirt = rndArr(shirts);
    const leg = rndArr(pants);
    const secondary = rndArr(secondaries);

    const outfit = Math.floor(random() * 5);   // 0:Dress, 1:Suit, 2:Sweater, 3:Hoodie, 4:Vneck
    let hairType = Math.floor(random() * 6);   // 0:Bob, 1:Flat, 2:Short, 3:Spiky, 4:Long, 5:Bald
    Math.floor(random() * 4);                  // (reserved accessory roll — keeps seeds stable)
    const prop = Math.floor(random() * 5);     // 0:None, 1:Phone, 2:Clipboard, 3:Laptop, 4:None

    if (partyMode) {
        hair = rndArr(["#f472b6", "#34d399", "#60a5fa", "#fbbf24", "#a855f7"]); // neon hair
        hairType = rndArr([3, 1]);                                              // spiky or flat-top
    }

    const isHead = view === 'head';
    const viewBox = isHead ? "8 2 16 16" : "0 0 32 48";
    const w = size?.width ? `${size.width}` : '100%';
    const h = size?.height ? `${size.height}` : '100%';

    let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" shape-rendering="crispEdges" width="${w}" height="${h}">`;

    if (!isHead) {
        svg += `<ellipse cx="16" cy="42" rx="10" ry="2.5" fill="rgba(0,0,0,0.15)" shape-rendering="auto" />`;
        svg += `<rect x="13" y="30" width="2" height="12" fill="${leg}" />`;
        svg += `<rect x="17" y="30" width="2" height="12" fill="${leg}" />`;
        svg += `<rect x="12" y="40" width="3" height="2" fill="#222" />`;
        svg += `<rect x="17" y="40" width="3" height="2" fill="#222" />`;
    }

    const outfitH = (outfit === 0) ? 19 : 15; // dress goes down to y=34
    svg += `<rect x="12" y="15" width="8" height="${outfitH}" fill="${shirt}" />`;

    if (outfit === 1) { // Suit
        svg += `<rect x="14" y="15" width="4" height="11" fill="#fff" />`;
        svg += `<rect x="15" y="16" width="2" height="7" fill="${secondary}" />`;
    } else if (outfit === 3) { // Hoodie
        svg += `<rect x="13" y="15" width="1" height="5" fill="#fff" opacity="0.7"/>`;
        svg += `<rect x="18" y="15" width="1" height="5" fill="#fff" opacity="0.7"/>`;
        svg += `<rect x="13" y="22" width="6" height="4" fill="#000" opacity="0.15"/>`;
    } else if (outfit === 4) { // V-neck
        svg += `<rect x="15" y="15" width="2" height="3" fill="${skin}" />`;
    }

    // Head + face
    svg += `<rect x="11" y="6" width="10" height="9" fill="${skin}" />`;
    svg += `<rect x="13" y="10" width="1" height="1" fill="#111" />`;
    svg += `<rect x="18" y="10" width="1" height="1" fill="#111" />`;
    svg += `<rect x="15" y="13" width="2" height="1" fill="rgba(0,0,0,0.15)" />`;

    if (hairType === 0) { // Bob
        svg += `<rect x="10" y="4" width="12" height="4" fill="${hair}" />`;
        svg += `<rect x="10" y="8" width="2" height="6" fill="${hair}" />`;
        svg += `<rect x="20" y="8" width="2" height="6" fill="${hair}" />`;
    } else if (hairType === 1) { // Flat-top
        svg += `<rect x="11" y="2" width="10" height="4" fill="${hair}" />`;
        svg += `<rect x="10" y="6" width="12" height="2" fill="${hair}" />`;
    } else if (hairType === 2) { // Short
        svg += `<rect x="11" y="4" width="10" height="2" fill="${hair}" />`;
        svg += `<rect x="10" y="6" width="2" height="3" fill="${hair}" />`;
        svg += `<rect x="20" y="6" width="2" height="3" fill="${hair}" />`;
    } else if (hairType === 3) { // Spiky
        svg += `<rect x="11" y="4" width="10" height="2" fill="${hair}" />`;
        svg += `<rect x="12" y="2" width="2" height="2" fill="${hair}" />`;
        svg += `<rect x="15" y="3" width="2" height="2" fill="${hair}" />`;
        svg += `<rect x="18" y="2" width="2" height="2" fill="${hair}" />`;
    } else if (hairType === 4) { // Long
        svg += `<rect x="10" y="4" width="12" height="3" fill="${hair}" />`;
        svg += `<rect x="10" y="7" width="2" height="12" fill="${hair}" />`;
        svg += `<rect x="20" y="7" width="2" height="12" fill="${hair}" />`;
    } // 5 = bald

    // Accessories: party → sunglasses, otherwise ~20% glasses, rare headset
    let accessory = 0;
    if (partyMode) accessory = 3;
    else if (random() > 0.8) accessory = 1;
    else if (random() > 0.95) accessory = 2;

    if (accessory === 1) { // Glasses
        svg += `<rect x="12" y="9" width="3" height="3" fill="none" stroke="#222" stroke-width="1" />`;
        svg += `<rect x="17" y="9" width="3" height="3" fill="none" stroke="#222" stroke-width="1" />`;
        svg += `<rect x="15" y="10" width="2" height="1" fill="#222" />`;
    } else if (accessory === 2) { // Headset
        svg += `<rect x="10" y="5" width="12" height="2" fill="#222" />`;
        svg += `<rect x="9" y="7" width="2" height="4" fill="#222" />`;
        svg += `<rect x="11" y="12" width="3" height="1" fill="#222" />`;
    } else if (accessory === 3) { // Party sunglasses
        svg += `<rect x="11" y="9" width="10" height="3" fill="#111" />`;
        svg += `<rect x="12" y="9" width="2" height="1" fill="#fff" opacity="0.4" />`;
        svg += `<rect x="17" y="9" width="2" height="1" fill="#fff" opacity="0.4" />`;
    }

    if (prop === 1) { // Phone (right hand raised)
        svg += `<rect x="10" y="15" width="2" height="10" fill="${shirt}" />`;
        svg += `<rect x="10" y="25" width="2" height="2" fill="${skin}" />`;
        svg += `<rect x="20" y="15" width="2" height="7" fill="${shirt}" />`;
        svg += `<rect x="22" y="20" width="2" height="2" fill="${skin}" />`;
        svg += `<rect x="22" y="17" width="2" height="4" fill="#333" />`;
    } else if (prop === 2) { // Clipboard (left hand)
        svg += `<rect x="8" y="20" width="2" height="2" fill="${skin}" />`;
        svg += `<rect x="10" y="15" width="2" height="7" fill="${shirt}" />`;
        svg += `<rect x="6" y="18" width="4" height="6" fill="#f8fafc" />`;
        svg += `<rect x="7" y="17" width="2" height="2" fill="#94a3b8" />`;
        svg += `<rect x="7" y="20" width="2" height="1" fill="#cbd5e1" />`;
        svg += `<rect x="7" y="22" width="2" height="1" fill="#cbd5e1" />`;
        svg += `<rect x="20" y="15" width="2" height="10" fill="${shirt}" />`;
        svg += `<rect x="20" y="25" width="2" height="2" fill="${skin}" />`;
    } else if (prop === 3) { // Laptop (both hands forward)
        svg += `<rect x="10" y="15" width="2" height="7" fill="${shirt}" />`;
        svg += `<rect x="10" y="22" width="2" height="2" fill="${skin}" />`;
        svg += `<rect x="20" y="15" width="2" height="7" fill="${shirt}" />`;
        svg += `<rect x="20" y="22" width="2" height="2" fill="${skin}" />`;
        svg += `<rect x="10" y="21" width="12" height="5" fill="${secondary}" />`;
        svg += `<rect x="11" y="22" width="10" height="3" fill="#10b981" />`;
    } else { // Arms down
        svg += `<rect x="10" y="15" width="2" height="10" fill="${shirt}" />`;
        svg += `<rect x="10" y="25" width="2" height="2" fill="${skin}" />`;
        svg += `<rect x="20" y="15" width="2" height="10" fill="${shirt}" />`;
        svg += `<rect x="20" y="25" width="2" height="2" fill="${skin}" />`;
    }

    svg += `</svg>`;
    return svg;
}

function pixelDataUrl(seedStr, partyMode, view) {
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(buildPixelSVG(seedStr, partyMode, view));
}
