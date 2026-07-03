import { cn } from "@/lib/utils";
import type { HTMLAttributes, ReactNode } from "react";

interface HeaderProps {
  title?: ReactNode;
  trailing?: ReactNode;
  back?: () => void;
  children?: ReactNode;
}

export function MobileShell({ children, className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-md min-h-[100svh] pb-32 px-4 stagger-in",
        "pt-[max(env(safe-area-inset-top),1rem)]",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

export function PageHeader({ title, trailing, back, children }: HeaderProps) {
  return (
    <header className="mb-4 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
      {back ? (
        <button
          onClick={back}
          aria-label="Back"
          className="grid h-10 w-10 place-items-center rounded-full bg-card border border-border text-foreground hover:bg-accent transition-colors"
        >
          ←
        </button>
      ) : (
        <div className="h-10 w-10" />
      )}
      <div className="min-w-0 text-center">
        {typeof title === "string" ? (
          <h1 className="truncate text-lg font-semibold tracking-tight">{title}</h1>
        ) : (
          title
        )}
        {children}
      </div>
      <div className="h-10 min-w-10 flex items-center justify-end">{trailing}</div>
    </header>
  );
}
