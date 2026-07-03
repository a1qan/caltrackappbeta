// Server-only helpers for AI providers.
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

/**
 * User's own Google AI Studio key (free tier) — preferred when set.
 * Uses Google's OpenAI-compatible endpoint.
 */
export function createGeminiProvider(apiKey: string) {
  return createOpenAICompatible({
    name: "google-ai-studio",
    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai",
    headers: { Authorization: `Bearer ${apiKey}` },
  });
}

/** Lovable AI Gateway — fallback when no GEMINI_API_KEY is configured. */
export function createLovableAiGatewayProvider(apiKey: string) {
  return createOpenAICompatible({
    name: "lovable",
    baseURL: "https://ai.gateway.lovable.dev/v1",
    headers: { "Lovable-API-Key": apiKey },
  });
}

/** Resolve raw chat-completions endpoint config (for non-AI-SDK fetch calls). */
export function resolveChatEndpoint():
  | { url: string; headers: Record<string, string>; model: string }
  | null {
  const gemKey = process.env.GEMINI_API_KEY;
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
      model: "google/gemini-3-flash-preview",
    };
  }
  return null;
}

/** Resolve an AI SDK model: user's Gemini key first, Lovable AI as fallback. */
export function resolveChatModel() {
  const gemKey = process.env.GEMINI_API_KEY;
  if (gemKey) return createGeminiProvider(gemKey)("gemini-2.5-flash");
  const lovKey = process.env.LOVABLE_API_KEY;
  if (lovKey) return createLovableAiGatewayProvider(lovKey)("google/gemini-3-flash-preview");
  return null;
}
