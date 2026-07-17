import { useNavigate } from "react-router";
import { ArtistsView } from "../App";
import { useCatalog } from "../App";

export default function ArtistsPage() {
  const { artists, albums, openAddArtist, openEditArtist, openDeleteArtist } = useCatalog();
  const nav = useNavigate();
  return (
    <ArtistsView
      artists={artists}
      albums={albums}
      onSelect={id => nav(`/artists/${id}`)}
      onAdd={openAddArtist}
      onEdit={openEditArtist}
      onDelete={openDeleteArtist}
    />
  );
}
