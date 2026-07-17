# Music Catalog App — Implementation Plan

## Context

The user wants a full music catalog app built from scratch in `src/app/App.tsx`. The existing app is a plain, light-mode placeholder. The new version should feel like a polished dark-mode music discovery experience (Spotify / Apple Music / Amazon Music aesthetic), with full CRUD for artists and albums, search/filter/sort, and smooth in-app navigation via view state (no URL router needed).

---

## Visual Direction

- **Dark mode only** — update `theme.css` so dark tokens are the defaults in `:root` (not just `.dark`). Deep near-black backgrounds (`#0a0a0f`), elevated cards (`#111118`), subtle borders.
- **Typography** — `fonts.css` imports: `Inter` (body/UI) + `Playfair Display` (display headings). Update `--font-size` to 14px for density.
- **Accent color** — vivid violet-to-pink gradient (`#8b5cf6` → `#ec4899`) used for interactive elements, active states, and certification badges.
- **Album art** — large, prominent square images; placeholder gradient tiles when no image URL. On detail pages, a blurred background echo of the cover art adds editorial depth.
- **Cards** — rounded (`radius: 0.75rem`), subtle inner shadow, hover: slight lift + border highlight.

---

## Architecture

Single `App.tsx` file. Navigation is pure React state — no react-router.

```
type View =
  | { type: 'artists' }
  | { type: 'albums' }
  | { type: 'artist-detail'; artistId: string }
  | { type: 'album-detail'; albumId: string }
```

All data lives in a `useState` seeded from an `initialData` constant (in-memory, no persistence).

---

## Data

### Sample seed data
30 artists, each with 3–7 albums, covering the full data model:

**Artist fields:** id, name, country, type (`solo` | `group`), memberCount (group only), activeSince, albumIds

**Album fields:** id, artistId, title, coverUrl, label, releaseYear, trackCount, singleCount, albumsSold, certification (`none` | `gold` | `platinum` | `multi-platinum`), streaming (`spotify` | `apple` | `amazon`, as array)

Cover art: Use Unsplash image URLs (landscape/abstract photography) via direct `https://images.unsplash.com/...` CDN URLs with `?w=300&q=80` params — no API key needed for static CDN URLs.

---

## Component Structure (all in App.tsx)

```
App
├── NavBar                  — logo, "Artists" / "Albums" tabs, global search
├── views/
│   ├── ArtistsView         — grid of ArtistCard + toolbar (search, filter by country/type, sort)
│   ├── AlbumsView          — grid of AlbumCard + toolbar (search, filter by label/year/cert, sort)
│   ├── ArtistDetailView    — hero section + metadata + collapsible AlbumList + Edit/Add Album buttons
│   └── AlbumDetailView     — large cover art + blurred bg echo + full metadata + Edit/Delete buttons
├── modals/
│   ├── ArtistFormModal     — add/edit artist (all fields)
│   ├── AlbumFormModal      — add/edit album (all fields, artist pre-selected when from artist detail)
│   └── DeleteAlbumModal    — confirmation dialog with album thumbnail
└── shared/
    ├── CertBadge           — gold/platinum/multi-platinum pill
    ├── StreamingIcons      — Spotify/Apple/Amazon icon badges
    └── Toast               — success feedback (sonner)
```

---

## Key Implementation Details

### Navigation
- `NavBar` tabs switch between `{ type: 'artists' }` and `{ type: 'albums' }` views.
- Clicking an artist card → `{ type: 'artist-detail', artistId }`.
- Clicking an album card or title → `{ type: 'album-detail', albumId }`.
- "Back" link on detail pages uses `window.history` pattern (just sets view to previous).

### Search / Filter / Sort (ArtistsView & AlbumsView)
- **Artists:** search by name, filter by type (solo/group) and country, sort by name or activeSince.
- **Albums:** search by title or artist name, filter by certification and streaming platform, sort by title, releaseYear, or albumsSold.
- All client-side, derived from the in-memory data array.

### Artist Detail
- Hero: large avatar placeholder (colored initials circle) + name, country flag emoji, type, activeSince, member count, album count.
- **Albums toggle** — a toggle switch shows/hides the album list (matches reference screenshots).
- Album list: rows with cover art thumbnail, title, label, year, sold count, cert badge, streaming icons, Edit and Delete buttons.
- Buttons: "Edit Artist", "Add Album".

### Album Detail
- Full-width blurred cover art behind a centered card.
- Large cover image (left), metadata block (right): title, artist link, label, year, cert badge, streaming icons, tracks/singles/sold.
- Buttons: "Edit Album", "Delete Album".

### Forms (ArtistFormModal, AlbumFormModal)
- Modal dialog using `@radix-ui/react-dialog`.
- All fields from the data model, clearly labeled.
- Album form: artist selector dropdown (pre-selected when opened from artist detail), cover URL field with live preview.
- On submit: update state, close modal, fire `toast.success(...)` via `sonner`.

### Delete Confirmation (DeleteAlbumModal)
- Modal with album thumbnail + title + artist, "No" / "Yes, delete" buttons.
- On confirm: remove album from state, navigate back if on album detail, fire `toast.success(...)`.

---

## Files to Modify

| File | Change |
|------|--------|
| `src/app/App.tsx` | Full replacement — all components, data, state |
| `src/styles/theme.css` | Update `:root` tokens to dark-mode values; keep all token names |
| `src/styles/fonts.css` | Add Google Fonts `@import` for Inter + Playfair Display |

---

## Verification

1. App renders without errors in the browser.
2. Clicking "Artists" / "Albums" tabs switches views.
3. Clicking an artist card opens artist detail with metadata and collapsible album list.
4. Albums toggle shows/hides album rows.
5. Clicking an album opens album detail with blurred background.
6. "Add Artist" opens form; submitting adds artist to the list with a toast.
7. "Add Album" from artist detail pre-selects the artist.
8. "Edit" on artist/album pre-fills the form.
9. "Delete Album" shows confirmation modal; confirming removes the album and shows a toast.
10. Search and filter narrow the displayed lists correctly.
11. All Tailwind token classes (`bg-background`, `text-foreground`, `border-border`) compile without errors.
