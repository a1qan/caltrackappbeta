import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Camera, Heart, Plus, Search, Star, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { useTracking } from "@/lib/store";
import { searchFoods, BUILTIN_FOODS } from "@/lib/foods";
import { todayStr } from "@/lib/calculations";
import { PageHeader } from "@/components/mobile-shell";
import type { FoodEntry, FoodItem, MealType } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/food")({
  component: FoodPage,
});

const MEALS: MealType[] = ["breakfast", "lunch", "dinner", "snack"];

function FoodPage() {
  const today = todayStr();
  const foodEntries = useTracking((s) => s.foodEntries);
  const remove = useTracking((s) => s.removeFoodEntry);
  const [openMeal, setOpenMeal] = useState<MealType | null>(null);

  const grouped = useMemo(() => {
    const map: Record<MealType, FoodEntry[]> = { breakfast: [], lunch: [], dinner: [], snack: [] };
    for (const e of foodEntries) if (e.date === today) map[e.meal].push(e);
    return map;
  }, [foodEntries, today]);

  const totals = useMemo(() => {
    let cal = 0, p = 0, c = 0, f = 0;
    for (const e of foodEntries.filter((e) => e.date === today)) {
      cal += e.food.calories * e.servings;
      p += e.food.protein * e.servings;
      c += e.food.carbs * e.servings;
      f += e.food.fat * e.servings;
    }
    return { cal, p, c, f };
  }, [foodEntries, today]);

  return (
    <div className="mx-auto w-full max-w-md px-4 pt-[max(env(safe-area-inset-top),1rem)] pb-32">
      <PageHeader
        title="Food log"
        trailing={
          <Link to="/scan" aria-label="Scan" className="grid size-10 place-items-center rounded-full bg-primary text-primary-foreground shadow-glow">
            <Camera className="size-4" />
          </Link>
        }
      />

      <div className="rounded-3xl bg-card border border-border p-4 shadow-elevated grid grid-cols-4 gap-2 text-center">
        <Stat label="kcal" v={Math.round(totals.cal)} />
        <Stat label="P" v={Math.round(totals.p)} unit="g" color="text-[var(--color-protein)]" />
        <Stat label="C" v={Math.round(totals.c)} unit="g" color="text-[var(--color-carbs)]" />
        <Stat label="F" v={Math.round(totals.f)} unit="g" color="text-[var(--color-fat)]" />
      </div>

      <div className="mt-4 space-y-3">
        {MEALS.map((meal) => (
          <MealSection
            key={meal}
            meal={meal}
            entries={grouped[meal]}
            onAdd={() => setOpenMeal(meal)}
            onRemove={remove}
          />
        ))}
      </div>

      {openMeal && <AddFoodSheet meal={openMeal} onClose={() => setOpenMeal(null)} />}
    </div>
  );
}

function Stat({ label, v, unit, color }: { label: string; v: number; unit?: string; color?: string }) {
  return (
    <div>
      <div className={`text-xl font-semibold tabular-nums ${color ?? ""}`}>{v}{unit ?? ""}</div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
    </div>
  );
}

