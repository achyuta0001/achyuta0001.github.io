function safeDecode(s: string): string {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

export function initReveal(): void {
  const els = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'));
  const reveal = (el: Element) => el.classList.add('in');
  const revealHash = () => {
    const id = safeDecode(location.hash.slice(1));
    const t = id ? document.getElementById(id) : null;
    if (t) reveal(t);
  };
  revealHash();
  window.addEventListener('hashchange', revealHash);
  if (!('IntersectionObserver' in window)) {
    els.forEach(reveal);
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          reveal(e.target);
          io.unobserve(e.target);
        }
      }
    },
    { rootMargin: '0px 0px -10% 0px' },
  );
  els.forEach((el) => io.observe(el));
}
