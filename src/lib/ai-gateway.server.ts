// Server-only helpers for AI providers.
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

/**
 * Returns a valid Google AI Studio API key.
 * Google AI Studio API keys start with AIza. AQ.* values are OAuth tokens
 * and the Gemini API rejects them as unauthorized.
 */
function validGeminiKey(): string | null {
  const key = process.env.GEMINI_API_KEY?.trim();

  if (!key) return null;

  if (key.startsWith("AIza")) {
    return key;
  }

  return null;
}

export function getAiConfigurationIssue(): string | null {
  const geminiKey = process.env.GEMINI_API_KEY?.trim();

  if (geminiKey && !geminiKey.startsWith("AIza")) {
    return geminiKey.startsWith("AQ.")
      ? "The saved GEMINI_API_KEY is an OAuth token, not a Google AI Studio API key. Replace it with an API key from Google AI Studio; it should start with AIza."
      : "The saved GEMINI_API_KEY is not a Google AI Studio API key. Replace it with an API key that starts with AIza.";
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
  const configurationIssue = getAiConfigurationIssue();
  if (configurationIssue) return null;

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
  const configurationIssue = getAiConfigurationIssue();
  if (configurationIssue) return null;

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
