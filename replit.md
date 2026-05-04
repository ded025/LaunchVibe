# ProofBase — Workspace

## Overview

ProofBase is a premium dark-mode SaaS for founders to list products, collect structured feedback, and get AI-powered insights. Built as a pnpm monorepo with TypeScript.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite, Tailwind CSS v4, shadcn/ui, wouter, framer-motion, react-leaflet
- **Auth**: Clerk (`@clerk/react@^6.5.0`) — Replit-managed
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod, drizzle-zod
- **API codegen**: Orval (from OpenAPI spec, mode: single for zod)
- **AI**: Replit OpenAI integration (`@workspace/integrations-openai-ai-server`)
- **Charts**: Recharts (in proofbase frontend)
- **Build**: esbuild (CJS bundle)

## Architecture

```
artifacts/proofbase/       — React+Vite frontend (port from $PORT, path /)
artifacts/api-server/      — Express API server (port 8080, path /api)
lib/api-spec/              — OpenAPI spec (source of truth)
lib/api-client-react/      — Generated React Query hooks (Orval)
lib/api-zod/               — Generated Zod schemas (Orval, single-file mode)
lib/db/                    — Drizzle schema + migrations
lib/integrations-openai-ai-server/ — OpenAI server client
lib/integrations-openai-ai-react/  — OpenAI react helpers
```

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate hooks/schemas from OpenAPI
- `pnpm --filter @workspace/db run push` — push DB schema to dev database
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## Database Schema

- `products` — id, founderClerkId, name, tagline, description, websiteUrl, logoUrl, category, city, country, latitude, longitude, feedbackCount, avgRating, score (smart rank), statusTag, createdAt, updatedAt
- `feedback` — id, productId, reviewerClerkId, liked, confused, missing, wouldPay, rating, createdAt
- `user_points` — userId, points, streak, lastActiveDate, badges[], createdAt, updatedAt
- `feed_events` — id, type, productId, productName, userId, metadata, createdAt

## Pages

- `/` — Landing page with Live Startup Map (React Leaflet) and city groupings
- `/explore` — Browse products with Smart Rank / Trending / Top Rated / Newest sort + status tags + city pins
- `/leaderboard` — Top Products / Top Builders / Top Reviewers tabs with medals and points
- `/feed` — Community Feed showing real-time product_listed, feedback_received, milestone events
- `/products/:id` — Product detail: location, smart score, status tag, stats, AI insights, feedback list
- `/sign-in` `/sign-up` — Clerk auth pages (themed to dark)
- `/dashboard` — Founder dashboard: gamification bar (points, streak, badges, daily check-in), feedback-over-time chart (Recharts), would-pay %, product list with status tags
- `/dashboard/submit` — Multi-step form with location search (Nominatim geocoding) + feedback economy gate (must give ≥3 feedbacks before listing)

## API Routes

- `GET /api/healthz`
- `GET /api/products` — list with sort=score|trending|top_rated|newest
- `GET /api/products/map` — products with lat/lng for map
- `GET /api/products/trending`
- `POST /api/products` — requires auth + feedback economy gate
- `GET/PATCH/DELETE /api/products/:id`
- `GET/POST /api/products/:id/feedback`
- `GET /api/products/:id/stats`
- `POST /api/products/:id/summarize` — AI insights
- `GET /api/dashboard` — founder stats with feedbackOverTime
- `GET /api/dashboard/products`
- `GET /api/leaderboard/builders`
- `GET /api/leaderboard/reviewers`
- `GET /api/leaderboard/products`
- `GET /api/feed`
- `GET /api/gamification/me`
- `GET /api/gamification/me/feedback-count`
- `POST /api/gamification/checkin`
- `GET /api/geo/search?q=...` — Nominatim proxy

## Smart Ranking Formula

`score = (avgRating × 0.4) + (feedbackCount/10 × 0.3) + (recencyBoost × 0.2) + (wouldPayRatio × 5 × 0.1)`

## Gamification

- Submit feedback: +5 pts
- List product: +20 pts
- Receive feedback: +2 pts/each
- Daily check-in: +2 pts
- Badges: "Early Builder" (≥1 product), "Top Reviewer" (≥10 feedback), "Rising Product" (≥50 pts)

## Clerk Version Note

`@clerk/react@^6.5.0` (not 5.x) — pairs with `@clerk/shared@^4.9.0`. The 5.54.0 release was incompatible with @clerk/shared@3.47.5.

## Orval Config Note

The Zod output uses `mode: "single"` and `target: "generated/api.ts"` (NOT split mode with schemas). This avoids duplicate export conflicts between the Zod file and generated TypeScript interfaces.
