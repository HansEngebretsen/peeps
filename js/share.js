// ==========================================================================
// Share links — serialise the board into ?data= and restore it on load
// ==========================================================================

function getShareState() {
    const roster = [];
    document.querySelectorAll('#grid .img-wrap').forEach(w => {
        roster.push({
            role: w.querySelector('.role-label').innerText,
            id: w.dataset.id,
            seed: w.dataset.seed,
            bg: w.style.getPropertyValue('--avatar-bg')
        });
    });

    return {
        title: document.getElementById('siteTitle').innerText,
        settings: {
            style: state.avatarStyle,
            view: getViewType(),
            darkMode: state.darkMode,
            shadows: state.shadows,
            partyMode: state.partyMode,
            viewMode: true,
            shape: document.body.classList.contains('shape-circle') ? 'circle' : 'oval',
            size: document.getElementById('sizeSlider').value,
            fontSize: document.getElementById('fontSlider').value,
            canvasTheme: document.body.getAttribute('data-theme') || 'clean',
            shadowColor: document.getElementById('shadowColorPicker').value,
            hideLabels: document.body.classList.contains('hide-labels')
        },
        roster
    };
}

async function copyShareLink() {
    const url = new URL(window.location);
    url.searchParams.set('data', JSON.stringify(getShareState()));
    try {
        await navigator.clipboard.writeText(url.toString());
        window.history.replaceState({}, '', url);
        showToast("View Link Copied!");
    } catch {
        showToast("Failed to copy");
    }
}

const clickOpt = (controlId, val) => {
    document.getElementById(controlId)?.querySelector(`[data-val="${val}"]`)?.click();
};

/**
 * Applies any shared settings from the URL and returns the roster to render.
 * Toasts from the replayed clicks are suppressed.
 */
function readSharedState() {
    const dataStr = new URLSearchParams(window.location.search).get('data');
    if (!dataStr) return { roster: INITIAL_ROSTER };

    let data;
    try {
        data = JSON.parse(dataStr);
    } catch {
        try { data = JSON.parse(decodeURIComponent(dataStr)); }  // links made by the old version
        catch (e) {
            console.error("Failed to parse share data", e);
            return { roster: INITIAL_ROSTER, error: true };
        }
    }

    if (data.title) document.getElementById('siteTitle').innerText = data.title;

    const s = data.settings || {};
    const size = s.size || 120, fontSize = s.fontSize || 13;
    document.getElementById('sizeSlider').value = size;
    document.documentElement.style.setProperty('--avatar-size', size + 'px');
    document.getElementById('fontSlider').value = fontSize;
    document.documentElement.style.setProperty('--label-size', fontSize + 'px');

    if (s.canvasTheme) {
        document.getElementById('bgThemeSelect').value = s.canvasTheme;
        document.body.setAttribute('data-theme', s.canvasTheme);
    }
    if (s.shadowColor) document.getElementById('shadowColorPicker').value = s.shadowColor;

    if (s.style) clickOpt('styleControl', s.style);
    if (s.view) clickOpt('viewControl', s.view);
    if (s.darkMode) setDarkMode(true);
    if (s.shape) clickOpt('shapeControl', s.shape);
    clickOpt('labelControl', s.hideLabels ? 'hide' : 'show');
    if (s.partyMode) document.getElementById('partyBtn').click();
    if (s.viewMode) setViewMode(true, { silent: true });
    if (s.shadows) {
        state.shadows = true;
        document.getElementById('shadowToggle').classList.add('on');
        updateShadows();
    }

    return { roster: Array.isArray(data.roster) ? data.roster : INITIAL_ROSTER };
}
