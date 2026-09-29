/* Generates SVG placeholder art for products and seeded designs. Run: node scripts/gen-images.mjs */
import { mkdirSync, writeFileSync } from "fs";

const OUT = "public/img";
mkdirSync(`${OUT}/products`, { recursive: true });
mkdirSync(`${OUT}/designs`, { recursive: true });

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/* ---------- Product silhouettes (garment-shaped, not boxes) ---------- */

function tee(fill, art = "", artColor = "#111") {
  return `
  <g transform="translate(200,80)">
    <!-- body -->
    <path d="M120 40 L60 70 L20 160 L75 185 L88 150 L88 400 Q200 425 312 400 L312 150 L325 185 L380 160 L340 70 L280 40 Q240 70 200 70 Q160 70 120 40 Z" fill="${fill}" stroke="rgba(0,0,0,0.25)" stroke-width="3"/>
    <!-- collar -->
    <path d="M120 40 Q200 78 280 40 Q240 68 200 68 Q160 68 120 40 Z" fill="rgba(0,0,0,0.18)"/>
    <!-- subtle shading -->
    <path d="M88 150 L88 400 Q140 412 200 412 L200 78 Q160 76 120 40 L60 70 L20 160 L75 185 Z" fill="rgba(255,255,255,0.05)"/>
    ${art}
  </g>`;
}

function hoodie(fill, art = "") {
  return `
  <g transform="translate(200,60)">
    <path d="M120 60 L55 95 L15 195 L75 220 L90 180 L90 440 Q200 465 310 440 L310 180 L325 220 L385 195 L345 95 L280 60 Q250 30 200 30 Q150 30 120 60 Z" fill="${fill}" stroke="rgba(0,0,0,0.28)" stroke-width="3"/>
    <!-- hood -->
    <path d="M120 60 Q130 8 200 6 Q270 8 280 60 Q250 92 200 92 Q150 92 120 60 Z" fill="${fill}" stroke="rgba(0,0,0,0.28)" stroke-width="3"/>
    <path d="M136 58 Q150 26 200 24 Q250 26 264 58 Q240 80 200 80 Q160 80 136 58 Z" fill="rgba(0,0,0,0.30)"/>
    <!-- drawstrings -->
    <path d="M185 88 L182 150 M215 88 L218 150" stroke="rgba(255,255,255,0.55)" stroke-width="5" stroke-linecap="round"/>
    <!-- pocket -->
    <path d="M110 320 L290 320 L290 430 Q200 452 110 430 Z" fill="rgba(0,0,0,0.12)"/>
    ${art}
  </g>`;
}

function jacket(fill, art = "") {
  return `
  <g transform="translate(200,70)">
    <path d="M118 46 L52 78 L14 178 L74 202 L88 164 L88 420 Q200 445 312 420 L312 164 L326 202 L386 178 L348 78 L282 46 L200 60 Z" fill="${fill}" stroke="rgba(0,0,0,0.3)" stroke-width="3"/>
    <path d="M200 60 L200 436" stroke="rgba(0,0,0,0.35)" stroke-width="4"/>
    <path d="M118 46 L200 60 L282 46 L272 34 L200 46 L128 34 Z" fill="rgba(0,0,0,0.3)"/>
    <circle cx="185" cy="120" r="4" fill="rgba(255,255,255,0.5)"/><circle cx="185" cy="200" r="4" fill="rgba(255,255,255,0.5)"/><circle cx="185" cy="280" r="4" fill="rgba(255,255,255,0.5)"/>
    ${art}
  </g>`;
}

function tote(fill, art = "") {
  return `
  <g transform="translate(240,120)">
    <path d="M120 60 Q120 -40 200 -40 Q280 -40 280 60" fill="none" stroke="${fill}" stroke-width="14"/>
    <path d="M40 60 L360 60 L390 400 Q200 428 10 400 Z" fill="${fill}" stroke="rgba(0,0,0,0.22)" stroke-width="3"/>
    <path d="M40 60 L360 60 L365 100 L35 100 Z" fill="rgba(0,0,0,0.12)"/>
    ${art}
  </g>`;
}

function cap(fill, art = "") {
  return `
  <g transform="translate(220,180)">
    <path d="M30 130 Q30 10 160 10 Q290 10 290 130 L290 150 L30 150 Z" fill="${fill}" stroke="rgba(0,0,0,0.3)" stroke-width="3"/>
    <path d="M160 12 L160 150" stroke="rgba(0,0,0,0.25)" stroke-width="3"/>
    <path d="M100 20 L100 150 M220 20 L220 150" stroke="rgba(0,0,0,0.14)" stroke-width="3"/>
    <path d="M290 150 Q380 150 386 176 Q388 192 350 194 L30 194 Q22 178 30 150 Z" fill="${fill}" stroke="rgba(0,0,0,0.3)" stroke-width="3"/>
    <path d="M30 150 L290 150" stroke="rgba(0,0,0,0.25)" stroke-width="3"/>
    ${art}
  </g>`;
}

