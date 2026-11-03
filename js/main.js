/* =========================================================
   Gillani Estate — interactions & construction animations
   ========================================================= */

const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const PAGE = document.body.dataset.page || "home";

/* ---------- Icons ---------- */
const svg = (d, extra = "") =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" ${extra}>${d}</svg>`;
const ICON = {
  arrow: svg('<path d="M5 12h14M13 6l6 6-6 6"/>'),
  chev: svg('<path d="m6 9 6 6 6-6"/>'),
  arrowUp: svg('<path d="M12 19V5M6 11l6-6 6 6"/>'),
  pin: svg('<path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>'),
  bed: svg('<path d="M3 18v-7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v7M3 14h18M7 9V6h10v3"/>'),
  bath: svg('<path d="M4 12h16v3a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4v-3zM6 12V5a2 2 0 0 1 4 0M6 19l-1 2M18 19l1 2"/>'),
  area: svg('<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>'),
  heart: svg('<path d="M12 20s-7-4.4-9-9a5 5 0 0 1 9-3 5 5 0 0 1 9 3c-2 4.6-9 9-9 9z"/>'),
  phone: svg('<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/>'),
  mail: svg('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>'),
  clock: svg('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
  search: svg('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>'),
  home: svg('<path d="M3 11 12 4l9 7M5 10v10h14V10"/>'),
  tag: svg('<path d="M3 12V4h8l10 10-8 8L3 12z"/><circle cx="7.5" cy="8.5" r="1.5"/>'),
  shield: svg('<path d="M12 3 5 6v6c0 4.5 3 7.7 7 9 4-1.3 7-4.5 7-9V6l-7-3z"/><path d="m9 12 2 2 4-4"/>'),
  key: svg('<circle cx="8" cy="15" r="4"/><path d="m11 12 9-9M17 6l3 3M15 8l2 2"/>'),
  helmet: svg('<path d="M3 17h18M5 17v-3a7 7 0 0 1 14 0v3M10 7V5h4v2"/>'),
  chart: svg('<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>'),
  handshake: svg('<path d="m11 17 2 2a1.5 1.5 0 0 0 2-2M14 14l2.5 2.5a1.5 1.5 0 0 0 2-2L15 11M3 13l4 4M21 11l-4-4-4 1-3-2-6 6M7 7l3 3"/>'),
  building: svg('<rect x="4" y="3" width="16" height="18" rx="1"/><path d="M9 7h1M14 7h1M9 11h1M14 11h1M9 15h1M14 15h1M10 21v-3h4v3"/>'),
  blueprint: svg('<path d="M4 4h16v16H4zM4 10h7v10M11 4v3M15 10h5M15 10v4"/>'),
  check: svg('<path d="m5 12 5 5 9-10"/>'),
  fb: svg('<path d="M15 3h-2a4 4 0 0 0-4 4v3H7v4h2v7h4v-7h3l1-4h-4V7a1 1 0 0 1 1-1h2z"/>'),
  ig: svg('<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".5" fill="currentColor"/>'),
  yt: svg('<rect x="2" y="5" width="20" height="14" rx="4"/><path d="m10 9 5 3-5 3z"/>'),
  li: svg('<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M8 10v7M8 7v.01M12 17v-4a2 2 0 0 1 4 0v4M12 10v7"/>'),
  wa: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.5 14.4c-.3-.1-1.8-.9-2-1-.3-.1-.5-.1-.7.1-.2.3-.8 1-.9 1.2-.2.2-.3.2-.6.1-.3-.1-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6l.4-.5.3-.5c.1-.2 0-.4 0-.5l-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.2 5.1 4.5 2.5 1 3 .8 3.6.7.6-.1 1.8-.7 2-1.4.2-.7.2-1.3.2-1.4-.1-.2-.3-.3-.6-.4zM12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2c-1.6 0-3.1-.4-4.4-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2z"/></svg>',
};

/* ---------- Logo ---------- */
const LOGO_MARK = `<img class="logo__mark" src="assets/logo.webp" alt="">`;

const NAV = [
  ["buy", "properties.html?purpose=sale", "Buy"],
  ["rent", "properties.html?purpose=rent", "Rent"],
  ["projects", "projects.html", "Projects", () => [
    ["All projects", "projects.html"],
    ["Under construction", "projects.html?filter=Under%20Construction"],
    ["Ready to move", "projects.html?filter=Ready"],
    ["Completed", "projects.html?filter=Sold%20Out"],
    ...PROJECTS.slice(0, 4).map((p) => [p.name, `contact.html?project=${encodeURIComponent(p.name)}`, p.location]),
  ]],
  ["offices", "maps.html?view=offices", "Offices", () => OFFICES.map((o) => [o.name, `maps.html?office=${o.id}`, o.address])],
  ["agents", "agents.html", "Agents"],
  ["maps", "maps.html", "Maps"],
  ["gallery", "gallery.html", "Gallery"],
  ["blog", "blog.html", "Blog"],
  ["about", "about.html", "About"],
  ["contact", "contact.html", "Contact"],
];

function activeNav() {
  if (PAGE === "properties") {
    const p = new URLSearchParams(location.search).get("purpose");
    return p === "rent" ? "rent" : p === "sale" ? "buy" : "";
  }
  if (PAGE === "maps" && new URLSearchParams(location.search).has("office")) return "offices";
  return { post: "blog", property: "" }[PAGE] ?? PAGE;
}

function navItem([k, href, label, menu], active) {
  const cls = k === active ? "active" : "";
  if (!menu) return `<a href="${href}" class="${cls}">${label}</a>`;
  return `
    <div class="nav__item">
      <a href="${href}" class="${cls}">${label}</a>
      <button class="nav__caret" aria-label="Show ${label} menu" aria-expanded="false">${ICON.chev}</button>
      <div class="nav__menu">
        ${menu().map(([l, h, sub]) => `<a href="${h}">${l}${sub ? `<small>${sub}</small>` : ""}</a>`).join("")}
      </div>
    </div>`;
}

/* ---------- Header & footer ---------- */
function renderChrome() {
  const active = activeNav();
  document.body.insertAdjacentHTML("afterbegin", `
  <header class="header" id="header">
    <div class="container header__inner">
      <a href="index.html" class="logo" aria-label="${SITE.name} home">${LOGO_MARK}
        <span class="logo__text"><span class="logo__name">${SITE.name}</span><span class="logo__sub">${SITE.tagline}</span></span>
      </a>
      <nav class="nav" id="nav">
        ${NAV.map((n) => navItem(n, active)).join("")}
      </nav>
      <div class="header__actions">
        <a href="${SITE.phoneHref}" class="header__phone"><span>${ICON.phone}</span><div><small>Call us</small>${SITE.phone}</div></a>
        <a href="contact.html?type=List%20my%20property" class="btn btn--sm">List Property</a>
        <button class="burger" id="burger" aria-label="Open menu"><span></span><span></span><span></span></button>
      </div>
    </div>
  </header>`);

  document.body.insertAdjacentHTML("beforeend", `
  <footer class="footer">
    <div class="footer__wall"></div>
    <div class="container footer__top">
      <div class="footer__about">
        <a href="index.html" class="logo">${LOGO_MARK}<span class="logo__text"><span class="logo__name">${SITE.name}</span><span class="logo__sub">${SITE.tagline}</span></span></a>
        <p>Building trust brick by brick since 2005. Islamabad's trusted name for buying, selling, renting and constructing your dream property.</p>
        <div class="socials">
          <a href="#" aria-label="Facebook">${ICON.fb}</a><a href="#" aria-label="Instagram">${ICON.ig}</a>
          <a href="#" aria-label="YouTube">${ICON.yt}</a><a href="#" aria-label="LinkedIn">${ICON.li}</a>
        </div>
      </div>
      <div>
        <h5>Explore</h5>
        <ul>${NAV.filter(([k]) => !["buy", "rent", "offices"].includes(k)).map(([, h, l]) => `<li><a href="${h}">${l}</a></li>`).join("")}</ul>
      </div>
      <div>
        <h5>Services</h5>
        <ul>
          <li><a href="properties.html?purpose=sale">Buy Property</a></li>
          <li><a href="properties.html?purpose=rent">Rent Property</a></li>
          <li><a href="contact.html?type=List%20my%20property">Sell Your Property</a></li>
          <li><a href="contact.html?type=Construction">House Construction</a></li>
          <li><a href="contact.html?type=Investment">Investment Advice</a></li>
        </ul>
      </div>
      <div>
        <h5>Get in touch</h5>
        <ul class="footer__contact">
          <li>${ICON.pin}<span>${SITE.address}</span></li>
          <li>${ICON.phone}<a href="${SITE.phoneHref}">${SITE.phone}</a></li>
          <li>${ICON.mail}<a href="mailto:${SITE.email}">${SITE.email}</a></li>
          <li>${ICON.clock}<span>${SITE.hours}</span></li>
        </ul>
      </div>
    </div>
    <div class="container footer__bottom">
      <span>© ${new Date().getFullYear()} ${SITE.name} & Builders. All rights reserved.</span>
      <span>Crafted with care in Islamabad</span>
    </div>
  </footer>
  <a class="wa-float" href="https://wa.me/${SITE.whatsapp}" target="_blank" rel="noopener" aria-label="Chat on WhatsApp">${ICON.wa}</a>
  <button class="to-top" id="toTop" aria-label="Back to top">${ICON.arrowUp}</button>
  <div class="toast" id="toast"><i>${ICON.check}</i><span></span></div>`);

  const header = $("#header");
  const toTop = $("#toTop");
  const onScroll = () => {
    header.classList.toggle("scrolled", scrollY > 40);
    toTop.classList.toggle("show", scrollY > 700);
  };
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  toTop.addEventListener("click", () => scrollTo({ top: 0, behavior: "smooth" }));

  $("#burger").addEventListener("click", () => document.body.classList.toggle("menu-open"));
  $$("#nav a").forEach((a) => a.addEventListener("click", () => document.body.classList.remove("menu-open")));
  // dropdown carets (tap to open on touch / mobile menu)
  $$(".nav__caret").forEach((b) => b.addEventListener("click", (e) => {
    e.stopPropagation();
    const item = b.closest(".nav__item");
    const open = !item.classList.contains("open");
    $$(".nav__item.open").forEach((i) => { i.classList.remove("open"); $(".nav__caret", i).setAttribute("aria-expanded", "false"); });
    item.classList.toggle("open", open);
    b.setAttribute("aria-expanded", String(open));
  }));
  document.addEventListener("click", () => $$(".nav__item.open").forEach((i) => i.classList.remove("open")));
}

function toast(msg) {
  const t = $("#toast");
  $("span", t).textContent = msg;
  t.classList.add("show");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => t.classList.remove("show"), 3800);
}

