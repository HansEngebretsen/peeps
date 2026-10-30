// ==========================================================================
// App — grid, avatar cards, controls, init
// ==========================================================================

const grid = document.getElementById('grid');
const confetti = new ConfettiEngine('confetti-canvas');
let suppressToasts = false;

function showToast(msg) {
    if (suppressToasts) return;
    const t = document.getElementById('toast');
    t.innerText = msg;
    t.style.opacity = 1;
    clearTimeout(showToast._timer);
    showToast._timer = setTimeout(() => t.style.opacity = 0, 2000);
}

function selectAll(el) {
    el.focus();
    const range = document.createRange();
    range.selectNodeContents(el);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
}

// --- Add card -------------------------------------------------------------
const addCard = document.createElement('div');
addCard.className = 'add-card';
addCard.title = 'Add persona';
addCard.innerHTML = `<span class="material-symbols-outlined">add</span>`;
addCard.onclick = () => {
    const av = createAvatar({ role: rnd(CONFIG.common.roles), id: rndId() }, grid.children.length - 1);
    insertAnimated(av);
    setTimeout(() => {
        const label = av.querySelector('.role-label');
        if (label) selectAll(label);
    }, 250);
};

// Insert a card that grows in from zero width so neighbours slide smoothly
function insertAnimated(av, delay = 0) {
    av.classList.add('avatar-entering');
    grid.insertBefore(av, addCard);
    void av.offsetWidth;
    setTimeout(() => requestAnimationFrame(() => av.classList.remove('avatar-entering')), delay);
}

// --- Avatar cards ---------------------------------------------------------
function createAvatar(data, index) {
    const role = data.role || "Role";
    let id = data.id !== undefined && data.id !== null ? data.id : rndId();
    if (isRandomId(id) && Number(id) >= AVATAR_COUNT) id = 0;

    const wrap = document.createElement('div');
    wrap.className = 'img-wrap';
    wrap.draggable = true;
    wrap.style.setProperty('--avatar-bg', data.bg || CONFIG.bgColors[index % CONFIG.bgColors.length]);
    wrap.style.animationDelay = (index * 0.24) + 's';
    wrap.dataset.id = id;
    wrap.dataset.seed = data.seed || newSeed(role);
    if (data.ink) setCardInk(wrap, data.ink);

    wrap.innerHTML = `
        <img alt="">
        <div class="role-label"></div>
        <div class="action-container">
            <div class="mini-btn btn-del" title="Delete"><span class="material-symbols-outlined">delete</span></div>
            <div class="mini-btn btn-remix" title="Remix"><span class="material-symbols-outlined">refresh</span></div>
            <div class="mini-btn btn-color" title="Cycle Color"><span class="material-symbols-outlined">palette</span></div>
            <div class="mini-btn btn-copy" title="Copy to Clipboard"><span class="material-symbols-outlined">content_copy</span></div>
        </div>
    `;
    const label = wrap.querySelector('.role-label');
    label.textContent = role;                       // textContent: no HTML injection from AI/share data
    label.contentEditable = String(!state.viewMode);
    wrap.querySelector('img').alt = role;

    updateImage(wrap);
    attachEvents(wrap);
    return wrap;
}

function updateImage(wrap) {
    const img = wrap.querySelector('img');
    const { src, transform } = resolveAvatarImage(wrap);
    if (img.getAttribute('src') !== src) img.src = src;
    img.style.transform = transform;
}

function updateAllImages() {
    grid.querySelectorAll('.img-wrap').forEach(updateImage);
}

function removeAvatar(wrap) {
    // Collapse width so the row closes up smoothly
    wrap.style.transition = 'all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)';
    wrap.style.transform = 'scale(0.3)';
    wrap.style.opacity = '0';
    wrap.style.width = '0';
    wrap.style.marginLeft = '-15px';
    wrap.style.marginRight = '-15px';
    wrap.style.overflow = 'hidden';
    setTimeout(() => wrap.remove(), 220);
}

