import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Camera, ImagePlus, Loader2, ScanLine, X } from "lucide-react";
import { PageHeader } from "@/components/mobile-shell";
import { BarcodeCamera } from "@/components/barcode-camera";
import { useTracking } from "@/lib/store";
import { todayStr } from "@/lib/calculations";
import type { FoodItem, MealType } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/scan")({
  component: ScanPage,
});


type Mode = "ai" | "barcode";

function ScanPage() {
  const [mode, setMode] = useState<Mode>("ai");
  const navigate = useNavigate();
  return (
    <div className="mx-auto w-full max-w-md px-4 pt-[max(env(safe-area-inset-top),1rem)] pb-12 min-h-[100svh]">
      <PageHeader title="Quick add" back={() => navigate({ to: "/food" })} />

      <div className="grid grid-cols-2 gap-2 rounded-2xl bg-muted p-1">
        <button
          onClick={() => setMode("ai")}
          className={`h-10 rounded-xl text-sm font-medium transition-colors ${mode === "ai" ? "bg-card shadow-sm" : "text-muted-foreground"}`}
        >
          AI meal scan
        </button>
        <button
          onClick={() => setMode("barcode")}
          className={`h-10 rounded-xl text-sm font-medium transition-colors ${mode === "barcode" ? "bg-card shadow-sm" : "text-muted-foreground"}`}
        >
          Barcode
        </button>
      </div>

      <div className="mt-6">{mode === "ai" ? <AiScan /> : <BarcodeScan />}</div>
    </div>
  );
}

interface AiResult {
  name: string;
  portion: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  confidence?: string;
  notes?: string;
}

function AiScan() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<AiResult | null>(null);
  const addEntry = useTracking((s) => s.addFoodEntry);

  function pick() { fileRef.current?.click(); }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPreview(String(reader.result));
    reader.readAsDataURL(file);
    setResult(null);
  }

  async function scan() {
    if (!preview) return;
    setBusy(true);
    try {
      const r = await fetch("/api/meal-scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageDataUrl: preview, note }),
      });
      const data = await r.json();
      if (!r.ok) {
        if (r.status === 402) throw new Error("AI credits exhausted. Add credits in Settings → Workspace.");
        if (r.status === 429) throw new Error("Too many requests. Try again in a moment.");
        throw new Error(data.error ?? "Scan failed");
      }
      setResult(data);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Scan failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <input ref={fileRef} type="file" accept="image/*" capture="environment" hidden onChange={onFile} />
      <div className="rounded-3xl bg-card border border-border p-4 shadow-elevated">
        {preview ? (
          <div className="relative">
            <img src={preview} alt="Meal" className="w-full aspect-square object-cover rounded-2xl" />
            <button
              onClick={() => { setPreview(null); setResult(null); }}
              className="absolute top-2 right-2 size-8 grid place-items-center rounded-full bg-background/80 backdrop-blur"
              aria-label="Remove image"
            >
              <X className="size-4" />
            </button>
          </div>
        ) : (
          <button onClick={pick} className="w-full aspect-square rounded-2xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 text-muted-foreground hover:bg-accent transition-colors">
            <Camera className="size-8" />
            <span className="text-sm font-medium">Snap a photo of your meal</span>
            <span className="text-xs">or upload from gallery</span>
          </button>
        )}

        <textarea
          rows={2}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Optional: 'about 1 cup', 'with olive oil'…"
          className="mt-3 w-full rounded-2xl border border-border bg-background p-3 text-sm outline-none focus:ring-4 focus:ring-ring/15"
        />

        <div className="mt-3 flex gap-2">
          {!preview && (
            <button onClick={pick} className="flex-1 h-12 rounded-full border border-border bg-card font-medium inline-flex items-center justify-center gap-2">
              <ImagePlus className="size-4" /> Choose photo
            </button>
          )}
          {preview && (
            <button
              onClick={scan}
              disabled={busy}
              className="flex-1 h-12 rounded-full gradient-primary text-primary-foreground font-semibold shadow-glow inline-flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {busy ? <Loader2 className="size-4 animate-spin" /> : <Camera className="size-4" />}
              {busy ? "Analyzing…" : "Analyze meal"}
            </button>
          )}
        </div>
      </div>

      {result && (
        <ReviewCard
          initial={{
            id: crypto.randomUUID(),
            name: result.name,
            serving_g: 100,
            serving_label: result.portion || "1 portion",
            calories: Math.round(result.calories),
            protein: result.protein_g,
            carbs: result.carbs_g,
            fat: result.fat_g,
            isCustom: true,
          }}
          confidence={result.confidence}
          notes={result.notes}
          onSave={(food, meal) => {
            addEntry({
              id: crypto.randomUUID(),
              date: todayStr(),
              meal,
              food,
              servings: 1,
              loggedAt: Date.now(),
            });
            toast.success("Logged");
            setPreview(null);
            setResult(null);
          }}
        />
      )}
    </div>
  );
}

