// localStorage-backed per-user data store using zustand for reactivity
import { create } from "zustand";
import type {
  CoachMessage,
  FoodEntry,
  FoodItem,
  LoggedExercise,
  MeasurementEntry,
  ProgressPhoto,
  WaterEntry,
  WeightEntry,
  WorkoutPlan,
  WorkoutSession,
} from "./types";

const KEY_PREFIX = "caltrack:v1";
const isBrowser = typeof window !== "undefined";

function load<T>(userId: string, slot: string, fallback: T): T {
  if (!isBrowser) return fallback;
  try {
    const raw = window.localStorage.getItem(`${KEY_PREFIX}:${userId}:${slot}`);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}
function save<T>(userId: string, slot: string, value: T) {
  if (!isBrowser) return;
  try {
    window.localStorage.setItem(
      `${KEY_PREFIX}:${userId}:${slot}`,
      JSON.stringify(value),
    );
  } catch {
    /* ignore */
  }
}

export interface TrackingState {
  userId: string | null;
  foodEntries: FoodEntry[];
  customFoods: FoodItem[];
  favorites: string[]; // food ids
  water: WaterEntry[];
  weights: WeightEntry[];
  measurements: MeasurementEntry[];
  photos: ProgressPhoto[];
  workouts: WorkoutSession[];
  plans: WorkoutPlan[];
  coachMessages: CoachMessage[];
  setUser: (userId: string | null) => void;

  addFoodEntry: (e: FoodEntry) => void;
  updateFoodEntry: (id: string, patch: Partial<FoodEntry>) => void;
  removeFoodEntry: (id: string) => void;

  addCustomFood: (f: FoodItem) => void;
  toggleFavorite: (id: string) => void;

  addWater: (date: string, ml: number) => void;
  setWater: (date: string, ml: number) => void;

  addWeight: (w: WeightEntry) => void;
  removeWeight: (date: string) => void;

  addMeasurement: (m: MeasurementEntry) => void;
  addPhoto: (p: ProgressPhoto) => void;
  removePhoto: (id: string) => void;

  addWorkout: (w: WorkoutSession) => void;
  updateWorkout: (id: string, patch: Partial<WorkoutSession>) => void;
  removeWorkout: (id: string) => void;

  addPlan: (p: WorkoutPlan) => void;
  removePlan: (id: string) => void;

  setCoachMessages: (m: CoachMessage[]) => void;
  appendCoachMessage: (m: CoachMessage) => void;
  clearCoach: () => void;
}

function emptyState() {
  return {
    foodEntries: [] as FoodEntry[],
    customFoods: [] as FoodItem[],
    favorites: [] as string[],
    water: [] as WaterEntry[],
    weights: [] as WeightEntry[],
    measurements: [] as MeasurementEntry[],
    photos: [] as ProgressPhoto[],
    workouts: [] as WorkoutSession[],
    plans: [] as WorkoutPlan[],
    coachMessages: [] as CoachMessage[],
  };
}

function loadAll(userId: string) {
  return {
    foodEntries: load(userId, "foodEntries", [] as FoodEntry[]),
    customFoods: load(userId, "customFoods", [] as FoodItem[]),
    favorites: load(userId, "favorites", [] as string[]),
    water: load(userId, "water", [] as WaterEntry[]),
    weights: load(userId, "weights", [] as WeightEntry[]),
    measurements: load(userId, "measurements", [] as MeasurementEntry[]),
    photos: load(userId, "photos", [] as ProgressPhoto[]),
    workouts: load(userId, "workouts", [] as WorkoutSession[]),
    plans: load(userId, "plans", [] as WorkoutPlan[]),
    coachMessages: load(userId, "coachMessages", [] as CoachMessage[]),
  };
}

export const useTracking = create<TrackingState>((set, get) => ({
  userId: null,
  ...emptyState(),

  setUser: (userId) => {
    if (userId === get().userId) return;
    if (userId) {
      set({ userId, ...loadAll(userId) });
    } else {
      set({ userId: null, ...emptyState() });
    }
  },

  addFoodEntry: (e) => {
    const arr = [...get().foodEntries, e];
    set({ foodEntries: arr });
    const uid = get().userId;
    if (uid) save(uid, "foodEntries", arr);
  },
  updateFoodEntry: (id, patch) => {
    const arr = get().foodEntries.map((e) => (e.id === id ? { ...e, ...patch } : e));
    set({ foodEntries: arr });
    const uid = get().userId;
    if (uid) save(uid, "foodEntries", arr);
  },
  removeFoodEntry: (id) => {
    const arr = get().foodEntries.filter((e) => e.id !== id);
    set({ foodEntries: arr });
    const uid = get().userId;
    if (uid) save(uid, "foodEntries", arr);
  },

  addCustomFood: (f) => {
    const arr = [{ ...f, isCustom: true }, ...get().customFoods];
    set({ customFoods: arr });
    const uid = get().userId;
    if (uid) save(uid, "customFoods", arr);
  },
  toggleFavorite: (id) => {
    const cur = get().favorites;
    const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
    set({ favorites: next });
    const uid = get().userId;
    if (uid) save(uid, "favorites", next);
  },

  addWater: (date, ml) => {
    const existing = get().water.find((w) => w.date === date);
    let arr: WaterEntry[];
    if (existing) {
      arr = get().water.map((w) =>
        w.date === date ? { ...w, ml: Math.max(0, w.ml + ml) } : w,
      );
    } else {
      arr = [...get().water, { date, ml: Math.max(0, ml) }];
    }
    set({ water: arr });
    const uid = get().userId;
    if (uid) save(uid, "water", arr);
  },
  setWater: (date, ml) => {
    const has = get().water.find((w) => w.date === date);
    const arr = has
      ? get().water.map((w) => (w.date === date ? { ...w, ml } : w))
      : [...get().water, { date, ml }];
    set({ water: arr });
    const uid = get().userId;
    if (uid) save(uid, "water", arr);
  },

  addWeight: (w) => {
    const filtered = get().weights.filter((x) => x.date !== w.date);
    const arr = [...filtered, w].sort((a, b) => a.date.localeCompare(b.date));
    set({ weights: arr });
    const uid = get().userId;
    if (uid) save(uid, "weights", arr);
  },
  removeWeight: (date) => {
    const arr = get().weights.filter((w) => w.date !== date);
    set({ weights: arr });
    const uid = get().userId;
    if (uid) save(uid, "weights", arr);
  },

  addMeasurement: (m) => {
    const filtered = get().measurements.filter((x) => x.date !== m.date);
    const arr = [...filtered, m].sort((a, b) => a.date.localeCompare(b.date));
    set({ measurements: arr });
    const uid = get().userId;
    if (uid) save(uid, "measurements", arr);
  },
  addPhoto: (p) => {
    const arr = [p, ...get().photos];
    set({ photos: arr });
    const uid = get().userId;
    if (uid) save(uid, "photos", arr);
  },
  removePhoto: (id) => {
    const arr = get().photos.filter((p) => p.id !== id);
    set({ photos: arr });
    const uid = get().userId;
    if (uid) save(uid, "photos", arr);
  },

  addWorkout: (w) => {
    const arr = [w, ...get().workouts];
    set({ workouts: arr });
    const uid = get().userId;
    if (uid) save(uid, "workouts", arr);
  },
  updateWorkout: (id, patch) => {
    const arr = get().workouts.map((w) => (w.id === id ? { ...w, ...patch } : w));
    set({ workouts: arr });
    const uid = get().userId;
    if (uid) save(uid, "workouts", arr);
  },
  removeWorkout: (id) => {
    const arr = get().workouts.filter((w) => w.id !== id);
    set({ workouts: arr });
    const uid = get().userId;
    if (uid) save(uid, "workouts", arr);
  },

  addPlan: (p) => {
    const arr = [p, ...get().plans];
    set({ plans: arr });
    const uid = get().userId;
    if (uid) save(uid, "plans", arr);
  },
  removePlan: (id) => {
    const arr = get().plans.filter((p) => p.id !== id);
    set({ plans: arr });
    const uid = get().userId;
    if (uid) save(uid, "plans", arr);
  },

  setCoachMessages: (m) => {
    set({ coachMessages: m });
    const uid = get().userId;
    if (uid) save(uid, "coachMessages", m);
  },
  appendCoachMessage: (m) => {
    const arr = [...get().coachMessages, m];
    set({ coachMessages: arr });
    const uid = get().userId;
    if (uid) save(uid, "coachMessages", arr);
  },
  clearCoach: () => {
    set({ coachMessages: [] });
    const uid = get().userId;
    if (uid) save(uid, "coachMessages", []);
  },
}));

// helpers
export function workoutVolume(w: WorkoutSession): number {
  let total = 0;
  for (const ex of w.exercises) {
    for (const s of ex.sets) {
      if (s.done) total += s.reps * s.weight_kg;
    }
  }
  return total;
}

export function estimateCaloriesBurned(exercises: LoggedExercise[]): number {
  // very rough: 5 kcal per completed set of any weighted exercise
  let total = 0;
  for (const ex of exercises) {
    for (const s of ex.sets) if (s.done) total += 5;
  }
  return total;
}

export function calcStreak(dates: string[]): number {
  if (!dates.length) return 0;
  const set = new Set(dates);
  let streak = 0;
  const d = new Date();
  // allow today not yet logged; start from yesterday if today missing
  if (!set.has(d.toISOString().slice(0, 10))) d.setDate(d.getDate() - 1);
  while (set.has(d.toISOString().slice(0, 10))) {
    streak += 1;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}
