import { createClient } from '@sanity/client';

const sanity = createClient({
  projectId: 'ulu3s1tc',
  dataset: 'production',
  useCdn: true,
  apiVersion: '2023-08-03',
});

export default async function handler(req, res) {
  const { slug } = req.query;

  if (!slug) {
    return res.status(400).json({ error: 'Missing slug' });
  }

  try {
    const event = await sanity.fetch(
      `*[_type == "event" && slug.current == $slug][0]{ title, defaultCoverImage }`,
      { slug }
    );

    const imageUrl = event?.defaultCoverImage?.asset
      ? `https://cdn.sanity.io/images/ulu3s1tc/production/${event.defaultCoverImage.asset._ref
          .replace('image-', '')
          .replace('-jpg', '.jpg')}`
      : 'https://photos.manchestergents.com/default-og.png';

    res.status(200).json({
      title: event?.title || slug,
      imageUrl,
    });
  } catch (err) {
    console.error('OG meta fetch failed:', err);
    res.status(500).json({ error: 'Failed to fetch OG metadata' });
  }
}
