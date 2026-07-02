import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { Droplet, Flame, Plus, Dumbbell, TrendingUp, ChevronRight, MessageCircle } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { fetchProfile } from "@/lib/profile-api";
import { useTracking, calcStreak } from "@/lib/store";
import { ProgressRing } from "@/components/progress-ring";
import { todayStr } from "@/lib/calculations";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const { user } = useAuth();
  const profileQ = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: () => fetchProfile(user!.id),
    enabled: !!user?.id,
  });

  const foodEntries = useTracking((s) => s.foodEntries);
  const water = useTracking((s) => s.water);
  const weights = useTracking((s) => s.weights);
  const workouts = useTracking((s) => s.workouts);
  const addWater = useTracking((s) => s.addWater);

  const today = todayStr();

  const todaysEntries = useMemo(
    () => foodEntries.filter((e) => e.date === today),
    [foodEntries, today],
  );

  const totals = useMemo(() => {
    let cal = 0, p = 0, c = 0, f = 0;
    for (const e of todaysEntries) {
      cal += e.food.calories * e.servings;
      p += e.food.protein * e.servings;
      c += e.food.carbs * e.servings;
      f += e.food.fat * e.servings;
    }
    return { cal, p, c, f };
  }, [todaysEntries]);

  const profile = profileQ.data;
  const calTarget = profile?.calorie_target ?? 2000;
  const remaining = Math.max(0, calTarget - totals.cal);
  const todayWater = water.find((w) => w.date === today)?.ml ?? 0;
  const waterTarget = 2500;

  const workoutsToday = workouts.filter((w) => w.date === today).length;
  const streak = calcStreak(Array.from(new Set(foodEntries.map((e) => e.date))));

  const latestWeight = weights[weights.length - 1]?.weight_kg ?? profile?.weight_kg ?? null;
  const startWeight = weights[0]?.weight_kg ?? profile?.weight_kg ?? null;
  const weightDelta =
    latestWeight && startWeight ? Math.round((latestWeight - startWeight) * 10) / 10 : 0;

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  }, []);

  const dateStr = useMemo(
    () => new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" }),
    [],
  );

  const initial = (profile?.display_name?.[0] ?? user?.email?.[0] ?? "?").toUpperCase();

  return (
    <div className="mx-auto w-full max-w-md px-5 pt-[max(env(safe-area-inset-top),1.25rem)] pb-32">
      {/* Header */}
      <header className="mb-6 flex items-center justify-between">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">{dateStr}</p>
          <h1 className="mt-0.5 text-[22px] font-bold tracking-tight truncate">
            {greeting}, {profile?.display_name?.split(" ")[0] ?? "Friend"}
          </h1>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Link
            to="/achievements"
            className="inline-flex items-center gap-1 rounded-full bg-card border border-border px-2.5 py-1.5"
          >
            <Flame className="size-3.5 text-warning" />
            <span className="text-xs font-bold tabular-nums">{streak}</span>
          </Link>
          <Link
            to="/settings"
            aria-label="Profile & settings"
            className="grid size-10 place-items-center rounded-full bg-card border border-border text-sm font-bold text-primary"
          >
            {initial}
          </Link>
        </div>
      </header>

      {/* Calorie ring + macros */}
      <section className="rounded-3xl bg-card p-6 animate-slide-up">
        <div className="flex flex-col items-center">
          <ProgressRing value={totals.cal} max={calTarget} size={188} stroke={11}>
            <div className="text-center">
              <div className="text-[40px] leading-none font-bold tabular-nums">{Math.round(remaining)}</div>
              <div className="mt-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                kcal left
              </div>
            </div>
          </ProgressRing>
          <p className="mt-3 text-xs text-muted-foreground tabular-nums">
            {Math.round(totals.cal)} eaten · goal {calTarget}
          </p>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-4 border-t border-border pt-4">
          <MacroMini label="Protein" value={totals.p} target={profile?.protein_g ?? 150} barClass="bg-primary" />
          <MacroMini label="Carbs" value={totals.c} target={profile?.carbs_g ?? 220} barClass="bg-[var(--color-carbs)]" />
          <MacroMini label="Fat" value={totals.f} target={profile?.fat_g ?? 70} barClass="bg-[var(--color-fat)]" />
        </div>
      </section>

      {/* Stat rows */}
      <section className="mt-4 space-y-2.5">
        <div className="flex items-center gap-3 rounded-2xl bg-card p-4">
          <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
            <Droplet className="size-4.5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Water</p>
            <p className="text-sm font-bold tabular-nums">
              {(todayWater / 1000).toFixed(1)}L
              <span className="font-medium text-muted-foreground"> / {waterTarget / 1000}L</span>
            </p>
          </div>
          <button
            onClick={() => addWater(today, 250)}
            aria-label="Add 250 ml of water"
            className="press-scale grid size-9 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground"
          >
            <Plus className="size-4" strokeWidth={2.6} />
          </button>
        </div>

        <Link to="/workouts" className="flex items-center gap-3 rounded-2xl bg-card p-4 press-scale">
          <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
            <Dumbbell className="size-4.5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Training</p>
            <p className="text-sm font-bold tabular-nums">
              {workoutsToday}
              <span className="font-medium text-muted-foreground"> logged today</span>
            </p>
          </div>
          <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
        </Link>

        <Link to="/progress" className="flex items-center gap-3 rounded-2xl bg-card p-4 press-scale">
          <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
            <TrendingUp className="size-4.5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Weight</p>
            <p className="text-sm font-bold tabular-nums">
              {latestWeight ? `${latestWeight} kg` : "—"}
            </p>
          </div>
          {weightDelta !== 0 && (
            <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-bold tabular-nums text-primary">
              {weightDelta > 0 ? "+" : ""}{weightDelta} kg
            </span>
          )}
          <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
        </Link>
      </section>

      {/* CalCoach prompt */}
      <Link to="/coach" className="mt-4 block rounded-2xl bg-gradient-to-r from-primary/60 to-border p-px press-scale">
        <div className="flex items-center gap-3 rounded-[calc(1rem-1px)] bg-background p-4">
          <div className="grid size-9 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
            <MessageCircle className="size-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-primary">CalCoach</p>
            <p className="truncate text-xs text-muted-foreground">Meal ideas, training tweaks & motivation.</p>
          </div>
          <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
        </div>
      </Link>

      {/* Today's meals */}
      <section className="mt-6">
        <div className="mb-2.5 flex items-center justify-between px-1">
          <h3 className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Today's meals</h3>
          <Link to="/food" className="text-xs font-semibold text-primary">See all</Link>
        </div>
        <div className="rounded-2xl bg-card px-4">
          {todaysEntries.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Nothing logged yet. Tap <span className="font-semibold text-primary">+</span> to start.
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {todaysEntries.slice(-4).reverse().map((e) => (
                <li key={e.id} className="flex items-center justify-between py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{e.food.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {e.meal} · {e.servings}× {e.food.serving_label}
                    </p>
                  </div>
                  <span className="shrink-0 pl-3 text-sm font-bold tabular-nums">
                    {Math.round(e.food.calories * e.servings)}
                    <span className="ml-1 text-[10px] font-medium text-muted-foreground">kcal</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}

function MacroMini({
  label,
  value,
  target,
  barClass,
}: {
  label: string;
  value: number;
  target: number;
  barClass: string;
}) {
  const pct = Math.max(0, Math.min(100, (value / Math.max(1, target)) * 100));
  return (
    <div className="flex flex-col items-center">
      <span className="text-sm font-bold tabular-nums">
        {Math.round(value)}
        <span className="text-[10px] font-medium text-muted-foreground">/{target}g</span>
      </span>
      <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-background">
        <div className={cn("h-full rounded-full transition-all duration-700 ease-out", barClass)} style={{ width: `${pct}%` }} />
      </div>
      <span className="mt-2 text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{label}</span>
    </div>
  );
}
