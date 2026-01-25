import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { createClient } from "@sanity/client";

dotenv.config();

const DEFAULT_SANITY_PROJECT_ID = "ulu3s1tc";
const DEFAULT_SANITY_DATASET = "production";
const API_VERSION = "2023-08-03";

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

const client = createClient({
  projectId,
  dataset,
  apiVersion: API_VERSION,
  useCdn: !token,
  token,
});

async function run() {
  if (!projectId || !dataset) {
    throw new Error("Missing Sanity project configuration.");
  }

  const events = await client.fetch(`
    *[_type == "event"]{
      title,
      "slug": slug.current,
      "coverUrl": defaultCoverImage.asset->url
    }
  `);

  const eventMap = {};
  for (const event of events) {
    if (!event.slug) continue;
    eventMap[event.slug] = {
      title: event.title || "",
      coverUrl: event.coverUrl || "",
    };
  }

  const payload = {
    generatedAt: new Date().toISOString(),
    events: eventMap,
  };

  const publicDir = path.join(process.cwd(), "public");
  fs.mkdirSync(publicDir, { recursive: true });
  const filePath = path.join(publicDir, "event-cover-index.json");
  fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), "utf-8");
  console.log(`✅ Wrote ${filePath}`);
}

run().catch((err) => {
  console.error("❌ Failed to generate event cover index:", err);
  process.exit(1);
});
