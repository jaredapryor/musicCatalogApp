import { useNavigate, useParams } from "react-router";
import { AlbumDetailView } from "../App";
import { useCatalog } from "../App";

export default function AlbumDetailPage() {
  const { albumId } = useParams<{ albumId: string }>();
  const { albums, artists, openEditAlbum, openDeleteAlbum } = useCatalog();
  const nav = useNavigate();

  const album = albums.find(al => al.id === albumId);
  const artist = album ? artists.find(a => a.id === album.artistId) ?? null : null;

  if (!album) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center text-muted-foreground">
        Album not found.
      </div>
    );
  }

  return (
    <AlbumDetailView
      album={album}
      artist={artist}
      onNavigateArtist={id => nav(`/artists/${id}`)}
      onBack={() => nav(-1)}
      onEdit={() => openEditAlbum(album)}
      onDeleteRequest={() => openDeleteAlbum(album)}
    />
  );
}
