// ==========================================================================
// Export — PNG card rendering, clipboard copy, zip download
// ==========================================================================

const EXPORT_SIZE = 600;

function loadImage(url) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('Image load error'));
        img.src = url;
    });
}

async function svgToImage(svgText) {
    const url = URL.createObjectURL(new Blob([svgText], { type: 'image/svg+xml' }));
    try { return await loadImage(url); }
    finally { setTimeout(() => URL.revokeObjectURL(url), 0); }
}

// The SVG source for a wrap, as text (local file or generated pixel art)
async function getAvatarSvgText(wrap, size) {
    if (isLineStyle()) {
        return buildLineSVG(wrap.dataset.seed, lineOptions(wrap, size));
    }
    if (state.avatarStyle === 'pixel') {
        return buildPixelSVG(wrap.dataset.seed, state.partyMode, getViewType(), size);
    }
    const src = wrap.querySelector('img').src;
    const r = await fetch(src);
    if (!r.ok) throw new Error('Fetch failed');
    return r.text();
}

// Line styles: a paper pill outlined and lettered in the ink
function drawInkBadge(ctx, ink, text, cx, size) {
    const fontSize = 54;
    ctx.save();
    ctx.font = `bold ${fontSize}px sans-serif`;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    const badgeW = ctx.measureText(text).width + 80;
    const badgeH = fontSize + 36;
    const badgeY = size - badgeH - 12;
    ctx.beginPath();
    ctx.roundRect(cx - badgeW / 2, badgeY, badgeW, badgeH, badgeH / 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.lineWidth = 9;
    ctx.strokeStyle = ink;
    ctx.stroke();
    ctx.fillStyle = ink;
    ctx.fillText(text, cx, badgeY + badgeH / 2 + 3);
    ctx.restore();
}

function drawBadge(ctx, wrapBg, text, cx, size, pixel) {
    const fontSize = 60;
    ctx.save();
    ctx.font = pixel ? `${fontSize + 12}px VT323, monospace` : `bold ${fontSize}px sans-serif`;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';

    const paddingX = 40, paddingY = 20;
    const badgeW = ctx.measureText(text).width + paddingX * 2;
    const badgeH = fontSize + paddingY * 2;
    const badgeX = cx - badgeW / 2;
    const badgeY = size - badgeH - 30;

    ctx.fillStyle = wrapBg;
    ctx.shadowColor = "rgba(0,0,0,0.2)";
    ctx.shadowBlur = pixel ? 0 : 10;
    ctx.shadowOffsetY = 5;
    ctx.shadowOffsetX = pixel ? 5 : 0;
    ctx.beginPath();
    ctx.roundRect(badgeX, badgeY, badgeW, badgeH, pixel ? 0 : 20);
    ctx.fill();
    ctx.shadowColor = "transparent";

    ctx.strokeStyle = pixel ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.5)";
    ctx.lineWidth = pixel ? 8 : 4;
    ctx.stroke();

    ctx.fillStyle = "rgba(0,0,0,0.7)";
    ctx.fillText(text, cx, badgeY + badgeH / 2 + 4);
    ctx.restore();
}

