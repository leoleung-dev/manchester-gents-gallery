<div align="center">
  <img src="src/assets/Horizontal Logo.svg" alt="Manchester Gents logo" width="560" />
  <h1>Manchester Gents Gallery</h1>
  <p><strong>Event photo platform with Sanity-backed uploads, comments, moderation workflows, and share-ready Open Graph rendering.</strong></p>
</div>

<p align="center">
  <a href="https://photos.manchestergents.com">Live Site</a> •
  <a href="#features">Features</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#architecture">Architecture</a> •
  <a href="#quick-start">Quick Start</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-%5E18.2.0-61DAFB?logo=react&logoColor=white" alt="React ^18.2.0" />
  <img src="https://img.shields.io/badge/React_Router-%5E6.17.0-CA4245?logo=reactrouter&logoColor=white" alt="React Router ^6.17.0" />
  <img src="https://img.shields.io/badge/Vite-%5E5.2.0-646CFF?logo=vite&logoColor=white" alt="Vite ^5.2.0" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-%5E3.4.1-06B6D4?logo=tailwindcss&logoColor=white" alt="Tailwind CSS ^3.4.1" />
  <img src="https://img.shields.io/badge/Sanity_Client-%5E5.4.2-F03E2F?logo=sanity&logoColor=white" alt="@sanity/client ^5.4.2" />
  <img src="https://img.shields.io/badge/Vercel_OG-%5E0.8.5-000000?logo=vercel&logoColor=white" alt="@vercel/og ^0.8.5" />
  <img src="https://img.shields.io/badge/Sharp-%5E0.33.5-99CC00?logo=sharp&logoColor=white" alt="sharp ^0.33.5" />
</p>

## Overview

`manchester-gents-gallery-full` is a React + Vite photo gallery for Manchester Gents events, backed by Sanity documents (`event`, `photo`, `comment`) and serverless API routes under `/api`.

