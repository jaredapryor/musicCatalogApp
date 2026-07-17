# App Description

This application is a music catalog experience designed to help users explore a curated collection of artists and albums in a visually rich, easy-to-navigate format. It presents music as a structured discovery space where people can browse artists, view their discographies, and inspect individual album details without needing to leave the experience.

At a high level, the app helps users understand who the artists are, where they come from, how long they have been active, and what albums they have released. It also gives them a sense of each album's commercial success, record label, release year, and whether it is available on major streaming platforms. The experience is built to feel more like a polished product catalog than a raw database, with clear sections, images, and content hierarchy that make the information feel approachable.

The app is organized around two primary ways of exploring content:

- Browsing artists and seeing their associated albums
- Browsing albums directly and viewing the artist behind each release

Users can move from a broad overview into deeper detail as needed. For example, they can inspect an artist's profile to see a summary of the artist's background and a list of their albums, then drill into an individual album to view more detailed information. This makes the app useful for both casual discovery and more focused exploration.

The product also supports full management of the catalog, not just browsing. Users can add new artists and albums, edit existing artist and album records, and remove both albums and artists, all through clear forms and confirmation dialogs, with feedback after actions are completed. These moments help make the interface feel more intentional and guided, rather than purely informational.

Overall, this application functions as a lightweight digital music catalog, showcase, and management tool. Its purpose is not just to display data, but to make a collection of artists and albums feel discoverable, memorable, and easy to explore, while also being easy to keep up to date. It is well suited for a product team that wants to present and maintain music-related content in a clean, browsable, and visually organized way.

## Data Model

**Artist**

- Name
- Country of origin (selected from a predefined country list; displays as a flag image and abbreviated country code)
- Type: solo act or group
- Number of group members (if applicable)
- Active since (year)
- Photo URL (used as the artist avatar; falls back to a color-coded initials circle if the image fails to load)
- Associated albums (list)

**Album**

- Title
- Artist (owning artist)
- Cover art
- Record label
- Release year
- Number of tracks
- Number of singles
- Albums sold
- Certification (e.g., gold, platinum, multi-platinum)
- Streaming availability (e.g., Spotify, Apple Music, Amazon Music)

## Core Functionality

- Browse all artists and browse all albums, each as its own top-level view with its own URL
- View an artist's detail page, including a collapsible/expandable list of their albums
- View an album's detail page with full details and a link back to the artist
- Search, filter, and sort artists (by name or country, filtered by type or country) and albums (by title or artist name, filtered by certification or streaming platform)
- Add a new artist, with a form covering all fields in the artist data model
- Add a new album to an existing artist, with a form covering all fields in the album data model
- Edit an existing artist's details, including selecting their country from a dropdown (which displays a live flag image preview) and updating their photo URL
- Edit an existing album's details
- Delete an album, with a confirmation dialog before the action completes
- Delete an artist, with a confirmation dialog that shows how many albums will also be removed; deleting an artist permanently removes all of their associated albums from the catalog
  - The delete action is available from the All Artists view (via a button that appears on hover) and from the Artist detail page
- Show toast notifications after every add, edit, and delete action completes
- Toggle between a dark theme (deep near-black background, violet/pink accents) and a light theme (warm cream background, same accents) using a toggle in the header; the selected theme is persisted across sessions

## Visual Direction

This version is an opportunity to explore a meaningfully different visual style rather than replicate the current look. I'm interested in seeing a few different directions inspired by the browsing and discovery experiences of Amazon Music, Spotify, and Apple Music, with a specific interest in a dark mode aesthetic: dark backgrounds, high-contrast typography, bold album art as a focal point, and the kind of polished, editorial feel those apps use for browsing and detail pages.

The existing screenshots should be treated as a reference for content, data fields, and general layout structure (what a card shows, what a detail page includes, the artist-to-album relationship) — not for visual style. The flat gray boxes, default link styling, and light background in the current build are exactly what this new version should move away from.

## Additional Guidance for a New Version

If this description is being used as the basis for building a new version of the app, the following product details would be especially helpful to preserve:

- The app should feel like a polished music discovery experience, not a generic data table or admin dashboard.
- The primary user goal is exploration: understanding artists, discovering albums, and learning about the music catalog in a pleasant and intuitive way — with the ability to keep the catalog current through adding and editing records.
- The experience should feel visually rich enough to be engaging, but still simple and structured enough to be easy to navigate.
- Users should be able to move from a broad overview to deeper detail without confusion.
- The tone should feel modern, creative, and slightly immersive, with a strong sense of music and media presentation. A dark/light theme toggle lets users choose their preferred experience, with the choice persisted across sessions.
- Key content should remain prominent: artist name, origin, era, album list, release year, label, sales, certifications, and streaming availability.
- The interface should communicate personality through imagery, layout, and clear sectioning rather than through heavy explanation or complex interactions.
- Management actions (add, edit, delete) should feel like a natural part of the experience, not a bolted-on admin panel.
- Artist avatars should use real photos where available (sourced from Unsplash), with solo artists shown as individuals and groups shown as multiple people; a gradient initials fallback is displayed if the image fails to load.

## What the New App Should Prioritize

- A clear, welcoming landing experience that introduces the catalog
- Easy browsing between artists and albums, with search, filter, and/or sort to manage a large catalog
- A sense of discovery and context around each artist and release
- Strong visual hierarchy so important information is easy to scan
- Smooth, minimal interactions that support browsing rather than distracting from it
- Straightforward, low-friction flows for adding and editing artists and albums

## Suggested Product Positioning

This app should be framed as a stylish digital music catalog that helps users explore and maintain a fictional or curated collection of artists and albums in an engaging, approachable way. It should feel like a blend of a music streaming discovery experience (Amazon Music, Spotify, Apple Music) and a curated showcase, available in both dark and light themes.

## Screenshots and Reference Assets

Screenshots of the current app screens are available and should be treated as reference material for content, data structure, and layout patterns for the new version — not for visual style, which should instead follow the dark mode, streaming-app-inspired direction described above.

Available screenshots:

- Album-Details
- All-Albums
- All-Artists
- Artist-Details-Albums-Hidden
- Artist-Details-Albums-Shown
- Album-Details-Delete-Album
- Artist-Details-Delete-Album

There are no screenshots for add or edit flows, since that functionality is new for this version.
