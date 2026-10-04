export function initTabs(root: HTMLElement): void {
  const panelsWrap = root.querySelector<HTMLElement>('[data-tab-panels]');
  const panels = Array.from(root.querySelectorAll<HTMLElement>('[data-tab-panel]'));
  if (!panelsWrap || panels.length === 0) return;

  const list = document.createElement('div');
  list.className = 'tablist';
  list.setAttribute('role', 'tablist');
  list.setAttribute('aria-label', 'Stack groups');
  const indicator = document.createElement('span');
  indicator.className = 'tab-indicator';
  indicator.setAttribute('aria-hidden', 'true');

  const tabs = panels.map((panel) => {
    const heading = panel.querySelector('h3');
    const label = heading?.textContent?.trim() ?? panel.id;
    heading?.classList.add('visually-hidden');
    const tab = document.createElement('button');
    tab.type = 'button';
    tab.id = `${panel.id}-tab`;
    tab.className = 'tab mono';
    tab.textContent = label;
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-controls', panel.id);
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('aria-labelledby', tab.id);
    panel.tabIndex = 0;
    list.append(tab);
    return tab;
  });
  list.append(indicator);
  root.insertBefore(list, panelsWrap);
  root.classList.add('tabs-ready');

  let current = 0;
  const place = () => {
    const t = tabs[current];
    indicator.style.width = `${t.offsetWidth}px`;
    indicator.style.transform = `translateX(${t.offsetLeft}px)`;
  };
  const select = (i: number, focus = false) => {
    current = i;
    tabs.forEach((t, j) => {
      const on = j === i;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      panels[j].classList.toggle('is-active', on);
    });
    place();
    if (focus) tabs[i].focus();
  };

  tabs.forEach((t, i) => t.addEventListener('click', () => select(i)));
  list.addEventListener('keydown', (e) => {
    const i = tabs.indexOf(document.activeElement as HTMLButtonElement);
    if (i < 0) return;
    const last = tabs.length - 1;
    const next =
      e.key === 'ArrowRight' ? (i === last ? 0 : i + 1)
      : e.key === 'ArrowLeft' ? (i === 0 ? last : i - 1)
      : e.key === 'Home' ? 0
      : e.key === 'End' ? last
      : -1;
    if (next < 0) return;
    e.preventDefault();
    select(next, true);
  });
  window.addEventListener('resize', place);
  select(0);
}
