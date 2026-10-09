// Last-push date and star count for each project, fetched once per build so the
// Work list shows real activity; a daily scheduled deploy keeps it current. When
// GitHub can't be reached (offline build, rate limit, outage) a row simply omits
// the line rather than failing the build.
export type Activity = { pushedAt: Date; stars: number };

const repoPath = (href: string) => href.match(/^https:\/\/github\.com\/([^/]+\/[^/]+?)\/?$/)?.[1];

async function fetchActivity(href: string): Promise<Activity | null> {
  const path = repoPath(href);
  if (!path || process.env.GITHUB_ACTIVITY === 'off') return null;
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'achyuta0001.github.io-build',
  };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  try {
    const res = await fetch(`https://api.github.com/repos/${path}`, { headers, signal: AbortSignal.timeout(5000) });
    if (!res.ok) {
      console.warn(`[github] ${path}: HTTP ${res.status}; omitting activity`);
      return null;
    }
    const repo = await res.json();
    const pushedAt = new Date(repo.pushed_at);
    if (Number.isNaN(pushedAt.getTime())) return null;
    return { pushedAt, stars: Number(repo.stargazers_count) || 0 };
  } catch (err) {
    console.warn(`[github] ${path}: ${err}; omitting activity`);
    return null;
  }
}

export const activityFor = (hrefs: string[]) => Promise.all(hrefs.map(fetchActivity));

// "updated 4 Oct", with the year added once it is no longer the current one.
// Month names are spelled out here because en-GB now abbreviates September as "Sept".
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function formatUpdated(d: Date, now = new Date()): string {
  const parts = (x: Date) => {
    const p = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'numeric', year: 'numeric', timeZone: 'Asia/Kolkata' })
      .formatToParts(x);
    const get = (t: string) => Number(p.find((q) => q.type === t)!.value);
    return { day: get('day'), month: get('month'), year: get('year') };
  };
  const a = parts(d);
  const year = a.year === parts(now).year ? '' : ` ${a.year}`;
  return `updated ${a.day} ${MONTHS[a.month - 1]}${year}`;
}
