import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Loader2, Sparkles } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { upsertProfile } from "@/lib/profile-api";
import { calcTargets } from "@/lib/calculations";
import type { ActivityLevel, Gender, Goal } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/onboarding")({
  component: Onboarding,
});

interface Form {
  display_name: string;
  age: number;
  gender: Gender;
  height_cm: number;
  weight_kg: number;
  activity_level: ActivityLevel;
  goal: Goal;
}

const STEPS = ["Name", "Age", "Gender", "Height", "Weight", "Activity", "Goal", "Summary"] as const;

function Onboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState<Form>({
    display_name: "",
    age: 28,
    gender: "male",
    height_cm: 175,
    weight_kg: 75,
    activity_level: "moderate",
    goal: "lose",
  });

  const targets = useMemo(() => {
    return calcTargets({
      weight_kg: form.weight_kg,
      height_cm: form.height_cm,
      age: form.age,
      gender: form.gender,
      activity_level: form.activity_level,
      goal: form.goal,
    });
  }, [form]);

  async function finish() {
    if (!user) return;
    setBusy(true);
    try {
      await upsertProfile({
        user_id: user.id,
        display_name: form.display_name || null,
        age: form.age,
        gender: form.gender,
        height_cm: form.height_cm,
        weight_kg: form.weight_kg,
        activity_level: form.activity_level,
        goal: form.goal,
        calorie_target: targets.calories,
        protein_g: targets.protein_g,
        carbs_g: targets.carbs_g,
        fat_g: targets.fat_g,
        weekly_change_kg: targets.weekly_change_kg,
        onboarded: true,
      });
      await qc.invalidateQueries({ queryKey: ["profile", user.id] });
      toast.success("You're all set!");
      navigate({ to: "/dashboard", replace: true });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save");
    } finally {
      setBusy(false);
    }
  }

  const last = step === STEPS.length - 1;
  const pct = ((step + 1) / STEPS.length) * 100;

  return (
    <div className="min-h-[100svh] mx-auto w-full max-w-md px-5 pt-[max(env(safe-area-inset-top),1.5rem)] pb-10 flex flex-col">
      <div className="flex items-center gap-3">
        <button
          onClick={() => (step === 0 ? navigate({ to: "/auth" }) : setStep(step - 1))}
          className="grid size-9 place-items-center rounded-full bg-card border border-border"
          aria-label="Back"
        >
          <ChevronLeft className="size-4" />
        </button>
        <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
          <div className="h-full gradient-primary transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>
        <span className="text-xs tabular-nums text-muted-foreground w-10 text-right">{step + 1}/{STEPS.length}</span>
      </div>

      <div className="mt-10 flex-1">
        {step === 0 && (
          <Step title="What should we call you?" sub="So CalCoach can greet you properly.">
            <input
              autoFocus
              value={form.display_name}
              onChange={(e) => setForm({ ...form, display_name: e.target.value })}
              placeholder="Your name"
              className="mt-6 w-full h-14 rounded-2xl border border-border bg-card px-4 text-lg outline-none focus:ring-4 focus:ring-ring/15"
            />
          </Step>
        )}
        {step === 1 && (
          <Step title="How old are you?">
            <NumberPicker value={form.age} onChange={(v) => setForm({ ...form, age: v })} min={13} max={100} unit="years" />
          </Step>
        )}
        {step === 2 && (
          <Step title="Gender" sub="Used for accurate metabolic estimates.">
            <Choice
              value={form.gender}
              onChange={(g) => setForm({ ...form, gender: g })}
              options={[
                { value: "male", label: "Male" },
                { value: "female", label: "Female" },
                { value: "other", label: "Other / prefer not to say" },
              ]}
            />
          </Step>
        )}
        {step === 3 && (
          <Step title="How tall are you?">
            <NumberPicker value={form.height_cm} onChange={(v) => setForm({ ...form, height_cm: v })} min={120} max={230} unit="cm" />
          </Step>
        )}
        {step === 4 && (
          <Step title="Current weight">
            <NumberPicker value={form.weight_kg} onChange={(v) => setForm({ ...form, weight_kg: v })} min={35} max={250} unit="kg" decimals />
          </Step>
        )}
        {step === 5 && (
          <Step title="How active are you?">
            <Choice
              value={form.activity_level}
              onChange={(v) => setForm({ ...form, activity_level: v })}
              options={[
                { value: "sedentary", label: "Sedentary", sub: "Desk job, little exercise" },
                { value: "light", label: "Light", sub: "1–3 sessions/week" },
                { value: "moderate", label: "Moderate", sub: "3–5 sessions/week" },
                { value: "active", label: "Active", sub: "6–7 sessions/week" },
                { value: "very_active", label: "Very active", sub: "Physical job + training" },
              ]}
            />
          </Step>
        )}
        {step === 6 && (
          <Step title="What's your goal?" sub="We'll set your calories around this.">
            <Choice
              value={form.goal}
              onChange={(v) => setForm({ ...form, goal: v })}
              options={[
                { value: "lose", label: "Lose Weight", sub: "Calorie deficit, ~0.5 kg/wk" },
                { value: "maintain", label: "Maintain", sub: "Hold current weight" },
                { value: "muscle", label: "Build Muscle", sub: "Lean surplus + protein" },
                { value: "gain", label: "Gain Weight", sub: "Calorie surplus" },
              ]}
            />
          </Step>
        )}
        {step === 7 && (
          <SummaryStep form={form} targets={targets} />
        )}
      </div>

      <button
        onClick={() => (last ? finish() : setStep(step + 1))}
        disabled={busy || (step === 0 && !form.display_name.trim())}
        className="mt-6 inline-flex h-14 items-center justify-center gap-2 rounded-full gradient-primary text-primary-foreground font-semibold text-base shadow-glow disabled:opacity-50"
      >
        {busy && <Loader2 className="size-4 animate-spin" />}
        {last ? "Start tracking" : "Continue"}
        {!last && <ChevronRight className="size-4" />}
      </button>
    </div>
  );
}

