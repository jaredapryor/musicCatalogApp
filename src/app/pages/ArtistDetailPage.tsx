import { useNavigate, useParams } from "react-router";
import { ArtistDetailView } from "../App";
import { useCatalog } from "../App";

export default function ArtistDetailPage() {
  const { artistId } = useParams<{ artistId: string }>();
  const { artists, albums, openEditArtist, openDeleteArtist, openAddAlbum, openEditAlbum, openDeleteAlbum } = useCatalog();
  const nav = useNavigate();

  const artist = artists.find(a => a.id === artistId);
  const artistAlbums = albums.filter(al => al.artistId === artistId);

  if (!artist) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center text-muted-foreground">
        Artist not found.
      </div>
    );
  }

  return (
    <ArtistDetailView
      artist={artist}
      albums={artistAlbums}
      onNavigateAlbum={id => nav(`/albums/${id}`)}
      onBack={() => nav("/artists")}
      onEdit={() => openEditArtist(artist)}
      onDelete={() => openDeleteArtist(artist)}
      onAddAlbum={() => openAddAlbum(artist.id)}
      onEditAlbum={openEditAlbum}
      onDeleteAlbum={openDeleteAlbum}
    />
  );
}
