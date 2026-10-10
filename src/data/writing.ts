import { getCollection } from 'astro:content';

// Published posts, newest first. Drafts show in `astro dev` only.
export async function getPosts() {
  const posts = await getCollection('writing', (p) => import.meta.env.DEV || !p.data.draft);
  return posts.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

export const postDate = (d: Date) =>
  new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(d);
