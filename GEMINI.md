# Project Context: Security Avatars Studio

## Overview
This is a single-file HTML/CSS/JS application ("onepager") for generating and managing security role avatars.

## Architecture
- **Format:** Single `index.html` file containing all structure, styles, and logic.
- **Tech Stack:** Vanilla HTML5, CSS3 (using CSS Variables for theming), and JavaScript (ES6+).
- **External Dependencies:** 
  - Google Material Symbols (linked via CSS).
  - Avataaars API (for avatar image generation).

## Programming Style
- **Modularity:** Logic is contained within the `<script>` tag at the bottom of the body. Styles are in `<style>` in the head.
- **State Management:** Simple global `state` object.
- **DOM Manipulation:** Direct DOM manipulation (document.createElement, innerHTML, event listeners).
- **No Build Step:** The file is meant to run directly in a browser. Do not introduce build tools (Webpack, etc.) unless explicitly requested.

## Conventions
- Keep it contained in `index.html`.
- Use CSS variables for easy theming (light/dark mode).
- Ensure responsiveness and interactivity (drag & drop, content editable).
