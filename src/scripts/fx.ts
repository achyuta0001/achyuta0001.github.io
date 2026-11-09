// The annotation layer: a cursor swarm that wireframes the hero on first load, design-tool
// selection boxes on section headings as they scroll in, and a few drifting
// cursors. Everything here is decoration: aria-hidden, pointer-events: none,
// skipped entirely for reduced motion, and the page reads the same without it.

const BOOT_KEY = 'fx:booted';

function dims(r: DOMRect): string {
  return `${Math.round(r.width)}×${Math.round(r.height)}`;
}

function box(r: DOMRect, label: string, cls: string, origin: { x: number; y: number }): HTMLElement {
  const b = document.createElement('div');
  b.className = cls;
  b.style.left = `${r.left - origin.x}px`;
  b.style.top = `${r.top - origin.y}px`;
  b.style.width = `${r.width}px`;
  b.style.height = `${r.height}px`;
  const tag = document.createElement('span');
  tag.className = 'fx-tag';
  tag.textContent = `${label}  ${dims(r)}`;
  // Near the top of the viewport there is no room above the box; tuck the tag inside.
  if (r.top < 28) tag.classList.add('inside');
  b.append(tag);
  for (const c of ['tl', 'tr', 'bl', 'br']) {
    const h = document.createElement('i');
    h.className = `fx-h ${c}`;
    b.append(h);
  }
  return b;
}

function shouldBoot(): boolean {
  if (location.hash || scrollY > 40) return false;
  try {
    if (sessionStorage.getItem(BOOT_KEY)) return false;
    sessionStorage.setItem(BOOT_KEY, '1');
  } catch {
    // storage blocked: run it anyway, it is short
  }
  return true;
}

const SWARM_COLORS = ['#45c8ff', '#ffd23f', '#ff8ad8', '#b48cff', '#7dffb2', '#ff7a6b'];
const ARROW = (fill: string, size = 12) =>
  `<svg width="${size}" height="${Math.round(size * 1.125)}" viewBox="0 0 16 18"><path d="M1 1l13 7.2-5.8 1.4L5.4 16z" fill="${fill}" stroke="#000" stroke-width="1.4" stroke-linejoin="round"/></svg>`;

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const clamp01 = (t: number) => Math.max(0, Math.min(1, t));

type Bot = {
  el: HTMLElement;
  x: number; y: number;
  orbit: { r: number; a: number; w: number; squash: number };
  job?: { kind: 'box'; at: number; r: DOMRect; label: string; box?: HTMLElement; from?: [number, number] }
     | { kind: 'mark'; at: number; to: [number, number]; from?: [number, number]; placed?: boolean };
};

