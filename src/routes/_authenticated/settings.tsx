import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Award, Bell, ChevronRight, LogOut, Moon, Shield, Sun, Target, Trash2, User } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { fetchProfile, upsertProfile } from "@/lib/profile-api";
import { calcTargets } from "@/lib/calculations";
import { useTheme } from "@/lib/theme";
import { PageHeader } from "@/components/mobile-shell";

export const Route = createFileRoute("/_authenticated/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { theme, toggle: toggleTheme } = useTheme();
  const profileQ = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: () => fetchProfile(user!.id),
    enabled: !!user?.id,
  });
  const p = profileQ.data;

  const [editingGoals, setEditingGoals] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);

  async function handleSignOut() {
    await qc.cancelQueries();
    qc.clear();
    await signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="mx-auto w-full max-w-md px-4 pt-[max(env(safe-area-inset-top),1rem)] pb-32">
      <PageHeader title="You" />

      <section className="rounded-3xl bg-card border border-border p-5 shadow-elevated flex items-center gap-4">
        <div className="grid size-14 place-items-center rounded-2xl gradient-primary text-primary-foreground font-semibold text-xl shadow-glow">
          {(p?.display_name?.[0] ?? user?.email?.[0] ?? "?").toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="text-base font-semibold truncate">{p?.display_name ?? "Friend"}</p>
          <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          <p className="mt-1 text-xs text-primary capitalize">Goal: {p?.goal ?? "—"}</p>
        </div>
      </section>

      <section className="mt-4 rounded-3xl bg-card border border-border shadow-elevated overflow-hidden">
        <Row
          icon={<Target className="size-4" />}
          label="Daily targets"
          value={p ? `${p.calorie_target} kcal · P${p.protein_g}/C${p.carbs_g}/F${p.fat_g}` : "Set up"}
          onClick={() => setEditingGoals(true)}
        />
        <Row
          icon={<User className="size-4" />}
          label="Profile"
          value={p ? `${p.age} yr · ${p.height_cm} cm · ${p.weight_kg} kg` : "Set up"}
          onClick={() => setEditingProfile(true)}
        />
        <Link to="/notifications" className="block">
          <Row
            icon={<Bell className="size-4" />}
            label="Notifications"
            value="Reminders, hydration, weigh-in & more"
          />
        </Link>
        <Row
          icon={theme === "dark" ? <Moon className="size-4" /> : <Sun className="size-4" />}
          label="Appearance"
          value={theme === "dark" ? "Dark mode" : "Light mode"}
          onClick={toggleTheme}
        />

      </section>

      <section className="mt-4 rounded-3xl bg-card border border-border shadow-elevated overflow-hidden">
        <Link to="/achievements" className="block">
          <Row icon={<Award className="size-4" />} label="Achievements" />
        </Link>
        <Row
          icon={<Shield className="size-4" />}
          label="Privacy"
          value="Your data is encrypted"
          onClick={() => toast("Your data stays private and synced to your account.")}
        />
        <Row
          icon={<Trash2 className="size-4" />}
          label="Clear local data"
          onClick={() => {
            if (!confirm("This will clear food, workouts and weights stored on this device.")) return;
            const uid = user?.id;
            if (uid) {
              const keys = Object.keys(localStorage).filter((k) => k.startsWith(`caltrack:v1:${uid}:`));
              keys.forEach((k) => localStorage.removeItem(k));
              location.reload();
            }
          }}
        />
      </section>

      <button
        onClick={handleSignOut}
        className="mt-4 w-full h-12 rounded-full bg-card border border-border font-medium text-destructive inline-flex items-center justify-center gap-2"
      >
        <LogOut className="size-4" /> Sign out
      </button>

      <p className="mt-6 text-center text-xs text-muted-foreground">CalTrack · v1.0</p>

      {editingGoals && p && (
        <GoalsSheet
          initialTarget={p.calorie_target ?? 2000}
          initialP={p.protein_g ?? 150}
          initialC={p.carbs_g ?? 220}
          initialF={p.fat_g ?? 70}
          onClose={() => setEditingGoals(false)}
          onSave={async (vals) => {
            if (!user) return;
            await upsertProfile({ user_id: user.id, ...vals });
            await qc.invalidateQueries({ queryKey: ["profile", user.id] });
            toast.success("Targets updated");
            setEditingGoals(false);
          }}
        />
      )}

      {editingProfile && p && (
        <ProfileSheet
          initial={p}
          onClose={() => setEditingProfile(false)}
          onSave={async (vals) => {
            if (!user) return;
            const targets = calcTargets({
              weight_kg: vals.weight_kg,
              height_cm: vals.height_cm,
              age: vals.age,
              gender: vals.gender,
              activity_level: vals.activity_level,
              goal: vals.goal,
            });
            await upsertProfile({
              user_id: user.id,
              display_name: vals.display_name,
              age: vals.age,
              gender: vals.gender,
              height_cm: vals.height_cm,
              weight_kg: vals.weight_kg,
              activity_level: vals.activity_level,
              goal: vals.goal,
              calorie_target: targets.calories,
              protein_g: targets.protein_g,
              carbs_g: targets.carbs_g,
              fat_g: targets.fat_g,
              weekly_change_kg: targets.weekly_change_kg,
            });
            await qc.invalidateQueries({ queryKey: ["profile", user.id] });
            toast.success("Profile updated & targets recalculated");
            setEditingProfile(false);
          }}
        />
      )}
    </div>
  );
}