function MealSection({
  meal, entries, onAdd, onRemove,
}: {
  meal: MealType;
  entries: FoodEntry[];
  onAdd: () => void;
  onRemove: (id: string) => void;
}) {
  const total = entries.reduce((s, e) => s + e.food.calories * e.servings, 0);
  return (
    <section className="rounded-3xl bg-card border border-border p-4 shadow-elevated">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold capitalize">{meal}</h3>
          <p className="text-xs text-muted-foreground">{Math.round(total)} kcal</p>
        </div>
        <button
          onClick={onAdd}
          className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-3 py-1.5 text-xs font-semibold"
        >
          <Plus className="size-3.5" /> Add
        </button>
      </div>
      {entries.length > 0 && (
        <ul className="mt-3 divide-y divide-border">
          {entries.map((e) => (
            <li key={e.id} className="py-2.5 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{e.food.name}</p>
                <p className="text-xs text-muted-foreground">{e.servings}× {e.food.serving_label}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm tabular-nums">{Math.round(e.food.calories * e.servings)} kcal</span>
                <button
                  onClick={() => onRemove(e.id)}
                  aria-label="Remove"
                  className="grid size-8 place-items-center rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function AddFoodSheet({ meal, onClose }: { meal: MealType; onClose: () => void }) {
  const customs = useTracking((s) => s.customFoods);
  const favs = useTracking((s) => s.favorites);
  const toggleFav = useTracking((s) => s.toggleFavorite);
  const addCustom = useTracking((s) => s.addCustomFood);
  const addEntry = useTracking((s) => s.addFoodEntry);

  const [q, setQ] = useState("");
  const [tab, setTab] = useState<"search" | "fav" | "mine" | "new">("search");
  const [picked, setPicked] = useState<FoodItem | null>(null);

  const results = useMemo(() => {
    const all = [...customs, ...BUILTIN_FOODS];
    if (tab === "fav") return all.filter((f) => favs.includes(f.id));
    if (tab === "mine") return customs;
    return searchFoods(q, customs);
  }, [q, customs, favs, tab]);

  return (
    <div className="fixed inset-0 z-50 bg-background/60 backdrop-blur-sm flex items-end" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md mx-auto rounded-t-3xl bg-card border border-border shadow-glow animate-slide-up max-h-[88vh] overflow-y-auto pb-[env(safe-area-inset-bottom)]"
      >
        <div className="sticky top-0 bg-card/95 backdrop-blur z-10 px-5 pt-4 pb-2 rounded-t-3xl">
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-muted" />
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold capitalize">Add to {meal}</h3>
            <button onClick={onClose} className="grid size-9 place-items-center rounded-full bg-muted"><X className="size-4" /></button>
          </div>
          {tab !== "new" && (
            <label className="mt-3 flex items-center gap-2 rounded-2xl border border-border bg-background px-3 h-11">
              <Search className="size-4 text-muted-foreground" />
              <input
                autoFocus
                placeholder="Search foods…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="flex-1 bg-transparent outline-none text-sm"
              />
            </label>
          )}
          <div className="mt-3 flex gap-1.5 text-xs">
            {(["search", "fav", "mine", "new"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-3 py-1.5 rounded-full font-medium ${tab === t ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
              >
                {t === "search" ? "All" : t === "fav" ? "★ Favorites" : t === "mine" ? "My foods" : "+ Create"}
              </button>
            ))}
          </div>
        </div>

        <div className="px-5 pt-3">
          {tab === "new" ? (
            <NewFoodForm onSave={(f) => { addCustom(f); setPicked(f); setTab("search"); toast.success("Food saved"); }} />
          ) : (
            <ul className="divide-y divide-border">
              {results.length === 0 && (
                <li className="py-10 text-center text-sm text-muted-foreground">No matches.</li>
              )}
              {results.map((f) => (
                <li key={f.id} className="py-3 flex items-center justify-between gap-2">
                  <button onClick={() => setPicked(f)} className="flex-1 text-left min-w-0">
                    <p className="text-sm font-medium truncate">{f.name}{f.brand ? <span className="text-muted-foreground"> · {f.brand}</span> : null}</p>
                    <p className="text-xs text-muted-foreground">{f.serving_label} · {f.calories} kcal · P{f.protein} C{f.carbs} F{f.fat}</p>
                  </button>
                  <button
                    onClick={() => toggleFav(f.id)}
                    aria-label="Favorite"
                    className={`grid size-9 place-items-center rounded-full ${favs.includes(f.id) ? "text-warning" : "text-muted-foreground"}`}
                  >
                    <Star className={`size-4 ${favs.includes(f.id) ? "fill-current" : ""}`} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {picked && (
          <ServingPicker
            food={picked}
            onCancel={() => setPicked(null)}
            onAdd={(servings) => {
              addEntry({
                id: crypto.randomUUID(),
                date: todayStr(),
                meal,
                food: picked,
                servings,
                loggedAt: Date.now(),
              });
              toast.success("Added to log");
              onClose();
            }}
          />
        )}
      </div>
    </div>
  );
}

function ServingPicker({ food, onAdd, onCancel }: { food: FoodItem; onAdd: (s: number) => void; onCancel: () => void }) {
  const [s, setS] = useState(1);
  return (
    <div className="fixed inset-0 z-[60] bg-background/70 flex items-end" onClick={onCancel}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md mx-auto rounded-t-3xl bg-card border border-border p-5 animate-slide-up pb-[max(env(safe-area-inset-bottom),1rem)]">
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-muted" />
        <h3 className="text-base font-semibold">{food.name}</h3>
        <p className="text-xs text-muted-foreground">{food.serving_label}</p>
        <div className="mt-4 flex items-center justify-center gap-4">
          <button onClick={() => setS((v) => Math.max(0.25, v - 0.25))} className="size-12 rounded-full bg-muted text-xl">−</button>
          <div className="text-4xl font-semibold tabular-nums w-20 text-center">{s}</div>
          <button onClick={() => setS((v) => v + 0.25)} className="size-12 rounded-full bg-muted text-xl">+</button>
        </div>
        <div className="mt-4 grid grid-cols-4 gap-2 text-center text-xs">
          <Sm label="kcal" v={Math.round(food.calories * s)} />
          <Sm label="P" v={Math.round(food.protein * s)} color="text-[var(--color-protein)]" />
          <Sm label="C" v={Math.round(food.carbs * s)} color="text-[var(--color-carbs)]" />
          <Sm label="F" v={Math.round(food.fat * s)} color="text-[var(--color-fat)]" />
        </div>
        <button onClick={() => onAdd(s)} className="mt-5 w-full h-12 rounded-full gradient-primary text-primary-foreground font-semibold shadow-glow">
          Add to log
        </button>
      </div>
    </div>
  );
}
function Sm({ label, v, color }: { label: string; v: number; color?: string }) {
  return <div><div className={`text-base font-semibold tabular-nums ${color ?? ""}`}>{v}</div><div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div></div>;
}

function NewFoodForm({ onSave }: { onSave: (f: FoodItem) => void }) {
  const [form, setForm] = useState({ name: "", serving_label: "100 g", calories: 0, protein: 0, carbs: 0, fat: 0 });
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!form.name.trim()) return;
        onSave({ id: crypto.randomUUID(), name: form.name.trim(), serving_g: 100, serving_label: form.serving_label, calories: +form.calories, protein: +form.protein, carbs: +form.carbs, fat: +form.fat, isCustom: true });
      }}
      className="space-y-3 pb-6"
    >
      <Input label="Food name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
      <Input label="Serving" value={form.serving_label} onChange={(v) => setForm({ ...form, serving_label: v })} />
      <div className="grid grid-cols-2 gap-3">
        <Input type="number" label="Calories" value={String(form.calories)} onChange={(v) => setForm({ ...form, calories: +v })} />
        <Input type="number" label="Protein (g)" value={String(form.protein)} onChange={(v) => setForm({ ...form, protein: +v })} />
        <Input type="number" label="Carbs (g)" value={String(form.carbs)} onChange={(v) => setForm({ ...form, carbs: +v })} />
        <Input type="number" label="Fat (g)" value={String(form.fat)} onChange={(v) => setForm({ ...form, fat: +v })} />
      </div>
      <button type="submit" className="w-full h-12 rounded-full gradient-primary text-primary-foreground font-semibold shadow-glow">
        <Heart className="inline size-4 mr-1" /> Save custom food
      </button>
    </form>
  );
}
function Input({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-muted-foreground mb-1">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-11 rounded-xl border border-border bg-background px-3 outline-none focus:ring-4 focus:ring-ring/15"
      />
    </label>
  );
}
