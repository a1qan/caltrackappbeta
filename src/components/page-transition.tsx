import { useRouterState } from "@tanstack/react-router";
import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Fades a route swap in/out on pathname change. Purely CSS-based, so it
 * plays nicely with SSR, streaming loaders, and the TanStack router.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [display, setDisplay] = useState<{ key: string; node: ReactNode }>({
    key: pathname,
    node: children,
  });
  const [visible, setVisible] = useState(true);
  const pending = useRef<ReactNode>(children);

  // Always keep the freshest children ref so the swap uses up-to-date content.
  pending.current = children;

  useEffect(() => {
    if (pathname === display.key) {
      // Same route — just refresh children in place, no animation.
      setDisplay((d) => ({ ...d, node: pending.current }));
      return;
    }
    setVisible(false);
    const t = window.setTimeout(() => {
      setDisplay({ key: pathname, node: pending.current });
      requestAnimationFrame(() => setVisible(true));
    }, 180);
    return () => window.clearTimeout(t);
  }, [pathname, display.key]);

  return (
    <div
      key={display.key}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(6px)",
        transition: "opacity 200ms ease, transform 240ms cubic-bezier(0.22, 1, 0.36, 1)",
        willChange: "opacity, transform",
      }}
    >
      {display.node}
    </div>
  );
}
