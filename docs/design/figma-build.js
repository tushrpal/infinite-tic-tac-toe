/**
 * Infinite Tic-Tac-Toe — Figma build script
 * ------------------------------------------------------------------
 * Builds the full design in the current Figma file:
 *   • Tokens (color / radius / space variables), text styles, effect styles
 *   • Component library (Button, Avatar, Rank Badge, Board Cell, Marks,
 *     icons, pills, tiles, cards, nav, table rows, animated backgrounds)
 *   • 6 screens: Home, Play, Ranked Match, Leaderboard, Profile, Victory
 *   • Animation: looping 3D neon grid floor, breathing nebula glow and a
 *     pulsing victory emblem (animated component variants), plus
 *     click-through navigation between screens with Smart Animate.
 *
 * HOW TO RUN
 *   1. Open the Figma Design file.
 *   2. Plugins → search "Scripter" → run it.
 *   3. Paste this whole file into a new script and press ▶ Run.
 *   4. Select "01 Home" and press Present (▶ in the toolbar) to see the
 *      animated background and click through the flow.
 *
 * Re-running is safe: it removes and rebuilds only the pages, components
 * and screens this script owns (matched by name). Anything else is left alone.
 *
 * Tokens mirror apps/web/styles/globals.css. Player X/O colors follow the
 * reference mock (X = fuchsia, O = cyan).
 */

// Last step the build reached; included in the error message so failures are easy to locate.
let __step = "starting";

