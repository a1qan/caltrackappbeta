import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { Award, Flame, Trophy, Dumbbell, UtensilsCrossed, TrendingUp, Lock } from "lucide-react";
import { PageHeader } from "@/components/mobile-shell";
import { useTracking, calcStreak } from "@/lib/store";

export const Route = createFileRoute("/_authenticated/achievements")({
  component: AchievementsPage,
});

interface AchievementDef {
  id: string;
  title: string;
  desc: string;
  Icon: React.FC<{ className?: string }>;
  target: number;
  current: number;
}

function AchievementsPage() {
  const foodEntries = useTracking((s) => s.foodEntries);
  const workouts = useTracking((s) => s.workouts);
  const weights = useTracking((s) => s.weights);

  const nutritionStreak = calcStreak(Array.from(new Set(foodEntries.map((e) => e.date))));
  const workoutStreak = calcStreak(Array.from(new Set(workouts.map((w) => w.date))));
  const totalWorkouts = workouts.length;
  const totalMeals = foodEntries.length;
  const totalWeighIns = weights.length;

  const list: AchievementDef[] = useMemo(() => [
    { id: "first-meal", title: "First Bite", desc: "Log your first meal", Icon: UtensilsCrossed, target: 1, current: totalMeals },
    { id: "ten-meals", title: "Tracker", desc: "Log 10 meals", Icon: UtensilsCrossed, target: 10, current: totalMeals },
    { id: "50-meals", title: "Macro Maven", desc: "Log 50 meals", Icon: UtensilsCrossed, target: 50, current: totalMeals },
    { id: "streak-3", title: "On a Roll", desc: "3-day nutrition streak", Icon: Flame, target: 3, current: nutritionStreak },
    { id: "streak-7", title: "Week One", desc: "7-day nutrition streak", Icon: Flame, target: 7, current: nutritionStreak },
    { id: "streak-30", title: "Unstoppable", desc: "30-day nutrition streak", Icon: Flame, target: 30, current: nutritionStreak },
    { id: "workout-1", title: "Iron Initiate", desc: "Finish your first workout", Icon: Dumbbell, target: 1, current: totalWorkouts },
    { id: "workout-10", title: "Gym Rat", desc: "Finish 10 workouts", Icon: Dumbbell, target: 10, current: totalWorkouts },
    { id: "workout-50", title: "Beast Mode", desc: "Finish 50 workouts", Icon: Trophy, target: 50, current: totalWorkouts },
    { id: "wstreak-3", title: "Consistent", desc: "3-day workout streak", Icon: Dumbbell, target: 3, current: workoutStreak },
    { id: "weigh-5", title: "Check-In", desc: "Log 5 weigh-ins", Icon: TrendingUp, target: 5, current: totalWeighIns },
    { id: "weigh-20", title: "Tracked Transformation", desc: "Log 20 weigh-ins", Icon: TrendingUp, target: 20, current: totalWeighIns },
  ], [totalMeals, totalWorkouts, totalWeighIns, nutritionStreak, workoutStreak]);

  const unlocked = list.filter((a) => a.current >= a.target).length;

  return (
    <div className="mx-auto w-full max-w-md px-4 pt-[max(env(safe-area-inset-top),1rem)] pb-32">
      <PageHeader title="Achievements" />

      <div className="rounded-3xl gradient-primary text-primary-foreground p-5 shadow-glow">
        <div className="flex items-center gap-3">
          <div className="grid size-12 place-items-center rounded-2xl bg-white/15 backdrop-blur">
            <Award className="size-6" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider opacity-90">Badges unlocked</p>
            <p className="text-3xl font-semibold tabular-nums">{unlocked} <span className="text-base font-normal opacity-80">/ {list.length}</span></p>
          </div>
        </div>
      </div>

      <ul className="mt-4 grid grid-cols-2 gap-3">
        {list.map((a) => {
          const done = a.current >= a.target;
          const pct = Math.min(100, (a.current / a.target) * 100);
          return (
            <li key={a.id} className={`rounded-3xl p-4 shadow-elevated border ${done ? "bg-card border-primary/40" : "bg-card border-border"}`}>
              <div className={`grid size-10 place-items-center rounded-xl ${done ? "gradient-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                {done ? <a.Icon className="size-5" /> : <Lock className="size-4" />}
              </div>
              <p className="mt-3 text-sm font-semibold">{a.title}</p>
              <p className="text-xs text-muted-foreground">{a.desc}</p>
              <div className="mt-2 h-1 rounded-full bg-muted overflow-hidden">
                <div className={`h-full ${done ? "gradient-primary" : "bg-primary/40"}`} style={{ width: `${pct}%` }} />
              </div>
              <p className="mt-1 text-[10px] tabular-nums text-muted-foreground">{Math.min(a.current, a.target)} / {a.target}</p>
            </li>
          );
        })}
      </ul>

      <section className="mt-6 rounded-3xl bg-card border border-border p-5 shadow-elevated">
        <h3 className="text-sm font-semibold">This week's challenge</h3>
        <p className="mt-1 text-sm text-muted-foreground">Hit your calorie target 5 days in a row.</p>
        <div className="mt-3 h-2 rounded-full bg-muted overflow-hidden">
          <div className="h-full gradient-primary" style={{ width: `${Math.min(100, (nutritionStreak / 5) * 100)}%` }} />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">{Math.min(nutritionStreak, 5)} / 5 days</p>
      </section>
    </div>
  );
}
