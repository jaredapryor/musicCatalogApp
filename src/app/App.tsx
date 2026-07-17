import React, { useState, useMemo, useEffect, createContext, useContext } from "react";
import { RouterProvider, useNavigate, useLocation } from "react-router";
import { router } from "./routes";
import * as Dialog from "@radix-ui/react-dialog";
import * as Tooltip from "@radix-ui/react-tooltip";
import { Toaster, toast } from "sonner";
import { Search, X, ChevronDown, ChevronUp, Plus, Pencil, Trash2, Music, Users, Disc3, ArrowLeft, Sun, Moon } from "lucide-react";
import type { Album, Artist, ArtistType, Certification, StreamingPlatform } from "./types";
import * as catalogApi from "./api/catalogApi";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatSold(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return `${n}`;
}

const CERT_CONFIG: Record<Certification, { label: string; color: string }> = {
  none: { label: "—", color: "text-muted-foreground" },
  gold: { label: "Gold", color: "text-yellow-400" },
  platinum: { label: "Platinum", color: "text-slate-300" },
  "multi-platinum": { label: "Multi-Platinum", color: "text-violet-400" },
};

const COVER_PLACEHOLDER_COLORS = [
  "from-violet-600 to-pink-600",
  "from-blue-600 to-cyan-500",
  "from-orange-500 to-rose-600",
  "from-emerald-500 to-teal-600",
  "from-amber-500 to-orange-600",
  "from-indigo-600 to-purple-600",
];

function placeholderGradient(id: string): string {
  const idx = id.charCodeAt(id.length - 1) % COVER_PLACEHOLDER_COLORS.length;
  return COVER_PLACEHOLDER_COLORS[idx];
}

// ─── Shared Components ────────────────────────────────────────────────────────

function CertBadge({ cert }: { cert: Certification }) {
  if (cert === "none") return null;
  const { label, color } = CERT_CONFIG[cert];
  return (
    <span className={`text-xs font-semibold uppercase tracking-wider ${color} border border-current/30 rounded px-2 py-0.5`}>
      {label}
    </span>
  );
}

function StreamingIcons({ platforms }: { platforms: StreamingPlatform[] }) {
  return (
    <div className="flex gap-1.5 items-center">
      {platforms.includes("spotify") && (
        <span title="Spotify" className="text-xs bg-[#1DB954]/20 text-[#1DB954] font-bold rounded px-1.5 py-0.5">SP</span>
      )}
      {platforms.includes("apple") && (
        <span title="Apple Music" className="text-xs bg-[#fc3c44]/20 text-[#fc3c44] font-bold rounded px-1.5 py-0.5">AM</span>
      )}
      {platforms.includes("amazon") && (
        <span title="Amazon Music" className="text-xs bg-[#00a8e1]/20 text-[#00a8e1] font-bold rounded px-1.5 py-0.5">AZ</span>
      )}
    </div>
  );
}

function CoverImage({ url, title, size = "md" }: { url: string; title: string; size?: "sm" | "md" | "lg" | "xl" }) {
  const sizeClass = { sm: "w-12 h-12", md: "w-16 h-16", lg: "w-28 h-28", xl: "w-56 h-56" }[size];
  const [failed, setFailed] = useState(false);
  const gradient = COVER_PLACEHOLDER_COLORS[title.charCodeAt(0) % COVER_PLACEHOLDER_COLORS.length];
  return (
    <div className={`${sizeClass} rounded-lg overflow-hidden flex-shrink-0 bg-muted`}>
      {!failed && url ? (
        <img
          src={url}
          alt={title}
          className="w-full h-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <div className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center`}>
          <Disc3 size={size === "sm" ? 14 : size === "md" ? 20 : size === "lg" ? 32 : 48} className="text-white/50" />
        </div>
      )}
    </div>
  );
}

function ArtistAvatar({ artist, size = "md" }: { artist: Artist; size?: "sm" | "md" | "lg" | "xl" }) {
  const sizeClass = { sm: "w-10 h-10 text-base", md: "w-16 h-16 text-2xl", lg: "w-24 h-24 text-4xl", xl: "w-48 h-48 text-6xl" }[size];
  const initials = artist.name.split(" ").map(w => w[0]).slice(0, 2).join("");
  const gradient = COVER_PLACEHOLDER_COLORS[artist.id.charCodeAt(artist.id.length - 1) % COVER_PLACEHOLDER_COLORS.length];
  const [failed, setFailed] = useState(false);
  if (artist.photoUrl && !failed) {
    return (
      <div className={`${sizeClass} rounded-full overflow-hidden flex-shrink-0 bg-muted`}>
        <img src={artist.photoUrl} alt={artist.name} className="w-full h-full object-cover" onError={() => setFailed(true)} />
      </div>
    );
  }
  return (
    <div className={`${sizeClass} rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center font-bold text-white flex-shrink-0`}>
      {initials}
    </div>
  );
}

