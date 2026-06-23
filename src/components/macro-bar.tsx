import { cn } from "@/lib/utils";

interface Props {
  label: string;
  value: number;
  target: number;
  unit?: string;
  color?: "protein" | "carbs" | "fat" | "primary";
}

const colorMap: Record<NonNullable<Props["color"]>, string> = {
  protein: "bg-[var(--color-protein)]",
  carbs: "bg-[var(--color-carbs)]",
  fat: "bg-[var(--color-fat)]",
  primary: "gradient-primary",
};

export function MacroBar({ label, value, target, unit = "g", color = "primary" }: Props) {
  const pct = Math.max(0, Math.min(100, (value / Math.max(1, target)) * 100));
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1.5">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
        <span className="text-xs tabular-nums text-foreground">
          <span className="font-semibold">{Math.round(value)}</span>
          <span className="text-muted-foreground"> / {target}{unit}</span>
        </span>
      </div>
      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-700 ease-out", colorMap[color])}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
