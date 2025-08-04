import { ImageResponse } from '@vercel/og';

export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get('slug');
  if (!slug) return new Response('Missing slug', { status: 400 });

  const metaRes = await fetch(`https://photos.manchestergents.com/api/og-meta?slug=${slug}`);
  if (!metaRes.ok) return new Response('Failed to load OG meta', { status: 500 });

  const { title, imageUrl } = await metaRes.json();

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
