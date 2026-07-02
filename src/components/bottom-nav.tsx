import { Link, useRouterState } from "@tanstack/react-router";
import { Home, UtensilsCrossed, Dumbbell, MessageCircle, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

const leftItems = [
  { to: "/dashboard", label: "Home", Icon: Home },
  { to: "/food", label: "Food", Icon: UtensilsCrossed },
] as const;

const rightItems = [
  { to: "/workouts", label: "Train", Icon: Dumbbell },
  { to: "/coach", label: "Coach", Icon: MessageCircle },
] as const;

function Tab({
  to,
  label,
  Icon,
  active,
}: {
  to: string;
  label: string;
  Icon: typeof Home;
  active: boolean;
}) {
  return (
    <Link
      to={to}
      className={cn(
        "flex flex-col items-center justify-center gap-1 px-3 py-1 press-scale",
        active ? "text-primary" : "text-muted-foreground",
      )}
    >
      <Icon className="size-[22px]" strokeWidth={active ? 2.4 : 2} />
      <span className="text-[9px] font-bold uppercase tracking-wider">{label}</span>
    </Link>
  );
}

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isActive = (to: string) => pathname === to || pathname.startsWith(to + "/");
  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 border-t border-border bg-card/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-md items-center justify-between px-6 pt-2 pb-[max(env(safe-area-inset-bottom),0.75rem)]">
        {leftItems.map((it) => (
          <Tab key={it.to} {...it} active={isActive(it.to)} />
        ))}
        <Link
          to="/scan"
          aria-label="Quick log — scan a meal or barcode"
          className="press-scale -mt-9 grid size-14 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-glow border-4 border-background"
        >
          <Plus className="size-6" strokeWidth={2.6} />
        </Link>
        {rightItems.map((it) => (
          <Tab key={it.to} {...it} active={isActive(it.to)} />
        ))}
      </div>
    </nav>
  );
}
