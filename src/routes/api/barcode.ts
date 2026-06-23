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
};

export const Route = createFileRoute("/api/barcode")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const code = url.searchParams.get("code");
        if (!code) return Response.json({ error: "code required" }, { status: 400 });
        const r = await fetch(
          `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(code)}.json?fields=product_name,brands,serving_size,serving_quantity,nutriments`,
        );
        if (!r.ok) return Response.json({ error: "lookup failed" }, { status: 502 });
        const data = (await r.json()) as {
          status?: number;
          product?: {
            product_name?: string;
            brands?: string;
            serving_size?: string;
            serving_quantity?: number;
            nutriments?: OFFNutriments;
          };
        };
        if (data.status !== 1 || !data.product) {
          return Response.json({ error: "not found" }, { status: 404 });
        }
        const p = data.product;
        const n = p.nutriments ?? {};
        const sg = p.serving_quantity ?? 100;
        const cal = n["energy-kcal_serving"] ?? ((n["energy-kcal_100g"] ?? 0) * sg) / 100;
        const protein = n.proteins_serving ?? ((n.proteins_100g ?? 0) * sg) / 100;
        const carbs = n.carbohydrates_serving ?? ((n.carbohydrates_100g ?? 0) * sg) / 100;
        const fat = n.fat_serving ?? ((n.fat_100g ?? 0) * sg) / 100;
        return Response.json({
          name: p.product_name ?? "Unknown food",
          brand: p.brands ?? "",
          serving_g: Math.round(sg),
          serving_label: p.serving_size ?? `${Math.round(sg)} g`,
          calories: Math.round(cal),
          protein: Math.round(protein * 10) / 10,
          carbs: Math.round(carbs * 10) / 10,
          fat: Math.round(fat * 10) / 10,
        });
      },
    },
  },
});
