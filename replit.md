# ProofBase — Workspace

## Overview

ProofBase is a premium dark-mode SaaS MVP where founders list products, collect structured feedback, and get AI-powered insights. Built as a pnpm monorepo with TypeScript.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite, Tailwind CSS v4, shadcn/ui, wouter, framer-motion
- **Auth**: Clerk (`@clerk/react@^6.5.0`) — Replit-managed
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod, drizzle-zod
- **API codegen**: Orval (from OpenAPI spec)
- **AI**: Replit OpenAI integration (`@workspace/integrations-openai-ai-server`)
- **Build**: esbuild (CJS bundle)

## Architecture

```
artifacts/proofbase/       — React+Vite frontend (port from $PORT, path /)
artifacts/api-server/      — Express API server (port 8080, path /api)
lib/api-spec/              — OpenAPI spec (source of truth)
lib/api-client-react/      — Generated React Query hooks (Orval)
lib/api-zod/               — Generated Zod schemas (Orval)
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

- `products` — id, founderClerkId, name, tagline, description, websiteUrl, logoUrl, category, feedbackCount, avgRating, createdAt, updatedAt
- `feedback` — id, productId, reviewerClerkId, liked, confused, missing, wouldPay, rating, createdAt

## Pages

- `/` — Landing page (public, redirects signed-in users to /dashboard)
- `/explore` — Browse all products with category/sort filters
- `/products/:id` — Product detail with stats, feedback, AI summarization
- `/sign-in` `/sign-up` — Clerk auth pages (themed)
- `/dashboard` — Founder dashboard (auth required → redirects to /sign-in)
- `/dashboard/submit` — Multi-step product listing form (auth required)

## Clerk Version Note

`@clerk/react@^6.5.0` (not 5.x) — pairs with `@clerk/shared@^4.9.0`. The 5.54.0 release was incompatible with @clerk/shared@3.47.5.
