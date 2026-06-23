import { useEffect, useState, type ReactNode } from "react";

const STORAGE_KEY = "caltrack:theme";

function applyTheme(theme: "light" | "dark") {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (theme === "dark") root.classList.add("dark");
  else root.classList.remove("dark");
}

function readInitial(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (saved === "light" || saved === "dark") return saved;
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function useTheme() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  useEffect(() => {
    const t = readInitial();
    setTheme(t);
    applyTheme(t);
  }, []);
  const toggle = () => {
    setTheme((cur) => {
      const next = cur === "light" ? "dark" : "light";
      window.localStorage.setItem(STORAGE_KEY, next);
      applyTheme(next);
      return next;
    });
  };
  const set = (t: "light" | "dark") => {
    setTheme(t);
    window.localStorage.setItem(STORAGE_KEY, t);
    applyTheme(t);
  };
  return { theme, toggle, set };
}

export function ThemeBootstrap({ children }: { children: ReactNode }) {
  useEffect(() => {
    applyTheme(readInitial());
  }, []);
  return <>{children}</>;
}
