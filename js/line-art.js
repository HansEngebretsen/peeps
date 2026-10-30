// ==========================================================================
// Line-art avatar generator — one-ink badge portraits (deterministic from a seed)
//
// Two styles share every part:
//   'line' — outline only: hair and beards are drawn as shapes on paper
//   'ink'  — the same drawing with hair and beards filled solid in the ink
// Everything is drawn in exactly two colours, the ink and the paper, so any
// ink colour the user picks renders cleanly.
//
// Drawing space is 200×200. The frame (circle or oval) holds the shoulders;
// the head sits on top of the frame and can pop out of it.
// ==========================================================================

const LINE_INK = '#2b3fbf';
const LINE_PAPER = '#ffffff';
const LINE_STROKE = 3.4;

// Frame geometry, by the board's Shape setting
const LINE_FRAMES = {
    circle: { cx: 100, cy: 118, rx: 78, ry: 78 },
    oval:   { cx: 100, cy: 124, rx: 88, ry: 72 }
};

// Small seeded PRNG (FNV-1a hash → mulberry32)
function lineRandom(seedStr) {
    let h = 2166136261;
    for (let i = 0; i < seedStr.length; i++) h = Math.imul(h ^ seedStr.charCodeAt(i), 16777619);
    let a = h >>> 0;
    return () => {
        a = (a + 0x6D2B79F5) >>> 0;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

// Pick a key from { key: weight }
function linePick(random, weights) {
    const entries = Object.entries(weights);
    let r = random() * entries.reduce((s, [, w]) => s + w, 0);
    for (const [k, w] of entries) { if ((r -= w) <= 0) return k; }
    return entries[entries.length - 1][0];
}

// Bumpy outline along an arc (curls, afros). Angles in degrees, 270 = straight up.
function lineScallop(cx, cy, r, from, to, bumps, amp) {
    const pt = (a, rad) => {
        const t = a * Math.PI / 180;
        return `${(cx + rad * Math.cos(t)).toFixed(1)} ${(cy + rad * Math.sin(t)).toFixed(1)}`;
    };
    const step = (to - from) / bumps;
    let d = `M ${pt(from, r)}`;
    for (let i = 0; i < bumps; i++) {
        const a = from + step * i;
        d += ` Q ${pt(a + step / 2, r + amp)} ${pt(a + step, r)}`;
    }
    return d;
}

// --- The person's features, chosen once per seed ----------------------------
// Rolls are made in a fixed order so a seed always gives the same person.
function lineTraits(seedStr) {
    const random = lineRandom(seedStr || 'peep');
    const hair = linePick(random, {
        bald: 7, crop: 13, quiff: 10, sweep: 10, curly: 10, bun: 8,
        bob: 10, long: 9, wavy: 8, afro: 8, hijab: 6
    });
    const beardable = ['bald', 'crop', 'quiff', 'sweep', 'curly'].includes(hair);
    const beardRoll = linePick(random, { full: 30, short: 25, goatee: 20, mustache: 15 });
    const beard = beardable && random() < 0.55 ? beardRoll : 'none';
    const top = linePick(random, { crew: 24, vneck: 18, hoodie: 16, collar: 16, jacket: 16, bowtie: 10 });
    const glassesRoll = random();
    const glasses = glassesRoll < 0.2 ? 'round' : glassesRoll < 0.34 ? 'square' : 'none';
    const headband = hair === 'afro' && random() < 0.5;
    const wave = random() < 0.07;
    return { hair, beard, top, glasses, headband, wave };
}

/**
 * Build a line-art avatar SVG string.
 * @param {string} seedStr  same seed always gives the same person
 * @param {object} opts
 * @param {'line'|'ink'} [opts.variant] outline hair, or solid ink hair
 * @param {string} [opts.ink]           the one ink colour
 * @param {boolean} [opts.party]        party hat and a big grin
 * @param {'circle'|'oval'} [opts.shape] frame shape
 * @param {{width?:number,height?:number}} [opts.size] explicit pixel size (for canvas export)
 */
function buildLineSVG(seedStr, opts = {}) {
    const t = lineTraits(seedStr);
    const solid = opts.variant === 'ink';
    const ink = opts.ink || LINE_INK;
    const paper = LINE_PAPER;
    const f = LINE_FRAMES[opts.shape] || LINE_FRAMES.circle;
    const uid = 'p' + Math.floor(lineRandom(seedStr + (opts.variant || ''))() * 1e8).toString(36);

    // Paint helpers. "Mass" is hair: paper in line, ink in ink. "On mass" is a detail
    // drawn over hair or a beard, which flips to paper when the mass is solid.
    const massFill = solid ? ink : paper;
    const onMass = solid ? paper : ink;
    const shape = (d) => `<path d="${d}" fill="${paper}"/>`;
    const mass = (d) => `<path d="${d}" fill="${massFill}"/>`;
    const line = (d, extra = '') => `<path d="${d}"${extra}/>`;
    const detail = (d) => `<path d="${d}" stroke="${onMass}" stroke-width="${solid ? 2.4 : LINE_STROKE}"/>`;

    // Everything that sits in front of the frame line is also added to `cover`,
    // which knocks the frame line out behind it (so the head pops out cleanly).
    const cover = [];
    const front = (svg) => { cover.push(svg); return svg; };

    // ---- Face geometry (shared by every part) ----
    const FACE = 'M 68 74 C 68 50 82 38 100 38 C 118 38 132 50 132 74 L 132 94 C 132 112 118 122 100 122 C 82 122 68 112 68 94 Z';
    const EARS = `<ellipse cx="67" cy="86" rx="5.5" ry="8.5" fill="${paper}"/>` +
                 `<ellipse cx="133" cy="86" rx="5.5" ry="8.5" fill="${paper}"/>`;

    // ---- Hair: the part behind the head, and the part in front of it ----
    let hairBack = '', hairFront = '';
    switch (t.hair) {
        case 'crop':
            hairFront = mass('M 67 80 C 62 46 80 30 100 30 C 120 30 138 46 133 80 C 131 70 128 62 122 56 C 110 60 90 60 78 56 C 72 62 69 70 67 80 Z');
            break;
        case 'quiff':
            hairFront = mass('M 76 46 C 74 30 90 18 112 17 C 122 16 130 19 133 24 C 126 23 121 25 120 30 C 128 34 134 42 134 52 Z') +
                        mass('M 67 80 C 62 50 74 34 94 30 C 112 28 132 36 134 56 C 134 64 134 72 133 80 C 131 70 128 62 122 56 C 110 60 90 60 78 56 C 72 62 69 70 67 80 Z');
            break;
        case 'sweep':
            hairFront = mass('M 67 82 C 60 48 78 28 104 28 C 124 28 140 42 134 80 C 132 68 128 60 122 54 C 110 56 98 56 88 50 C 84 58 78 62 72 62 C 69 68 68 74 67 82 Z') +
                        detail('M 104 34 C 96 40 92 46 90 50');
            break;
        case 'curly':
            hairFront = mass(lineScallop(100, 66, 36, 186, 354, 9, 6) + ' C 134 70 133 76 132 80 C 128 66 120 58 108 58 C 102 62 96 62 90 58 C 80 58 72 66 68 80 C 67 76 66 70 64 62 Z');
            break;
        case 'bun':
            hairFront = mass('M 100 8 C 112 8 116 16 114 24 C 112 30 88 30 86 24 C 84 16 88 8 100 8 Z') +
                        mass('M 67 80 C 62 46 80 30 100 30 C 120 30 138 46 133 80 C 128 64 120 54 100 52 C 80 54 72 64 67 80 Z') +
                        detail('M 90 34 C 96 40 104 40 110 34');
            break;
        case 'bob':
            hairBack = mass('M 100 32 C 66 32 58 54 58 84 C 58 104 57 116 55 124 C 64 129 76 128 80 120 L 120 120 C 124 128 136 129 145 124 C 143 116 142 104 142 84 C 142 54 134 32 100 32 Z');
            hairFront = mass('M 66 84 C 62 48 80 32 100 32 C 120 32 138 48 134 84 C 132 70 126 62 120 58 C 108 64 90 64 76 58 C 70 66 67 74 66 84 Z') +
                        detail('M 104 36 C 100 46 96 54 90 62');
            break;
        case 'long':
            hairBack = mass('M 100 32 C 70 32 60 52 60 84 L 60 150 L 140 150 L 140 84 C 140 52 130 32 100 32 Z');
            hairFront = mass('M 100 32 C 70 32 60 52 60 84 C 60 112 60 140 57 170 C 64 173 72 173 79 170 C 76 150 74 130 74 112 C 71 98 69 84 71 72 C 75 58 86 50 100 47 C 114 50 125 58 129 72 C 131 84 129 98 126 112 C 126 130 124 150 121 170 C 128 173 136 173 143 170 C 140 140 140 112 140 84 C 140 52 130 32 100 32 Z') +
                        detail('M 100 34 L 100 46');
            break;
        case 'wavy':
            hairBack = mass('M 100 32 C 70 32 60 52 60 84 L 60 150 L 140 150 L 140 84 C 140 52 130 32 100 32 Z');
            hairFront = mass('M 100 32 C 70 32 60 52 60 84 C 54 100 64 112 58 126 C 52 140 62 152 56 166 C 64 172 74 172 80 168 C 76 156 82 146 78 134 C 74 122 78 112 74 104 C 70 94 68 82 71 72 C 75 58 86 50 100 47 C 114 50 125 58 129 72 C 132 82 130 94 126 104 C 122 112 126 122 122 134 C 118 146 124 156 120 168 C 126 172 136 172 144 166 C 138 152 148 140 142 126 C 136 112 146 100 140 84 C 140 52 130 32 100 32 Z') +
                        detail('M 100 34 L 100 46');
            break;
        case 'afro':
            hairBack = mass(lineScallop(100, 74, 50, 0, 360, 18, 7) + ' Z');
            if (t.headband) hairFront = line('M 70 60 C 80 46 120 46 130 60', ` stroke-width="${LINE_STROKE * 2.2}"`) +
                                        line('M 70 60 C 80 46 120 46 130 60', ` stroke="${paper}" stroke-width="${LINE_STROKE * 0.6}"`);
            break;
        case 'hijab':
            // drawn as fabric (always paper), see below
            break;
    }

    // ---- Facial hair ----
    let beard = '';
    const MOUTH_ON_BEARD = 'M 92 105 C 95 111 105 111 108 105 Z';
    switch (t.beard) {
        case 'full':
            beard = mass('M 67 76 C 66 118 82 136 100 136 C 118 136 134 118 133 76 C 130 92 124 98 116 100 C 110 96 90 96 84 100 C 76 98 70 92 67 76 Z') +
                    mass('M 84 102 C 90 96 96 96 100 99 C 104 96 110 96 116 102 C 110 106 104 105 100 103 C 96 105 90 106 84 102 Z');
            break;
        case 'short':
            beard = mass('M 68 84 C 68 114 82 128 100 128 C 118 128 132 114 132 84 C 130 96 124 102 116 102 C 110 98 90 98 84 102 C 76 102 70 96 68 84 Z') +
                    mass('M 85 102 C 90 97 96 97 100 100 C 104 97 110 97 115 102 C 110 105 104 104 100 103 C 96 104 90 105 85 102 Z');
            break;
        case 'goatee':
            beard = mass('M 86 102 C 90 97 96 97 100 100 C 104 97 110 97 114 102 C 116 112 112 126 100 128 C 88 126 84 112 86 102 Z');
            break;
        case 'mustache':
            beard = mass('M 83 103 C 86 96 95 95 100 98 C 105 95 114 96 117 103 C 114 106 110 105 106 104 C 103 103 101 102 100 102 C 99 102 97 103 94 104 C 90 105 86 106 83 103 Z');
            break;
    }
    const beardOverMouth = ['full', 'short', 'goatee'].includes(t.beard);

    // ---- Face features ----
    const eyes = `<ellipse cx="87" cy="82" rx="3.4" ry="4.2" fill="${ink}" stroke="none"/>` +
                 `<ellipse cx="113" cy="82" rx="3.4" ry="4.2" fill="${ink}" stroke="none"/>`;
    const nose = line('M 100 86 C 97 93 98 97 103 96');
    let mouth;
    if (opts.party) {
        mouth = beardOverMouth
            ? `<path d="M 90 104 C 93 114 107 114 110 104 Z" fill="${paper}" stroke="${onMass}"/>`
            : t.beard === 'mustache'
                ? `<path d="M 91 106 C 94 115 106 115 109 106 Z" fill="${paper}"/>`
                : `<path d="M 89 103 C 92 114 108 114 111 103 Z" fill="${paper}"/>`;
    } else if (beardOverMouth) {
        mouth = `<path d="${MOUTH_ON_BEARD}" fill="${paper}" stroke="${onMass}"/>`;
    } else {
        mouth = line(t.beard === 'mustache' ? 'M 92 108 C 95 111 105 111 108 108' : 'M 91 104 C 95 109 105 109 109 104');
    }

    // ---- Glasses ----
    let glasses = '';
    if (t.glasses === 'round') {
        glasses = '<circle cx="87" cy="82" r="10.5"/><circle cx="113" cy="82" r="10.5"/>' +
                  line('M 97.5 80 C 99 78 101 78 102.5 80') + line('M 76.5 80 L 68 77') + line('M 123.5 80 L 132 77');
    } else if (t.glasses === 'square') {
        glasses = '<rect x="75" y="73" width="24" height="18" rx="5"/><rect x="101" y="73" width="24" height="18" rx="5"/>' +
                  line('M 99 79 C 99.6 78 100.4 78 101 79') + line('M 75 78 L 68 76') + line('M 125 78 L 132 76');
    }

    // ---- Torso and clothing (clipped to the frame) ----
    const clipId = `${uid}c`, maskId = `${uid}m`;
    const shoulders = line('M 87 138 C 50 146 26 166 22 202') + line('M 113 138 C 150 146 174 166 178 202');
    const torso = shape('M 87 138 C 50 146 26 166 22 202 L 178 202 C 174 166 150 146 113 138 Z');
    const neck = `<path d="M 89 110 L 89 150 L 111 150 L 111 110 Z" fill="${paper}" stroke="none"/>` + line('M 89 112 L 89 139') + line('M 111 112 L 111 139');
    let clothes;
    switch (t.top) {
        case 'vneck':
            clothes = line('M 87 138 L 100 156 L 113 138');
            break;
        case 'hoodie':
            clothes = line('M 87 138 C 92 147 108 147 113 138') +
                      line('M 78 141 C 82 156 118 156 122 141') +
                      line('M 93 152 L 92 170') + line('M 107 152 L 108 170');
            break;
        case 'collar':
            clothes = line('M 87 137 L 91 151 L 100 143 L 109 151 L 113 137') + line('M 100 143 L 100 202');
            break;
        case 'jacket':
            clothes = line('M 87 138 C 92 146 108 146 113 138') +
                      line('M 84 140 L 94 202') + line('M 116 140 L 106 202');
            break;
        case 'bowtie':
            clothes = line('M 87 137 L 91 148 L 100 142 L 109 148 L 113 137') +
                      `<path d="M 100 147 L 89 141 L 89 154 Z M 100 147 L 111 141 L 111 154 Z" fill="${ink}"/>` +
                      `<circle cx="100" cy="147" r="3.2" fill="${ink}"/>`;
            break;
        default:
            clothes = line('M 87 138 C 92 147 108 147 113 138');
    }

    // ---- Hijab: fabric that covers hair, neck and shoulders ----
    let hijabBack = '', hijabFront = '';
    if (t.hair === 'hijab') {
        hijabBack = shape('M 100 30 C 64 30 56 60 58 92 C 60 118 54 138 42 156 C 64 170 136 170 158 156 C 146 138 140 118 142 92 C 144 60 136 30 100 30 Z');
        hijabFront = shape('M 68 76 C 66 50 82 40 100 40 C 118 40 134 50 132 76 C 128 60 118 50 100 50 C 82 50 72 60 68 76 Z') +
                     line('M 70 102 C 76 136 124 136 130 102') +
                     line('M 66 148 C 90 160 124 152 144 134') +
                     line('M 120 158 C 132 152 142 146 150 140');
    }

    // ---- Party hat ----
    let hat = '';
    if (opts.party) {
        const hatBody = `<path d="M 78 44 L 104 0 L 122 40 C 108 46 92 48 78 44 Z" fill="${solid ? ink : paper}"/>`;
        const stripes = `<path d="M 89 25 C 98 27 108 26 113 22 M 84 35 C 96 38 110 37 118 32" stroke="${solid ? paper : ink}" stroke-width="${solid ? 2.4 : LINE_STROKE}"/>`;
        hat = hatBody + stripes + `<circle cx="104" cy="0" r="6" fill="${paper}"/>`;
    }

    // ---- Waving hand (in front of the frame, bottom right) ----
    let hand = '', arm = '';
    if (t.wave) {
        arm = shape('M 132 202 L 144 154 L 160 156 L 150 202 Z');
        hand = '<g transform="translate(-7 0)">' + shape('M 151 156 C 148 150 148 144 151 140 L 148 128 C 147 123 153 122 154 127 L 157 138 L 157 123 C 157 118 163 118 163 123 L 163 138 L 167 127 C 168 122 174 123 173 128 L 169 142 L 174 137 C 177 133 182 137 179 141 L 170 154 C 166 160 156 162 151 156 Z') + '</g>';
    }

    // ---- Assemble, back to front ----
    const frameShape = (attrs) => `<ellipse cx="${f.cx}" cy="${f.cy}" rx="${f.rx}" ry="${f.ry}"${attrs}/>`;
    const head = (t.hair === 'hijab' ? '' : EARS) + `<path d="${FACE}" fill="${paper}"/>`;

    cover.push(hairBack, hijabBack);
    const faceLayer = front(head) + beard + eyes + nose + mouth + front(hairFront) + front(hijabFront) + glasses + front(hat) + front(hand);

    const w = opts.size?.width ? `${opts.size.width}` : '100%';
    const h = opts.size?.height ? `${opts.size.height}` : '100%';

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-3 -6 206 206" width="${w}" height="${h}">` +
        `<defs>` +
            `<clipPath id="${clipId}">${frameShape('')}</clipPath>` +
            `<mask id="${maskId}" maskUnits="userSpaceOnUse" x="-20" y="-20" width="240" height="240">` +
                `<rect x="-20" y="-20" width="240" height="240" fill="#fff"/>` +
                `<g fill="#000" stroke="#000" stroke-width="${LINE_STROKE}">${cover.join('').replace(/(fill|stroke)="[^"]*"/g, '')}</g>` +
            `</mask>` +
        `</defs>` +
        `<g fill="none" stroke="${ink}" stroke-width="${LINE_STROKE}" stroke-linecap="round" stroke-linejoin="round">` +
            frameShape(` fill="${paper}" stroke="none"`) +
            (t.hair === 'hijab' ? '' : hairBack) +
            `<g clip-path="url(#${clipId})">${torso}${shoulders}${neck}${clothes}${arm}</g>` +
            frameShape(` mask="url(#${maskId})"`) +
            hijabBack +
            faceLayer +
        `</g></svg>`;
}

function lineDataUrl(seedStr, opts) {
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(buildLineSVG(seedStr, opts));
}
