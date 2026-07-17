import type { Album, Artist } from "./types";

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
  const res = await fetch(`${API_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  let body: unknown = null;
  const text = await res.text();
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = { message: text };
    }
  }

  if (!res.ok) {
    const message =
      body && typeof body === "object" && "message" in body
        ? String((body as { message: unknown }).message)
        : `Request failed (${res.status})`;
    throw new ApiError(res.status, message);
  }

  return body as T;
}

export function getArtists(): Promise<Artist[]> {
  return request<Artist[]>("/artists");
}

export function getAlbums(): Promise<Album[]> {
  return request<Album[]>("/albums");
}

export function createArtist(data: Omit<Artist, "id">): Promise<Artist> {
  return request<{ artist: Artist }>("/artists", {
    method: "POST",
    body: JSON.stringify(data),
  }).then((r) => r.artist);
}

export function updateArtist(id: string, data: Omit<Artist, "id">): Promise<Artist> {
  return request<{ artist: Artist }>(`/artists/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  }).then((r) => r.artist);
}

export function deleteArtist(id: string): Promise<Artist> {
  return request<{ artist: Artist }>(`/artists/${id}`, {
    method: "DELETE",
  }).then((r) => r.artist);
}

export function createAlbum(data: Omit<Album, "id">): Promise<Album> {
  return request<{ album: Album }>("/albums", {
    method: "POST",
    body: JSON.stringify(data),
  }).then((r) => r.album);
}

export function updateAlbum(id: string, data: Omit<Album, "id">): Promise<Album> {
  return request<{ album: Album }>(`/albums/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  }).then((r) => r.album);
}

export function deleteAlbum(id: string): Promise<Album> {
  return request<{ album: Album }>(`/albums/${id}`, {
    method: "DELETE",
  }).then((r) => r.album);
}
