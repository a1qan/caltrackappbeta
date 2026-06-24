// Customisable notifications: prefs stored in localStorage per-user, scheduled
// via in-page setInterval. Uses the Web Notification API when permission is granted.
import { useEffect } from "react";

export type WeekDay = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0=Sun .. 6=Sat

export interface ReminderTime {
  enabled: boolean;
  time: string; // "HH:MM"
}

export interface NotificationPrefs {
  enabled: boolean;
  meals: {
    breakfast: ReminderTime;
    lunch: ReminderTime;
    dinner: ReminderTime;
    snack: ReminderTime;
  };
  water: {
    enabled: boolean;
    intervalMin: number; // every N minutes
    startTime: string; // "HH:MM"
    endTime: string; // "HH:MM"
  };
  weighIn: {
    enabled: boolean;
    time: string;
    days: WeekDay[]; // which days
  };
  workout: {
    enabled: boolean;
    time: string;
    days: WeekDay[];
  };
  streak: {
    enabled: boolean;
    time: string; // end-of-day reminder if nothing logged
  };
  goalNudges: boolean;

  quietHours: {
    enabled: boolean;
    start: string; // "HH:MM"
    end: string; // "HH:MM"
  };
  sound: boolean;
  vibrate: boolean;
}

export const DEFAULT_PREFS: NotificationPrefs = {
  enabled: false,
  meals: {
    breakfast: { enabled: true, time: "08:00" },
    lunch: { enabled: true, time: "12:30" },
    dinner: { enabled: true, time: "19:00" },
    snack: { enabled: false, time: "15:30" },
  },
  water: { enabled: true, intervalMin: 120, startTime: "08:00", endTime: "21:00" },
  weighIn: { enabled: true, time: "07:30", days: [1] }, // Mondays
  workout: { enabled: false, time: "17:30", days: [1, 3, 5] },
  streak: { enabled: true, time: "21:30" },
  goalNudges: true,
  quietHours: { enabled: true, start: "22:00", end: "07:00" },
  sound: true,
  vibrate: true,
};

const KEY_PREFIX = "caltrack:v1";
const isBrowser = typeof window !== "undefined";

export function loadPrefs(userId: string): NotificationPrefs {
  if (!isBrowser) return DEFAULT_PREFS;
  try {
    const raw = window.localStorage.getItem(`${KEY_PREFIX}:${userId}:notifPrefs`);
    if (!raw) return DEFAULT_PREFS;
    const parsed = JSON.parse(raw) as Partial<NotificationPrefs>;
    return { ...DEFAULT_PREFS, ...parsed };
  } catch {
    return DEFAULT_PREFS;
  }
}

export function savePrefs(userId: string, prefs: NotificationPrefs) {
  if (!isBrowser) return;
  window.localStorage.setItem(`${KEY_PREFIX}:${userId}:notifPrefs`, JSON.stringify(prefs));
}

export function notificationsSupported(): boolean {
  return isBrowser && "Notification" in window;
}

export async function requestPermission(): Promise<NotificationPermission> {
  if (!notificationsSupported()) return "denied";
  if (Notification.permission === "granted") return "granted";
  return Notification.requestPermission();
}

interface FiredMap {
  [key: string]: string; // key -> YYYY-MM-DD or YYYY-MM-DDTHH:MM
}

function loadFired(userId: string): FiredMap {
  if (!isBrowser) return {};
  try {
    return JSON.parse(window.localStorage.getItem(`${KEY_PREFIX}:${userId}:notifFired`) ?? "{}") as FiredMap;
  } catch {
    return {};
  }
}
function saveFired(userId: string, fired: FiredMap) {
  if (!isBrowser) return;
  window.localStorage.setItem(`${KEY_PREFIX}:${userId}:notifFired`, JSON.stringify(fired));
}

