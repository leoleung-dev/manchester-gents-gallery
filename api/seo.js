import { createClient } from '@sanity/client';
import imageUrlBuilder from '@sanity/image-url';

const sanity = createClient({
  projectId: 'ulu3s1tc',
  dataset: 'production',
  apiVersion: '2023-08-03',
  useCdn: true,
});

const builder = imageUrlBuilder(sanity);

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
    ? builder.image(event.defaultCoverImage).width(1200).height(630).fit('crop').auto('format').url()
    : 'https://photos.manchestergents.com/default-og.png';

  const pageUrl = `https://photos.manchestergents.com/event/${slug}`;

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <!-- ✅ HIT SEO API -->
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta property="og:title" content="MG | ${title}" />
      <meta property="og:description" content="Manchester Gents Gallery | View photos from ${title}" />
      <meta property="og:image" content="${imageUrl}" />
      <meta property="og:type" content="website" />
      <meta property="og:url" content="${pageUrl}" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="MG | ${title}" />
      <meta name="twitter:description" content="Manchester Gents Gallery | View photos from ${title}" />
      <meta name="twitter:image" content="${imageUrl}" />
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
