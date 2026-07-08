// Server-only helpers for AI providers.
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

/**
 * Returns a valid Google AI Studio API key.
 * Supports both legacy AIza... keys and the newer AQ... keys.
 */
function validGeminiKey(): string | null {
  const key = process.env.GEMINI_API_KEY?.trim();

  if (!key) return null;

  if (key.startsWith("AIza") || key.startsWith("AQ.")) {
    return key;
  }

  return null;
}

export function createGeminiProvider(apiKey: string) {
  return createOpenAICompatible({
    name: "google-ai-studio",
    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai",
    apiKey,
  });
}

export function createLovableAiGatewayProvider(apiKey: string) {
  return createOpenAICompatible({
    name: "lovable",
    baseURL: "https://ai.gateway.lovable.dev/v1",
    headers: {
      "Lovable-API-Key": apiKey,
    },
  });
}

export function resolveChatEndpoint():
  | {
      url: string;
      headers: Record<string, string>;
      model: string;
    }
  | null {
  const geminiKey = validGeminiKey();

  if (geminiKey) {
    return {
      url: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
      headers: {
        Authorization: `Bearer ${geminiKey}`,
      },
      model: "gemini-2.5-flash",
    };
  }

  const lovableKey = process.env.LOVABLE_API_KEY?.trim();

  if (lovableKey) {
    return {
      url: "https://ai.gateway.lovable.dev/v1/chat/completions",
      headers: {
        "Lovable-API-Key": lovableKey,
      },
      model: "google/gemini-2.5-flash",
    };
  }

  return null;
}

export function resolveChatModel() {
  const geminiKey = validGeminiKey();

  if (geminiKey) {
    return createGeminiProvider(geminiKey)("gemini-2.5-flash");
  }

  const lovableKey = process.env.LOVABLE_API_KEY?.trim();

  if (lovableKey) {
    return createLovableAiGatewayProvider(lovableKey)(
      "google/gemini-2.5-flash"
    );
  }

  return null;
}
