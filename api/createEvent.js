// /api/createEvent.js
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

  const { title, slug } = req.body;

  if (!title || !slug) {
    return res.status(400).json({ error: 'Missing title or slug' });
  }

  try {
    const result = await client.create({
      _type: 'event',
      title,
      slug: { current: slug },
    });

    res.status(200).json({ success: true, event: result });
  } catch (err) {
    console.error('[createEvent] Sanity create failed:', err);
    res.status(500).json({ error: 'Failed to create event in Sanity' });
  }
}
