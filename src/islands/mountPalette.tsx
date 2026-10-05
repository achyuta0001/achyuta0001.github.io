import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import CommandPalette from './CommandPalette';
import { sections, links, projects, profile } from '../data/site';

const host = document.createElement('div');
document.body.append(host);
createRoot(host).render(
  createElement(CommandPalette, {
    email: profile.email,
    sections,
    links: [links.github, links.linkedin, links.resume, links.photography],
    projects: projects.map((p) => ({ title: p.title, href: p.href })),
  }),
);
