import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { Bell, BellOff, Droplet, Dumbbell, Flame, Moon, Scale, UtensilsCrossed, Vibrate, Volume2 } from "lucide-react";
import { PageHeader } from "@/components/mobile-shell";
import { useAuth } from "@/lib/auth-context";
import {
  DEFAULT_PREFS,
  fireNotification,
  loadPrefs,
  notificationsSupported,
  requestPermission,
  savePrefs,
  type NotificationPrefs,
  type WeekDay,
} from "@/lib/notifications";

export const Route = createFileRoute("/_authenticated/notifications")({
  component: NotificationsPage,
});

const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"] as const;

function NotificationsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [prefs, setPrefs] = useState<NotificationPrefs>(DEFAULT_PREFS);
  const [perm, setPerm] = useState<NotificationPermission>("default");

  useEffect(() => {
    if (!user) return;
    setPrefs(loadPrefs(user.id));
    if (notificationsSupported()) setPerm(Notification.permission);
  }, [user]);

  const update = useCallback(
    (mut: (p: NotificationPrefs) => NotificationPrefs) => {
      setPrefs((cur) => {
        const next = mut(cur);
        if (user) savePrefs(user.id, next);
        return next;
      });
    },
    [user],
  );

  async function enableAll() {
    if (!notificationsSupported()) {
      toast.error("Notifications aren't supported on this device.");
      return;
    }
    const p = await requestPermission();
    setPerm(p);
    if (p === "granted") {
      update((cur) => ({ ...cur, enabled: true }));
      toast.success("Notifications enabled");
    } else {
      toast.error("Permission denied. Enable notifications in your browser settings.");
    }
  }

  function test() {
    if (perm !== "granted") {
      toast.error("Enable notifications first.");
      return;
    }
    fireNotification("CalTrack test 🔔", "This is what your reminders will look like.", prefs);
  }

  return (
    <div className="mx-auto w-full max-w-md px-4 pt-[max(env(safe-area-inset-top),1rem)] pb-32">
      <PageHeader title="Notifications" back={() => navigate({ to: "/settings" })} />

      {/* Master switch */}
      <section className="rounded-3xl bg-card border border-border p-5 shadow-elevated">
        <div className="flex items-start gap-4">
          <div className="grid size-12 place-items-center rounded-2xl gradient-primary text-primary-foreground shadow-glow">
            {prefs.enabled && perm === "granted" ? <Bell className="size-5" /> : <BellOff className="size-5" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold">Push reminders</p>
            <p className="text-xs text-muted-foreground">
              {!notificationsSupported()
                ? "Not supported on this browser"
                : perm === "granted"
                  ? prefs.enabled
                    ? "Active — we'll nudge you below"
                    : "Permission granted, but reminders are off"
                  : perm === "denied"
                    ? "Blocked — enable in browser settings"
                    : "Tap below to allow notifications"}
            </p>
          </div>
          <Toggle
            checked={prefs.enabled && perm === "granted"}
            onChange={(v) => {
              if (v && perm !== "granted") void enableAll();
              else update((cur) => ({ ...cur, enabled: v }));
            }}
          />
        </div>
        {perm !== "granted" && (
          <button
            onClick={enableAll}
            className="mt-4 w-full h-11 rounded-full gradient-primary text-primary-foreground font-semibold shadow-glow"
          >
            Allow notifications
          </button>
        )}
        {perm === "granted" && (
          <button onClick={test} className="mt-4 w-full h-11 rounded-full border border-border bg-card font-medium">
            Send test notification
          </button>
        )}
      </section>

      {/* Meal reminders */}
      <SectionCard icon={<UtensilsCrossed className="size-4" />} title="Meal reminders" subtitle="Nudges to log breakfast, lunch, dinner, snacks">
        {(["breakfast", "lunch", "dinner", "snack"] as const).map((meal) => (
          <Row
            key={meal}
            label={meal[0].toUpperCase() + meal.slice(1)}
            right={
              <div className="flex items-center gap-2">
                <TimeInput
                  value={prefs.meals[meal].time}
                  onChange={(t) => update((cur) => ({ ...cur, meals: { ...cur.meals, [meal]: { ...cur.meals[meal], time: t } } }))}
                />
                <Toggle
                  checked={prefs.meals[meal].enabled}
                  onChange={(v) => update((cur) => ({ ...cur, meals: { ...cur.meals, [meal]: { ...cur.meals[meal], enabled: v } } }))}
                />
              </div>
            }
          />
        ))}
      </SectionCard>

      {/* Water */}
      <SectionCard icon={<Droplet className="size-4" />} title="Hydration" subtitle="Recurring water reminders during the day">
        <Row
          label="Enabled"
          right={<Toggle checked={prefs.water.enabled} onChange={(v) => update((cur) => ({ ...cur, water: { ...cur.water, enabled: v } }))} />}
        />
        <Row
          label="Every"
          right={
            <select
              value={prefs.water.intervalMin}
              onChange={(e) => update((cur) => ({ ...cur, water: { ...cur.water, intervalMin: parseInt(e.target.value) } }))}
              className="h-10 rounded-xl border border-border bg-background px-3 text-sm"
            >
              {[30, 60, 90, 120, 180, 240].map((m) => (
                <option key={m} value={m}>{m < 60 ? `${m} min` : `${m / 60} hr`}</option>
              ))}
            </select>
          }
        />
        <Row label="From" right={<TimeInput value={prefs.water.startTime} onChange={(t) => update((cur) => ({ ...cur, water: { ...cur.water, startTime: t } }))} />} />
        <Row label="Until" right={<TimeInput value={prefs.water.endTime} onChange={(t) => update((cur) => ({ ...cur, water: { ...cur.water, endTime: t } }))} />} />
      </SectionCard>

      {/* Weigh-in */}
      <SectionCard icon={<Scale className="size-4" />} title="Weigh-in" subtitle="A nudge to log your weight">
        <Row label="Enabled" right={<Toggle checked={prefs.weighIn.enabled} onChange={(v) => update((cur) => ({ ...cur, weighIn: { ...cur.weighIn, enabled: v } }))} />} />
        <Row label="Time" right={<TimeInput value={prefs.weighIn.time} onChange={(t) => update((cur) => ({ ...cur, weighIn: { ...cur.weighIn, time: t } }))} />} />
        <DayPicker
          days={prefs.weighIn.days}
          onChange={(d) => update((cur) => ({ ...cur, weighIn: { ...cur.weighIn, days: d } }))}
        />
      </SectionCard>

      {/* Workout */}
      <SectionCard icon={<Dumbbell className="size-4" />} title="Workout reminder" subtitle="Schedule training days">
        <Row label="Enabled" right={<Toggle checked={prefs.workout.enabled} onChange={(v) => update((cur) => ({ ...cur, workout: { ...cur.workout, enabled: v } }))} />} />
        <Row label="Time" right={<TimeInput value={prefs.workout.time} onChange={(t) => update((cur) => ({ ...cur, workout: { ...cur.workout, time: t } }))} />} />
        <DayPicker
          days={prefs.workout.days}
          onChange={(d) => update((cur) => ({ ...cur, workout: { ...cur.workout, days: d } }))}
        />
      </SectionCard>

      {/* Streak */}
      <SectionCard icon={<Flame className="size-4" />} title="Streak protection" subtitle="End-of-day nudge if you haven't logged anything">
        <Row label="Enabled" right={<Toggle checked={prefs.streak.enabled} onChange={(v) => update((cur) => ({ ...cur, streak: { ...cur.streak, enabled: v } }))} />} />
        <Row label="Time" right={<TimeInput value={prefs.streak.time} onChange={(t) => update((cur) => ({ ...cur, streak: { ...cur.streak, time: t } }))} />} />
      </SectionCard>

      {/* Quiet hours + delivery */}
      <SectionCard icon={<Moon className="size-4" />} title="Quiet hours" subtitle="No notifications during these times">
        <Row label="Enabled" right={<Toggle checked={prefs.quietHours.enabled} onChange={(v) => update((cur) => ({ ...cur, quietHours: { ...cur.quietHours, enabled: v } }))} />} />
        <Row label="From" right={<TimeInput value={prefs.quietHours.start} onChange={(t) => update((cur) => ({ ...cur, quietHours: { ...cur.quietHours, start: t } }))} />} />
        <Row label="Until" right={<TimeInput value={prefs.quietHours.end} onChange={(t) => update((cur) => ({ ...cur, quietHours: { ...cur.quietHours, end: t } }))} />} />
      </SectionCard>

      <SectionCard icon={<Volume2 className="size-4" />} title="Delivery">
        <Row label="Sound" right={<Toggle checked={prefs.sound} onChange={(v) => update((cur) => ({ ...cur, sound: v }))} />} />
        <Row
          label={<span className="inline-flex items-center gap-2">Vibrate <Vibrate className="size-3.5 text-muted-foreground" /></span>}
          right={<Toggle checked={prefs.vibrate} onChange={(v) => update((cur) => ({ ...cur, vibrate: v }))} />}
        />
        <Row label="Goal & milestone nudges" right={<Toggle checked={prefs.goalNudges} onChange={(v) => update((cur) => ({ ...cur, goalNudges: v }))} />} />
      </SectionCard>

      <p className="mt-6 text-center text-[11px] text-muted-foreground px-6">
        Reminders are scheduled in the browser. Keep CalTrack open or install it to your home screen for the most reliable delivery.
      </p>
    </div>
  );
}