/* =========================================================
   Preloader — the logo fills up from the ground (once per session)
   ========================================================= */
function runPreloader() {
  let seen = false;
  try { seen = sessionStorage.getItem("ge-loaded") === "1"; } catch (e) {}
  if (seen || reduceMotion) return Promise.resolve();

  document.body.classList.add("is-loading");
  document.body.insertAdjacentHTML("afterbegin", `
    <div class="preloader" id="preloader"><div class="preloader__inner">
      <div class="preloader__logo">
        <img class="ghost" src="assets/logo.webp" alt="">
        <img class="fill" src="assets/logo.webp" alt="${SITE.name}">
      </div>
      <div class="preloader__status">Laying the foundation</div>
      <div class="preloader__bar"><span></span></div>
    </div></div>`);

  const logo = $("#preloader .preloader__logo");
  const bar = $("#preloader .preloader__bar span");
  const total = 1800;
  const start = performance.now();
  return new Promise((resolve) => {
    const pageReady = new Promise((r) => (document.readyState === "complete" ? r() : addEventListener("load", r, { once: true })));
    const minTime = new Promise((r) => setTimeout(r, total));
    const tick = () => {
      const p = Math.min(1, (performance.now() - start) / total);
      const e = 1 - Math.pow(1 - p, 3);
      logo.style.setProperty("--p", (1 - e) * 100 + "%");
      bar.style.width = e * 100 + "%";
      if (p < 1) requestAnimationFrame(tick);
    };
    tick();
    Promise.race([Promise.all([pageReady, minTime]), new Promise((r) => setTimeout(r, 4500))]).then(() => {
      $("#preloader").classList.add("done");
      document.body.classList.remove("is-loading");
      try { sessionStorage.setItem("ge-loaded", "1"); } catch (e) {}
      setTimeout(() => $("#preloader")?.remove(), 1200);
      setTimeout(resolve, 350);
    });
  });
}

