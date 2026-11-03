/* =========================================================
   Site timelapse — a real-time 3D construction timelapse
   (Three.js). Bricks are laid course by course with mortar
   joints, slabs are poured, scaffolding rises with the walls,
   a tower crane lifts brick pallets, and the day turns into a
   lit-up night at handover.
   Markup: <div class="sitecam" data-sitecam></div>
   The scene is a pure function of time t, so it can be paused,
   scrubbed and replayed like a real video.
   ========================================================= */
(function () {
  const root = document.querySelector("[data-sitecam]");
  if (!root) return;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const hasGL = (() => {
    try { const c = document.createElement("canvas"); return !!(window.WebGLRenderingContext && (c.getContext("webgl2") || c.getContext("webgl"))); }
    catch (e) { return false; }
  })();
  if (!window.THREE || !hasGL) {
    root.classList.add("sitecam--fallback");
    root.innerHTML = `<img src="https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=1100&q=80" alt="Gillani construction site">`;
    return;
  }
  const T = THREE;

  /* ---------- Helpers ---------- */
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const smooth = (p) => { p = clamp(p); return p * p * (3 - 2 * p); };
  const easeOut = (p) => 1 - Math.pow(1 - clamp(p), 3);
  const rand = (() => { let s = 7; return () => ((s = (s * 16807) % 2147483647) / 2147483647); })();
  const lerpColor = (a, b, k) => new T.Color(a).lerp(new T.Color(b), k);

  function canvasTex(w, h, draw, repeat) {
    const c = document.createElement("canvas");
    c.width = w; c.height = h;
    draw(c.getContext("2d"), w, h);
    const t = new T.CanvasTexture(c);
    t.colorSpace = T.SRGBColorSpace;
    t.anisotropy = 4;
    if (repeat) { t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); }
    return t;
  }
  function noise(ctx, w, h, base, spread, dots = 0) {
    ctx.fillStyle = base; ctx.fillRect(0, 0, w, h);
    const img = ctx.getImageData(0, 0, w, h);
    for (let i = 0; i < img.data.length; i += 4) {
      const n = (rand() - 0.5) * spread;
      img.data[i] += n; img.data[i + 1] += n; img.data[i + 2] += n;
    }
    ctx.putImageData(img, 0, 0);
    for (let i = 0; i < dots; i++) {
      ctx.fillStyle = `rgba(0,0,0,${rand() * 0.18})`;
      ctx.fillRect(rand() * w, rand() * h, 1 + rand() * 2, 1 + rand() * 2);
    }
  }

  /* ---------- Building definition (metres) ---------- */
  const PITCH = 0.45, BL = 0.43, BH = 0.13, CP = 0.15, BW = 0.2;
  const X = 22 * PITCH, Z = 14 * PITCH;            // 9.9m x 6.3m footprint
  const COURSES = 18, SLAB = 0.22, FOUND = 0.45, FLOORS = 4, PARAPET = 5;
  const floorY = (f) => FOUND + f * (COURSES * CP + SLAB);
  const TOP = floorY(FLOORS) + PARAPET * CP + 0.08;
  const DROP = 0.28, COURSE_T = 0.17;

  // walls walked by the mason: front -> right -> back -> left
  const winF = [[1.05, 2.4], [4.27, 5.63], [7.5, 8.85]];
  const winS = [[1.0, 2.35], [3.55, 4.9]];
  const WALLS = [
    { o: [-X / 2, Z / 2 - BW / 2], d: [1, 0], len: X, n: [0, 1], holes: winF, door: true },
    { o: [X / 2 - BW / 2, Z / 2 - BW], d: [0, -1], len: Z - 2 * BW, n: [1, 0], holes: winS },
    { o: [X / 2, -Z / 2 + BW / 2], d: [-1, 0], len: X, n: [0, -1], holes: winF },
    { o: [-X / 2 + BW / 2, -Z / 2 + BW], d: [0, 1], len: Z - 2 * BW, n: [-1, 0], holes: winS },
  ];
  const openingsFor = (w, f, c, roof) => {
    if (roof) return [];
    const out = [];
    w.holes.forEach(([a, b], i) => {
      const isDoor = w.door && f === 0 && i === 1;
      if ((isDoor && c <= 14) || (!isDoor && c >= 5 && c <= 14)) out.push([a, b]);
      if (c === 15) out.push([a - 0.15, b + 0.15]); // lintel course
    });
    return out;
  };
  const subtract = (seg, holes) => {
    let parts = [seg];
    for (const [ha, hb] of holes) {
      parts = parts.flatMap(([a, b]) => (hb <= a || ha >= b ? [[a, b]] : [[a, Math.min(b, ha)], [Math.max(a, hb), b]].filter(([p, q]) => q - p > 0.05)));
    }
    return parts;
  };

  /* ---------- Schedule ---------- */
  const bricks = [], lintels = [], panes = [], slabs = [], stages = [], heights = [];
  let t = 0.6;
  stages.push({ t: 0, floor: 0, label: "Site preparation" });
  stages.push({ t, floor: 0, label: "Pouring the foundation" });
  slabs.push({ x: 0, y: 0, z: 0, w: X + 0.6, h: FOUND, d: Z + 0.6, t0: t, dur: 1.0, found: true });
  t += 1.15;
  heights.push([t, FOUND]);

  const CLAY = [0xa44a2a, 0x9a4226, 0xb0532f, 0x8f3d22, 0xa9502d, 0xb85b36, 0x96462a];
  const layCourse = (f, c, roof) => {
    const base = floorY(f) + c * CP;
    const pieces = [];
    WALLS.forEach((w, wi) => {
      const off = ((c + wi) % 2) * (PITCH / 2);
      for (let s = -off; s < w.len; s += PITCH) {
        for (const [a, b] of subtract([Math.max(0, s), Math.min(w.len, s + BL)], openingsFor(w, f, c, roof))) {
          const m = (a + b) / 2;
          pieces.push({
            x: w.o[0] + w.d[0] * m, z: w.o[1] + w.d[1] * m, y: base + BH / 2,
            len: b - a, rot: w.d[0] === 0 ? Math.PI / 2 : 0,
            color: CLAY[Math.floor(rand() * CLAY.length)], v: 0.85 + rand() * 0.3,
          });
        }
      }
      if (!roof && c === 15) {
        w.holes.forEach(([a, b]) => {
          const m = (a + b) / 2;
          lintels.push({ x: w.o[0] + w.d[0] * m, z: w.o[1] + w.d[1] * m, y: base + CP / 2, len: b - a + 0.3, rot: w.d[0] === 0 ? Math.PI / 2 : 0, t0: t });
        });
      }
    });
    const step = COURSE_T / pieces.length;
    pieces.forEach((p) => { p.t0 = t; bricks.push(p); t += step; });
    heights.push([t, base + CP]);
  };

  for (let f = 0; f < FLOORS; f++) {
    stages.push({ t, floor: f + 1, label: "Laying bricks" });
    for (let c = 0; c < COURSES; c++) layCourse(f, c, false);
    t += 0.15;
    stages.push({ t, floor: f + 1, label: "Pouring the roof slab" });
    slabs.push({ x: 0, y: floorY(f) + COURSES * CP, z: 0, w: X + 0.1, h: SLAB, d: Z + 0.1, t0: t, dur: 0.75 });
    t += 0.85;
    heights.push([t, floorY(f + 1)]);
  }
  stages.push({ t, floor: FLOORS, label: "Roof parapet" });
  for (let c = 0; c < PARAPET; c++) layCourse(FLOORS, c, true);
  slabs.push({ x: 0, y: floorY(FLOORS) + PARAPET * CP, z: 0, w: X + 0.12, h: 0.08, d: Z + 0.12, t0: t, dur: 0.4, coping: true });
  t += 0.5;

  const SCAFF_OFF = t;
  stages.push({ t, floor: FLOORS, label: "Scaffolding down · glazing" });
  WALLS.forEach((w) => {
    for (let f = 0; f < FLOORS; f++) {
      w.holes.forEach(([a, b], i) => {
        const door = w.door && f === 0 && i === 1;
        const c0 = door ? 0 : 5, c1 = 14;
        const m = (a + b) / 2;
        panes.push({
          x: w.o[0] + w.d[0] * m, z: w.o[1] + w.d[1] * m,
          y: floorY(f) + ((c0 + c1 + 1) / 2) * CP, w: b - a, h: (c1 - c0 + 1) * CP,
          rot: w.d[0] === 0 ? Math.PI / 2 : 0, door, lit: rand() > 0.3, t0: t + 0.4 + rand() * 1.3,
        });
      });
    }
  });
  t += 1.9;
  const SIGN_T = t;
  stages.push({ t, floor: FLOORS, label: "Handover ready" });
  const END = t + 4.2;

  const heightAt = (time) => {
    let h = 0;
    for (const [tt, hh] of heights) if (time >= tt) h = hh;
    for (const b of bricks) { if (b.t0 > time) break; h = Math.max(h, b.y + BH / 2); }
    return h;
  };

  /* ---------- HUD markup ---------- */
  root.innerHTML = `
    <div class="sitecam__gl" role="img" aria-label="3D timelapse of a Gillani building being constructed brick by brick"></div>
    <div class="sitecam__top">
      <span class="sitecam__rec">TIMELAPSE</span>
      <span class="sitecam__day">Day 1</span>
    </div>
    <div class="sitecam__stage"><b>Site preparation</b><span></span></div>
    <div class="sitecam__controls">
      <button class="sitecam__btn" data-act="play" aria-label="Pause">
        <svg class="i-pause" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>
        <svg class="i-play" viewBox="0 0 24 24" fill="currentColor"><path d="M7 5v14l12-7z"/></svg>
      </button>
      <button class="sitecam__btn" data-act="restart" aria-label="Replay">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 12a8 8 0 1 0 2.4-5.7M4 4v4h4"/></svg>
      </button>
      <div class="sitecam__timeline" role="slider" aria-label="Seek" tabindex="0"><span></span><i></i></div>
      <span class="sitecam__time">00:00</span>
      <button class="sitecam__btn sitecam__speed" data-act="speed" aria-label="Playback speed">1×</button>
    </div>`;
  const host = root.querySelector(".sitecam__gl");

  /* ---------- Renderer / scene ---------- */
  const renderer = new T.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(1.75, window.devicePixelRatio || 1));
  renderer.outputColorSpace = T.SRGBColorSpace;
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = T.PCFSoftShadowMap;
  host.appendChild(renderer.domElement);

  const scene = new T.Scene();
  scene.fog = new T.Fog(0xcfe0ea, 70, 230);
  const camera = new T.PerspectiveCamera(36, 1, 0.5, 600);

  /* sky dome: gradient + sun glow + stars */
  const skyU = {
    top: { value: new T.Color() }, hor: { value: new T.Color() }, sunDir: { value: new T.Vector3() },
    sunCol: { value: new T.Color() }, stars: { value: 0 },
  };
  const sky = new T.Mesh(new T.SphereGeometry(400, 32, 16), new T.ShaderMaterial({
    side: T.BackSide, depthWrite: false, fog: false, uniforms: skyU,
    vertexShader: "varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
    fragmentShader: `
      uniform vec3 top, hor, sunDir, sunCol; uniform float stars; varying vec3 vDir;
      float h(vec3 p){ return fract(sin(dot(p, vec3(12.9898,78.233,45.164))) * 43758.5453); }
      void main(){
        float y = max(vDir.y, 0.0);
        vec3 col = mix(hor, top, pow(y, 0.55));
        float s = max(dot(vDir, normalize(sunDir)), 0.0);
        col += sunCol * (pow(s, 600.0) * 4.0 + pow(s, 12.0) * 0.35);
        vec3 g = floor(vDir * 220.0);
        float st = step(0.9965, h(g)) * smoothstep(0.05, 0.4, y) * stars;
        col += vec3(st);
        if (vDir.y < 0.0) col = hor * 0.9;
        gl_FragColor = vec4(col, 1.0);
      }`,
  }));
  scene.add(sky);

  const hemi = new T.HemisphereLight(0xdfefff, 0x4b5a3a, 0.9);
  scene.add(hemi);
  const sun = new T.DirectionalLight(0xfff1dc, 2.6);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -22, right: 22, top: 22, bottom: -22, near: 1, far: 120 });
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.03;
  scene.add(sun, sun.target);
  const moon = new T.DirectionalLight(0x8fa6d8, 0);
  moon.position.set(-30, 40, 20);
  scene.add(moon);

  /* ---------- Materials & textures ---------- */
  const brickTex = canvasTex(64, 32, (c, w, h) => noise(c, w, h, "#e6e1dc", 46, 40));
  const concreteTex = canvasTex(256, 256, (c, w, h) => noise(c, w, h, "#b9b5ad", 26, 400), [2, 2]);
  const grassTex = canvasTex(256, 256, (c, w, h) => {
    noise(c, w, h, "#5f8a3c", 36, 0);
    for (let i = 0; i < 900; i++) { c.fillStyle = `rgba(${40 + rand() * 50},${90 + rand() * 60},${20 + rand() * 30},.5)`; c.fillRect(rand() * w, rand() * h, 1, 2 + rand() * 3); }
  }, [40, 40]);
  const dirtTex = canvasTex(256, 256, (c, w, h) => noise(c, w, h, "#8c7357", 40, 700), [6, 5]);
  const asphaltTex = canvasTex(256, 256, (c, w, h) => noise(c, w, h, "#3d4044", 22, 900), [16, 1.5]);

  const M = {
    brick: new T.MeshStandardMaterial({ map: brickTex, roughness: 0.88, metalness: 0 }),
    mortar: new T.MeshStandardMaterial({ color: 0xc9c3b6, roughness: 1 }),
    concrete: new T.MeshStandardMaterial({ map: concreteTex, roughness: 0.92 }),
    grass: new T.MeshStandardMaterial({ map: grassTex, roughness: 1 }),
    dirt: new T.MeshStandardMaterial({ map: dirtTex, roughness: 1 }),
    asphalt: new T.MeshStandardMaterial({ map: asphaltTex, roughness: 0.95 }),
    steel: new T.MeshStandardMaterial({ color: 0x9aa1a6, roughness: 0.45, metalness: 0.7 }),
    crane: new T.MeshStandardMaterial({ color: 0xf0b400, roughness: 0.5, metalness: 0.35 }),
    dark: new T.MeshStandardMaterial({ color: 0x2f3337, roughness: 0.6, metalness: 0.3 }),
    wood: new T.MeshStandardMaterial({ color: 0x9b7448, roughness: 0.85 }),
    frame: new T.MeshStandardMaterial({ color: 0x2b2e31, roughness: 0.4, metalness: 0.6 }),
    glass: new T.MeshStandardMaterial({ color: 0x1d3446, roughness: 0.08, metalness: 0.65 }),
    glassLit: new T.MeshStandardMaterial({ color: 0x1d3446, roughness: 0.08, metalness: 0.4, emissive: 0xff9f45, emissiveIntensity: 0 }),
    door: new T.MeshStandardMaterial({ color: 0x4a3324, roughness: 0.6 }),
  };
  const box = new T.BoxGeometry(1, 1, 1);
  const add = (geo, mat, opts = {}) => {
    const m = new T.Mesh(geo, mat);
    m.castShadow = opts.cast !== false; m.receiveShadow = true;
    if (opts.pos) m.position.set(...opts.pos);
    if (opts.scale) m.scale.set(...opts.scale);
    (opts.parent || scene).add(m);
    return m;
  };

  /* ---------- Site ---------- */
  const ground = add(new T.PlaneGeometry(600, 600), M.grass, { cast: false });
  ground.rotation.x = -Math.PI / 2;
  const site = add(new T.PlaneGeometry(X + 14, Z + 9), M.dirt, { cast: false, pos: [-1, 0.01, -0.5] });
  site.rotation.x = -Math.PI / 2;
  const road = add(new T.PlaneGeometry(300, 7), M.asphalt, { cast: false, pos: [0, 0.015, Z / 2 + 8.5] });
  road.rotation.x = -Math.PI / 2;
  const dashMat = new T.MeshStandardMaterial({ color: 0xe8e4d8, roughness: 0.8 });
  for (let i = -20; i < 20; i++) {
    const d = add(new T.PlaneGeometry(2.2, 0.16), dashMat, { cast: false, pos: [i * 5, 0.02, Z / 2 + 8.5] });
    d.rotation.x = -Math.PI / 2;
  }
  // footpath
  add(box, M.concrete, { pos: [0, 0.06, Z / 2 + 4.6], scale: [300, 0.12, 1.6], cast: false });

  // branded site hoarding with a gate
  const hoardTex = canvasTex(1024, 128, (c, w, h) => {
    const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, "#0fa24b"); g.addColorStop(1, "#0a7a37");
    c.fillStyle = g; c.fillRect(0, 0, w, h);
    c.fillStyle = "#fff"; c.font = "700 46px Manrope, Arial, sans-serif"; c.textBaseline = "middle";
    c.fillText("GILLANI ESTATE & BUILDERS", 40, h / 2);
    c.font = "500 30px Manrope, Arial, sans-serif"; c.globalAlpha = 0.85;
    c.fillText("Building dreams, brick by brick · 051-4500007", 620, h / 2);
  });
  const hoardMat = new T.MeshStandardMaterial({ map: hoardTex, roughness: 0.7 });
  const fenceZ = Z / 2 + 3.4;
  [[-X / 2 - 5.5, -1.6], [1.6, X / 2 + 5.5]].forEach(([a, b]) => add(box, hoardMat, { pos: [(a + b) / 2, 1.1, fenceZ], scale: [b - a, 2.2, 0.08] }));
  add(box, M.steel, { pos: [-1.6, 1.15, fenceZ], scale: [0.12, 2.3, 0.12] });
  add(box, M.steel, { pos: [1.6, 1.15, fenceZ], scale: [0.12, 2.3, 0.12] });

  // brick pallets waiting on site
  const stackTex = canvasTex(128, 64, (c, w, h) => {
    c.fillStyle = "#cfc6b6"; c.fillRect(0, 0, w, h);
    for (let r = 0; r < 8; r++) for (let k = -1; k < 5; k++) {
      c.fillStyle = `hsl(${12 + rand() * 8},${45 + rand() * 15}%,${33 + rand() * 9}%)`;
      c.fillRect(k * 30 + (r % 2) * 15 + 1, r * 8 + 1, 28, 6);
    }
  });
  const stackMat = new T.MeshStandardMaterial({ map: stackTex, roughness: 0.9 });
  const pallet = (x, z, parent) => {
    add(box, M.wood, { pos: [x, 0.07, z], scale: [1.1, 0.14, 1.1], parent });
    add(box, stackMat, { pos: [x, 0.62, z], scale: [1.0, 0.96, 1.0], parent });
  };
  pallet(-X / 2 - 3.2, Z / 2 + 1.4); pallet(-X / 2 - 1.8, Z / 2 + 1.6); pallet(-X / 2 - 3.1, Z / 2 + 0.1);
  // sand + cement bags
  const sand = add(new T.ConeGeometry(1.3, 1.0, 20), new T.MeshStandardMaterial({ color: 0xc8ab78, roughness: 1 }), { pos: [X / 2 + 3, 0.5, Z / 2 + 0.6] });
  sand.scale.set(1, 1, 0.8);

  // trees
  const leaf = new T.MeshStandardMaterial({ color: 0x3f6b2c, roughness: 0.9 });
  const trunk = new T.MeshStandardMaterial({ color: 0x5a4330, roughness: 1 });
  const tree = (x, z, s = 1) => {
    add(new T.CylinderGeometry(0.12 * s, 0.18 * s, 2.2 * s, 8), trunk, { pos: [x, 1.1 * s, z] });
    add(new T.IcosahedronGeometry(1.4 * s, 1), leaf, { pos: [x, 2.9 * s, z] });
    add(new T.IcosahedronGeometry(1.0 * s, 1), leaf, { pos: [x + 0.6 * s, 3.6 * s, z - 0.3 * s] });
  };
  [[-14, 6, 1.1], [14, 7, 1], [-18, -8, 1.3], [19, -6, 1.2], [8, 15, 0.9], [-9, 15, 1], [24, 14, 1.2], [-24, 13, 1.1]].forEach(([x, z, s]) => tree(x, z, s));

  // neighbourhood blocks with windows (lit at night)
  const facadeTex = canvasTex(128, 256, (c, w, h) => {
    noise(c, w, h, "#c9c2b5", 18, 50);
    for (let y = 10; y < h - 10; y += 22) for (let x = 8; x < w - 8; x += 24) { c.fillStyle = "#4b5966"; c.fillRect(x, y, 14, 14); }
  }, [1, 1]);
  const facadeLight = canvasTex(128, 256, (c, w, h) => {
    c.fillStyle = "#000"; c.fillRect(0, 0, w, h);
    for (let y = 10; y < h - 10; y += 22) for (let x = 8; x < w - 8; x += 24) {
      if (rand() > 0.45) { c.fillStyle = rand() > 0.3 ? "#ffcf8a" : "#cfe4ff"; c.fillRect(x, y, 14, 14); }
    }
  });
  const neighMat = new T.MeshStandardMaterial({ map: facadeTex, emissiveMap: facadeLight, emissive: 0xffffff, emissiveIntensity: 0, roughness: 0.85 });
  [[-34, -30, 10, 22, 10], [-18, -40, 12, 30, 12], [4, -46, 14, 18, 10], [24, -36, 10, 26, 12], [40, -24, 12, 16, 10], [-44, -8, 10, 14, 12], [46, 4, 10, 20, 10], [-30, 26, 12, 12, 10], [32, 30, 14, 16, 10]]
    .forEach(([x, z, w, h, d]) => { x *= 1.8; z = z < 0 ? z * 1.7 - 10 : z * 1.6 + 8; h *= 0.75; add(box, neighMat, { pos: [x, h / 2, z], scale: [w, h, d] }); });

  // street lights along the road
  const bulbMat = new T.MeshStandardMaterial({ color: 0xfff1d6, emissive: 0xffd9a0, emissiveIntensity: 0 });
  const streetLights = [];
  [-14, 0, 14].forEach((x) => {
    const z = Z / 2 + 5.2;
    add(new T.CylinderGeometry(0.06, 0.09, 6, 8), M.dark, { pos: [x, 3, z] });
    add(box, M.dark, { pos: [x, 6, z + 0.6], scale: [0.12, 0.1, 1.3] });
    add(box, bulbMat, { pos: [x, 5.92, z + 1.15], scale: [0.4, 0.08, 0.25], cast: false });
    const pl = new T.PointLight(0xffc98a, 0, 18, 2);
    pl.position.set(x, 5.7, z + 1.15);
    scene.add(pl);
    streetLights.push(pl);
  });

  /* ---------- Building meshes ---------- */
  const brickMesh = new T.InstancedMesh(box, M.brick, bricks.length);
  const mortarMesh = new T.InstancedMesh(box, M.mortar, bricks.length);
  [brickMesh, mortarMesh].forEach((m) => { m.castShadow = true; m.receiveShadow = true; m.instanceMatrix.setUsage(T.DynamicDrawUsage); scene.add(m); });
  const col = new T.Color();
  bricks.forEach((b, i) => brickMesh.setColorAt(i, col.setHex(b.color).multiplyScalar(b.v)));
  brickMesh.instanceColor.needsUpdate = true;

  const lintelMesh = new T.InstancedMesh(box, M.concrete, lintels.length);
  lintelMesh.castShadow = lintelMesh.receiveShadow = true;
  scene.add(lintelMesh);

  const slabMeshes = slabs.map((s) => add(box, M.concrete));

  const litPanes = panes.filter((p) => p.lit && !p.door), darkPanes = panes.filter((p) => !p.lit && !p.door), doors = panes.filter((p) => p.door);
  const frameMesh = new T.InstancedMesh(box, M.frame, panes.length);
  const glassLitMesh = new T.InstancedMesh(box, M.glassLit, Math.max(1, litPanes.length));
  const glassMesh = new T.InstancedMesh(box, M.glass, Math.max(1, darkPanes.length));
  const doorMesh = new T.InstancedMesh(box, M.door, Math.max(1, doors.length));
  [frameMesh, glassLitMesh, glassMesh, doorMesh].forEach((m) => { m.receiveShadow = true; scene.add(m); });

  // scaffolding on the two camera-facing walls
  const tube = new T.CylinderGeometry(0.035, 0.035, 1, 6);
  const scaffV = [], scaffH = [];
  for (let x = -X / 2 - 0.9; x <= X / 2 + 0.95; x += 1.8) { scaffV.push([x, Z / 2 + 0.9]); scaffV.push([x, Z / 2 + 0.15]); }
  for (let z = -Z / 2 - 0.9 + 1.8; z < Z / 2 + 0.9; z += 1.8) { scaffV.push([X / 2 + 0.9, z]); scaffV.push([X / 2 + 0.15, z]); }
  const LEVELS = Math.ceil((TOP + 1) / 2);
  for (let l = 1; l <= LEVELS; l++) { scaffH.push({ l, a: [-X / 2 - 0.9, Z / 2 + 0.9], b: [X / 2 + 0.9, Z / 2 + 0.9] }); scaffH.push({ l, a: [X / 2 + 0.9, Z / 2 + 0.9], b: [X / 2 + 0.9, -Z / 2 - 0.9] }); }
  const scaffVMesh = new T.InstancedMesh(tube, M.steel, scaffV.length);
  const scaffHMesh = new T.InstancedMesh(tube, M.steel, scaffH.length);
  const plankMesh = new T.InstancedMesh(box, M.wood, LEVELS * 2);
  [scaffVMesh, scaffHMesh, plankMesh].forEach((m) => { m.castShadow = true; m.receiveShadow = true; scene.add(m); });

  // roof sign (lit at night)
  const signTex = canvasTex(1024, 180, (c, w, h) => {
    c.fillStyle = "#0b8a40"; c.fillRect(0, 0, w, h);
    c.strokeStyle = "rgba(255,255,255,.35)"; c.lineWidth = 6; c.strokeRect(10, 10, w - 20, h - 20);
    c.fillStyle = "#fff"; c.font = "800 92px Manrope, Arial, sans-serif"; c.textAlign = "center"; c.textBaseline = "middle";
    c.fillText("GILLANI ESTATE", w / 2, h / 2 + 4);
  });
  const signMat = new T.MeshStandardMaterial({ map: signTex, emissiveMap: signTex, emissive: 0xffffff, emissiveIntensity: 0.05, roughness: 0.5 });
  const sign = new T.Group();
  add(box, signMat, { parent: sign, pos: [0, 0.95, 0], scale: [5.2, 0.92, 0.1] });
  add(box, M.dark, { parent: sign, pos: [-2, 0.25, -0.1], scale: [0.08, 0.5, 0.08] });
  add(box, M.dark, { parent: sign, pos: [2, 0.25, -0.1], scale: [0.08, 0.5, 0.08] });
  sign.position.set(-0.8, TOP, Z / 2 - 0.6);
  scene.add(sign);

  // facade uplights for the night shot
  const uplights = [[-X / 2 - 1.5, Z / 2 + 2], [X / 2 + 2, Z / 2 + 2], [X / 2 + 2, -Z / 2 - 1]].map(([x, z]) => {
    const s = new T.SpotLight(0xffd29a, 0, 30, Math.PI / 7, 0.6, 1.6);
    s.position.set(x, 0.3, z);
    s.target.position.set(x * 0.6, TOP * 0.8, z * 0.4);
    scene.add(s, s.target);
    return s;
  });

  /* ---------- Tower crane ---------- */
  const CR = { x: -X / 2 - 4, z: -Z / 2 - 3 };
  const H = TOP + 7;
  const up = new T.Vector3(0, 1, 0), tmpA = new T.Vector3(), tmpB = new T.Vector3(), tmpQ = new T.Quaternion(), tmpM = new T.Matrix4(), tmpS = new T.Vector3();
  const members = (list, mat, parent) => {
    const m = new T.InstancedMesh(box, mat, list.length);
    list.forEach(([a, b, th], i) => {
      tmpA.set(...a); tmpB.set(...b);
      const dir = tmpB.clone().sub(tmpA), len = dir.length();
      tmpQ.setFromUnitVectors(up, dir.normalize());
      tmpM.compose(tmpA.clone().add(tmpB).multiplyScalar(0.5), tmpQ, tmpS.set(th, len, th));
      m.setMatrixAt(i, tmpM);
    });
    m.castShadow = true; m.receiveShadow = true;
    parent.add(m);
    return m;
  };
  const mast = new T.Group();
  mast.position.set(CR.x, 0, CR.z);
  scene.add(mast);
  add(box, M.concrete, { parent: mast, pos: [0, 0.3, 0], scale: [3, 0.6, 3] });
  const mL = [], s2 = 0.5, SEG = 1.6;
  const cs = [[-s2, -s2], [s2, -s2], [s2, s2], [-s2, s2]];
  cs.forEach(([x, z]) => mL.push([[x, 0.6, z], [x, H, z], 0.1]));
  for (let y = 0.6; y < H - 0.1; y += SEG) {
    for (let k = 0; k < 4; k++) {
      const [x1, z1] = cs[k], [x2, z2] = cs[(k + 1) % 4];
      mL.push([[x1, y, z1], [x2, y, z2], 0.05]);
      mL.push([[x1, y, z1], [x2, Math.min(H, y + SEG), z2], 0.045]);
    }
  }
  members(mL, M.crane, mast);

  const jib = new T.Group();
  jib.position.set(CR.x, H, CR.z);
  scene.add(jib);
  const JL = 19, CJ = 6.5, jL = [];
  jL.push([[-CJ, 0, -0.45], [JL, 0, -0.45], 0.09], [[-CJ, 0, 0.45], [JL, 0, 0.45], 0.09], [[-CJ, 1.0, 0], [JL, 0.5, 0], 0.08]);
  for (let x = -CJ; x < JL; x += 1.2) {
    const yt = 1.0 - (Math.max(0, x) / JL) * 0.5;
    jL.push([[x, 0, -0.45], [x + 0.6, yt, 0], 0.04], [[x, 0, 0.45], [x + 0.6, yt, 0], 0.04], [[x, 0, -0.45], [x, 0, 0.45], 0.04]);
  }
  jL.push([[0, 0, 0], [0, 3.6, 0], 0.12], [[0, 3.6, 0], [JL * 0.7, 0.65, 0], 0.035], [[0, 3.6, 0], [-CJ + 0.5, 1.0, 0], 0.035]);
  members(jL, M.crane, jib);
  add(box, M.concrete, { parent: jib, pos: [-CJ + 1.2, -0.6, 0], scale: [1.8, 1.4, 1.2] });
  add(box, M.crane, { parent: jib, pos: [1.0, -0.7, 0.9], scale: [1.4, 1.3, 1.1] });
  add(box, M.glass, { parent: jib, pos: [1.72, -0.65, 0.9], scale: [0.04, 0.8, 0.9], cast: false });
  const trolley = add(box, M.dark, { parent: jib, pos: [10, -0.15, 0], scale: [0.8, 0.25, 1.0] });
  const cable = add(new T.CylinderGeometry(0.02, 0.02, 1, 4), M.dark, { parent: jib });
  const hook = new T.Group();
  jib.add(hook);
  add(box, M.crane, { parent: hook, pos: [0, 0, 0], scale: [0.35, 0.4, 0.3] });
  const load = new T.Group();
  hook.add(load);
  add(new T.CylinderGeometry(0.01, 0.01, 1.2, 3), M.dark, { parent: load, pos: [-0.35, -0.5, 0] }).rotation.z = -0.5;
  add(new T.CylinderGeometry(0.01, 0.01, 1.2, 3), M.dark, { parent: load, pos: [0.35, -0.5, 0] }).rotation.z = 0.5;
  pallet(0, 0, load);
  load.children.slice(-2).forEach((c) => (c.position.y -= 1.75));

  const PILE = new T.Vector3(-X / 2 - 2.6, 0, Z / 2 + 0.9);
  const DEST = new T.Vector3(0.6, 0, -0.4);
  const polar = (p) => ({ a: Math.atan2(-(p.z - CR.z), p.x - CR.x), r: Math.hypot(p.x - CR.x, p.z - CR.z) });
  const pP = polar(PILE), pB = polar(DEST);

  function updateCrane(time, built) {
    const k = (time % 6) / 6;
    const lift = Math.max(built + 2.5, 3);
    let a, r, y, loaded;
    if (k < 0.1) { a = pP.a; r = pP.r; y = 1.2; loaded = true; }
    else if (k < 0.42) { const p = smooth((k - 0.1) / 0.32); a = pP.a + (pB.a - pP.a) * p; r = pP.r + (pB.r - pP.r) * p; y = 1.2 + (lift + 1.5 - 1.2) * smooth(p * 1.6); loaded = true; }
    else if (k < 0.55) { const p = smooth((k - 0.42) / 0.13); a = pB.a; r = pB.r; y = lift + 1.5 - 1.3 * p; loaded = true; }
    else if (k < 0.62) { a = pB.a; r = pB.r; y = lift + 0.2; loaded = false; }
    else if (k < 0.92) { const p = smooth((k - 0.62) / 0.3); a = pB.a + (pP.a - pB.a) * p; r = pB.r + (pP.r - pB.r) * p; y = lift + 0.2 + 1.5 * Math.sin(Math.PI * Math.min(1, p * 1.4)) - (lift - 1) * smooth((p - 0.5) * 2); loaded = false; }
    else { a = pP.a; r = pP.r; y = 1.2; loaded = false; }
    jib.rotation.y = a;
    trolley.position.x = r;
    const drop = H - 0.3 - y;
    cable.position.set(r, -0.3 - drop / 2, 0);
    cable.scale.y = Math.max(0.1, drop);
    hook.position.set(r, -0.3 - drop, 0);
    load.visible = loaded;
    hook.rotation.y = -a + 0.3; // keep load roughly aligned with the site
  }

  /* ---------- Frame update ---------- */
  const SKY = [
    [0.0, 0x76a9d6, 0xdbe8ee], [0.35, 0x3f86cf, 0xd2e4ee], [0.62, 0x4f72a8, 0xf0d3a2],
    [0.72, 0x34477a, 0xe9965f], [0.8, 0x18264a, 0x5a4a6a], [0.88, 0x0b1430, 0x27304f], [1, 0x060c20, 0x1a2140],
  ];
  const skyAt = (u) => {
    for (let i = 1; i < SKY.length; i++) if (u <= SKY[i][0]) {
      const k = smooth((u - SKY[i - 1][0]) / (SKY[i][0] - SKY[i - 1][0]));
      return [lerpColor(SKY[i - 1][1], SKY[i][1], k), lerpColor(SKY[i - 1][2], SKY[i][2], k)];
    }
    return [new T.Color(SKY[SKY.length - 1][1]), new T.Color(SKY[SKY.length - 1][2])];
  };

  const dummy = new T.Object3D();
  const zero = new T.Matrix4().makeScale(0, 0, 0);
  const setInst = (mesh, i, x, y, z, sx, sy, sz, rot = 0) => {
    dummy.position.set(x, y, z); dummy.rotation.set(0, rot, 0); dummy.scale.set(sx, sy, sz);
    dummy.updateMatrix(); mesh.setMatrixAt(i, dummy.matrix);
  };

  function update(time) {
    const u = clamp(time / (END - 2.5));
    const built = heightAt(time);

    // bricks + mortar
    for (let i = 0; i < bricks.length; i++) {
      const b = bricks[i];
      if (time < b.t0) { brickMesh.setMatrixAt(i, zero); mortarMesh.setMatrixAt(i, zero); continue; }
      const p = clamp((time - b.t0) / DROP);
      const lift = (1 - easeOut(p)) * 0.55;
      setInst(brickMesh, i, b.x, b.y + lift, b.z, b.len, BH, BW, b.rot);
      if (p >= 1) setInst(mortarMesh, i, b.x, b.y + 0.005, b.z, b.len + 0.02, CP, BW - 0.045, b.rot);
      else mortarMesh.setMatrixAt(i, zero);
    }
    brickMesh.instanceMatrix.needsUpdate = true;
    mortarMesh.instanceMatrix.needsUpdate = true;

    lintels.forEach((l, i) => (time < l.t0 ? lintelMesh.setMatrixAt(i, zero) : setInst(lintelMesh, i, l.x, l.y, l.z, l.len, CP, BW + 0.01, l.rot)));
    lintelMesh.instanceMatrix.needsUpdate = true;

    slabs.forEach((s, i) => {
      const m = slabMeshes[i];
      const p = easeOut((time - s.t0) / s.dur);
      m.visible = p > 0;
      m.scale.set(Math.max(0.001, s.w * p), s.h, s.d);
      m.position.set(-s.w / 2 + (s.w * p) / 2, s.y + s.h / 2, s.z);
    });

    // windows, frames, door
    let li = 0, di = 0, oi = 0;
    panes.forEach((p, i) => {
      const k = easeOut((time - p.t0) / 0.35);
      const show = k > 0;
      if (!show) frameMesh.setMatrixAt(i, zero);
      else setInst(frameMesh, i, p.x, p.y, p.z, p.w * k, p.h * k, 0.09, p.rot);
      const target = p.door ? doorMesh : p.lit ? glassLitMesh : glassMesh;
      const idx = p.door ? oi++ : p.lit ? li++ : di++;
      if (!show) target.setMatrixAt(idx, zero);
      else setInst(target, idx, p.x, p.y, p.z, (p.w - 0.1) * k, (p.h - 0.1) * k, 0.1, p.rot);
    });
    [frameMesh, glassLitMesh, glassMesh, doorMesh].forEach((m) => (m.instanceMatrix.needsUpdate = true));

    // scaffolding follows the walls, comes down before glazing
    const down = smooth((time - SCAFF_OFF) / 0.9);
    const sh = time < slabs[0].t0 + 1 ? 0 : Math.min(TOP + 1, built + 1.1) * (1 - down);
    scaffV.forEach(([x, z], i) => (sh > 0.05 ? setInst(scaffVMesh, i, x, sh / 2, z, 1, sh, 1) : scaffVMesh.setMatrixAt(i, zero)));
    scaffH.forEach((h, i) => {
      const y = h.l * 2;
      if (y > sh) return scaffHMesh.setMatrixAt(i, zero);
      const dx = h.b[0] - h.a[0], dz = h.b[1] - h.a[1], len = Math.hypot(dx, dz);
      dummy.position.set((h.a[0] + h.b[0]) / 2, y, (h.a[1] + h.b[1]) / 2);
      dummy.rotation.set(0, 0, 0); dummy.rotateY(Math.atan2(-dz, dx)); dummy.rotateZ(Math.PI / 2);
      dummy.scale.set(1, len, 1); dummy.updateMatrix(); scaffHMesh.setMatrixAt(i, dummy.matrix);
    });
    for (let l = 1; l <= LEVELS; l++) {
      const y = l * 2 + 0.05, on = y <= sh;
      on ? setInst(plankMesh, (l - 1) * 2, 0, y, Z / 2 + 0.52, X + 1.8, 0.05, 0.62) : plankMesh.setMatrixAt((l - 1) * 2, zero);
      on ? setInst(plankMesh, (l - 1) * 2 + 1, X / 2 + 0.52, y, 0, 0.62, 0.05, Z + 1.8) : plankMesh.setMatrixAt((l - 1) * 2 + 1, zero);
    }
    [scaffVMesh, scaffHMesh, plankMesh].forEach((m) => (m.instanceMatrix.needsUpdate = true));

    // sign
    const sk = easeOut((time - SIGN_T) / 0.6);
    sign.visible = sk > 0;
    sign.scale.setScalar(Math.max(0.001, sk));

    // time of day
    const [top, hor] = skyAt(u);
    skyU.top.value.copy(top); skyU.hor.value.copy(hor);
    scene.fog.color.copy(hor);
    // sun rises from a low morning angle, peaks at noon, sets near handover
    const elev = u <= 0.78 ? 0.12 + Math.sin((Math.PI * u) / 0.78) * 0.85 : 0.12 - (u - 0.78) * 1.6;
    const az = -0.9 + u * 2.4;
    const sd = new T.Vector3(Math.cos(az) * Math.cos(elev), Math.sin(elev), Math.sin(az) * Math.cos(elev) * -1).normalize();
    skyU.sunDir.value.copy(sd);
    skyU.sunCol.value.copy(lerpColor(0xfff3dc, 0xff8a3d, smooth((u - 0.45) / 0.3)));
    const night = smooth((u - 0.74) / 0.14);
    skyU.stars.value = night;
    const day = clamp(Math.sin(elev) * 3);
    sun.position.copy(sd).multiplyScalar(60);
    sun.intensity = 2.8 * day;
    sun.color.copy(lerpColor(0xfff1dc, 0xffa060, smooth((u - 0.45) / 0.3)));
    hemi.intensity = 0.25 + 0.75 * day;
    hemi.color.copy(lerpColor(0xdfefff, 0x5b6c9a, night));
    moon.intensity = 0.35 * night;
    renderer.toneMappingExposure = 1 - night * 0.1;

    // night lighting
    const handover = smooth((time - SIGN_T + 1.5) / 1.5);
    M.glassLit.emissiveIntensity = 1.1 * night * handover;
    neighMat.emissiveIntensity = 0.9 * night;
    bulbMat.emissiveIntensity = 4 * night;
    streetLights.forEach((l) => (l.intensity = 40 * night));
    uplights.forEach((l) => (l.intensity = 260 * night * handover));
    signMat.emissiveIntensity = 0.05 + 1.1 * night;

    updateCrane(time, built);

    // camera: slow orbit + push-in, looking at the rising work
    const k = smooth(time / END);
    const ang = 0.38 + 0.42 * k + Math.sin(time * 0.15) * 0.03;
    const R = 35 - 4 * k;
    camera.position.set(Math.sin(ang) * R, 11 + 6 * k, Math.cos(ang) * R);
    camera.lookAt(0, 2 + Math.min(built, TOP) * 0.45, 0);
    sun.target.position.set(0, 0, 0);

    renderer.render(scene, camera);
    updateHud(time);
  }

  /* ---------- HUD + controls ---------- */
  const elStage = root.querySelector(".sitecam__stage b");
  const elSub = root.querySelector(".sitecam__stage span");
  const elDay = root.querySelector(".sitecam__day");
  const elTime = root.querySelector(".sitecam__time");
  const elFill = root.querySelector(".sitecam__timeline span");
  const elKnob = root.querySelector(".sitecam__timeline i");
  const mmss = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

  function updateHud(time) {
    let st = stages[0];
    for (const s of stages) if (time >= s.t) st = s;
    elStage.textContent = st.label;
    elSub.textContent = st.label === "Handover ready"
      ? `${FLOORS} floors · ${bricks.length.toLocaleString()} bricks`
      : st.floor ? `Floor ${st.floor} of ${FLOORS}` : "";
    elDay.textContent = `Day ${1 + Math.floor(clamp(time / (END - 4)) * 239)}`;
    elTime.textContent = `${mmss(time)} / ${mmss(END)}`;
    const k = (time / END) * 100;
    elFill.style.width = k + "%";
    elKnob.style.left = k + "%";
  }

  const fit = () => {
    const r = root.getBoundingClientRect();
    renderer.setSize(r.width, r.height, false);
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    camera.aspect = r.width / r.height;
    camera.fov = r.width / r.height < 1 ? 46 : 36;
    camera.updateProjectionMatrix();
  };

  let time = 0, playing = !reduce, speed = 1, last = 0, visible = true;
  const playBtn = root.querySelector('[data-act="play"]');
  const setPlaying = (v) => {
    playing = v;
    root.classList.toggle("paused", !v);
    playBtn.setAttribute("aria-label", v ? "Pause" : "Play");
  };

  function loop(now) {
    const dt = last ? Math.min(0.1, (now - last) / 1000) : 0;
    last = now;
    if (playing && visible) {
      time += dt * speed;
      if (time >= END) time = 0;
      update(time);
    }
    requestAnimationFrame(loop);
  }

  root.addEventListener("click", (e) => {
    const b = e.target.closest("[data-act]");
    if (!b) return;
    if (b.dataset.act === "play") setPlaying(!playing);
    if (b.dataset.act === "restart") { time = 0; setPlaying(true); update(time); }
    if (b.dataset.act === "speed") { speed = speed === 1 ? 2 : speed === 2 ? 4 : 1; b.textContent = speed + "×"; }
  });

  const tl = root.querySelector(".sitecam__timeline");
  const seek = (e) => {
    const r = tl.getBoundingClientRect();
    time = clamp((e.clientX - r.left) / r.width) * END;
    update(time);
  };
  tl.addEventListener("pointerdown", (e) => {
    seek(e);
    tl.setPointerCapture(e.pointerId);
    const move = (ev) => seek(ev);
    tl.addEventListener("pointermove", move);
    tl.addEventListener("pointerup", () => tl.removeEventListener("pointermove", move), { once: true });
  });
  tl.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") time = Math.min(END, time + 1);
    if (e.key === "ArrowLeft") time = Math.max(0, time - 1);
    update(time);
  });

  // only render while on screen
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { threshold: 0.05 }).observe(root);
  addEventListener("resize", () => { fit(); update(time); });

  fit();
  if (reduce) time = END - 1;
  setPlaying(playing);
  update(time);
  requestAnimationFrame(loop);
})();
