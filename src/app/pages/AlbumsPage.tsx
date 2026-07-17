import { useNavigate } from "react-router";
import { AlbumsView } from "../App";
import { useCatalog } from "../App";

export default function AlbumsPage() {
  const { albums, artists, openAddAlbum, openEditAlbum, openDeleteAlbum } = useCatalog();
  const nav = useNavigate();
  return (
    <AlbumsView
      albums={albums}
      artists={artists}
      onSelect={id => nav(`/albums/${id}`)}
      onAdd={() => openAddAlbum()}
      onEdit={openEditAlbum}
      onDeleteRequest={openDeleteAlbum}
    />
  );
}
