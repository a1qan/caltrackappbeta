import type { FoodItem } from "./types";

// Compact built-in food database (per-serving values are realistic)
export const BUILTIN_FOODS: FoodItem[] = [
  { id: "f-chicken", name: "Chicken Breast", serving_g: 100, serving_label: "100 g", calories: 165, protein: 31, carbs: 0, fat: 3.6 },
  { id: "f-rice-w", name: "White Rice (cooked)", serving_g: 100, serving_label: "100 g", calories: 130, protein: 2.7, carbs: 28, fat: 0.3 },
  { id: "f-rice-b", name: "Brown Rice (cooked)", serving_g: 100, serving_label: "100 g", calories: 112, protein: 2.6, carbs: 24, fat: 0.9 },
  { id: "f-egg", name: "Egg, large", serving_g: 50, serving_label: "1 egg", calories: 72, protein: 6.3, carbs: 0.4, fat: 5 },
  { id: "f-oats", name: "Rolled Oats (dry)", serving_g: 40, serving_label: "40 g", calories: 150, protein: 5, carbs: 27, fat: 2.5 },
  { id: "f-banana", name: "Banana", serving_g: 118, serving_label: "1 medium", calories: 105, protein: 1.3, carbs: 27, fat: 0.4 },
  { id: "f-apple", name: "Apple", serving_g: 182, serving_label: "1 medium", calories: 95, protein: 0.5, carbs: 25, fat: 0.3 },
  { id: "f-yogurt-g", name: "Greek Yogurt, plain 0%", serving_g: 170, serving_label: "1 cup", calories: 100, protein: 17, carbs: 6, fat: 0.7 },
  { id: "f-milk-2", name: "Milk, 2%", serving_g: 240, serving_label: "1 cup", calories: 122, protein: 8, carbs: 12, fat: 5 },
  { id: "f-bread-w", name: "Whole Wheat Bread", serving_g: 28, serving_label: "1 slice", calories: 80, protein: 4, carbs: 14, fat: 1 },
  { id: "f-pb", name: "Peanut Butter", serving_g: 32, serving_label: "2 tbsp", calories: 188, protein: 8, carbs: 7, fat: 16 },
  { id: "f-salmon", name: "Salmon Fillet", serving_g: 100, serving_label: "100 g", calories: 208, protein: 20, carbs: 0, fat: 13 },
  { id: "f-broccoli", name: "Broccoli", serving_g: 100, serving_label: "100 g", calories: 35, protein: 2.4, carbs: 7, fat: 0.4 },
  { id: "f-avocado", name: "Avocado", serving_g: 100, serving_label: "100 g", calories: 160, protein: 2, carbs: 9, fat: 15 },
  { id: "f-pasta", name: "Pasta (cooked)", serving_g: 100, serving_label: "100 g", calories: 131, protein: 5, carbs: 25, fat: 1.1 },
  { id: "f-beef", name: "Ground Beef 90/10", serving_g: 100, serving_label: "100 g", calories: 176, protein: 20, carbs: 0, fat: 10 },
  { id: "f-tuna", name: "Tuna, canned in water", serving_g: 100, serving_label: "100 g", calories: 116, protein: 26, carbs: 0, fat: 1 },
  { id: "f-cheese-c", name: "Cheddar Cheese", serving_g: 28, serving_label: "1 oz", calories: 113, protein: 7, carbs: 0.4, fat: 9 },
  { id: "f-protein", name: "Whey Protein Scoop", serving_g: 30, serving_label: "1 scoop", calories: 120, protein: 24, carbs: 3, fat: 1.5 },
  { id: "f-almond", name: "Almonds", serving_g: 28, serving_label: "1 oz (~23)", calories: 164, protein: 6, carbs: 6, fat: 14 },
  { id: "f-potato", name: "Potato (baked)", serving_g: 173, serving_label: "1 medium", calories: 161, protein: 4, carbs: 37, fat: 0.2 },
  { id: "f-sweet-p", name: "Sweet Potato (baked)", serving_g: 150, serving_label: "1 medium", calories: 130, protein: 2.5, carbs: 30, fat: 0.2 },
  { id: "f-spinach", name: "Spinach (raw)", serving_g: 30, serving_label: "1 cup", calories: 7, protein: 0.9, carbs: 1.1, fat: 0.1 },
  { id: "f-tofu", name: "Tofu, firm", serving_g: 100, serving_label: "100 g", calories: 144, protein: 17, carbs: 3, fat: 9 },
  { id: "f-quinoa", name: "Quinoa (cooked)", serving_g: 100, serving_label: "100 g", calories: 120, protein: 4.4, carbs: 21, fat: 1.9 },
  { id: "f-pizza", name: "Pizza Slice (cheese)", serving_g: 107, serving_label: "1 slice", calories: 285, protein: 12, carbs: 36, fat: 10 },
  { id: "f-burger", name: "Burger (cheeseburger)", serving_g: 200, serving_label: "1 burger", calories: 535, protein: 30, carbs: 39, fat: 28 },
  { id: "f-coffee", name: "Coffee, black", serving_g: 240, serving_label: "1 cup", calories: 2, protein: 0.3, carbs: 0, fat: 0 },
  { id: "f-latte", name: "Latte (whole milk)", serving_g: 350, serving_label: "12 oz", calories: 180, protein: 10, carbs: 17, fat: 9 },
  { id: "f-beer", name: "Beer, lager", serving_g: 355, serving_label: "12 oz", calories: 153, protein: 1.6, carbs: 13, fat: 0 },
];

export function searchFoods(query: string, extra: FoodItem[] = []): FoodItem[] {
  const q = query.trim().toLowerCase();
  const all = [...extra, ...BUILTIN_FOODS];
  if (!q) return all.slice(0, 30);
  return all
    .filter(
      (f) =>
        f.name.toLowerCase().includes(q) ||
        (f.brand?.toLowerCase().includes(q) ?? false),
    )
    .slice(0, 30);
}