function todayStr(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}
function hhmm(d = new Date()): string {
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
function inQuietHours(now: Date, qh: NotificationPrefs["quietHours"]): boolean {
  if (!qh.enabled) return false;
  const cur = hhmm(now);
  // window may wrap midnight
  if (qh.start <= qh.end) return cur >= qh.start && cur < qh.end;
  return cur >= qh.start || cur < qh.end;
}

export function fireNotification(title: string, body: string, prefs: NotificationPrefs) {
  if (!notificationsSupported() || Notification.permission !== "granted") return;
  try {
    const n = new Notification(title, {
      body,
      icon: "/favicon.ico",
      badge: "/favicon.ico",
      silent: !prefs.sound,
    });
    if (prefs.vibrate && "vibrate" in navigator) navigator.vibrate?.([120, 60, 120]);
    n.onclick = () => {
      window.focus();
      n.close();
    };
  } catch {
    /* ignore */
  }
}

interface DayState {
  loggedFood: boolean;
  loggedWater: boolean;
  loggedWeight: boolean;
  loggedWorkout: boolean;
}

/**
 * Hook that ticks every 30s and fires due notifications.
 */
export function useNotificationScheduler(userId: string | null, getDayState: () => DayState) {
  useEffect(() => {
    if (!userId || !isBrowser) return;
    let cancelled = false;

    function tick() {
      if (cancelled) return;
      const prefs = loadPrefs(userId!);
      if (!prefs.enabled || Notification.permission !== "granted") return;
      const now = new Date();
      if (inQuietHours(now, prefs.quietHours)) return;
      const fired = loadFired(userId!);
      const today = todayStr(now);
      const cur = hhmm(now);
      const day = now.getDay() as WeekDay;
      const state = getDayState();

      const dayKey = (k: string) => `${k}:${today}`;
      const slotKey = (k: string, slot: string) => `${k}:${today}:${slot}`;

      function fireOnce(key: string, title: string, body: string) {
        if (fired[key]) return;
        fireNotification(title, body, prefs);
        fired[key] = new Date().toISOString();
      }

      // Meal reminders — fire when current minute matches scheduled minute (±1 min window via fired guard)
      (["breakfast", "lunch", "dinner", "snack"] as const).forEach((meal) => {
        const r = prefs.meals[meal];
        if (r.enabled && cur >= r.time && cur <= addMinutes(r.time, 15)) {
          fireOnce(
            dayKey(`meal:${meal}`),
            "Time to log " + meal,
            `Quick add your ${meal} so your macros stay on track.`,
          );
        }
      });

      // Water
      if (prefs.water.enabled && cur >= prefs.water.startTime && cur <= prefs.water.endTime) {
        const slot = waterSlot(cur, prefs.water.startTime, prefs.water.intervalMin);
        if (slot !== null) {
          fireOnce(slotKey("water", String(slot)), "Hydration check 💧", "Have a glass of water to stay on track.");
        }
      }

      // Weigh-in
      if (prefs.weighIn.enabled && prefs.weighIn.days.includes(day) && cur >= prefs.weighIn.time && cur <= addMinutes(prefs.weighIn.time, 30)) {
        if (!state.loggedWeight) {
          fireOnce(dayKey("weighIn"), "Morning weigh-in", "Log today's weight to track your trend.");
        }
      }

      // Workout
      if (prefs.workout.enabled && prefs.workout.days.includes(day) && cur >= prefs.workout.time && cur <= addMinutes(prefs.workout.time, 30)) {
        if (!state.loggedWorkout) {
          fireOnce(dayKey("workout"), "Training time 💪", "Your scheduled workout is ready when you are.");
        }
      }

      // Streak / end of day
      if (prefs.streak.enabled && cur >= prefs.streak.time) {
        if (!state.loggedFood) {
          fireOnce(dayKey("streak"), "Don't break your streak 🔥", "Log at least one item today to keep your streak alive.");
        }
      }

      saveFired(userId!, pruneFired(fired));
    }

    tick();
    const id = window.setInterval(tick, 30_000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [userId, getDayState]);
}

function addMinutes(hhmmStr: string, mins: number): string {
  const [h, m] = hhmmStr.split(":").map(Number);
  const total = h * 60 + m + mins;
  const nh = Math.floor((total % (24 * 60)) / 60);
  const nm = total % 60;
  return `${String(nh).padStart(2, "0")}:${String(nm).padStart(2, "0")}`;
}

function waterSlot(cur: string, start: string, intervalMin: number): number | null {
  const [ch, cm] = cur.split(":").map(Number);
  const [sh, sm] = start.split(":").map(Number);
  const delta = ch * 60 + cm - (sh * 60 + sm);
  if (delta < 0) return null;
  // Fire within 5-minute window after each slot
  const slot = Math.floor(delta / intervalMin);
  const slotStart = slot * intervalMin;
  if (delta - slotStart > 5) return null;
  return slot;
}

function pruneFired(fired: FiredMap): FiredMap {
  // Keep last 3 days
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 3);
  const out: FiredMap = {};
  for (const [k, v] of Object.entries(fired)) {
    if (new Date(v) > cutoff) out[k] = v;
  }
  return out;
}
