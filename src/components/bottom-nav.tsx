import { Link, useRouterState } from "@tanstack/react-router";
import { Home, UtensilsCrossed, Dumbbell, MessageCircle, User } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { to: "/dashboard", label: "Home", Icon: Home },
  { to: "/food", label: "Food", Icon: UtensilsCrossed },
  { to: "/workouts", label: "Train", Icon: Dumbbell },
  { to: "/coach", label: "Coach", Icon: MessageCircle },
  { to: "/settings", label: "You", Icon: User },
] as const;

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto max-w-md px-4 pb-3">
        <div className="glass rounded-3xl shadow-elevated flex items-center justify-around px-2 py-2">
          {items.map(({ to, label, Icon }) => {
            const active = pathname === to || pathname.startsWith(to + "/");
            return (
              <Link
                key={to}
                to={to}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 rounded-2xl px-3 py-1.5 transition-all duration-200",
                  active ? "text-primary scale-105" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <div
                  className={cn(
                    "grid place-items-center transition-all",
                    active ? "size-9 rounded-xl bg-primary/10" : "size-9",
                  )}
                >
                  <Icon className="size-[18px]" strokeWidth={active ? 2.4 : 2} />
                </div>
                <span className={cn("text-[10px] font-medium", active && "font-semibold")}>{label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
