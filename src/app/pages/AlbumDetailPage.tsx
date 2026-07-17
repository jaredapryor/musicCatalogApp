import { useNavigate, useParams } from "react-router";
import { AlbumDetailView, useCatalog } from "../App";

export default function AlbumDetailPage() {
  const { albumId } = useParams<{ albumId: string }>();
  const { albums, openEditAlbum, openDeleteAlbum } = useCatalog();
  const nav = useNavigate();

  const album = albums.find((al) => al.id === albumId);

  if (!album) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center text-[#7070a0]">
        Album not found.
      </div>
    );
  }

  return (
    <AlbumDetailView
      album={album}
      onBack={() => nav(-1)}
      onEdit={() => openEditAlbum(album)}
      onDelete={() => openDeleteAlbum(album)}
      onGoToArtist={() => nav(`/artists/${album.artistId}`)}
    />
  );
}
