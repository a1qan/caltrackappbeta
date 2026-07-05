import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import logo from "@/assets/caltrack-logo.png";
import { Loader2, Mail, Lock, Eye, EyeOff } from "lucide-react";

const searchSchema = z.object({
  mode: z.enum(["signin", "signup", "forgot"]).optional().default("signin"),
});

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  component: AuthPage,
});

function AuthPage() {
  const { mode } = Route.useSearch();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && user) navigate({ to: "/dashboard", replace: true });
  }, [user, authLoading, navigate]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: name || undefined },
          },
        });
        if (error) throw error;
        toast.success("Account created — welcome!");
      } else if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin + "/reset-password",
        });
        if (error) throw error;
        toast.success("Check your inbox for the reset link.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    setBusy(true);
    try {
      // Google refuses to load inside an iframe (like the Lovable preview),
      // so open the OAuth flow in a new tab there; session syncs back automatically.
      const inIframe = typeof window !== "undefined" && window.self !== window.top;
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin,
          queryParams: { prompt: "select_account" },
          skipBrowserRedirect: inIframe,
        },
      });
      if (error) throw error;
      if (inIframe && data?.url) {
        window.open(data.url, "_blank");
        toast.info("Finish signing in with Google in the new tab.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Google sign-in failed");
    } finally {
      setBusy(false);
    }
  }

  const title =
    mode === "signup" ? "Create your account" :
    mode === "forgot" ? "Reset your password" :
    "Welcome back";
  const sub =
    mode === "signup" ? "Start tracking in under a minute." :
    mode === "forgot" ? "Enter the email you signed up with." :
    "Sign in to continue your streak.";

  return (
    <div className="min-h-[100svh] bg-background flex flex-col">
      <div className="mx-auto w-full max-w-md px-5 pt-[max(env(safe-area-inset-top),1.5rem)] pb-8 flex-1 flex flex-col">
        <Link to="/" className="flex items-center gap-2.5 text-sm font-semibold">
          <img src={logo} alt="" width={28} height={28} className="rounded-lg" />
          CalTrack
        </Link>

        <div className="mt-10 animate-slide-up">
          <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{sub}</p>
        </div>

        {mode !== "forgot" && (
          <button
            onClick={google}
            disabled={busy}
            className="mt-8 inline-flex h-12 w-full items-center justify-center gap-2.5 rounded-full border border-border bg-card font-medium disabled:opacity-60"
          >
            <GoogleIcon /> Continue with Google
          </button>
        )}

        {mode !== "forgot" && (
          <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" />
            or with email
            <div className="h-px flex-1 bg-border" />
          </div>
        )}

        <form onSubmit={submit} className="flex flex-col gap-3">
          {mode === "signup" && (
            <Field>
              <input
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full h-12 bg-transparent outline-none text-[15px]"
              />
            </Field>
          )}
          <Field icon={<Mail className="size-4" />}>
            <input
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-12 bg-transparent outline-none text-[15px]"
            />
          </Field>
          {mode !== "forgot" && (
            <Field icon={<Lock className="size-4" />}>
              <input
                type={showPw ? "text" : "password"}
                required
                minLength={6}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-12 bg-transparent outline-none text-[15px]"
              />
              <button type="button" onClick={() => setShowPw((v) => !v)} className="text-muted-foreground">
                {showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </Field>
          )}

          <button
            type="submit"
            disabled={busy}
            className="mt-2 inline-flex h-12 items-center justify-center gap-2 rounded-full gradient-primary text-primary-foreground font-medium shadow-glow disabled:opacity-60"
          >
            {busy && <Loader2 className="size-4 animate-spin" />}
            {mode === "signup" ? "Create account" : mode === "forgot" ? "Send reset link" : "Sign in"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm">
          {mode === "signin" && (
            <>
              <Link to="/auth" search={{ mode: "forgot" }} className="text-muted-foreground hover:text-foreground">
                Forgot password?
              </Link>
              <div className="mt-3 text-muted-foreground">
                No account?{" "}
                <Link to="/auth" search={{ mode: "signup" }} className="text-primary font-medium">
                  Create one
                </Link>
              </div>
            </>
          )}
          {mode === "signup" && (
            <div className="text-muted-foreground">
              Already have one?{" "}
              <Link to="/auth" search={{ mode: "signin" }} className="text-primary font-medium">
                Sign in
              </Link>
            </div>
          )}
          {mode === "forgot" && (
            <Link to="/auth" search={{ mode: "signin" }} className="text-primary font-medium">
              Back to sign in
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ icon, children }: { icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <label className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 transition-colors focus-within:border-ring focus-within:ring-4 focus-within:ring-ring/15">
      {icon && <span className="text-muted-foreground">{icon}</span>}
      {children}
    </label>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
      <path fill="#4285F4" d="M22.5 12.27c0-.79-.07-1.55-.2-2.27H12v4.3h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.75h3.57c2.09-1.92 3.22-4.76 3.22-8.09Z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.75c-.99.66-2.25 1.06-3.71 1.06-2.86 0-5.28-1.93-6.15-4.52H2.18v2.84A11 11 0 0 0 12 23Z" />
      <path fill="#FBBC05" d="M5.85 14.13a6.6 6.6 0 0 1 0-4.26V7.03H2.18a11 11 0 0 0 0 9.94l3.67-2.84Z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.07.56 4.21 1.65l3.16-3.16C17.45 2.12 14.97 1 12 1A11 11 0 0 0 2.18 7.03l3.67 2.84C6.72 7.31 9.14 5.38 12 5.38Z" />
    </svg>
  );
}
