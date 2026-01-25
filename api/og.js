import React from "react";
import { ImageResponse } from "@vercel/og";

const API_VERSION = "2023-08-03";

async function fetchEventData(slug) {
  const projectId = process.env.SANITY_PROJECT_ID;
  const dataset = process.env.SANITY_DATASET || "production";
  if (!projectId || !slug) return null;

  const query =
    '*[_type == "event" && slug.current == $slug][0]{title, "coverUrl": defaultCoverImage.asset->url}';
  const url = new URL(
    `https://${projectId}.api.sanity.io/v${API_VERSION}/data/query/${dataset}`
  );
  url.searchParams.set("query", query);
  url.searchParams.set("$slug", slug);

  const res = await fetch(url.toString());
  if (!res.ok) return null;
  const data = await res.json();
  return data?.result || null;
}

async function fetchCoverDataUrl(coverUrl) {
  if (!coverUrl) return "";
  try {
    const res = await fetch(coverUrl);
    if (!res.ok) return "";
    const arrayBuffer = await res.arrayBuffer();
    const contentType =
      res.headers.get("content-type") || "image/jpeg";
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    return `data:${contentType};base64,${base64}`;
  } catch (err) {
    console.warn("OG cover fetch failed:", err);
    return "";
  }
}

export default async function handler(req, res) {
  const { searchParams } = new URL(
    req.url,
    `http://${req.headers.host || "localhost"}`
  );
  const slug = searchParams.get("slug") || "";
  const event = await fetchEventData(slug);
  const title = event?.title || slug || "Manchester Gents";
  let coverUrl = event?.coverUrl || "";
  if (coverUrl) {
    const cover = new URL(coverUrl);
    cover.searchParams.set("w", "1200");
    cover.searchParams.set("h", "630");
    cover.searchParams.set("fit", "crop");
    cover.searchParams.set("auto", "format");
    cover.searchParams.set("q", "80");
    coverUrl = cover.toString();
  }
  const coverDataUrl = await fetchCoverDataUrl(coverUrl);

  const imageResponse = new ImageResponse(
    React.createElement(
      "div",
      {
        style: {
          width: "1200px",
          height: "630px",
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background:
            "linear-gradient(135deg, #1c2837 0%, #2d4059 60%, #3e587b 100%)",
          color: "#ffd460",
          fontFamily: "Verdana, Arial, sans-serif",
          overflow: "hidden",
        },
      },
      coverDataUrl
        ? React.createElement("img", {
            src: coverDataUrl,
            width: 1200,
            height: 630,
            style: {
              position: "absolute",
              inset: 0,
              width: "1200px",
              height: "630px",
              objectFit: "cover",
            },
          })
        : null,
      React.createElement("div", {
        style: {
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(135deg, rgba(28, 40, 55, 0.8) 0%, rgba(45, 64, 89, 0.75) 60%, rgba(62, 88, 123, 0.7) 100%)",
        },
      }),
      React.createElement(
        "div",
        {
          style: {
            position: "relative",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "64px",
            width: "100%",
            height: "100%",
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