/* =========================================================
   Building generator (home)
   A building is rows of bricks (running bond). Every floor
   has one solid course and two window courses.
   ========================================================= */
function makeBuilding(el, { cols = 10, floors = 6, bw = 30, bh = 14, sign = "" } = {}) {
  el.style.setProperty("--bw", bw + "px");
  el.style.setProperty("--bh", bh + "px");
  const order = [];
  const windows = [];
  const winCols = (c) => c % 3 !== 0 && c !== cols - 1;

  const addRow = (cells, reverse) => {
    const row = document.createElement("div");
    row.className = "b-row";
    const made = cells.map((cls) => {
      const b = document.createElement("span");
      b.className = "brick " + cls;
      row.appendChild(b);
      if (cls.includes("win")) windows.push(b);
      return b;
    });
    el.appendChild(row);
    order.push(...(reverse ? made.reverse() : made));
  };

  for (let f = 0; f < floors; f++) {
    // solid course, alternating running-bond offset
    const offset = f % 2 === 1;
    const solid = offset ? ["half", ...Array(cols - 1).fill(""), "half"] : Array(cols).fill("");
    addRow(solid, f % 2 === 1);
    // two window courses
    for (let k = 0; k < 2; k++) {
      addRow(Array.from({ length: cols }, (_, c) => (winCols(c) ? "win" : "")), k === 1);
    }
  }
  addRow(Array(cols).fill("slab"), false);

  if (sign) {
    const s = document.createElement("div");
    s.className = "building__sign";
    s.textContent = sign;
    el.appendChild(s);
  }
  return { el, order, windows };
}

const shuffle = (a) => a.map((v) => [Math.random(), v]).sort((x, y) => x[0] - y[0]).map((x) => x[1]);

/* Lay bricks automatically, one after another */
function buildAuto(b, { stagger = 16, startDelay = 0, onProgress, onDone } = {}) {
  if (reduceMotion) {
    b.el.classList.add("instant", "complete");
    b.windows.forEach((w) => w.classList.add("lit"));
    onProgress?.(1);
    onDone?.();
    return;
  }
  b.order.forEach((brick, i) => {
    brick.style.animationDelay = startDelay + i * stagger + "ms";
    brick.classList.add("on");
  });
  const total = startDelay + b.order.length * stagger + 550;
  const start = performance.now();
  const tick = () => {
    const p = Math.min(1, Math.max(0, (performance.now() - start - startDelay) / (total - startDelay)));
    onProgress?.(p);
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
  setTimeout(() => {
    b.el.classList.add("complete");
    const lit = shuffle(b.windows).slice(0, Math.ceil(b.windows.length * 0.55));
    lit.forEach((w, i) => setTimeout(() => w.classList.add("lit"), i * 60));
    onDone?.();
  }, total);
}

/* Lay bricks according to a 0..1 progress value (scroll driven) */
function buildTo(b, p) {
  const n = Math.round(p * b.order.length);
  b.order.forEach((brick, i) => brick.classList.toggle("on", i < n));
  b.el.classList.toggle("complete", p >= 0.999);
  // light roughly half the windows as the building completes
  b.windows.forEach((w, i) => w.classList.toggle("lit", p > 0.92 && (i * 7) % 10 < Math.min(5, (p - 0.92) * 70)));
}

/* ---------- Tower crane SVG (drawn in currentColor) ---------- */
const CRANE = `
<svg viewBox="0 0 300 520" preserveAspectRatio="xMaxYMax meet" aria-hidden="true">
  <g stroke="currentColor" stroke-width="2.5" fill="none">
    <path d="M250 520V70M268 520V70"/>
    ${Array.from({ length: 22 }, (_, i) => `<path d="M250 ${520 - i * 20}L268 ${500 - i * 20}"/>`).join("")}
    <path d="M20 70H300M20 84H268"/>
    ${Array.from({ length: 12 }, (_, i) => `<path d="M${30 + i * 20} 84L${40 + i * 20} 70"/>`).join("")}
    <path d="M259 70 259 30M259 30 40 70M259 30 300 70"/>
  </g>
  <rect x="276" y="86" width="22" height="30" fill="#173a29" stroke="currentColor" stroke-width="2"/>
  <rect x="236" y="84" width="46" height="24" rx="2" fill="currentColor"/>
  <rect x="242" y="89" width="14" height="10" fill="#0a1f15"/>
  <g class="crane__trolley">
    <rect x="186" y="84" width="20" height="8" fill="currentColor"/>
    <line class="crane__cable" x1="196" y1="92" x2="196" y2="152" stroke="#b2c3ba" stroke-width="1.5"/>
    <g class="crane__load">
      <path d="M190 152h12l-6 8z" fill="#b2c3ba"/>
      <rect x="180" y="160" width="32" height="15" rx="2" fill="#b4532e"/>
      <rect x="180" y="171" width="32" height="4" fill="#9b4325"/>
    </g>
  </g>
</svg>`;

/* =========================================================
   Reveal + counters
   ========================================================= */
function initReveal() {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add("in");
      // a fully clipped image never intersects, so its parent reveals it
      $$(":scope > .reveal-img", e.target).forEach((img) => img.classList.add("in"));
      io.unobserve(e.target);
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -60px 0px" });
  $$(".reveal").forEach((el) => io.observe(el));
  $$(".reveal-img").forEach((el) => !el.classList.contains("in") && io.observe(el.parentElement));

  const cio = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      countUp(e.target);
      cio.unobserve(e.target);
    });
  }, { threshold: 0.5 });
  $$("[data-count]").forEach((el) => cio.observe(el));

  const bio = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const bricks = $$("i", e.target);
      const n = Math.round((+e.target.dataset.progress / 100) * bricks.length);
      bricks.slice(0, n).forEach((b, i) => setTimeout(() => b.classList.add("on"), reduceMotion ? 0 : i * 60));
      bio.unobserve(e.target);
    });
  }, { threshold: 0.6 });
  $$(".bricks-bar").forEach((el) => bio.observe(el));
}

