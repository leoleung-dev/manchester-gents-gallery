const API_VERSION = "2023-08-03";
const DEFAULT_SANITY_PROJECT_ID = "ulu3s1tc";
const DEFAULT_SANITY_DATASET = "production";
const COVER_INDEX_PATH = "/event-cover-index.json";
const COVER_INDEX_TTL_MS = 5 * 60 * 1000;

const SITE_URL = process.env.SITE_URL || "https://photos.manchestergents.com";

let coverIndexCache = { data: null, fetchedAt: 0 };

const escapeHtml = (value) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

async function fetchEventData(slug) {
  const projectId =
    process.env.SANITY_PROJECT_ID ||
    process.env.VITE_SANITY_PROJECT_ID ||
    DEFAULT_SANITY_PROJECT_ID;
  const dataset =
    process.env.SANITY_DATASET ||
    process.env.VITE_SANITY_DATASET ||
    DEFAULT_SANITY_DATASET;
  const token =
    process.env.SANITY_API_TOKEN ||
    process.env.VITE_SANITY_READ_TOKEN ||
    "";
  if (!projectId || !slug) return null;

  const query =
    '*[_type == "event" && slug.current == $slug][0]{title, "coverUrl": defaultCoverImage.asset->url}';
  const url = new URL(
    `https://${projectId}.api.sanity.io/v${API_VERSION}/data/query/${dataset}`
  );
  url.searchParams.set("query", query);
  url.searchParams.set("$slug", slug);

  const res = await fetch(url.toString(), {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data?.result || null;
}

async function fetchCoverIndex() {
  if (!SITE_URL) return null;
  const now = Date.now();
  if (
    coverIndexCache.data &&
    now - coverIndexCache.fetchedAt < COVER_INDEX_TTL_MS
  ) {
    return coverIndexCache.data;
  }

  try {
    const res = await fetch(`${SITE_URL}${COVER_INDEX_PATH}`);
    if (!res.ok) return null;
    const data = await res.json();
    coverIndexCache = { data, fetchedAt: now };
    return data;
  } catch (err) {
    console.warn("OG cover index fetch failed:", err);
    return null;
  }
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end("Method Not Allowed");
  }

  const slugParam = Array.isArray(req.query?.slug)
    ? req.query.slug[0]
    : req.query?.slug;
  const slug = typeof slugParam === "string" ? slugParam : "";
  let imageParam = Array.isArray(req.query?.image)
    ? req.query.image[0]
    : req.query?.image;

  let title = "Manchester Gents";
  if (slug) {
    try {
      const event = await fetchEventData(slug);
      if (event?.title) title = event.title;
      if (!imageParam && event?.coverUrl) {
        imageParam = event.coverUrl;
      }
    } catch (err) {
      console.warn("OG page fetch failed:", err);
    }
  }
  if (slug && (!imageParam || title === "Manchester Gents")) {
    const coverIndex = await fetchCoverIndex();
    const entry = coverIndex?.events?.[slug];
    if (!imageParam && entry?.coverUrl) {
      imageParam = entry.coverUrl;
    }
    if (title === "Manchester Gents" && entry?.title) {
      title = entry.title;
    }
  }

  const safeTitle = escapeHtml(title);
  const ogParams = new URLSearchParams();
  if (slug) ogParams.set("slug", slug);
  if (imageParam) ogParams.set("image", imageParam);
  const ogImageUrl = `${SITE_URL}/api/og${
    ogParams.toString() ? `?${ogParams.toString()}` : ""
  }`;
  const pageUrl = slug ? `${SITE_URL}/event/${slug}` : SITE_URL;
  const description = slug
    ? `View photos from ${title}`
    : "View photos from all of our events!";
  const safeDescription = escapeHtml(description);

  const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Manchester Gents | ${safeTitle}</title>
    <meta name="description" content="${safeDescription}" />

    <meta property="og:title" content="Manchester Gents | ${safeTitle}" />
    <meta property="og:description" content="${safeDescription}" />
    <meta property="og:image" content="${ogImageUrl}" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${pageUrl}" />

    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="Manchester Gents | ${safeTitle}" />
    <meta name="twitter:description" content="${safeDescription}" />
    <meta name="twitter:image" content="${ogImageUrl}" />
  </head>
  <body></body>
</html>`;

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "public, s-maxage=600, stale-while-revalidate=86400");
  res.status(200).send(html);
}
