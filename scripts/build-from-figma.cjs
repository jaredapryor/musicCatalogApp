/**
 * Builds musicCatalogApp App.tsx + assetMaps.ts from figmaMakeCatalogApp.
 */
const fs = require("fs");
const path = require("path");

const figmaApp = fs.readFileSync(
  "c:/Development/React/figmaMakeCatalogApp/src/app/App.tsx",
  "utf8"
);

// ─── assetMaps.ts ─────────────────────────────────────────────────────────────
const artistImports = [];
const albumImports = [];
const flagImports = [];

const importRe =
  /import\s+(img\w+)\s+from\s+"(@\/imports\/(Artists|Albums)\/([a-f0-9]+\.png))"/g;
let im;
const varToFile = {};
const fileToVar = {};
while ((im = importRe.exec(figmaApp)) !== null) {
  const [, varName, importPath, folder, file] = im;
  varToFile[varName] = file;
  fileToVar[file] = varName;
  if (folder === "Artists") {
    // Flag images are also under Artists — detect by COUNTRY usage later
    artistImports.push({ varName, importPath, file });
  } else {
    albumImports.push({ varName, importPath, file });
  }
}

// Parse FLAG_MAP to know which vars are flags
const flagMapMatch = figmaApp.match(
  /const FLAG_MAP: Record<string, string> = \{([\s\S]*?)\};/
);
const flagCodeToVar = {};
if (flagMapMatch) {
  const flagLineRe = /(\w+):\s*(img\w+)/g;
  let fm;
  while ((fm = flagLineRe.exec(flagMapMatch[1])) !== null) {
    flagCodeToVar[fm[1]] = fm[2];
  }
}

const flagVarSet = new Set(Object.values(flagCodeToVar));
const artistPhotoImports = artistImports.filter((x) => !flagVarSet.has(x.varName));
const flagOnlyImports = artistImports.filter((x) => flagVarSet.has(x.varName));

let assetMaps = `// Auto-generated asset maps for Modern Music Catalog\n`;
for (const x of artistPhotoImports) {
  assetMaps += `import ${x.varName} from "${x.importPath}";\n`;
}
for (const x of flagOnlyImports) {
  assetMaps += `import ${x.varName} from "${x.importPath}";\n`;
}
for (const x of albumImports) {
  assetMaps += `import ${x.varName} from "${x.importPath}";\n`;
}

assetMaps += `\nexport const PHOTO_BY_FILE: Record<string, string> = {\n`;
for (const x of artistPhotoImports) {
  assetMaps += `  "${x.file}": ${x.varName},\n`;
}
assetMaps += `};\n\nexport const COVER_BY_FILE: Record<string, string> = {\n`;
for (const x of albumImports) {
  assetMaps += `  "${x.file}": ${x.varName},\n`;
}
assetMaps += `};\n\nexport const FLAG_BY_CODE: Record<string, string> = {\n`;
for (const [code, varName] of Object.entries(flagCodeToVar)) {
  assetMaps += `  ${code}: ${varName},\n`;
}
assetMaps += `};\n\n`;
assetMaps += `export const PLACEHOLDER_PHOTO = ${flagCodeToVar.US ? "imgZuriNakamura" : artistPhotoImports[0]?.varName || '""'};\n`;
assetMaps += `export const PLACEHOLDER_COVER = ${albumImports.find((a) => a.varName === "imgDebut")?.varName || albumImports[0]?.varName || '""'};\n`;

// Fix placeholder - imgZuriNakamura should be in artistPhotoImports
assetMaps = assetMaps.replace(
  /export const PLACEHOLDER_PHOTO = imgZuriNakamura;/,
  "export const PLACEHOLDER_PHOTO = imgZuriNakamura;"
);

fs.writeFileSync(
  "c:/Development/React/musicCatalogApp/src/app/assetMaps.ts",
  assetMaps
);
console.log("Wrote assetMaps.ts");

// ─── types.ts ─────────────────────────────────────────────────────────────────
fs.writeFileSync(
  "c:/Development/React/musicCatalogApp/src/app/types.ts",
  `export type ArtistType = "Solo" | "Group";
export type Cert = "Gold" | "Platinum" | "Diamond" | null;
export type StreamingPlatform = "SP" | "AM" | "AZ";

export interface Artist {
  id: string;
  name: string;
  photo: string;
  flag: string;
  countryCode: string;
  type: ArtistType;
  groupSize?: number;
  since: number;
}

export interface Album {
  id: string;
  title: string;
  artistId: string;
  artistName: string;
  artistPhoto: string;
  label: string;
  year: number;
  sold: string;
  tracks: number;
  singles: number;
  cert: Cert;
  streaming: StreamingPlatform[];
  cover: string;
}
`
);
console.log("Wrote types.ts");

// ─── catalogApi.ts ────────────────────────────────────────────────────────────
fs.writeFileSync(
  "c:/Development/React/musicCatalogApp/src/app/api/catalogApi.ts",
  `import type { Album, Artist } from "../types";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(\`\${API_URL}\${path}\`, {
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    ...init,
  });
  let body: unknown = null;
  const text = await res.text();
  if (text) {
    try { body = JSON.parse(text); } catch { body = { message: text }; }
  }
  if (!res.ok) {
    const message =
      body && typeof body === "object" && "message" in body
        ? String((body as { message: unknown }).message)
        : \`Request failed (\${res.status})\`;
    throw new ApiError(res.status, message);
  }
  return body as T;
}

export type ArtistInput = Omit<Artist, "id">;
export type AlbumInput = Omit<Album, "id" | "artistName" | "artistPhoto">;

export function getArtists(): Promise<Artist[]> {
  return request<Artist[]>("/artists");
}
export function getAlbums(): Promise<Album[]> {
  return request<Album[]>("/albums");
}
export function createArtist(data: ArtistInput): Promise<Artist> {
  return request<{ artist: Artist }>("/artists", { method: "POST", body: JSON.stringify(data) }).then((r) => r.artist);
}
export function updateArtist(id: string, data: ArtistInput): Promise<Artist> {
  return request<{ artist: Artist }>(\`/artists/\${id}\`, { method: "PUT", body: JSON.stringify(data) }).then((r) => r.artist);
}
export function deleteArtist(id: string): Promise<Artist> {
  return request<{ artist: Artist }>(\`/artists/\${id}\`, { method: "DELETE" }).then((r) => r.artist);
}
export function createAlbum(data: AlbumInput): Promise<Album> {
  return request<{ album: Album }>("/albums", { method: "POST", body: JSON.stringify(data) }).then((r) => r.album);
}
export function updateAlbum(id: string, data: AlbumInput): Promise<Album> {
  return request<{ album: Album }>(\`/albums/\${id}\`, { method: "PUT", body: JSON.stringify(data) }).then((r) => r.album);
}
export function deleteAlbum(id: string): Promise<Album> {
  return request<{ album: Album }>(\`/albums/\${id}\`, { method: "DELETE" }).then((r) => r.album);
}
`
);
console.log("Wrote catalogApi.ts");

console.log("Done base files");