function Row({ icon, label, value, onClick }: { icon: React.ReactNode; label: string; value?: string; onClick?: () => void }) {
  const Wrap: React.ElementType = onClick ? "button" : "div";
  return (
    <Wrap onClick={onClick} className="w-full text-left flex items-center gap-3 px-4 py-3.5 border-b border-border last:border-b-0 hover:bg-accent transition-colors">
      <div className="grid size-9 place-items-center rounded-xl bg-muted text-foreground">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{label}</p>
        {value && <p className="text-xs text-muted-foreground truncate">{value}</p>}
      </div>
      {onClick && <ChevronRight className="size-4 text-muted-foreground" />}
    </Wrap>
  );
}

function GoalsSheet({
  initialTarget, initialP, initialC, initialF, onClose, onSave,
}: {
  initialTarget: number; initialP: number; initialC: number; initialF: number;
  onClose: () => void;
  onSave: (v: { calorie_target: number; protein_g: number; carbs_g: number; fat_g: number }) => Promise<void>;
}) {
  const [cal, setCal] = useState(initialTarget);
  const [pr, setPr] = useState(initialP);
  const [cb, setCb] = useState(initialC);
  const [ft, setFt] = useState(initialF);
  return (
    <Sheet title="Daily targets" onClose={onClose}>
      <Num label="Calories" v={cal} on={setCal} />
      <Num label="Protein (g)" v={pr} on={setPr} />
      <Num label="Carbs (g)" v={cb} on={setCb} />
      <Num label="Fat (g)" v={ft} on={setFt} />
      <button
        onClick={() => onSave({ calorie_target: cal, protein_g: pr, carbs_g: cb, fat_g: ft })}
        className="w-full h-12 rounded-full gradient-primary text-primary-foreground font-semibold shadow-glow"
      >
        Save
      </button>
    </Sheet>
  );
}