async function generateCardBlob(wrap) {
    const size = EXPORT_SIZE;
    const canvas = document.createElement('canvas');
    canvas.width = size; canvas.height = size;
    const ctx = canvas.getContext('2d');

    const isPixel = state.avatarStyle === 'pixel';
    const view = getViewType();
    const isCircle = document.body.classList.contains('shape-circle');
    const wrapBg = wrap.style.getPropertyValue('--avatar-bg') || "#e0e0e0";
    const cx = size / 2;

    const applyShadow = () => {
        if (state.shadows) {
            ctx.shadowColor = "rgba(0,0,0,0.2)";
            ctx.shadowBlur = 20;
            ctx.shadowOffsetY = 10;
        } else {
            ctx.shadowColor = "transparent";
        }
    };

    if (isLineStyle()) {
        // The SVG carries its own frame and paper, so it fills the card as-is
        applyShadow();
        const img = await svgToImage(await getAvatarSvgText(wrap, { width: size, height: size }));
        ctx.drawImage(img, 0, 0, size, size);
        ctx.shadowColor = "transparent";
    } else if (isPixel) {
        ctx.imageSmoothingEnabled = false;
        if (view === 'head') {
            // Square tile background, sprite fills it
            applyShadow();
            ctx.fillStyle = wrapBg;
            ctx.fillRect(0, 0, size, size);
            ctx.shadowColor = "transparent";
            const img = await svgToImage(await getAvatarSvgText(wrap, { width: size, height: size }));
            // Mirror the on-screen look: round clip, then scale(1.1) translateY(2px)
            const k = 1.1, s = size * k, off = (size - s) / 2, dy = size * (2 / 120) * k;
            ctx.save();
            ctx.beginPath();
            ctx.ellipse(cx, size / 2 + dy, s / 2, s / 2, 0, 0, Math.PI * 2);
            ctx.rect(0, 0, size, size / 2 + dy);   // only round the bottom (top is the tile edge)
            ctx.clip();
            ctx.drawImage(img, off, off + dy, s, s);
            ctx.restore();
        } else {
            // Full body sprite, no background tile (matches on-screen look)
            const h = size, w = Math.round(size * 32 / 48);
            const img = await svgToImage(await getAvatarSvgText(wrap, { width: w, height: h }));
            ctx.drawImage(img, cx - w / 2, 0, w, h);
        }
    } else {
        // 1. Background shape
        applyShadow();
        ctx.fillStyle = wrapBg;
        ctx.beginPath();
        if (isCircle) {
            ctx.arc(cx, size / 2, size / 2, 0, Math.PI * 2);
        } else {
            const w = size * 0.9, h = size * 0.8;
            ctx.ellipse(cx, size - h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
        }
        ctx.fill();
        ctx.shadowColor = "transparent";

        // 2. Clip: circle, or tombstone (oval bottom, open top) for oval
        ctx.save();
        ctx.beginPath();
        if (isCircle) {
            ctx.arc(cx, size / 2, size / 2, 0, Math.PI * 2);
        } else {
            const rx = size * 0.45, ry = size * 0.4, cenY = size - ry;
            ctx.moveTo(cx + rx, cenY);
            ctx.ellipse(cx, cenY, rx, ry, 0, 0, Math.PI, false);
            ctx.lineTo(cx - rx, 0);
            ctx.lineTo(cx + rx, 0);
            ctx.closePath();
        }
        ctx.clip();

        // 3. Avatar
        const img = await svgToImage(await getAvatarSvgText(wrap));
        ctx.drawImage(img, 0, 0, size, size);
        ctx.restore();
    }

    // 4. Label badge
    const roleText = wrap.querySelector('.role-label').innerText.trim().toUpperCase();
    if (roleText && !document.body.classList.contains('hide-labels')) {
        if (isLineStyle()) drawInkBadge(ctx, inkFor(wrap), roleText, cx, size);
        else drawBadge(ctx, wrapBg, roleText, cx, size, isPixel);
    }

    return new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
}

async function handleCopy(wrap) {
    wrap.style.transform = "scale(0.95)";
    setTimeout(() => wrap.style.transform = "", 100);

    if (state.copyFormat === 'svg') {
        try {
            await navigator.clipboard.writeText(await getAvatarSvgText(wrap));
            showToast('SVG Code Copied!');
        } catch (e) { console.error(e); showToast('Error fetching SVG'); }
        return;
    }

    try {
        // Pass the blob as a promise so Safari keeps the user-gesture context
        const item = new ClipboardItem({ "image/png": generateCardBlob(wrap) });
        await navigator.clipboard.write([item]);
        showToast('PNG Copied!');
    } catch (err) {
        console.error("Copy Error:", err);
        showToast('Copy Failed');
    }
}

async function downloadAll() {
    const items = Array.from(document.querySelectorAll('.img-wrap'));
    if (!items.length) return;

    showToast("Generating Zip...");
    const zip = new JSZip();
    const used = {};
    try {
        // Sequential — parallel canvases can choke the browser
        for (let i = 0; i < items.length; i++) {
            const wrap = items[i];
            let name = wrap.querySelector('.role-label').innerText.trim() || `avatar_${i}`;
            used[name] = (used[name] || 0) + 1;
            if (used[name] > 1) name = `${name}_${used[name]}`;
            zip.file(`${name}.png`, await generateCardBlob(wrap));
        }
        showToast("Zipping...");
        const zipBlob = await zip.generateAsync({ type: "blob" });
        saveAs(zipBlob, "security_personas.zip");
        showToast("Download Started");
    } catch (e) {
        console.error(e);
        showToast("Zip Generation Failed");
    }
}