function CountryFlag({ countryCode, country }: { countryCode: string; country: string }) {
  const code = countryCode.toLowerCase();
  const abbr = countryCode.toUpperCase();
  return (
    <Tooltip.Provider delayDuration={200}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <span className="inline-flex items-center gap-1.5 cursor-default select-none">
            <span className="w-10 h-6 rounded overflow-hidden flex-shrink-0 shadow-sm border border-white/10">
              <img
                src={`https://flagcdn.com/w40/${code}.png`}
                alt={country}
                className="w-full h-full object-cover"
              />
            </span>
            <span className="text-xs font-semibold text-muted-foreground tracking-wider">{abbr}</span>
          </span>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            side="top"
            sideOffset={5}
            className="bg-popover text-popover-foreground text-xs font-medium px-2.5 py-1.5 rounded-lg shadow-lg border border-border z-50"
          >
            {country}
            <Tooltip.Arrow className="fill-popover" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}

// ─── Form Components ──────────────────────────────────────────────────────────

interface ArtistFormData {
  name: string;
  country: string;
  countryFlag: string;
  countryCode: string;
  photoUrl: string;
  type: ArtistType;
  memberCount: string;
  activeSince: string;
}

const COUNTRIES: { name: string; code: string; flag: string }[] = [
  { name: "Argentina",      code: "ar", flag: "🇦🇷" },
  { name: "Australia",      code: "au", flag: "🇦🇺" },
  { name: "Belgium",        code: "be", flag: "🇧🇪" },
  { name: "Brazil",         code: "br", flag: "🇧🇷" },
  { name: "Canada",         code: "ca", flag: "🇨🇦" },
  { name: "China",          code: "cn", flag: "🇨🇳" },
  { name: "Denmark",        code: "dk", flag: "🇩🇰" },
  { name: "Finland",        code: "fi", flag: "🇫🇮" },
  { name: "France",         code: "fr", flag: "🇫🇷" },
  { name: "Germany",        code: "de", flag: "🇩🇪" },
  { name: "Ghana",          code: "gh", flag: "🇬🇭" },
  { name: "India",          code: "in", flag: "🇮🇳" },
  { name: "Ireland",        code: "ie", flag: "🇮🇪" },
  { name: "Italy",          code: "it", flag: "🇮🇹" },
  { name: "Japan",          code: "jp", flag: "🇯🇵" },
  { name: "Mexico",         code: "mx", flag: "🇲🇽" },
  { name: "Netherlands",    code: "nl", flag: "🇳🇱" },
  { name: "New Zealand",    code: "nz", flag: "🇳🇿" },
  { name: "Nigeria",        code: "ng", flag: "🇳🇬" },
  { name: "Norway",         code: "no", flag: "🇳🇴" },
  { name: "Portugal",       code: "pt", flag: "🇵🇹" },
  { name: "Russia",         code: "ru", flag: "🇷🇺" },
  { name: "South Africa",   code: "za", flag: "🇿🇦" },
  { name: "South Korea",    code: "kr", flag: "🇰🇷" },
  { name: "Spain",          code: "es", flag: "🇪🇸" },
  { name: "Sweden",         code: "se", flag: "🇸🇪" },
  { name: "United Kingdom", code: "gb", flag: "🇬🇧" },
  { name: "United States",  code: "us", flag: "🇺🇸" },
];

function ArtistFormModal({
  open, onClose, initial, onSave,
}: {
  open: boolean;
  onClose: () => void;
  initial?: Artist;
  onSave: (data: Omit<Artist, "id">) => void | Promise<void>;
}) {
  const blank: ArtistFormData = { name: "", country: "", countryFlag: "", countryCode: "", photoUrl: "", type: "solo", memberCount: "", activeSince: "" };
  const toFormData = (a: Artist): ArtistFormData => ({
    name: a.name, country: a.country, countryFlag: a.countryFlag, countryCode: a.countryCode,
    photoUrl: a.photoUrl ?? "",
    type: a.type, memberCount: a.memberCount?.toString() ?? "", activeSince: a.activeSince.toString(),
  });
  const [form, setForm] = useState<ArtistFormData>(initial ? toFormData(initial) : blank);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setForm(initial ? toFormData(initial) : blank);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initial?.id]);

  const set = (k: keyof ArtistFormData, v: string) => setForm(f => ({ ...f, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.activeSince || saving) return;
    const country = COUNTRIES.find(c => c.code === form.countryCode);
    setSaving(true);
    try {
      await onSave({
        name: form.name.trim(),
        country: country?.name ?? form.country.trim(),
        countryFlag: (country?.flag ?? form.countryFlag.trim()) || "🎵",
        countryCode: form.countryCode || "un",
        photoUrl: form.photoUrl.trim(),
        type: form.type,
        memberCount: form.type === "group" && form.memberCount ? parseInt(form.memberCount) : undefined,
        activeSince: parseInt(form.activeSince),
      });
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={v => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40" />
        <Dialog.Content aria-describedby={undefined} className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg bg-card border border-border rounded-2xl p-6 shadow-2xl">
          <div className="flex items-center justify-between mb-5">
            <Dialog.Title className="text-lg font-semibold text-foreground">
              {initial ? "Edit Artist" : "Add Artist"}
            </Dialog.Title>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
              <X size={18} />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Artist Name *</label>
              <input value={form.name} onChange={e => set("name", e.target.value)} required
                className="w-full bg-input-background border border-border rounded-lg px-3 py-2 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Country</label>
              <div className="flex items-center gap-3">
                <select
                  value={form.countryCode}
                  onChange={e => {
                    const c = COUNTRIES.find(x => x.code === e.target.value);
                    setForm(f => ({ ...f, countryCode: e.target.value, country: c?.name ?? "", countryFlag: c?.flag ?? "" }));
                  }}
                  className="flex-1 bg-input-background border border-border rounded-lg px-3 py-2 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">— Select country —</option>
                  {COUNTRIES.map(c => (
                    <option key={c.code} value={c.code}>{c.name} – {c.code.toUpperCase()}</option>
                  ))}
                </select>
                {form.countryCode && (
                  <span className="w-12 h-8 rounded overflow-hidden flex-shrink-0 border border-white/10 shadow-sm">
                    <img src={`https://flagcdn.com/w40/${form.countryCode}.png`} alt={form.country} className="w-full h-full object-cover" />
                  </span>
                )}
              </div>
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Artist Photo URL</label>
              <div className="flex items-center gap-3">
                <input value={form.photoUrl} onChange={e => set("photoUrl", e.target.value)} placeholder="https://images.unsplash.com/..."
                  className="flex-1 bg-input-background border border-border rounded-lg px-3 py-2 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                {form.photoUrl && (
                  <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 border border-white/10 bg-muted">
                    <img src={form.photoUrl} alt="preview" className="w-full h-full object-cover"
                      onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                  </div>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Type</label>
                <select value={form.type} onChange={e => set("type", e.target.value as ArtistType)}
                  className="w-full bg-input-background border border-border rounded-lg px-3 py-2 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary">
                  <option value="solo">Solo</option>
                  <option value="group">Group</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Active Since *</label>
                <input type="number" value={form.activeSince} onChange={e => set("activeSince", e.target.value)} required min="1900" max="2024"
                  className="w-full bg-input-background border border-border rounded-lg px-3 py-2 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>
            </div>
            {form.type === "group" && (
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Number of Members</label>
                <input type="number" value={form.memberCount} onChange={e => set("memberCount", e.target.value)} min="2"
                  className="w-full bg-input-background border border-border rounded-lg px-3 py-2 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>
            )}
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose}
                className="flex-1 bg-secondary text-secondary-foreground rounded-lg py-2 text-sm font-medium hover:bg-secondary/80 transition-colors">
                Cancel
              </button>
              <button type="submit"
                className="flex-1 bg-primary text-primary-foreground rounded-lg py-2 text-sm font-medium hover:bg-primary/90 transition-colors">
                {initial ? "Save Changes" : "Add Artist"}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

interface AlbumFormData {
  title: string;
  artistId: string;
  coverUrl: string;
  label: string;
  releaseYear: string;
  trackCount: string;
  singleCount: string;
  albumsSold: string;
  certification: Certification;
  streaming: StreamingPlatform[];
}

function AlbumFormModal({
  open, onClose, initial, artists, defaultArtistId, onSave,
}: {
  open: boolean;
  onClose: () => void;
  initial?: Album;
  artists: Artist[];
  defaultArtistId?: string;
  onSave: (data: Omit<Album, "id">) => void | Promise<void>;
}) {
  const blank: AlbumFormData = {
    title: "", artistId: defaultArtistId ?? artists[0]?.id ?? "", coverUrl: "", label: "",
    releaseYear: "", trackCount: "", singleCount: "", albumsSold: "", certification: "none", streaming: [],
  };
  const [form, setForm] = useState<AlbumFormData>(
    initial
      ? { title: initial.title, artistId: initial.artistId, coverUrl: initial.coverUrl, label: initial.label, releaseYear: initial.releaseYear.toString(), trackCount: initial.trackCount.toString(), singleCount: initial.singleCount.toString(), albumsSold: initial.albumsSold.toString(), certification: initial.certification, streaming: initial.streaming }
      : blank
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(initial
        ? { title: initial.title, artistId: initial.artistId, coverUrl: initial.coverUrl, label: initial.label, releaseYear: initial.releaseYear.toString(), trackCount: initial.trackCount.toString(), singleCount: initial.singleCount.toString(), albumsSold: initial.albumsSold.toString(), certification: initial.certification, streaming: initial.streaming }
        : { ...blank, artistId: defaultArtistId ?? artists[0]?.id ?? "" }
      );
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initial?.id]);

  const set = (k: keyof AlbumFormData, v: string | StreamingPlatform[]) => setForm(f => ({ ...f, [k]: v }));

  function toggleStream(p: StreamingPlatform) {
    setForm(f => ({
      ...f,
      streaming: f.streaming.includes(p) ? f.streaming.filter(x => x !== p) : [...f.streaming, p],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.artistId || !form.releaseYear || saving) return;
    setSaving(true);
    try {
      await onSave({
        artistId: form.artistId,
        title: form.title.trim(),
        coverUrl: form.coverUrl.trim(),
        label: form.label.trim(),
        releaseYear: parseInt(form.releaseYear),
        trackCount: parseInt(form.trackCount) || 0,
        singleCount: parseInt(form.singleCount) || 0,
        albumsSold: parseInt(form.albumsSold) || 0,
        certification: form.certification,
        streaming: form.streaming,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={v => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40" />
        <Dialog.Content aria-describedby={undefined} className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg bg-card border border-border rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-5">
            <Dialog.Title className="text-lg font-semibold text-foreground">
              {initial ? "Edit Album" : "Add Album"}
            </Dialog.Title>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
              <X size={18} />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Album Title *</label>
              <input value={form.title} onChange={e => set("title", e.target.value)} required
                className="w-full bg-input-background border border-border rounded-lg px-3 py-2 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Artist *</label>
              <select value={form.artistId} onChange={e => set("artistId", e.target.value)}
                className="w-full bg-input-background border border-border rounded-lg px-3 py-2 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary">
                {artists.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Cover Image URL</label>
              <input value={form.coverUrl} onChange={e => set("coverUrl", e.target.value)} placeholder="https://..."
                className="w-full bg-input-background border border-border rounded-lg px-3 py-2 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
              {form.coverUrl && (
                <div className="mt-2 w-16 h-16 rounded-lg overflow-hidden bg-muted">
                  <img src={form.coverUrl} alt="preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Record Label</label>
                <input value={form.label} onChange={e => set("label", e.target.value)}
                  className="w-full bg-input-background border border-border rounded-lg px-3 py-2 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Release Year *</label>
                <input type="number" value={form.releaseYear} onChange={e => set("releaseYear", e.target.value)} required min="1950" max="2025"
                  className="w-full bg-input-background border border-border rounded-lg px-3 py-2 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Tracks</label>
                <input type="number" value={form.trackCount} onChange={e => set("trackCount", e.target.value)} min="1"
                  className="w-full bg-input-background border border-border rounded-lg px-3 py-2 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Singles</label>
                <input type="number" value={form.singleCount} onChange={e => set("singleCount", e.target.value)} min="0"
                  className="w-full bg-input-background border border-border rounded-lg px-3 py-2 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Albums Sold</label>
                <input type="number" value={form.albumsSold} onChange={e => set("albumsSold", e.target.value)} min="0"
                  className="w-full bg-input-background border border-border rounded-lg px-3 py-2 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Certification</label>
              <select value={form.certification} onChange={e => set("certification", e.target.value as Certification)}
                className="w-full bg-input-background border border-border rounded-lg px-3 py-2 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary">
                <option value="none">None</option>
                <option value="gold">Gold</option>
                <option value="platinum">Platinum</option>
                <option value="multi-platinum">Multi-Platinum</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Streaming Platforms</label>
              <div className="flex gap-2">
                {(["spotify", "apple", "amazon"] as StreamingPlatform[]).map(p => (
                  <button key={p} type="button" onClick={() => toggleStream(p)}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${form.streaming.includes(p) ? "bg-primary border-primary text-white" : "border-border text-muted-foreground hover:border-primary/50"}`}>
                    {p === "spotify" ? "Spotify" : p === "apple" ? "Apple Music" : "Amazon"}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose}
                className="flex-1 bg-secondary text-secondary-foreground rounded-lg py-2 text-sm font-medium hover:bg-secondary/80 transition-colors">
                Cancel
              </button>
              <button type="submit"
                className="flex-1 bg-primary text-primary-foreground rounded-lg py-2 text-sm font-medium hover:bg-primary/90 transition-colors">
                {initial ? "Save Changes" : "Add Album"}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function DeleteAlbumModal({
  open, onClose, album, artist, onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  album: Album | null;
  artist: Artist | null;
  onConfirm: () => void;
}) {
  if (!album || !artist) return null;
  return (
    <Dialog.Root open={open} onOpenChange={v => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40" />
        <Dialog.Content aria-describedby={undefined} className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-sm bg-card border border-border rounded-2xl p-6 shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="text-base font-semibold text-foreground">Delete Album?</Dialog.Title>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
              <X size={16} />
            </button>
          </div>
          <p className="text-sm text-muted-foreground mb-4">This will permanently remove this album from the catalog.</p>
          <div className="flex items-center gap-3 bg-secondary rounded-xl p-3 mb-5">
            <CoverImage url={album.coverUrl} title={album.title} size="sm" />
            <div>
              <p className="text-sm font-medium text-foreground">{album.title}</p>
              <p className="text-xs text-muted-foreground">{artist.name} · {album.releaseYear}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={onClose}
              className="flex-1 bg-secondary text-secondary-foreground rounded-lg py-2 text-sm font-medium hover:bg-secondary/80 transition-colors">
              Cancel
            </button>
            <button onClick={() => { onConfirm(); onClose(); }}
              className="flex-1 bg-destructive text-destructive-foreground rounded-lg py-2 text-sm font-medium hover:bg-destructive/90 transition-colors">
              Delete
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function DeleteArtistModal({
  open, onClose, artist, albumCount, onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  artist: Artist | null;
  albumCount: number;
  onConfirm: () => void;
}) {
  if (!artist) return null;
  return (
    <Dialog.Root open={open} onOpenChange={v => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40" />
        <Dialog.Content aria-describedby={undefined} className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-sm bg-card border border-border rounded-2xl p-6 shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="text-base font-semibold text-foreground">Delete Artist?</Dialog.Title>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
              <X size={16} />
            </button>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            This will permanently remove this artist and all their albums from the catalog.
          </p>
          <div className="flex items-center gap-3 bg-secondary rounded-xl p-3 mb-5">
            <ArtistAvatar artist={artist} size="sm" />
            <div>
              <p className="text-sm font-medium text-foreground">{artist.name}</p>
              <p className="text-xs text-muted-foreground">
                {artist.country} · {albumCount} {albumCount === 1 ? "album" : "albums"} will be deleted
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={onClose}
              className="flex-1 bg-secondary text-secondary-foreground rounded-lg py-2 text-sm font-medium hover:bg-secondary/80 transition-colors">
              Cancel
            </button>
            <button onClick={() => { onConfirm(); onClose(); }}
              className="flex-1 bg-destructive text-destructive-foreground rounded-lg py-2 text-sm font-medium hover:bg-destructive/90 transition-colors">
              Delete Artist
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

// ─── Theme ────────────────────────────────────────────────────────────────────

function useTheme() {
  const [dark, setDark] = useState<boolean>(() => {
    const stored = localStorage.getItem("theme");
    if (stored) return stored === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  return { dark, toggle: () => setDark(d => !d) };
}

// ─── NavBar ───────────────────────────────────────────────────────────────────

export function NavBar() {
  const nav = useNavigate();
  const { pathname } = useLocation();
  const { dark, toggle } = useTheme();
  const isArtists = pathname === "/" || pathname.startsWith("/artists");
  const isAlbums = pathname.startsWith("/albums");
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-6">
        <button onClick={() => nav("/artists")} className="flex items-center gap-2 group">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center">
            <Music size={20} className="text-white" />
          </div>
          <span className="font-bold text-2xl text-foreground tracking-tight hidden sm:block" style={{ fontFamily: "'Playfair Display', serif" }}>
            Modern Music Catalog
          </span>
        </button>
        <nav className="flex items-center gap-1">
          <button
            onClick={() => nav("/artists")}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${isArtists ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"}`}>
            Artists
          </button>
          <button
            onClick={() => nav("/albums")}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${isAlbums ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"}`}>
            Albums
          </button>
        </nav>
        <div className="ml-auto">
          <button
            onClick={toggle}
            aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all text-sm font-medium">
            {dark ? <Sun size={15} /> : <Moon size={15} />}
            {dark ? "Light" : "Dark"}
          </button>
        </div>
      </div>
    </header>
  );
}

// ─── Artists View ─────────────────────────────────────────────────────────────

function ArtistsView({
  artists, albums, onSelect, onAdd, onEdit, onDelete,
}: {
  artists: Artist[];
  albums: Album[];
  onSelect: (id: string) => void;
  onAdd: () => void;
  onEdit: (a: Artist) => void;
  onDelete: (a: Artist) => void;
}) {
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"all" | ArtistType>("all");
  const [filterCountry, setFilterCountry] = useState("all");
  const [sort, setSort] = useState<"name" | "activeSince">("name");

  const countries = useMemo(() => Array.from(new Set(artists.map(a => a.country))).sort(), [artists]);

  const filtered = useMemo(() => {
    let list = artists;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(a => a.name.toLowerCase().includes(q) || a.country.toLowerCase().includes(q));
    }
    if (filterType !== "all") list = list.filter(a => a.type === filterType);
    if (filterCountry !== "all") list = list.filter(a => a.country === filterCountry);
    list = [...list].sort((a, b) =>
      sort === "name" ? a.name.localeCompare(b.name) : a.activeSince - b.activeSince
    );
    return list;
  }, [artists, search, filterType, filterCountry, sort]);

  const albumCountFor = (artistId: string) => albums.filter(al => al.artistId === artistId).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>Artists</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{filtered.length} of {artists.length} artists</p>
        </div>
        <button onClick={onAdd}
          className="flex items-center gap-2 bg-primary text-primary-foreground rounded-xl px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors">
          <Plus size={15} /> Add Artist
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search artists..."
            className="w-full bg-secondary border border-border rounded-xl pl-8 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
        </div>
        <select value={filterType} onChange={e => setFilterType(e.target.value as "all" | ArtistType)}
          className="bg-secondary border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
          <option value="all">All Types</option>
          <option value="solo">Solo</option>
          <option value="group">Group</option>
        </select>
        <select value={filterCountry} onChange={e => setFilterCountry(e.target.value)}
          className="bg-secondary border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
          <option value="all">All Countries</option>
          {countries.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={sort} onChange={e => setSort(e.target.value as "name" | "activeSince")}
          className="bg-secondary border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
          <option value="name">Sort: Name</option>
          <option value="activeSince">Sort: Active Since</option>
        </select>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map(artist => (
          <div key={artist.id}
            className="group bg-card border border-border rounded-2xl p-4 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all cursor-pointer"
            onClick={() => onSelect(artist.id)}>
            <div className="flex items-start gap-3 mb-3">
              <ArtistAvatar artist={artist} />
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-xl text-foreground truncate">{artist.name}</h3>
                <div className="mt-0.5"><CountryFlag countryCode={artist.countryCode} country={artist.country} /></div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full mt-1 inline-block ${artist.type === "group" ? "bg-violet-500/15 text-violet-400" : "bg-pink-500/15 text-pink-400"}`}>
                  {artist.type === "group" ? `Group · ${artist.memberCount}` : "Solo"}
                </span>
              </div>
            </div>
            <div className="border-t border-border/50 pt-3 flex items-center justify-between">
              <div className="text-xs text-muted-foreground">Since {artist.activeSince}</div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Disc3 size={12} />
                {albumCountFor(artist.id)} albums
              </div>
            </div>
            <div className="mt-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
              <button
                onClick={e => { e.stopPropagation(); onEdit(artist); }}
                className="flex-1 text-xs text-muted-foreground hover:text-foreground border border-border/50 rounded-lg py-1.5 flex items-center justify-center gap-1 transition-colors">
                <Pencil size={11} /> Edit
              </button>
              <button
                onClick={e => { e.stopPropagation(); onDelete(artist); }}
                className="flex-1 text-xs text-muted-foreground hover:text-destructive border border-border/50 hover:border-destructive/50 rounded-lg py-1.5 flex items-center justify-center gap-1 transition-colors">
                <Trash2 size={11} /> Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <Users size={36} className="mx-auto mb-3 opacity-40" />
          <p>No artists found</p>
        </div>
      )}
    </div>
  );
}

// ─── Albums View ──────────────────────────────────────────────────────────────

function AlbumsView({
  albums, artists, onSelect, onAdd, onEdit, onDeleteRequest,
}: {
  albums: Album[];
  artists: Artist[];
  onSelect: (id: string) => void;
  onAdd: () => void;
  onEdit: (a: Album) => void;
  onDeleteRequest: (a: Album) => void;
}) {
  const [search, setSearch] = useState("");
  const [filterCert, setFilterCert] = useState<"all" | Certification>("all");
  const [filterStream, setFilterStream] = useState<"all" | StreamingPlatform>("all");
  const [sort, setSort] = useState<"title" | "releaseYear" | "albumsSold">("title");

  const artistMap = useMemo(() => Object.fromEntries(artists.map(a => [a.id, a])), [artists]);

  const filtered = useMemo(() => {
    let list = albums;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(al => al.title.toLowerCase().includes(q) || artistMap[al.artistId]?.name.toLowerCase().includes(q));
    }
    if (filterCert !== "all") list = list.filter(al => al.certification === filterCert);
    if (filterStream !== "all") list = list.filter(al => al.streaming.includes(filterStream as StreamingPlatform));
    list = [...list].sort((a, b) => {
      if (sort === "title") return a.title.localeCompare(b.title);
      if (sort === "releaseYear") return b.releaseYear - a.releaseYear;
      return b.albumsSold - a.albumsSold;
    });
    return list;
  }, [albums, search, filterCert, filterStream, sort, artistMap]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>Albums</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{filtered.length} of {albums.length} albums</p>
        </div>
        <button onClick={onAdd}
          className="flex items-center gap-2 bg-primary text-primary-foreground rounded-xl px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors">
          <Plus size={15} /> Add Album
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search albums or artists..."
            className="w-full bg-secondary border border-border rounded-xl pl-8 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
        </div>
        <select value={filterCert} onChange={e => setFilterCert(e.target.value as "all" | Certification)}
          className="bg-secondary border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
          <option value="all">All Certifications</option>
          <option value="none">None</option>
          <option value="gold">Gold</option>
          <option value="platinum">Platinum</option>
          <option value="multi-platinum">Multi-Platinum</option>
        </select>
        <select value={filterStream} onChange={e => setFilterStream(e.target.value as "all" | StreamingPlatform)}
          className="bg-secondary border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
          <option value="all">All Platforms</option>
          <option value="spotify">Spotify</option>
          <option value="apple">Apple Music</option>
          <option value="amazon">Amazon Music</option>
        </select>
        <select value={sort} onChange={e => setSort(e.target.value as "title" | "releaseYear" | "albumsSold")}
          className="bg-secondary border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
          <option value="title">Sort: Title</option>
          <option value="releaseYear">Sort: Year (Newest)</option>
          <option value="albumsSold">Sort: Best Selling</option>
        </select>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {filtered.map(album => {
          const artist = artistMap[album.artistId];
          return (
            <div key={album.id}
              className="group bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all cursor-pointer"
              onClick={() => onSelect(album.id)}>
              <div className="aspect-square bg-muted relative">
                <img src={album.coverUrl} alt={album.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2 gap-1">
                  <button onClick={e => { e.stopPropagation(); onEdit(album); }}
                    className="p-1.5 bg-white/10 backdrop-blur rounded-lg hover:bg-white/20 transition-colors">
                    <Pencil size={12} className="text-white" />
                  </button>
                  <button onClick={e => { e.stopPropagation(); onDeleteRequest(album); }}
                    className="p-1.5 bg-white/10 backdrop-blur rounded-lg hover:bg-destructive/80 transition-colors">
                    <Trash2 size={12} className="text-white" />
                  </button>
                </div>
              </div>
              <div className="p-3">
                <h3 className="text-lg font-semibold text-foreground truncate leading-snug">{album.title}</h3>
                <p className="text-lg text-muted-foreground truncate mt-0.5">{artist?.name}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-muted-foreground">{album.releaseYear}</span>
                  <CertBadge cert={album.certification} />
                </div>
                <div className="mt-1.5">
                  <StreamingIcons platforms={album.streaming} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <Disc3 size={36} className="mx-auto mb-3 opacity-40" />
          <p>No albums found</p>
        </div>
      )}
    </div>
  );
}

// ─── Artist Detail View ───────────────────────────────────────────────────────

function ArtistDetailView({
  artist, albums, onNavigateAlbum, onBack, onEdit, onDelete, onAddAlbum, onEditAlbum, onDeleteAlbum,
}: {
  artist: Artist;
  albums: Album[];
  onNavigateAlbum: (id: string) => void;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onAddAlbum: () => void;
  onEditAlbum: (a: Album) => void;
  onDeleteAlbum: (a: Album) => void;
}) {
  const [albumsOpen, setAlbumsOpen] = useState(true);

  const sortedAlbums = useMemo(() => [...albums].sort((a, b) => a.releaseYear - b.releaseYear), [albums]);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
      <button onClick={onBack} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
        <ArrowLeft size={15} /> Back to Artists
      </button>

      {/* Hero */}
      <div className="bg-card border border-border rounded-2xl p-6 mb-6">
        <div className="flex items-start gap-5">
          <ArtistAvatar artist={artist} size="xl" />
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-bold text-foreground mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>
              {artist.name}
            </h1>
            <div className="flex flex-wrap items-center gap-3 mt-2">
              <CountryFlag countryCode={artist.countryCode} country={artist.country} />
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${artist.type === "group" ? "bg-violet-500/15 text-violet-400" : "bg-pink-500/15 text-pink-400"}`}>
                {artist.type === "group" ? `Group · ${artist.memberCount} members` : "Solo Artist"}
              </span>
              <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                Active since {artist.activeSince}
              </span>
              <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full flex items-center gap-1">
                <Disc3 size={11} /> {sortedAlbums.length} albums
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={onEdit}
              className="flex items-center gap-1.5 text-xs text-muted-foreground border border-border rounded-lg px-3 py-2 hover:text-foreground hover:border-primary/50 transition-all">
              <Pencil size={12} /> Edit Artist
            </button>
            <button onClick={onDelete}
              className="flex items-center gap-1.5 text-xs text-muted-foreground border border-border rounded-lg px-3 py-2 hover:text-destructive hover:border-destructive/50 transition-all">
              <Trash2 size={12} /> Delete Artist
            </button>
          </div>
        </div>
      </div>

      {/* Albums Section */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
          <button onClick={() => setAlbumsOpen(o => !o)} className="flex items-center gap-2 font-semibold text-foreground hover:text-primary transition-colors">
            Albums
            {albumsOpen ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
          </button>
          <button onClick={onAddAlbum}
            className="flex items-center gap-1.5 text-xs bg-primary/20 text-primary rounded-lg px-3 py-1.5 hover:bg-primary/30 transition-colors font-medium">
            <Plus size={12} /> Add Album
          </button>
        </div>

        {albumsOpen && (
          <div>
            {sortedAlbums.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground text-sm">No albums yet</div>
            ) : (
              sortedAlbums.map((album, i) => (
                <div key={album.id}
                  className={`flex items-center gap-4 px-5 py-4 hover:bg-secondary/50 transition-colors ${i < sortedAlbums.length - 1 ? "border-b border-border/30" : ""}`}>
                  <button className="flex items-center gap-4 flex-1 min-w-0 text-left" onClick={() => onNavigateAlbum(album.id)}>
                    <CoverImage url={album.coverUrl} title={album.title} size="md" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate hover:text-primary transition-colors">{album.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{album.label} · {album.releaseYear}</p>
                      <div className="flex items-center flex-wrap gap-2 mt-1.5">
                        <span className="text-xs text-muted-foreground">{formatSold(album.albumsSold)} sold</span>
                        <span className="text-xs text-muted-foreground">·</span>
                        <span className="text-xs text-muted-foreground">{album.trackCount} tracks</span>
                        <CertBadge cert={album.certification} />
                        <StreamingIcons platforms={album.streaming} />
                      </div>
                    </div>
                  </button>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button onClick={() => onEditAlbum(album)}
                      className="p-1.5 text-muted-foreground hover:text-foreground border border-border/50 rounded-lg hover:border-primary/50 transition-all">
                      <Pencil size={12} />
                    </button>
                    <button onClick={() => onDeleteAlbum(album)}
                      className="p-1.5 text-muted-foreground hover:text-destructive border border-border/50 rounded-lg hover:border-destructive/50 transition-all">
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Album Detail View ────────────────────────────────────────────────────────

function AlbumDetailView({
  album, artist, onNavigateArtist, onBack, onEdit, onDeleteRequest,
}: {
  album: Album;
  artist: Artist | null;
  onNavigateArtist: (id: string) => void;
  onBack: () => void;
  onEdit: () => void;
  onDeleteRequest: () => void;
}) {
  return (
    <div className="min-h-screen relative">
      {/* Blurred background */}
      <div className="absolute inset-0 overflow-hidden">
        <img src={album.coverUrl} alt="" className="w-full h-full object-cover scale-110 blur-3xl opacity-20" aria-hidden />
        <div className="absolute inset-0 bg-background/70" />
      </div>

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 py-6">
        <button onClick={onBack} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8">
          <ArrowLeft size={15} /> Back
        </button>

        <div className="flex flex-col sm:flex-row gap-8 items-start">
          {/* Cover */}
          <div className="flex-shrink-0 w-full sm:w-64">
            <div className="w-full sm:w-64 h-64 rounded-2xl overflow-hidden shadow-2xl shadow-black/50 bg-muted">
              <img src={album.coverUrl} alt={album.title} className="w-full h-full object-cover" />
            </div>
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0">
            <p className="text-lg font-semibold uppercase tracking-widest text-primary mb-2">Album</p>
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground leading-tight mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>
              {album.title}
            </h1>

            {artist && (
              <button onClick={() => onNavigateArtist(artist.id)}
                className="flex items-center gap-2 mb-5 group">
                <ArtistAvatar artist={artist} size="md" />
                <span className="text-lg font-medium text-foreground group-hover:text-primary transition-colors">{artist.name}</span>
              </button>
            )}

            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="bg-card/70 backdrop-blur border border-border/50 rounded-xl p-3">
                <p className="text-xs text-muted-foreground mb-1">Record Label</p>
                <p className="text-sm font-medium text-foreground">{album.label || "—"}</p>
              </div>
              <div className="bg-card/70 backdrop-blur border border-border/50 rounded-xl p-3">
                <p className="text-xs text-muted-foreground mb-1">Release Year</p>
                <p className="text-sm font-medium text-foreground">{album.releaseYear}</p>
              </div>
              <div className="bg-card/70 backdrop-blur border border-border/50 rounded-xl p-3">
                <p className="text-xs text-muted-foreground mb-1">Albums Sold</p>
                <p className="text-sm font-medium text-foreground">{formatSold(album.albumsSold)}</p>
              </div>
              <div className="bg-card/70 backdrop-blur border border-border/50 rounded-xl p-3">
                <p className="text-xs text-muted-foreground mb-1">Tracks / Singles</p>
                <p className="text-sm font-medium text-foreground">{album.trackCount} / {album.singleCount}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 mb-6">
              <CertBadge cert={album.certification} />
              <StreamingIcons platforms={album.streaming} />
            </div>

            <div className="flex gap-3">
              <button onClick={onEdit}
                className="flex items-center gap-2 bg-secondary text-secondary-foreground rounded-xl px-4 py-2 text-sm font-medium hover:bg-secondary/80 transition-colors">
                <Pencil size={14} /> Edit Album
              </button>
              <button onClick={onDeleteRequest}
                className="flex items-center gap-2 bg-destructive/15 text-destructive rounded-xl px-4 py-2 text-sm font-medium hover:bg-destructive/25 transition-colors">
                <Trash2 size={14} /> Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Catalog Context ──────────────────────────────────────────────────────────

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

  // Modal state
  const [artistFormOpen, setArtistFormOpen] = useState(false);
  const [editingArtist, setEditingArtist] = useState<Artist | undefined>();
  const [albumFormOpen, setAlbumFormOpen] = useState(false);
  const [editingAlbum, setEditingAlbum] = useState<Album | undefined>();
  const [albumFormDefaultArtist, setAlbumFormDefaultArtist] = useState<string | undefined>();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingAlbum, setDeletingAlbum] = useState<Album | null>(null);
  const [deleteArtistOpen, setDeleteArtistOpen] = useState(false);
  const [deletingArtist, setDeletingArtist] = useState<Artist | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setLoadError(null);
        const [nextArtists, nextAlbums] = await Promise.all([
          catalogApi.getArtists(),
          catalogApi.getAlbums(),
        ]);
        if (cancelled) return;
        setArtists(nextArtists);
        setAlbums(nextAlbums);
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

  async function handleSaveArtist(data: Omit<Artist, "id">) {
    try {
      if (editingArtist) {
        const updated = await catalogApi.updateArtist(editingArtist.id, data);
        setArtists((as) => as.map((a) => (a.id === updated.id ? updated : a)));
        toast.success(`${data.name} updated`);
      } else {
        const created = await catalogApi.createArtist(data);
        setArtists((as) => [...as, created]);
        toast.success(`${data.name} added to catalog`);
      }
      setEditingArtist(undefined);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save artist");
      throw err;
    }
  }

  function openAddArtist() { setEditingArtist(undefined); setArtistFormOpen(true); }
  function openEditArtist(a: Artist) { setEditingArtist(a); setArtistFormOpen(true); }
  function openDeleteArtist(a: Artist) { setDeletingArtist(a); setDeleteArtistOpen(true); }

  async function handleDeleteArtist() {
    if (!deletingArtist) return;
    const id = deletingArtist.id;
    const name = deletingArtist.name;
    try {
      await catalogApi.deleteArtist(id);
      setArtists((as) => as.filter((a) => a.id !== id));
      setAlbums((als) => als.filter((al) => al.artistId !== id));
      toast.success(`${name} removed from catalog`);
      setDeletingArtist(null);
      setDeleteArtistOpen(false);
      if (window.location.pathname.startsWith(`/artists/${id}`)) {
        nav("/artists");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete artist");
    }
  }

  async function handleSaveAlbum(data: Omit<Album, "id">) {
    try {
      if (editingAlbum) {
        const updated = await catalogApi.updateAlbum(editingAlbum.id, data);
        setAlbums((als) => als.map((al) => (al.id === updated.id ? updated : al)));
        toast.success(`"${data.title}" updated`);
      } else {
        const created = await catalogApi.createAlbum(data);
        setAlbums((als) => [...als, created]);
        toast.success(`"${data.title}" added to catalog`);
      }
      setEditingAlbum(undefined);
      setAlbumFormDefaultArtist(undefined);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save album");
      throw err;
    }
  }

  function openAddAlbum(defaultArtistId?: string) {
    setEditingAlbum(undefined);
    setAlbumFormDefaultArtist(defaultArtistId);
    setAlbumFormOpen(true);
  }
  function openEditAlbum(al: Album) { setEditingAlbum(al); setAlbumFormDefaultArtist(undefined); setAlbumFormOpen(true); }

  function openDeleteAlbum(al: Album) { setDeletingAlbum(al); setDeleteOpen(true); }

  async function handleDeleteAlbum() {
    if (!deletingAlbum) return;
    const artistId = deletingAlbum.artistId;
    const albumId = deletingAlbum.id;
    const title = deletingAlbum.title;
    try {
      await catalogApi.deleteAlbum(albumId);
      setAlbums((als) => als.filter((al) => al.id !== albumId));
      toast.success(`"${title}" removed`);
      setDeletingAlbum(null);
      setDeleteOpen(false);
      if (window.location.pathname === `/albums/${albumId}`) {
        nav(`/artists/${artistId}`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete album");
    }
  }

  const deletingAlbumArtist = deletingAlbum ? artists.find(a => a.id === deletingAlbum.artistId) ?? null : null;
  const deletingArtistAlbumCount = deletingArtist ? albums.filter(al => al.artistId === deletingArtist.id).length : 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <p className="text-muted-foreground">Loading catalog…</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-background text-foreground px-6 text-center">
        <p className="text-lg font-medium">Could not load catalog</p>
        <p className="text-muted-foreground text-sm max-w-md">{loadError}</p>
        <p className="text-muted-foreground text-sm">Make sure the API is running on the configured VITE_API_URL.</p>
      </div>
    );
  }

  return (
    <CatalogContext.Provider value={{ artists, albums, openAddArtist, openEditArtist, openDeleteArtist, openAddAlbum, openEditAlbum, openDeleteAlbum }}>
      {children}
      <ArtistFormModal
        open={artistFormOpen}
        onClose={() => { setArtistFormOpen(false); setEditingArtist(undefined); }}
        initial={editingArtist}
        onSave={handleSaveArtist}
      />
      <AlbumFormModal
        open={albumFormOpen}
        onClose={() => { setAlbumFormOpen(false); setEditingAlbum(undefined); setAlbumFormDefaultArtist(undefined); }}
        initial={editingAlbum}
        artists={artists}
        defaultArtistId={albumFormDefaultArtist}
        onSave={handleSaveAlbum}
      />
      <DeleteAlbumModal
        open={deleteOpen}
        onClose={() => { setDeleteOpen(false); setDeletingAlbum(null); }}
        album={deletingAlbum}
        artist={deletingAlbumArtist}
        onConfirm={handleDeleteAlbum}
      />
      <DeleteArtistModal
        open={deleteArtistOpen}
        onClose={() => { setDeleteArtistOpen(false); setDeletingArtist(null); }}
        artist={deletingArtist}
        albumCount={deletingArtistAlbumCount}
        onConfirm={handleDeleteArtist}
      />
    </CatalogContext.Provider>
  );
}

// Re-export view components so pages can import them
export { ArtistsView, AlbumsView, ArtistDetailView, AlbumDetailView };

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  return <RouterProvider router={router} />;
}
