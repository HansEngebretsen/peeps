// ==========================================================================
// Avatar sources — resolves which image an avatar shows for the current style
// ==========================================================================

const rnd = (arr) => arr[Math.floor(Math.random() * arr.length)];
const rndId = () => Math.floor(Math.random() * AVATAR_COUNT);
const newSeed = (role) => (role || 'peep') + Math.random().toString(36).substring(2, 9);

function isRandomId(id) {
    return typeof id === 'number' || (typeof id === 'string' && id.trim() !== '' && !isNaN(id));
}

// Smooth style: pre-downloaded SVGs in assets/
function getAvatarSrc(id, isParty) {
    const mode = isParty ? 'party' : 'business';
    if (isRandomId(id)) return `assets/random_${mode}/avatar_${id}.svg`;
    return `assets/roster/${id}_${mode}.svg`;
}

const isLineStyle = () => state.avatarStyle === 'line' || state.avatarStyle === 'ink';
const getShape = () => document.body.classList.contains('shape-circle') ? 'circle' : 'oval';
const inkFor = (wrap) => wrap.dataset.ink || state.ink;

// Options for buildLineSVG for a wrap in the current style/mode
function lineOptions(wrap, size) {
    return { variant: state.avatarStyle, ink: inkFor(wrap), party: state.partyMode, shape: getShape(), size };
}

function getViewType() {
    return document.body.getAttribute('data-view') || 'full';
}

// Returns { src, transform } for a wrap in the current global style/mode
function resolveAvatarImage(wrap) {
    if (isLineStyle()) {
        if (!wrap.dataset.seed) wrap.dataset.seed = newSeed(wrap.querySelector('.role-label')?.innerText);
        return { src: lineDataUrl(wrap.dataset.seed, lineOptions(wrap)), transform: '' };
    }
    if (state.avatarStyle === 'pixel') {
        if (!wrap.dataset.seed) wrap.dataset.seed = newSeed(wrap.querySelector('.role-label')?.innerText);
        const view = getViewType();
        return {
            src: pixelDataUrl(wrap.dataset.seed, state.partyMode, view),
            transform: view === 'full' ? 'scale(1.2) translateY(-4px)' : 'scale(1.1) translateY(2px)'
        };
    }
    return { src: getAvatarSrc(wrap.dataset.id, state.partyMode), transform: '' };
}
