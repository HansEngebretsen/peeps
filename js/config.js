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

// Default roster — `id` maps to assets/roster/<id>_<business|party>.svg
const INITIAL_ROSTER = [
    { role: "CISO", id: "CISO" },
    { role: "Engineer", id: "Engineer" },
    { role: "Hunter", id: "Hunter" },
    { role: "Investigator", id: "Investigator" },
    { role: "Manager", id: "Manager" },
    { role: "Analyst", id: "Analyst_Sr" },
    { role: "Developer", id: "Developer" },
    { role: "Admin", id: "Admin" },
    { role: "Analyst", id: "Analyst_Jr" },
    { role: "Architect", id: "Architect" },
    { role: "Forensics", id: "Forensics" },
    { role: "IR", id: "IR" }
];

const state = {
    partyMode: false,
    viewMode: false,
    darkMode: false,
    shadows: false,
    isPaused: false,
    copyFormat: 'png',
    avatarStyle: 'avataaars',   // 'avataaars' (local SVGs) | 'pixel' (generated)
    dragEl: null
};
