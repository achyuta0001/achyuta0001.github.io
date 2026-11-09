// The annotation layer: a cursor swarm that wireframes the hero on first load, and
// design-tool selection boxes on section headings as they scroll in. Everything here is decoration: aria-hidden, pointer-events: none,
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

export function initFx(): void {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  annotate();
  boot(() => {});
}