function jersey(fill, art = "") {
  return `
  <g transform="translate(200,80)">
    <path d="M120 40 L60 70 L20 160 L75 185 L88 150 L88 400 Q200 425 312 400 L312 150 L325 185 L380 160 L340 70 L280 40 Q240 70 200 70 Q160 70 120 40 Z" fill="${fill}" stroke="rgba(0,0,0,0.25)" stroke-width="3"/>
    <path d="M88 150 L88 400 L128 400 L128 150 Z" fill="rgba(255,255,255,0.10)"/>
    <path d="M272 150 L272 400 L312 400 L312 150 Z" fill="rgba(255,255,255,0.10)"/>
    <path d="M120 40 Q200 78 280 40" fill="none" stroke="rgba(255,255,255,0.35)" stroke-width="6"/>
    ${art}
  </g>`;
}

function beanie(fill, art = "") {
  return `
  <g transform="translate(240,160)">
    <path d="M30 180 Q30 20 160 20 Q290 20 290 180 L290 220 L30 220 Z" fill="${fill}" stroke="rgba(0,0,0,0.3)" stroke-width="3"/>
    <rect x="30" y="200" width="260" height="60" rx="18" fill="${fill}" stroke="rgba(0,0,0,0.3)" stroke-width="3"/>
    ${Array.from({ length: 12 }, (_, i) => `<path d="M${45 + i * 22} 205 L${45 + i * 22} 255" stroke="rgba(0,0,0,0.16)" stroke-width="3"/>`).join("")}
    <path d="M60 90 Q160 50 260 90" fill="none" stroke="rgba(255,255,255,0.14)" stroke-width="4"/>
    ${art}
  </g>`;
}

function sling(fill, art = "") {
  return `
  <g transform="translate(230,110)">
    <path d="M20 240 Q-30 60 160 -60" fill="none" stroke="rgba(245,242,234,0.6)" stroke-width="12" stroke-linecap="round"/>
    <rect x="60" y="40" width="280" height="360" rx="26" fill="${fill}" stroke="rgba(0,0,0,0.3)" stroke-width="3"/>
    <path d="M60 130 L340 130" stroke="rgba(0,0,0,0.28)" stroke-width="4"/>
    <path d="M300 90 L330 90 L330 118 L300 118 Z" fill="rgba(0,0,0,0.3)"/>
    ${art}
  </g>`;
}

const SHAPES = {
  "essential-oversized-tee": tee, "classic-regular-tee": tee, "studio-hoodie": hoodie,
  "campus-zip-hoodie": hoodie, "coach-jacket": jacket, "utility-shacket": jacket,
  "canvas-tote": tote, "crossbody-sling": sling, "classic-cap": cap, "studio-beanie": beanie,
  "number-07-jersey": jersey, "court-classic-jersey": jersey,
};

const FILLS = {
  "essential-oversized-tee": "#e9e4d8", "classic-regular-tee": "#101010", "studio-hoodie": "#141414",
  "campus-zip-hoodie": "#b9b7b2", "coach-jacket": "#20242c", "utility-shacket": "#57583f",
  "canvas-tote": "#d8c9a8", "crossbody-sling": "#141414", "classic-cap": "#141414",
  "studio-beanie": "#141414", "number-07-jersey": "#101010", "court-classic-jersey": "#e9e4d8",
};

function svgWrap(inner) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600"><rect width="800" height="600" fill="#121210"/><ellipse cx="400" cy="540" rx="240" ry="26" fill="rgba(0,0,0,0.5)"/>${inner}</svg>`;
}

/* ---------- Design preview: garment + big hand-style text ---------- */

const DESIGN_ART = {
  "higher-than-yesterday": { product: "studio-hoodie", color: "#141414", textColor: "#f5f2ea", lines: ["HIGHER", "THAN", "YESTERDAY"] },
  "good-people-good-places": { product: "studio-hoodie", color: "#eae5da", textColor: "#161616", lines: ["GOOD", "PEOPLE", "GOOD", "PLACES"] },
  "same-dreams-bigger-plans": { product: "studio-hoodie", color: "#2e4234", textColor: "#f5f2ea", lines: ["SAME", "DREAMS", "BIGGER", "PLANS"] },
  "a-brighter-me": { product: "essential-oversized-tee", color: "#f2efe7", textColor: "#161616", lines: ["A BRIGHTER", "ME"] },
  "lost-but-exploring": { product: "studio-hoodie", color: "#141414", textColor: "#f5f2ea", lines: ["LOST", "BUT", "EXPLORING"] },
  "mental-health-matters": { product: "classic-regular-tee", color: "#101010", textColor: "#f5f2ea", lines: ["MENTAL", "HEALTH", "MATTERS"] },
  "still-here-still-growing": { product: "essential-oversized-tee", color: "#f2efe7", textColor: "#161616", lines: ["STILL HERE", "STILL", "GROWING"] },
  "number-77": { product: "number-07-jersey", color: "#2e4234", textColor: "#f5f2ea", lines: ["77"] },
  "collect-moments": { product: "canvas-tote", color: "#d8c9a8", textColor: "#2c2618", lines: ["COLLECT", "MOMENTS", "NOT", "THINGS"] },
  "midnight-thoughts": { product: "essential-oversized-tee", color: "#f2efe7", textColor: "#161616", lines: ["MIDNIGHT", "THOUGHTS"] },
  "better-days-ahead": { product: "canvas-tote", color: "#d8c9a8", textColor: "#2c2618", lines: ["GOOD DAYS", "AHEAD"] },
  "grow-at-your-own-pace": { product: "studio-hoodie", color: "#141414", textColor: "#f5f2ea", lines: ["GROW AT", "YOUR OWN", "PACE"] },
};

