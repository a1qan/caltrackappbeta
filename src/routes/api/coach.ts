import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { getAiConfigurationIssue, resolveChatModel } from "@/lib/ai-gateway.server";

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
        const configurationIssue = getAiConfigurationIssue();
        if (configurationIssue) {
          return new Response(configurationIssue, { status: 503 });
        }

        const model = resolveChatModel();
        if (!model) {
          return new Response(
            "No AI provider configured. Add a valid GEMINI_API_KEY from Google AI Studio.",
            { status: 503 },
          );
        }

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

        const result = streamText({
          model,
          system,
          messages: await convertToModelMessages(body.messages as UIMessage[]),
          onError: ({ error }) => {
            console.error("[coach streamText error]", error);
          },
        });
        return result.toUIMessageStreamResponse({
          originalMessages: body.messages as UIMessage[],
          onError: (error) => {
            console.error("[coach stream response error]", error);
            const message = error instanceof Error ? error.message : "AI request failed";
            if (/unauthori[sz]ed|401|api key|credential/i.test(message)) {
              return "The AI provider rejected the saved key. Replace GEMINI_API_KEY with a Google AI Studio key that starts with AIza.";
            }
            return error instanceof Error ? error.message : "AI request failed";
          },
        });
      },
    },
  },
});
