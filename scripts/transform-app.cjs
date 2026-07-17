const fs = require("fs");

let src = fs.readFileSync(
  "c:/Development/React/figmaMakeCatalogApp/src/app/App.tsx",
  "utf8"
);

// Remove all image import lines
src = src.replace(/^import img\w+ from .*$\r?\n/gm, "");

// Replace react import to include createContext pieces already there; add router + api
src = src.replace(
  `import { useState, useMemo, createContext, useContext, useEffect } from "react";
import { X, ArrowLeft, Search, Plus, Pencil, Trash2, Music, ChevronDown, ChevronUp, Moon, Sun } from "lucide-react";
import { Toaster, toast } from "sonner";`,
  `import React, { useState, useMemo, createContext, useContext, useEffect } from "react";
import { RouterProvider, useNavigate, useLocation } from "react-router";
import { router } from "./routes";
import { X, ArrowLeft, Search, Plus, Pencil, Trash2, Music, ChevronDown, ChevronUp, Moon, Sun } from "lucide-react";
import { Toaster, toast } from "sonner";
import type { Album, Artist, ArtistType, Cert, StreamingPlatform } from "./types";
import * as catalogApi from "./api/catalogApi";
import {
  PHOTO_BY_FILE,
  COVER_BY_FILE,
  FLAG_BY_CODE,
  PLACEHOLDER_PHOTO,
  PLACEHOLDER_COVER,
} from "./assetMaps";`
);

// Remove local type definitions (now in types.ts)
src = src.replace(
  /\/\/ ─── Types ────────────────────────────────────────────────────────────────────\r?\ntype ArtistType[\s\S]*?^}\r?\n\r?\n/m,
  ""
);

// Replace FLAG_MAP with import alias
src = src.replace(
  /const FLAG_MAP: Record<string, string> = \{[\s\S]*?\};/,
  "const FLAG_MAP = FLAG_BY_CODE;"
);

// Remove INITIAL_ARTISTS and INITIAL_ALBUMS
src = src.replace(
  /\/\/ ─── Initial Data ─────────────────────────────────────────────────────────────\r?\nconst INITIAL_ARTISTS: Artist\[\] = \[[\s\S]*?\];\r?\n\r?\nconst INITIAL_ALBUMS: Album\[\] = \[[\s\S]*?\];\r?\n/,
  `// ─── Asset resolution (API stores filenames/keys; UI needs resolved URLs) ─────
const PHOTO_URL_TO_FILE: Record<string, string> = Object.fromEntries(
  Object.entries(PHOTO_BY_FILE).map(([file, url]) => [url, file])
);
const COVER_URL_TO_FILE: Record<string, string> = Object.fromEntries(
  Object.entries(COVER_BY_FILE).map(([file, url]) => [url, file])
);

function resolvePhoto(key: string): string {
  if (!key) return PLACEHOLDER_PHOTO;
  if (PHOTO_BY_FILE[key]) return PHOTO_BY_FILE[key];
  if (key.startsWith("http") || key.startsWith("data:") || key.startsWith("/")) return key;
  return PLACEHOLDER_PHOTO;
}

function resolveCover(key: string): string {
  if (!key) return PLACEHOLDER_COVER;
  if (COVER_BY_FILE[key]) return COVER_BY_FILE[key];
  if (key.startsWith("http") || key.startsWith("data:") || key.startsWith("/")) return key;
  return PLACEHOLDER_COVER;
}

function resolveFlag(countryCode: string, flagKey?: string): string {
  return FLAG_BY_CODE[countryCode] || (flagKey ? FLAG_BY_CODE[flagKey] : undefined) || PLACEHOLDER_PHOTO;
}

function resolveArtist(a: Artist): Artist {
  return {
    ...a,
    photo: resolvePhoto(a.photo),
    flag: resolveFlag(a.countryCode, a.flag),
  };
}

function resolveAlbum(al: Album): Album {
  return {
    ...al,
    cover: resolveCover(al.cover),
    artistPhoto: resolvePhoto(al.artistPhoto),
  };
}

function toApiArtist(a: Artist): catalogApi.ArtistInput {
  const photoKey = PHOTO_URL_TO_FILE[a.photo] || a.photo || "";
  return {
    name: a.name,
    photo: photoKey,
    flag: a.countryCode,
    countryCode: a.countryCode,
    type: a.type,
    groupSize: a.groupSize,
    since: a.since,
  };
}

function toApiAlbum(al: Album): catalogApi.AlbumInput {
  const coverKey = COVER_URL_TO_FILE[al.cover] || al.cover || "";
  return {
    title: al.title,
    artistId: al.artistId,
    label: al.label,
    year: al.year,
    sold: al.sold,
    tracks: al.tracks,
    singles: al.singles,
    cert: al.cert,
    streaming: al.streaming,
    cover: coverKey,
  };
}

`
);

