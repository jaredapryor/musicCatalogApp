import { useNavigate } from "react-router";
import { AlbumsView, useCatalog } from "../App";

export default function AlbumsPage() {
  const { albums, openEditAlbum, openDeleteAlbum } = useCatalog();
  const nav = useNavigate();
  return (
    <AlbumsView
      albums={albums}
      onSelectAlbum={(id) => nav(`/albums/${id}`)}
      onEditAlbum={openEditAlbum}
      onDeleteAlbum={openDeleteAlbum}
    />
  );
}
