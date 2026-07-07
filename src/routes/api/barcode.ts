import { createFileRoute } from "@tanstack/react-router";

type OFFNutriments = {
  "energy-kcal_serving"?: number;
  "energy-kcal_100g"?: number;
  proteins_serving?: number;
  proteins_100g?: number;
  carbohydrates_serving?: number;
  carbohydrates_100g?: number;
  fat_serving?: number;
  fat_100g?: number;
  sugars_100g?: number;
  fiber_100g?: number;
  salt_100g?: number;
  "saturated-fat_100g"?: number;
};

export const Route = createFileRoute("/api/barcode")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const code = url.searchParams.get("code");
        if (!code) return Response.json({ error: "code required" }, { status: 400 });

        const off = await lookupOpenFoodFacts(code);
        if (off) return Response.json(off);

        const upc = await lookupUpcItemDb(code);
        if (upc) return Response.json(upc);

        return Response.json({ error: "not found" }, { status: 404 });
      },
    },
  },
});

async function lookupOpenFoodFacts(code: string) {
  try {
    const fields = [
      "product_name",
      "brands",
      "serving_size",
      "serving_quantity",
      "nutriments",
      "image_front_url",
      "image_url",
      "ingredients_text",
      "allergens",
      "allergens_tags",
      "categories",
      "quantity",
      "nutriscore_grade",
      "nova_group",
      "ecoscore_grade",
    ].join(",");
    const r = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(code)}.json?fields=${fields}`,
      { headers: { "User-Agent": "CalTrack/1.0" } },
    );
    if (!r.ok) return null;
    const data = (await r.json()) as {
      status?: number;
      product?: {
        product_name?: string;
        brands?: string;
        serving_size?: string;
        serving_quantity?: number;
        nutriments?: OFFNutriments;
        image_front_url?: string;
        image_url?: string;
        ingredients_text?: string;
        allergens?: string;
        allergens_tags?: string[];
        categories?: string;
        quantity?: string;
        nutriscore_grade?: string;
        nova_group?: number;
        ecoscore_grade?: string;
      };
    };
    if (data.status !== 1 || !data.product) return null;
    const p = data.product;
    const n = p.nutriments ?? {};
    const sg = p.serving_quantity ?? 100;
    const cal = n["energy-kcal_serving"] ?? ((n["energy-kcal_100g"] ?? 0) * sg) / 100;
    const protein = n.proteins_serving ?? ((n.proteins_100g ?? 0) * sg) / 100;
    const carbs = n.carbohydrates_serving ?? ((n.carbohydrates_100g ?? 0) * sg) / 100;
    const fat = n.fat_serving ?? ((n.fat_100g ?? 0) * sg) / 100;
    if (!cal && !protein && !carbs && !fat && !p.product_name) return null;
    const allergens = p.allergens?.trim() || (p.allergens_tags ?? []).map((t) => t.replace(/^en:/, "")).join(", ");
    return {
      name: p.product_name ?? "Unknown food",
      brand: p.brands ?? "",
      serving_g: Math.round(sg),
      serving_label: p.serving_size ?? `${Math.round(sg)} g`,
      calories: Math.round(cal),
      protein: Math.round(protein * 10) / 10,
      carbs: Math.round(carbs * 10) / 10,
      fat: Math.round(fat * 10) / 10,
      barcode: code,
      image_url: p.image_front_url || p.image_url || "",
      ingredients: p.ingredients_text ?? "",
      allergens: allergens ?? "",
      categories: p.categories ?? "",
      quantity: p.quantity ?? "",
      nutriscore: p.nutriscore_grade ?? "",
      nova_group: p.nova_group,
      ecoscore: p.ecoscore_grade ?? "",
      per100: {
        calories: Math.round(n["energy-kcal_100g"] ?? 0),
        protein: Math.round((n.proteins_100g ?? 0) * 10) / 10,
        carbs: Math.round((n.carbohydrates_100g ?? 0) * 10) / 10,
        fat: Math.round((n.fat_100g ?? 0) * 10) / 10,
        sugars: n.sugars_100g,
        fiber: n.fiber_100g,
        salt: n.salt_100g,
        saturated_fat: n["saturated-fat_100g"],
      },
    };
  } catch {
    return null;
  }
}

async function lookupUpcItemDb(code: string) {
  try {
    const r = await fetch(
      `https://api.upcitemdb.com/prod/trial/lookup?upc=${encodeURIComponent(code)}`,
      { headers: { Accept: "application/json" } },
    );
    if (!r.ok) return null;
    const data = (await r.json()) as {
      items?: Array<{ title?: string; brand?: string; category?: string; images?: string[]; description?: string }>;
    };
    const item = data.items?.[0];
    if (!item?.title) return null;
    return {
      name: item.title,
      brand: item.brand ?? "",
      serving_g: 100,
      serving_label: "1 serving",
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      barcode: code,
      image_url: item.images?.[0] ?? "",
      ingredients: item.description ?? "",
      allergens: "",
      categories: item.category ?? "",
      quantity: "",
    };
  } catch {
    return null;
  }
}
