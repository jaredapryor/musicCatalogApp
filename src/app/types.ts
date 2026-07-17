export type ArtistType = "Solo" | "Group";
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