function SectionCard({ icon, title, subtitle, children }: { icon: React.ReactNode; title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="mt-4 rounded-3xl bg-card border border-border shadow-elevated overflow-hidden">
      <div className="px-4 pt-4 pb-2 flex items-center gap-3">
        <div className="grid size-8 place-items-center rounded-lg bg-muted text-foreground">{icon}</div>
        <div>
          <p className="text-sm font-semibold">{title}</p>
          {subtitle && <p className="text-[11px] text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
      <div className="divide-y divide-border">{children}</div>
    </section>
  );
}

function Row({ label, right }: { label: React.ReactNode; right: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 min-h-[52px]">
      <span className="text-sm">{label}</span>
      <div>{right}</div>
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 rounded-full transition-colors ${checked ? "bg-primary" : "bg-muted"}`}
    >
      <span
        className={`absolute top-0.5 size-5 rounded-full bg-card shadow transition-transform ${checked ? "translate-x-[22px]" : "translate-x-0.5"}`}
      />
    </button>
  );
}

function TimeInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <input
      type="time"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-10 rounded-xl border border-border bg-background px-3 text-sm tabular-nums"
    />
  );
}

function DayPicker({ days, onChange }: { days: WeekDay[]; onChange: (d: WeekDay[]) => void }) {
  return (
    <div className="px-4 py-3 flex items-center justify-between gap-2">
      <span className="text-sm">Days</span>
      <div className="flex gap-1">
        {DAY_LABELS.map((lbl, i) => {
          const d = i as WeekDay;
          const on = days.includes(d);
          return (
            <button
              key={i}
              type="button"
              onClick={() => onChange(on ? days.filter((x) => x !== d) : [...days, d].sort())}
              className={`size-8 rounded-full text-[11px] font-semibold transition-colors ${on ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
            >
              {lbl}
            </button>
          );
        })}
      </div>
    </div>
  );
}
