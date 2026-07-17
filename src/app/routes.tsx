import { createBrowserRouter } from "react-router";
import Root from "./Root";
import ArtistsPage from "./pages/ArtistsPage";
import AlbumsPage from "./pages/AlbumsPage";
import ArtistDetailPage from "./pages/ArtistDetailPage";
import AlbumDetailPage from "./pages/AlbumDetailPage";
import NotFound from "./pages/NotFound";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, Component: ArtistsPage },
      { path: "artists", Component: ArtistsPage },
      { path: "artists/:artistId", Component: ArtistDetailPage },
      { path: "albums", Component: AlbumsPage },
      { path: "albums/:albumId", Component: AlbumDetailPage },
      { path: "*", Component: NotFound },
    ],
  },
]);
