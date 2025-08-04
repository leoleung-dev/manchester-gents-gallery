export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get('slug');

  const ogImageUrl = `https://photos.manchestergents.com/api/og?slug=${slug}`;
  const pageUrl = `https://photos.manchestergents.com/event/${slug}`;
  const title = `MG | ${slug}`;
  const description = `Manchester Gents Gallery | View photos from ${slug}`;

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta property="og:title" content="${title}" />
      <meta property="og:description" content="${description}" />
      <meta property="og:image" content="${ogImageUrl}" />
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