// First load: a swarm of cursors circles the middle of a black screen, then
// breaks up, each cursor dragging out a wireframe box over one hero element,
// and the page fades in underneath. ~3s; any input ends it at once.
function boot(onDone: () => void): void {
  if (!shouldBoot()) return onDone();
  const vw = innerWidth;
  const vh = innerHeight;
  const targets = Array.from(document.querySelectorAll<HTMLElement>('.hero [data-fx-label]'))
    .map((el) => ({ r: el.getBoundingClientRect(), label: el.dataset.fxLabel ?? '' }))
    .filter(({ r }) => r.top < vh && r.bottom > 0 && r.width > 0);

  const overlay = document.createElement('div');
  overlay.className = 'fx-layer fx-boot';
  overlay.setAttribute('aria-hidden', 'true');
  const core = document.createElement('div');
  core.className = 'fx-core';
  core.textContent = 'aku';
  const status = document.createElement('p');
  status.className = 'fx-status';
  status.textContent = 'spawning agents';
  overlay.append(core, status);

  const count = vw < 700 ? 14 : 24;
  const cx = vw / 2;
  const cy = vh / 2;
  const bots: Bot[] = Array.from({ length: count }, (_, i) => {
    const el = document.createElement('div');
    el.className = 'fx-bot';
    el.innerHTML = ARROW(SWARM_COLORS[i % SWARM_COLORS.length], 14);
    overlay.append(el);
    // Enter from a random point on the screen edge.
    const side = Math.random() * 4;
    const x = side < 1 ? -20 : side < 2 ? vw + 20 : Math.random() * vw;
    const y = side < 2 ? Math.random() * vh : side < 3 ? -20 : vh + 20;
    const ring = Math.min(vw, vh) * (0.05 + Math.random() * 0.11);
    return {
      el, x, y,
      orbit: { r: ring, a: Math.random() * Math.PI * 2, w: (0.0022 + Math.random() * 0.0024) * (i % 3 === 0 ? -1 : 1), squash: 0.55 + Math.random() * 0.35 },
    };
  });

  const SWARM = 1100;
  const STAGGER = 85;
  const TRAVEL = 380;
  const DRAG = 420;
  targets.forEach((t, k) => {
    const bot = bots[k % bots.length];
    if (!bot.job) bot.job = { kind: 'box', at: SWARM + k * STAGGER, r: t.r, label: t.label };
  });
  for (const b of bots) {
    if (!b.job) b.job = { kind: 'mark', at: SWARM + Math.random() * 600, to: [40 + Math.random() * (vw - 80), 40 + Math.random() * (vh - 80)] };
  }
  const buildEnd = SWARM + targets.length * STAGGER + TRAVEL + DRAG;
  const END = buildEnd + 550;

  document.body.append(overlay);
  let done = false;
  let t0 = -1;
  let last = 0;
  const finish = () => {
    if (done) return;
    done = true;
    overlay.classList.add('out');
    setTimeout(() => { overlay.remove(); onDone(); }, 450);
  };
  for (const ev of ['keydown', 'pointerdown', 'wheel', 'touchstart']) {
    addEventListener(ev, finish, { once: true, passive: true });
  }

  const frame = (now: number) => {
    if (done) return;
    if (t0 < 0) { t0 = now; last = now; }
    const t = now - t0;
    const dt = Math.min(50, now - last);
    last = now;
    if (t >= SWARM && !overlay.classList.contains('build')) {
      overlay.classList.add('build');
      status.textContent = `layout pass — ${targets.length} nodes`;
    }
    for (const b of bots) {
      const job = b.job!;
      if (t < job.at) {
        // Flocking: chase a point on this bot's own ring around the core, with lag.
        const o = b.orbit;
        const a = o.a + o.w * t;
        const wob = Math.sin(t * 0.006 + o.a * 3) * 10;
        // The whole flock wanders a little, so it reads as a group, not a ring.
        const fx = cx + Math.sin(t * 0.0021) * 70;
        const fy = cy + Math.cos(t * 0.0017) * 40;
        const tx = fx + Math.cos(a) * (o.r + wob);
        const ty = fy + Math.sin(a) * (o.r + wob) * o.squash;
        const k = 1 - Math.exp(-dt / 150);
        b.x += (tx - b.x) * k;
        b.y += (ty - b.y) * k;
      } else if (job.kind === 'box') {
        job.from ??= [b.x, b.y];
        const p = clamp01((t - job.at) / TRAVEL);
        const q = clamp01((t - job.at - TRAVEL) / DRAG);
        const { left, top, width, height } = job.r;
        if (q === 0) {
          const e = easeInOut(p);
          b.x = job.from[0] + (left - job.from[0]) * e;
          b.y = job.from[1] + (top - job.from[1]) * e;
        } else {
          if (!job.box) {
            job.box = box(job.r, job.label, 'fx-box', { x: 0, y: 0 });
            overlay.insertBefore(job.box, core);
          }
          const e = easeInOut(q);
          b.x = left + width * e;
          b.y = top + height * e;
          job.box.style.width = `${width * e}px`;
          job.box.style.height = `${height * e}px`;
          if (q === 1) job.box.classList.add('done');
        }
      } else {
        job.from ??= [b.x, b.y];
        const e = easeInOut(clamp01((t - job.at) / 520));
        b.x = job.from[0] + (job.to[0] - job.from[0]) * e;
        b.y = job.from[1] + (job.to[1] - job.from[1]) * e;
        if (e === 1 && !job.placed) {
          job.placed = true;
          const m = document.createElement('i');
          m.className = 'fx-plus';
          m.style.left = `${job.to[0]}px`;
          m.style.top = `${job.to[1]}px`;
          overlay.insertBefore(m, core);
          b.el.classList.add('gone');
        }
      }
      b.el.style.transform = `translate3d(${b.x.toFixed(1)}px, ${b.y.toFixed(1)}px, 0)`;
    }
    if (t >= END) return finish();
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

function annotate(): void {
  if (!('IntersectionObserver' in window)) return;
  const heads = Array.from(document.querySelectorAll<HTMLElement>('.section h2[data-fx-label]'));
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        io.unobserve(e.target);
        const el = e.target as HTMLElement;
        const r = el.getBoundingClientRect();
        const b = box(r, el.dataset.fxLabel ?? 'h2', 'fx-layer fx-anno', { x: r.left, y: r.top });
        b.setAttribute('aria-hidden', 'true');
        b.style.left = '0';
        b.style.top = '0';
        el.append(b);
        b.addEventListener('animationend', (ev) => {
          if (ev.animationName === 'fx-anno-out') b.remove();
        });
      }
    },
    { rootMargin: '0px 0px -25% 0px', threshold: 1 },
  );
  heads.forEach((h) => io.observe(h));
}

