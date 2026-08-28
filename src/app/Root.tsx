import { Outlet } from "react-router";
import { CatalogProvider, NavBar, useTheme } from "./App";

function AppShell() {
  const { isDark } = useTheme();
  return (
    <div className={`min-h-screen ${isDark ? "bg-[#09090f]" : "bg-[#faf8f4]"}`}>
      <NavBar />
      <main>
        <Outlet />
      </main>
    </div>
  );
}

export default function Root() {
  return (
    <CatalogProvider>
      <AppShell />
    </CatalogProvider>
  );
}
