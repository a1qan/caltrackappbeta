// Server-only helpers for AI providers.
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

// A valid Google AI Studio API key starts with "AIza". Anything else (e.g. an
// OAuth token starting with "AQ.") is rejected by Google with 401 UNAUTHENTICATED,
// so we treat it as absent and transparently fall back to Lovable AI.
function validGeminiKey(): string | null {
  const k = process.env.GEMINI_API_KEY?.trim();
  if (!k) return null;
  if (!k.startsWith("AIza")) return null;
  return k;
}

export function createGeminiProvider(apiKey: string) {
  return createOpenAICompatible({
    name: "google-ai-studio",
    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai",
    headers: { Authorization: `Bearer ${apiKey}` },
  });
}

export function createLovableAiGatewayProvider(apiKey: string) {
  return createOpenAICompatible({
    name: "lovable",
    baseURL: "https://ai.gateway.lovable.dev/v1",
    headers: { "Lovable-API-Key": apiKey },
  });
}

export function resolveChatEndpoint():
  | { url: string; headers: Record<string, string>; model: string }
  | null {
  const gemKey = validGeminiKey();
  if (gemKey) {
    return {
      url: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
      headers: { Authorization: `Bearer ${gemKey}` },
      model: "gemini-2.5-flash",
    };
  }
  const lovKey = process.env.LOVABLE_API_KEY;
  if (lovKey) {
    return {
      url: "https://ai.gateway.lovable.dev/v1/chat/completions",
      headers: { "Lovable-API-Key": lovKey },
      model: "google/gemini-2.5-flash",
    };
  }
  return null;
}

export function resolveChatModel() {
  const gemKey = validGeminiKey();
  if (gemKey) return createGeminiProvider(gemKey)("gemini-2.5-flash");
  const lovKey = process.env.LOVABLE_API_KEY;
  if (lovKey) return createLovableAiGatewayProvider(lovKey)("google/gemini-2.5-flash");
  return null;
}