- Live production domain: [https://photos.manchestergents.com](https://photos.manchestergents.com)
- Primary user routes: `/`, `/event/:slug`, `/event/:slug/admin`, `/admin`
- Share-preview support: custom bot routing and OG image/page generation via `vercel.json`, `api/og-page.js`, and `api/og.js`

## Why this project is strong for portfolio review

| Portfolio Signal | Evidence in This Repo | Why It Matters |
| --- | --- | --- |
| End-to-end product ownership | Frontend flows (`src/pages/*`), serverless APIs (`api/*`), build tooling (`scripts/*`), deployment routing (`vercel.json`) | Demonstrates full-stack delivery, not isolated feature work |
| Real media pipeline | Upload proxying to external upload server, Sanity asset/doc creation, EXIF-aware schema fields, ZIP export | Shows handling of large binary assets and user-generated content workflows |
| Operational thinking | Build-time cover index generation, OG pre-render strategy, cache headers, fallback logic | Shows attention to performance, social sharing, and deployment behavior |
| Content-model awareness | Dedicated Sanity Studio workspace (`sanity/`) with typed schemas | Demonstrates CMS-driven modeling and editor workflow support |
| Moderation tooling | Admin panel for photo/comment deletion and default cover management | Shows practical admin UX and data lifecycle management |

## Features

### Member / attendee experience

- Browse events and open per-event galleries
- Upload multiple images with uploader attribution (`Name @InstagramHandle`)
- View masonry photo grid with timestamp and uploader metadata
- Multi-select photos and download as ZIP
- Open image modal, navigate prev/next, download single image
- Read and post comments per photo

### Admin experience

- Create events from `/admin` (title + slug)
- Generate title/slug from date input in `/admin`
- Trigger Vercel deploy hook from `/admin` (`VITE_VERCEL_DEPLOY_HOOK`)
- Event-level moderation at `/event/:slug/admin`:
  - Bulk/single photo deletion
  - Bulk/single comment deletion
  - Set a selected photo as event default cover image
  - Keyboard select-all support (`Cmd/Ctrl + A`)

### Platform/runtime capabilities

- Serverless API handlers for events, photos, comments, uploads, moderation, and OG
- Bot-aware routing for `/event/:slug` to OG HTML for crawlers
- Dynamic OG image generation (`@vercel/og`) with JPEG optimization via `sharp`
- Build-time generation of `public/event-cover-index.json` and static OG share pages

## Tech Stack

| Layer | Technologies | Usage |
| --- | --- | --- |
| Frontend | React, React Router, Vite | SPA routing and UI rendering |
| UI/UX | CSS modules/files, `react-icons`, `react-masonry-css` | Gallery layout, iconography, interaction patterns |
| Media utilities | `jszip`, `file-saver` | Bulk client-side ZIP downloads |
| Backend/API | Vercel Serverless Functions (`api/*.js`) | CRUD APIs, upload proxying, moderation, OG endpoints |
| CMS / Data | Sanity Content Lake, `@sanity/client`, `@sanity/image-url` | Event/photo/comment storage and media URL transforms |
| OG rendering | `@vercel/og`, `sharp` | Share card image generation and optimization |
| Build/Styling | Tailwind CSS, PostCSS, Autoprefixer | Styling pipeline support |
| Deployment | Vercel (`vercel.json`) | Build command, routing rules, static + serverless output |
| CMS authoring | Sanity Studio (`sanity/`) | Schema-backed content management workspace |

## Architecture

```mermaid
flowchart TD
  A[Browser: React SPA] --> B[Routes: /, /event/:slug, /admin, /event/:slug/admin]
  B --> C[/api/getEventSlugs]
  B --> D[/api/getEventPhotos]
  B --> E[/api/addComment]
  B --> F[/api/createEvent]
  B --> G[/api/deletePhoto / bulkDeletePhoto]
  B --> H[/api/deleteComment]
  B --> I[/api/setCoverImage]
  B --> J[/api/uploadImages]

  C --> K[(Sanity Content Lake)]
  D --> K
  E --> K
  F --> K
  G --> K
  H --> K
  I --> K

  J --> U[mg-fly-uploadserver.fly.dev/upload]
  J --> K

  L[Social bots] --> M[vercel.json bot route for /event/:slug]
  M --> N[/api/og-page]
  N --> O[/api/og]
  O --> K
  N --> P[public/event-cover-index.json]
  O --> P

  Q[npm run build] --> R[scripts/generate-event-cover-index.js]
  Q --> S[generate-og-html.js]
  R --> P
  S --> T[dist/event/*/share/index.html]
```

## Security and reliability highlights

- CORS allowlist is centralized in `src/lib/setCorsHeaders.js` and applied across API handlers.
- API handlers enforce HTTP methods and preflight handling (`OPTIONS`, `405`, `Allow` headers).
- Input validation is present for required payload fields (e.g., slug/title/photoId/comment fields).
- Destructive operations use Sanity transactions and clean related draft/comment documents.
- OG HTML output escapes dynamic strings before embedding in meta tags (`api/og-page.js`).
- Upload handling in `api/uploadImages.js` disables body parsing and streams request payload onward.
- Caching strategy:
  - In-memory cover-index cache with TTL in OG handlers
  - Long-lived cache headers for generated OG JPEG images
  - `s-maxage` + `stale-while-revalidate` for OG HTML response
- Reliability fallbacks for OG cover selection (query param -> Sanity event cover -> cover index).

Note: admin-capable routes are exposed in-app; no authentication middleware is implemented in this repository.

## Quick Start

```bash
# 1) Install dependencies
npm install

# 2) Create .env.local with required variables (see table below)

# 3) Start frontend
npm run dev

# 4) Production build + local preview
npm run build
npm run preview
```

Optional: run the co-located Sanity Studio.

```bash
cd sanity
npm install
npm run dev
```

## Environment Variables

No `.env.example` file is currently committed; variables below are inferred from source usage.

| Variable | Required | Used In | Purpose |
| --- | --- | --- | --- |
| `SANITY_PROJECT_ID` | Yes | `api/*.js`, `scripts/generate-event-cover-index.js`, OG handlers | Sanity project identifier for server-side reads/writes |
| `SANITY_DATASET` | Yes | `api/*.js`, `scripts/generate-event-cover-index.js`, OG handlers | Sanity dataset |
| `SANITY_API_TOKEN` | Yes (for writes) | write APIs + OG/index scripts fallback | Auth token for create/update/delete operations and private reads |
| `VITE_SANITY_PROJECT_ID` | Yes (frontend) | `src/lib/sanityClient.js`, modal comment query | Client-side Sanity project ID |
| `VITE_SANITY_DATASET` | Yes (frontend) | `src/lib/sanityClient.js`, modal comment query | Client-side Sanity dataset |
| `VITE_API_BASE` | Optional | `src/App.jsx`, `Home.jsx`, `AdminPanel.jsx` | API base override |
| `VITE_VERCEL_DEPLOY_HOOK` | Optional | `src/pages/Admin.jsx` | Deploy trigger endpoint for admin UI |
| `VITE_SANITY_READ_TOKEN` | Optional | OG handlers + cover-index script fallback | Token fallback for read operations |
| `SITE_URL` | Optional (recommended in prod) | `api/og.js`, `api/og-page.js` | Canonical base URL for OG links/assets |
| `PORT` | Optional | `package.json` dev script, `server.cjs` | Local dev/server port |
| `HOST` | Optional | `server.cjs` | Local API host binding |

## Available Scripts

Root scripts from `package.json`:

| Script | Command | Description |
| --- | --- | --- |
| `dev` | `vite --host --port ${PORT:-5173}` | Start Vite dev server |
| `build` | `node scripts/generate-event-cover-index.js && vite build && node generate-og-html.js` | Generate cover index, build app, generate OG HTML files |
| `preview` | `vite preview` | Preview production build locally |

Sanity Studio scripts from `sanity/package.json`:

| Script | Command |
| --- | --- |
| `dev` | `sanity dev` |
| `start` | `sanity start` |
| `build` | `sanity build` |
| `deploy` | `sanity deploy` |
| `deploy-graphql` | `sanity graphql deploy` |

## Project Structure

```text
.
├── api/                         # Vercel serverless API handlers
│   ├── addComment.js
│   ├── uploadImages.js
│   ├── getEventSlugs.js
│   ├── getEventPhotos.js
│   ├── getAdminData.js
│   ├── createEvent.js
│   ├── setCoverImage.js
│   ├── deletePhoto.js
│   ├── bulkDeletePhoto.js
│   ├── deleteComment.js
│   ├── og.js
│   └── og-page.js
├── public/
│   └── event-cover-index.json   # Generated build artifact
├── scripts/
│   └── generate-event-cover-index.js
├── sanity/                      # Sanity Studio workspace + schemas
│   ├── schemaTypes/
│   ├── sanity.config.js
│   └── package.json
├── src/
│   ├── components/
│   ├── lib/
│   ├── pages/
│   │   └── admin/
│   ├── assets/
│   ├── App.jsx
│   └── main.jsx
├── generate-og-html.js
├── vercel.json
├── vite.config.js
└── package.json
```

## Deployment

1. Provision a Vercel project and connect this repository.
2. Set environment variables listed above in Vercel Project Settings.
3. Deploy with build command from `vercel.json` (`npm run build`) and output directory `dist`.
4. Verify route behavior:
   - App routes resolve to `index.html`
   - `/api/*` routes execute serverless handlers
   - Bot requests to `/event/:slug` are routed to `/api/og-page`
5. Confirm OG output:
   - `/api/og-page?slug=<eventSlug>`
   - `/api/og?slug=<eventSlug>`

## License

No root `LICENSE` file is present in this repository.  
The co-located Sanity Studio package declares `UNLICENSED` in `sanity/package.json`.
