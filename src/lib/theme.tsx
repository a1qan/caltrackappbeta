import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

type Theme = "light" | "dark";
const STORAGE_KEY = "caltrack:theme";

type Ctx = { theme: Theme; toggle: () => void; set: (t: Theme) => void };
const ThemeCtx = createContext<Ctx>({ theme: "light", toggle: () => {}, set: () => {} });

function applyTheme(t: Theme) {
  const root = document.documentElement;
  root.classList.toggle("dark", t === "dark");
  root.style.colorScheme = t;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", t === "dark" ? "#0a0f1e" : "#ffffff");
}

export function useTheme() {
  return useContext(ThemeCtx);
}

export function ThemeBootstrap({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const stored = (typeof localStorage !== "undefined" && localStorage.getItem(STORAGE_KEY)) as Theme | null;
    const initial: Theme = stored === "dark" || stored === "light" ? stored : "light";
    setTheme(initial);
    applyTheme(initial);
  }, []);

  const set = useCallback((t: Theme) => {
    setTheme(t);
    try { localStorage.setItem(STORAGE_KEY, t); } catch { /* ignore */ }
    applyTheme(t);
  }, []);

  const toggle = useCallback(() => set(theme === "dark" ? "light" : "dark"), [theme, set]);

  return <ThemeCtx.Provider value={{ theme, toggle, set }}>{children}</ThemeCtx.Provider>;
}
