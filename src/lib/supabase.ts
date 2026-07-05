// The app's own Supabase project — used everywhere (Lovable preview + Vercel).
// The publishable key is safe to keep in code.
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

const SUPABASE_URL = "https://hhhivtdlnionjthjzraz.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_ldA1QmPSxpF45oH2s4su2A_hr7viPUf";

// New-format publishable keys are opaque strings, not JWTs. supabase-js still
// sends them as a Bearer token when no session exists, which PostgREST rejects.
// Strip that header when it just mirrors the api key.
function createSupabaseFetch(supabaseKey: string): typeof fetch {
  return (input, init) => {
    const headers = new Headers(
      typeof Request !== "undefined" && input instanceof Request ? input.headers : undefined,
    );
    if (init?.headers) {
      new Headers(init.headers).forEach((value, key) => headers.set(key, value));
    }
    if (headers.get("Authorization") === `Bearer ${supabaseKey}`) {
      headers.delete("Authorization");
    }
    headers.set("apikey", supabaseKey);
    return fetch(input, { ...init, headers });
  };
}

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  global: { fetch: createSupabaseFetch(SUPABASE_PUBLISHABLE_KEY) },
  auth: {
    storage: typeof window !== "undefined" ? localStorage : undefined,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
