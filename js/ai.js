// ==========================================================================
// AI persona generation (Gemini)
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

async function fetchPersonaRoles(topic, count, apiKey) {
    const response = await fetch(CONFIG.ai.endpoint(CONFIG.ai.model), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
        body: JSON.stringify({
            contents: [{ parts: [{ text: `Input: ${topic}. Amount: ${count}` }] }],
            systemInstruction: { parts: [{ text: CONFIG.ai.systemPrompt }] }
        })
    });
    if (!response.ok) throw new Error(`API Request Failed (${response.status})`);

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error("Invalid Response Data");
    return text.split(',').map(s => s.trim()).filter(Boolean).slice(0, count);
}

function initAIGenerator({ onRoles }) {
    const generateBtn = document.getElementById('generateBtn');
    const panel = document.getElementById('generatePanel');
    const submitBtn = document.getElementById('submitGenBtn');
    const countRange = document.getElementById('genCountRange');
    const countDisplay = document.getElementById('genCountDisplay');
    const topicInput = document.getElementById('genTopic');
    const keyRow = document.getElementById('genKeyRow');
    const keyInput = document.getElementById('genApiKey');
    const keyReset = document.getElementById('genKeyReset');
    const loadingMsg = document.getElementById('loading-msg');
    const gridEl = document.getElementById('grid');

    let sessionKey = getApiKey();
    const syncKeyUI = () => {
        keyRow.classList.toggle('hidden', !!sessionKey);
        keyReset.classList.toggle('hidden', !sessionKey);
    };
    syncKeyUI();

    const close = () => { panel.classList.remove('active'); generateBtn.classList.remove('active'); };

    generateBtn.onclick = (e) => {
        e.stopPropagation();
        panel.classList.toggle('active');
        generateBtn.classList.toggle('active');
        if (panel.classList.contains('active')) setTimeout(() => (sessionKey ? topicInput : keyInput).focus(), 50);
    };

    keyReset.onclick = () => { sessionKey = ''; setApiKey(''); keyInput.value = ''; syncKeyUI(); keyInput.focus(); };
    countRange.oninput = (e) => countDisplay.innerText = e.target.value;
    topicInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') submitBtn.click(); });

    document.addEventListener('click', (e) => {
        if (!panel.contains(e.target) && !generateBtn.contains(e.target)) close();
    });

    const showGrid = () => { gridEl.style.opacity = '1'; gridEl.style.pointerEvents = 'auto'; };

    submitBtn.onclick = async () => {
        if (!sessionKey) {
            const typed = keyInput.value.trim();
            if (!typed) { showToast("Add a Gemini API key first"); keyInput.focus(); return; }
            sessionKey = typed;
            setApiKey(typed);
            syncKeyUI();
        }
        const topic = topicInput.value.trim();
        if (!topic) { showToast("Please enter a topic"); topicInput.focus(); return; }
        const count = parseInt(countRange.value, 10);

        close();
        submitBtn.disabled = true;
        // Fade out grid, then show loader
        gridEl.style.opacity = '0';
        gridEl.style.pointerEvents = 'none';
        setTimeout(() => loadingMsg.classList.add('active'), 300);

        try {
            const roles = await fetchPersonaRoles(topic, count, sessionKey);
            setTimeout(() => {               // minimum view time for the loader
                loadingMsg.classList.remove('active');
                setTimeout(() => { onRoles(roles); showGrid(); }, 400);
            }, 1000);
        } catch (err) {
            console.error(err);
            loadingMsg.classList.remove('active');
            setTimeout(showGrid, 300);
            const authFail = /\((400|401|403)\)/.test(err.message);
            showToast(authFail ? "Generation Failed — check API key" : "Generation Failed");
        } finally {
            submitBtn.disabled = false;
        }
    };
}
