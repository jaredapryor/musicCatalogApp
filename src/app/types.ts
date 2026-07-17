export type ArtistType = "solo" | "group";
export type Certification = "none" | "gold" | "platinum" | "multi-platinum";
export type StreamingPlatform = "spotify" | "apple" | "amazon";

export interface Artist {
  id: string;
  name: string;
  country: string;
  countryFlag: string;
  countryCode: string;
  photoUrl: string;
  type: ArtistType;
  memberCount?: number;
  activeSince: number;
}

export interface Album {
  id: string;
  artistId: string;
  title: string;
  coverUrl: string;
  label: string;
  releaseYear: number;
  trackCount: number;
  singleCount: number;
  albumsSold: number;
  certification: Certification;
  streaming: StreamingPlatform[];
}
