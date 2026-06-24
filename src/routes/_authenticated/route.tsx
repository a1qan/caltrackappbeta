import { createFileRoute, Outlet, redirect, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { fetchProfile } from "@/lib/profile-api";
import { BottomNav } from "@/components/bottom-nav";
import { useTracking } from "@/lib/store";
import { useNotificationScheduler } from "@/lib/notifications";
import { todayStr } from "@/lib/calculations";


export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { supabase } = await import("@/integrations/supabase/client");
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { userId: data.user.id };
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const profileQ = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: () => fetchProfile(user!.id),
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth", replace: true });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (profileQ.data && !profileQ.data.onboarded && pathname !== "/onboarding") {
      navigate({ to: "/onboarding", replace: true });
    }
  }, [profileQ.data, pathname, navigate]);

  const foodEntries = useTracking((s) => s.foodEntries);
  const water = useTracking((s) => s.water);
  const weights = useTracking((s) => s.weights);
  const workouts = useTracking((s) => s.workouts);

  const getDayState = useCallback(() => {
    const today = todayStr();
    return {
      loggedFood: foodEntries.some((e) => e.date === today),
      loggedWater: water.some((w) => w.date === today && w.ml > 0),
      loggedWeight: weights.some((w) => w.date === today),
      loggedWorkout: workouts.some((w) => w.date === today),
    };
  }, [foodEntries, water, weights, workouts]);

  useNotificationScheduler(user?.id ?? null, getDayState);



  if (loading || profileQ.isLoading) {
    return (
      <div className="min-h-[100svh] grid place-items-center">
        <div className="size-10 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
      </div>
    );
  }

  const hideNav = pathname === "/onboarding" || pathname.startsWith("/scan");

  return (
    <div className="bg-background min-h-[100svh]">
      <Outlet />
      {!hideNav && <BottomNav />}
    </div>
  );
}
