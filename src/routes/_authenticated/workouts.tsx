import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Check, ChevronDown, Dumbbell, Plus, Trash2, Play, X } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/mobile-shell";
import { EXERCISES, exercisesByGroup } from "@/lib/exercises";
import { estimateCaloriesBurned, useTracking, workoutVolume } from "@/lib/store";
import { todayStr } from "@/lib/calculations";
import type { Exercise, LoggedExercise, WorkoutSession, WorkoutSet } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/workouts")({
  component: WorkoutsPage,
});

function WorkoutsPage() {
  const workouts = useTracking((s) => s.workouts);
  const [active, setActive] = useState<WorkoutSession | null>(null);
  const [tab, setTab] = useState<"history" | "library">("history");

  return (
    <div className="mx-auto w-full max-w-md px-4 pt-[max(env(safe-area-inset-top),1rem)] pb-32">
      <PageHeader
        title="Training"
        trailing={
          <button
            onClick={() => setActive({ id: crypto.randomUUID(), date: todayStr(), name: "Workout", startedAt: Date.now(), exercises: [] })}
            className="grid size-10 place-items-center rounded-full gradient-primary text-primary-foreground shadow-glow"
            aria-label="New workout"
          >
            <Plus className="size-4" />
          </button>
        }
      />

      <div className="grid grid-cols-2 gap-2 rounded-2xl bg-muted p-1">
        <button onClick={() => setTab("history")} className={`h-10 rounded-xl text-sm font-medium ${tab === "history" ? "bg-card shadow-sm" : "text-muted-foreground"}`}>History</button>
        <button onClick={() => setTab("library")} className={`h-10 rounded-xl text-sm font-medium ${tab === "library" ? "bg-card shadow-sm" : "text-muted-foreground"}`}>Library</button>
      </div>

      <div className="mt-5">
        {tab === "history" ? <HistoryView /> : <LibraryView />}
      </div>

      {workouts.length === 0 && tab === "history" && (
        <div className="mt-8 rounded-3xl border-2 border-dashed border-border p-6 text-center">
          <Dumbbell className="mx-auto size-8 text-muted-foreground" />
          <p className="mt-2 text-sm font-medium">No workouts yet</p>
          <p className="text-xs text-muted-foreground">Tap + to log your first session.</p>
        </div>
      )}

      {active && <ActiveWorkout session={active} onClose={() => setActive(null)} />}
    </div>
  );
}

