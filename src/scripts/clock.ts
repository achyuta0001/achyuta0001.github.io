const fmt = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Kolkata',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

export function formatIST(d: Date): string {
  return fmt.format(d);
}

export function startClock(el: HTMLTimeElement, yearEl: HTMLElement | null): void {
  const tick = () => {
    const now = new Date();
    el.textContent = `${formatIST(now)} IST`;
    el.dateTime = now.toISOString();
    if (yearEl) yearEl.textContent = String(now.getFullYear());
    setTimeout(tick, 60_000 - (Date.now() % 60_000));
  };
  tick();
}
