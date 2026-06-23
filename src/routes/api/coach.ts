import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

type Body = {
  messages?: unknown;
  profile?: {
    display_name?: string | null;
    goal?: string | null;
    weight_kg?: number | null;
    calorie_target?: number | null;
    protein_g?: number | null;
  } | null;
  todaySummary?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    workoutsToday: number;
    streak: number;
  } | null;
};

export const Route = createFileRoute("/api/coach")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json()) as Body;
        if (!Array.isArray(body.messages)) {
          return new Response("messages required", { status: 400 });
        }
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const p = body.profile;
        const s = body.todaySummary;
        const system = [
          "You are CalCoach, a friendly, motivating, evidence-based nutrition and training coach inside the CalTrack app.",
          "Be concise, warm, and concrete. Use short paragraphs and bullet lists. Avoid medical claims.",
          "If the user asks for meal or workout ideas, tailor them to the data below when available.",
          p
            ? `User profile: name=${p.display_name ?? "—"}, goal=${p.goal ?? "—"}, weight=${p.weight_kg ?? "—"} kg, daily target=${p.calorie_target ?? "—"} kcal, protein target=${p.protein_g ?? "—"} g.`
            : "User profile: unknown.",
          s
            ? `Today so far: ${s.calories} kcal, P ${s.protein}g / C ${s.carbs}g / F ${s.fat}g, workouts logged today: ${s.workoutsToday}, current nutrition streak: ${s.streak} days.`
            : "",
        ]
          .filter(Boolean)
          .join("\n");

        const gateway = createLovableAiGatewayProvider(key);
        const result = streamText({
          model: gateway("google/gemini-3-flash-preview"),
          system,
          messages: await convertToModelMessages(body.messages as UIMessage[]),
        });
        return result.toUIMessageStreamResponse({
          originalMessages: body.messages as UIMessage[],
        });
      },
    },
  },
});
