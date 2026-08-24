import { useEffect, useState } from "react";
import { PHOTO_BY_FILE } from "./assetMaps";

export type PhotoSource = "local" | "remote";

export function artistInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) {
    const word = parts[0];
    return word.slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

/** Stable HSL background from name so initials circles vary without flicker. */
export function colorFromName(name: string): string {
  let hash = 0;
  const key = name.trim().toLowerCase() || "?";
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  }
  const hue = hash % 360;
  return `hsl(${hue}, 58%, 42%)`;
}

/** Resolve stored photo to a display URL. Empty string means show initials. */
export function resolveArtistPhoto(
  photo: string,
  photoSource?: PhotoSource
): string {
  if (!photo) return "";
  if (photoSource === "remote") return photo;
  if (photoSource === "local") return PHOTO_BY_FILE[photo] ?? "";
  if (PHOTO_BY_FILE[photo]) return PHOTO_BY_FILE[photo];
  return photo;
}

interface ArtistAvatarProps {
  name: string;
  photo: string;
  photoSource?: PhotoSource;
  className?: string;
  sizeClass?: string;
  shape?: "circle" | "rounded-square" | "square";
  isDark?: boolean;
  textClassName?: string;
}

function initialsFontSize(sizeClass: string): string {
  if (sizeClass.includes("202") || sizeClass.includes("[202")) return "text-[50px]";
  if (sizeClass.includes("168") || sizeClass.includes("[168")) return "text-[42px]";
  if (sizeClass.includes("80") || sizeClass.includes("[80")) return "text-[24px]";
  if (sizeClass.includes("70") || sizeClass.includes("[70")) return "text-[20px]";
  if (sizeClass.includes("64") || sizeClass.includes("[64")) return "text-[18px]";
  if (sizeClass.includes("42") || sizeClass.includes("[42")) return "text-[13px]";
  if (sizeClass.includes("40") || sizeClass.includes("[40")) return "text-[12px]";
  return "text-[16px]";
}

export function ArtistAvatar({
  name,
  photo,
  photoSource,
  className = "",
  sizeClass = "size-[56px]",
  shape = "circle",
  isDark = true,
  textClassName,
}: ArtistAvatarProps) {
  const src = resolveArtistPhoto(photo, photoSource);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  const showImage = Boolean(src) && !failed;
  const neutralBg = isDark ? "#1a1a26" : "#f0ebe2";
  const bg = showImage ? neutralBg : colorFromName(name);
  const fontSize = initialsFontSize(sizeClass);
  const shapeClass =
    shape === "rounded-square"
      ? "rounded-[24px]"
      : shape === "square"
        ? "rounded-none"
        : "rounded-full";

  return (
    <div
      className={`${shapeClass} shrink-0 overflow-hidden flex items-center justify-center ${sizeClass} ${className}`}
      style={{ background: bg }}
      aria-label={name}
    >
      {showImage ? (
        <img
          src={src}
          alt={name}
          className="w-full h-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <span
          className={`font-semibold select-none text-[#f8fafc] ${fontSize} ${textClassName ?? ""}`}
        >
          {artistInitials(name)}
        </span>
      )}
    </div>
  );
}
