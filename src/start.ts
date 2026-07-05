import { createStart, createMiddleware } from "@tanstack/react-start";

import { renderErrorPage } from "./lib/error-page";
// Intentionally replaces the generated attachSupabaseAuth: this project uses the
// user's own Supabase project (src/lib/supabase.ts), not the built-in backend.
import { supabase } from "@/lib/supabase";

const errorMiddleware = createMiddleware().server(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    if (error != null && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    console.error(error);
    return new Response(renderErrorPage(), {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
});

const attachOwnSupabaseAuth = createMiddleware({ type: "function" }).client(
  async ({ next }) => {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    return next({
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  },
);

export const startInstance = createStart(() => ({
  functionMiddleware: [attachOwnSupabaseAuth],
  requestMiddleware: [errorMiddleware],
}));
