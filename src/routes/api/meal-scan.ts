import { createFileRoute } from "@tanstack/react-router";
import { getAiConfigurationIssue, resolveChatEndpoint } from "@/lib/ai-gateway.server";

type Body = { imageDataUrl?: string; note?: string };

export const Route = createFileRoute("/api/meal-scan")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json()) as Body;
        if (!body.imageDataUrl) {
          return Response.json({ error: "imageDataUrl required" }, { status: 400 });
        }
        const configurationIssue = getAiConfigurationIssue();
        if (configurationIssue) {
          return Response.json({ error: configurationIssue }, { status: 503 });
        }

        const endpoint = resolveChatEndpoint();
        if (!endpoint) {
          return Response.json(
            { error: "No AI provider configured. Add a valid GEMINI_API_KEY from Google AI Studio." },
            { status: 503 },
          );
        }

        const prompt = `You are a nutrition vision assistant. Look at the image of a meal and ESTIMATE the contents. ${
          body.note ? `User note: ${body.note}. ` : ""
        }Reply ONLY with strict JSON in this exact shape and units:
{"name": string, "portion": string, "calories": number, "protein_g": number, "carbs_g": number, "fat_g": number, "confidence": "low"|"medium"|"high", "notes": string}
Numbers must be plain integers or one-decimal numbers. Do not include any other text.`;

        const res = await fetch(endpoint.url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...endpoint.headers,
          },
          body: JSON.stringify({
            model: endpoint.model,
            messages: [
              {
                role: "user",
                content: [
                  { type: "text", text: prompt },
                  { type: "image_url", image_url: { url: body.imageDataUrl } },
                ],
              },
            ],
            response_format: { type: "json_object" },
          }),
        });

        if (!res.ok) {
          const text = await res.text();
          return Response.json(
            { error: `AI error ${res.status}`, detail: text.slice(0, 500) },
            { status: res.status === 402 || res.status === 429 ? res.status : 500 },
          );
        }
        const json = (await res.json()) as {
          choices?: Array<{ message?: { content?: string } }>;
        };
        const content = json.choices?.[0]?.message?.content ?? "";
        try {
          const parsed = JSON.parse(content);
          return Response.json(parsed);
        } catch {
          // try to extract first JSON object
          const m = content.match(/\{[\s\S]*\}/);
          if (m) {
            try {
              return Response.json(JSON.parse(m[0]));
            } catch {
              /* ignore */
            }
          }
          return Response.json({ error: "AI returned invalid JSON", raw: content }, { status: 502 });
        }
      },
    },
  },
});
