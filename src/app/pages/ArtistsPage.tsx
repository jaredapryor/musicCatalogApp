import { useNavigate } from "react-router";
import { ArtistsView, useCatalog } from "../App";

export default function ArtistsPage() {
  const { artists, albums, openAddArtist, openEditArtist, openDeleteArtist } = useCatalog();
  const nav = useNavigate();
  return (
    <ArtistsView
      artists={artists}
      albums={albums}
      onSelectArtist={(id) => nav(`/artists/${id}`)}
      onAddArtist={openAddArtist}
      onEditArtist={openEditArtist}
      onDeleteArtist={openDeleteArtist}
    />
  );
}
