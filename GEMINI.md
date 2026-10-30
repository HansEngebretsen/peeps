# Project Context: Security Avatars Studio

## Overview
A static HTML/CSS/JS app for generating and managing security role avatars ("peeps").

## Architecture
- `index.html` — markup only.
- `css/styles.css` — all styles (CSS variables for theming, light/dark, canvas themes, pixel theme).
- `js/` — plain scripts loaded in order from `index.html` (no modules, no build step):
  - `config.js` — `CONFIG`, `INITIAL_ROSTER`, global `state`, AI settings.
  - `avatars.js` — resolves an avatar's image (local SVGs or pixel art).
  - `pixel-art.js` — deterministic pixel-art SVG generator.
  - `line-art.js` — deterministic one-ink line-art SVG generator (Line and Ink styles share its parts).
  - `export.js` — PNG card rendering, clipboard copy, zip download.
  - `confetti.js` — party-mode confetti.
  - `ai.js` — Gemini persona generation (API key kept in browser localStorage).
  - `share.js` — share-link serialise/restore (`?data=`).
  - `app.js` — grid, avatar cards, controls, init.
- `assets/` — pre-downloaded avatar SVGs (`roster/`, `random_business/`, `random_party/`).
- `server.sh` — runs a local static server (`./server.sh [port]`).

## Tech Stack
- Vanilla HTML5, CSS3, JavaScript (ES2020+).
- External: Google Material Symbols + VT323 fonts, JSZip & FileSaver (cdnjs), Gemini API (optional).

## Conventions
- No build tools unless explicitly requested.
- Avatar images come from local `assets/`, not remote APIs.
- Use CSS variables for theming.
- Serve over HTTP (`./server.sh`) — copy/export fetch local SVGs, which `file://` blocks.
