// ==========================================================================
// Configuration & shared state
// ==========================================================================

// Number of pre-downloaded random avatars in assets/random_business and
// assets/random_party (avatar_0.svg … avatar_59.svg).
const AVATAR_COUNT = 60;

const CONFIG = {
    common: {
        roles: ['CISO', 'Engineer', 'Hunter', 'Analyst', 'Admin', 'Architect', 'Forensics', 'IR', 'Manager']
    },
    bgColors: ['#4da667', '#f6cf64', '#a9accd', '#e0e0e0'],
    // Ink colours for the Line and Ink styles (first is the default)
    inkColors: ['#2b3fbf', '#1e2430', '#c2353b', '#1d7a4c', '#6a3fd0', '#d4600f'],

    // AI persona generation (Gemini). The key is entered in the UI and kept in
    // this browser's localStorage only — it is never written to the repo.
    ai: {
        model: 'gemini-2.5-flash',
        endpoint: (model) => `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        storageKey: 'peeps.geminiApiKey',
        systemPrompt: `Act as a Senior Product Designer and UX Researcher. I will provide a product area and a target number. Based on industry standards, identify the top critical user personas. Return only a simple, comma-separated list of role names matching the requested amount.
Constraint: Each name must be a SINGLE WORD (e.g., "Hacker", "Doctor", "Analyst"). No spaces allowed in titles. Simplify complex titles to their core role. Max 12 chars per name.`
    }
};

// Default roster — `id` maps to assets/roster/<id>_<business|party>.svg;
// `seed` picks the generated face (Line, Ink and Pixel styles)
const INITIAL_ROSTER = [
    { role: "CISO", id: "CISO", seed: "CISO60" },
    { role: "Engineer", id: "Engineer", seed: "Engineer229" },
    { role: "Hunter", id: "Hunter", seed: "Hunter259" },
    { role: "Investigator", id: "Investigator", seed: "Investigator1631" },
    { role: "Manager", id: "Manager", seed: "Manager85" },
    { role: "Analyst", id: "Analyst_Sr", seed: "Analyst_Sr78" },
    { role: "Developer", id: "Developer", seed: "Developer1182" },
    { role: "Admin", id: "Admin", seed: "Admin0" },
    { role: "Analyst", id: "Analyst_Jr", seed: "Analyst_Jr411" },
    { role: "Architect", id: "Architect", seed: "Architect1129" },
    { role: "Forensics", id: "Forensics", seed: "Forensics243" },
    { role: "IR", id: "IR", seed: "IR522" }
];

const state = {
    partyMode: false,
    viewMode: false,
    darkMode: false,
    shadows: false,
    isPaused: false,
    copyFormat: 'png',
    avatarStyle: 'avataaars',   // 'avataaars' (local SVGs) | 'line' | 'ink' (line-art.js) | 'pixel' (generated)
    ink: '#2b3fbf',             // board-wide ink for line/ink; a card's data-ink overrides it
    dragEl: null
};