function ProfileSheet({
  initial, onClose, onSave,
}: {
  initial: { display_name: string | null; age: number | null; gender: string | null; height_cm: number | null; weight_kg: number | null; activity_level: string | null; goal: string | null };
  onClose: () => void;
  onSave: (v: { display_name: string; age: number; gender: "male" | "female" | "other"; height_cm: number; weight_kg: number; activity_level: "sedentary" | "light" | "moderate" | "active" | "very_active"; goal: "lose" | "gain" | "muscle" | "maintain" }) => Promise<void>;
}) {
  const [v, setV] = useState({
    display_name: initial.display_name ?? "",
    age: initial.age ?? 28,
    gender: (initial.gender ?? "male") as "male" | "female" | "other",
    height_cm: initial.height_cm ?? 175,
    weight_kg: initial.weight_kg ?? 75,
    activity_level: (initial.activity_level ?? "moderate") as "sedentary" | "light" | "moderate" | "active" | "very_active",
    goal: (initial.goal ?? "lose") as "lose" | "gain" | "muscle" | "maintain",
  });
  return (
    <Sheet title="Edit profile" onClose={onClose}>
      <label className="block">
        <span className="block text-xs text-muted-foreground mb-1">Name</span>
        <input value={v.display_name} onChange={(e) => setV({ ...v, display_name: e.target.value })} className="w-full h-11 rounded-xl border border-border bg-background px-3 outline-none focus:ring-4 focus:ring-ring/15" />
      </label>
      <div className="grid grid-cols-3 gap-2">
        <Num label="Age" v={v.age} on={(n) => setV({ ...v, age: n })} />
        <Num label="Height (cm)" v={v.height_cm} on={(n) => setV({ ...v, height_cm: n })} />
        <Num label="Weight (kg)" v={v.weight_kg} on={(n) => setV({ ...v, weight_kg: n })} step={0.1} />
      </div>
      <Select label="Gender" v={v.gender} on={(x) => setV({ ...v, gender: x as typeof v.gender })}
        options={[{ value: "male", label: "Male" }, { value: "female", label: "Female" }, { value: "other", label: "Other" }]} />
      <Select label="Activity" v={v.activity_level} on={(x) => setV({ ...v, activity_level: x as typeof v.activity_level })}
        options={[{ value: "sedentary", label: "Sedentary" }, { value: "light", label: "Light" }, { value: "moderate", label: "Moderate" }, { value: "active", label: "Active" }, { value: "very_active", label: "Very active" }]} />
      <Select label="Goal" v={v.goal} on={(x) => setV({ ...v, goal: x as typeof v.goal })}
        options={[{ value: "lose", label: "Lose weight" }, { value: "maintain", label: "Maintain" }, { value: "muscle", label: "Build muscle" }, { value: "gain", label: "Gain weight" }]} />
      <button onClick={() => onSave(v)} className="w-full h-12 rounded-full gradient-primary text-primary-foreground font-semibold shadow-glow">
        Save & recalc targets
      </button>
    </Sheet>
  );
}

function Sheet({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 bg-background/70 backdrop-blur-sm flex items-end" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md mx-auto rounded-t-3xl bg-card border border-border p-5 max-h-[88vh] overflow-y-auto animate-slide-up pb-[max(env(safe-area-inset-bottom),1.25rem)]">
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-muted" />
        <h3 className="text-base font-semibold mb-4">{title}</h3>
        <div className="space-y-3">{children}</div>
      </div>
    </div>
  );
}
function Num({ label, v, on, step = 1 }: { label: string; v: number; on: (n: number) => void; step?: number }) {
  return (
    <label className="block">
      <span className="block text-xs text-muted-foreground mb-1">{label}</span>
      <input type="number" step={step} value={v} onChange={(e) => on(parseFloat(e.target.value) || 0)} className="w-full h-11 rounded-xl border border-border bg-background px-3 outline-none tabular-nums focus:ring-4 focus:ring-ring/15" />
    </label>
  );
}
function Select({ label, v, on, options }: { label: string; v: string; on: (x: string) => void; options: { value: string; label: string }[] }) {
  return (
    <label className="block">
      <span className="block text-xs text-muted-foreground mb-1">{label}</span>
      <select value={v} onChange={(e) => on(e.target.value)} className="w-full h-11 rounded-xl border border-border bg-background px-3 outline-none focus:ring-4 focus:ring-ring/15">
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  );
}