type Cursor = {
  el: HTMLElement;
  slot: number; // index into a LABELS entry, or -1 for an unnamed cursor
  region: string;
  w: number; // footprint width: arrow plus name tag
  x: number; y: number; // page coordinates, so cursors scroll with the content
  from: [number, number]; to: [number, number]; bend: [number, number];
  t0: number; dur: number; rest: number;
};

const CURSORS = [
  { named: true, color: 'var(--cyan)' },
  { named: true, color: '#ffd23f' },
  { named: true, color: '#b48cff' },
  { named: false, color: '#ff8ad8' },
  { named: false, color: '#7dffb2' },
];

// What the named cursors are called depends on the part of the page they are
// in, so the cast changes as you scroll. One name per named cursor, in order.
const LABELS: Record<string, [string, string, string]> = {
  hero: ['deploy', 'review', 'on-call'],
  work: ['go test -fuzz', 'code review', 'release'],
  experience: ['helm upgrade', 'jenkins', 'vault'],
  stack: ['kubectl', 'spring boot', 'swiftui'],
  writing: ['fsync', 'crc32c', 'reader'],
  about: ['tinkering', 'stdlib only', 'camera'],
  contact: ['recruiter', 'hiring manager', 'say hi'],
};
const LONGEST = Math.max(...Object.values(LABELS).flat().map((l) => l.length));

function regionAt(pageY: number): string {
  const y = pageY - scrollY;
  for (const el of document.querySelectorAll<HTMLElement>('.hero, main > section[id]')) {
    const r = el.getBoundingClientRect();
    if (y >= r.top && y < r.bottom) return el.id || 'hero';
  }
  return 'hero';
}

// Where a cursor may rest: just past the end of a heading or title, or just
// under a block's bottom edge, pointing at it. Never on top of text.
const BESIDE = '.section h2, .work-title, .post-title, .email, .hero h1 span, .employer h3, .role h4';
const BELOW = '.hero .btn, .stat, .term, .shot, .chips li';
// Anything a resting cursor must not cover.
const TEXT = 'main p, main li, main h2, main h3, main h4, main a, main img, main dd, main dt, .hero p, .hero h1, .hero a, .hero pre, .hero dd, .hero dt, .topbar';

const FOOT_H = 24;
const GAP = 140; // keep resting cursors at least this far apart

type Rect = { l: number; t: number; r: number; b: number };
const hits = (a: Rect, b: Rect) => a.l < b.r && a.r > b.l && a.t < b.b && a.b > b.t;

function spots(): [number, number][] {
  const sx = scrollX;
  const sy = scrollY;
  const out: [number, number][] = [];
  const inView = (r: DOMRect) => r.width > 0 && r.top > 60 && r.bottom < innerHeight - 80;
  for (const el of document.querySelectorAll<HTMLElement>(BESIDE)) {
    const r = el.getBoundingClientRect();
    if (inView(r)) out.push([r.right + 10 + sx, r.top + r.height * 0.45 + sy]);
  }
  for (const el of document.querySelectorAll<HTMLElement>(BELOW)) {
    const r = el.getBoundingClientRect();
    if (inView(r)) out.push([r.left + r.width * (0.3 + Math.random() * 0.4) + sx, r.bottom + 6 + sy]);
  }
  // The side gutters on wide screens are always free.
  const main = document.querySelector('main .section')?.getBoundingClientRect();
  if (main) {
    const pad = 24;
    for (const [lo, hi] of [[pad, main.left - 90], [main.right + pad, innerWidth - 90]]) {
      if (hi - lo > 20) out.push([lo + Math.random() * (hi - lo) + sx, 120 + Math.random() * (innerHeight - 240) + sy]);
    }
  }
  return out;
}

function pickSpot(self: Cursor, all: Cursor[]): [number, number] | null {
  const sx = scrollX;
  const sy = scrollY;
  const text: Rect[] = [];
  for (const el of document.querySelectorAll<HTMLElement>(TEXT)) {
    const r = el.getBoundingClientRect();
    if (r.width > 0 && r.bottom > 0 && r.top < innerHeight) text.push({ l: r.left + sx, t: r.top + sy, r: r.right + sx, b: r.bottom + sy });
  }
  const docH = document.documentElement.scrollHeight;
  const ok = spots().filter(([x, y]) => {
    const foot = { l: x - 2, t: y - 2, r: x + self.w, b: y + FOOT_H };
    if (foot.r > sx + innerWidth - 8 || foot.b > docH - 8) return false;
    if (text.some((t) => hits(foot, t))) return false;
    return all.every((o) => o === self || Math.hypot(o.to[0] - x, o.to[1] - y) > GAP);
  });
  return ok.length ? ok[Math.floor(Math.random() * ok.length)] : null;
}