function BarcodeScan() {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [item, setItem] = useState<FoodItem | null>(null);
  const [scanning, setScanning] = useState(false);
  const addEntry = useTracking((s) => s.addFoodEntry);

  async function fetchCode(raw: string) {
    setBusy(true);
    try {
      const r = await fetch(`/api/barcode?code=${encodeURIComponent(raw.trim())}`);
      const data = await r.json();
      if (!r.ok) throw new Error(data.error === "not found" ? "No product found for that barcode." : "Lookup failed");
      setItem({ id: crypto.randomUUID(), ...data });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lookup failed");
    } finally {
      setBusy(false);
    }
  }

  async function lookup(e: React.FormEvent) {
    e.preventDefault();
    await fetchCode(code);
  }

  return (
    <div>
      <div className="rounded-3xl bg-card border border-border p-4 shadow-elevated">
        <button
          onClick={() => setScanning(true)}
          className="w-full aspect-[4/3] rounded-2xl bg-muted hover:bg-accent transition-colors grid place-items-center text-foreground border-2 border-dashed border-border"
        >
          <div className="text-center px-6">
            <ScanLine className="mx-auto size-10 mb-2 text-primary" />
            <p className="text-sm font-semibold">Tap to scan a barcode</p>
            <p className="text-[11px] mt-1 text-muted-foreground">Uses your camera · EAN, UPC, QR</p>
          </div>
        </button>

        <div className="my-3 flex items-center gap-2 text-[11px] uppercase tracking-wider text-muted-foreground">
          <span className="h-px flex-1 bg-border" /> or enter manually <span className="h-px flex-1 bg-border" />
        </div>

        <form onSubmit={lookup} className="flex gap-2">
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="e.g. 5449000000996"
            className="flex-1 h-12 rounded-2xl border border-border bg-background px-4 outline-none focus:ring-4 focus:ring-ring/15"
          />
          <button
            type="submit"
            disabled={busy || code.trim().length < 6}
            className="h-12 px-5 rounded-full gradient-primary text-primary-foreground font-semibold shadow-glow disabled:opacity-60 inline-flex items-center gap-2"
          >
            {busy ? <Loader2 className="size-4 animate-spin" /> : "Find"}
          </button>
        </form>
      </div>

      {scanning && (
        <BarcodeCamera
          onClose={() => setScanning(false)}
          onDetected={(c) => {
            setScanning(false);
            setCode(c);
            void fetchCode(c);
          }}
        />
      )}

      {item && (
        <ReviewCard
          initial={item}
          onSave={(food, meal) => {
            addEntry({ id: crypto.randomUUID(), date: todayStr(), meal, food, servings: 1, loggedAt: Date.now() });
            toast.success("Logged");
            setItem(null);
            setCode("");
          }}
        />
      )}
    </div>
  );
}


