import { createFileRoute } from "@tanstack/react-router";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Send, Sparkles, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { fetchProfile } from "@/lib/profile-api";
import { useTracking, calcStreak } from "@/lib/store";
import { todayStr } from "@/lib/calculations";
import { PageHeader } from "@/components/mobile-shell";
import logo from "@/assets/caltrack-logo.png";

export const Route = createFileRoute("/_authenticated/coach")({
  component: CoachPage,
});

const SUGGESTIONS = [
  "Plan my next 3 meals to hit my macros",
  "How can I lose fat without losing muscle?",
  "Suggest a 45-min push workout",
  "Why am I not making progress?",
];

function friendlyCoachError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error || "");
  if (/AI Studio|AIza|GEMINI_API_KEY|OAuth token/i.test(message)) return message;
  if (/unauthori[sz]ed|401|api key|credential/i.test(message)) {
    return "The AI provider rejected the saved key. Replace GEMINI_API_KEY with a Google AI Studio key that starts with AIza.";
  }
  return message || "CalCoach failed to respond. Check your connection and try again.";
}

function CoachPage() {
  const { user } = useAuth();
  const profileQ = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: () => fetchProfile(user!.id),
    enabled: !!user?.id,
  });

  const stored = useTracking((s) => s.coachMessages);
  const setStored = useTracking((s) => s.setCoachMessages);
  const clearCoach = useTracking((s) => s.clearCoach);
  const foodEntries = useTracking((s) => s.foodEntries);
  const workouts = useTracking((s) => s.workouts);

  const today = todayStr();
  const todaysFood = foodEntries.filter((e) => e.date === today);
  const totals = useMemo(() => {
    let cal = 0, p = 0, c = 0, f = 0;
    for (const e of todaysFood) {
      cal += e.food.calories * e.servings; p += e.food.protein * e.servings;
      c += e.food.carbs * e.servings; f += e.food.fat * e.servings;
    }
    return { calories: Math.round(cal), protein: Math.round(p), carbs: Math.round(c), fat: Math.round(f) };
  }, [todaysFood]);
  const workoutsToday = workouts.filter((w) => w.date === today).length;
  const streak = calcStreak(Array.from(new Set(foodEntries.map((e) => e.date))));

  const initialMessages: UIMessage[] = useMemo(
    () => stored.map((m) => ({ id: m.id, role: m.role, parts: [{ type: "text" as const, text: m.content }] })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/coach",
        body: () => ({
          profile: profileQ.data
            ? {
                display_name: profileQ.data.display_name,
                goal: profileQ.data.goal,
                weight_kg: profileQ.data.weight_kg,
                calorie_target: profileQ.data.calorie_target,
                protein_g: profileQ.data.protein_g,
              }
            : null,
          todaySummary: { ...totals, workoutsToday, streak },
        }),
      }),
    [profileQ.data, totals, workoutsToday, streak],
  );

  const [coachError, setCoachError] = useState<string | null>(null);

  const { messages, sendMessage, status } = useChat({
    id: "coach",
    messages: initialMessages,
    transport,
    onError: (err) => {
      console.error("[coach]", err);
      const message = friendlyCoachError(err);
      setCoachError(message);
      toast.error(message);
    },
  });

  // persist
  useEffect(() => {
    setStored(
      messages.map((m) => ({
        id: m.id,
        role: (m.role === "assistant" ? "assistant" : "user"),
        content: m.parts.map((p) => (p.type === "text" ? p.text : "")).join(""),
        createdAt: Date.now(),
      })),
    );
  }, [messages, setStored]);

  const [input, setInput] = useState("");
  const taRef = useRef<HTMLTextAreaElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, status]);

  useEffect(() => {
    taRef.current?.focus();
  }, []);

  const busy = status === "submitted" || status === "streaming";

  function submit(text?: string) {
    const t = (text ?? input).trim();
    if (!t || busy) return;
    setCoachError(null);
    sendMessage({ text: t });
    setInput("");
    requestAnimationFrame(() => taRef.current?.focus());
  }

  return (
    <div className="mx-auto w-full max-w-md min-h-[100svh] flex flex-col px-4 pt-[max(env(safe-area-inset-top),1rem)] pb-[calc(env(safe-area-inset-bottom)+200px)]">

      <PageHeader
        title="CalCoach"
        trailing={
          messages.length > 0 ? (
            <button onClick={clearCoach} className="grid size-10 place-items-center rounded-full bg-card border border-border text-muted-foreground hover:text-destructive">
              <Trash2 className="size-4" />
            </button>
          ) : null
        }
      />

      <div className="flex-1">
        {messages.length === 0 ? (
          <div className="mt-6 text-center animate-slide-up">
            <img src={logo} width={56} height={56} alt="" className="mx-auto rounded-2xl shadow-glow" />
            <h2 className="mt-4 text-2xl font-semibold tracking-tight">Hey {profileQ.data?.display_name ?? "there"} 👋</h2>
            <p className="mt-1 text-sm text-muted-foreground">I'm your AI nutrition & training coach. Ask me anything.</p>
            <div className="mt-6 grid gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => submit(s)}
                  className="text-left rounded-2xl border border-border bg-card p-3 text-sm hover:bg-accent transition-colors flex items-center gap-2"
                >
                  <Sparkles className="size-4 text-primary shrink-0" />
                  <span>{s}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <ul className="space-y-3 mt-2">
            {messages.map((m) => {
              const text = m.parts.map((p) => (p.type === "text" ? p.text : "")).join("");
              const isUser = m.role === "user";
              return (
                <li key={m.id} className={isUser ? "flex justify-end" : "flex justify-start"}>
                  {isUser ? (
                    <div className="max-w-[85%] rounded-3xl rounded-br-md bg-primary text-primary-foreground px-4 py-2.5 text-[15px] leading-snug whitespace-pre-wrap shadow-elevated">
                      {text}
                    </div>
                  ) : (
                    <div className="max-w-[90%] text-[15px] leading-relaxed text-foreground whitespace-pre-wrap">
                      {text || (status === "streaming" ? <Thinking /> : null)}
                    </div>
                  )}
                </li>
              );
            })}
            {status === "submitted" && (
              <li className="flex"><Thinking /></li>
            )}
          </ul>
        )}
        <div ref={endRef} />
      </div>

      {coachError ? (
        <div className="fixed bottom-[calc(env(safe-area-inset-bottom)+154px)] inset-x-0 z-30 px-4 pointer-events-none">
          <div className="mx-auto max-w-md rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive shadow-elevated">
            {coachError}
          </div>
        </div>
      ) : null}

      <form
        onSubmit={(e) => { e.preventDefault(); submit(); }}
        className="fixed bottom-[calc(env(safe-area-inset-bottom)+88px)] inset-x-0 z-30 px-4"
      >

        <div className="mx-auto max-w-md glass rounded-3xl shadow-elevated p-1.5 flex items-end gap-1.5">
          <textarea
            ref={taRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); }
            }}
            rows={1}
            placeholder="Ask CalCoach…"
            className="flex-1 bg-transparent outline-none resize-none px-3 py-2.5 text-[15px] max-h-32"
          />
          <button
            type="submit"
            disabled={busy || !input.trim()}
            className="grid size-10 place-items-center rounded-2xl gradient-primary text-primary-foreground disabled:opacity-50 shadow-glow shrink-0"
            aria-label="Send"
          >
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
          </button>
        </div>
      </form>
    </div>
  );
}

function Thinking() {
  return (
    <div className="flex items-center gap-1 text-muted-foreground text-sm">
      <span className="size-1.5 rounded-full bg-current animate-pulse" />
      <span className="size-1.5 rounded-full bg-current animate-pulse [animation-delay:.15s]" />
      <span className="size-1.5 rounded-full bg-current animate-pulse [animation-delay:.3s]" />
    </div>
  );
}
