import { useEffect, useState } from "react";
import { COVER_BY_FILE } from "./assetMaps";
import type { PhotoSource } from "./ArtistAvatar";

export function resolveAlbumCover(
  cover: string,
  coverSource?: PhotoSource
): string {
  if (!cover) return "";
  if (coverSource === "remote") return cover;
  if (coverSource === "local") return COVER_BY_FILE[cover] ?? "";
  if (COVER_BY_FILE[cover]) return COVER_BY_FILE[cover];
  return cover;
}

function VinylRecord({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      role="img"
      aria-label="Vinyl record"
    >
      <circle cx="32" cy="32" r="31" fill="#111111" />
      <circle cx="32" cy="32" r="27" fill="none" stroke="#1f1f1f" strokeWidth="1" />
      <circle cx="32" cy="32" r="22" fill="none" stroke="#1a1a1a" strokeWidth="1" />
      <circle cx="32" cy="32" r="17" fill="none" stroke="#1f1f1f" strokeWidth="1" />
      <circle cx="32" cy="32" r="12" fill="none" stroke="#252525" strokeWidth="1" />
      <circle cx="32" cy="32" r="7.5" fill="#2a2a2a" />
      <circle cx="32" cy="32" r="2.2" fill="#0a0a0a" />
    </svg>
  );
}

interface AlbumCoverProps {
  title: string;
  cover: string;
  coverSource?: PhotoSource;
  className?: string;
  sizeClass?: string;
  roundedClass?: string;
  isDark?: boolean;
  imgClassName?: string;
}

export function AlbumCover({
  title,
  cover,
  coverSource,
  className = "",
  sizeClass = "size-[56px]",
  roundedClass = "rounded-[10px]",
  isDark = true,
  imgClassName = "w-full h-full object-cover",
}: AlbumCoverProps) {
  const src = resolveAlbumCover(cover, coverSource);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  const showImage = Boolean(src) && !failed;
  const bg = isDark ? "#1a1a26" : "#f0ebe2";

  return (
    <div
      className={`${roundedClass} shrink-0 overflow-hidden flex items-center justify-center ${sizeClass} ${className}`}
      style={{ background: bg }}
      aria-label={title}
    >
      {showImage ? (
        <img
          src={src}
          alt={title}
          className={imgClassName}
          onError={() => setFailed(true)}
        />
      ) : (
        <VinylRecord className="w-full h-full" />
      )}
    </div>
  );
}
