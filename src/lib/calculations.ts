import type { ActivityLevel, Gender, Goal } from "./types";

// Mifflin-St Jeor BMR
export function calcBMR(opts: {
  weight_kg: number;
  height_cm: number;
  age: number;
  gender: Gender;
}): number {
  const { weight_kg, height_cm, age, gender } = opts;
  const base = 10 * weight_kg + 6.25 * height_cm - 5 * age;
  if (gender === "male") return base + 5;
  if (gender === "female") return base - 161;
  return base - 78; // other: average
}

const ACTIVITY: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

export function calcTDEE(bmr: number, level: ActivityLevel): number {
  return Math.round(bmr * ACTIVITY[level]);
}

export interface NutritionTargets {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  weekly_change_kg: number;
}

export function calcTargets(opts: {
  weight_kg: number;
  height_cm: number;
  age: number;
  gender: Gender;
  activity_level: ActivityLevel;
  goal: Goal;
}): NutritionTargets {
  const bmr = calcBMR(opts);
  const tdee = calcTDEE(bmr, opts.activity_level);
  let calories = tdee;
  let weekly = 0;
  let proteinPerKg = 1.6;

  switch (opts.goal) {
    case "lose":
      calories = tdee - 500;
      weekly = -0.5;
      proteinPerKg = 2.0;
      break;
    case "gain":
      calories = tdee + 400;
      weekly = 0.4;
      proteinPerKg = 1.8;
      break;
    case "muscle":
      calories = tdee + 250;
      weekly = 0.25;
      proteinPerKg = 2.2;
      break;
    case "maintain":
      calories = tdee;
      weekly = 0;
      proteinPerKg = 1.8;
      break;
  }
  calories = Math.max(1200, Math.round(calories / 10) * 10);

  const protein_g = Math.round(proteinPerKg * opts.weight_kg);
  const fat_g = Math.round((calories * 0.27) / 9);
  const carbCalories = Math.max(0, calories - protein_g * 4 - fat_g * 9);
  const carbs_g = Math.round(carbCalories / 4);

  return { calories, protein_g, carbs_g, fat_g, weekly_change_kg: weekly };
}

export function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export function dateOffset(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}
