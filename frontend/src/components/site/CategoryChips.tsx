import { Flame } from "lucide-react";
import { CATEGORIES } from "@/lib/data";

export function CategoryChips({
  active,
  onChange,
  categories = CATEGORIES,
  className = "",
}: {
  active: string;
  onChange: (c: string) => void;
  categories?: string[];
  className?: string;
}) {
  const list = categories.filter((c) => c !== "All");

  return (
    <div className={`flex flex-wrap gap-2.5 ${className}`}>
      {list.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onChange(active === c ? "" : c)}
          className={
            active === c
              ? "flex items-center gap-2 rounded-full border border-brand bg-brand-soft px-4 py-2 text-sm text-price font-medium"
              : "flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
          }
        >
          <Flame className="h-4 w-4" />
          {c}
        </button>
      ))}
    </div>
  );
}