function Step({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <div className="animate-slide-up">
      <h2 className="text-3xl font-semibold tracking-tight">{title}</h2>
      {sub && <p className="mt-2 text-sm text-muted-foreground">{sub}</p>}
      <div className="mt-6">{children}</div>
    </div>
  );
}

function NumberPicker({
  value, onChange, min, max, unit, decimals,
}: { value: number; onChange: (v: number) => void; min: number; max: number; unit: string; decimals?: boolean }) {
  const step = decimals ? 0.5 : 1;
  return (
    <div className="mt-6 flex flex-col items-center gap-6">
      <div className="text-6xl font-semibold tabular-nums">
        {decimals ? value.toFixed(1) : Math.round(value)}
        <span className="ml-2 text-xl font-medium text-muted-foreground">{unit}</span>
      </div>
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - step))}
          className="size-12 rounded-full bg-card border border-border text-xl"
        >−</button>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="w-56 accent-[var(--color-primary)]"
        />
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + step))}
          className="size-12 rounded-full bg-card border border-border text-xl"
        >+</button>
      </div>
    </div>
  );
}

function Choice<T extends string>({
  value, onChange, options,
}: { value: T; onChange: (v: T) => void; options: { value: T; label: string; sub?: string }[] }) {
  return (
    <div className="mt-2 flex flex-col gap-2">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={`flex items-center justify-between rounded-2xl border px-4 py-4 text-left transition-all ${
              active ? "border-primary bg-primary/5 ring-4 ring-ring/15" : "border-border bg-card"
            }`}
          >
            <div>
              <div className="text-[15px] font-semibold">{o.label}</div>
              {o.sub && <div className="text-xs text-muted-foreground mt-0.5">{o.sub}</div>}
            </div>
            <div className={`size-5 rounded-full border-2 ${active ? "border-primary bg-primary" : "border-border"}`} />
          </button>
        );
      })}
    </div>
  );
}

function SummaryStep({ form, targets }: { form: Form; targets: ReturnType<typeof calcTargets> }) {
  return (
    <div className="animate-slide-up">
      <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
        <Sparkles className="size-3.5" /> Your plan, {form.display_name || "champ"}
      </div>
      <h2 className="mt-3 text-3xl font-semibold tracking-tight">Daily targets</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Based on your stats and goal. You can fine-tune these anytime in Settings.
      </p>

      <div className="mt-6 rounded-3xl gradient-primary p-6 shadow-glow text-primary-foreground">
        <div className="text-xs uppercase tracking-wider opacity-80">Calories</div>
        <div className="mt-1 text-5xl font-semibold tabular-nums">{targets.calories}<span className="text-base font-normal opacity-80 ml-2">kcal</span></div>
        <div className="mt-2 text-sm opacity-90">
          {targets.weekly_change_kg === 0
            ? "Maintain current weight"
            : `Estimated ${targets.weekly_change_kg > 0 ? "+" : ""}${targets.weekly_change_kg} kg / week`}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-3">
        <Stat label="Protein" v={`${targets.protein_g}g`} color="bg-[var(--color-protein)]/10 text-[var(--color-protein)]" />
        <Stat label="Carbs" v={`${targets.carbs_g}g`} color="bg-[var(--color-carbs)]/10 text-[var(--color-carbs)]" />
        <Stat label="Fat" v={`${targets.fat_g}g`} color="bg-[var(--color-fat)]/10 text-[var(--color-fat)]" />
      </div>
    </div>
  );
}

function Stat({ label, v, color }: { label: string; v: string; color: string }) {
  return (
    <div className={`rounded-2xl ${color} p-3 text-center`}>
      <div className="text-xs uppercase tracking-wider opacity-80">{label}</div>
      <div className="mt-1 text-xl font-semibold tabular-nums">{v}</div>
    </div>
  );
}
