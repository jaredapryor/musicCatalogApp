import React, { useState, useMemo, createContext, useContext, useEffect } from "react";
import { RouterProvider, useNavigate, useLocation } from "react-router";
import { router } from "./routes";
import { X, ArrowLeft, Search, Plus, Pencil, Trash2, Music, ChevronDown, ChevronUp, Moon, Sun } from "lucide-react";
import { Toaster, toast } from "sonner";
import type { Album, Artist, ArtistType, Cert, PhotoSource, StreamingPlatform } from "./types";
import * as catalogApi from "./api/catalogApi";
import {
  FLAG_BY_CODE,
  PLACEHOLDER_PHOTO,
  LOCAL_PHOTO_OPTIONS,
  DEFAULT_LOCAL_PHOTO,
  LOCAL_COVER_OPTIONS,
  DEFAULT_LOCAL_COVER,
} from "./assetMaps";
import { ArtistAvatar } from "./ArtistAvatar";
import { AlbumCover, resolveAlbumCover } from "./AlbumCover";

// ─── Artist Photo Imports ─────────────────────────────────────────────────────

// ─── Album Cover Imports ──────────────────────────────────────────────────────

// ─── Country / Flag Map ───────────────────────────────────────────────────────
const FLAG_MAP = FLAG_BY_CODE;

const COUNTRY_NAMES: Record<string, string> = {
  AU: "Australia", AR: "Argentina", ZA: "South Africa", RU: "Russia",
  DE: "Germany", NO: "Norway", JP: "Japan", NZ: "New Zealand",
  SE: "Sweden", FR: "France", BE: "Belgium", US: "United States",
  IN: "India", BR: "Brazil", DK: "Denmark", CA: "Canada",
  NL: "Netherlands", UK: "United Kingdom", IE: "Ireland", MX: "Mexico",
  KR: "South Korea", GH: "Ghana",
};

// ─── Theme Context ────────────────────────────────────────────────────────────
interface ThemeCtx { isDark: boolean; toggle: () => void; }
const ThemeContext = createContext<ThemeCtx>({ isDark: true, toggle: () => {} });
const useTheme = () => useContext(ThemeContext);

// Theme-aware class helpers
function t(dark: string, light: string, isDark: boolean) {
  return isDark ? dark : light;
}

// ─── Palette constants ────────────────────────────────────────────────────────
// Used inline via the t() helper
// Dark:  bg #09090f, card #13131c, text #f2f2f8, muted #7070a0, accent #a855f7
// Light: bg #faf8f4, card rgba(255,255,255,0.85), text #1c1917, muted #78716c, accent #9333ea

function imageSource(value?: PhotoSource): PhotoSource {
  return value === "remote" ? "remote" : "local";
}

function resolveFlag(countryCode: string, flagKey?: string): string {
  return FLAG_BY_CODE[countryCode] || (flagKey ? FLAG_BY_CODE[flagKey] : undefined) || PLACEHOLDER_PHOTO;
}

function resolveArtist(a: Artist): Artist {
  return {
    ...a,
    photoSource: imageSource(a.photoSource),
    flag: resolveFlag(a.countryCode, a.flag),
  };
}

function resolveAlbum(al: Album): Album {
  return {
    ...al,
    coverSource: imageSource(al.coverSource),
    artistPhotoSource: imageSource(al.artistPhotoSource),
  };
}

function toApiArtist(a: Artist): catalogApi.ArtistInput {
  return {
    name: a.name,
    photo: a.photo ?? "",
    photoSource: imageSource(a.photoSource),
    flag: a.countryCode,
    countryCode: a.countryCode,
    type: a.type,
    groupSize: a.groupSize,
    since: a.since,
  };
}

function toApiAlbum(al: Album): catalogApi.AlbumInput {
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
    cover: al.cover ?? "",
    coverSource: imageSource(al.coverSource),
  };
}


// ─── Helpers ─────────────────────────────────────────────────────────────────
function sumSold(albumList: Album[]): string {
  const total = albumList.reduce((acc, al) => {
    const raw = al.sold.replace(/,/g, "");
    const n = parseFloat(raw);
    const mult = /[Mm]/i.test(raw) ? 1000 : 1;
    return acc + (isNaN(n) ? 0 : n * mult);
  }, 0);
  if (total >= 1000) return `${(total / 1000).toFixed(1).replace(/\.0$/, "")}M`;
  return `${Math.round(total)}K`;
}

// ─── Shared UI Helpers ────────────────────────────────────────────────────────
function CertBadge({ cert, isDark }: { cert: Cert; isDark: boolean }) {
  if (!cert) return null;
  const color =
    cert === "Platinum" ? "text-[#cad5e2] border-[rgba(202,213,226,0.35)]" :
    cert === "Gold" ? "text-[#fdc700] border-[rgba(253,199,0,0.35)]" :
    "text-[#b9f2ff] border-[rgba(185,242,255,0.35)]";
  const lightColor =
    cert === "Platinum" ? "text-[#6b7280] border-[rgba(107,114,128,0.4)]" :
    cert === "Gold" ? "text-[#b45309] border-[rgba(180,83,9,0.4)]" :
    "text-[#0891b2] border-[rgba(8,145,178,0.4)]";
  return (
    <span className={`inline-flex items-center px-[7.8px] py-[2.55px] border rounded-[3.5px] text-[10.5px] font-semibold tracking-[0.525px] uppercase ${isDark ? color : lightColor}`}>
      {cert}
    </span>
  );
}

function StreamingBadge({ platform }: { platform: StreamingPlatform }) {
  const styles: Record<StreamingPlatform, string> = {
    SP: "bg-[rgba(29,185,84,0.2)] text-[#1db954]",
    AM: "bg-[rgba(252,60,68,0.2)] text-[#fc3c44]",
    AZ: "bg-[rgba(0,168,225,0.2)] text-[#00a8e1]",
  };
  return (
    <span className={`inline-flex items-center px-[5.25px] py-[1.75px] rounded-[3.5px] text-[10.5px] font-bold ${styles[platform]}`}>
      {platform}
    </span>
  );
}

function TypeBadge({ type, groupSize, isDark, artistName, detailMode }: { type: ArtistType; groupSize?: number; isDark: boolean; artistName?: string; detailMode?: boolean }) {
  if (type === "Solo") {
    return (
      <span className={`inline-flex items-center px-[7px] py-[1.75px] rounded-full text-[10.5px] font-medium ${isDark ? "bg-[rgba(246,51,154,0.15)] text-[#fb64b6]" : "bg-[rgba(147,51,234,0.12)] text-[#9333ea]"}`}>
        Solo Artist
      </span>
    );
  }
  const tooltip = groupSize && artistName ? `${groupSize} members in ${artistName}` : undefined;
  const label = detailMode && groupSize ? `${groupSize} members of Group` : "Group";
  return (
    <span title={detailMode ? undefined : tooltip} className={`inline-flex items-center px-[7px] py-[1.75px] rounded-full text-[10.5px] font-medium cursor-default ${isDark ? "bg-[rgba(168,85,247,0.15)] text-[#a855f7]" : "bg-[rgba(147,51,234,0.12)] text-[#9333ea]"}`}>
      {label}
    </span>
  );
}

// Theme-aware select/input shared classes
function inputCls(isDark: boolean) {
  return isDark
    ? "bg-[#1a1a26] border-[rgba(255,255,255,0.08)] text-[#f2f2f8] placeholder:text-[#7070a0] focus:border-[rgba(168,85,247,0.5)]"
    : "bg-[#f0ebe2] border-[rgba(0,0,0,0.1)] text-[#1c1917] placeholder:text-[#78716c] focus:border-[rgba(147,51,234,0.4)]";
}