function countUp(el) {
  const target = +el.dataset.count;
  const suffix = el.dataset.suffix || "";
  const dur = reduceMotion ? 0 : 1800;
  const start = performance.now();
  const step = (now) => {
    const p = dur ? Math.min(1, (now - start) / dur) : 1;
    const v = Math.round(target * (1 - Math.pow(1 - p, 4)));
    el.innerHTML = v.toLocaleString() + (suffix ? `<em>${suffix}</em>` : "");
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

/* =========================================================
   Card templates
   ========================================================= */
function getFavs() {
  try { return JSON.parse(localStorage.getItem("ge-favs") || "[]"); } catch (e) { return []; }
}
function toggleFav(id) {
  const f = getFavs();
  const i = f.indexOf(id);
  i > -1 ? f.splice(i, 1) : f.push(id);
  try { localStorage.setItem("ge-favs", JSON.stringify(f)); } catch (e) {}
  return i === -1;
}

function propertyCard(p, delay = 0) {
  const fav = getFavs().includes(p.id);
  const specs = [
    p.beds ? `<span>${ICON.bed}${p.beds} Beds</span>` : "",
    p.baths ? `<span>${ICON.bath}${p.baths} Baths</span>` : "",
    `<span>${ICON.area}${p.area}</span>`,
  ].join("");
  return `
  <article class="card reveal" style="--rd:${delay}s">
    <a href="property.html?id=${p.id}" class="card__media">
      <img src="${p.img.replace("w=1200", "w=800")}" alt="${p.title}" loading="lazy">
      <div class="card__tags">
        <span class="tag ${p.purpose === "sale" ? "tag--gold" : "tag--green"}">For ${p.purpose === "sale" ? "Sale" : "Rent"}</span>
        <span class="tag">${p.type}</span>
      </div>
      <div class="card__price">${formatPrice(p.price, p.purpose)}</div>
    </a>
    <button class="card__fav ${fav ? "on" : ""}" data-fav="${p.id}" aria-label="Save property">${ICON.heart}</button>
    <div class="card__body">
      <a href="property.html?id=${p.id}"><h3 class="card__title">${p.title}</h3></a>
      <div class="card__loc">${ICON.pin}${p.location}</div>
      <div class="card__specs">${specs}</div>
    </div>
  </article>`;
}

function projectCard(pr, delay = 0) {
  const statusCls = pr.status === "Ready" ? "tag--green" : pr.status === "Sold Out" ? "tag--dark" : "tag--gold";
  return `
  <article class="project reveal" style="--rd:${delay}s">
    <img src="${pr.img}" alt="${pr.name}" loading="lazy">
    <span class="tag ${statusCls} project__status">${pr.status}</span>
    <a class="project__link" href="contact.html?project=${encodeURIComponent(pr.name)}" aria-label="Enquire about ${pr.name}">${ICON.arrow}</a>
    <div class="project__body">
      <span class="project__cat">${pr.category} · By Gillani Builders</span>
      <h3>${pr.name}</h3>
      <div class="project__loc">${ICON.pin}${pr.location}</div>
      <div class="project__meta">
        <div><small>Price</small><b>${pr.priceRange}</b></div>
        <div><small>Units</small><b>${pr.units}</b></div>
        <div><small>Completion</small><b>${pr.completion}</b></div>
      </div>
      <div class="project__progress">
        <div class="bricks-bar" data-progress="${pr.progress}">${"<i></i>".repeat(20)}</div>
        <span>${pr.progress}% built</span>
      </div>
      <div class="project__highlights">${pr.highlights.map((h) => `<span>${h}</span>`).join("")}</div>
    </div>
  </article>`;
}

/* Favourite buttons (delegated) */
document.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-fav]");
  if (!btn) return;
  e.preventDefault();
  const on = toggleFav(btn.dataset.fav);
  btn.classList.toggle("on", on);
  toast(on ? "Saved to your favourites" : "Removed from favourites");
});

