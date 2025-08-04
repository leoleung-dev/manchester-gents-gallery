import fs from 'fs';
import path from 'path';
import { createClient } from '@sanity/client';
import setCorsHeaders from '../src/lib/setCorsHeaders.js';

const client = createClient({
  projectId: process.env.SANITY_PROJECT_ID,
  dataset: process.env.SANITY_DATASET,
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
  apiVersion: '2023-08-03',
});

export default async function handler(req, res) {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const events = await client.fetch(
      `*[_type == "event"]{title, "slug": slug.current}`
    );

    for (const event of events) {
      if (!event.slug) continue;

      const dirPath = path.join(process.cwd(), 'dist', 'event', event.slug);
      const filePath = path.join(dirPath, 'index.html');

      const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Manchester Gents | ${event.title}</title>
    <meta property="og:title" content="Manchester Gents | View photos from: ${event.title}" />
    <meta property="og:description" content="See all the best shots from ${event.title}!" />
    <meta property="og:image" content="https://mg-og-generator.vercel.app/api/og?slug=${event.slug}" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="https://photos.manchestergents.com/event/${event.slug}" />
    <meta name="twitter:card" content="summary_large_image" />
    <script>window.location.replace("/event/${event.slug}");</script>
  </head>
  <body></body>
</html>`;

      fs.mkdirSync(dirPath, { recursive: true });
      fs.writeFileSync(filePath, html, 'utf8');
    }

    res.status(200).json({ success: true, count: events.length });
  } catch (err) {
    console.error('[generateOgHtml] Failed:', err);
    res.status(500).json({ error: 'Failed to generate OG HTML' });
  }
}