function remixAvatar(wrap) {
    const img = wrap.querySelector('img');
    const role = wrap.querySelector('.role-label').innerText;
    wrap.dataset.id = rndId();
    wrap.dataset.seed = newSeed(role);
    updateImage(wrap);
    const base = img.style.transform || '';
    img.animate([
        { opacity: 0, transform: `${base} rotate(-20deg) scale(0.85)` },
        { opacity: 1, transform: `${base} rotate(0deg) scale(1)` }
    ], { duration: 280, easing: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)' });
}

function attachEvents(wrap) {
    // Drag to reorder
    wrap.addEventListener('dragstart', e => {
        if (state.viewMode) { e.preventDefault(); return; }
        state.dragEl = wrap; wrap.style.opacity = '0.5';
    });
    wrap.addEventListener('dragend', () => { wrap.style.opacity = '1'; state.dragEl = null; });
    wrap.addEventListener('dragover', e => e.preventDefault());
    wrap.addEventListener('drop', e => {
        e.stopPropagation();
        if (state.dragEl && state.dragEl !== wrap && state.dragEl.classList.contains('img-wrap')) {
            const arr = Array.from(grid.children);
            if (arr.indexOf(state.dragEl) < arr.indexOf(wrap)) grid.insertBefore(state.dragEl, wrap.nextSibling);
            else grid.insertBefore(state.dragEl, wrap);
        }
    });

    // Click image to copy
    wrap.addEventListener('click', (e) => {
        if (e.target.isContentEditable || e.target.closest('.mini-btn')) return;
        handleCopy(wrap);
    });

    wrap.querySelector('.btn-copy').onclick = (e) => { e.stopPropagation(); handleCopy(wrap); };
    wrap.querySelector('.btn-del').onclick = (e) => { e.stopPropagation(); removeAvatar(wrap); };
    wrap.querySelector('.btn-remix').onclick = (e) => { e.stopPropagation(); remixAvatar(wrap); };
    wrap.querySelector('.btn-color').onclick = (e) => {
        e.stopPropagation();
        // Line styles: cycle this card's ink. Other styles: cycle its background.
        if (isLineStyle()) {
            const idx = CONFIG.inkColors.indexOf(inkFor(wrap));
            setCardInk(wrap, CONFIG.inkColors[(idx + 1) % CONFIG.inkColors.length]);
            updateImage(wrap);
            return;
        }
        const current = wrap.style.getPropertyValue('--avatar-bg');
        const idx = Math.max(0, CONFIG.bgColors.indexOf(current));
        wrap.style.setProperty('--avatar-bg', CONFIG.bgColors[(idx + 1) % CONFIG.bgColors.length]);
    };
}

// Replace the board with a fresh batch (AI generation)
function renderNewBatch(roles) {
    grid.querySelectorAll('.img-wrap').forEach(el => el.remove());
    roles.forEach((role, i) => {
        const av = createAvatar({ role, id: rndId() }, i);
        av.style.animationDelay = (i * 0.1) + 's';
        grid.insertBefore(av, addCard);
        av.animate([{ transform: 'scale(0)' }, { transform: 'scale(1)' }],
                   { duration: 400, delay: i * 50, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)', fill: 'backwards' });
    });
    showToast(`Generated ${roles.length} Personas`);
}

// --- Segmented controls ---------------------------------------------------
function setupToggle(id, callback) {
    const opts = document.getElementById(id).querySelectorAll('.segment-opt');
    opts.forEach(opt => {
        opt.onclick = () => {
            opts.forEach(o => o.classList.remove('active'));
            opt.classList.add('active');
            callback(opt.dataset.val);
        };
    });
}

const STYLE_NAMES = { avataaars: 'Modern', line: 'Line', ink: 'Ink', pixel: 'Pixel Art' };

setupToggle('styleControl', (val) => {
    state.avatarStyle = val;
    const isPixel = val === 'pixel';
    document.body.classList.toggle('pixel-theme', isPixel);
    document.body.classList.toggle('line-theme', isLineStyle());
    const inkGroup = document.getElementById('inkGroup');
    if (inkGroup) inkGroup.hidden = !isLineStyle();
    document.getElementById('shapeControl').style.display = isPixel ? 'none' : 'flex';
    document.getElementById('viewControl').style.display = isPixel ? 'flex' : 'none';
    document.getElementById('viewShapeLabel').innerText = isPixel ? 'View' : 'Shape';
    scheduleBarLayout();
    updateAllImages();
    showToast(`Switched to ${STYLE_NAMES[val]} style`);
});

setupToggle('shapeControl', (val) => {
    document.body.classList.toggle('shape-circle', val === 'circle');
    document.body.classList.toggle('shape-oval', val === 'oval');
    if (isLineStyle()) updateAllImages();   // line styles draw their own frame
});

// --- Ink colour (Line and Ink styles) --------------------------------------
function setCardInk(wrap, ink) {
    if (ink) wrap.dataset.ink = ink; else delete wrap.dataset.ink;
    if (ink) wrap.style.setProperty('--ink', ink); else wrap.style.removeProperty('--ink');
}

// Picking a board ink recolours everyone, clearing per-card colours
function setInk(ink, { silent = false } = {}) {
    if (!/^#[0-9a-f]{6}$/i.test(ink)) return;
    state.ink = ink.toLowerCase();
    document.documentElement.style.setProperty('--board-ink', state.ink);
    const preset = CONFIG.inkColors.includes(state.ink);
    document.querySelectorAll('#inkControl .ink-swatch').forEach(sw => {
        sw.classList.toggle('active', sw.dataset.ink ? sw.dataset.ink === state.ink : !preset);
    });
    const custom = document.getElementById('inkPicker');
    if (custom) {
        custom.value = state.ink;
        custom.parentElement.style.setProperty('--sw', preset ? '' : state.ink);
    }
    grid.querySelectorAll('.img-wrap').forEach(w => setCardInk(w, null));
    if (!silent) updateAllImages();
}

(function buildInkSwatches() {
    const control = document.getElementById('inkControl');
    if (!control) return;   // a cached older index.html without the ink picker
    const custom = control.querySelector('.ink-custom');
    CONFIG.inkColors.forEach(ink => {
        const sw = document.createElement('button');
        sw.className = 'ink-swatch';
        sw.dataset.ink = ink;
        sw.title = ink;
        sw.style.setProperty('--sw', ink);
        sw.onclick = () => setInk(ink);
        control.insertBefore(sw, custom);
    });
    document.getElementById('inkPicker').oninput = (e) => setInk(e.target.value);
    setInk(state.ink, { silent: true });
})();

setupToggle('viewControl', (val) => {
    document.body.setAttribute('data-view', val);
    updateAllImages();
});

setupToggle('labelControl', (val) => {
    document.body.classList.toggle('hide-labels', val === 'hide');
});

// --- Theme: one day/night toggle in the top bar ---------------------------
function setDarkMode(isDark) {
    state.darkMode = isDark;
    document.body.classList.toggle('dark-mode', isDark);
    document.documentElement.style.setProperty('--bg-color', isDark ? '#0f172a' : '#ffffff');
    // the icon shows where a click takes you
    document.getElementById('themeIcon').textContent = isDark ? 'light_mode' : 'dark_mode';
    document.getElementById('themeBtn').title = isDark ? 'Light Mode' : 'Dark Mode';
    updateShadows();
}
document.getElementById('themeBtn').onclick = () => setDarkMode(!state.darkMode);

// --- Sliders --------------------------------------------------------------
function addSlideListeners(slider, cssVar) {
    const start = () => document.body.classList.add('sliding-active');
    const end = () => document.body.classList.remove('sliding-active');
    slider.addEventListener('pointerdown', start);
    slider.addEventListener('pointerup', end);
    slider.addEventListener('change', end);
    slider.addEventListener('input', (e) => {
        document.documentElement.style.setProperty(cssVar, e.target.value + 'px');
    });
}
addSlideListeners(document.getElementById('sizeSlider'), '--avatar-size');
addSlideListeners(document.getElementById('fontSlider'), '--label-size');

function updateShadows() {
    let value = 'none';
    if (state.shadows) {
        value = state.darkMode
            ? 'var(--shadow-dark-preset)'
            : `drop-shadow(0 4px 8px ${document.getElementById('shadowColorPicker').value}80)`;
    }
    document.documentElement.style.setProperty('--avatar-shadow', value);
}

// --- Top bar --------------------------------------------------------------
document.getElementById('partyBtn').onclick = function () {
    state.partyMode = !state.partyMode;
    this.classList.toggle('active', state.partyMode);
    document.body.classList.toggle('party-active', state.partyMode);
    this.querySelector('.briefcase-icon').style.display = state.partyMode ? 'none' : 'block';
    this.querySelector('.party-icon').style.display = state.partyMode ? 'block' : 'none';
    state.partyMode ? confetti.start() : confetti.stop();
    updateAllImages();
    showToast(state.partyMode ? "Party Mode!" : "Business Mode");
};

document.getElementById('shareBtn').onclick = copyShareLink;
document.getElementById('viewBtn').onclick = () => setViewMode(!state.viewMode);

function setViewMode(isView, { silent = false } = {}) {
    state.viewMode = isView;
    document.body.classList.toggle('view-mode', isView);
    document.getElementById('viewBtn').classList.toggle('active', isView);
    const editable = String(!isView);
    document.getElementById('siteTitle').contentEditable = editable;
    document.querySelectorAll('.role-label').forEach(el => el.contentEditable = editable);
    if (!silent) showToast(isView ? "View Mode" : "Edit Mode");
}

// Double-click a label or the title while in view mode → back to edit mode
function checkEditTrigger() {
    if (state.viewMode) setViewMode(false);
}
document.getElementById('siteTitle').addEventListener('dblclick', checkEditTrigger);
grid.addEventListener('dblclick', (e) => {
    if (e.target.classList.contains('role-label')) checkEditTrigger();
});

// --- Animation pause ------------------------------------------------------
function toggleAnimation() {
    state.isPaused = !state.isPaused;
    document.body.classList.toggle('animations-paused', state.isPaused);
    document.getElementById('pauseIcon').textContent = state.isPaused ? 'play_arrow' : 'pause';
    document.getElementById('pauseBtn').classList.toggle('paused', state.isPaused);
    showToast(state.isPaused ? "Animations Paused" : "Animations Resumed");
}
document.getElementById('pauseBtn').onclick = toggleAnimation;

document.addEventListener('keydown', (e) => {
    const tag = e.target.tagName.toLowerCase();
    const isInput = tag === 'input' || tag === 'textarea' || tag === 'select' || e.target.isContentEditable;
    if (e.code === 'Space' && !isInput) {
        e.preventDefault();
        toggleAnimation();
    }
    // Enter commits a label/title edit instead of adding a newline
    if (e.key === 'Enter' && e.target.isContentEditable) {
        e.preventDefault();
        e.target.blur();
    }
});

// --- Bottom bar popovers: settings and the ••• overflow menu ---------------
const settingsBtn = document.getElementById('settingsBtn');
const settingsPanel = document.getElementById('settingsPanel');
const moreBtn = document.getElementById('moreBtn');
const morePanel = document.getElementById('morePanel');

function setPopover(btn, panel, open) {
    panel.classList.toggle('active', open);
    btn.classList.toggle('active', open);
}
settingsBtn.onclick = (e) => {
    e.stopPropagation();
    setPopover(moreBtn, morePanel, false);
    setPopover(settingsBtn, settingsPanel, !settingsPanel.classList.contains('active'));
};
moreBtn.onclick = (e) => {
    e.stopPropagation();
    setPopover(settingsBtn, settingsPanel, false);
    setPopover(moreBtn, morePanel, !morePanel.classList.contains('active'));
};
document.addEventListener('click', (e) => {
    if (!settingsPanel.contains(e.target) && !settingsBtn.contains(e.target)) setPopover(settingsBtn, settingsPanel, false);
    if (!morePanel.contains(e.target) && !moreBtn.contains(e.target)) setPopover(moreBtn, morePanel, false);
});

// --- Bottom bar layout ----------------------------------------------------
// CSS shrinks the bar first (tighter gaps, no group labels). If the controls still don't
// fit, groups marked data-collapse fold into the ••• menu, lowest number first. Whatever
// still doesn't fit scrolls: the row is left-aligned and overflows to the right.
const barScroll = document.getElementById('barScroll');
const barInner = document.getElementById('barInner');
const moreWrap = document.getElementById('moreWrap');
const barOrder = Array.from(barInner.children);
const foldOrder = barOrder
    .filter(el => el.dataset.collapse)
    .sort((a, b) => a.dataset.collapse - b.dataset.collapse);

const overflowing = () => barScroll.scrollWidth > barScroll.clientWidth + 1;

function layoutBar() {
    barOrder.forEach(el => barInner.appendChild(el));   // everything back in the bar, in order
    moreWrap.hidden = true;
    for (const el of foldOrder) {
        if (!overflowing()) break;
        moreWrap.hidden = false;                          // the ••• button takes room too
        morePanel.appendChild(el);
    }
    // menu rows follow the bar's order
    Array.from(morePanel.children)
        .sort((a, b) => barOrder.indexOf(a) - barOrder.indexOf(b))
        .forEach(el => morePanel.appendChild(el));
    if (!morePanel.children.length) {
        moreWrap.hidden = true;
        setPopover(moreBtn, morePanel, false);
    }
    updateBarFade();
}

// fade the right edge only while there's more to scroll to
function updateBarFade() {
    const atEnd = barScroll.scrollLeft + barScroll.clientWidth >= barScroll.scrollWidth - 1;
    barScroll.classList.toggle('fits', !overflowing() || atEnd);
}

let barFrame = 0;
function scheduleBarLayout() {
    cancelAnimationFrame(barFrame);
    barFrame = requestAnimationFrame(layoutBar);
}
window.addEventListener('resize', scheduleBarLayout);
barScroll.addEventListener('scroll', updateBarFade, { passive: true });
if (document.fonts) document.fonts.ready.then(scheduleBarLayout);   // icon font changes widths
scheduleBarLayout();

document.getElementById('copyFormatSelect').onchange = (e) => { state.copyFormat = e.target.value; };
document.getElementById('bgThemeSelect').onchange = (e) => document.body.setAttribute('data-theme', e.target.value);
document.getElementById('shadowColorPicker').oninput = updateShadows;
document.getElementById('shadowToggle').onclick = function () {
    state.shadows = !state.shadows;
    this.classList.toggle('on', state.shadows);
    updateShadows();
};

document.getElementById('downloadAllBtn').onclick = downloadAll;

// --- AI generator ---------------------------------------------------------
initAIGenerator({ onRoles: renderNewBatch });

// --- Init -----------------------------------------------------------------
(function init() {
    suppressToasts = true;
    const { roster, error } = readSharedState();
    suppressToasts = false;

    grid.innerHTML = '';
    grid.appendChild(addCard);
    roster.forEach((d, i) => grid.insertBefore(createAvatar(d, i), addCard));

    if (error) showToast("Error loading shared config");
})();
