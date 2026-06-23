import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Plus, Trash2, Camera } from "lucide-react";
import { PageHeader } from "@/components/mobile-shell";
import { useTracking, workoutVolume } from "@/lib/store";
import { todayStr } from "@/lib/calculations";

export const Route = createFileRoute("/_authenticated/progress")({
  component: ProgressPage,
});

type Tab = "weight" | "macros" | "workouts" | "photos";

function ProgressPage() {
  const [tab, setTab] = useState<Tab>("weight");
  return (
    <div className="mx-auto w-full max-w-md px-4 pt-[max(env(safe-area-inset-top),1rem)] pb-32">
      <PageHeader title="Progress" />

      <div className="grid grid-cols-4 gap-1 rounded-2xl bg-muted p-1 text-xs">
        {(["weight", "macros", "workouts", "photos"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`h-10 rounded-xl capitalize font-medium ${tab === t ? "bg-card shadow-sm" : "text-muted-foreground"}`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="mt-5">
        {tab === "weight" && <WeightView />}
        {tab === "macros" && <MacrosView />}
        {tab === "workouts" && <WorkoutsView />}
        {tab === "photos" && <PhotosView />}
      </div>
    </div>
  );
}

function WeightView() {
  const weights = useTracking((s) => s.weights);
  const add = useTracking((s) => s.addWeight);
  const remove = useTracking((s) => s.removeWeight);
  const [w, setW] = useState(weights.at(-1)?.weight_kg ?? 75);

  const data = weights.map((e) => ({ date: e.date.slice(5), weight: e.weight_kg }));

  return (
    <div>
      <div className="rounded-3xl bg-card border border-border p-4 shadow-elevated">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">Trend</p>
        <div className="h-44 mt-2">
          {data.length < 2 ? (
            <div className="h-full grid place-items-center text-sm text-muted-foreground">Log at least 2 days to see your trend.</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 6, right: 6, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="wG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" />
                <XAxis dataKey="date" stroke="var(--color-muted-foreground)" fontSize={11} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={11} domain={["auto", "auto"]} />
                <Tooltip contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 12 }} />
                <Area type="monotone" dataKey="weight" stroke="var(--color-primary)" strokeWidth={2.5} fill="url(#wG)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="mt-4 rounded-3xl bg-card border border-border p-4 shadow-elevated">
        <p className="text-sm font-semibold">Log today's weight</p>
        <div className="mt-3 flex items-center gap-2">
          <input
            type="number"
            step="0.1"
            value={w}
            onChange={(e) => setW(parseFloat(e.target.value) || 0)}
            className="flex-1 h-12 rounded-2xl border border-border bg-background px-4 outline-none tabular-nums focus:ring-4 focus:ring-ring/15"
          />
          <span className="text-sm text-muted-foreground">kg</span>
          <button
            onClick={() => { add({ date: todayStr(), weight_kg: w, loggedAt: Date.now() }); }}
            className="h-12 px-5 rounded-full gradient-primary text-primary-foreground font-semibold shadow-glow"
          >
            Save
          </button>
        </div>
      </div>

      {weights.length > 0 && (
        <div className="mt-4 rounded-3xl bg-card border border-border p-2 shadow-elevated divide-y divide-border">
          {[...weights].reverse().map((e) => (
            <div key={e.date} className="px-2 py-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium tabular-nums">{e.weight_kg} kg</p>
                <p className="text-xs text-muted-foreground">{e.date}</p>
              </div>
              <button onClick={() => remove(e.date)} className="grid size-8 place-items-center rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MacrosView() {
  const entries = useTracking((s) => s.foodEntries);
  const data = useMemo(() => {
    const map = new Map<string, { date: string; cal: number; p: number; c: number; f: number }>();
    for (const e of entries) {
      const r = map.get(e.date) ?? { date: e.date, cal: 0, p: 0, c: 0, f: 0 };
      r.cal += e.food.calories * e.servings;
      r.p += e.food.protein * e.servings;
      r.c += e.food.carbs * e.servings;
      r.f += e.food.fat * e.servings;
      map.set(e.date, r);
    }
    return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date)).slice(-14).map((r) => ({ ...r, date: r.date.slice(5) }));
  }, [entries]);

  return (
    <div className="rounded-3xl bg-card border border-border p-4 shadow-elevated">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">Calories — last 14 days</p>
      <div className="h-52 mt-2">
        {data.length === 0 ? (
          <div className="h-full grid place-items-center text-sm text-muted-foreground">No data yet. Start logging food.</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 6, right: 6, bottom: 0, left: -20 }}>
              <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" />
              <XAxis dataKey="date" stroke="var(--color-muted-foreground)" fontSize={11} />
              <YAxis stroke="var(--color-muted-foreground)" fontSize={11} />
              <Tooltip contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 12 }} />
              <Bar dataKey="cal" fill="var(--color-primary)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

function WorkoutsView() {
  const workouts = useTracking((s) => s.workouts);
  const data = useMemo(() => {
    const map = new Map<string, number>();
    for (const w of workouts) map.set(w.date, (map.get(w.date) ?? 0) + workoutVolume(w));
    return Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-14)
      .map(([date, volume]) => ({ date: date.slice(5), volume: Math.round(volume) }));
  }, [workouts]);

  return (
    <div className="rounded-3xl bg-card border border-border p-4 shadow-elevated">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">Workout volume (kg)</p>
      <div className="h-52 mt-2">
        {data.length === 0 ? (
          <div className="h-full grid place-items-center text-sm text-muted-foreground">No workouts logged yet.</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 6, right: 6, bottom: 0, left: -20 }}>
              <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" />
              <XAxis dataKey="date" stroke="var(--color-muted-foreground)" fontSize={11} />
              <YAxis stroke="var(--color-muted-foreground)" fontSize={11} />
              <Tooltip contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 12 }} />
              <Bar dataKey="volume" fill="var(--color-primary)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

function PhotosView() {
  const photos = useTracking((s) => s.photos);
  const addPhoto = useTracking((s) => s.addPhoto);
  const removePhoto = useTracking((s) => s.removePhoto);

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      addPhoto({ id: crypto.randomUUID(), date: todayStr(), dataUrl: String(reader.result) });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  return (
    <div>
      <label className="rounded-3xl border-2 border-dashed border-border bg-card p-6 flex flex-col items-center text-muted-foreground cursor-pointer hover:bg-accent transition-colors">
        <Camera className="size-7" />
        <span className="mt-2 text-sm font-medium">Add progress photo</span>
        <input type="file" accept="image/*" capture="environment" className="hidden" onChange={onPick} />
      </label>

      {photos.length === 0 ? (
        <p className="mt-6 text-center text-sm text-muted-foreground">No photos yet. Add one a week to see your transformation.</p>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-3">
          {photos.map((p) => (
            <div key={p.id} className="relative">
              <img src={p.dataUrl} alt={p.date} className="w-full aspect-[3/4] rounded-2xl object-cover" />
              <button onClick={() => removePhoto(p.id)} className="absolute top-2 right-2 size-8 grid place-items-center rounded-full bg-background/80 backdrop-blur">
                <Trash2 className="size-4" />
              </button>
              <span className="absolute bottom-2 left-2 text-[10px] bg-background/80 backdrop-blur px-2 py-0.5 rounded-full">{p.date}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// hush unused import lint
const _Plus = Plus;
void _Plus;
