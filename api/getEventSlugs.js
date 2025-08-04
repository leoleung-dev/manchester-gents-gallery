import { createClient } from "@sanity/client";

const client = createClient({
  projectId: process.env.SANITY_PROJECT_ID,
  dataset: process.env.SANITY_DATASET,
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
  apiVersion: "2023-08-03",
});

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const events = await client.fetch(
      `*[_type == "event" && defined(slug.current)]{
    _id,
    "slug": slug.current,
    title,
    defaultCoverImage
  }`
    );
    res.status(200).json(events);
  } catch (err) {
    console.error("getEventSlugs error:", err);
    res.status(500).json({ error: err.message });
  }
}
