import type { ImageMetadata } from 'astro';
import tripwyreShot from '../assets/work/tripwyre.png';
import ashlarShot from '../assets/work/ashlar.png';

export type Link = { label: string; href: string };
export type Project = {
  title: string;
  pitch: string;
  tags: string[];
  year: number;
  href: string;
  extra: Link[];
  image?: { src: ImageMetadata; alt: string };
};
export type Role = { title: string; team: string; period: string; stack: string; bullets: string[] };
export type StackGroup = { name: string; items: string[] };
export type Section = {
  id: 'work' | 'experience' | 'stack' | 'writing' | 'about' | 'contact';
  label: string;
};

const GH = 'https://github.com/achyuta0001';

export const links = {
  github: { label: 'GitHub', href: GH },
  linkedin: { label: 'LinkedIn', href: 'https://linkedin.com/in/achyuta-k-upadya' },
  resume: { label: 'Resume', href: '/resume.pdf' },
  photography: { label: 'Photography', href: 'https://achyuta0001.github.io/photography-portfolio/' },
} satisfies Record<string, Link>;

export const profile = {
  name: 'Achyuta K Upadya',
  role: 'Full-stack & platform engineer',
  location: 'Bengaluru',
  tagline:
    'I work on the unglamorous half of shipping — getting services from a laptop to production and keeping them there.',
  email: 'achyuta0001@gmail.com',
  about: [
    'Outside work I build small, dependency-light tools in Go, Python and Swift — usually to understand a system by rebuilding the part of it I don’t understand yet.',
    'ashlar started as a question about the storage engine underneath Kafka: what actually happens to a log when the machine dies mid-write. hive and obsidian-mcp came from wanting AI agents to keep the context my projects already have.',
    'I keep them small on purpose: standard library first, no backend unless it earns one, and tests that try to break the thing — ashlar’s fuzz test cuts the log at a random byte and checks what survives.',
  ],
  photography: { label: 'Away from the keyboard I shoot product photography.', href: links.photography.href },
};

export const meta = {
  title: 'Achyuta K Upadya — Full-stack & platform engineer',
  description: profile.tagline,
  url: 'https://achyuta0001.github.io/',
};

export const sections: Section[] = [
  { id: 'work', label: 'Work' },
  { id: 'experience', label: 'Experience' },
  { id: 'stack', label: 'Stack' },
  { id: 'writing', label: 'Writing' },
  { id: 'about', label: 'About' },
  { id: 'contact', label: 'Contact' },
];

export const projects: Project[] = [
  {
    title: 'Goo',
    pitch:
      'A voice assistant for the Mac that lives in the notch. Ask about anything on your screen; Goo answers out loud and points at it.',
    tags: ['Swift', 'macOS'],
    year: 2026,
    href: `${GH}/Goo`,
    extra: [{ label: 'Releases', href: `${GH}/goo-releases/releases` }],
  },
  {
    title: 'ashlar',
    pitch:
      'Embeddable append-only commit log — segmented files, CRC-checked records, O(1) offset reads, crash recovery that truncates only an incomplete tail. Standard library only.',
    tags: ['Go'],
    year: 2026,
    href: `${GH}/ashlar`,
    extra: [],
    image: {
      src: ashlarShot,
      alt: 'Terminal session: four records are appended to an ashlar log, the store file is truncated mid-record to simulate a crash, and on reopening the three intact records survive and the next append reuses offset 3.',
    },
  },
  {
    title: 'tripwyre',
    pitch:
      'Project intelligence CLI — scans dependencies, config drift and logs into one prioritised report. Offline by default; ships as a GitHub Action.',
    tags: ['Go', 'CLI'],
    year: 2026,
    href: `${GH}/tripwyre`,
    extra: [],
    image: {
      src: tripwyreShot,
      alt: 'Terminal output of tripwyre scan on a sample project: 13 findings, led by critical CVEs in lodash, qs, path-to-regexp and body-parser, then config drift in DB_POOL_SIZE and an error spike of 87 payment-gateway timeouts in the logs.',
    },
  },
  {
    title: 'hive',
    pitch:
      'Source-agnostic knowledge compiler — ingests Markdown, Notion and Confluence, clusters by embeddings, synthesises merged wiki pages, serves them to AI agents over MCP.',
    tags: ['Python', 'MCP'],
    year: 2026,
    href: `${GH}/hive`,
    extra: [],
  },
  {
    title: 'blister',
    pitch:
      'Native iOS 1:64 die-cast collection tracker — SwiftUI + SwiftData, on-device Vision OCR, RealityKit 3D studio. No backend, no third-party dependencies.',
    tags: ['Swift', 'iOS'],
    year: 2026,
    href: `${GH}/blister`,
    extra: [],
  },
  {
    title: 'obsidian-mcp',
    pitch:
      'MCP server giving AI agents a per-project notes folder inside one Obsidian vault — six tools, git-based project inference, non-clobbering writes.',
    tags: ['TypeScript', 'MCP'],
    year: 2026,
    href: `${GH}/obsidian-mcp`,
    extra: [],
  },
];

export const employer = {
  name: 'HSBC Software Development',
  location: 'Bengaluru',
  period: 'Jul 2024 – present',
  roles: [
    {
      title: 'Software Engineer',
      team: 'Unified Case Management',
      period: 'Jan 2025 – present',
      stack: 'Java · Spring Boot · Kubernetes · Helm · Jenkins · NGINX Plus · HashiCorp Vault',
      bullets: [
        'Sole DevOps engineer for a 40+ microservice compliance team — pipelines, Kubernetes deployments, secret management, ingress.',
        'Built a Spring Boot proxy for JWT authentication and request routing to an external cloud-native system — designed, built and shipped in ~4 weeks.',
        'Led three platform-wide migrations: CloudBees → open-source Jenkins (40+ services), Helm and Kubernetes onboarding (42 services), NGINX → NGINX Plus (42 services).',
      ],
    },
    {
      title: 'Software Engineer',
      team: 'goAML Compliance Platform',
      period: 'Jul 2024 – Jan 2025',
      stack: 'Java · Spring Boot · React · GCP Cloud SQL · Liquibase',
      bullets: [
        'Designed and built the Disclosure Service in Spring Boot from scratch, replacing a 2018-era UK legacy system.',
        'Sole owner of PostgreSQL schema management on GCP Cloud SQL — every change shipped as a Liquibase migration.',
      ],
    },
  ] satisfies Role[],
};

export const stack: StackGroup[] = [
  { name: 'Languages', items: ['Java', 'Go', 'Python', 'TypeScript / JavaScript', 'Swift'] },
  { name: 'Backend', items: ['Spring Boot', 'FastAPI', 'Apache Kafka', 'JWT / OAuth2'] },
  { name: 'Frontend', items: ['React', 'SwiftUI / SwiftData'] },
  { name: 'Infra', items: ['Kubernetes', 'Helm', 'Docker', 'Jenkins', 'NGINX Plus', 'HashiCorp Vault', 'GCP'] },
  { name: 'Data', items: ['PostgreSQL', 'GCP Cloud SQL', 'Liquibase', 'Amazon S3'] },
];
