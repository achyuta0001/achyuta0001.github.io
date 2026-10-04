export type ThemePref = 'system' | 'light' | 'dark';

const KEY = 'theme';
const ORDER: ThemePref[] = ['system', 'light', 'dark'];

export function getTheme(): ThemePref {
  try {
    const t = localStorage.getItem(KEY);
    return t === 'light' || t === 'dark' ? t : 'system';
  } catch {
    return 'system';
  }
}

export function setTheme(t: ThemePref): void {
  const root = document.documentElement;
  try {
    if (t === 'system') localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, t);
  } catch {
    // storage blocked: still apply for this page view
  }
  if (t === 'system') delete root.dataset.theme;
  else root.dataset.theme = t;
  document.dispatchEvent(new CustomEvent<ThemePref>('theme:change', { detail: t }));
}

export function cycleTheme(): ThemePref {
  const next = ORDER[(ORDER.indexOf(getTheme()) + 1) % ORDER.length];
  setTheme(next);
  return next;
}

export function initThemeButton(btn: HTMLButtonElement): void {
  const render = () => {
    const t = getTheme();
    btn.textContent = `Theme: ${t}`;
    btn.setAttribute('aria-label', `Theme: ${t}. Activate to change.`);
  };
  render();
  btn.hidden = false;
  btn.addEventListener('click', () => cycleTheme());
  document.addEventListener('theme:change', render);
}
