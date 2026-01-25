import React from "react";
import { ImageResponse } from "@vercel/og";
import fs from "fs";

const LOGO_PNG_URL = new URL("../src/assets/Large Logo.png", import.meta.url);
const LOGO_PNG = fs.readFileSync(LOGO_PNG_URL);
const LOGO_DATA_URL = `data:image/png;base64,${LOGO_PNG.toString("base64")}`;

const API_VERSION = "2023-08-03";
const DEFAULT_SANITY_PROJECT_ID = "ulu3s1tc";
const DEFAULT_SANITY_DATASET = "production";
const COVER_INDEX_PATH = "/event-cover-index.json";
const COVER_INDEX_TTL_MS = 5 * 60 * 1000;

let coverIndexCache = { data: null, fetchedAt: 0 };

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

function getBaseUrl(req) {
  if (process.env.SITE_URL) return process.env.SITE_URL;
  const proto = req.headers["x-forwarded-proto"] || "http";
  const host = req.headers.host || "localhost";
  return `${proto}://${host}`;
}

async function fetchCoverIndex(baseUrl) {
  if (!baseUrl) return null;
  const now = Date.now();
  if (
    coverIndexCache.data &&
    now - coverIndexCache.fetchedAt < COVER_INDEX_TTL_MS
  ) {
    return coverIndexCache.data;
  }

  try {
    const res = await fetch(`${baseUrl}${COVER_INDEX_PATH}`);
    if (!res.ok) return null;
    const data = await res.json();
    coverIndexCache = { data, fetchedAt: now };
    return data;
  } catch (err) {
    console.warn("OG cover index fetch failed:", err);
    return null;
  }
}

async function fetchCoverArrayBuffer(coverUrl) {
  if (!coverUrl) return null;
  try {
    const res = await fetch(coverUrl);
    if (!res.ok) return null;
    return await res.arrayBuffer();
  } catch (err) {
    console.warn("OG cover fetch failed:", err);
    return null;
  }
}

export default async function handler(req, res) {
  const { searchParams } = new URL(
    req.url,
    `http://${req.headers.host || "localhost"}`
  );
  const slug = searchParams.get("slug") || "";
  const debug = searchParams.get("debug") === "1";
  const imageParam = searchParams.get("image") || "";
  const baseUrl = getBaseUrl(req);
  const event = await fetchEventData(slug);
  let title = event?.title || slug || "Manchester Gents";
  let coverUrl = imageParam || event?.coverUrl || "";
  let coverSource = imageParam ? "query" : event?.coverUrl ? "sanity" : "";

  if (!coverUrl && slug) {
    const coverIndex = await fetchCoverIndex(baseUrl);
    const entry = coverIndex?.events?.[slug];
    if (entry?.coverUrl) {
      coverUrl = entry.coverUrl;
      coverSource = "index";
    }
    if (!event?.title && entry?.title) {
      title = entry.title;
    }
  }

  if (coverUrl && !imageParam) {
    const cover = new URL(coverUrl);
    cover.searchParams.set("w", "1200");
    cover.searchParams.set("h", "630");
    cover.searchParams.set("fit", "crop");
    cover.searchParams.set("fm", "jpg");
    cover.searchParams.set("q", "80");
    coverUrl = cover.toString();
  }
  let coverData = null;
  let coverBytes = 0;
  try {
    coverData = await fetchCoverArrayBuffer(coverUrl);
    coverBytes = coverData ? coverData.byteLength : 0;
  } catch (err) {
    console.warn("OG cover buffer failed:", err);
  }

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
      coverData
        ? React.createElement("img", {
            src: coverData,
            width: 1200,
            height: 630,
            style: {
              position: "absolute",
              inset: 0,
              width: "1200px",
              height: "630px",
              objectFit: "cover",
              zIndex: 0,
            },
          })
        : null,
      React.createElement("div", {
        style: {
          position: "absolute",
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
          backgroundColor: "rgba(28, 40, 55, 0.35)",
          backgroundImage:
            "linear-gradient(180deg, rgba(28, 40, 55, 0.75) 0%, rgba(45, 64, 89, 0.4) 50%, rgba(28, 40, 55, 0.75) 100%)",
          zIndex: 1,
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
            alignItems: "center",
            padding: "64px 96px",
            width: "100%",
            height: "100%",
            textAlign: "center",
            zIndex: 2,
          },
        },
        React.createElement(
          "div",
          {
            style: {
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 24,
              padding: "36px 48px",
              borderRadius: 24,
              maxWidth: "88%",
            },
          },
          React.createElement(
            "div",
            {
              style: {
                width: "100%",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              },
            }
          ,
            React.createElement("img", {
              src: LOGO_DATA_URL,
              width: 360,
              height: 144,
              style: {
                width: "360px",
                height: "144px",
                objectFit: "contain",
                alignSelf: "center",
              },
            })
          ),
          React.createElement(
            "div",
            {
              style: {
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                fontSize: 64,
                fontWeight: 700,
                lineHeight: 1.1,
                textShadow: "0 12px 28px rgba(0,0,0,0.55)",
                width: "100%",
                textAlign: "center",
              },
            },
            title
          ),
          React.createElement(
            "div",
            {
              style: {
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                fontSize: 28,
                color: "#f6e2a3",
                textShadow: "0 10px 22px rgba(0,0,0,0.5)",
                width: "100%",
                textAlign: "center",
              },
            },
            "View photos from this event"
          ),
          debug
            ? React.createElement(
                "div",
                {
                  style: {
                    marginTop: 12,
                    padding: "12px 16px",
                    borderRadius: 8,
                    background: "rgba(0,0,0,0.5)",
                    color: "#ffffff",
                    fontSize: 20,
                    lineHeight: 1.4,
                    maxWidth: "90%",
                  },
                },
                `debug: coverUrl=${coverUrl ? "yes" : "no"} | bytes=${coverBytes} | source=${coverSource || "none"}`
              )
            : null
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
