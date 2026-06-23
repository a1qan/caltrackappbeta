import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { Droplet, Flame, Plus, Camera, Dumbbell, TrendingUp, Award } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { fetchProfile } from "@/lib/profile-api";
import { useTracking, calcStreak } from "@/lib/store";
import { ProgressRing } from "@/components/progress-ring";
import { MacroBar } from "@/components/macro-bar";
import { todayStr } from "@/lib/calculations";

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

  return (
    <div className="mx-auto w-full max-w-md px-4 pt-[max(env(safe-area-inset-top),1rem)] pb-32">
      <header className="flex items-center justify-between mb-5">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{greeting},</p>
          <h1 className="text-2xl font-semibold tracking-tight truncate">
            {profile?.display_name ?? "Friend"} 👋
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <StreakBadge streak={streak} />
        </div>
      </header>

      {/* Main calorie ring */}
      <section className="rounded-3xl bg-card border border-border p-5 shadow-elevated animate-slide-up">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Today</p>
            <p className="text-sm font-semibold">{Math.round(totals.cal)} / {calTarget} kcal</p>
          </div>
          <Link
            to="/food"
            className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary"
          >
            <Plus className="size-3.5" /> Log
          </Link>
        </div>

        <div className="flex flex-col items-center py-2">
          <ProgressRing value={totals.cal} max={calTarget} size={210} stroke={16}>
            <div className="text-center">
              <div className="text-4xl font-semibold tabular-nums">{remaining}</div>
              <div className="text-xs text-muted-foreground mt-1">kcal remaining</div>
            </div>
          </ProgressRing>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3">
          <MacroBar label="Protein" value={totals.p} target={profile?.protein_g ?? 150} color="protein" />
          <MacroBar label="Carbs" value={totals.c} target={profile?.carbs_g ?? 220} color="carbs" />
          <MacroBar label="Fat" value={totals.f} target={profile?.fat_g ?? 70} color="fat" />
        </div>
      </section>

      <section className="mt-4 grid grid-cols-2 gap-3">
        <QuickAction to="/scan" icon={<Camera className="size-5" />} title="Scan meal" sub="AI photo" />
        <QuickAction to="/workouts" icon={<Dumbbell className="size-5" />} title="Workout" sub="Log training" />
      </section>

      <section className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-3xl bg-card border border-border p-4 shadow-elevated">
          <div className="flex items-center gap-2">
            <div className="grid size-8 place-items-center rounded-xl bg-[var(--color-fat)]/10 text-[var(--color-fat)]">
              <Droplet className="size-4" />
            </div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Water</p>
          </div>
          <p className="mt-2 text-2xl font-semibold tabular-nums">
            {(todayWater / 1000).toFixed(1)}
            <span className="ml-1 text-sm font-normal text-muted-foreground">/ {waterTarget / 1000}L</span>
          </p>
          <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
            <div className="h-full bg-[var(--color-fat)] transition-all duration-700" style={{ width: `${Math.min(100, (todayWater / waterTarget) * 100)}%` }} />
          </div>
          <div className="mt-3 flex gap-2">
            {[250, 500].map((ml) => (
              <button
                key={ml}
                onClick={() => addWater(today, ml)}
                className="flex-1 rounded-full bg-muted hover:bg-accent text-xs font-medium py-2 transition-colors"
              >
                +{ml}ml
              </button>
            ))}
          </div>
        </div>

        <Link to="/progress" className="rounded-3xl bg-card border border-border p-4 shadow-elevated block">
          <div className="flex items-center gap-2">
            <div className="grid size-8 place-items-center rounded-xl bg-success/10 text-success">
              <TrendingUp className="size-4" />
            </div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Weight</p>
          </div>
          <p className="mt-2 text-2xl font-semibold tabular-nums">
            {latestWeight ? `${latestWeight}` : "—"}
            <span className="ml-1 text-sm font-normal text-muted-foreground">kg</span>
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            {weightDelta === 0 ? "No change yet" : weightDelta > 0 ? `▲ ${weightDelta} kg total` : `▼ ${Math.abs(weightDelta)} kg total`}
          </p>
        </Link>
      </section>

      <section className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-3xl bg-card border border-border p-4 shadow-elevated">
          <div className="flex items-center gap-2">
            <div className="grid size-8 place-items-center rounded-xl bg-primary/10 text-primary">
              <Dumbbell className="size-4" />
            </div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Workouts</p>
          </div>
          <p className="mt-2 text-2xl font-semibold tabular-nums">{workoutsToday}</p>
          <p className="mt-1 text-xs text-muted-foreground">logged today</p>
        </div>
        <Link to="/achievements" className="rounded-3xl bg-card border border-border p-4 shadow-elevated block">
          <div className="flex items-center gap-2">
            <div className="grid size-8 place-items-center rounded-xl bg-warning/15 text-warning">
              <Award className="size-4" />
            </div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Streak</p>
          </div>
          <p className="mt-2 text-2xl font-semibold tabular-nums">{streak}</p>
          <p className="mt-1 text-xs text-muted-foreground">day{streak === 1 ? "" : "s"} in a row</p>
        </Link>
      </section>

      <section className="mt-4 rounded-3xl bg-card border border-border p-4 shadow-elevated">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold">Today's meals</h3>
          <Link to="/food" className="text-xs text-primary font-medium">See all</Link>
        </div>
        {todaysEntries.length === 0 ? (
          <div className="py-6 text-center text-sm text-muted-foreground">
            Nothing logged yet. Tap <span className="text-primary font-medium">Log</span> above to start.
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {todaysEntries.slice(-4).reverse().map((e) => (
              <li key={e.id} className="py-2.5 flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{e.food.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{e.meal} · {e.servings}× {e.food.serving_label}</p>
                </div>
                <span className="text-sm tabular-nums font-medium">{Math.round(e.food.calories * e.servings)} kcal</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function QuickAction({ to, icon, title, sub }: { to: "/scan" | "/workouts"; icon: React.ReactNode; title: string; sub: string }) {
  return (
    <Link
      to={to}
      className="rounded-3xl gradient-primary text-primary-foreground p-4 shadow-glow flex items-center gap-3"
    >
      <div className="grid size-10 place-items-center rounded-xl bg-white/15 backdrop-blur">
        {icon}
      </div>
      <div>
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-xs opacity-90">{sub}</p>
      </div>
    </Link>
  );
}

function StreakBadge({ streak }: { streak: number }) {
  return (
    <div className="inline-flex items-center gap-1 rounded-full bg-warning/15 text-warning px-3 py-1.5">
      <Flame className="size-3.5" />
      <span className="text-xs font-semibold tabular-nums">{streak}</span>
    </div>
  );
}
