// ==========================================================================
// AI persona generation
// A Gemini API key when one is saved (faster); otherwise Chrome's on-device
// model (Prompt API / Gemini Nano). With neither, the popover only asks for a key.
// ==========================================================================

function getApiKey() {
    try { return localStorage.getItem(CONFIG.ai.storageKey) || ''; } catch { return ''; }
}
function setApiKey(key) {
    try {
        if (key) localStorage.setItem(CONFIG.ai.storageKey, key);
        else localStorage.removeItem(CONFIG.ai.storageKey);
    } catch { /* storage unavailable — key lives for this page only */ }
}

const LOCAL_OPTS = {
    expectedInputs: [{ type: 'text', languages: ['en'] }],
    expectedOutputs: [{ type: 'text', languages: ['en'] }]
};

// 'available' | 'downloadable' | 'downloading' | 'unavailable'
async function localAvailability() {
    if (!('LanguageModel' in self)) return 'unavailable';
    try { return await LanguageModel.availability(LOCAL_OPTS); } catch { return 'unavailable'; }
}

// Accepts a JSON array or a plain comma/line list (models don't always obey the format)
function parseRoles(text, count) {
    let list;
    try { list = JSON.parse(text); } catch { list = text.split(/[,\n]/); }
    if (!Array.isArray(list)) list = String(text).split(/[,\n]/);
    return list.map(s => String(s).replace(/^.*:/, '').replace(/^[\s\-*•\d.)"']+|[\s."']+$/g, '')).filter(Boolean).slice(0, count);
}

const promptFor = (topic, count) => `Input: ${topic}. Amount: ${count}`;

async function fetchRolesLocal(topic, count) {
    const session = await LanguageModel.create({
        ...LOCAL_OPTS,
        initialPrompts: [{ role: 'system', content: CONFIG.ai.systemPrompt }]
    });
    try {
        const text = await session.prompt(promptFor(topic, count), {
            responseConstraint: { type: 'array', items: { type: 'string' } }
        });
        return parseRoles(text, count);
    } finally {
        session.destroy();
    }
}

async function fetchRolesWithKey(topic, count, apiKey) {
    const response = await fetch(CONFIG.ai.endpoint(CONFIG.ai.model), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
        body: JSON.stringify({
            contents: [{ parts: [{ text: promptFor(topic, count) }] }],
            systemInstruction: { parts: [{ text: CONFIG.ai.systemPrompt }] }
        })
    });
    if (!response.ok) throw new Error(`API Request Failed (${response.status})`);

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error("Invalid Response Data");
    return parseRoles(text, count);
}

function initAIGenerator({ onRoles }) {
    const $ = (id) => document.getElementById(id);
    const generateBtn = $('generateBtn');
    const panel = $('generatePanel');
    const keyStep = $('genKeyStep');
    const keyMsg = $('genKeyMsg');
    const keyInput = $('genApiKey');
    const keySave = $('genKeySave');
    const installBtn = $('genInstall');
    const keyBack = $('genKeyBack');
    const makeStep = $('genMakeStep');
    const topicInput = $('genTopic');
    const countInput = $('genCount');
    const submitBtn = $('submitGenBtn');
    const sourceNote = $('genSourceNote');
    const settingsKey = $('settingsKey');
    const settingsEye = $('settingsKeyEye');
    const loadingMsg = $('loading-msg');
    const gridEl = $('grid');

    let sessionKey = getApiKey();
    let local = 'unavailable';
    let progress = 0;
    let addingKey = false;   // on-device works, but the person chose "Add a key"

    // A key is faster, so it wins when there is one; Chrome's on-device model otherwise
    const engine = () => (sessionKey ? 'key' : local === 'available' ? 'local' : null);

    const sync = () => {
        const e = engine();
        const showKey = !e || addingKey;
        keyStep.hidden = !showKey;
        makeStep.hidden = showKey;
        keyBack.hidden = !e;
        installBtn.hidden = local !== 'downloadable';
        keyMsg.textContent = e ? 'Add a Gemini API key to make peeps faster.'
            : local === 'downloading' ? `Chrome is downloading its on-device model (${progress}%). Add a key to start now.`
            : 'You need a Gemini API key to make peeps.';
        const note = e === 'local' ? 'Uses Chrome’s on-device model, which can be slow. <button type="button" data-go="key">Add a key</button> to speed things up.'
            : e === 'key' ? 'Uses your Gemini API key. <button type="button" data-go="settings">Change it in Settings</button>'
            : '';
        if (sourceNote.innerHTML !== note) sourceNote.innerHTML = note;
        settingsKey.value = sessionKey;
    };

    const saveKey = (key) => {
        sessionKey = key.trim();
        setApiKey(sessionKey);
        addingKey = false;
        sync();
    };

    const refresh = async () => { local = await localAvailability(); sync(); };
    refresh();

    const focusStep = () => setTimeout(() => (keyStep.hidden ? topicInput : keyInput).focus(), 50);
    const close = () => { panel.classList.remove('active'); generateBtn.classList.remove('active'); addingKey = false; };

    generateBtn.onclick = (e) => {
        e.stopPropagation();
        const opening = !panel.classList.contains('active');
        if (!opening) { close(); return; }
        panel.classList.add('active');
        generateBtn.classList.add('active');
        sync();
        focusStep();
        refresh();   // the model may have finished downloading since last time
    };

    // create() needs a click (user activation) to start the download
    installBtn.onclick = async () => {
        local = 'downloading';
        progress = 0;
        sync();
        try {
            const s = await LanguageModel.create({
                ...LOCAL_OPTS,
                monitor(m) {
                    m.addEventListener('downloadprogress', (ev) => {
                        progress = Math.round(ev.loaded * 100);
                        sync();
                    });
                }
            });
            s.destroy();
            showToast("On-device model ready");
        } catch (err) {
            console.error(err);
            showToast("Download failed");
        }
        await refresh();
        focusStep();
    };

    keySave.onclick = () => {
        if (!keyInput.value.trim()) { keyInput.focus(); return; }
        saveKey(keyInput.value);
        keyInput.value = '';
        showToast("Gemini key saved");
        focusStep();
    };
    keyInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') keySave.click(); });
    keyBack.onclick = () => { addingKey = false; sync(); focusStep(); };

    sourceNote.onclick = (e) => {
        const go = e.target.dataset?.go;
        if (!go) return;
        e.stopPropagation();   // the step swaps under the click; don't let the document read it as an outside click
        if (go === 'key') { addingKey = true; sync(); focusStep(); }
        if (go === 'settings') {
            close();
            $('settingsBtn').click();
            setTimeout(() => settingsKey.focus(), 50);
        }
    };

    // Settings shows the saved key; editing it there updates it everywhere, clearing it removes it
    settingsKey.addEventListener('change', () => { saveKey(settingsKey.value); showToast(sessionKey ? "Gemini key updated" : "Gemini key removed"); });
    settingsKey.addEventListener('keydown', (e) => { if (e.key === 'Enter') settingsKey.blur(); });
    settingsEye.onclick = () => {
        const show = settingsKey.type === 'password';
        settingsKey.type = show ? 'text' : 'password';
        settingsEye.title = show ? 'Hide key' : 'Show key';
        settingsEye.querySelector('span').textContent = show ? 'visibility_off' : 'visibility';
    };

    const countLabel = () => { const n = +countInput.value; submitBtn.textContent = `Make ${n} ${n === 1 ? 'peep' : 'peeps'}`; };
    countInput.addEventListener('input', countLabel);
    countLabel();
    topicInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') submitBtn.click(); });

    document.addEventListener('click', (e) => {
        if (!panel.contains(e.target) && !generateBtn.contains(e.target)) close();
    });

    const showGrid = () => { gridEl.style.opacity = '1'; gridEl.style.pointerEvents = 'auto'; };

    submitBtn.onclick = async () => {
        const e = engine();
        if (!e) return;
        const topic = topicInput.value.trim();
        if (!topic) { showToast("Describe your peeps first"); topicInput.focus(); return; }
        const count = +countInput.value;

        close();
        submitBtn.disabled = true;
        // Fade out grid, then show loader
        gridEl.style.opacity = '0';
        gridEl.style.pointerEvents = 'none';
        setTimeout(() => loadingMsg.classList.add('active'), 300);

        try {
            let roles;
            if (e === 'key') {
                // a bad or rate-limited key falls back to the on-device model when there is one
                try { roles = await fetchRolesWithKey(topic, count, sessionKey); }
                catch (err) { if (local !== 'available') throw err; console.warn('Gemini key failed, using the on-device model', err); }
            }
            if (!roles?.length && local === 'available') roles = await fetchRolesLocal(topic, count);
            if (!roles?.length) throw new Error("No roles returned");
            setTimeout(() => {               // minimum view time for the loader
                loadingMsg.classList.remove('active');
                setTimeout(() => { onRoles(roles); showGrid(); }, 400);
            }, 1000);
        } catch (err) {
            console.error(err);
            loadingMsg.classList.remove('active');
            setTimeout(showGrid, 300);
            const authFail = /\((400|401|403)\)/.test(err.message);
            showToast(authFail ? "Generation failed — check your key in Settings" : "Generation failed");
        } finally {
            submitBtn.disabled = false;
        }
    };
}

// Self-check for parseRoles (runs once, silent unless broken)
console.assert(
    JSON.stringify(parseRoles('["Analyst","Hunter"]', 5)) === '["Analyst","Hunter"]' &&
    JSON.stringify(parseRoles('1. Analyst, "Hunter".\n- Admin', 2)) === '["Analyst","Hunter"]',
    'parseRoles self-check failed'
);
