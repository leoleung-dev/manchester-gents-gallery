// generate-og-html.js
import fs from 'fs';
import path from 'path';
import { createClient } from '@sanity/client';

const client = createClient({
  projectId: 'ulu3s1tc',
  dataset: 'production',
  apiVersion: '2023-08-03',
  useCdn: true,
});

async function run() {
  const events = await client.fetch(`
    *[_type == "event"]{
      title,
      "slug": slug.current
    }
  `);

  for (const event of events) {
    if (!event.slug) continue;

    const dirPath = path.join('dist', 'event', event.slug);
    const filePath = path.join(dirPath, 'index.html');

    const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Manchester Gents | ${event.title}</title>

    <!-- Open Graph Meta Tags -->
    <meta property="og:title" content="Manchester Gents | View photos from: ${event.title}" />
    <meta property="og:description" content="See all the best shots from ${event.title}!" />
    <meta property="og:image" content="https://mg-og-generator.vercel.app/api/og?slug=${event.slug}" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="https://photos.manchestergents.com/event/${event.slug}" />

    <!-- Twitter Card Meta Tags -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="Manchester Gents | View photos from: ${event.title}" />
    <meta name="twitter:description" content="See all the best shots from ${event.title}!" />
    <meta name="twitter:image" content="https://mg-og-generator.vercel.app/api/og?slug=${event.slug}" />
  </head>
  <body></body>
</html>`;

    fs.mkdirSync(dirPath, { recursive: true });
    fs.writeFileSync(filePath, html, 'utf-8');
    console.log(`✅ Wrote ${filePath}`);
  }
}

run().catch((err) => {
  console.error('❌ Failed to generate OG HTML:', err);
});