import { Command } from 'cmdk';
import { useEffect, useRef, useState } from 'react';
import { cycleTheme } from '../scripts/theme';
import '../styles/palette.css';

declare global {
  interface Window { __paletteWanted?: boolean; __paletteReady?: boolean }
}

type Item = { label: string; href: string };
type Props = {
  email: string;
  sections: { id: string; label: string }[];
  links: Item[];
  projects: { title: string; href: string }[];
};

export default function CommandPalette({ email, sections, links, projects }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const returnTo = useRef<HTMLElement | null>(null);
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState('');

  useEffect(() => {
    const onOpen = () => {
      if (dialogRef.current?.open) return;
      returnTo.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      setStatus('');
      setOpen(true);
    };
    document.addEventListener('palette:open', onOpen);
    window.__paletteReady = true;
    if (window.__paletteWanted) {
      window.__paletteWanted = false;
      onOpen();
    }
    return () => {
      document.removeEventListener('palette:open', onOpen);
      window.__paletteReady = false;
    };
  }, []);

  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    if (open && !d.open) {
      d.showModal();
      // The input mounts before the dialog is shown, so autoFocus is a no-op; focus explicitly.
      d.querySelector<HTMLInputElement>('[cmdk-input]')?.focus();
    }
    if (!open && d.open) d.close();
  }, [open]);

  const onClose = () => {
    setOpen(false);
    const el = returnTo.current;
    returnTo.current = null;
    el?.focus();
  };

  const go = (id: string) => {
    const el = document.getElementById(id);
    returnTo.current = el;
    setOpen(false);
    if (!el) return;
    el.classList.add('in');
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    history.replaceState(null, '', `#${id}`);
    el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  };

  const openLink = (href: string) => {
    setOpen(false);
    window.open(href, href.startsWith('http') ? '_blank' : '_self', 'noopener');
  };

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(email);
      setStatus('Copied');
    } catch {
      setStatus(`Couldn’t copy — ${email}`);
    }
  };

  return (
    <dialog
      ref={dialogRef}
      className="palette"
      aria-label="Command palette"
      onClose={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) setOpen(false);
      }}
    >
      {open && (
        <Command label="Command palette" loop>
          <Command.Input placeholder="Type a command or search…" autoFocus />
          <Command.List>
            <Command.Empty>No results.</Command.Empty>
            <Command.Group heading="Navigate">
              {sections.map((s) => (
                <Command.Item key={s.id} onSelect={() => go(s.id)}>{s.label}</Command.Item>
              ))}
            </Command.Group>
            <Command.Group heading="Actions">
              <Command.Item onSelect={copyEmail}>Copy email</Command.Item>
              <Command.Item onSelect={() => setStatus(`Theme: ${cycleTheme()}`)}>Toggle theme</Command.Item>
            </Command.Group>
            <Command.Group heading="Links">
              {links.map((l) => (
                <Command.Item key={l.href} onSelect={() => openLink(l.href)}>{l.label}</Command.Item>
              ))}
            </Command.Group>
            <Command.Group heading="Projects">
              {projects.map((p) => (
                <Command.Item key={p.href} value={`project ${p.title}`} onSelect={() => openLink(p.href)}>
                  {p.title}
                </Command.Item>
              ))}
            </Command.Group>
          </Command.List>
        </Command>
      )}
      <div className="palette-foot mono">
        <span role="status" aria-live="polite">{status}</span>
        <span aria-hidden="true">Esc to close</span>
      </div>
    </dialog>
  );
}
