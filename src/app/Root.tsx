import { Outlet } from "react-router";
import { CatalogProvider, NavBar } from "./App";

export default function Root() {
  return (
    <CatalogProvider>
      <div className="min-h-screen">
        <NavBar />
        <main>
          <Outlet />
        </main>
      </div>
    </CatalogProvider>
  );
}