function cursors(): void {
  if (!matchMedia('(pointer: fine)').matches || innerWidth < 900) return;
  const layer = document.createElement('div');
  layer.className = 'fx-layer fx-cursors';
  layer.setAttribute('aria-hidden', 'true');
  document.body.append(layer);

  const now = performance.now();
  const list: Cursor[] = CURSORS.map((c, i) => {
    const el = document.createElement('div');
    el.className = 'fx-cursor';
    el.style.setProperty('--c', c.color);
    el.innerHTML = `<svg width="16" height="18" viewBox="0 0 16 18"><path d="M1 1l13 7.2-5.8 1.4L5.4 16z" fill="var(--c)" stroke="#000" stroke-width="1.2" stroke-linejoin="round"/></svg>${c.named ? '<span></span>' : ''}`;
    layer.append(el);
    // Start just off the right edge; each one walks in on its first move.
    const p: [number, number] = [scrollX + innerWidth + 30, scrollY + innerHeight * (0.2 + i * 0.15)];
    // Footprint is sized for the longest name any section uses, so a rename never lands on text.
    return { el, slot: c.named ? i : -1, region: '', w: c.named ? 16 + LONGEST * 6.6 + 16 : 18, x: p[0], y: p[1], from: p, to: p, bend: [0, 0], t0: now, dur: 1, rest: 300 + i * 700 };
  });
  const rename = (c: Cursor, region: string) => {
    if (c.slot < 0 || c.region === region) return;
    c.region = region;
    const span = c.el.querySelector('span')!;
    span.textContent = (LABELS[region] ?? LABELS.hero)[c.slot];
    span.classList.remove('swap');
    void span.offsetWidth; // restart the swap animation
    span.classList.add('swap');
    c.el.dataset.region = region;
  };
  for (const c of list) rename(c, 'hero');

  // A cursor resting near the visitor's own pointer gets out of the way.
  let mouse: [number, number] = [-1e4, -1e4];
  addEventListener('pointermove', (e) => { mouse = [e.pageX, e.pageY]; }, { passive: true });

  let running = false;
  const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const frame = (t: number) => {
    for (const c of list) {
      const p = Math.min(1, (t - c.t0) / c.dur);
      const resting = p >= 1;
      const crowded = resting && Math.hypot(mouse[0] - c.x, mouse[1] - c.y) < 90;
      // Left behind by a scroll: catch up soon rather than after the full rest.
      const behind = resting && (c.y < scrollY || c.y > scrollY + innerHeight) && t - c.t0 > c.dur + 1200;
      if (resting && (crowded || behind || t - c.t0 > c.dur + c.rest)) {
        const to = pickSpot(c, list);
        if (!to) { c.rest += 600; continue; }
        // A cursor left far off-screen re-enters from the nearest edge instead of crossing the page.
        const top = scrollY - 30;
        const bottom = scrollY + innerHeight + 30;
        c.from = [c.x, Math.min(bottom, Math.max(top, c.y))];
        c.to = to;
        const dx = to[0] - c.from[0];
        const dy = to[1] - c.from[1];
        const k = (Math.random() - 0.5) * 0.4;
        c.bend = [-dy * k, dx * k];
        c.t0 = t;
        c.dur = Math.min(1800, 700 + Math.hypot(dx, dy) * 1.4);
        c.rest = 1800 + Math.random() * 3200;
        c.el.dataset.state = 'move';
        rename(c, regionAt(to[1]));
        continue;
      }
      const e = ease(p);
      // Quadratic curve through a bent midpoint, so paths arc like a hand on a trackpad.
      const mx = (c.from[0] + c.to[0]) / 2 + c.bend[0];
      const my = (c.from[1] + c.to[1]) / 2 + c.bend[1];
      c.x = (1 - e) * (1 - e) * c.from[0] + 2 * (1 - e) * e * mx + e * e * c.to[0];
      c.y = (1 - e) * (1 - e) * c.from[1] + 2 * (1 - e) * e * my + e * e * c.to[1];
      c.el.style.transform = `translate3d(${c.x.toFixed(1)}px, ${c.y.toFixed(1)}px, 0)`;
      if (resting) c.el.dataset.state = 'rest';
    }
    running = !document.hidden;
    if (running) requestAnimationFrame(frame);
  };
  const start = () => {
    if (running || document.hidden) return;
    running = true;
    requestAnimationFrame(frame);
  };
  start();
  document.addEventListener('visibilitychange', start);
}

export function initFx(): void {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  annotate();
  boot(cursors);
}