// Replace NavBar to use react-router
src = src.replace(
  /\/\/ ─── NavBar ───────────────────────────────────────────────────────────────────\r?\ninterface NavBarProps \{[\s\S]*?\nfunction NavBar\(\{ activeTab, onTabChange \}: NavBarProps\) \{[\s\S]*?\n\}\r?\n\r?\n\/\/ ─── Artists View/,
  `// ─── NavBar ───────────────────────────────────────────────────────────────────
export function NavBar() {
  const { isDark, toggle } = useTheme();
  const nav = useNavigate();
  const loc = useLocation();
  const activeTab = loc.pathname.startsWith("/albums") ? "albums" : "artists";
  const nb = isDark ? "bg-[rgba(9,9,15,0.85)] border-[rgba(255,255,255,0.08)]" : "bg-[rgba(250,248,244,0.85)] border-[rgba(0,0,0,0.1)]";
  const logo = isDark ? "text-[#f2f2f8]" : "text-[#1c1917]";
  const activeTab_ = isDark ? "bg-[rgba(168,85,247,0.2)] text-[#a855f7]" : "bg-[rgba(147,51,234,0.15)] text-[#9333ea]";
  const inactiveTab = isDark ? "text-[#7070a0] hover:text-[#a8a8c0]" : "text-[#78716c] hover:text-[#1c1917]";
  const toggleBtn = isDark ? "border-[rgba(255,255,255,0.08)] text-[#7070a0] hover:text-[#f2f2f8]" : "border-[rgba(0,0,0,0.1)] text-[#78716c] hover:text-[#1c1917]";
  return (
    <div className={\`backdrop-blur-md w-full shrink-0 border-b sticky top-0 z-40 \${nb}\`}>
      <div className="flex items-center gap-[21px] h-[49px] px-[21px] max-w-[1120px] mx-auto">
        <div className="flex items-center gap-[7px] shrink-0">
          <div className="rounded-[14.5px] size-[38.5px] flex items-center justify-center shrink-0" style={{ background: "linear-gradient(135deg,rgb(142,81,255) 0%,rgb(246,51,154) 100%)" }}>
            <Music className="w-5 h-5 text-white" strokeWidth={1.67} />
          </div>
          <span className={\`text-[21px] tracking-[-0.525px] leading-[28px] whitespace-nowrap \${logo}\`} style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 700 }}>
            Modern Music Catalog
          </span>
        </div>
        <div className="flex items-center gap-[3.5px]">
          {([
            { tab: "artists" as const, path: "/artists" },
            { tab: "albums" as const, path: "/albums" },
          ]).map(({ tab, path }) => (
            <button key={tab} onClick={() => nav(path)}
              className={\`px-[10.5px] py-[5.25px] rounded-[10.5px] text-[12.25px] font-medium capitalize transition-colors \${activeTab === tab ? activeTab_ : inactiveTab}\`}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
        <div className="flex-1" />
        <button onClick={toggle} className={\`flex items-center gap-[7px] px-[11.3px] py-[6.05px] rounded-[10.5px] border text-[12.25px] font-medium transition-colors \${toggleBtn}\`}>
          {isDark ? <Sun className="w-[14px] h-[14px]" /> : <Moon className="w-[14px] h-[14px]" />}
          {isDark ? "Light" : "Dark"}
        </button>
      </div>
    </div>
  );
}

// ─── Artists View`
);

// Fix AddArtistModal to use placeholder keys / FLAG_MAP for display; CatalogProvider will convert
src = src.replace(
  `photo: imgZuriNakamura,
      flag: FLAG_MAP[countryCode] || imgUnitedStates,`,
  `photo: PLACEHOLDER_PHOTO,
      flag: FLAG_MAP[countryCode] || PLACEHOLDER_PHOTO,`
);

src = src.replace(
  `cover: imgDebut,`,
  `cover: PLACEHOLDER_COVER,`
);

// Fix AlbumFormModal cover URL bug - apply coverUrl to cover on submit
// Find the onSubmit call in AlbumFormModal
src = src.replace(
  /onSubmit\(\{[\s\S]*?cover: f\.cover,[\s\S]*?\}\);/,
  (match) => match // leave for now, fix below more carefully
);

function CATALOG_PROVIDER_AND_EXPORTS_FN() {
  return `
// ─── Catalog Context (API-backed) ─────────────────────────────────────────────

interface CatalogContextValue {
  artists: Artist[];
  albums: Album[];
  openAddArtist: () => void;
  openEditArtist: (a: Artist) => void;
  openDeleteArtist: (a: Artist) => void;
  openAddAlbum: (defaultArtistId?: string) => void;
  openEditAlbum: (al: Album) => void;
  openDeleteAlbum: (al: Album) => void;
}

const CatalogContext = createContext<CatalogContextValue | null>(null);

export function useCatalog() {
  const ctx = useContext(CatalogContext);
  if (!ctx) throw new Error("useCatalog must be used inside CatalogProvider");
  return ctx;
}

export function CatalogProvider({ children }: { children: React.ReactNode }) {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const nav = useNavigate();

  const [addArtistOpen, setAddArtistOpen] = useState(false);
  const [editArtist, setEditArtist] = useState<Artist | null>(null);
  const [deleteArtist, setDeleteArtist] = useState<Artist | null>(null);
  const [addAlbumArtistId, setAddAlbumArtistId] = useState<string | null>(null);
  const [editAlbum, setEditAlbum] = useState<Album | null>(null);
  const [deleteAlbum, setDeleteAlbum] = useState<Album | null>(null);

  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem("mmc-theme");
    return saved ? saved === "dark" : true;
  });
  useEffect(() => {
    localStorage.setItem("mmc-theme", isDark ? "dark" : "light");
  }, [isDark]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setLoadError(null);
        const [rawArtists, rawAlbums] = await Promise.all([
          catalogApi.getArtists(),
          catalogApi.getAlbums(),
        ]);
        if (cancelled) return;
        setArtists(rawArtists.map(resolveArtist));
        setAlbums(rawAlbums.map(resolveAlbum));
      } catch (err) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : "Failed to load catalog";
        setLoadError(message);
        toast.error(message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  function openAddArtist() { setAddArtistOpen(true); }
  function openEditArtist(a: Artist) { setEditArtist(a); }
  function openDeleteArtist(a: Artist) { setDeleteArtist(a); }
  function openAddAlbum(defaultArtistId?: string) {
    if (defaultArtistId) setAddAlbumArtistId(defaultArtistId);
  }
  function openEditAlbum(al: Album) { setEditAlbum(al); }
  function openDeleteAlbum(al: Album) { setDeleteAlbum(al); }

  async function handleAddArtist(artist: Artist) {
    try {
      const created = await catalogApi.createArtist(toApiArtist(artist));
      setArtists((as) => [...as, resolveArtist(created)]);
      toast.success(\`\${created.name} added to catalog\`);
      setAddArtistOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add artist");
    }
  }

  async function handleSaveArtist(updated: Artist) {
    try {
      const saved = await catalogApi.updateArtist(updated.id, toApiArtist(updated));
      setArtists((as) => as.map((a) => (a.id === saved.id ? resolveArtist(saved) : a)));
      setAlbums((als) =>
        als.map((al) =>
          al.artistId === saved.id
            ? resolveAlbum({ ...al, artistName: saved.name, artistPhoto: saved.photo })
            : al
        )
      );
      toast.success(\`\${saved.name} updated\`);
      setEditArtist(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update artist");
    }
  }

  async function handleDeleteArtist() {
    if (!deleteArtist) return;
    const id = deleteArtist.id;
    const name = deleteArtist.name;
    try {
      await catalogApi.deleteArtist(id);
      setArtists((as) => as.filter((a) => a.id !== id));
      setAlbums((als) => als.filter((al) => al.artistId !== id));
      toast.success(\`\${name} removed from catalog\`);
      setDeleteArtist(null);
      if (window.location.pathname.startsWith(\`/artists/\${id}\`)) nav("/artists");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete artist");
    }
  }

  async function handleAddAlbum(album: Album) {
    try {
      const created = await catalogApi.createAlbum(toApiAlbum(album));
      setAlbums((als) => [...als, resolveAlbum(created)]);
      toast.success(\`"\${created.title}" added to catalog\`);
      setAddAlbumArtistId(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add album");
    }
  }

  async function handleSaveAlbum(updated: Album) {
    try {
      const saved = await catalogApi.updateAlbum(updated.id, toApiAlbum(updated));
      setAlbums((als) => als.map((al) => (al.id === saved.id ? resolveAlbum(saved) : al)));
      toast.success(\`"\${saved.title}" updated\`);
      setEditAlbum(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update album");
    }
  }

  async function handleDeleteAlbum() {
    if (!deleteAlbum) return;
    const albumId = deleteAlbum.id;
    const artistId = deleteAlbum.artistId;
    const title = deleteAlbum.title;
    try {
      await catalogApi.deleteAlbum(albumId);
      setAlbums((als) => als.filter((al) => al.id !== albumId));
      toast.success(\`"\${title}" removed\`);
      setDeleteAlbum(null);
      if (window.location.pathname === \`/albums/\${albumId}\`) nav(\`/artists/\${artistId}\`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete album");
    }
  }

  const addAlbumArtist = addAlbumArtistId
    ? artists.find((a) => a.id === addAlbumArtistId) ?? null
    : null;

  if (loading) {
    return (
      <ThemeContext.Provider value={{ isDark, toggle: () => setIsDark((v) => !v) }}>
        <div className={\`min-h-screen flex items-center justify-center \${isDark ? "bg-[#09090f] text-[#7070a0]" : "bg-[#faf8f4] text-[#78716c]"}\`}>
          Loading catalog…
        </div>
      </ThemeContext.Provider>
    );
  }

  if (loadError) {
    return (
      <ThemeContext.Provider value={{ isDark, toggle: () => setIsDark((v) => !v) }}>
        <div className={\`min-h-screen flex flex-col items-center justify-center gap-3 px-6 text-center \${isDark ? "bg-[#09090f] text-[#f2f2f8]" : "bg-[#faf8f4] text-[#1c1917]"}\`}>
          <p className="text-lg font-medium">Could not load catalog</p>
          <p className={\`text-sm \${isDark ? "text-[#7070a0]" : "text-[#78716c]"}\`}>{loadError}</p>
          <p className={\`text-sm \${isDark ? "text-[#7070a0]" : "text-[#78716c]"}\`}>Make sure the API is running on VITE_API_URL.</p>
        </div>
      </ThemeContext.Provider>
    );
  }

  return (
    <ThemeContext.Provider value={{ isDark, toggle: () => setIsDark((v) => !v) }}>
      <CatalogContext.Provider
        value={{
          artists,
          albums,
          openAddArtist,
          openEditArtist,
          openDeleteArtist,
          openAddAlbum,
          openEditAlbum,
          openDeleteAlbum,
        }}
      >
        <Toaster position="bottom-right" theme={isDark ? "dark" : "light"} richColors />
        {children}
        {addArtistOpen && (
          <AddArtistModal onClose={() => setAddArtistOpen(false)} onAdd={handleAddArtist} />
        )}
        {editArtist && (
          <EditArtistModal
            artist={editArtist}
            onClose={() => setEditArtist(null)}
            onSave={handleSaveArtist}
          />
        )}
        {deleteArtist && (
          <ConfirmDialog
            title="Delete Artist"
            body={\`Delete "\${deleteArtist.name}" and all of their albums? This cannot be undone.\`}
            image={deleteArtist.photo}
            imageShape="circle"
            onConfirm={handleDeleteArtist}
            onCancel={() => setDeleteArtist(null)}
            isDark={isDark}
          />
        )}
        {addAlbumArtist && (
          <AddAlbumModal
            artistId={addAlbumArtist.id}
            artistName={addAlbumArtist.name}
            artistPhoto={addAlbumArtist.photo}
            onClose={() => setAddAlbumArtistId(null)}
            onAdd={handleAddAlbum}
          />
        )}
        {editAlbum && (
          <EditAlbumModal
            album={editAlbum}
            onClose={() => setEditAlbum(null)}
            onSave={handleSaveAlbum}
          />
        )}
        {deleteAlbum && (
          <ConfirmDialog
            title="Delete Album"
            body={\`Delete "\${deleteAlbum.title}"? This cannot be undone.\`}
            image={deleteAlbum.cover}
            imageShape="square"
            onConfirm={handleDeleteAlbum}
            onCancel={() => setDeleteAlbum(null)}
            isDark={isDark}
          />
        )}
      </CatalogContext.Provider>
    </ThemeContext.Provider>
  );
}

export { ArtistsView, AlbumsView, ArtistDetailView, AlbumDetailView };

export default function App() {
  return <RouterProvider router={router} />;
}
`;
}

const CATALOG_PROVIDER_AND_EXPORTS = CATALOG_PROVIDER_AND_EXPORTS_FN();

// Replace the entire Main App section at the end
const idx = src.lastIndexOf("// ─── Main App");
if (idx < 0) {
  const idx2 = src.lastIndexOf("export default function App");
  if (idx2 < 0) {
    console.error("Could not find Main App section");
    process.exit(1);
  }
  src = src.slice(0, idx2) + CATALOG_PROVIDER_AND_EXPORTS;
} else {
  src = src.slice(0, idx) + CATALOG_PROVIDER_AND_EXPORTS;
}

// Fix AlbumFormModal cover URL bug
src = src.replace(
  `onClick={() => onSubmit(f)}`,
  `onClick={() => onSubmit({ ...f, cover: coverUrl.trim() || f.cover })}`
);

fs.writeFileSync("c:/Development/React/musicCatalogApp/src/app/App.tsx", src);
console.log("Wrote App.tsx, length", src.length);
console.log("has CatalogProvider", src.includes("export function CatalogProvider"));
console.log("has INITIAL", src.includes("INITIAL_ARTISTS"));
console.log("has img import", /import img\w+ from/.test(src));
console.log("has RouterProvider", src.includes("RouterProvider"));
console.log("has cover fix", src.includes("cover: coverUrl.trim()"));
