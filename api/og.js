import { ImageResponse } from '@vercel/og';
import { createClient } from '@sanity/client';

export const config = {
  runtime: 'edge', // required by Vercel for OG image generation
};

const sanity = createClient({
  projectId: 'ulu3s1tc',
  dataset: 'production',
  useCdn: true,
  apiVersion: '2023-08-03',
});

export default async function handler(req) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get('slug');

  if (!slug) {
    return new Response('Missing slug', { status: 400 });
  }

  const event = await sanity.fetch(
    `*[_type == "event" && slug.current == $slug][0]{ title, defaultCoverImage }`,
    { slug }
  );

  const title = event?.title || slug;
  const imageUrl = event?.defaultCoverImage?.asset
    ? `https://cdn.sanity.io/images/ulu3s1tc/production/${event.defaultCoverImage.asset._ref
        .replace('image-', '')
        .replace('-jpg', '.jpg')}`
    : 'https://photos.manchestergents.com/default-og.png';

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          background: '#1c2837',
          color: '#ffd460',
          width: '100%',
          height: '100%',
          fontSize: 48,
          padding: '40px',
        }}
      >
        <img
          src={imageUrl}
          width={800}
          style={{ borderRadius: '24px', objectFit: 'cover' }}
        />
        <div style={{ marginTop: '2rem' }}>{title}</div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
