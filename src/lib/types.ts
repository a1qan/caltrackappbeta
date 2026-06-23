// CalTrack domain types
export type Gender = "male" | "female" | "other";
export type ActivityLevel =
  | "sedentary"
  | "light"
  | "moderate"
  | "active"
  | "very_active";
export type Goal = "lose" | "gain" | "muscle" | "maintain";

export interface Profile {
  user_id: string;
  display_name: string | null;
  age: number | null;
  gender: Gender | null;
  height_cm: number | null;
  weight_kg: number | null;
  activity_level: ActivityLevel | null;
  goal: Goal | null;
  calorie_target: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  weekly_change_kg: number | null;
  onboarded: boolean;
}

export interface FoodItem {
  id: string;
  name: string;
  brand?: string;
  serving_g: number;
  serving_label: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  isCustom?: boolean;
  isFavorite?: boolean;
}

export type MealType = "breakfast" | "lunch" | "dinner" | "snack";

export interface FoodEntry {
  id: string;
  date: string; // YYYY-MM-DD
  meal: MealType;
  food: FoodItem;
  servings: number;
  loggedAt: number;
}

export interface WaterEntry {
  date: string;
  ml: number;
}

export interface WeightEntry {
  date: string;
  weight_kg: number;
  loggedAt: number;
}

export interface MeasurementEntry {
  date: string;
  waist_cm?: number;
  chest_cm?: number;
  arms_cm?: number;
  hips_cm?: number;
  thighs_cm?: number;
}

export interface ProgressPhoto {
  id: string;
  date: string;
  dataUrl: string;
}

export interface Exercise {
  id: string;
  name: string;
  muscleGroup:
    | "Chest"
    | "Back"
    | "Legs"
    | "Shoulders"
    | "Arms"
    | "Core"
    | "Cardio"
    | "Other";
  description: string;
  instructions: string[];
  suggestedSets: number;
  suggestedReps: string;
  isCustom?: boolean;
}

export interface WorkoutSet {
  reps: number;
  weight_kg: number;
  done: boolean;
}

export interface LoggedExercise {
  exerciseId: string;
  name: string;
  muscleGroup: Exercise["muscleGroup"];
  sets: WorkoutSet[];
  notes?: string;
}

export interface WorkoutSession {
  id: string;
  date: string;
  name: string;
  startedAt: number;
  endedAt?: number;
  exercises: LoggedExercise[];
  caloriesBurned?: number;
}

export interface WorkoutPlan {
  id: string;
  name: string;
  exercises: { exerciseId: string; sets: number; reps: string }[];
}

export interface CoachMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: number;
  progress?: number;
  target?: number;
}
