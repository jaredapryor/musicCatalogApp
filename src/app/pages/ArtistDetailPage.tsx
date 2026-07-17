import { useNavigate, useParams } from "react-router";
import { ArtistDetailView, useCatalog } from "../App";

export default function ArtistDetailPage() {
  const { artistId } = useParams<{ artistId: string }>();
  const {
    artists,
    albums,
    openEditArtist,
    openDeleteArtist,
    openAddAlbum,
    openEditAlbum,
    openDeleteAlbum,
  } = useCatalog();
  const nav = useNavigate();

  const artist = artists.find((a) => a.id === artistId);

  if (!artist) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center text-[#7070a0]">
        Artist not found.
      </div>
    );
  }

  return (
    <ArtistDetailView
      artist={artist}
      albums={albums}
      onBack={() => nav("/artists")}
      onSelectAlbum={(id) => nav(`/albums/${id}`)}
      onAddAlbum={() => openAddAlbum(artist.id)}
      onEditAlbum={openEditAlbum}
      onDeleteAlbum={openDeleteAlbum}
      onEditArtist={() => openEditArtist(artist)}
      onDeleteArtist={() => openDeleteArtist(artist)}
    />
  );
}