/* =========================================================
   Page: Home
   ========================================================= */
function initHome() {
  // hero construction scene
  const scene = $("#scene");
  if (scene) {
    scene.insertAdjacentHTML("beforeend", `<div class="crane">${CRANE}</div>`);
    const small = innerWidth < 640;
    const side = makeBuilding($("#bSide"), { cols: 4, floors: 4, bw: small ? 14 : 18, bh: small ? 8 : 10 });
    const side2 = makeBuilding($("#bSide2"), { cols: 4, floors: 5, bw: small ? 14 : 18, bh: small ? 8 : 10 });
    const main = makeBuilding($("#bMain"), { cols: 10, floors: small ? 5 : 7, bw: small ? 20 : 28, bh: small ? 10 : 13, sign: SITE.name });
    const pctEl = $("#heroPct");
    const barEl = $("#heroBar");
    window.__startHero = () => {
      buildAuto(side, { stagger: 22, startDelay: 0 });
      buildAuto(side2, { stagger: 22, startDelay: 300 });
      buildAuto(main, {
        stagger: 14, startDelay: 500,
        onProgress: (p) => { pctEl.textContent = Math.round(p * 100) + "%"; barEl.style.width = p * 100 + "%"; },
        onDone: () => { pctEl.textContent = "Completed"; },
      });
    };
  }
  // search tabs
  let purpose = "sale";
  $$(".search__tab").forEach((t) => t.addEventListener("click", () => {
    $$(".search__tab").forEach((x) => x.classList.remove("active"));
    t.classList.add("active");
    purpose = t.dataset.purpose;
  }));
  $("#heroSearch")?.addEventListener("submit", (e) => {
    e.preventDefault();
    if (purpose === "projects") return (location.href = "projects.html");
    const q = $("#heroQ").value.trim();
    const type = $("#heroType").value;
    location.href = `properties.html?purpose=${purpose}&q=${encodeURIComponent(q)}&type=${encodeURIComponent(type)}`;
  });

  // featured properties with filter
  const grid = $("#featuredGrid");
  const render = (f) => {
    const list = PROPERTIES.filter((p) => (f === "all" ? p.featured : p.purpose === f)).slice(0, 6);
    grid.innerHTML = list.map((p, i) => propertyCard(p, (i % 3) * 0.1)).join("");
    initReveal();
  };
  $$("#featuredTabs button").forEach((b) => b.addEventListener("click", () => {
    $$("#featuredTabs button").forEach((x) => x.classList.remove("active"));
    b.classList.add("active");
    render(b.dataset.filter);
  }));
  render("all");

  $("#homeProjects").innerHTML = PROJECTS.slice(0, 4).map((p, i) => projectCard(p, (i % 2) * 0.12)).join("");

  initBuildStory();
  initTestimonials();
}

/* Scroll-driven construction story */
function initBuildStory() {
  const section = $("#buildStory");
  if (!section) return;
  const small = innerWidth < 960;
  const b = makeBuilding($("#storyBuilding"), { cols: 12, floors: small ? 5 : 8, bw: small ? 22 : 30, bh: small ? 10 : 14, sign: "Handover Ready" });
  b.el.classList.add("scrollmode");
  const pct = $("#storyPct");
  const label = $("#storyLabel");
  const labels = ["Foundation", "Structure", "Finishing", "Handover"];

  const update = () => {
    const r = section.getBoundingClientRect();
    const total = r.height - innerHeight;
    const p = Math.min(1, Math.max(0, -r.top / (total * 0.85)));
    buildTo(b, p);
    pct.firstChild.textContent = Math.round(p * 100) + "%";
    label.textContent = labels[Math.min(3, Math.floor(p * 4))];
  };
  addEventListener("scroll", update, { passive: true });
  addEventListener("resize", update);
  update();

  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => e.target.classList.toggle("active", e.isIntersecting));
  }, { rootMargin: "-40% 0px -40% 0px" });
  $$(".step", section).forEach((s) => io.observe(s));
}

function initTestimonials() {
  const wrap = $("#testi");
  if (!wrap) return;
  $(".testi__slides", wrap).innerHTML = TESTIMONIALS.map((t, i) => `
    <div class="testi__slide ${i === 0 ? "active" : ""}">
      <blockquote>“${t.quote}”</blockquote><b>${t.name}</b><span>${t.role}</span>
    </div>`).join("");
  $(".testi__dots", wrap).innerHTML = TESTIMONIALS.map((_, i) => `<button class="${i === 0 ? "active" : ""}" aria-label="Testimonial ${i + 1}"></button>`).join("");
  const slides = $$(".testi__slide", wrap);
  const dots = $$(".testi__dots button", wrap);
  let cur = 0, timer;
  const go = (i) => {
    slides[cur].classList.remove("active"); dots[cur].classList.remove("active");
    cur = (i + slides.length) % slides.length;
    slides[cur].classList.add("active"); dots[cur].classList.add("active");
    clearInterval(timer); timer = setInterval(() => go(cur + 1), 6000);
  };
  dots.forEach((d, i) => d.addEventListener("click", () => go(i)));
  timer = setInterval(() => go(cur + 1), 6000);
}

/* =========================================================
   Page: Properties listing
   ========================================================= */
