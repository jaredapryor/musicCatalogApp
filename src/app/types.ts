export type ArtistType = "Solo" | "Group";
export type Cert = "Gold" | "Platinum" | "Diamond" | null;
export type StreamingPlatform = "SP" | "AM" | "AZ";
export type PhotoSource = "local" | "remote";

export interface Artist {
  id: string;
  name: string;
  photo: string;
  photoSource: PhotoSource;
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
  artistPhotoSource?: PhotoSource;
  label: string;
  year: number;
  sold: string;
  tracks: number;
  singles: number;
  cert: Cert;
  streaming: StreamingPlatform[];
  cover: string;
  coverSource: PhotoSource;
}
