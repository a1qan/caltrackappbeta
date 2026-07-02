import { useEffect, type ReactNode } from "react";

// CalTrack is dark-only (Midnight Focus design). The .dark class is kept on
// <html> so any dark-scoped styles and libraries render consistently.

export function useTheme() {
  return {
    theme: "dark" as const,
    toggle: () => {},
    set: (_t: "light" | "dark") => {},
  };
}

export function ThemeBootstrap({ children }: { children: ReactNode }) {
  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);
  return <>{children}</>;
}