async function build() {
  const log = [];

  /* ================================================================
     0. PRIMITIVES
     ================================================================ */

  const rgb = (h) => {
    const n = parseInt(h.replace("#", ""), 16);
    return { r: ((n >> 16) & 255) / 255, g: ((n >> 8) & 255) / 255, b: (n & 255) / 255 };
  };
  const solid = (hex, opacity = 1) => ({ type: "SOLID", color: rgb(hex), opacity });
  // Figma's plugin sandbox parser rejects ES2018+ syntax (object spread, ??, ||=),
  // so this script sticks to ES2017 and uses these helpers instead.
  const rgba = (hex, a) => Object.assign(rgb(hex), { a });
  const def = (v, fallback) => (v == null ? fallback : v);
  const H_GRAD = [[1, 0, 0], [0, 1, 0]];
  const D_GRAD = [[0.7, 0.7, 0], [-0.7, 0.7, 0.5]];
  const V_GRAD = [[0, 1, 0], [-1, 0, 1]];
  const grad = (stops, transform = H_GRAD, opacity = 1) => ({
    type: "GRADIENT_LINEAR",
    gradientTransform: transform,
    opacity,
    gradientStops: stops.map(([hex, pos, a = 1]) => ({ position: pos, color: rgba(hex, a) })),
  });
  const radial = (stops) => ({
    type: "GRADIENT_RADIAL",
    gradientTransform: [[1, 0, 0], [0, 1, 0]],
    gradientStops: stops.map(([hex, pos, a = 1]) => ({ position: pos, color: rgba(hex, a) })),
  });
  const blur = (type, radius) => ({ type, radius, visible: true, blurType: "NORMAL" });

  const HEX = {
    accent: "#8b5cf6", accent2: "#6d28d9", magenta: "#ec4899", violet: "#a855f7",
    x: "#d946ef", o: "#22d3ee", gold: "#fbbf24", amber: "#f59e0b",
    success: "#22c55e", error: "#ef4444", white: "#ffffff", ink: "#1a1205", slate: "#94a3b8",
  };

  /* ================================================================
     1. PAGES
     ================================================================ */

  const ensurePage = (name, index) => {
    let p = figma.root.children.find((x) => x.name === name);
    if (!p) {
      const first = figma.root.children[0];
      if (index === 0 && figma.root.children.length === 1 && first.children.length === 0) p = first;
      else p = figma.createPage();
      p.name = name;
    }
    return p;
  };
  const PAGE_SCREENS = ensurePage("01 · Screens", 0);
  const PAGE_COMP = ensurePage("02 · Components", 1);
  const PAGE_FOUND = ensurePage("03 · Foundations", 2);

  /* ================================================================
     2. FOUNDATIONS — variables, text styles, effect styles
     ================================================================ */

  const FILL = ["FRAME_FILL", "SHAPE_FILL"];
  const TXT = ["TEXT_FILL"];
  const STRK = ["STROKE_COLOR"];
  const ALLC = ["FRAME_FILL", "SHAPE_FILL", "TEXT_FILL", "STROKE_COLOR", "EFFECT_COLOR"];

  const COLOR_TOKENS = {
    "surface/base": ["#08080f", FILL],
    "surface/elevated": ["#101018", FILL],
    "surface/raised": ["#16161f", FILL],
    "surface/sunken": ["#0b0b12", FILL],
    "board/bg": ["#0a0a0f", FILL],
    "board/grid": ["#1a1a2e", FILL],
    "board/cell": ["#12121a", FILL],
    "board/cell-hover": ["#1f1f2e", FILL],
    "player-x/primary": ["#d946ef", ALLC],
    "player-x/secondary": ["#a21caf", ALLC],
    "player-x/glow": ["#d946ef", ["EFFECT_COLOR"]],
    "player-o/primary": ["#22d3ee", ALLC],
    "player-o/secondary": ["#0891b2", ALLC],
    "player-o/glow": ["#22d3ee", ["EFFECT_COLOR"]],
    "accent/primary": ["#8b5cf6", ALLC],
    "accent/secondary": ["#6d28d9", ALLC],
    "accent/magenta": ["#ec4899", ALLC],
    "accent/on-primary": ["#ffffff", TXT],
    "accent/success": ["#22c55e", ALLC],
    "accent/warning": ["#f59e0b", ALLC],
    "accent/error": ["#ef4444", ALLC],
    "accent/gold": ["#fbbf24", ALLC],
    "text/primary": ["#f8fafc", TXT],
    "text/secondary": ["#94a3b8", TXT],
    "text/tertiary": ["#64748b", TXT],
    "text/muted": ["#475569", TXT],
    "border/subtle": ["#1e293b", STRK],
    "border/accent": ["#8b5cf6", STRK],
    "border/glow": ["#2a1f4a", STRK],
  };
  const R = ["CORNER_RADIUS"], G = ["GAP", "WIDTH_HEIGHT"];
  const NUMBER_TOKENS = {
    "radius/xs": [4, R], "radius/sm": [8, R], "radius/md": [12, R], "radius/lg": [16, R],
    "radius/xl": [20, R], "radius/2xl": [24, R], "radius/pill": [999, R],
    "space/1": [4, G], "space/2": [8, G], "space/3": [12, G], "space/4": [16, G], "space/5": [20, G],
    "space/6": [24, G], "space/8": [32, G], "space/10": [40, G], "space/12": [48, G], "space/16": [64, G],
  };

  __step = "color and spacing variables";
  const collections = await figma.variables.getLocalVariableCollectionsAsync();
  let col = collections.find((c) => c.name === "Tokens");
  if (!col) col = figma.variables.createVariableCollection("Tokens");
  const modeId = col.modes[0].modeId;
  col.renameMode(modeId, "Dark Neon");

  const V = {};
  for (const id of col.variableIds) {
    const v = await figma.variables.getVariableByIdAsync(id);
    if (v) V[v.name] = v;
  }
  for (const [name, [hex, scopes]] of Object.entries(COLOR_TOKENS)) {
    const v = V[name] || figma.variables.createVariable(name, col, "COLOR");
    v.setValueForMode(modeId, rgb(hex));
    v.scopes = scopes;
    V[name] = v;
  }
  for (const [name, [val, scopes]] of Object.entries(NUMBER_TOKENS)) {
    const v = V[name] || figma.variables.createVariable(name, col, "FLOAT");
    v.setValueForMode(modeId, val);
    v.scopes = scopes;
    V[name] = v;
  }
  log.push(`Variables: ${Object.keys(V).length}`);

  /** Solid paint bound to a color variable. */
  const vf = (name, opacity) => {
    const p = figma.variables.setBoundVariableForPaint(solid("#000000"), "color", V[name]);
    return opacity == null ? p : Object.assign({}, p, { opacity });
  };

  const FONTS = [
    ["Space Grotesk", "Bold"], ["Space Grotesk", "Medium"], ["Space Grotesk", "Regular"],
    ["Inter", "Regular"], ["Inter", "Medium"], ["Inter", "Semi Bold"], ["Inter", "Bold"],
    ["JetBrains Mono", "Medium"], ["JetBrains Mono", "Bold"],
  ];
  await Promise.all(FONTS.map(([family, style]) => figma.loadFontAsync({ family, style })));

  const SG = (s) => ({ family: "Space Grotesk", style: s });
  const IN = (s) => ({ family: "Inter", style: s });
  const JB = (s) => ({ family: "JetBrains Mono", style: s });

  const TEXT_STYLES = {
    "Display/Hero": [SG("Bold"), 76, 96, -2],
    "Display/Xl": [SG("Bold"), 56, 110, -2, "UPPER"],
    "Heading/Xl": [SG("Bold"), 36, 120, -1],
    "Heading/Lg": [SG("Bold"), 28, 125, -1],
    "Heading/Md": [SG("Bold"), 20, 130, 0],
    "Heading/Sm": [SG("Medium"), 16, 135, 0],
    "Body/Lg": [IN("Regular"), 16, 155, 0],
    "Body/Md": [IN("Regular"), 14, 155, 0],
    "Body/Sm": [IN("Regular"), 13, 150, 0],
    "Body/Xs": [IN("Regular"), 11, 145, 0],
    "Label/Lg": [IN("Semi Bold"), 16, 140, 0],
    "Label/Md": [IN("Semi Bold"), 14, 140, 0],
    "Label/Sm": [IN("Semi Bold"), 12, 140, 0],
    "Label/Overline": [IN("Semi Bold"), 11, 140, 12, "UPPER"],
    "Mono/Lg": [JB("Bold"), 22, 130, 0],
    "Mono/Md": [JB("Medium"), 14, 140, 0],
    "Mono/Sm": [JB("Medium"), 12, 140, 0],
  };
  __step = "text styles";
  const TS = {};
  const localText = await figma.getLocalTextStylesAsync();
  for (const [name, [font, size, lh, ls, tc]] of Object.entries(TEXT_STYLES)) {
    const s = localText.find((t) => t.name === name) || figma.createTextStyle();
    s.name = name;
    s.fontName = font;
    s.fontSize = size;
    s.lineHeight = { unit: "PERCENT", value: lh };
    s.letterSpacing = { unit: "PERCENT", value: ls };
    s.textCase = tc || "ORIGINAL";
    TS[name] = s;
  }

  const shadow = (hex, a, radius, y = 0) => ({
    type: "DROP_SHADOW", color: rgba(hex, a), offset: { x: 0, y },
    radius, spread: 0, visible: true, blendMode: "NORMAL",
  });
  const EFFECT_STYLES = {
    "Glow/Accent": [shadow(HEX.accent, 0.45, 32), shadow(HEX.accent, 0.2, 64)],
    "Glow/Accent Xl": [shadow(HEX.accent, 0.55, 60), shadow(HEX.magenta, 0.3, 110)],
    "Glow/Player X": [shadow(HEX.x, 0.55, 24), shadow(HEX.x, 0.25, 48)],
    "Glow/Player O": [shadow(HEX.o, 0.55, 24), shadow(HEX.o, 0.25, 48)],
    "Glow/Gold": [shadow(HEX.gold, 0.45, 28)],
    "Glow/Success": [shadow(HEX.success, 0.4, 24)],
    "Elevation/Card": [shadow("#000000", 0.5, 24, 8)],
    "Elevation/Modal": [shadow("#000000", 0.65, 56, 20)],
  };
  __step = "effect styles";
  const ES = {};
  const localFx = await figma.getLocalEffectStylesAsync();
  for (const [name, effects] of Object.entries(EFFECT_STYLES)) {
    const s = localFx.find((e) => e.name === name) || figma.createEffectStyle();
    s.name = name;
    s.effects = effects;
    ES[name] = s;
  }
  log.push(`Text styles: ${Object.keys(TS).length}, effect styles: ${Object.keys(ES).length}`);

  /* ================================================================
     3. NODE HELPERS  (plain Plugin API only)
     ================================================================ */

  /** Apply fixed/hug sizing to an auto-layout frame or component. Call AFTER resize(). */
  function sizing(f, dir, fixW, fixH) {
    const horiz = dir === "HORIZONTAL";
    f.primaryAxisSizingMode = (horiz ? fixW : fixH) ? "FIXED" : "AUTO";
    f.counterAxisSizingMode = (horiz ? fixH : fixW) ? "FIXED" : "AUTO";
  }

  function padding(f, pad) {
    const [t, r, b, l] = Array.isArray(pad)
      ? (pad.length === 2 ? [pad[0], pad[1], pad[0], pad[1]] : pad)
      : [pad, pad, pad, pad];
    f.paddingTop = t; f.paddingRight = r; f.paddingBottom = b; f.paddingLeft = l;
  }

  function stroke(n, paint, weight = 1) {
    n.strokes = [paint];
    n.strokeWeight = weight;
    n.strokeAlign = "INSIDE";
  }

  function borderOnly(n, paint, side) {
    n.strokes = [paint];
    n.strokeAlign = "INSIDE";
    n.strokeTopWeight = side === "top" ? 1 : 0;
    n.strokeRightWeight = side === "right" ? 1 : 0;
    n.strokeBottomWeight = side === "bottom" ? 1 : 0;
    n.strokeLeftWeight = side === "left" ? 1 : 0;
  }

  /** Auto-layout frame. Axes hug unless `w` / `h` is given. */
  function AL(dir = "HORIZONTAL", o = {}) {
    const f = figma.createFrame();
    f.name = o.name || (dir === "VERTICAL" ? "Stack" : "Row");
    f.layoutMode = dir;
    f.resize(def(o.w, 100), def(o.h, 100));
    sizing(f, dir, o.w != null, o.h != null);
    f.fills = o.fill ? (Array.isArray(o.fill) ? o.fill : [o.fill]) : [];
    f.clipsContent = false;
    if (o.gap != null) f.itemSpacing = o.gap;
    if (o.pad != null) padding(f, o.pad);
    if (o.align) f.counterAxisAlignItems = o.align;
    if (o.justify) f.primaryAxisAlignItems = o.justify;
    if (o.radius != null) f.cornerRadius = o.radius;
    if (o.stroke) stroke(f, o.stroke, o.strokeWeight || 1);
    if (o.effect) f.effectStyleId = ES[o.effect].id;
    return f;
  }

  /** Main component. `dir` null = no auto-layout. `hug` = { w, h } axes that hug content. */
  function COMP(name, dir, w, h, hug = {}) {
    __step = `component "${name}"`;
    const c = figma.createComponent();
    c.name = name;
    if (dir) c.layoutMode = dir;
    c.resize(w, h);
    if (dir) sizing(c, dir, !hug.w, !hug.h);
    c.fills = [];
    c.clipsContent = false;
    return c;
  }

  /** Plain (non auto-layout) frame for absolute / 3D art. */
  function BOX(w, h, o = {}) {
    const f = figma.createFrame();
    f.name = o.name || "Box";
    f.resize(w, h);
    f.fills = o.fill ? (Array.isArray(o.fill) ? o.fill : [o.fill]) : [];
    f.clipsContent = def(o.clip, false);
    if (o.radius != null) f.cornerRadius = o.radius;
    if (o.stroke) { f.strokes = [o.stroke]; f.strokeWeight = o.strokeWeight || 1; }
    return f;
  }

  /** Text bound to a text style. `color` = variable name or a paint. */
  function T(chars, style, color = "text/primary", o = {}) {
    const t = figma.createText();
    t.fontName = TEXT_STYLES[style][0];
    t.characters = chars;
    t.textStyleId = TS[style].id;
    t.fills = [typeof color === "string" ? vf(color) : color];
    t.name = o.name || chars.slice(0, 24);
    if (o.align) t.textAlignHorizontal = o.align;
    if (o.width) { t.textAutoResize = "HEIGHT"; t.resize(o.width, t.height); }
    if (o.effect) t.effectStyleId = ES[o.effect].id;
    return t;
  }

  /** Append to an auto-layout parent, then set sizing (order matters). */
  function add(parent, child, h, v) {
    parent.appendChild(child);
    if (h) child.layoutSizingHorizontal = h;
    if (v) child.layoutSizingVertical = v;
    return child;
  }

  function place(parent, child, x, y) {
    parent.appendChild(child);
    child.x = x;
    child.y = y;
    return child;
  }

  /* Icons — lucide-style 24×24 paths, imported as SVG vectors. */
  const ICON_PATHS = {
    infinity: "M12 12c-2-2.7-4-4-6-4a4 4 0 0 0 0 8c2 0 4-1.3 6-4Zm0 0c2 2.7 4 4 6 4a4 4 0 0 0 0-8c-2 0-4 1.3-6 4Z",
    globe: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Z M2 12h20 M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10Z",
    trophy: "M6 9H4.5a2.5 2.5 0 0 1 0-5H6 M18 9h1.5a2.5 2.5 0 0 0 0-5H18 M4 22h16 M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22 M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22 M18 2H6v7a6 6 0 0 0 12 0V2Z",
    users: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M9 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z M22 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75",
    link: "M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71 M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71",
    gamepad: "M6 12h4 M8 10v4 M15 13h.01 M18 11h.01 M17.32 5H6.68a4 4 0 0 0-3.98 3.59C2.6 9.42 2 14.46 2 16a3 3 0 0 0 3 3c1 0 1.5-.5 2-1l1.41-1.41A2 2 0 0 1 9.83 16h4.34a2 2 0 0 1 1.41.59L17 18c.5.5 1 1 2 1a3 3 0 0 0 3-3c0-1.55-.6-6.58-.69-7.26A4 4 0 0 0 17.32 5Z",
    bot: "M12 8V4H8 M4 8h16v12H4Z M2 14h2 M20 14h2 M15 13v2 M9 13v2",
    book: "M4 19.5A2.5 2.5 0 0 1 6.5 17H20 M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z",
    zap: "M4 14h7l-3 8 10-12h-7l3-8Z",
    flag: "M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1Z M4 22v-7",
    clock: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Z M12 6v6l4 2",
    flame: "M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5Z",
    target: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Z M12 6a6 6 0 1 0 0 12 6 6 0 0 0 0-12Z M12 10a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z",
    hash: "M4 9h16 M4 15h16 M10 3 8 21 M16 3l-2 18",
    crown: "M11.56 3.27a.5.5 0 0 1 .88 0l2.95 5.6a1 1 0 0 0 1.52.3l4.27-3.67a.5.5 0 0 1 .8.52l-2.83 10.25a1 1 0 0 1-.96.73H5.81a1 1 0 0 1-.96-.73L2.02 6.02a.5.5 0 0 1 .8-.52l4.28 3.66a1 1 0 0 0 1.52-.29Z",
    star: "m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01Z",
    layers: "M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z M2 12.18l9.17 4.18a2 2 0 0 0 1.66 0L22 12.18 M2 17.18l9.17 4.18a2 2 0 0 0 1.66 0L22 17.18",
    logout: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4 M16 17l5-5-5-5 M21 12H9",
    equal: "M5 9h14 M5 15h14",
    arrow: "M5 12h14 M12 5l7 7-7 7",
    shield: "M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1Z",
    chevron: "m9 18 6-6-6-6",
  };

  /** Raw vector icon (use inside main components or free-standing frames). */
  function ICON(name, size = 20, color = HEX.accent, o = {}) {
    const fill = o.filled ? `fill="${color}"` : `fill="none"`;
    const svg = `<svg width="${size}" height="${size}" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="${ICON_PATHS[name]}" ${fill} stroke="${color}" stroke-width="${o.stroke || 2}" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    const n = figma.createNodeFromSvg(svg);
    n.name = `icon/${name}`;
    n.resize(size, size);
    n.fills = [];
    return n;
  }

  /** Recolor every vector inside an icon (works on instances as an override). */
  function tint(node, hex, filled) {
    if (!node) return;
    for (const v of node.findAll((n) => n.type === "VECTOR")) {
      v.strokes = [solid(hex)];
      if (filled) v.fills = [solid(hex)];
    }
  }

  /** The direct-child icon instance wired to an INSTANCE_SWAP property. */
  const swapSlot = (node) => node.children.find((n) => n.type === "INSTANCE" && n.componentPropertyReferences && n.componentPropertyReferences.mainComponent);

  const X_SVG = (s, c, w) => `<svg width="${s}" height="${s}" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 10 L46 46" stroke="${c}" stroke-width="${w}" stroke-linecap="round"/><path d="M46 10 L10 46" stroke="${c}" stroke-width="${w}" stroke-linecap="round"/></svg>`;
  const O_SVG = (s, c, w) => `<svg width="${s}" height="${s}" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="28" cy="28" r="18" stroke="${c}" stroke-width="${w}"/></svg>`;

  function mark(kind, size = 56, o = {}) {
    const color = o.color || (kind === "X" ? HEX.x : HEX.o);
    const n = figma.createNodeFromSvg(kind === "X" ? X_SVG(size, color, o.weight || 8) : O_SVG(size, color, o.weight || 8));
    n.name = `Mark ${kind}`;
    n.resize(size, size);
    n.fills = [];
    if (o.glow !== false) n.effectStyleId = ES[kind === "X" ? "Glow/Player X" : "Glow/Player O"].id;
    if (o.opacity != null) n.opacity = o.opacity;
    return n;
  }

  /* Prototype reactions */
  const smart = (duration, easing = "EASE_IN_AND_OUT") => ({ type: "SMART_ANIMATE", easing: { type: easing }, duration });
  async function loopTo(node, dest, transition) {
    await node.setReactionsAsync([{
      trigger: { type: "AFTER_TIMEOUT", timeout: 0.001 },
      actions: [{ type: "NODE", destinationId: dest.id, navigation: "CHANGE_TO", transition, preserveScrollPosition: false }],
    }]);
  }
  async function clickTo(node, dest, transition = smart(0.45, "EASE_OUT")) {
    if (!node || !dest) { log.push("⚠ skipped a link (missing node)"); return; }
    try {
      await node.setReactionsAsync([{
        trigger: { type: "ON_CLICK" },
        actions: [{ type: "NODE", destinationId: dest.id, navigation: "NAVIGATE", transition, preserveScrollPosition: false }],
      }]);
    } catch (e) {
      log.push(`⚠ could not link "${node.name}" → "${dest.name}": ${e.message}`);
    }
  }

  /* ================================================================
     4. RESET what this script owns
     ================================================================ */

  const OWNED = new Set([
    "Button", "Avatar", "Rank Badge", "Board Cell", "Mark X", "Mark O", "Tab Pill", "Result Pill",
    "Stat Tile", "Nav Bar", "User Chip", "Feature Card", "Action Card", "Leaderboard Row",
    "Match Row", "Player Card", "Podium Card", "Bg / Grid Flow", "Bg / Glow Pulse", "Fx / Victory Ring",
  ]);
  __step = "removing the previous build";
  await figma.setCurrentPageAsync(PAGE_SCREENS);
  for (const n of [...PAGE_SCREENS.children]) n.remove();
  await figma.setCurrentPageAsync(PAGE_FOUND);
  for (const n of [...PAGE_FOUND.children]) n.remove();
  await figma.setCurrentPageAsync(PAGE_COMP);
  for (const n of [...PAGE_COMP.children]) if (OWNED.has(n.name) || n.name.startsWith("Icon / ")) n.remove();

  /* ================================================================
     5. COMPONENT REGISTRY
     ================================================================ */

  const CMP = {};     // name → COMPONENT | COMPONENT_SET
  const PROP = {};    // "Component.Prop" → property key ("Label#12:0")
  let shelfX = 0, shelfY = 120, shelfRowH = 0;
  const shelf = (node) => {
    if (shelfX + node.width > 2600) { shelfX = 0; shelfY += shelfRowH + 80; shelfRowH = 0; }
    node.x = shelfX; node.y = shelfY;
    shelfX += node.width + 80;
    shelfRowH = Math.max(shelfRowH, node.height);
  };
  function variantSet(comps, name, desc, dir = "HORIZONTAL", gap = 20) {
    __step = `variant set "${name}"`;
    const set = figma.combineAsVariants(comps, PAGE_COMP);
    set.name = name;
    set.description = desc;
    set.layoutMode = dir;
    set.primaryAxisSizingMode = "AUTO";
    set.counterAxisSizingMode = "AUTO";
    set.itemSpacing = gap;
    padding(set, 24);
    set.fills = [solid("#0b0b12")];
    set.strokes = [solid(HEX.accent, 0.4)];
    set.dashPattern = [6, 4];
    set.cornerRadius = 16;
    shelf(set);
    CMP[name] = set;
    return set;
  }
  function single(comp, desc) {
    comp.description = desc;
    shelf(comp);
    CMP[comp.name] = comp;
    return comp;
  }
  /** Define a TEXT/BOOLEAN/INSTANCE_SWAP property and wire the given layers to it. */
  function prop(owner, compName, propName, type, def, nodes, field) {
    const key = owner.addComponentProperty(propName, type, def);
    PROP[`${compName}.${propName}`] = key;
    for (const n of nodes) n.componentPropertyReferences = Object.assign({}, n.componentPropertyReferences || {}, { [field]: key });
    return key;
  }
  /** setProperties using display names; non-variant props are mapped to their keys. */
  function setP(node, compName, props) {
    const mapped = {};
    for (const [k, v] of Object.entries(props)) mapped[PROP[`${compName}.${k}`] || k] = v;
    node.setProperties(mapped);
    return node;
  }
  function inst(name, props) {
    const c = CMP[name];
    const i = (c.type === "COMPONENT_SET" ? c.defaultVariant : c).createInstance();
    if (props) setP(i, name, props);
    return i;
  }

  /* ================================================================
     6. COMPONENTS
     ================================================================ */

  /* ---- Icons (swappable) ---- */
  const ICONC = {};
  {
    const names = ["arrow", "flag", "equal", "logout", "zap", "globe", "trophy", "users", "link",
      "gamepad", "bot", "book", "target", "flame", "hash", "layers", "clock"];
    names.forEach((n, i) => {
      const c = COMP(`Icon / ${n}`, null, 24, 24);
      const v = place(c, ICON(n, 24, HEX.violet), 0, 0);
      v.constraints = { horizontal: "SCALE", vertical: "SCALE" };
      for (const d of v.findAll(() => true)) d.constraints = { horizontal: "SCALE", vertical: "SCALE" };
      c.description = `${n} icon. Recolor by overriding the vector stroke.`;
      c.x = i * 56; c.y = 0;
      ICONC[n] = c;
    });
  }
  function iconInst(name, size, hex, filled) {
    const i = ICONC[name].createInstance();
    i.resize(size, size);
    tint(i, hex, filled);
    return i;
  }

  /* ---- Button ---- */
  const BTN_ICON = { Primary: HEX.white, Gold: HEX.ink, Secondary: "#f8fafc", Ghost: HEX.slate, Danger: HEX.error };
  {
    const SIZES = { Md: { h: 44, px: 22, gap: 8, ts: "Label/Md", icon: 16 }, Lg: { h: 52, px: 30, gap: 10, ts: "Label/Lg", icon: 18 } };
    const VARIANTS = {
      Primary: { fill: grad([[HEX.accent, 0], [HEX.magenta, 1]]), text: "accent/on-primary", glow: "Glow/Accent" },
      Gold: { fill: grad([[HEX.amber, 0], [HEX.gold, 1]]), text: solid(HEX.ink), glow: "Glow/Gold" },
      Secondary: { fill: vf("surface/raised", 0.6), stroke: vf("border/subtle"), text: "text/primary" },
      Ghost: { text: "text/secondary" },
      Danger: { fill: solid(HEX.error, 0.08), stroke: solid(HEX.error, 0.6), text: "accent/error" },
    };
    const comps = [], labels = [], leads = [], trails = [];
    for (const [vn, vs] of Object.entries(VARIANTS)) {
      for (const [sn, s] of Object.entries(SIZES)) {
        const c = COMP(`Variant=${vn}, Size=${sn}`, "HORIZONTAL", 120, s.h, { w: true });
        c.primaryAxisAlignItems = "CENTER";
        c.counterAxisAlignItems = "CENTER";
        padding(c, [0, s.px]);
        c.itemSpacing = s.gap;
        c.cornerRadius = 12;
        c.fills = vs.fill ? [vs.fill] : [];
        if (vs.stroke) stroke(c, vs.stroke);
        if (vs.glow) c.effectStyleId = ES[vs.glow].id;
        const lead = add(c, iconInst("flag", s.icon, BTN_ICON[vn]));
        lead.name = "Leading Icon";
        lead.visible = false; // off by default; the "Leading Icon" property turns it on
        labels.push(add(c, T("Play Now", s.ts, vs.text, { name: "Label" })));
        const trail = add(c, iconInst("arrow", s.icon, BTN_ICON[vn]));
        trail.name = "Trailing Icon";
        leads.push(lead); trails.push(trail);
        comps.push(c);
      }
    }
    const set = variantSet(comps, "Button", "Primary = accent → magenta gradient; Gold = ranked CTA; Danger = destructive.", "VERTICAL", 14);
    prop(set, "Button", "Label", "TEXT", "Play Now", labels, "characters");
    prop(set, "Button", "Leading Icon", "BOOLEAN", false, leads, "visible");
    prop(set, "Button", "Icon", "INSTANCE_SWAP", ICONC.flag.id, leads, "mainComponent");
    prop(set, "Button", "Trailing Icon", "BOOLEAN", true, trails, "visible");
  }

  /* ---- Avatar ---- */
  {
    const SIZES = { Sm: 32, Md: 40, Lg: 56, Xl: 88 };
    const comps = [], dots = [];
    for (const [sn, d] of Object.entries(SIZES)) {
      const c = COMP(`Size=${sn}`, null, d, d);
      const portrait = BOX(d, d, { name: "Portrait", radius: d / 2, clip: true, fill: grad([["#4c1d95", 0], ["#0e7490", 1]], D_GRAD) });
      place(c, portrait, 0, 0);
      const head = figma.createEllipse();
      head.resize(d * 0.3, d * 0.3);
      head.fills = [solid("#e2e8f0", 0.92)];
      head.name = "Head";
      place(portrait, head, d * 0.35, d * 0.2);
      const body = figma.createEllipse();
      body.resize(d * 0.6, d * 0.44);
      body.fills = [solid("#e2e8f0", 0.92)];
      body.name = "Shoulders";
      place(portrait, body, d * 0.2, d * 0.58);
      stroke(portrait, vf("accent/primary"), Math.max(1.5, d * 0.035));
      const ds = Math.max(9, d * 0.24);
      const dot = figma.createEllipse();
      dot.resize(ds, ds);
      dot.fills = [vf("accent/success")];
      dot.strokes = [vf("surface/base")];
      dot.strokeWeight = 2;
      dot.name = "Presence";
      place(c, dot, d - ds * 0.95, d - ds * 0.95);
      dots.push(dot);
      comps.push(c);
    }
    const set = variantSet(comps, "Avatar", "Player avatar. Replace the Portrait fill with the player's image.");
    prop(set, "Avatar", "Online", "BOOLEAN", true, dots, "visible");
  }

  /* ---- Rank Badge ---- */
  {
    const TIERS = { Bronze: ["#d97706", "Bronze I"], Silver: ["#cbd5e1", "Silver II"], Gold: [HEX.gold, "Gold II"], Platinum: [HEX.o, "Platinum I"], Diamond: ["#a78bfa", "Diamond I"] };
    const comps = [], labels = [];
    for (const [tier, [hex, label]] of Object.entries(TIERS)) {
      const c = COMP(`Tier=${tier}`, "HORIZONTAL", 80, 20, { w: true, h: true });
      c.counterAxisAlignItems = "CENTER";
      c.itemSpacing = 5;
      const trophy = tier === "Gold" || tier === "Bronze";
      add(c, ICON(trophy ? "trophy" : "shield", 14, hex, { filled: !trophy }));
      labels.push(add(c, T(label, "Label/Sm", solid(hex), { name: "Label" })));
      comps.push(c);
    }
    const set = variantSet(comps, "Rank Badge", "Competitive tier badge shown next to a player name.", "VERTICAL", 12);
    prop(set, "Rank Badge", "Label", "TEXT", "Gold II", labels, "characters");
  }

  /* ---- Marks ---- */
  for (const kind of ["X", "O"]) {
    const c = COMP(`Mark ${kind}`, null, 56, 56);
    const m = place(c, mark(kind, 56), 0, 0);
    m.constraints = { horizontal: "SCALE", vertical: "SCALE" };
    single(c, `Player ${kind} mark with neon glow (.mark-${kind.toLowerCase()} in globals.css).`);
  }

  /* ---- Board Cell ---- */
  {
    const STATES = { Empty: null, X: ["X", 1], O: ["O", 1], "X Fading": ["X", 0.28], "O Fading": ["O", 0.28] };
    const comps = [];
    for (const [st, spec] of Object.entries(STATES)) {
      const c = COMP(`State=${st}`, "HORIZONTAL", 104, 104);
      c.primaryAxisAlignItems = "CENTER";
      c.counterAxisAlignItems = "CENTER";
      c.cornerRadius = 14;
      c.fills = [grad([["#15151f", 0], ["#0f0f17", 1]], V_GRAD)];
      stroke(c, solid(HEX.accent, 0.22));
      if (spec) add(c, mark(spec[0], 60, { glow: spec[1] === 1, opacity: spec[1] }));
      comps.push(c);
    }
    variantSet(comps, "Board Cell", "Board square. Fading = mark queued for removal in Sliding mode.");
  }

  /* ---- Tab Pill ---- */
  {
    const comps = [], labels = [];
    for (const st of ["Active", "Inactive"]) {
      const c = COMP(`State=${st}`, "HORIZONTAL", 90, 34, { w: true });
      c.primaryAxisAlignItems = "CENTER";
      c.counterAxisAlignItems = "CENTER";
      padding(c, [0, 22]);
      c.cornerRadius = 999;
      if (st === "Active") {
        c.fills = [grad([[HEX.accent, 0], [HEX.violet, 1]])];
        c.effectStyleId = ES["Glow/Accent"].id;
      }
      labels.push(add(c, T("Global", "Label/Sm", st === "Active" ? "accent/on-primary" : "text/secondary", { name: "Label" })));
      comps.push(c);
    }
    const set = variantSet(comps, "Tab Pill", "Segmented filter pill.");
    prop(set, "Tab Pill", "Label", "TEXT", "Global", labels, "characters");
  }

  /* ---- Result Pill ---- */
  {
    const comps = [];
    for (const [r, hex] of Object.entries({ Win: HEX.success, Loss: HEX.error, Draw: HEX.slate })) {
      const c = COMP(`Result=${r}`, "HORIZONTAL", 52, 24);
      c.primaryAxisAlignItems = "CENTER";
      c.counterAxisAlignItems = "CENTER";
      c.cornerRadius = 6;
      c.fills = [solid(hex, 0.15)];
      stroke(c, solid(hex, 0.35));
      add(c, T(r, "Label/Sm", solid(hex), { name: "Label" }));
      comps.push(c);
    }
    variantSet(comps, "Result Pill", "Match outcome tag for recent-match tables.");
  }

  /* ---- Stat Tile ---- */
  {
    const c = COMP("Stat Tile", "VERTICAL", 140, 100, { h: true });
    c.counterAxisAlignItems = "CENTER";
    c.itemSpacing = 6;
    padding(c, [16, 10]);
    c.cornerRadius = 14;
    c.fills = [vf("surface/raised", 0.7)];
    stroke(c, vf("border/subtle"));
    const ic = add(c, iconInst("gamepad", 20, HEX.accent));
    ic.name = "Icon";
    const val = add(c, T("128", "Heading/Lg", "text/primary", { name: "Value" }));
    const cap = add(c, T("Games Played", "Body/Xs", "text/secondary", { name: "Caption" }));
    prop(c, "Stat Tile", "Icon", "INSTANCE_SWAP", ICONC.gamepad.id, [ic], "mainComponent");
    prop(c, "Stat Tile", "Value", "TEXT", "128", [val], "characters");
    prop(c, "Stat Tile", "Caption", "TEXT", "Games Played", [cap], "characters");
    single(c, "KPI tile: icon, value, caption.");
  }

  /* ---- User Chip ---- */
  {
    const c = COMP("User Chip", "HORIZONTAL", 160, 40, { w: true, h: true });
    c.counterAxisAlignItems = "CENTER";
    c.itemSpacing = 10;
    padding(c, [4, 14, 4, 4]);
    c.cornerRadius = 999;
    c.fills = [vf("surface/raised", 0.8)];
    stroke(c, vf("border/subtle"));
    add(c, inst("Avatar", { Size: "Sm" }));
    const id = add(c, AL("VERTICAL", { name: "Identity", gap: 0 }));
    const nm = add(id, T("Tushar", "Label/Sm", "text/primary", { name: "Name" }));
    add(id, inst("Rank Badge", { Tier: "Gold" })).name = "Rank Badge";
    add(c, ICON("chevron", 14, "#64748b"));
    prop(c, "User Chip", "Name", "TEXT", "Tushar", [nm], "characters");
    single(c, "Signed-in player chip in the nav bar.");
  }

  /* ---- Nav Bar (variant per active page) ---- */
  {
    const LINKS = ["Play", "Leaderboard", "How to Play", "Profile"];
    const comps = [];
    for (const active of ["Home", "Play", "Leaderboard", "Profile"]) {
      const c = COMP(`Active=${active}`, "HORIZONTAL", 1440, 72);
      c.primaryAxisAlignItems = "SPACE_BETWEEN";
      c.counterAxisAlignItems = "CENTER";
      padding(c, [0, 40]);
      c.fills = [vf("surface/base", 0.55)];
      borderOnly(c, solid(HEX.accent, 0.14), "bottom");
      c.effects = [blur("BACKGROUND_BLUR", 24)];

      const left = add(c, AL("HORIZONTAL", { name: "Left", gap: 48, align: "CENTER" }));
      const logo = add(left, AL("HORIZONTAL", { name: "Logo", gap: 10, align: "CENTER" }));
      add(logo, ICON("infinity", 30, HEX.violet, { stroke: 2.4 }));
      const word = add(logo, AL("HORIZONTAL", { name: "Wordmark", gap: 5, align: "CENTER" }));
      add(word, T("Infinite", "Heading/Sm", solid(HEX.violet), { name: "Infinite" })).fontName = SG("Bold");
      add(word, T("TTT", "Heading/Sm", "text/primary", { name: "TTT" })).fontName = SG("Bold");

      const links = add(left, AL("HORIZONTAL", { name: "Links", gap: 32, align: "CENTER" }));
      for (const l of LINKS) {
        const on = l === active;
        const item = add(links, AL("VERTICAL", { name: `Link / ${l}`, gap: 6, align: "CENTER" }));
        add(item, T(l, "Label/Md", on ? "text/primary" : "text/secondary", { name: "Label" })).fontName = IN(on ? "Semi Bold" : "Medium");
        const bar = figma.createRectangle();
        bar.resize(18, 2);
        bar.cornerRadius = 2;
        bar.fills = on ? [grad([[HEX.accent, 0], [HEX.magenta, 1]])] : [];
        bar.name = "Indicator";
        add(item, bar);
      }
      add(c, inst("User Chip")).name = "User Chip";
      comps.push(c);
    }
    variantSet(comps, "Nav Bar", "Top navigation. One variant per active destination.", "VERTICAL", 16);
  }

  /* ---- Feature Card (home) ---- */
  {
    const c = COMP("Feature Card", "VERTICAL", 190, 140, { h: true });
    c.counterAxisAlignItems = "CENTER";
    c.itemSpacing = 8;
    padding(c, [22, 16]);
    c.cornerRadius = 16;
    c.fills = [grad([["#16161f", 0, 0.85], ["#0f0f17", 1, 0.85]], V_GRAD)];
    stroke(c, solid(HEX.accent, 0.2));
    c.effectStyleId = ES["Elevation/Card"].id;
    const ic = add(c, iconInst("zap", 26, HEX.violet));
    ic.name = "Icon";
    const tt = add(c, T("Multiple Modes", "Label/Md", "text/primary", { name: "Title", align: "CENTER" }));
    const dd = add(c, T("Sliding, Expanding and more unique twists", "Body/Xs", "text/secondary", { name: "Description", align: "CENTER", width: 158 }), "FILL");
    prop(c, "Feature Card", "Icon", "INSTANCE_SWAP", ICONC.zap.id, [ic], "mainComponent");
    prop(c, "Feature Card", "Title", "TEXT", "Multiple Modes", [tt], "characters");
    prop(c, "Feature Card", "Description", "TEXT", "Sliding, Expanding and more unique twists", [dd], "characters");
    single(c, "Home feature highlight.");
  }

  /* ---- Action Card (play: with others / practice) ---- */
  {
    const c = COMP("Action Card", "VERTICAL", 277, 144, { h: true });
    c.counterAxisAlignItems = "CENTER";
    c.itemSpacing = 6;
    padding(c, [18, 18, 16, 18]);
    c.cornerRadius = 16;
    c.fills = [vf("surface/elevated", 0.85)];
    stroke(c, solid(HEX.accent, 0.18));
    const ic = add(c, iconInst("users", 22, HEX.violet));
    ic.name = "Icon";
    const tt = add(c, T("Play with Friends", "Label/Md", "text/primary", { name: "Title" }));
    const dd = add(c, T("Create a room and play with your friends.", "Body/Xs", "text/secondary", { name: "Description", align: "CENTER", width: 241 }), "FILL");
    const btn = inst("Button", { Variant: "Secondary", Size: "Md", Label: "Create Room", "Trailing Icon": false });
    btn.resize(btn.width, 34);
    btn.name = "Action";
    add(c, btn, "FILL");
    prop(c, "Action Card", "Icon", "INSTANCE_SWAP", ICONC.users.id, [ic], "mainComponent");
    prop(c, "Action Card", "Title", "TEXT", "Play with Friends", [tt], "characters");
    prop(c, "Action Card", "Description", "TEXT", "Create a room and play with your friends.", [dd], "characters");
    single(c, "Secondary way-to-play card with a compact action.");
  }

  /* ---- Leaderboard Row ---- */
  {
    const comps = [];
    for (const hl of ["Off", "On"]) {
      const c = COMP(`Highlight=${hl}`, "HORIZONTAL", 960, 52);
      c.counterAxisAlignItems = "CENTER";
      padding(c, [0, 20]);
      c.cornerRadius = 10;
      if (hl === "On") {
        c.fills = [grad([[HEX.accent, 0, 0.28], [HEX.accent, 1, 0.06]])];
        stroke(c, solid(HEX.accent, 0.6));
      }
      const cell = (w, name) => add(c, AL("HORIZONTAL", { name, gap: 10, align: "CENTER", w, h: 52 }));
      add(cell(70, "Rank"), T("4", "Mono/Md", "text/secondary", { name: "Rank" }));
      const p = cell(330, "Player");
      add(p, inst("Avatar", { Size: "Sm", Online: false }));
      add(p, T("Blaze", "Label/Md", "text/primary", { name: "Name" }));
      add(cell(220, "Tier"), inst("Rank Badge", { Tier: "Gold" })).name = "Rank Badge";
      add(cell(180, "Rating"), T("1654", "Mono/Md", "text/primary", { name: "Rating" }));
      add(cell(120, "Win Rate"), T("72%", "Mono/Md", solid(HEX.success), { name: "Win Rate" }));
      comps.push(c);
    }
    const set = variantSet(comps, "Leaderboard Row", "Ranking row. Highlight=On marks the signed-in player.", "VERTICAL", 10);
    for (const p of ["Rank", "Name", "Rating", "Win Rate"]) {
      const nodes = comps.map((c) => c.findOne((n) => n.type === "TEXT" && n.name === p));
      prop(set, "Leaderboard Row", p, "TEXT", nodes[0].characters, nodes, "characters");
    }
  }

  /* ---- Match Row ---- */
  {
    const c = COMP("Match Row", "HORIZONTAL", 1040, 50);
    c.counterAxisAlignItems = "CENTER";
    padding(c, [0, 20]);
    borderOnly(c, vf("border/subtle"), "bottom");
    const cell = (w, name) => add(c, AL("HORIZONTAL", { name, gap: 10, align: "CENTER", w, h: 50 }));
    add(cell(140, "Result"), inst("Result Pill")).name = "Result Pill";
    const o = cell(280, "Opponent");
    add(o, inst("Avatar", { Size: "Sm", Online: false }));
    const on = add(o, T("ShadowX", "Label/Md", "text/primary", { name: "Opponent" }));
    const mn = add(cell(200, "Mode"), T("Ranked", "Body/Sm", "text/secondary", { name: "Mode" }));
    const dn = add(cell(200, "Delta"), T("+18", "Mono/Md", solid(HEX.success), { name: "Delta" }));
    const dt = add(cell(180, "Date"), T("Today, 8:24 PM", "Body/Sm", "text/secondary", { name: "Date" }));
    prop(c, "Match Row", "Opponent", "TEXT", "ShadowX", [on], "characters");
    prop(c, "Match Row", "Mode", "TEXT", "Ranked", [mn], "characters");
    prop(c, "Match Row", "Delta", "TEXT", "+18", [dn], "characters");
    prop(c, "Match Row", "Date", "TEXT", "Today, 8:24 PM", [dt], "characters");
    single(c, "Recent match row. Set the nested Result Pill and Delta color for losses.");
  }

  /* ---- Player Card (match HUD) ---- */
  {
    const comps = [];
    for (const side of ["Left", "Right"]) {
      const L = side === "Left";
      const c = COMP(`Side=${side}`, "HORIZONTAL", 300, 92);
      c.counterAxisAlignItems = "CENTER";
      c.primaryAxisAlignItems = L ? "MIN" : "MAX";
      c.itemSpacing = 14;
      padding(c, [0, 18]);
      c.cornerRadius = 16;
      c.fills = [vf("surface/elevated", 0.85)];
      stroke(c, solid(L ? HEX.accent : HEX.o, 0.35));
      const av = inst("Avatar", { Size: "Lg" });
      const info = AL("VERTICAL", { name: "Info", gap: 3, align: L ? "MIN" : "MAX" });
      if (L) { add(c, av); add(c, info); } else { add(c, info); add(c, av); }
      add(info, T(L ? "Tushar" : "ShadowX", "Heading/Md", "text/primary", { name: "Name" }));
      const b = add(info, inst("Rank Badge", { Tier: L ? "Gold" : "Platinum" }));
      b.name = "Rank Badge";
      if (!L) setP(b, "Rank Badge", { Label: "Platinum I" });
      add(info, T(L ? "1240" : "1278", "Mono/Md", "text/secondary", { name: "Rating" }));
      comps.push(c);
    }
    const set = variantSet(comps, "Player Card", "Match HUD player block, mirrored per side.", "VERTICAL", 14);
    for (const p of ["Name", "Rating"]) {
      const nodes = comps.map((c) => c.findOne((n) => n.type === "TEXT" && n.name === p));
      prop(set, "Player Card", p, "TEXT", nodes[0].characters, nodes, "characters");
    }
  }

  /* ---- Podium Card ---- */
  {
    const PLACES = { First: [HEX.gold, 228, "1", "Nova", "1842"], Second: ["#cbd5e1", 196, "2", "ShadowX", "1798"], Third: ["#d97706", 196, "3", "Raven", "1764"] };
    const comps = [];
    for (const [pl, [hex, h, num, name, rating]] of Object.entries(PLACES)) {
      const first = pl === "First";
      const c = COMP(`Place=${pl}`, "VERTICAL", 220, h);
      c.primaryAxisAlignItems = "CENTER";
      c.counterAxisAlignItems = "CENTER";
      c.itemSpacing = 6;
      c.cornerRadius = 18;
      // Opaque base first: a glow shadow shows through a translucent fill and floods the card.
      c.fills = [solid("#101018"), grad([[hex, 0, first ? 0.22 : 0.12], [hex, 1, 0]], V_GRAD)];
      stroke(c, solid(hex, first ? 0.8 : 0.4), first ? 1.5 : 1);
      if (first) c.effectStyleId = ES["Glow/Gold"].id;
      const medal = add(c, AL("HORIZONTAL", { name: "Medal", w: 28, h: 28, radius: 14, align: "CENTER", justify: "CENTER", fill: solid(hex) }));
      add(medal, T(num, "Label/Sm", solid("#0b0b12"), { name: "Place" }));
      add(c, inst("Avatar", { Size: first ? "Lg" : "Md", Online: false }));
      add(c, T(name, "Label/Lg", "text/primary", { name: "Name" }));
      add(c, T(rating, "Mono/Lg", solid(first ? HEX.gold : "#f8fafc"), { name: "Rating" }));
      add(c, inst("Rank Badge", { Tier: first ? "Diamond" : "Platinum", Label: first ? "Diamond I" : "Platinum I" })).name = "Rank Badge";
      if (first) {
        const crown = ICON("crown", 30, HEX.gold, { filled: true });
        c.appendChild(crown);
        crown.layoutPositioning = "ABSOLUTE";
        crown.x = 95; crown.y = -18;
        crown.effectStyleId = ES["Glow/Gold"].id;
      }
      comps.push(c);
    }
    const set = variantSet(comps, "Podium Card", "Top-3 leaderboard spotlight.", "HORIZONTAL", 20);
    for (const p of ["Name", "Rating"]) {
      const nodes = comps.map((c) => c.findOne((n) => n.type === "TEXT" && n.name === p));
      prop(set, "Podium Card", p, "TEXT", nodes[0].characters, nodes, "characters");
    }
  }

  /* ================================================================
     7. ANIMATED 3D BACKGROUNDS
     ================================================================ */

  const W = 1440, H = 900;

  /**
   * Synthwave floor. Horizontal lines follow a perspective curve; rails are
   * sheared rectangles converging on a vanishing point. `phase` moves every
   * horizontal line one slot toward the viewer, and lines fade in at the
   * horizon / out at the bottom, so Phase A → B repeats seamlessly.
   */
  function horizonFloor(phase) {
    const f = BOX(W, H, { name: "Floor", clip: true });
    const horizon = H * 0.56;
    const depth = H - horizon;
    const vpx = W * 0.62;
    const haze = figma.createRectangle();
    haze.resize(W, 180);
    haze.fills = [grad([[HEX.accent, 0, 0], [HEX.accent, 0.55, 0.28], [HEX.magenta, 1, 0]], V_GRAD)];
    haze.effects = [blur("LAYER_BLUR", 40)];
    haze.name = "Horizon Haze";
    place(f, haze, 0, horizon - 110);
    const N = 16;
    for (let i = 0; i < N; i++) {
      const t = (i + phase) / N;
      const p = Math.pow(t, 2.4);
      const fade = Math.min(1, t * 4) * Math.min(1, (1 - t) * 5);
      const ln = figma.createRectangle();
      ln.resize(W, 1 + p * 2.2);
      ln.fills = [solid(i % 2 ? HEX.accent : HEX.violet, (0.12 + p * 0.55) * fade)];
      ln.name = `grid-h-${i}`;
      place(f, ln, 0, horizon + depth * p);
    }
    const M = 25;
    for (let j = 0; j < M; j++) {
      const xb = vpx + ((j / (M - 1)) * 2 - 1) * W * 1.5;
      const r = figma.createRectangle();
      r.resize(1.2, depth);
      r.fills = [grad([[HEX.accent, 0, 0], [HEX.accent, 0.35, 0.18], [HEX.violet, 1, 0.5]], V_GRAD)];
      r.name = `grid-v-${j}`;
      f.appendChild(r);
      r.relativeTransform = [[1, (xb - vpx) / depth, vpx], [0, 1, horizon]];
    }
    const veil = figma.createRectangle();
    veil.resize(W, 140);
    veil.fills = [grad([["#08080f", 0, 1], ["#08080f", 1, 0]], V_GRAD)];
    veil.name = "Veil";
    place(f, veil, 0, horizon - 2);
    return f;
  }

  function starfield(seed) {
    const f = BOX(W, H * 0.6, { name: "Stars" });
    let s = seed;
    const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 70; i++) {
      const d = figma.createEllipse();
      const r = 1 + rnd() * 1.8;
      d.resize(r, r);
      d.fills = [solid(rnd() > 0.7 ? HEX.o : "#e9d5ff", 0.25 + rnd() * 0.5)];
      d.name = `star-${i}`;
      place(f, d, rnd() * W, rnd() * H * 0.55);
    }
    return f;
  }

  /* ---- Bg / Grid Flow ---- */
  {
    const comps = [];
    for (const phase of ["A", "B"]) {
      const c = COMP(`Phase=${phase}`, null, W, H);
      c.clipsContent = true;
      c.fills = [vf("surface/base")];
      const sky = figma.createRectangle();
      sky.resize(W, H);
      sky.fills = [grad([["#0d0820", 0], ["#08080f", 0.6], ["#08080f", 1]], V_GRAD)];
      sky.name = "Sky";
      place(c, sky, 0, 0);
      place(c, starfield(42), 0, 0);
      place(c, horizonFloor(phase === "A" ? 0 : 1), 0, 0);
      comps.push(c);
    }
    variantSet(comps, "Bg / Grid Flow", "Animated 3D neon floor. A → B flows the grid toward the viewer (4s linear); B → A resets instantly, so it loops seamlessly. Press Present to see it move.", "VERTICAL", 40);
    await loopTo(comps[0], comps[1], smart(4, "LINEAR"));
    await loopTo(comps[1], comps[0], null);
  }

  /* ---- Bg / Glow Pulse ---- */
  {
    const comps = [];
    for (const st of ["Rest", "Peak"]) {
      const pk = st === "Peak";
      const c = COMP(`Pulse=${st}`, null, W, H);
      c.clipsContent = true;
      const blob = (name, hex, w, h, x, y, a) => {
        const e = figma.createEllipse();
        e.resize(w, h);
        e.fills = [radial([[hex, 0, a], [hex, 1, 0]])];
        e.effects = [blur("LAYER_BLUR", 90)];
        e.name = name;
        place(c, e, x, y);
      };
      blob("Glow / Violet", HEX.accent, pk ? 820 : 720, pk ? 620 : 540, pk ? 560 : 600, pk ? -120 : -80, pk ? 0.42 : 0.3);
      blob("Glow / Magenta", HEX.magenta, pk ? 560 : 480, pk ? 460 : 400, pk ? 1020 : 1060, pk ? 360 : 400, pk ? 0.26 : 0.16);
      blob("Glow / Cyan", HEX.o, pk ? 420 : 380, pk ? 360 : 320, pk ? -120 : -80, pk ? 460 : 500, pk ? 0.16 : 0.1);
      comps.push(c);
    }
    variantSet(comps, "Bg / Glow Pulse", "Breathing nebula glow over the grid. Ping-pong, 3.2s ease-in-out.", "VERTICAL", 40);
    await loopTo(comps[0], comps[1], smart(3.2));
    await loopTo(comps[1], comps[0], smart(3.2));
  }

  /* ---- Fx / Victory Ring ---- */
  {
    const comps = [];
    for (const st of ["Rest", "Peak"]) {
      const pk = st === "Peak";
      const c = COMP(`Pulse=${st}`, null, 300, 300);
      const hs = pk ? 300 : 270;
      const halo = figma.createEllipse();
      halo.resize(hs, hs);
      halo.fills = [radial([[HEX.accent, 0, pk ? 0.55 : 0.35], [HEX.magenta, 0.6, 0.12], [HEX.magenta, 1, 0]])];
      halo.effects = [blur("LAYER_BLUR", 30)];
      halo.name = "Halo";
      place(c, halo, (300 - hs) / 2, (300 - hs) / 2);
      const ring = figma.createEllipse();
      ring.resize(210, 210);
      ring.fills = [radial([["#1e1036", 0, 0.95], ["#0b0b12", 1, 0.95]])];
      ring.strokes = [grad([[HEX.violet, 0], [HEX.magenta, 1]], D_GRAD)];
      ring.strokeWeight = pk ? 5 : 3;
      ring.effectStyleId = ES["Glow/Accent Xl"].id;
      ring.name = "Ring";
      place(c, ring, 45, 45);
      const xs = pk ? 120 : 110;
      const x = mark("X", xs, { color: "#c084fc", weight: 7, glow: false });
      x.effectStyleId = ES["Glow/Accent Xl"].id;
      place(c, x, (300 - xs) / 2, (300 - xs) / 2);
      comps.push(c);
    }
    variantSet(comps, "Fx / Victory Ring", "Victory emblem. Ping-pong pulse, 1.4s ease-in-out.", "HORIZONTAL", 40);
    await loopTo(comps[0], comps[1], smart(1.4));
    await loopTo(comps[1], comps[0], smart(1.4));
  }
  log.push(`Components: ${Object.keys(CMP).length} (+${Object.keys(ICONC).length} icons)`);

  /* ================================================================
     8. SCREENS
     ================================================================ */

  await figma.setCurrentPageAsync(PAGE_SCREENS);
  const SCREENS = {};
  const LINKS = {};

  function screen(name, gx, gy, nav) {
    __step = `screen "${name}"`;
    const s = figma.createFrame();
    s.name = name;
    s.resize(W, H);
    s.x = gx * (W + 160);
    s.y = gy * (H + 200);
    s.fills = [vf("surface/base")];
    s.clipsContent = true;
    place(s, inst("Bg / Grid Flow"), 0, 0).name = "Bg / Grid Flow";
    place(s, inst("Bg / Glow Pulse"), 0, 0).name = "Bg / Glow Pulse";
    if (nav) place(s, inst("Nav Bar", { Active: nav }), 0, 0).name = "Nav Bar";
    SCREENS[name] = s;
    return s;
  }

  /** Centered content column below the nav. */
  function body(s, o = {}) {
    const w = def(o.w, W);
    const b = AL("VERTICAL", { name: "Content", gap: def(o.gap, 24), align: o.align || "CENTER", w });
    place(s, b, (W - w) / 2, def(o.y, 112));
    return b;
  }

  function card(o = {}) {
    return AL(o.dir || "VERTICAL", {
      name: o.name || "Card", gap: def(o.gap, 16), pad: def(o.pad, 24), radius: def(o.radius, 18), align: o.align, justify: o.justify,
      fill: o.fill || vf("surface/elevated", 0.82), stroke: o.stroke || solid(HEX.accent, 0.16),
      effect: o.effect || "Elevation/Card", w: o.w, h: o.h,
    });
  }

  function button(label, variant = "Primary", size = "Md", o = {}) {
    const props = { Variant: variant, Size: size, Label: label, "Trailing Icon": def(o.arrow, true) };
    if (o.icon) Object.assign(props, { "Leading Icon": true, Icon: ICONC[o.icon].id });
    const b = inst("Button", props);
    if (o.icon) tint(b.children.find((n) => n.name === "Leading Icon"), BTN_ICON[variant]);
    b.name = `Button / ${label}`;
    return b;
  }

  const overline = (text, hex = HEX.violet) => T(text, "Label/Overline", solid(hex), { name: "Overline" });

  function pageHeader(parent, over, title, sub) {
    const h = add(parent, AL("VERTICAL", { name: "Header", gap: 10, align: "CENTER" }));
    if (over) add(h, overline(over));
    add(h, T(title, "Heading/Xl", "text/primary", { name: "Title", align: "CENTER" }));
    if (sub) add(h, T(sub, "Body/Md", "text/secondary", { name: "Subtitle", align: "CENTER" }));
    return h;
  }

  function tabs(parent, items) {
    const t = add(parent, AL("HORIZONTAL", { name: "Tabs", gap: 4, pad: 4, radius: 999, fill: vf("surface/elevated", 0.9), stroke: vf("border/subtle") }));
    items.forEach((label, i) => add(t, inst("Tab Pill", { State: i === 0 ? "Active" : "Inactive", Label: label })).name = `Tab / ${label}`);
    return t;
  }

  function tableHeader(parent, cols) {
    const hdr = add(parent, AL("HORIZONTAL", { name: "Header Row", pad: [0, 20], h: 36, align: "CENTER" }));
    for (const [label, w] of cols) add(add(hdr, AL("HORIZONTAL", { name: label, w, h: 36, align: "CENTER" })), T(label, "Label/Overline", "text/tertiary"));
  }

  /* -------------------- 01 · HOME -------------------- */
  {
    const s = screen("01 Home", 0, 0, "Home");

    // 3D hero board: a sheared plane with a thickness slab under it
    const art = place(s, BOX(720, 700, { name: "Hero Art · 3D Board" }), 700, 110);
    const TILT = [[0.9, -0.28, 150], [0.36, 0.78, 60]];
    const slab = BOX(420, 420, { name: "Board Edge", radius: 28, fill: grad([[HEX.accent2, 0, 0.9], ["#1e0b3a", 1, 1]], D_GRAD) });
    art.appendChild(slab);
    slab.relativeTransform = [[TILT[0][0], TILT[0][1], TILT[0][2]], [TILT[1][0], TILT[1][1], TILT[1][2] + 24]];
    slab.effects = [shadow(HEX.accent, 0.5, 90, 40)];
    const plane = BOX(420, 420, { name: "Board Plane", radius: 28,
      fill: grad([["#1c1233", 0, 0.92], ["#0c0c16", 1, 0.95]], D_GRAD), stroke: grad([[HEX.violet, 0], [HEX.o, 1]], D_GRAD), strokeWeight: 2 });
    plane.effectStyleId = ES["Glow/Accent Xl"].id;
    art.appendChild(plane);
    const cs = 116, gap = 14, off = 20;
    ["X", "", "O", "", "X", "", "O", "", "X"].forEach((m, i) => {
      const cell = BOX(cs, cs, { name: `cell-${i}`, radius: 16, fill: grad([["#1a1a2c", 0, 0.9], ["#0e0e18", 1, 0.9]], V_GRAD), stroke: solid(HEX.accent, 0.35) });
      place(plane, cell, off + (i % 3) * (cs + gap), off + Math.floor(i / 3) * (cs + gap));
      if (m) place(cell, mark(m, 72), (cs - 72) / 2, (cs - 72) / 2);
    });
    plane.relativeTransform = TILT;
    for (const [k, sz, x, y] of [["O", 88, 60, 380], ["X", 64, 560, 70], ["O", 52, 610, 470], ["X", 44, 40, 110]]) {
      place(art, mark(k, sz, { weight: 7 }), x, y).name = `Floating ${k}`;
    }
    const tag = T("THINK\nADAPT\nWIN", "Heading/Md", grad([[HEX.x, 0], [HEX.magenta, 1]]), { name: "Tagline", align: "RIGHT" });
    tag.fontSize = 30;
    tag.lineHeight = { unit: "PERCENT", value: 95 };
    tag.letterSpacing = { unit: "PERCENT", value: 4 };
    tag.effectStyleId = ES["Glow/Player X"].id;
    place(art, tag, 560, 520);
    tag.rotation = 14;

    // copy column
    const left = place(s, AL("VERTICAL", { name: "Hero Copy", gap: 0 }), 80, 150);
    const sp = (h) => add(left, AL("VERTICAL", { name: "Spacer", h }));
    add(left, overline("The classic game. Reimagined."));
    sp(18);
    add(left, T("INFINITE", "Display/Hero", "text/primary", { name: "Title 1" }));
    add(left, T("TIC-TAC-TOE", "Display/Hero", grad([[HEX.violet, 0], [HEX.magenta, 0.6], [HEX.x, 1]]), { name: "Title 2", effect: "Glow/Accent" }));
    sp(22);
    add(left, T("Play online, climb the ranks, and challenge players worldwide in unique and exciting game modes.", "Body/Lg", "text/secondary", { name: "Lede", width: 460 }));
    sp(32);
    const ctas = add(left, AL("HORIZONTAL", { name: "CTAs", gap: 14, align: "CENTER" }));
    LINKS.homePlay = add(ctas, button("Play Now", "Primary", "Lg"));
    LINKS.homeBoard = add(ctas, button("View Leaderboard", "Secondary", "Lg", { arrow: false }));
    sp(44);
    const stats = add(left, AL("HORIZONTAL", { name: "Stats", align: "CENTER" }));
    [["10K+", "Players"], ["50K+", "Games Played"], ["4.8", "Community Rating"]].forEach(([v, l], i) => {
      const st = add(stats, AL("VERTICAL", { name: `Stat / ${l}`, gap: 2, pad: [0, 28, 0, i === 0 ? 0 : 28] }));
      if (i > 0) borderOnly(st, vf("border/subtle"), "left");
      const vr = add(st, AL("HORIZONTAL", { name: "Value", gap: 4, align: "CENTER" }));
      add(vr, T(v, "Heading/Lg", "text/primary", { name: "Value" }));
      if (i === 2) add(vr, ICON("star", 18, HEX.gold, { filled: true }));
      add(st, T(l, "Body/Sm", "text/tertiary", { name: "Caption" }));
    });
    sp(40);
    const feats = add(left, AL("HORIZONTAL", { name: "Features", gap: 14 }));
    for (const [ic, t, d, hex] of [
      ["zap", "Multiple Modes", "Sliding, Expanding and more unique twists", HEX.violet],
      ["globe", "Online PvP", "Real-time matches with players worldwide", HEX.o],
      ["trophy", "Ranked Play", "Climb the ladder and prove your skills", HEX.gold],
    ]) {
      const fc = add(feats, inst("Feature Card", { Icon: ICONC[ic].id, Title: t, Description: d }));
      tint(swapSlot(fc), hex);
      fc.name = `Feature / ${t}`;
    }
  }

  /* -------------------- 02 · PLAY -------------------- */
  {
    const s = screen("02 Play", 1, 0, "Play");
    const b = body(s, { y: 96, gap: 18 });
    pageHeader(b, "Play", "Choose Your Battle", "Different ways to play. Same infinite fun.");

    const modes = add(b, AL("HORIZONTAL", { name: "Modes", gap: 24 }));
    const modeCard = (o) => {
      const c = card({ name: `Mode / ${o.title}`, w: 420, align: "CENTER", gap: 8, pad: 22,
        fill: [solid("#0f0f17"), grad([[o.hex, 0, 0.2], [o.hex, 0.7, 0]], D_GRAD)], stroke: solid(o.hex, 0.55), effect: o.glow });
      c.clipsContent = true;
      const chip = add(c, AL("HORIZONTAL", { name: "Icon Chip", w: 44, h: 44, radius: 13, align: "CENTER", justify: "CENTER", fill: solid(o.hex, 0.14), stroke: solid(o.hex, 0.35) }));
      add(chip, ICON(o.icon, 22, o.hex));
      add(c, T(o.title, "Heading/Md", "text/primary", { name: "Title" }));
      const tag = add(c, AL("HORIZONTAL", { name: "Tag", pad: [3, 10], radius: 999, fill: solid(o.tagHex, 0.16), stroke: solid(o.tagHex, 0.4) }));
      add(tag, T(o.tag, "Label/Sm", solid(o.tagHex), { name: "Tag" }));
      add(c, T(o.desc, "Body/Sm", "text/secondary", { name: "Description", align: "CENTER", width: 260 }));
      const btn = add(c, button(o.cta, o.variant, "Md"));
      for (const [k, sz, x, y, a] of [[o.deco[0], 64, 20, 170, 0.5], [o.deco[1], 40, 350, 24, 0.4]]) {
        const d = mark(k, sz, { opacity: a });
        c.appendChild(d);
        d.layoutPositioning = "ABSOLUTE";
        d.x = x; d.y = y;
      }
      return { c, btn };
    };
    const quick = modeCard({ title: "Quick Play", icon: "globe", hex: HEX.accent, tag: "Online", tagHex: HEX.success, desc: "Find a random opponent and start playing instantly.", cta: "Play Now", variant: "Primary", glow: "Glow/Accent", deco: ["O", "X"] });
    const ranked = modeCard({ title: "Ranked Match", icon: "trophy", hex: HEX.gold, tag: "Competitive", tagHex: HEX.amber, desc: "Compete for ranks, earn ELO and climb the leaderboard.", cta: "Play Ranked", variant: "Gold", glow: "Glow/Gold", deco: ["X", "O"] });
    add(modes, quick.c);
    add(modes, ranked.c);
    LINKS.playQuick = quick.btn;
    LINKS.playRanked = ranked.btn;

    const section = (title, items) => {
      const wrap = add(b, AL("VERTICAL", { name: `Section / ${title}`, gap: 10 }));
      add(wrap, T(title, "Heading/Sm", "text/primary", { name: "Title" })).fontName = SG("Bold");
      const row = add(wrap, AL("HORIZONTAL", { name: "Cards", gap: 16 }));
      for (const it of items) {
        const ac = add(row, inst("Action Card", { Icon: ICONC[it.icon].id, Title: it.t, Description: it.d }));
        tint(swapSlot(ac), it.hex || HEX.violet);
        setP(ac.children.find((n) => n.name === "Action"), "Button", { Label: it.cta });
        if (it.w) ac.resize(it.w, ac.height);
        ac.name = `Action / ${it.t}`;
      }
    };
    section("Play with Others", [
      { icon: "users", t: "Play with Friends", d: "Create a room and play with your friends.", cta: "Create Room" },
      { icon: "link", t: "Private Match", d: "Generate a code and play with anyone.", cta: "Join with Code" },
      { icon: "gamepad", t: "Local Play", d: "Play on the same device with a friend.", cta: "Play Locally" },
    ]);
    section("Learn & Practice", [
      { icon: "bot", t: "Practice Mode", d: "Play against AI with different difficulty levels.", cta: "Start Practice", w: 424, hex: HEX.o },
      { icon: "book", t: "How to Play", d: "Learn the rules, modes and strategies.", cta: "View Guide", w: 424, hex: HEX.o },
    ]);
  }

  /* -------------------- 03 · RANKED MATCH -------------------- */
  {
    const s = screen("03 Ranked Match", 2, 0, null);
    const top = place(s, AL("HORIZONTAL", { name: "Match Bar", w: W, h: 72, align: "CENTER", justify: "SPACE_BETWEEN", pad: [0, 40], fill: vf("surface/base", 0.55) }), 0, 0);
    borderOnly(top, solid(HEX.accent, 0.14), "bottom");
    const logo = add(top, AL("HORIZONTAL", { name: "Logo", gap: 10, align: "CENTER" }));
    add(logo, ICON("infinity", 30, HEX.violet, { stroke: 2.4 }));
    add(logo, T("Infinite TTT", "Heading/Sm", "text/primary")).fontName = SG("Bold");
    LINKS.matchLeave = add(top, button("Leave Match", "Danger", "Md", { arrow: false, icon: "logout" }));

    const b = body(s, { y: 96, gap: 20 });
    const head = add(b, AL("VERTICAL", { name: "Header", gap: 4, align: "CENTER" }));
    add(head, overline("Ranked Match"));
    add(head, T("Sliding Mode · Best of 5", "Body/Sm", "text/secondary"));

    const players = add(b, AL("HORIZONTAL", { name: "Players", gap: 40, align: "CENTER" }));
    add(players, inst("Player Card", { Side: "Left", Name: "Tushar", Rating: "1240" }));
    add(players, T("VS", "Heading/Lg", grad([[HEX.violet, 0], [HEX.magenta, 1]]), { name: "VS", effect: "Glow/Accent" }));
    add(players, inst("Player Card", { Side: "Right", Name: "ShadowX", Rating: "1278" }));

    const turn = add(b, AL("VERTICAL", { name: "Turn", gap: 6, align: "CENTER" }));
    const pill = add(turn, AL("HORIZONTAL", { name: "Your Turn", gap: 8, align: "CENTER", pad: [6, 16], radius: 999, fill: solid(HEX.accent, 0.14), stroke: solid(HEX.accent, 0.5) }));
    const dot = figma.createEllipse();
    dot.resize(8, 8);
    dot.fills = [solid(HEX.violet)];
    dot.effectStyleId = ES["Glow/Accent"].id;
    dot.name = "Live Dot";
    add(pill, dot);
    add(pill, T("Your Turn", "Label/Md", solid("#c4b5fd")));
    const timer = add(turn, AL("HORIZONTAL", { name: "Timer", gap: 6, align: "CENTER" }));
    add(timer, ICON("clock", 14, HEX.slate));
    add(timer, T("02:34", "Mono/Md", "text/secondary"));

    const board = add(b, AL("VERTICAL", { name: "Board", gap: 12, pad: 14, radius: 22, fill: solid("#0c0c14"), stroke: solid(HEX.accent, 0.35), effect: "Glow/Accent" }));
    for (const r of [["X", "Empty", "O"], ["Empty", "X", "Empty"], ["O", "Empty", "Empty"]]) {
      const row = add(board, AL("HORIZONTAL", { name: "Row", gap: 12 }));
      for (const st of r) add(row, inst("Board Cell", { State: st }));
    }

    const meta = add(b, AL("HORIZONTAL", { name: "Round Meta", w: 620, justify: "SPACE_BETWEEN", align: "CENTER" }));
    add(meta, T("Round 3 / 5", "Label/Sm", "text/secondary"));
    add(meta, T("First to win 3 rounds", "Body/Sm", "text/tertiary"));

    const actions = place(s, AL("HORIZONTAL", { name: "Match Actions", w: 1280, justify: "SPACE_BETWEEN", align: "CENTER" }), 80, 812);
    add(actions, button("Surrender", "Danger", "Md", { arrow: false, icon: "flag" }));
    add(actions, button("Offer Draw", "Secondary", "Md", { arrow: false, icon: "equal" }));
  }

  /* -------------------- 04 · LEADERBOARD -------------------- */
  {
    const s = screen("04 Leaderboard", 0, 1, "Leaderboard");
    const b = body(s, { y: 100, gap: 22 });
    pageHeader(b, null, "Global Leaderboard", "The best players. The highest ratings. Will you make it to the top?");
    tabs(b, ["Global", "Friends", "Monthly"]);

    const podium = add(b, AL("HORIZONTAL", { name: "Podium", gap: 20, align: "MAX" }));
    // A text property shows its set-wide default in every variant, so each card sets its own values.
    add(podium, inst("Podium Card", { Place: "Second", Name: "ShadowX", Rating: "1798" }));
    add(podium, inst("Podium Card", { Place: "First", Name: "Nova", Rating: "1842" }));
    add(podium, inst("Podium Card", { Place: "Third", Name: "Raven", Rating: "1764" }));

    const table = add(b, card({ name: "Table", gap: 2, pad: [10, 10], w: 980 }));
    tableHeader(table, [["#", 70], ["Player", 330], ["Rank", 220], ["Rating", 180], ["Win Rate", 120]]);
    for (const [rank, name, tier, label, rating, wr, hl] of [
      ["4", "Blaze", "Gold", "Gold II", "1654", "72%"],
      ["5", "Tushar", "Gold", "Gold II", "1620", "68%", true],
      ["6", "Phantom", "Gold", "Gold II", "1588", "66%"],
      ["7", "Zenith", "Gold", "Gold I", "1567", "64%"],
      ["8", "Kairo", "Gold", "Gold I", "1541", "62%"],
    ]) {
      const r = add(table, inst("Leaderboard Row", { Highlight: hl ? "On" : "Off", Rank: rank, Name: name, Rating: rating, "Win Rate": wr }));
      setP(r.findOne((n) => n.type === "INSTANCE" && n.name === "Rank Badge"), "Rank Badge", { Tier: tier, Label: label });
      r.name = `Row / ${name}`;
    }
  }

  /* -------------------- 05 · PROFILE -------------------- */
  {
    const s = screen("05 Profile", 1, 1, "Profile");
    const b = body(s, { y: 100, gap: 20, w: 1100, align: "MIN" });
    add(b, T("My Profile", "Heading/Xl", "text/primary"));

    const summary = add(b, AL("HORIZONTAL", { name: "Summary", gap: 20 }), "FILL");
    const id = add(summary, card({ name: "Identity Card", w: 480, gap: 18, pad: 28 }));
    const who = add(id, AL("HORIZONTAL", { name: "Who", gap: 20, align: "CENTER" }));
    add(who, inst("Avatar", { Size: "Xl" }));
    const info = add(who, AL("VERTICAL", { name: "Info", gap: 6 }));
    add(info, T("Tushar", "Heading/Lg", "text/primary"));
    add(info, inst("Rank Badge", { Tier: "Gold" }));
    const rt = add(info, AL("HORIZONTAL", { name: "Rating", gap: 6, align: "CENTER" }));
    add(rt, ICON("clock", 14, HEX.slate));
    add(rt, T("1240 Rating", "Mono/Md", "text/secondary"));
    const xp = add(id, AL("VERTICAL", { name: "XP", gap: 8 }), "FILL");
    const track = add(xp, AL("HORIZONTAL", { name: "Track", h: 10, radius: 999, fill: vf("surface/raised") }), "FILL");
    const bar = figma.createRectangle();
    bar.resize(348, 10);
    bar.cornerRadius = 999;
    bar.fills = [grad([[HEX.accent, 0], [HEX.magenta, 1]])];
    bar.effectStyleId = ES["Glow/Accent"].id;
    bar.name = "Progress · 82%";
    add(track, bar);
    const xl = add(xp, AL("HORIZONTAL", { name: "XP Labels", justify: "SPACE_BETWEEN" }), "FILL");
    add(xl, T("82 / 100 XP", "Mono/Sm", "text/secondary"));
    add(xl, T("18 XP to Gold I", "Body/Xs", "text/tertiary"));

    const grid = add(summary, AL("VERTICAL", { name: "Stats Grid", gap: 14 }));
    const STATS = [
      ["gamepad", "128", "Games Played", HEX.accent], ["trophy", "72", "Games Won", HEX.gold], ["target", "56%", "Win Rate", HEX.o],
      ["flame", "7", "Win Streak", HEX.error], ["hash", "#125", "Global Rank", HEX.success], ["layers", "2", "Game Modes", HEX.o],
    ];
    for (let r = 0; r < 2; r++) {
      const row = add(grid, AL("HORIZONTAL", { name: "Stats Row", gap: 14 }));
      for (const [ic, v, c, hex] of STATS.slice(r * 3, r * 3 + 3)) {
        const t = inst("Stat Tile", { Icon: ICONC[ic].id, Value: v, Caption: c });
        t.resize(186, t.height);
        tint(swapSlot(t), hex);
        t.name = `Stat / ${c}`;
        add(row, t);
      }
    }

    tabs(b, ["Recent Matches", "Stats"]);
    const table = add(b, card({ name: "Recent Matches", gap: 0, pad: [8, 10] }), "FILL");
    tableHeader(table, [["Result", 140], ["Opponent", 280], ["Mode", 200], ["Rating Change", 200], ["Date", 180]]);
    for (const [res, op, mode, delta, date] of [
      ["Win", "ShadowX", "Ranked", "+18", "Today, 8:24 PM"],
      ["Win", "Nova", "Ranked", "+21", "Today, 7:56 PM"],
      ["Loss", "Kairo", "Ranked", "−15", "Today, 7:32 PM"],
      ["Win", "Blaze", "Quick Play", "+12", "Today, 6:10 PM"],
      ["Win", "Zenith", "Ranked", "+19", "Today, 5:41 PM"],
    ]) {
      const r = add(table, inst("Match Row", { Opponent: op, Mode: mode, Delta: delta, Date: date }));
      r.findOne((n) => n.type === "INSTANCE" && n.name === "Result Pill").setProperties({ Result: res });
      if (res === "Loss") r.findOne((n) => n.type === "TEXT" && n.name === "Delta").fills = [solid(HEX.error)];
      r.name = `Match / ${op}`;
    }
  }

  /* -------------------- 06 · VICTORY -------------------- */
  {
    const s = screen("06 Victory", 2, 1, "Play");
    let seed = 7;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const confetti = place(s, BOX(W, H, { name: "Confetti" }), 0, 0);
    for (let i = 0; i < 34; i++) {
      const r = figma.createRectangle();
      r.resize(4 + rnd() * 10, 2 + rnd() * 4);
      r.cornerRadius = 2;
      r.fills = [solid([HEX.violet, HEX.magenta, HEX.o, HEX.gold][i % 4], 0.5 + rnd() * 0.4)];
      r.name = `shard-${i}`;
      place(confetti, r, 300 + rnd() * 840, 140 + rnd() * 460);
      r.rotation = rnd() * 180;
    }

    const b = body(s, { y: 108, gap: 14 });
    add(b, T("VICTORY", "Display/Xl", grad([[HEX.violet, 0], ["#f0abfc", 0.5], [HEX.magenta, 1]]), { name: "Title", align: "CENTER", effect: "Glow/Accent Xl" })).fontSize = 72;
    add(b, T("You defeated ShadowX!", "Body/Lg", "text/secondary", { align: "CENTER" }));
    add(b, inst("Fx / Victory Ring")).name = "Victory Ring";
    add(b, T("+18 ELO", "Heading/Xl", solid(HEX.success), { name: "Delta", effect: "Glow/Success" }));

    const tiles = add(b, card({ name: "Match Summary", dir: "HORIZONTAL", gap: 0, pad: 0, radius: 16 }));
    [["3", "Rounds Won"], ["1", "Rounds Lost"], ["02:34", "Match Duration"]].forEach(([v, l], i) => {
      const t = add(tiles, AL("VERTICAL", { name: l, w: 180, gap: 2, pad: [18, 0], align: "CENTER" }));
      if (i > 0) borderOnly(t, vf("border/subtle"), "left");
      add(t, T(v, i === 2 ? "Mono/Lg" : "Heading/Lg", "text/primary"));
      add(t, T(l, "Body/Xs", "text/secondary"));
    });

    const btns = add(b, AL("HORIZONTAL", { name: "Actions", gap: 14 }));
    LINKS.victoryAgain = add(btns, button("Play Again", "Primary", "Lg", { arrow: false }));
    LINKS.victoryHome = add(btns, button("Back to Home", "Secondary", "Lg", { arrow: false }));
  }

  /* ================================================================
     9. PROTOTYPE FLOW
     ================================================================ */

  __step = "prototype links";
  const S = SCREENS;
  await clickTo(LINKS.homePlay, S["02 Play"]);
  await clickTo(LINKS.homeBoard, S["04 Leaderboard"]);
  await clickTo(LINKS.playQuick, S["03 Ranked Match"]);
  await clickTo(LINKS.playRanked, S["03 Ranked Match"]);
  await clickTo(LINKS.matchLeave, S["06 Victory"], smart(0.6, "EASE_OUT"));
  await clickTo(LINKS.victoryAgain, S["03 Ranked Match"]);
  await clickTo(LINKS.victoryHome, S["01 Home"]);
  const NAV_DEST = { Play: "02 Play", Leaderboard: "04 Leaderboard", Profile: "05 Profile" };
  for (const name of ["01 Home", "02 Play", "04 Leaderboard", "05 Profile", "06 Victory"]) {
    const nav = S[name].children.find((n) => n.name === "Nav Bar");
    for (const [label, dest] of Object.entries(NAV_DEST)) {
      if (dest !== name) await clickTo(nav.findOne((n) => n.name === `Link / ${label}`), S[dest], smart(0.4, "EASE_OUT"));
    }
    if (name !== "01 Home") await clickTo(nav.findOne((n) => n.name === "Logo"), S["01 Home"], smart(0.4, "EASE_OUT"));
  }
  PAGE_SCREENS.flowStartingPoints = [{ nodeId: S["01 Home"].id, name: "Infinite TTT — main flow" }];

  /* ================================================================
     10. FOUNDATIONS PAGE — visible token reference
     ================================================================ */

  __step = "foundations page";
  await figma.setCurrentPageAsync(PAGE_FOUND);
  const sheet = AL("VERTICAL", { name: "Token Reference", gap: 36, pad: 48, radius: 24, fill: vf("surface/base") });
  PAGE_FOUND.appendChild(sheet);
  add(sheet, T("Infinite TTT · Foundations", "Heading/Xl", "text/primary"));
  const groups = {};
  for (const name of Object.keys(COLOR_TOKENS)) {
    const g = name.split("/")[0];
    (groups[g] = groups[g] || []).push(name);
  }
  for (const [g, names] of Object.entries(groups)) {
    const sec = add(sheet, AL("VERTICAL", { name: g, gap: 12 }));
    add(sec, T(g, "Label/Overline", "text/tertiary"));
    const row = add(sec, AL("HORIZONTAL", { name: "Swatches", gap: 12 }));
    for (const n of names) {
      const sw = add(row, AL("VERTICAL", { name: n, gap: 8, w: 132 }));
      const isText = n.startsWith("text/"), isBorder = n.startsWith("border/");
      const chip = add(sw, AL("HORIZONTAL", { name: "Chip", h: 64, radius: 12, align: "CENTER", justify: "CENTER",
        fill: vf(isText || isBorder ? "surface/raised" : n), stroke: solid("#ffffff", 0.08) }), "FILL");
      if (isText) add(chip, T("Aa", "Heading/Md", n));
      if (isBorder) stroke(chip, vf(n), 3);
      add(sw, T(n, "Mono/Sm", "text/secondary"));
      add(sw, T(COLOR_TOKENS[n][0], "Mono/Sm", "text/muted"));
    }
  }
  const ramp = add(sheet, AL("VERTICAL", { name: "Type Ramp", gap: 14 }));
  add(ramp, T("Type", "Label/Overline", "text/tertiary"));
  for (const name of Object.keys(TEXT_STYLES)) {
    const r = add(ramp, AL("HORIZONTAL", { name, gap: 24, align: "CENTER" }));
    add(add(r, AL("HORIZONTAL", { name: "Label", w: 180 })), T(name, "Mono/Sm", "text/tertiary"));
    add(r, T(name.startsWith("Display") ? "Infinite" : "The board never ends", name, "text/primary"));
  }

  await figma.setCurrentPageAsync(PAGE_SCREENS);
  figma.viewport.scrollAndZoomIntoView(PAGE_SCREENS.children);

  log.push(`Screens: ${Object.keys(SCREENS).length}`);
  return "✅ Infinite TTT design built\n" + log.join("\n") + "\nSelect '01 Home' and press Present (▶) to play the flow.";
}

const __out = typeof print === "function" ? print : console.log;
try {
  __out(await build());
} catch (e) {
  const msg = `❌ Build failed at ${__step}: ${e && e.message ? e.message : e}`;
  __out(msg);
  throw new Error(msg);
}