function designArt(def) {
  const shapeFn = SHAPES[def.product];
  const startY = def.lines.length >= 4 ? 250 : def.lines.length === 3 ? 280 : 300;
  const fontSize = def.lines.length >= 4 ? 52 : def.lines[0].length > 8 ? 44 : 64;
  const text = def.lines
    .map(
      (l, i) =>
        `<text x="200" y="${startY + i * (fontSize + 14)}" text-anchor="middle" font-family="Arial Black, Arial, sans-serif" font-weight="900" font-size="${fontSize}" letter-spacing="2" fill="${def.textColor}">${esc(l)}</text>`
    )
    .join("");
  return shapeFn(def.color, text);
}

/* ---------- Generate all ---------- */

for (const [slug, shapeFn] of Object.entries(SHAPES)) {
  const svg = svgWrap(shapeFn(FILLS[slug] ?? "#141414"));
  writeFileSync(`${OUT}/products/${slug}.svg`, svg.trim());
}

for (const [slug, def] of Object.entries(DESIGN_ART)) {
  const svg = svgWrap(designArt(def));
  writeFileSync(`${OUT}/designs/${slug}.svg`, svg.trim());
}

/* Lifestyle/community placeholders (people-wearing shots) */
const LIFESTYLE = [
  "city-walk", "rooftop-dusk", "studio-session", "campus-day", "court-run", "coast-road", "gallery-night", "train-window",
];
for (const name of LIFESTYLE) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 750">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#1a1a18"/><stop offset="0.55" stop-color="#232320"/><stop offset="1" stop-color="#0d0d0c"/>
  </linearGradient></defs>
  <rect width="600" height="750" fill="url(#g)"/>
  <circle cx="${hash(name) % 500 + 60}" cy="${(hash(name) * 7) % 250 + 90}" r="${40 + (hash(name) % 60)}" fill="rgba(245,242,234,0.05)"/>
  <path d="M0 600 L120 470 L230 590 L330 440 L440 580 L600 430 L600 750 L0 750 Z" fill="rgba(0,0,0,0.55)"/>
  <path d="M0 650 L150 540 L290 660 L420 520 L600 640 L600 750 L0 750 Z" fill="rgba(0,0,0,0.75)"/>
  <text x="300" y="392" text-anchor="middle" font-family="Georgia, serif" font-style="italic" font-size="30" fill="rgba(245,242,234,0.5)">${esc(name.replace(/-/g, " "))}</text>
</svg>`;
  writeFileSync(`${OUT}/designs/life-${name}.svg`, svg.trim());
}

function hash(s) {
  let h = 0;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h;
}

/* Hero + editorial placeholders */
const HERO = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900">
  <defs><radialGradient id="hg" cx="0.62" cy="0.42" r="0.75">
    <stop offset="0" stop-color="#2b2a26"/><stop offset="0.6" stop-color="#161614"/><stop offset="1" stop-color="#0a0a0a"/>
  </radialGradient></defs>
  <rect width="1600" height="900" fill="url(#hg)"/>
  <ellipse cx="1000" cy="760" rx="330" ry="40" fill="rgba(0,0,0,0.6)"/>
  <g transform="translate(760,120) scale(1.05)">
    <path d="M120 40 L60 70 L20 160 L75 185 L88 150 L88 400 Q200 425 312 400 L312 150 L325 185 L380 160 L340 70 L280 40 Q240 70 200 70 Q160 70 120 40 Z" fill="#f0ece2" stroke="rgba(0,0,0,0.2)" stroke-width="4"/>
    <path d="M120 40 Q200 78 280 40 Q240 68 200 68 Q160 68 120 40 Z" fill="rgba(0,0,0,0.15)"/>
    <text x="200" y="230" text-anchor="middle" font-family="Arial Black, Arial" font-weight="900" font-size="92" fill="#161616" transform="rotate(-4 200 230)">OWNIT</text>
    <text x="200" y="330" text-anchor="middle" font-family="Georgia, serif" font-style="italic" font-size="30" fill="#3a3a35">ideas people places you</text>
  </g>
</svg>`;
writeFileSync(`${OUT}/hero.svg`, HERO.trim());

console.log("Images generated.");
