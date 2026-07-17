# Modern Music Catalog (API-backed)

A React SPA that duplicates the Figma Make *Modern Music Catalog* UI, backed by the Express REST API in `figmaMakeCatalogServer` instead of in-memory seed data.

## Features

Same browsing, filtering, theming, and CRUD flows as the original Figma Make app, with all catalog reads and writes going through HTTP.

## Tech Stack

| Concern | Library |
|---|---|
| UI framework | React 18 |
| Routing | React Router 7 |
| Styling | Tailwind CSS v4 |
| Modals / tooltips | Radix UI |
| Toasts | Sonner |
| Icons | Lucide React |
| Build tool | Vite 6 |
| Package manager | pnpm |
| API | `fetch` via `src/app/api/catalogApi.ts` |

## Getting Started

### 1. Start the API

```bash
cd c:\Development\Express\figmaMakeCatalogServer
npm install
npm start
```

API: `http://localhost:3001`

### 2. Install and run this app

```bash
cd c:\Development\React\musicCatalogApp
pnpm install
pnpm dev
```

App: `http://localhost:5174`

Configure the API base URL with `VITE_API_URL` in `.env` (defaults to `http://localhost:3001`).

## Project Structure

```
src/
├── app/
│   ├── api/catalogApi.ts   # REST client
│   ├── types.ts            # Artist / Album types
│   ├── App.tsx             # UI, CatalogProvider (loads from API)
│   ├── Root.tsx
│   ├── routes.tsx
│   └── pages/
└── styles/
```

Data is not persisted in the browser — the Express server holds the catalog in memory and reseeds on restart.
