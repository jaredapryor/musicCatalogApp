import { Outlet } from "react-router";
import { Toaster } from "sonner";
import { CatalogProvider, NavBar } from "./App";

export default function Root() {
  return (
    <CatalogProvider>
      <div className="min-h-screen bg-background text-foreground">
        <Toaster position="bottom-right" theme="dark" richColors />
        <NavBar />
        <main>
          <Outlet />
        </main>
      </div>
    </CatalogProvider>
  );
}