function initProperties() {
  const params = new URLSearchParams(location.search);
  const state = {
    purpose: params.get("purpose") || "all",
    q: params.get("q") || "",
    type: params.get("type") || "",
    city: params.get("city") || "",
    sort: "newest",
  };
  const grid = $("#listGrid");
  const q = $("#fQ"), type = $("#fType"), city = $("#fCity"), sort = $("#fSort");
  q.value = state.q; type.value = state.type; city.value = state.city;

  const tabs = $$("#purposeTabs button");
  const setTab = () => tabs.forEach((b) => b.classList.toggle("active", b.dataset.purpose === state.purpose));
  tabs.forEach((b) => b.addEventListener("click", () => { state.purpose = b.dataset.purpose; setTab(); render(); }));
  setTab();

  const render = () => {
    const term = state.q.toLowerCase();
    let list = PROPERTIES.filter((p) =>
      (state.purpose === "all" || p.purpose === state.purpose) &&
      (!state.type || p.type === state.type) &&
      (!state.city || p.city === state.city) &&
      (!term || (p.title + " " + p.location).toLowerCase().includes(term)));
    if (state.sort === "low") list.sort((a, b) => a.price - b.price);
    if (state.sort === "high") list.sort((a, b) => b.price - a.price);

    $("#resultCount").textContent = `${list.length} ${list.length === 1 ? "property" : "properties"} found`;
    grid.innerHTML = list.length
      ? list.map((p, i) => propertyCard(p, (i % 3) * 0.08)).join("")
      : `<div class="empty-state"><h3>No properties match your search</h3><p>Try a different area or clear the filters.</p></div>`;
    initReveal();
  };

  q.addEventListener("input", () => { state.q = q.value; render(); });
  type.addEventListener("change", () => { state.type = type.value; render(); });
  city.addEventListener("change", () => { state.city = city.value; render(); });
  sort.addEventListener("change", () => { state.sort = sort.value; render(); });
  render();
}

/* =========================================================
   Page: Property detail
   ========================================================= */
function initProperty() {
  const id = new URLSearchParams(location.search).get("id");
  const p = PROPERTIES.find((x) => x.id === id) || PROPERTIES[0];
  document.title = `${p.title} | ${SITE.name}`;
  $("#crumbTitle").textContent = p.title;
  $("#heroBgImg").src = p.img;

  const imgs = [...p.gallery];
  while (imgs.length < 3) imgs.push(p.img);
  $("#gallery").innerHTML = imgs.slice(0, 5).map((src) => `<div class="gallery__cell reveal-img"><img src="${src}" alt="${p.title}"></div>`).join("");

  $("#detailHead").innerHTML = `
    <div>
      <div class="card__tags" style="position:static;margin-bottom:14px">
        <span class="tag ${p.purpose === "sale" ? "tag--gold" : "tag--green"}">For ${p.purpose === "sale" ? "Sale" : "Rent"}</span>
        <span class="tag tag--dark">${p.type}</span>
      </div>
      <h1>${p.title}</h1>
      <div class="card__loc">${ICON.pin}${p.location}</div>
    </div>
    <div class="detail__price">${formatPrice(p.price, p.purpose)}</div>`;

  const specs = [
    [ICON.bed, "Bedrooms", p.beds || "—"],
    [ICON.bath, "Bathrooms", p.baths || "—"],
    [ICON.area, "Area", p.area],
    [ICON.home, "Type", p.type],
  ];
  $("#specRow").innerHTML = specs.map(([i, l, v]) => `<div class="spec">${i}<small>${l}</small><b>${v}</b></div>`).join("");
  $("#detailDesc").textContent = p.desc;
  $("#amenities").innerHTML = p.amenities.map((a) => `<li>${a}</li>`).join("");
  $("#enqMsg").value = `Hi, I'm interested in "${p.title}" (${p.location}). Please share more details.`;
  $("#waBtn").href = `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(`Hi, I'm interested in ${p.title} — ${p.location}`)}`;

  const similar = PROPERTIES.filter((x) => x.id !== p.id && (x.purpose === p.purpose || x.type === p.type)).slice(0, 3);
  $("#similar").innerHTML = similar.map((x, i) => propertyCard(x, i * 0.1)).join("");

  // lightbox
  const lb = $("#lightbox");
  $("#gallery").addEventListener("click", (e) => {
    if (e.target.tagName !== "IMG") return;
    $("img", lb).src = e.target.src;
    lb.classList.add("open");
  });
  lb.addEventListener("click", (e) => { if (e.target !== $("img", lb)) lb.classList.remove("open"); });
  addEventListener("keydown", (e) => e.key === "Escape" && lb.classList.remove("open"));
}

/* =========================================================
   Page: Projects
   ========================================================= */
function initProjects() {
  const grid = $("#projectsGrid");
  const render = (f) => {
    const list = PROJECTS.filter((p) => f === "all" || p.status === f || p.category === f);
    grid.innerHTML = list.map((p, i) => projectCard(p, (i % 2) * 0.12)).join("");
    initReveal();
  };
  const tabs = $$("#projectTabs button");
  const select = (f) => {
    tabs.forEach((x) => x.classList.toggle("active", x.dataset.filter === f));
    render(f);
  };
  tabs.forEach((b) => b.addEventListener("click", () => select(b.dataset.filter)));
  const wanted = new URLSearchParams(location.search).get("filter");
  select(tabs.some((b) => b.dataset.filter === wanted) ? wanted : "all");
}

/* =========================================================
   Page: Agents
   ========================================================= */
