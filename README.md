# Modern Music Catalog (API-backed)

React SPA matching the updated Figma Make *Modern Music Catalog* UI, backed by `figmaMakeCatalogServer`.

## Getting Started

### 1. Start the API

```bash
cd c:\Development\Express\figmaMakeCatalogServer
npm start
```

API: `http://localhost:3001`

### 2. Run this app

```bash
cd c:\Development\React\musicCatalogApp
pnpm install
pnpm dev
```

App: `http://localhost:5174`

`VITE_API_URL` defaults to `http://localhost:3001` (see `.env`).

## Notes

- Artist photos, album covers, and country flags are local PNGs under `src/imports/`, resolved on the client from API asset keys.
- Schema matches Figma: `Solo`/`Group`, `SP`/`AM`/`AZ`, `Gold`/`Platinum`/`Diamond`/`null`, slug IDs, string `sold` values.
