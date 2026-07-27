/* ============================================================
   158 · Habit Tracker  —  Vanilla JS
   Timeframe: Jul 27, 2026 → Dec 31, 2026  (158 days)
   ============================================================ */

(() => {
  "use strict";

  const START = new Date(2026, 6, 27); // month is 0-indexed: 6 = July
  const END   = new Date(2026, 11, 31);
  const STORAGE_KEY = "habit-tracker-158-v1";

  /* ---- Build the list of dates (source of truth for count) ---- */
  const dates = [];
  for (let d = new Date(START); d <= END; d.setDate(d.getDate() + 1)) {
    dates.push(new Date(d));
  }
  const TOTAL = dates.length; // 158

  /* ---- State: load from localStorage or start empty ---- */
  let state = loadState();

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr) && arr.length === TOTAL) {
          return arr.map(Boolean);
        }
      }
    } catch (e) { /* ignore corrupt data */ }
    return new Array(TOTAL).fill(false);
  }

  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
    catch (e) { /* storage may be unavailable */ }
  }

  /* ---- Registry of every rendered element, grouped by day index ---- */
  const registry = Array.from({ length: TOTAL }, () => []);

  function register(index, el) {
    el.dataset.index = index;
    registry[index].push(el);
    el.addEventListener("click", () => toggle(index));
  }

  /* ============================================================
     Build the three views
     ============================================================ */

  buildBlocks();
  buildCalendar();
  buildCircle();

  /* ---- 1. Block view: 158 squares ---- */
  function buildBlocks() {
    const wrap = document.getElementById("blocks");
    const frag = document.createDocumentFragment();
    for (let i = 0; i < TOTAL; i++) {
      const el = document.createElement("div");
      el.className = "day";
      el.title = fmt(dates[i]);
      register(i, el);
      frag.appendChild(el);
    }
    wrap.appendChild(frag);
  }

  /* ---- 2. Calendar view: 6 mini-months, weekday-aligned ---- */
  function buildCalendar() {
    const wrap = document.getElementById("calendar");
    const frag = document.createDocumentFragment();
    const monthNames = ["January","February","March","April","May","June",
      "July","August","September","October","November","December"];

    let i = 0;
    while (i < TOTAL) {
      const month = dates[i].getMonth();
      const year  = dates[i].getFullYear();

      const monthBox = document.createElement("div");
      monthBox.className = "month";

      const label = document.createElement("div");
      label.className = "month-name";
      label.textContent = monthNames[month];
      monthBox.appendChild(label);

      const grid = document.createElement("div");
      grid.className = "month-days";

      // Leading empty cells so the first day lands on the right weekday
      const firstWeekday = dates[i].getDay(); // 0 = Sunday
      for (let p = 0; p < firstWeekday; p++) {
        const pad = document.createElement("div");
        pad.className = "cell-pad";
        grid.appendChild(pad);
      }

      // All tracked days that belong to this month
      while (i < TOTAL && dates[i].getMonth() === month && dates[i].getFullYear() === year) {
        const el = document.createElement("div");
        el.className = "day";
        el.title = fmt(dates[i]);
        register(i, el);
        grid.appendChild(el);
        i++;
      }

      monthBox.appendChild(grid);
      frag.appendChild(monthBox);
    }
    wrap.appendChild(frag);
  }

  /* ---- 3. Circular view: 158 radiating dashes (SVG) ---- */
  function buildCircle() {
    const svg = document.getElementById("circleSvg");
    const SVGNS = "http://www.w3.org/2000/svg";
    const cx = 250, cy = 250;
    const rInner = 150, rOuter = 200;

    for (let i = 0; i < TOTAL; i++) {
      // Start at top (-90°) and go clockwise
      const angle = (i / TOTAL) * Math.PI * 2 - Math.PI / 2;
      const x1 = cx + Math.cos(angle) * rInner;
      const y1 = cy + Math.sin(angle) * rInner;
      const x2 = cx + Math.cos(angle) * rOuter;
      const y2 = cy + Math.sin(angle) * rOuter;

      const line = document.createElementNS(SVGNS, "line");
      line.setAttribute("x1", x1.toFixed(2));
      line.setAttribute("y1", y1.toFixed(2));
      line.setAttribute("x2", x2.toFixed(2));
      line.setAttribute("y2", y2.toFixed(2));
      line.setAttribute("class", "dash");
      line.setAttribute("data-index", i);
      const t = fmt(dates[i]);
      const title = document.createElementNS(SVGNS, "title");
      title.textContent = t;
      line.appendChild(title);
      register(i, line);
      svg.appendChild(line);
    }
  }

  /* ============================================================
     Toggle + render (syncs ALL views)
     ============================================================ */

  function toggle(index) {
    state[index] = !state[index];
    save();
    renderDay(index);
    renderStats();
  }

  function renderDay(index) {
    const on = state[index];
    for (const el of registry[index]) {
      el.classList.toggle("done", on);
    }
  }

  function renderStats() {
    const done = state.reduce((n, v) => n + (v ? 1 : 0), 0);
    const pct = Math.round((done / TOTAL) * 100);

    document.getElementById("count").textContent = done;
    document.getElementById("circleCount").textContent = done;
    document.getElementById("percent").textContent = pct + "%";

    // Progress ring stroke
    const ring = document.getElementById("ringProgress");
    const C = 2 * Math.PI * 52;
    ring.style.strokeDasharray = C.toFixed(2);
    ring.style.strokeDashoffset = (C * (1 - done / TOTAL)).toFixed(2);

    const sub = document.getElementById("subtitle");
    const remaining = TOTAL - done;
    sub.textContent = done === 0
      ? "Every dot is a day. Fill them all."
      : done === TOTAL
        ? "🎉 All 158 days complete. Incredible."
        : `${remaining} ${remaining === 1 ? "day" : "days"} to go.`;
  }

  /* Full initial paint */
  function renderAll() {
    for (let i = 0; i < TOTAL; i++) renderDay(i);
    renderStats();
  }

  /* ---- Reset ---- */
  document.getElementById("resetBtn").addEventListener("click", () => {
    if (!confirm("Reset all progress? This cannot be undone.")) return;
    state = new Array(TOTAL).fill(false);
    save();
    renderAll();
  });

  /* ---- Helpers ---- */
  function fmt(d) {
    return d.toLocaleDateString(undefined, {
      weekday: "short", month: "short", day: "numeric"
    });
  }

  renderAll();
})();