function initAgents() {
  const grid = $("#agentsGrid");
  const q = $("#agentQ");
  const render = () => {
    const term = q.value.trim().toLowerCase();
    const list = AGENTS.filter((a) => !term || `${a.name} ${a.role} ${a.area}`.toLowerCase().includes(term));
    grid.innerHTML = list.length ? list.map((a, i) => `
      <article class="agent-card reveal" style="--rd:${(i % 4) * 0.08}s">
        <div class="agent-card__img"><img src="${a.img}" alt="${a.name}" loading="lazy"><span class="tag tag--gold">${a.listings} listings</span></div>
        <div class="agent-card__body">
          <h3>${a.name}</h3>
          <span class="agent-card__role">${a.role}</span>
          <ul>
            <li>${ICON.pin}${a.area}</li>
            <li>${ICON.handshake}${a.langs}</li>
          </ul>
          <div class="agent-card__actions">
            <a class="btn btn--sm" href="tel:${a.phone.replace(/\D/g, "")}">${ICON.phone}Call</a>
            <a class="btn btn--sm btn--outline" target="_blank" rel="noopener" href="https://wa.me/92${a.phone.replace(/\D/g, "").replace(/^0/, "")}">WhatsApp</a>
          </div>
        </div>
      </article>`).join("") : `<div class="empty-state"><h3>No agent found</h3><p>Try another name or area.</p></div>`;
    initReveal();
  };
  q.addEventListener("input", render);
  render();
}

/* =========================================================
   Page: Maps (offices + project locations)
   ========================================================= */
function initMaps() {
  const params = new URLSearchParams(location.search);
  const places = [
    ...OFFICES.map((o) => ({ id: o.id, kind: "Office", name: o.name, sub: o.address, phone: o.phone, q: o.q })),
    ...PROJECTS.map((p) => ({ id: p.id, kind: "Project", name: p.name, sub: `${p.location} · ${p.status}`, q: p.location })),
  ];
  const list = $("#placeList");
  const frame = $("#mapFrame");
  const title = $("#mapTitle");
  let filter = params.get("view") === "offices" ? "Office" : "all";
  let current = places.find((p) => p.id === params.get("office")) || places[0];

  const show = (p) => {
    current = p;
    frame.src = `https://maps.google.com/maps?q=${encodeURIComponent(p.q)}&z=14&output=embed`;
    title.innerHTML = `<b>${p.name}</b><span>${p.sub}</span>`;
    $$(".place", list).forEach((el) => el.classList.toggle("active", el.dataset.id === p.id));
  };
  const render = () => {
    list.innerHTML = places.filter((p) => filter === "all" || p.kind === filter).map((p) => `
      <button class="place" data-id="${p.id}">
        <i>${p.kind === "Office" ? ICON.building : ICON.helmet}</i>
        <span><small>${p.kind}</small><b>${p.name}</b><em>${p.sub}</em></span>
      </button>`).join("");
    $$(".place", list).forEach((el) => el.addEventListener("click", () => show(places.find((p) => p.id === el.dataset.id))));
    show(current.kind === filter || filter === "all" ? current : places.find((p) => p.kind === filter));
  };
  $$("#mapTabs button").forEach((b) => {
    b.classList.toggle("active", b.dataset.filter === filter);
    b.addEventListener("click", () => {
      filter = b.dataset.filter;
      $$("#mapTabs button").forEach((x) => x.classList.toggle("active", x === b));
      render();
    });
  });
  render();
}

/* =========================================================
   Page: Gallery
   ========================================================= */
function initGallery() {
  const grid = $("#galleryGrid");
  const lb = $("#lightbox");
  let shown = GALLERY, idx = 0;
  const render = (f) => {
    shown = GALLERY.filter((g) => f === "all" || g.cat === f);
    grid.innerHTML = shown.map((g, i) => `
      <figure class="g-item reveal" style="--rd:${(i % 3) * 0.08}s" data-i="${i}">
        <img src="${g.src}" alt="${g.title}" loading="lazy">
        <figcaption><small>${g.cat}</small>${g.title}</figcaption>
      </figure>`).join("");
    initReveal();
  };
  const open = (i) => {
    idx = (i + shown.length) % shown.length;
    $("img", lb).src = shown[idx].full;
    $("img", lb).alt = shown[idx].title;
    $(".lightbox__cap", lb).textContent = `${shown[idx].title} · ${idx + 1} / ${shown.length}`;
    lb.classList.add("open");
  };
  grid.addEventListener("click", (e) => { const f = e.target.closest(".g-item"); if (f) open(+f.dataset.i); });
  $(".lightbox__prev", lb).addEventListener("click", (e) => { e.stopPropagation(); open(idx - 1); });
  $(".lightbox__next", lb).addEventListener("click", (e) => { e.stopPropagation(); open(idx + 1); });
  lb.addEventListener("click", (e) => { if (e.target === lb || e.target.closest(".lightbox__close")) lb.classList.remove("open"); });
  addEventListener("keydown", (e) => {
    if (!lb.classList.contains("open")) return;
    if (e.key === "Escape") lb.classList.remove("open");
    if (e.key === "ArrowRight") open(idx + 1);
    if (e.key === "ArrowLeft") open(idx - 1);
  });
  $$("#galleryTabs button").forEach((b) => b.addEventListener("click", () => {
    $$("#galleryTabs button").forEach((x) => x.classList.toggle("active", x === b));
    render(b.dataset.filter);
  }));
  render("all");
}

/* =========================================================
   Page: Blog + single post
   ========================================================= */