// ─── Reusable Confirmation Dialog ─────────────────────────────────────────────
interface ConfirmDialogProps {
  title: string;
  body: string;
  confirmLabel?: string;
  image?: string;
  imageShape?: "circle" | "square";
  avatarName?: string;
  avatarPhotoSource?: PhotoSource;
  coverTitle?: string;
  coverSource?: PhotoSource;
  onConfirm: () => void;
  onCancel: () => void;
  isDark: boolean;
}
function ConfirmDialog({ title, body, confirmLabel = "Delete", image, imageShape = "square", avatarName, avatarPhotoSource, coverTitle, coverSource, onConfirm, onCancel, isDark }: ConfirmDialogProps) {
  const card = isDark ? "bg-[#13131c] border-[rgba(255,255,255,0.08)]" : "bg-white border-[rgba(0,0,0,0.1)]";
  const heading = isDark ? "text-[#f2f2f8]" : "text-[#1c1917]";
  const sub = isDark ? "text-[#7070a0]" : "text-[#78716c]";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-[rgba(0,0,0,0.55)]" onClick={onCancel} />
      <div className={`relative border rounded-[14px] w-[360px] p-[21px] shadow-[0px_25px_50px_-12px_rgba(0,0,0,0.7)] ${card}`}>
        {imageShape === "circle" && avatarName ? (
          <div className="mb-[14px]">
            <ArtistAvatar name={avatarName} photo={image ?? ""} photoSource={avatarPhotoSource} sizeClass="size-[64px]" isDark={isDark} />
          </div>
        ) : imageShape === "square" && coverTitle ? (
          <div className="mb-[14px]">
            <AlbumCover title={coverTitle} cover={image ?? ""} coverSource={coverSource} sizeClass="size-[64px]" roundedClass="rounded-[10px]" isDark={isDark} />
          </div>
        ) : image ? (
          <div className={`mb-[14px] overflow-hidden ${imageShape === "circle" ? "rounded-full size-[64px]" : "rounded-[10px] w-[64px] h-[64px]"}`} style={{ background: isDark ? "#1a1a26" : "#f0ebe2" }}>
            <img src={image} alt="" className="w-full h-full object-cover" />
          </div>
        ) : null}
        <h2 className={`text-[17.5px] font-semibold mb-[10px] ${heading}`}>{title}</h2>
        <p className={`text-[12.25px] leading-[18px] mb-[21px] ${sub}`}>{body}</p>
        <div className="flex gap-[10.5px]">
          <button onClick={onCancel} className={`flex-1 py-[10.5px] rounded-[10.5px] border text-[12.25px] font-medium transition-colors ${isDark ? "border-[rgba(255,255,255,0.08)] text-[#7070a0] hover:text-[#f2f2f8]" : "border-[rgba(0,0,0,0.1)] text-[#78716c] hover:text-[#1c1917]"}`}>
            Cancel
          </button>
          <button onClick={onConfirm} className="flex-1 py-[10.5px] rounded-[10.5px] bg-red-600 text-white text-[12.25px] font-medium hover:bg-red-700 transition-colors">
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── NavBar ───────────────────────────────────────────────────────────────────
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
    <div className={`backdrop-blur-md w-full shrink-0 border-b sticky top-0 z-40 ${nb}`}>
      <div className="flex items-center gap-[21px] h-[49px] px-[21px] max-w-[1120px] mx-auto">
        <div className="flex items-center gap-[7px] shrink-0">
          <div className="rounded-[14.5px] size-[38.5px] flex items-center justify-center shrink-0" style={{ background: "linear-gradient(135deg,rgb(142,81,255) 0%,rgb(246,51,154) 100%)" }}>
            <Music className="w-5 h-5 text-white" strokeWidth={1.67} />
          </div>
          <span className={`text-[21px] tracking-[-0.525px] leading-[28px] whitespace-nowrap ${logo}`} style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 700 }}>
            Modern Music Catalog
          </span>
        </div>
        <div className="flex items-center gap-[3.5px]">
          {([
            { tab: "artists" as const, path: "/artists" },
            { tab: "albums" as const, path: "/albums" },
          ]).map(({ tab, path }) => (
            <button key={tab} onClick={() => nav(path)}
              className={`px-[10.5px] py-[5.25px] rounded-[10.5px] text-[12.25px] font-medium capitalize transition-colors ${activeTab === tab ? activeTab_ : inactiveTab}`}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
        <div className="flex-1" />
        <button onClick={toggle} className={`flex items-center gap-[7px] px-[11.3px] py-[6.05px] rounded-[10.5px] border text-[12.25px] font-medium transition-colors ${toggleBtn}`}>
          {isDark ? <Sun className="w-[14px] h-[14px]" /> : <Moon className="w-[14px] h-[14px]" />}
          {isDark ? "Light" : "Dark"}
        </button>
      </div>
    </div>
  );
}

// ─── Artists View ─────────────────────────────────────────────────────────────
interface ArtistsViewProps {
  artists: Artist[];
  albums: Album[];
  onSelectArtist: (id: string) => void;
  onAddArtist: () => void;
  onEditArtist: (artist: Artist) => void;
  onDeleteArtist: (artist: Artist) => void;
}
function ArtistsView({ artists, albums, onSelectArtist, onAddArtist, onEditArtist, onDeleteArtist }: ArtistsViewProps) {
  const { isDark } = useTheme();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"All" | "Solo" | "Group">("All");
  const [countryFilter, setCountryFilter] = useState("All");
  const [sort, setSort] = useState("name-az");

  const countries = useMemo(() => {
    const codes = [...new Set(artists.map((a) => a.countryCode))].sort((a, b) => (COUNTRY_NAMES[a] || a).localeCompare(COUNTRY_NAMES[b] || b));
    return codes;
  }, [artists]);

  const filtered = useMemo(() => {
    let arr = artists.filter((a) => {
      const matchSearch = a.name.toLowerCase().includes(search.toLowerCase());
      const matchType = typeFilter === "All" || a.type === typeFilter;
      const matchCountry = countryFilter === "All" || a.countryCode === countryFilter;
      return matchSearch && matchType && matchCountry;
    });
    const albumCountFor = (id: string) => albums.filter((al) => al.artistId === id).length;
    if (sort === "name-az") arr = [...arr].sort((a, b) => a.name.localeCompare(b.name));
    else if (sort === "name-za") arr = [...arr].sort((a, b) => b.name.localeCompare(a.name));
    else if (sort === "most-albums") arr = [...arr].sort((a, b) => albumCountFor(b.id) - albumCountFor(a.id));
    else if (sort === "oldest") arr = [...arr].sort((a, b) => a.since - b.since);
    else if (sort === "newest") arr = [...arr].sort((a, b) => b.since - a.since);
    return arr;
  }, [artists, albums, search, typeFilter, countryFilter, sort]);

  const albumCountFor = (id: string) => albums.filter((al) => al.artistId === id).length;

  const bg = isDark ? "bg-[#09090f]" : "bg-[#faf8f4]";
  const card = isDark ? "bg-[#13131c] border-[rgba(255,255,255,0.06)] hover:border-[rgba(168,85,247,0.3)]" : "bg-white border-[rgba(0,0,0,0.07)] hover:border-[rgba(147,51,234,0.3)]";
  const heading = isDark ? "text-[#f2f2f8]" : "text-[#1c1917]";
  const muted = isDark ? "text-[#7070a0]" : "text-[#78716c]";
  const divider = isDark ? "border-[rgba(255,255,255,0.04)]" : "border-[rgba(0,0,0,0.05)]";
  const selCls = `w-full border rounded-[10.5px] px-[10.5px] py-[7px] text-[12.25px] font-medium focus:outline-none transition-colors ${inputCls(isDark)}`;

  return (
    <div className={`min-h-screen ${bg}`}>
      <div className="max-w-[1120px] mx-auto px-[21px] py-[28px]">
        <div className="flex items-center justify-between mb-[21px]">
          <div>
            <h1 className={`text-[26.25px] leading-[31.5px] ${heading}`} style={{ fontFamily: "'Playfair Display',Georgia,serif", fontWeight: 700 }}>Artists</h1>
            <p className={`text-[12.25px] font-medium mt-1 ${muted}`}>{filtered.length} of {artists.length} artists</p>
          </div>
          <button onClick={onAddArtist} className="flex items-center gap-[7px] px-[14px] py-[8px] rounded-[10.5px] text-[12.25px] font-medium text-white hover:opacity-90 transition-opacity" style={{ background: "linear-gradient(135deg,rgb(142,81,255) 0%,rgb(246,51,154) 100%)" }}>
            <Plus className="w-[14px] h-[14px]" />
            Add Artist
          </button>
        </div>

        <div className="flex items-center gap-[10.5px] mb-[21px]">
          <div className="relative w-1/3">
            <Search className={`absolute left-[10.5px] top-1/2 -translate-y-1/2 w-[14px] h-[14px] ${muted}`} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search artists..."
              className={`w-full border rounded-[10.5px] pl-[35px] pr-[14px] py-[8px] text-[12.25px] focus:outline-none transition-colors ${inputCls(isDark)}`} />
          </div>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as "All" | "Solo" | "Group")} className={`${selCls} flex-1`}>
            <option value="All">All Types</option>
            <option value="Solo">Solo</option>
            <option value="Group">Group</option>
          </select>
          <select value={countryFilter} onChange={(e) => setCountryFilter(e.target.value)} className={`${selCls} flex-1`}>
            <option value="All">All Countries</option>
            {countries.map((c) => <option key={c} value={c}>{COUNTRY_NAMES[c] || c}</option>)}
          </select>
          <select value={sort} onChange={(e) => setSort(e.target.value)} className={`${selCls} flex-1`}>
            <option value="name-az">Name A→Z</option>
            <option value="name-za">Name Z→A</option>
            <option value="most-albums">Most Albums</option>
            <option value="oldest">Oldest Active</option>
            <option value="newest">Newest Active</option>
          </select>
        </div>

        <div className="grid grid-cols-3 gap-[14px]">
          {filtered.map((artist) => {
            const count = albumCountFor(artist.id);
            const artistAlbums = albums.filter((al) => al.artistId === artist.id);
            const sold = sumSold(artistAlbums);
            return (
              <div key={artist.id} className={`relative border rounded-[14px] p-[17.5px] group cursor-pointer transition-colors ${card}`}
                onClick={() => onSelectArtist(artist.id)}>
                <div className="absolute top-[10px] right-[10px] flex gap-[4px] opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <button
                    onClick={(e) => { e.stopPropagation(); onEditArtist(artist); }}
                    className={`p-[5px] rounded-[8px] ${isDark ? "bg-[rgba(255,255,255,0.06)] text-[#7070a0] hover:text-[#a855f7] hover:bg-[rgba(168,85,247,0.15)]" : "bg-[rgba(0,0,0,0.04)] text-[#78716c] hover:text-[#9333ea] hover:bg-[rgba(147,51,234,0.1)]"}`}>
                    <Pencil className="w-[13px] h-[13px]" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onDeleteArtist(artist); }}
                    className={`p-[5px] rounded-[8px] ${isDark ? "bg-[rgba(255,255,255,0.06)] text-[#7070a0] hover:text-red-400 hover:bg-[rgba(239,68,68,0.15)]" : "bg-[rgba(0,0,0,0.04)] text-[#78716c] hover:text-red-500 hover:bg-[rgba(239,68,68,0.1)]"}`}>
                    <Trash2 className="w-[13px] h-[13px]" />
                  </button>
                </div>
                <div className="flex items-start gap-[14px]">
                  <ArtistAvatar name={artist.name} photo={artist.photo} photoSource={artist.photoSource} sizeClass="size-[70px]" isDark={isDark} />
                  <div className="flex-1 min-w-0 pr-[24px]">
                    <p className={`text-[14px] font-semibold leading-[1.3] truncate ${heading}`}>{artist.name}</p>
                    <div className="flex items-center gap-[5.25px] mt-[5.25px]">
                      <div title={COUNTRY_NAMES[artist.countryCode] || artist.countryCode} className="rounded-[3.5px] overflow-hidden w-[24px] h-[16px] shrink-0 border border-[rgba(128,128,128,0.2)] cursor-default">
                        <img src={artist.flag} alt={artist.countryCode} className="w-full h-full object-cover" />
                      </div>
                      <span className={`text-[10.5px] font-semibold tracking-[0.525px] ${muted}`}>{artist.countryCode}</span>
                    </div>
                    <div className="mt-[7px]"><TypeBadge type={artist.type} groupSize={artist.groupSize} isDark={isDark} artistName={artist.name} /></div>
                  </div>
                </div>
                <div className={`flex items-center justify-between mt-[14px] pt-[10.5px] border-t ${divider}`}>
                  <span className={`text-[10.5px] font-medium ${muted}`}>Since {artist.since}</span>
                  <span className={`text-[10.5px] font-medium flex items-center gap-[4px] ${muted}`}>
                    <Music className="w-[11px] h-[11px]" />
                    {count} {count === 1 ? "album" : "albums"} · {sold} sold
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Albums View ──────────────────────────────────────────────────────────────
interface AlbumsViewProps {
  albums: Album[];
  onSelectAlbum: (id: string) => void;
  onEditAlbum: (album: Album) => void;
  onDeleteAlbum: (album: Album) => void;
}
function AlbumsView({ albums, onSelectAlbum, onEditAlbum, onDeleteAlbum }: AlbumsViewProps) {
  const { isDark } = useTheme();
  const [search, setSearch] = useState("");
  const [certFilter, setCertFilter] = useState("All");
  const [streamFilter, setStreamFilter] = useState("All");
  const [sort, setSort] = useState("title-az");

  const filtered = useMemo(() => {
    let arr = albums.filter((al) => {
      const q = search.toLowerCase();
      const matchSearch = !search || al.title.toLowerCase().includes(q) || al.artistName.toLowerCase().includes(q);
      const matchCert = certFilter === "All" || (certFilter === "None" ? !al.cert : al.cert === certFilter);
      const matchStream = streamFilter === "All" || al.streaming.includes(streamFilter as StreamingPlatform);
      return matchSearch && matchCert && matchStream;
    });
    if (sort === "title-az") arr = [...arr].sort((a, b) => a.title.localeCompare(b.title));
    else if (sort === "year-new") arr = [...arr].sort((a, b) => b.year - a.year);
    else if (sort === "year-old") arr = [...arr].sort((a, b) => a.year - b.year);
    return arr;
  }, [albums, search, certFilter, streamFilter, sort]);

  const bg = isDark ? "bg-[#09090f]" : "bg-[#faf8f4]";
  const heading = isDark ? "text-[#f2f2f8]" : "text-[#1c1917]";
  const muted = isDark ? "text-[#7070a0]" : "text-[#78716c]";
  const card = isDark ? "bg-[#13131c] hover:bg-[rgba(255,255,255,0.03)]" : "bg-white hover:bg-[rgba(0,0,0,0.01)]";
  const selCls = `border rounded-[10.5px] px-[10.5px] py-[7px] text-[12.25px] font-medium focus:outline-none transition-colors ${inputCls(isDark)}`;

  return (
    <div className={`min-h-screen ${bg}`}>
      <div className="max-w-[1120px] mx-auto px-[21px] py-[28px]">
        <div className="flex items-center justify-between mb-[21px] gap-[14px] flex-wrap">
          <div>
            <h1 className={`text-[26.25px] leading-[31.5px] ${heading}`} style={{ fontFamily: "'Playfair Display',Georgia,serif", fontWeight: 700 }}>Albums</h1>
            <p className={`text-[12.25px] font-medium mt-1 ${muted}`}>{filtered.length} of {albums.length} albums</p>
          </div>
          <div className="flex items-center gap-[10.5px] flex-wrap">
            <div className="relative">
              <Search className={`absolute left-[10.5px] top-1/2 -translate-y-1/2 w-[14px] h-[14px] ${muted}`} />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search albums..."
                className={`border rounded-[10.5px] pl-[35px] pr-[14px] py-[7px] text-[12.25px] w-[220px] focus:outline-none transition-colors ${inputCls(isDark)}`} />
            </div>
            <select value={certFilter} onChange={(e) => setCertFilter(e.target.value)} className={selCls}>
              <option value="All">All Certifications</option>
              <option value="None">Uncertified</option>
              <option value="Gold">Gold</option>
              <option value="Platinum">Platinum</option>
              <option value="Diamond">Diamond</option>
            </select>
            <select value={streamFilter} onChange={(e) => setStreamFilter(e.target.value)} className={selCls}>
              <option value="All">All Platforms</option>
              <option value="SP">Spotify</option>
              <option value="AM">Apple Music</option>
              <option value="AZ">Amazon Music</option>
            </select>
            <select value={sort} onChange={(e) => setSort(e.target.value)} className={selCls}>
              <option value="title-az">Title A→Z</option>
              <option value="year-new">Year: Newest</option>
              <option value="year-old">Year: Oldest</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-[14px]">
          {filtered.map((album) => (
            <div key={album.id} className={`relative rounded-[14px] overflow-hidden transition-colors group ${card} ${isDark ? "border border-[rgba(255,255,255,0.05)]" : "border border-[rgba(0,0,0,0.06)]"}`}>
              <button onClick={() => onSelectAlbum(album.id)} className="w-full text-left">
                <div className="aspect-square overflow-hidden">
                  <AlbumCover
                    title={album.title}
                    cover={album.cover}
                    coverSource={album.coverSource}
                    sizeClass="w-full h-full"
                    roundedClass="rounded-none"
                    isDark={isDark}
                    imgClassName="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-[12px]">
                  <p className={`text-[12.25px] font-semibold leading-[1.3] truncate ${isDark ? "text-[#f2f2f8]" : "text-[#1c1917]"}`}>{album.title}</p>
                  <p className={`text-[10.5px] font-medium mt-[2px] truncate ${muted}`}>{album.artistName}</p>
                  <div className="flex items-center gap-[5px] mt-[7px] flex-wrap">
                    <span className={`text-[10px] ${muted}`}>{album.year}</span>
                    {album.cert && <CertBadge cert={album.cert} isDark={isDark} />}
                  </div>
                  <div className="flex gap-[4px] mt-[5px] flex-wrap">
                    {album.streaming.map((s) => <StreamingBadge key={s} platform={s} />)}
                  </div>
                </div>
              </button>
              <div className="absolute top-[8px] right-[8px] flex gap-[4px] opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <button onClick={(e) => { e.stopPropagation(); onEditAlbum(album); }}
                  className={`p-[5px] rounded-[8px] ${isDark ? "bg-[rgba(9,9,15,0.7)] text-[#a8a8c0] hover:text-[#a855f7] hover:bg-[rgba(168,85,247,0.2)]" : "bg-[rgba(250,248,244,0.85)] text-[#78716c] hover:text-[#9333ea] hover:bg-[rgba(147,51,234,0.1)]"}`}>
                  <Pencil className="w-[13px] h-[13px]" />
                </button>
                <button onClick={(e) => { e.stopPropagation(); onDeleteAlbum(album); }}
                  className={`p-[5px] rounded-[8px] ${isDark ? "bg-[rgba(9,9,15,0.7)] text-[#a8a8c0] hover:text-red-400 hover:bg-[rgba(239,68,68,0.2)]" : "bg-[rgba(250,248,244,0.85)] text-[#78716c] hover:text-red-500 hover:bg-[rgba(239,68,68,0.1)]"}`}>
                  <Trash2 className="w-[13px] h-[13px]" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Artist Detail View ───────────────────────────────────────────────────────
interface ArtistDetailViewProps {
  artist: Artist;
  albums: Album[];
  onBack: () => void;
  onSelectAlbum: (id: string) => void;
  onAddAlbum: () => void;
  onEditAlbum: (album: Album) => void;
  onDeleteAlbum: (album: Album) => void;
  onEditArtist: () => void;
  onDeleteArtist: () => void;
}
function ArtistDetailView({ artist, albums, onBack, onSelectAlbum, onAddAlbum, onEditAlbum, onDeleteAlbum, onEditArtist, onDeleteArtist }: ArtistDetailViewProps) {
  const { isDark } = useTheme();
  const [albumsOpen, setAlbumsOpen] = useState(true);
  const artistAlbums = albums.filter((a) => a.artistId === artist.id);

  const bg = isDark ? "bg-[#09090f]" : "bg-[#faf8f4]";
  const card = isDark ? "bg-[#13131c] border-[rgba(255,255,255,0.08)]" : "bg-white border-[rgba(0,0,0,0.08)]";
  const heading = isDark ? "text-[#f2f2f8]" : "text-[#1c1917]";
  const muted = isDark ? "text-[#7070a0]" : "text-[#78716c]";
  const divider = isDark ? "border-[rgba(255,255,255,0.04)]" : "border-[rgba(0,0,0,0.05)]";
  const btnGhost = isDark ? "border-[rgba(255,255,255,0.08)] text-[#7070a0] hover:text-[#f2f2f8] hover:border-[rgba(255,255,255,0.16)]" : "border-[rgba(0,0,0,0.1)] text-[#78716c] hover:text-[#1c1917]";

  return (
    <div className={`min-h-screen ${bg}`}>
      <div className="max-w-[896px] mx-auto px-[21px] py-[21px]">
        <button onClick={onBack} className={`flex items-center gap-[7px] text-[12.25px] font-medium hover:opacity-80 transition-opacity mb-[21px] ${muted}`}>
          <ArrowLeft className="w-[15px] h-[15px]" />
          Back to Artists
        </button>

        <div className={`border rounded-[14px] p-[21.8px] ${card}`}>
          <div className="flex items-start gap-[17.5px]">
            <ArtistAvatar name={artist.name} photo={artist.photo} photoSource={artist.photoSource} sizeClass="size-[202px]" shape="rounded-square" isDark={isDark} />
            <div className="flex-1 min-w-0">
              <h1 className={`text-[26.25px] leading-[31.5px] ${heading}`} style={{ fontFamily: "'Playfair Display',Georgia,serif", fontWeight: 700 }}>{artist.name}</h1>
              <div className="flex items-center gap-[10.5px] mt-[7px] flex-wrap">
                <div className="flex items-center gap-[5.25px]">
                  <div className="rounded-[3.5px] overflow-hidden w-[35px] h-[21px] border border-[rgba(128,128,128,0.2)]">
                    <img src={artist.flag} alt={artist.countryCode} className="w-full h-full object-cover" />
                  </div>
                  <span className={`text-[10.5px] font-semibold tracking-[0.525px] ${muted}`}>{COUNTRY_NAMES[artist.countryCode] || artist.countryCode}</span>
                </div>
                <TypeBadge type={artist.type} groupSize={artist.groupSize} isDark={isDark} artistName={artist.name} detailMode />
                <span className={`inline-flex items-center px-[7px] py-[1.75px] rounded-full text-[10.5px] font-normal ${isDark ? "bg-[#1e1e2e] text-[#7070a0]" : "bg-[#f0ebe2] text-[#78716c]"}`}>
                  Active since {artist.since}
                </span>
                <span className={`inline-flex items-center gap-[3.5px] px-[7px] py-[1.75px] rounded-full text-[10.5px] font-normal ${isDark ? "bg-[#1e1e2e] text-[#7070a0]" : "bg-[#f0ebe2] text-[#78716c]"}`}>
                  <Music className="w-[11px] h-[11px]" /> {artistAlbums.length} {artistAlbums.length === 1 ? "album" : "albums"}
                </span>
                <span className={`inline-flex items-center px-[7px] py-[1.75px] rounded-full text-[10.5px] font-normal ${isDark ? "bg-[#1e1e2e] text-[#7070a0]" : "bg-[#f0ebe2] text-[#78716c]"}`}>
                  {sumSold(artistAlbums)} sold
                </span>
              </div>
            </div>
            <div className="flex items-center gap-[7px] shrink-0">
              <button onClick={onEditArtist} className={`flex items-center gap-[5.25px] px-[11.3px] py-[7.8px] rounded-[10.5px] border text-[10.5px] font-medium transition-colors ${btnGhost}`}>
                <Pencil className="w-[12px] h-[12px]" />
                Edit Artist
              </button>
              <button onClick={onDeleteArtist} className="flex items-center gap-[5.25px] px-[11.3px] py-[7.8px] rounded-[10.5px] border border-[rgba(239,68,68,0.3)] text-red-500 text-[10.5px] font-medium hover:bg-[rgba(239,68,68,0.1)] transition-colors">
                <Trash2 className="w-[12px] h-[12px]" />
                Delete Artist
              </button>
            </div>
          </div>
        </div>

        <div className={`border rounded-[14px] mt-[21px] overflow-hidden ${card}`}>
          <div className={`flex items-center justify-between px-[17.5px] py-[14.8px] border-b ${divider}`}>
            <button onClick={() => setAlbumsOpen((v) => !v)} className={`flex items-center gap-[7px] text-[14px] font-semibold leading-[21px] ${heading}`}>
              Albums {albumsOpen ? <ChevronUp className={`w-[16px] h-[16px] ${muted}`} /> : <ChevronDown className={`w-[16px] h-[16px] ${muted}`} />}
            </button>
            <button onClick={onAddAlbum} className={`flex items-center gap-[5.25px] px-[10.5px] py-[5.25px] rounded-[10.5px] text-[10.5px] font-medium transition-colors ${isDark ? "bg-[rgba(168,85,247,0.2)] text-[#a855f7] hover:bg-[rgba(168,85,247,0.3)]" : "bg-[rgba(147,51,234,0.12)] text-[#9333ea] hover:bg-[rgba(147,51,234,0.2)]"}`}>
              <Plus className="w-[12px] h-[12px]" />
              Add Album
            </button>
          </div>

          {albumsOpen && artistAlbums.map((album, i) => (
            <div key={album.id} className={`flex items-center gap-[14px] px-[17.5px] py-[14px] ${i < artistAlbums.length - 1 ? `border-b ${divider}` : ""}`}>
              <button onClick={() => onSelectAlbum(album.id)} className="flex items-center gap-[14px] flex-1 min-w-0 text-left hover:opacity-80 transition-opacity">
                <AlbumCover
                  title={album.title}
                  cover={album.cover}
                  coverSource={album.coverSource}
                  sizeClass="size-[56px]"
                  roundedClass="rounded-[10.5px]"
                  isDark={isDark}
                />
                <div className="flex-1 min-w-0">
                  <p className={`text-[12.25px] font-semibold leading-[17.5px] truncate ${heading}`}>{album.title}</p>
                  <p className={`text-[10.5px] font-medium mt-[1.75px] ${muted}`}>{album.label} · {album.year}</p>
                  <div className="flex items-center gap-[7px] mt-[5.25px] flex-wrap">
                    <span className={`text-[10.5px] font-medium ${muted}`}>{album.sold} sold</span>
                    <span className={`text-[10.5px] ${muted}`}>·</span>
                    <span className={`text-[10.5px] font-medium ${muted}`}>{album.tracks} tracks</span>
                    {album.cert && <CertBadge cert={album.cert} isDark={isDark} />}
                    <div className="flex gap-[5.25px]">{album.streaming.map((s) => <StreamingBadge key={s} platform={s} />)}</div>
                  </div>
                </div>
              </button>
              <div className="flex items-center gap-[5.25px] shrink-0">
                <button onClick={(e) => { e.stopPropagation(); onEditAlbum(album); }} className={`p-[6.05px] rounded-[10.5px] border transition-colors ${isDark ? "border-[rgba(255,255,255,0.04)] text-[#7070a0] hover:text-[#a855f7] hover:border-[rgba(168,85,247,0.3)]" : "border-[rgba(0,0,0,0.06)] text-[#78716c] hover:text-[#9333ea]"}`}>
                  <Pencil className="w-[12px] h-[12px]" />
                </button>
                <button onClick={(e) => { e.stopPropagation(); onDeleteAlbum(album); }} className={`p-[6.05px] rounded-[10.5px] border transition-colors ${isDark ? "border-[rgba(255,255,255,0.04)] text-[#7070a0] hover:text-red-400" : "border-[rgba(0,0,0,0.06)] text-[#78716c] hover:text-red-500"}`}>
                  <Trash2 className="w-[12px] h-[12px]" />
                </button>
              </div>
            </div>
          ))}

          {albumsOpen && artistAlbums.length === 0 && (
            <div className={`py-[35px] text-center text-[12.25px] ${muted}`}>No albums yet. Add one to get started.</div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Album Detail View ────────────────────────────────────────────────────────
interface AlbumDetailViewProps {
  album: Album;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onGoToArtist: () => void;
}
function AlbumDetailView({ album, onBack, onEdit, onDelete, onGoToArtist }: AlbumDetailViewProps) {
  const { isDark } = useTheme();
  const bg = isDark ? "bg-[#09090f]" : "bg-[#faf8f4]";
  const heading = isDark ? "text-[#f2f2f8]" : "text-[#1c1917]";
  const muted = isDark ? "text-[#7070a0]" : "text-[#78716c]";
  const metaCard = isDark ? "bg-[rgba(19,19,28,0.7)] border-[rgba(255,255,255,0.04)]" : "bg-[rgba(255,255,255,0.7)] border-[rgba(0,0,0,0.05)]";
  const accent = isDark ? "text-[#a855f7]" : "text-[#9333ea]";
  const resolvedCover = resolveAlbumCover(album.cover, album.coverSource);

  return (
    <div className={`relative min-h-screen ${bg}`}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {resolvedCover && (
          <img src={resolvedCover} alt="" className="absolute w-full h-full object-cover opacity-20 blur-[70px] scale-110" />
        )}
        <div className={`absolute inset-0 ${isDark ? "bg-[rgba(9,9,15,0.7)]" : "bg-[rgba(250,248,244,0.75)]"}`} />
      </div>
      <div className="relative max-w-[784px] mx-auto px-[21px] pt-[21px] pb-[42px]">
        <button onClick={onBack} className={`flex items-center gap-[7px] text-[12.25px] font-medium hover:opacity-80 transition-opacity ${muted}`}>
          <ArrowLeft className="w-[15px] h-[15px]" />
          Back
        </button>
        <div className="flex items-start gap-[28px] mt-[28px]">
          <AlbumCover
            title={album.title}
            cover={album.cover}
            coverSource={album.coverSource}
            sizeClass="size-[224px]"
            roundedClass="rounded-[14px]"
            className="shadow-[0px_25px_50px_-12px_rgba(0,0,0,0.5)]"
            isDark={isDark}
          />
          <div className="flex-1 min-w-0">
            <p className={`text-[15.75px] font-semibold tracking-[1.575px] uppercase ${accent}`}>Album</p>
            <h1 className={`text-[31.5px] leading-[39.375px] mt-[7px] ${heading}`} style={{ fontFamily: "'Playfair Display',Georgia,serif", fontWeight: 700 }}>{album.title}</h1>
            <button onClick={onGoToArtist} className="flex items-center gap-[7px] mt-[10.5px] group/artist hover:opacity-80 transition-opacity">
              <ArtistAvatar name={album.artistName} photo={album.artistPhoto} photoSource={album.artistPhotoSource} sizeClass="size-[42px]" isDark={isDark} />
              <span className={`text-[15.75px] font-medium group-hover/artist:underline underline-offset-2 ${heading}`}>{album.artistName}</span>
            </button>
            <div className="grid grid-cols-2 gap-[10.5px] mt-[17.5px]">
              {[
                { label: "Record Label", value: album.label },
                { label: "Release Year", value: String(album.year) },
                { label: "Albums Sold", value: album.sold },
                { label: "Tracks / Singles", value: `${album.tracks} / ${album.singles}` },
              ].map(({ label, value }) => (
                <div key={label} className={`border rounded-[14.5px] p-[11.3px] ${metaCard}`}>
                  <p className={`text-[10.5px] font-normal leading-[14px] ${muted}`}>{label}</p>
                  <p className={`text-[12.25px] font-medium leading-[17.5px] mt-[3.5px] ${heading}`}>{value}</p>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-[10.5px] mt-[17.5px]">
              {album.cert && <CertBadge cert={album.cert} isDark={isDark} />}
              <div className="flex gap-[5.25px]">{album.streaming.map((s) => <StreamingBadge key={s} platform={s} />)}</div>
            </div>
            <div className="flex items-center gap-[10.5px] mt-[21px]">
              <button onClick={onEdit} className={`flex items-center gap-[7px] px-[14px] py-[7px] rounded-[14.5px] text-[12.25px] font-medium transition-colors ${isDark ? "bg-[#1e1e2e] text-[#c4c4d4] hover:bg-[#252535]" : "bg-[#f0ebe2] text-[#44403c] hover:bg-[#e5dfd6]"}`}>
                <Pencil className="w-[14px] h-[14px]" />
                Edit Album
              </button>
              <button onClick={onDelete} className="flex items-center gap-[7px] px-[14px] py-[7px] bg-[rgba(239,68,68,0.15)] rounded-[14.5px] text-red-500 text-[12.25px] font-medium hover:bg-[rgba(239,68,68,0.25)] transition-colors">
                <Trash2 className="w-[14px] h-[14px]" />
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Add Artist Modal ─────────────────────────────────────────────────────────
interface AddArtistModalProps { onClose: () => void; onAdd: (artist: Artist) => void; }
function AddArtistModal({ onClose, onAdd }: AddArtistModalProps) {
  const { isDark } = useTheme();
  const [name, setName] = useState("");
  const [countryCode, setCountryCode] = useState("US");
  const [type, setType] = useState<ArtistType>("Solo");
  const [groupSize, setGroupSize] = useState("4");
  const [since, setSince] = useState(String(new Date().getFullYear()));
  const [photoSource, setPhotoSource] = useState<PhotoSource>("local");
  const [localPhoto, setLocalPhoto] = useState(DEFAULT_LOCAL_PHOTO);
  const [remotePhoto, setRemotePhoto] = useState("");

  const handleAdd = () => {
    if (!name.trim() || !since.trim()) return;
    const photo = photoSource === "local" ? localPhoto : remotePhoto.trim();
    onAdd({
      id: name.toLowerCase().replace(/\s+/g, "-") + "-" + Date.now(),
      name: name.trim(),
      photo,
      photoSource,
      flag: FLAG_MAP[countryCode] || FLAG_MAP.US,
      countryCode,
      type,
      groupSize: type === "Group" ? parseInt(groupSize) || undefined : undefined,
      since: parseInt(since) || new Date().getFullYear(),
    });
    onClose();
  };

  return (
    <ArtistFormModal
      title="Add Artist"
      isDark={isDark}
      name={name}
      setName={setName}
      countryCode={countryCode}
      setCountryCode={setCountryCode}
      type={type}
      setType={setType}
      groupSize={groupSize}
      setGroupSize={setGroupSize}
      since={since}
      setSince={setSince}
      photoSource={photoSource}
      setPhotoSource={setPhotoSource}
      localPhoto={localPhoto}
      setLocalPhoto={setLocalPhoto}
      remotePhoto={remotePhoto}
      setRemotePhoto={setRemotePhoto}
      onClose={onClose}
      onSubmit={handleAdd}
      submitLabel="Add Artist"
    />
  );
}

// ─── Edit Artist Modal ────────────────────────────────────────────────────────
interface EditArtistModalProps { artist: Artist; onClose: () => void; onSave: (updated: Artist) => void; }
function EditArtistModal({ artist, onClose, onSave }: EditArtistModalProps) {
  const { isDark } = useTheme();
  const [name, setName] = useState(artist.name);
  const [countryCode, setCountryCode] = useState(artist.countryCode);
  const [type, setType] = useState<ArtistType>(artist.type);
  const [groupSize, setGroupSize] = useState(String(artist.groupSize || 4));
  const [since, setSince] = useState(String(artist.since));
  const [photoSource, setPhotoSource] = useState<PhotoSource>(artist.photoSource ?? "local");
  const [localPhoto, setLocalPhoto] = useState(
    artist.photoSource === "remote" ? DEFAULT_LOCAL_PHOTO : (artist.photo ?? "")
  );
  const [remotePhoto, setRemotePhoto] = useState(
    artist.photoSource === "remote" ? artist.photo : ""
  );

  const handleSave = () => {
    if (!name.trim() || !since.trim()) return;
    const photo = photoSource === "local" ? localPhoto : remotePhoto.trim();
    onSave({
      ...artist,
      name: name.trim(),
      photo,
      photoSource,
      flag: FLAG_MAP[countryCode] || artist.flag,
      countryCode,
      type,
      groupSize: type === "Group" ? parseInt(groupSize) || undefined : undefined,
      since: parseInt(since) || artist.since,
    });
    onClose();
  };

  return (
    <ArtistFormModal
      title="Edit Artist"
      isDark={isDark}
      name={name}
      setName={setName}
      countryCode={countryCode}
      setCountryCode={setCountryCode}
      type={type}
      setType={setType}
      groupSize={groupSize}
      setGroupSize={setGroupSize}
      since={since}
      setSince={setSince}
      photoSource={photoSource}
      setPhotoSource={setPhotoSource}
      localPhoto={localPhoto}
      setLocalPhoto={setLocalPhoto}
      remotePhoto={remotePhoto}
      setRemotePhoto={setRemotePhoto}
      onClose={onClose}
      onSubmit={handleSave}
      submitLabel="Save Changes"
    />
  );
}

// Shared Artist form component
interface ArtistFormModalProps {
  title: string; isDark: boolean;
  name: string; setName: (v: string) => void;
  countryCode: string; setCountryCode: (v: string) => void;
  type: ArtistType; setType: (v: ArtistType) => void;
  groupSize: string; setGroupSize: (v: string) => void;
  since: string; setSince: (v: string) => void;
  photoSource: PhotoSource; setPhotoSource: (v: PhotoSource) => void;
  localPhoto: string; setLocalPhoto: (v: string) => void;
  remotePhoto: string; setRemotePhoto: (v: string) => void;
  onClose: () => void; onSubmit: () => void; submitLabel: string;
}
function ArtistFormModal({
  title, isDark, name, setName, countryCode, setCountryCode, type, setType,
  groupSize, setGroupSize, since, setSince, photoSource, setPhotoSource,
  localPhoto, setLocalPhoto, remotePhoto, setRemotePhoto, onClose, onSubmit, submitLabel,
}: ArtistFormModalProps) {
  const card = isDark ? "bg-[#13131c] border-[rgba(255,255,255,0.08)]" : "bg-white border-[rgba(0,0,0,0.1)]";
  const heading = isDark ? "text-[#f2f2f8]" : "text-[#1c1917]";
  const muted = isDark ? "text-[#7070a0]" : "text-[#78716c]";
  const labelCls = `block text-[12.25px] font-medium mb-[5.25px] ${heading}`;
  const inp = `w-full border rounded-[7px] px-[10.5px] py-[8.75px] text-[12.25px] focus:outline-none transition-colors ${inputCls(isDark)}`;
  const previewFlag = FLAG_MAP[countryCode];
  const previewPhoto = photoSource === "local" ? localPhoto : remotePhoto.trim();
  const accent = isDark ? "#a855f7" : "#9333ea";
  const sourceBtn = isDark
    ? "border-[rgba(255,255,255,0.08)] text-[#7070a0] hover:text-[#f2f2f8]"
    : "border-[rgba(0,0,0,0.1)] text-[#78716c] hover:text-[#1c1917]";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto py-[21px]">
      <div className="absolute inset-0 bg-[rgba(0,0,0,0.55)]" onClick={onClose} />
      <div className={`relative border rounded-[14px] w-[420px] p-[21px] shadow-[0px_25px_50px_-12px_rgba(0,0,0,0.8)] ${card}`}>
        <div className="flex items-center justify-between mb-[17.5px]">
          <h2 className={`text-[17.5px] font-semibold ${heading}`}>{title}</h2>
          <button onClick={onClose} className={`${isDark ? "text-[#7070a0] hover:text-[#f2f2f8]" : "text-[#78716c] hover:text-[#1c1917]"} transition-colors`}><X className="w-[17.5px] h-[17.5px]" /></button>
        </div>
        <div className="space-y-[14px]">
          <div>
            <label className={labelCls}>Artist Name <span style={{ color: accent }}>*</span></label>
            <input value={name} onChange={(e) => setName(e.target.value)} className={inp} />
          </div>
          <div>
            <label className={labelCls}>Artist Photo</label>
            <div className="flex items-center gap-[10px]">
              <button
                type="button"
                onClick={() => setPhotoSource(photoSource === "local" ? "remote" : "local")}
                className={`shrink-0 flex items-center px-[11.3px] py-[8.75px] rounded-[10.5px] border text-[12.25px] font-medium transition-colors ${sourceBtn}`}
              >
                {photoSource === "local" ? "Local" : "Remote"}
              </button>
              {photoSource === "local" ? (
                <select value={localPhoto} onChange={(e) => setLocalPhoto(e.target.value)} className={`${inp} flex-1`}>
                  <option value="">None</option>
                  {LOCAL_PHOTO_OPTIONS.map((opt) => (
                    <option key={opt.file} value={opt.file}>{opt.label}</option>
                  ))}
                </select>
              ) : (
                <input
                  value={remotePhoto}
                  onChange={(e) => setRemotePhoto(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className={`${inp} flex-1`}
                />
              )}
              <ArtistAvatar
                name={name.trim() || "Artist"}
                photo={previewPhoto}
                photoSource={photoSource}
                sizeClass="size-[80px]"
                shape="square"
                isDark={isDark}
              />
            </div>
            {photoSource === "remote" && (
              <p className={`text-[10.5px] mt-[5px] ${muted}`}>Paste an image URL. If it fails to load, initials are shown.</p>
            )}
          </div>
          <div>
            <label className={labelCls}>Country</label>
            <div className="flex items-center gap-[10px]">
              <select value={countryCode} onChange={(e) => setCountryCode(e.target.value)} className={`${inp} flex-1`}>
                {Object.keys(COUNTRY_NAMES).sort((a, b) => COUNTRY_NAMES[a].localeCompare(COUNTRY_NAMES[b])).map((c) => (
                  <option key={c} value={c}>{COUNTRY_NAMES[c]}</option>
                ))}
              </select>
              {previewFlag && (
                <div className="rounded-[4px] overflow-hidden w-[36px] h-[24px] shrink-0 border border-[rgba(128,128,128,0.2)]">
                  <img src={previewFlag} alt={countryCode} className="w-full h-full object-cover" />
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-[10.5px]">
            <div className="flex-1">
              <label className={labelCls}>Type</label>
              <select value={type} onChange={(e) => setType(e.target.value as ArtistType)} className={inp}>
                <option value="Solo">Solo</option>
                <option value="Group">Group</option>
              </select>
            </div>
            {type === "Group" && (
              <div className="w-[90px]">
                <label className={labelCls}>Members</label>
                <input value={groupSize} onChange={(e) => setGroupSize(e.target.value)} className={inp} type="number" min="2" />
              </div>
            )}
            <div className="w-[100px]">
              <label className={labelCls}>Active Since <span style={{ color: accent }}>*</span></label>
              <input value={since} onChange={(e) => setSince(e.target.value)} className={inp} />
            </div>
          </div>
        </div>
        <div className="flex gap-[10.5px] mt-[21px]">
          <button onClick={onClose} className={`flex-1 py-[10.5px] rounded-[10.5px] border text-[12.25px] font-medium transition-colors ${isDark ? "border-[rgba(255,255,255,0.08)] text-[#7070a0] hover:text-[#f2f2f8]" : "border-[rgba(0,0,0,0.1)] text-[#78716c] hover:text-[#1c1917]"}`}>Cancel</button>
          <button onClick={onSubmit} disabled={!name.trim() || !since.trim()} className="flex-1 py-[10.5px] rounded-[10.5px] text-white text-[12.25px] font-medium disabled:opacity-40 transition-opacity" style={{ background: "linear-gradient(135deg,rgb(142,81,255) 0%,rgb(246,51,154) 100%)" }}>
            {submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Add Album Modal ──────────────────────────────────────────────────────────
interface AddAlbumModalProps {
  artistId: string; artistName: string; artistPhoto: string; artistPhotoSource?: PhotoSource;
  onClose: () => void; onAdd: (album: Album) => void;
}
function AddAlbumModal({ artistId, artistName, artistPhoto, artistPhotoSource, onClose, onAdd }: AddAlbumModalProps) {
  const { isDark } = useTheme();
  const blank: Omit<Album, "id" | "artistId" | "artistName" | "artistPhoto" | "artistPhotoSource"> = {
    title: "", label: "", year: new Date().getFullYear(), sold: "", tracks: 10, singles: 2, cert: null, streaming: ["SP"], cover: DEFAULT_LOCAL_COVER, coverSource: "local",
  };
  const handleAdd = (data: typeof blank) => {
    onAdd({ id: data.title.toLowerCase().replace(/\s+/g, "-") + "-" + Date.now(), artistId, artistName, artistPhoto, artistPhotoSource, ...data });
    onClose();
  };
  return <AlbumFormModal title="Add Album" isDark={isDark} initial={blank} artistName={artistName} onClose={onClose} onSubmit={handleAdd} submitLabel="Add Album" />;
}

// ─── Edit Album Modal ─────────────────────────────────────────────────────────
interface EditAlbumModalProps {
  album: Album; onClose: () => void; onSave: (updated: Album) => void;
}
function EditAlbumModal({ album, onClose, onSave }: EditAlbumModalProps) {
  const { isDark } = useTheme();
  const initial: AlbumFormData = {
    title: album.title, label: album.label, year: album.year, sold: album.sold, tracks: album.tracks, singles: album.singles, cert: album.cert, streaming: album.streaming, cover: album.cover, coverSource: album.coverSource ?? "local",
  };
  const handleSave = (data: AlbumFormData) => {
    onSave({ ...album, ...data });
    onClose();
  };
  return <AlbumFormModal title="Edit Album" isDark={isDark} initial={initial} artistName={album.artistName} onClose={onClose} onSubmit={handleSave} submitLabel="Save Changes" />;
}

// Shared Album form
type AlbumFormData = { title: string; label: string; year: number; sold: string; tracks: number; singles: number; cert: Cert; streaming: StreamingPlatform[]; cover: string; coverSource: PhotoSource; };
interface AlbumFormModalProps {
  title: string; isDark: boolean; initial: AlbumFormData; artistName: string;
  onClose: () => void; onSubmit: (data: AlbumFormData) => void; submitLabel: string;
}
function AlbumFormModal({ title, isDark, initial, artistName, onClose, onSubmit, submitLabel }: AlbumFormModalProps) {
  const [f, setF] = useState(initial);
  const [coverSource, setCoverSource] = useState<PhotoSource>(initial.coverSource ?? "local");
  const [localCover, setLocalCover] = useState(
    initial.coverSource === "remote" ? DEFAULT_LOCAL_COVER : (initial.cover ?? "")
  );
  const [remoteCover, setRemoteCover] = useState(
    initial.coverSource === "remote" ? initial.cover : ""
  );
  const card = isDark ? "bg-[#13131c] border-[rgba(255,255,255,0.08)]" : "bg-white border-[rgba(0,0,0,0.1)]";
  const heading = isDark ? "text-[#f2f2f8]" : "text-[#1c1917]";
  const muted = isDark ? "text-[#7070a0]" : "text-[#78716c]";
  const labelCls = `block text-[12.25px] font-medium mb-[5.25px] ${heading}`;
  const inp = `w-full border rounded-[7px] px-[10.5px] py-[8.75px] text-[12.25px] focus:outline-none transition-colors ${inputCls(isDark)}`;
  const accent = isDark ? "#a855f7" : "#9333ea";
  const sourceBtn = isDark
    ? "border-[rgba(255,255,255,0.08)] text-[#7070a0] hover:text-[#f2f2f8]"
    : "border-[rgba(0,0,0,0.1)] text-[#78716c] hover:text-[#1c1917]";
  const previewCover = coverSource === "local" ? localCover : remoteCover.trim();

  const toggleStream = (p: StreamingPlatform) => setF((prev) => ({ ...prev, streaming: prev.streaming.includes(p) ? prev.streaming.filter((s) => s !== p) : [...prev.streaming, p] }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto py-[21px]">
      <div className="absolute inset-0 bg-[rgba(0,0,0,0.55)]" onClick={onClose} />
      <div className={`relative border rounded-[14px] w-[460px] p-[21px] shadow-[0px_25px_50px_-12px_rgba(0,0,0,0.8)] ${card}`}>
        <div className="flex items-center justify-between mb-[14px]">
          <h2 className={`text-[17.5px] font-semibold ${heading}`}>{title}</h2>
          <button onClick={onClose} className={`${muted} hover:${isDark ? "text-[#f2f2f8]" : "text-[#1c1917]"} transition-colors`}><X className="w-[17.5px] h-[17.5px]" /></button>
        </div>
        <p className={`text-[12.25px] mb-[14px] ${muted}`}>For <span className={heading + " font-medium"}>{artistName}</span></p>
        <div className="space-y-[12px]">
          <div>
            <label className={labelCls}>Album Title <span style={{ color: accent }}>*</span></label>
            <input value={f.title} onChange={(e) => setF((p) => ({ ...p, title: e.target.value }))} className={inp} />
          </div>
          <div>
            <label className={labelCls}>Album Cover</label>
            <div className="flex items-center gap-[10px]">
              <button
                type="button"
                onClick={() => setCoverSource(coverSource === "local" ? "remote" : "local")}
                className={`shrink-0 flex items-center px-[11.3px] py-[8.75px] rounded-[10.5px] border text-[12.25px] font-medium transition-colors ${sourceBtn}`}
              >
                {coverSource === "local" ? "Local" : "Remote"}
              </button>
              {coverSource === "local" ? (
                <select value={localCover} onChange={(e) => setLocalCover(e.target.value)} className={`${inp} flex-1`}>
                  <option value="">None</option>
                  {LOCAL_COVER_OPTIONS.map((opt) => (
                    <option key={opt.file} value={opt.file}>{opt.label}</option>
                  ))}
                </select>
              ) : (
                <input
                  value={remoteCover}
                  onChange={(e) => setRemoteCover(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className={`${inp} flex-1`}
                />
              )}
              <AlbumCover
                title={f.title.trim() || "Album"}
                cover={previewCover}
                coverSource={coverSource}
                sizeClass="size-[56px]"
                roundedClass="rounded-[7px]"
                isDark={isDark}
              />
            </div>
            {coverSource === "remote" && (
              <p className={`text-[10.5px] mt-[5px] ${muted}`}>Paste an image URL. If it fails to load, a vinyl record is shown.</p>
            )}
          </div>
          <div className="flex gap-[10.5px]">
            <div className="flex-1">
              <label className={labelCls}>Record Label</label>
              <input value={f.label} onChange={(e) => setF((p) => ({ ...p, label: e.target.value }))} className={inp} />
            </div>
            <div className="w-[90px]">
              <label className={labelCls}>Year <span style={{ color: accent }}>*</span></label>
              <input value={f.year} onChange={(e) => setF((p) => ({ ...p, year: parseInt(e.target.value) || p.year }))} className={inp} />
            </div>
          </div>
          <div className="flex gap-[10.5px]">
            <div className="flex-1">
              <label className={labelCls}>Tracks</label>
              <input value={f.tracks} type="number" onChange={(e) => setF((p) => ({ ...p, tracks: parseInt(e.target.value) || 0 }))} className={inp} />
            </div>
            <div className="flex-1">
              <label className={labelCls}>Singles</label>
              <input value={f.singles} type="number" onChange={(e) => setF((p) => ({ ...p, singles: parseInt(e.target.value) || 0 }))} className={inp} />
            </div>
            <div className="flex-1">
              <label className={labelCls}>Albums Sold</label>
              <input value={f.sold} onChange={(e) => setF((p) => ({ ...p, sold: e.target.value }))} placeholder="e.g. 250K" className={inp} />
            </div>
          </div>
          <div>
            <label className={labelCls}>Certification</label>
            <select value={f.cert || "None"} onChange={(e) => setF((p) => ({ ...p, cert: e.target.value === "None" ? null : (e.target.value as Cert) }))} className={inp}>
              <option value="None">None</option>
              <option value="Gold">Gold</option>
              <option value="Platinum">Platinum</option>
              <option value="Diamond">Diamond</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Streaming Platforms</label>
            <div className="flex gap-[7px]">
              {(["SP", "AM", "AZ"] as StreamingPlatform[]).map((p) => {
                const active = f.streaming.includes(p);
                const colors: Record<string, string> = { SP: active ? "bg-[rgba(29,185,84,0.2)] text-[#1db954] border-[rgba(29,185,84,0.3)]" : "", AM: active ? "bg-[rgba(252,60,68,0.2)] text-[#fc3c44] border-[rgba(252,60,68,0.3)]" : "", AZ: active ? "bg-[rgba(0,168,225,0.2)] text-[#00a8e1] border-[rgba(0,168,225,0.3)]" : "" };
                return (
                  <button key={p} onClick={() => toggleStream(p)} className={`px-[14px] py-[7px] rounded-[7px] text-[12.25px] font-bold border transition-colors ${active ? colors[p] : (isDark ? "border-[rgba(255,255,255,0.08)] text-[#7070a0]" : "border-[rgba(0,0,0,0.1)] text-[#78716c]")}`}>
                    {p === "SP" ? "Spotify" : p === "AM" ? "Apple Music" : "Amazon"}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        <div className="flex gap-[10.5px] mt-[21px]">
          <button onClick={onClose} className={`flex-1 py-[10.5px] rounded-[10.5px] border text-[12.25px] font-medium transition-colors ${isDark ? "border-[rgba(255,255,255,0.08)] text-[#7070a0] hover:text-[#f2f2f8]" : "border-[rgba(0,0,0,0.1)] text-[#78716c] hover:text-[#1c1917]"}`}>Cancel</button>
          <button onClick={() => onSubmit({
            ...f,
            cover: coverSource === "local" ? localCover : remoteCover.trim(),
            coverSource,
          })} disabled={!f.title.trim()} className="flex-1 py-[10.5px] rounded-[10.5px] text-white text-[12.25px] font-medium disabled:opacity-40 transition-opacity" style={{ background: "linear-gradient(135deg,rgb(142,81,255) 0%,rgb(246,51,154) 100%)" }}>
            {submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

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
      toast.success(`${created.name} added to catalog`);
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
            ? resolveAlbum({ ...al, artistName: saved.name, artistPhoto: saved.photo, artistPhotoSource: saved.photoSource })
            : al
        )
      );
      toast.success(`${saved.name} updated`);
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
      toast.success(`${name} removed from catalog`);
      setDeleteArtist(null);
      if (window.location.pathname.startsWith(`/artists/${id}`)) nav("/artists");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete artist");
    }
  }

  async function handleAddAlbum(album: Album) {
    try {
      const created = await catalogApi.createAlbum(toApiAlbum(album));
      setAlbums((als) => [...als, resolveAlbum(created)]);
      toast.success(`"${created.title}" added to catalog`);
      setAddAlbumArtistId(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add album");
    }
  }

  async function handleSaveAlbum(updated: Album) {
    try {
      const saved = await catalogApi.updateAlbum(updated.id, toApiAlbum(updated));
      setAlbums((als) => als.map((al) => (al.id === saved.id ? resolveAlbum(saved) : al)));
      toast.success(`"${saved.title}" updated`);
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
      toast.success(`"${title}" removed`);
      setDeleteAlbum(null);
      if (window.location.pathname === `/albums/${albumId}`) nav(`/artists/${artistId}`);
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
        <div className={`min-h-screen flex items-center justify-center ${isDark ? "bg-[#09090f] text-[#7070a0]" : "bg-[#faf8f4] text-[#78716c]"}`}>
          Loading catalog…
        </div>
      </ThemeContext.Provider>
    );
  }

  if (loadError) {
    return (
      <ThemeContext.Provider value={{ isDark, toggle: () => setIsDark((v) => !v) }}>
        <div className={`min-h-screen flex flex-col items-center justify-center gap-3 px-6 text-center ${isDark ? "bg-[#09090f] text-[#f2f2f8]" : "bg-[#faf8f4] text-[#1c1917]"}`}>
          <p className="text-lg font-medium">Could not load catalog</p>
          <p className={`text-sm ${isDark ? "text-[#7070a0]" : "text-[#78716c]"}`}>{loadError}</p>
          <p className={`text-sm ${isDark ? "text-[#7070a0]" : "text-[#78716c]"}`}>Make sure the API is running on VITE_API_URL.</p>
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
            body={`Delete "${deleteArtist.name}" and all of their albums? This cannot be undone.`}
            image={deleteArtist.photo}
            imageShape="circle"
            avatarName={deleteArtist.name}
            avatarPhotoSource={deleteArtist.photoSource}
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
            artistPhotoSource={addAlbumArtist.photoSource}
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
            body={`Delete "${deleteAlbum.title}"? This cannot be undone.`}
            image={deleteAlbum.cover}
            imageShape="square"
            coverTitle={deleteAlbum.title}
            coverSource={deleteAlbum.coverSource}
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