function HistoryView() {
  const workouts = useTracking((s) => s.workouts);
  const remove = useTracking((s) => s.removeWorkout);
  return (
    <ul className="space-y-3">
      {workouts.map((w) => {
        const vol = workoutVolume(w);
        const setsDone = w.exercises.reduce((s, e) => s + e.sets.filter((x) => x.done).length, 0);
        return (
          <li key={w.id} className="rounded-3xl bg-card border border-border p-4 shadow-elevated">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate">{w.name}</p>
                <p className="text-xs text-muted-foreground">{w.date} · {w.exercises.length} exercises · {setsDone} sets</p>
              </div>
              <button onClick={() => remove(w.id)} aria-label="Delete" className="grid size-8 place-items-center rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                <Trash2 className="size-4" />
              </button>
            </div>
            <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
              <span><b className="text-foreground tabular-nums">{Math.round(vol)}</b> kg volume</span>
              {w.caloriesBurned ? <span>~{w.caloriesBurned} kcal</span> : null}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function LibraryView() {
  const groups = useMemo(() => exercisesByGroup(), []);
  return (
    <div className="space-y-3">
      {Object.entries(groups).map(([group, list]) => (
        <details key={group} className="rounded-3xl bg-card border border-border shadow-elevated overflow-hidden group">
          <summary className="cursor-pointer list-none flex items-center justify-between px-4 py-3">
            <span className="text-sm font-semibold">{group}</span>
            <ChevronDown className="size-4 text-muted-foreground transition-transform group-open:rotate-180" />
          </summary>
          <ul className="border-t border-border divide-y divide-border">
            {list.map((e) => <LibRow key={e.id} ex={e} />)}
          </ul>
        </details>
      ))}
    </div>
  );
}

function LibRow({ ex }: { ex: Exercise }) {
  const [open, setOpen] = useState(false);
  return (
    <li>
      <button onClick={() => setOpen((v) => !v)} className="w-full text-left px-4 py-3 flex items-center justify-between hover:bg-accent transition-colors">
        <div>
          <p className="text-sm font-medium">{ex.name}</p>
          <p className="text-xs text-muted-foreground">{ex.suggestedSets} sets · {ex.suggestedReps}</p>
        </div>
        <ChevronDown className={`size-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="px-4 pb-4 text-sm">
          <p className="text-muted-foreground">{ex.description}</p>
          <ol className="mt-2 list-decimal list-inside text-foreground space-y-1 text-[13px]">
            {ex.instructions.map((line, i) => <li key={i}>{line}</li>)}
          </ol>
        </div>
      )}
    </li>
  );
}

function ActiveWorkout({ session, onClose }: { session: WorkoutSession; onClose: () => void }) {
  const [s, setS] = useState<WorkoutSession>(session);
  const [picking, setPicking] = useState(false);
  const addWorkout = useTracking((s) => s.addWorkout);

  function addExercise(ex: Exercise) {
    setS({
      ...s,
      exercises: [
        ...s.exercises,
        {
          exerciseId: ex.id,
          name: ex.name,
          muscleGroup: ex.muscleGroup,
          sets: Array.from({ length: ex.suggestedSets }, () => ({ reps: 10, weight_kg: 0, done: false } as WorkoutSet)),
        },
      ],
    });
    setPicking(false);
  }
  function updateSet(exIdx: number, setIdx: number, patch: Partial<WorkoutSet>) {
    setS({
      ...s,
      exercises: s.exercises.map((e, i) =>
        i !== exIdx ? e : { ...e, sets: e.sets.map((st, j) => (j === setIdx ? { ...st, ...patch } : st)) },
      ),
    });
  }
  function addSet(exIdx: number) {
    setS({
      ...s,
      exercises: s.exercises.map((e, i) =>
        i !== exIdx ? e : { ...e, sets: [...e.sets, { reps: 10, weight_kg: e.sets.at(-1)?.weight_kg ?? 0, done: false }] },
      ),
    });
  }
  function removeExercise(exIdx: number) {
    setS({ ...s, exercises: s.exercises.filter((_, i) => i !== exIdx) });
  }
  function finish() {
    if (s.exercises.length === 0) return toast.error("Add an exercise first.");
    const done = { ...s, endedAt: Date.now(), caloriesBurned: estimateCaloriesBurned(s.exercises) };
    addWorkout(done);
    toast.success("Workout saved 💪");
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 bg-background overflow-y-auto pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto w-full max-w-md px-4 pt-[max(env(safe-area-inset-top),1rem)] pb-32">
        <PageHeader
          title={
            <input
              value={s.name}
              onChange={(e) => setS({ ...s, name: e.target.value })}
              className="bg-transparent text-center w-full text-lg font-semibold outline-none"
            />
          }
          back={onClose}
          trailing={
            <button onClick={finish} aria-label="Finish" className="grid size-10 place-items-center rounded-full bg-success text-success-foreground">
              <Check className="size-4" />
            </button>
          }
        />

        <ul className="space-y-3">
          {s.exercises.map((ex, i) => (
            <li key={i} className="rounded-3xl bg-card border border-border p-4 shadow-elevated">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">{ex.name}</p>
                  <p className="text-xs text-muted-foreground">{ex.muscleGroup}</p>
                </div>
                <button onClick={() => removeExercise(i)} aria-label="Remove exercise" className="grid size-8 place-items-center rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                  <X className="size-4" />
                </button>
              </div>
              <div className="mt-3 grid grid-cols-[28px_1fr_1fr_40px] gap-2 text-[10px] uppercase tracking-wider text-muted-foreground">
                <div>#</div><div>Reps</div><div>Weight</div><div />
              </div>
              <ul className="mt-1 space-y-1.5">
                {ex.sets.map((st, j) => (
                  <li key={j} className="grid grid-cols-[28px_1fr_1fr_40px] gap-2 items-center">
                    <span className="text-xs font-semibold tabular-nums text-muted-foreground">{j + 1}</span>
                    <input
                      type="number"
                      value={st.reps}
                      onChange={(e) => updateSet(i, j, { reps: parseInt(e.target.value) || 0 })}
                      className="h-10 rounded-lg border border-border bg-background px-2 text-sm tabular-nums outline-none focus:ring-2 focus:ring-ring/15"
                    />
                    <input
                      type="number"
                      step="0.5"
                      value={st.weight_kg}
                      onChange={(e) => updateSet(i, j, { weight_kg: parseFloat(e.target.value) || 0 })}
                      className="h-10 rounded-lg border border-border bg-background px-2 text-sm tabular-nums outline-none focus:ring-2 focus:ring-ring/15"
                    />
                    <button
                      onClick={() => updateSet(i, j, { done: !st.done })}
                      aria-label="Done"
                      className={`grid size-10 place-items-center rounded-lg transition-colors ${st.done ? "bg-success text-success-foreground" : "bg-muted text-muted-foreground"}`}
                    >
                      <Check className="size-4" />
                    </button>
                  </li>
                ))}
              </ul>
              <button onClick={() => addSet(i)} className="mt-3 w-full h-9 rounded-full bg-muted text-xs font-semibold inline-flex items-center justify-center gap-1">
                <Plus className="size-3.5" /> Add set
              </button>
            </li>
          ))}
        </ul>

        <button
          onClick={() => setPicking(true)}
          className="mt-4 w-full h-12 rounded-full border border-dashed border-border bg-card font-medium inline-flex items-center justify-center gap-2"
        >
          <Plus className="size-4" /> Add exercise
        </button>

        <button
          onClick={finish}
          className="mt-3 w-full h-14 rounded-full gradient-primary text-primary-foreground font-semibold shadow-glow inline-flex items-center justify-center gap-2"
        >
          <Play className="size-4" /> Finish & save
        </button>
      </div>

      {picking && (
        <ExercisePicker onPick={addExercise} onClose={() => setPicking(false)} />
      )}
    </div>
  );
}

function ExercisePicker({ onPick, onClose }: { onPick: (e: Exercise) => void; onClose: () => void }) {
  const [q, setQ] = useState("");
  const filtered = EXERCISES.filter((e) => e.name.toLowerCase().includes(q.toLowerCase()) || e.muscleGroup.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="fixed inset-0 z-[60] bg-background/70 backdrop-blur-sm flex items-end" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md mx-auto rounded-t-3xl bg-card border border-border max-h-[80vh] overflow-y-auto animate-slide-up pb-[env(safe-area-inset-bottom)]">
        <div className="sticky top-0 bg-card px-5 pt-4 pb-3 z-10 rounded-t-3xl">
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-muted" />
          <h3 className="text-base font-semibold">Choose exercise</h3>
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search…"
            className="mt-3 w-full h-11 rounded-xl border border-border bg-background px-3 outline-none focus:ring-4 focus:ring-ring/15"
          />
        </div>
        <ul className="px-5 pb-6 divide-y divide-border">
          {filtered.map((e) => (
            <li key={e.id}>
              <button onClick={() => onPick(e)} className="w-full text-left py-3 flex items-center justify-between">
                <span>
                  <p className="text-sm font-medium">{e.name}</p>
                  <p className="text-xs text-muted-foreground">{e.muscleGroup}</p>
                </span>
                <Plus className="size-4 text-primary" />
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// keep typescript happy about unused import
export type { LoggedExercise };