const fmtDate = (d) => new Date(d + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
const postCard = (p, i = 0) => `
  <article class="card post-card reveal" style="--rd:${(i % 3) * 0.08}s">
    <a href="post.html?id=${p.id}" class="card__media"><img src="${p.img.replace("w=1200", "w=800")}" alt="" loading="lazy">
      <div class="card__tags"><span class="tag tag--gold">${p.cat}</span></div></a>
    <div class="card__body">
      <span class="post-meta">${fmtDate(p.date)} · ${p.read} min read</span>
      <a href="post.html?id=${p.id}"><h3 class="card__title">${p.title}</h3></a>
      <p>${p.excerpt}</p>
      <a class="link-arrow" href="post.html?id=${p.id}">Read article${ICON.arrow}</a>
    </div>
  </article>`;

function initBlog() {
  const [first, ...rest] = POSTS;
  $("#featuredPost").innerHTML = `
    <a href="post.html?id=${first.id}" class="post-feature__img reveal-img"><img src="${first.img}" alt=""></a>
    <div class="post-feature__body">
      <span class="tag tag--gold">${first.cat}</span>
      <span class="post-meta">${fmtDate(first.date)} · ${first.read} min read</span>
      <h2><a href="post.html?id=${first.id}">${first.title}</a></h2>
      <p>${first.excerpt}</p>
      <a class="btn" href="post.html?id=${first.id}">Read article${ICON.arrow}</a>
    </div>`;
  const cats = ["All", ...new Set(POSTS.map((p) => p.cat))];
  $("#blogTabs").innerHTML = cats.map((c, i) => `<button class="${i ? "" : "active"}" data-filter="${c}">${c}</button>`).join("");
  const render = (c) => {
    $("#postGrid").innerHTML = (c === "All" ? rest : POSTS.filter((p) => p.cat === c)).map(postCard).join("");
    initReveal();
  };
  $$("#blogTabs button").forEach((b) => b.addEventListener("click", () => {
    $$("#blogTabs button").forEach((x) => x.classList.toggle("active", x === b));
    render(b.dataset.filter);
  }));
  render("All");
}

function initPost() {
  const p = POSTS.find((x) => x.id === new URLSearchParams(location.search).get("id")) || POSTS[0];
  document.title = `${p.title} | ${SITE.name}`;
  $("#heroBgImg").src = p.img;
  $("#postCat").textContent = p.cat;
  $("#postTitle").textContent = p.title;
  $("#postMeta").textContent = `${fmtDate(p.date)} · ${p.read} min read · By ${SITE.name} team`;
  $("#postBody").innerHTML = `<p class="lead">${p.excerpt}</p>` + p.body.map((t) => `<p>${t}</p>`).join("");
  const url = encodeURIComponent(location.href);
  $("#share").innerHTML = `
    <a target="_blank" rel="noopener" href="https://wa.me/?text=${encodeURIComponent(p.title)}%20${url}">${ICON.wa}WhatsApp</a>
    <a target="_blank" rel="noopener" href="https://www.facebook.com/sharer/sharer.php?u=${url}">${ICON.fb}Facebook</a>
    <a target="_blank" rel="noopener" href="https://www.linkedin.com/sharing/share-offsite/?url=${url}">${ICON.li}LinkedIn</a>`;
  $("#relatedPosts").innerHTML = POSTS.filter((x) => x.id !== p.id).slice(0, 3).map(postCard).join("");
}

/* =========================================================
   Page: About
   ========================================================= */
function initAbout() {
  $("#team").innerHTML = TEAM.map((m, i) => `
    <div class="member reveal" style="--rd:${i * 0.1}s">
      <div class="member__img"><img src="${m.img}" alt="${m.name}" loading="lazy">
        <a href="tel:${m.phone.replace(/\D/g, "")}">${ICON.phone}${m.phone}</a></div>
      <h4>${m.name}</h4><span>${m.role}</span>
    </div>`).join("");

  const tl = $(".timeline");
  const fill = $(".timeline__fill");
  const update = () => {
    const r = tl.getBoundingClientRect();
    const p = Math.min(1, Math.max(0, (innerHeight * 0.6 - r.top) / r.height));
    fill.style.height = p * 100 + "%";
  };
  addEventListener("scroll", update, { passive: true });
  update();
}

/* =========================================================
   Forms (front-end only — connect to backend / email service)
   ========================================================= */
function initForms() {
  const params = new URLSearchParams(location.search);
  const typeSel = $("#cType");
  if (typeSel && params.get("type")) typeSel.value = params.get("type");
  const msg = $("#cMsg");
  if (msg && params.get("project")) {
    if (typeSel) typeSel.value = "Project booking";
    msg.value = `I'd like details and booking information for ${params.get("project")}.`;
  }

  $$("form[data-enquiry]").forEach((form) => {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      let ok = true;
      $$("[required]", form).forEach((f) => {
        const bad = !f.value.trim() || (f.type === "email" && !/^\S+@\S+\.\S+$/.test(f.value));
        f.classList.toggle("invalid", bad);
        if (bad) ok = false;
      });
      if (!ok) return toast("Please fill in the highlighted fields");
      form.reset();
      toast("Thank you! Our consultant will contact you shortly.");
    });
  });
}

/* =========================================================
   Boot
   ========================================================= */
renderChrome();

({
  home: initHome, properties: initProperties, property: initProperty, projects: initProjects, about: initAbout,
  agents: initAgents, maps: initMaps, gallery: initGallery, blog: initBlog, post: initPost,
}[PAGE] || (() => {}))();
initForms();
initReveal();

runPreloader().then(() => {
  document.body.classList.add("loaded");
  window.__startHero?.();
});
