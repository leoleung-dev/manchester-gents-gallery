import { createClient } from '@sanity/client';

const sanity = createClient({
  projectId: 'ulu3s1tc',
  dataset: 'production',
  apiVersion: '2023-08-03',
  useCdn: true,
});

export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get('slug');
  if (!slug) return new Response('Missing slug', { status: 400 });

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

  const pageUrl = `https://photos.manchestergents.com/event/${slug}`;

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta property="og:title" content="MG | ${title}" />
      <meta property="og:description" content="Manchester Gents Gallery | View photos from ${title}" />
      <meta property="og:image" content="${imageUrl}" />
      <meta property="og:type" content="website" />
      <meta property="og:url" content="${pageUrl}" />
      <title>${title}</title>
    </head>
    <body>
      <script>location.href = "${pageUrl}"</script>
    </body>
    </html>
  `;

  return new Response(html, {
    headers: { 'Content-Type': 'text/html' },
  });
}
