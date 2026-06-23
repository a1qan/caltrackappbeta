import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import logo from "@/assets/caltrack-logo.png";
import { Sparkles, Camera, Flame, MessageSquareHeart, Dumbbell, LineChart } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/dashboard" />;

  return (
    <div className="min-h-[100svh] bg-background text-foreground overflow-x-hidden">
      <div className="mx-auto w-full max-w-md px-5 pt-[max(env(safe-area-inset-top),1.5rem)] pb-10">
        <div className="flex items-center gap-3 animate-slide-up">
          <img src={logo} alt="" width={36} height={36} className="rounded-xl" />
          <span className="text-base font-semibold tracking-tight">CalTrack</span>
        </div>

        <section className="mt-14">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary animate-pop-in">
            <Sparkles className="size-3.5" /> AI-powered nutrition + training
          </div>
          <h1 className="mt-5 text-[2.6rem] leading-[1.05] font-semibold tracking-tight animate-slide-up">
            Track smarter. <br />
            <span className="text-gradient">Transform faster.</span>
          </h1>
          <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground animate-slide-up">
            Snap a meal, scan a barcode, log a lift. CalTrack does the math —
            so you can focus on the work.
          </p>

          <div className="mt-7 flex flex-col gap-2.5 animate-slide-up">
            <Link
              to="/auth"
              search={{ mode: "signup" }}
              className="inline-flex h-12 items-center justify-center rounded-full gradient-primary text-primary-foreground font-medium shadow-glow"
            >
              Get started — it's free
            </Link>
            <Link
              to="/auth"
              search={{ mode: "signin" }}
              className="inline-flex h-12 items-center justify-center rounded-full border border-border bg-card text-foreground font-medium"
            >
              I already have an account
            </Link>
          </div>
        </section>

        <section className="mt-12 grid grid-cols-2 gap-3">
          <Feature icon={<Flame className="size-5" />} title="Calorie rings" desc="Daily targets at a glance." />
          <Feature icon={<Camera className="size-5" />} title="AI meal scan" desc="Photo → full macros." />
          <Feature icon={<Dumbbell className="size-5" />} title="Workout logger" desc="20+ exercises built in." />
          <Feature icon={<MessageSquareHeart className="size-5" />} title="CalCoach AI" desc="Your pocket coach." />
        </section>

        <section className="mt-12 glass rounded-3xl p-5 shadow-elevated">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-2xl bg-primary/10 text-primary">
              <LineChart className="size-5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold">See progress, not guesswork</p>
              <p className="text-xs text-muted-foreground">Weight, macros and volume in one place.</p>
            </div>
          </div>
        </section>

        <p className="mt-10 text-center text-xs text-muted-foreground">
          Free to start. Works on iPhone & Android.
        </p>
      </div>
    </div>
  );
}

function Feature({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="rounded-3xl border border-border bg-card p-4 shadow-elevated">
      <div className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary mb-3">
        {icon}
      </div>
      <p className="text-sm font-semibold">{title}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
    </div>
  );
}
