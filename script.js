/* ============================================================
   158 · Live Auto Tracker  —  Vanilla JS
   Timeframe: Jul 27, 2026 → Dec 31, 2026  (158 days)

   Fully automated. No clicking. Days complete themselves as
   real time passes, keyed to the UTC+5 timezone. A day is
   counted "done" once it has fully elapsed (at midnight UTC+5),
   which is when the counter auto-increments.
   ============================================================ */

(() => {
  "use strict";

  /* Cycle is defined in calendar days (UTC+5). */
  const START = { y: 2026, m: 6, d: 27 };  // Jul 27, 2026 (m is 0-indexed)
  const END   = { y: 2026, m: 11, d: 31 }; // Dec 31, 2026
  const UTC5_OFFSET_MIN = 5 * 60;          // UTC+5 in minutes
  const DAY_MS = 24 * 60 * 60 * 1000;

  const WEEKDAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun",
    "Jul","Aug","Sep","Oct","Nov","Dec"];

  /* ---- Build the list of dates (source of truth) ---- */
  const startUTC = Date.UTC(START.y, START.m, START.d);
  const endUTC   = Date.UTC(END.y, END.m, END.d);
  const dates = [];
  for (let t = startUTC; t <= endUTC; t += DAY_MS) {
    dates.push(new Date(t)); // treated as UTC calendar dates
  }
  const TOTAL = dates.length; // 158

  /* ---- Registry of every rendered element, grouped by day index ---- */
  const registry = Array.from({ length: TOTAL }, () => []);
  function register(index, el) {
    el.dataset.index = index;
    registry[index].push(el);
  }

  /* ============================================================
     Time helpers — everything is anchored to UTC+5
     ============================================================ */

  /* Milliseconds "now", shifted so that UTC getters read as UTC+5 wall clock. */
  function nowUTC5() {
    return Date.now() + UTC5_OFFSET_MIN * 60 * 1000;
  }

  /* The UTC-midnight timestamp of today's UTC+5 calendar date. */
  function todayStartUTC5() {
    const shifted = new Date(nowUTC5());
    return Date.UTC(
      shifted.getUTCFullYear(),
      shifted.getUTCMonth(),
      shifted.getUTCDate()
    );
  }

  /* How many whole days have fully elapsed since START (i.e. are "done"). */
  function completedDays() {
    const elapsed = Math.floor((todayStartUTC5() - startUTC) / DAY_MS);
    return Math.max(0, Math.min(elapsed, TOTAL));
  }

  /* Index of the day currently in progress (or -1 if outside the cycle). */
  function activeIndex() {
    const idx = Math.floor((todayStartUTC5() - startUTC) / DAY_MS);
    return idx >= 0 && idx < TOTAL ? idx : -1;
  }

  /* Fraction (0–1) of the current UTC+5 day already elapsed. */
  function fractionOfToday() {
    const nowMs = nowUTC5();
    const dayStart = todayStartUTC5();
    return Math.min(1, Math.max(0, (nowMs - dayStart) / DAY_MS));
  }

  /* ============================================================
     Build the three views (non-interactive)
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

  /* ---- 2. Calendar view: mini-months, weekday-aligned ---- */
  function buildCalendar() {
    const wrap = document.getElementById("calendar");
    const frag = document.createDocumentFragment();
    const monthNames = ["January","February","March","April","May","June",
      "July","August","September","October","November","December"];

    let i = 0;
    while (i < TOTAL) {
      const month = dates[i].getUTCMonth();
      const year  = dates[i].getUTCFullYear();

      const monthBox = document.createElement("div");
      monthBox.className = "month";

      const label = document.createElement("div");
      label.className = "month-name";
      label.textContent = monthNames[month];
      monthBox.appendChild(label);

      const grid = document.createElement("div");
      grid.className = "month-days";

      const firstWeekday = dates[i].getUTCDay(); // 0 = Sunday
      for (let p = 0; p < firstWeekday; p++) {
        const pad = document.createElement("div");
        pad.className = "cell-pad";
        grid.appendChild(pad);
      }

      while (i < TOTAL && dates[i].getUTCMonth() === month && dates[i].getUTCFullYear() === year) {
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
      const title = document.createElementNS(SVGNS, "title");
      title.textContent = fmt(dates[i]);
      line.appendChild(title);
      register(i, line);
      svg.appendChild(line);
    }
  }

  /* ============================================================
     Rendering
     ============================================================ */

  let lastDone = -1; // tracks the last known completed count (for rollover fx)

  function renderDays() {
    const done = completedDays();
    const active = activeIndex();

    for (let i = 0; i < TOTAL; i++) {
      const isDone = i < done;
      const isActive = i === active && !isDone;
      for (const el of registry[i]) {
        el.classList.toggle("done", isDone);
        el.classList.toggle("today", isActive);
      }
    }
    return { done, active };
  }

  function renderStats(done) {
    const smoothDone = done + fractionOfToday() * (activeIndex() >= 0 ? 1 : 0);
    const pct = (smoothDone / TOTAL) * 100;
    const pctInt = Math.round((done / TOTAL) * 100);

    document.getElementById("count").textContent = done;
    document.getElementById("circleCount").textContent = done;
    document.getElementById("percent").textContent = pctInt + "%";

    /* Progress ring */
    const ring = document.getElementById("ringProgress");
    const C = 2 * Math.PI * 52;
    ring.style.strokeDasharray = C.toFixed(2);
    ring.style.strokeDashoffset = (C * (1 - smoothDone / TOTAL)).toFixed(2);

    /* Percentage bar (smooth, includes today's partial progress) */
    const fill = document.getElementById("pctFill");
    fill.style.width = pct.toFixed(2) + "%";
    document.getElementById("pctLabel").textContent = pct.toFixed(1) + "%";
    const track = document.getElementById("pctTrack");
    track.setAttribute("aria-valuenow", pct.toFixed(1));

    /* Days remaining in the cycle */
    const remaining = TOTAL - done;
    document.getElementById("daysLeft").textContent = remaining;

    /* Subtitle */
    const sub = document.getElementById("subtitle");
    sub.textContent = done === 0
      ? "Day 1 in progress. It fills at midnight UTC+5."
      : done >= TOTAL
        ? "🎉 All 158 days complete. Incredible."
        : `${remaining} ${remaining === 1 ? "day" : "days"} to go · auto-tracking.`;
  }

  /* ============================================================
     Live clock + countdown (updates every second)
     ============================================================ */

  function pad2(n) { return String(n).padStart(2, "0"); }

  function tick() {
    const shifted = new Date(nowUTC5());
    const hh = pad2(shifted.getUTCHours());
    const mm = pad2(shifted.getUTCMinutes());
    const ss = pad2(shifted.getUTCSeconds());

    document.getElementById("clock").textContent = `${hh}:${mm}:${ss}`;
    document.getElementById("clockDate").textContent =
      `${WEEKDAYS[shifted.getUTCDay()]} · ${MONTHS_SHORT[shifted.getUTCMonth()]} ${shifted.getUTCDate()}, ${shifted.getUTCFullYear()}`;

    /* Countdown to next midnight UTC+5 (the next auto-increment) */
    const nextMidnight = todayStartUTC5() + DAY_MS;
    const msLeft = Math.max(0, nextMidnight - nowUTC5());
    const totalSec = Math.floor(msLeft / 1000);
    const ch = pad2(Math.floor(totalSec / 3600));
    const cm = pad2(Math.floor((totalSec % 3600) / 60));
    const cs = pad2(totalSec % 60);
    document.getElementById("countdown").textContent = `${ch}:${cm}:${cs}`;

    /* Re-render stats every tick so the ring + % bar creep smoothly */
    const done = completedDays();
    renderStats(done);

    /* Detect a day rollover → repaint days + celebrate */
    if (done !== lastDone) {
      const { done: d } = renderDays();
      if (lastDone !== -1 && d > lastDone) burst();
      lastDone = d;
    }
  }

  /* ============================================================
     Cool feature: confetti burst on auto-increment
     ============================================================ */

  const canvas = document.getElementById("fx");
  const ctx = canvas.getContext("2d");
  let particles = [];
  let rafId = null;

  function sizeCanvas() {
    canvas.width = window.innerWidth * devicePixelRatio;
    canvas.height = window.innerHeight * devicePixelRatio;
  }
  sizeCanvas();
  window.addEventListener("resize", sizeCanvas);

  function burst() {
    const greens = ["#39ff14", "#7dffb0", "#22c55e", "#a7f3d0", "#eaffea"];
    const cx = canvas.width / 2;
    const cy = canvas.height * 0.28;
    for (let i = 0; i < 120; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = (2 + Math.random() * 7) * devicePixelRatio;
      particles.push({
        x: cx, y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 3 * devicePixelRatio,
        size: (2 + Math.random() * 4) * devicePixelRatio,
        color: greens[(Math.random() * greens.length) | 0],
        life: 1,
        rot: Math.random() * Math.PI,
      });
    }
    if (!rafId) rafId = requestAnimationFrame(animate);
  }

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const g = 0.15 * devicePixelRatio;
    particles = particles.filter((p) => p.life > 0);
    for (const p of particles) {
      p.vy += g;
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.99;
      p.life -= 0.012;
      p.rot += 0.1;
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 1.6);
      ctx.restore();
    }
    if (particles.length) {
      rafId = requestAnimationFrame(animate);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      rafId = null;
    }
  }

  /* ============================================================
     Helpers + boot
     ============================================================ */

  function fmt(d) {
    return `${WEEKDAYS[d.getUTCDay()]}, ${MONTHS_SHORT[d.getUTCMonth()]} ${d.getUTCDate()}`;
  }

  /* Initial paint */
  lastDone = renderDays().done;
  renderStats(lastDone);
  tick();
  setInterval(tick, 1000);
})();
