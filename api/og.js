import React from "react";
import { ImageResponse } from "@vercel/og";

const API_VERSION = "2023-08-03";

async function fetchEventTitle(slug) {
  const projectId = process.env.SANITY_PROJECT_ID;
  const dataset = process.env.SANITY_DATASET || "production";
  if (!projectId || !slug) return null;

  const query = '*[_type == "event" && slug.current == $slug][0]{title}';
  const url = new URL(
    `https://${projectId}.api.sanity.io/v${API_VERSION}/data/query/${dataset}`
  );
  url.searchParams.set("query", query);
  url.searchParams.set("$slug", slug);

  const res = await fetch(url.toString());
  if (!res.ok) return null;
  const data = await res.json();
  return data?.result?.title || null;
}

export default async function handler(req, res) {
  const { searchParams } = new URL(
    req.url,
    `http://${req.headers.host || "localhost"}`
  );
  const slug = searchParams.get("slug") || "";
  const title = (await fetchEventTitle(slug)) || slug || "Manchester Gents";

  const imageResponse = new ImageResponse(
    React.createElement(
      "div",
      {
        style: {
          width: "1200px",
          height: "630px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "64px",
          background:
            "linear-gradient(135deg, #1c2837 0%, #2d4059 60%, #3e587b 100%)",
          color: "#ffd460",
          fontFamily: "Verdana, Arial, sans-serif",
        },
      },
      React.createElement(
        "div",
        { style: { fontSize: 28, letterSpacing: "0.04em" } },
        "Manchester Gents"
      ),
      React.createElement(
        "div",
        {
          style: {
            marginTop: 24,
            fontSize: 64,
            fontWeight: 700,
            lineHeight: 1.1,
          },
        },
        title
      ),
      React.createElement(
        "div",
        {
          style: {
            marginTop: 24,
            fontSize: 28,
            color: "#f6e2a3",
          },
        },
        "View photos from this event"
      )
    ),
    {
      width: 1200,
      height: 630,
    }
  );

  const arrayBuffer = await imageResponse.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  res.setHeader("Content-Type", "image/png");
  res.setHeader(
    "Cache-Control",
    "public, immutable, no-transform, max-age=31536000"
  );
  res.status(200).send(buffer);
}