function ReviewCard({
  initial, onSave, confidence, notes,
}: {
  initial: FoodItem;
  onSave: (f: FoodItem, meal: MealType) => void;
  confidence?: string;
  notes?: string;
}) {
  const [f, setF] = useState<FoodItem>(initial);
  const [meal, setMeal] = useState<MealType>(() => {
    const h = new Date().getHours();
    if (h < 11) return "breakfast";
    if (h < 15) return "lunch";
    if (h < 21) return "dinner";
    return "snack";
  });

  useEffect(() => setF(initial), [initial]);

  return (
    <div className="mt-4 rounded-3xl bg-card border border-border p-4 shadow-elevated animate-slide-up">
      <h3 className="text-sm font-semibold">Review & save</h3>
      {confidence && <p className="text-xs text-muted-foreground mt-0.5">Confidence: {confidence}{notes ? ` · ${notes}` : ""}</p>}

      {(f.image_url || f.brand || f.quantity) && (
        <div className="mt-3 flex gap-3 rounded-2xl bg-muted/50 p-3">
          {f.image_url ? (
            <img
              src={f.image_url}
              alt={f.name}
              className="size-20 rounded-xl object-cover bg-background"
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
            />
          ) : null}
          <div className="min-w-0 flex-1">
            {f.brand && <p className="text-xs font-medium text-foreground truncate">{f.brand}</p>}
            {f.quantity && <p className="text-[11px] text-muted-foreground">{f.quantity}</p>}
            <div className="mt-1 flex flex-wrap gap-1">
              {f.nutriscore && <Badge label={`Nutri-Score ${f.nutriscore.toUpperCase()}`} tone={scoreTone(f.nutriscore)} />}
              {typeof f.nova_group === "number" && <Badge label={`NOVA ${f.nova_group}`} tone={f.nova_group >= 4 ? "bad" : f.nova_group >= 3 ? "warn" : "good"} />}
              {f.ecoscore && <Badge label={`Eco ${f.ecoscore.toUpperCase()}`} tone={scoreTone(f.ecoscore)} />}
            </div>
          </div>
        </div>
      )}

      {f.per100 && (f.per100.calories > 0 || f.per100.protein > 0) && (
        <div className="mt-3 rounded-2xl border border-border p-3">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Per 100 g</p>
          <div className="grid grid-cols-4 gap-2 text-center">
            <Per label="kcal" v={f.per100.calories} />
            <Per label="P" v={f.per100.protein} />
            <Per label="C" v={f.per100.carbs} />
            <Per label="F" v={f.per100.fat} />
          </div>
          {(f.per100.sugars != null || f.per100.fiber != null || f.per100.salt != null || f.per100.saturated_fat != null) && (
            <div className="mt-2 grid grid-cols-2 gap-1 text-[11px] text-muted-foreground">
              {f.per100.saturated_fat != null && <span>Sat. fat: <span className="text-foreground tabular-nums">{f.per100.saturated_fat}g</span></span>}
              {f.per100.sugars != null && <span>Sugars: <span className="text-foreground tabular-nums">{f.per100.sugars}g</span></span>}
              {f.per100.fiber != null && <span>Fiber: <span className="text-foreground tabular-nums">{f.per100.fiber}g</span></span>}
              {f.per100.salt != null && <span>Salt: <span className="text-foreground tabular-nums">{f.per100.salt}g</span></span>}
            </div>
          )}
        </div>
      )}

      {(f.ingredients || f.allergens || f.categories || f.barcode) && (
        <details className="mt-3 rounded-2xl border border-border p-3 group">
          <summary className="text-xs font-medium cursor-pointer list-none flex items-center justify-between">
            More info
            <span className="text-muted-foreground text-[10px] group-open:hidden">show</span>
            <span className="text-muted-foreground text-[10px] hidden group-open:inline">hide</span>
          </summary>
          <div className="mt-2 space-y-2 text-[11px] leading-relaxed">
            {f.allergens && <p><span className="text-muted-foreground">Allergens: </span>{f.allergens}</p>}
            {f.categories && <p className="line-clamp-2"><span className="text-muted-foreground">Category: </span>{f.categories}</p>}
            {f.ingredients && <p className="line-clamp-6"><span className="text-muted-foreground">Ingredients: </span>{f.ingredients}</p>}
            {f.barcode && <p className="text-muted-foreground tabular-nums">Barcode: {f.barcode}</p>}
          </div>
        </details>
      )}

      <input
        value={f.name}
        onChange={(e) => setF({ ...f, name: e.target.value })}
        className="mt-3 w-full h-11 rounded-xl border border-border bg-background px-3 outline-none focus:ring-4 focus:ring-ring/15"
      />
      <input
        value={f.serving_label}
        onChange={(e) => setF({ ...f, serving_label: e.target.value })}
        className="mt-2 w-full h-11 rounded-xl border border-border bg-background px-3 outline-none focus:ring-4 focus:ring-ring/15"
      />
      <div className="mt-3 grid grid-cols-4 gap-2">
        <NumField label="kcal" v={f.calories} on={(v) => setF({ ...f, calories: v })} />
        <NumField label="P" v={f.protein} on={(v) => setF({ ...f, protein: v })} />
        <NumField label="C" v={f.carbs} on={(v) => setF({ ...f, carbs: v })} />
        <NumField label="F" v={f.fat} on={(v) => setF({ ...f, fat: v })} />
      </div>
      <div className="mt-3 grid grid-cols-4 gap-2">
        {(["breakfast", "lunch", "dinner", "snack"] as MealType[]).map((m) => (
          <button
            key={m}
            onClick={() => setMeal(m)}
            className={`h-9 rounded-full text-xs font-medium capitalize ${meal === m ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
          >
            {m}
          </button>
        ))}
      </div>
      <button onClick={() => onSave(f, meal)} className="mt-4 w-full h-12 rounded-full gradient-primary text-primary-foreground font-semibold shadow-glow">
        Save to log
      </button>
    </div>
  );
}

function NumField({ label, v, on }: { label: string; v: number; on: (v: number) => void }) {
  return (
    <label className="block">
      <span className="block text-[10px] uppercase tracking-wider text-muted-foreground mb-1">{label}</span>
      <input
        type="number"
        value={v}
        onChange={(e) => on(parseFloat(e.target.value) || 0)}
        className="w-full h-10 rounded-lg border border-border bg-background px-2 outline-none text-sm tabular-nums focus:ring-2 focus:ring-ring/15"
      />
    </label>
  );
}

function Per({ label, v }: { label: string; v: number }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="text-sm font-semibold tabular-nums">{v}</div>
    </div>
  );
}

function Badge({ label, tone }: { label: string; tone: "good" | "warn" | "bad" | "neutral" }) {
  const cls =
    tone === "good"
      ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
      : tone === "warn"
        ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
        : tone === "bad"
          ? "bg-rose-500/15 text-rose-400 border-rose-500/30"
          : "bg-muted text-muted-foreground border-border";
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[10px] font-medium ${cls}`}>{label}</span>;
}

function scoreTone(grade: string): "good" | "warn" | "bad" | "neutral" {
  const g = grade.toLowerCase();
  if (g === "a" || g === "b") return "good";
  if (g === "c") return "warn";
  if (g === "d" || g === "e") return "bad";
  return "neutral";
}
