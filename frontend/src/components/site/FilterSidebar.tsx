import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { SlidersHorizontal, ChevronUp, ChevronDown } from "lucide-react";

export type Filters = {
  topRated: boolean;
  sameDay: boolean;
  cod: boolean;
  discount: boolean;
  locations: string[];
  price: [number, number];
};

export const DEFAULT_FILTERS: Filters = {
  topRated: false,
  sameDay: false,
  cod: false,
  discount: false,
  locations: [],
  price: [0, 10000],
};

const LOCATIONS = ["Accra", "Cape Coast", "Kumasi", "Tamale", "Takoradi", "Ho"];

export function FilterSidebar({
  value,
  onApply,
  onReset,
  categories,
  selectedCategory = "",
  onCategoryChange,
  mode = "products",
}: {
  value: Filters;
  onApply: (f: Filters) => void;
  onReset: () => void;
  categories?: string[];
  selectedCategory?: string;
  onCategoryChange?: (category: string) => void;
  mode?: "products" | "jobs" | "services";
}) {
  const [draft, setDraft] = useState<Filters>(value);
  const [openBest, setOpenBest] = useState(true);
  const [openLoc, setOpenLoc] = useState(true);
  const [showAllLoc, setShowAllLoc] = useState(false);

  const set = <K extends keyof Filters>(k: K, v: Filters[K]) => setDraft({ ...draft, [k]: v });

  // Custom "Best Filter" labels per mode
  const checks: { key: keyof Filters; label: string; star?: boolean }[] =
    mode === "jobs"
      ? [
          { key: "sameDay", label: "Remote work" },
          { key: "topRated", label: "Full-time roles" },
          { key: "cod", label: "High salary (₵5,000+)" },
          { key: "discount", label: "Verified recruiter" },
        ]
      : mode === "services"
      ? [
          { key: "topRated", label: "4 stars or upper", star: true },
          { key: "sameDay", label: "Same-day service" },
          { key: "cod", label: "Instant booking" },
          { key: "discount", label: "Special offer" },
        ]
      : [
          { key: "topRated", label: "4 stars or upper", star: true },
          { key: "sameDay", label: "Same-day delivery" },
          { key: "cod", label: "Cash on Delivery" },
          { key: "discount", label: "Discount" },
        ];

  const categoryList = (
    categories || ["Electronic", "Fashion", "Vehicle", "Home", "Gaming", "Furniture"]
  ).filter((c) => c !== "All");

  const priceTitle = mode === "jobs" ? "Salary Range" : mode === "services" ? "Fee Range" : "Price Range";

  return (
    <aside className="w-full border-border lg:w-[220px] lg:shrink-0 lg:border-r lg:pr-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Filter Options</h2>
        <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
      </div>

      {/* Interactive Category Selector */}
      <div className="mt-4">
        <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
          Category
        </label>
        <div className="relative">
          <select
            value={selectedCategory || "All"}
            onChange={(e) => {
              const val = e.target.value === "All" ? "" : e.target.value;
              if (onCategoryChange) onCategoryChange(val);
            }}
            className="w-full appearance-none rounded-md border border-border bg-muted/60 px-3 py-2.5 pr-8 text-xs font-medium text-foreground outline-none transition-colors hover:border-foreground/30 focus:border-brand"
          >
            <option value="All">All Categories</option>
            {categoryList.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        </div>
      </div>

      <Section title="Best Filter" open={openBest} toggle={() => setOpenBest(!openBest)}>
        {checks.map((c) => (
          <label key={c.key} className="flex cursor-pointer items-center gap-2.5 py-1.5 text-xs">
            <Checkbox
              checked={draft[c.key] as boolean}
              onCheckedChange={(v) => set(c.key, Boolean(v) as never)}
              className="data-[state=checked]:border-brand data-[state=checked]:bg-brand"
            />
            <span className="text-muted-foreground">
              {c.star && <span className="mr-1 text-star">★</span>}
              {c.label}
            </span>
          </label>
        ))}
      </Section>

      <Section title="Location" open={openLoc} toggle={() => setOpenLoc(!openLoc)}>
        {(showAllLoc ? LOCATIONS : LOCATIONS.slice(0, 4)).map((loc) => (
          <label key={loc} className="flex cursor-pointer items-center gap-2.5 py-1.5 text-xs">
            <Checkbox
              checked={draft.locations.includes(loc)}
              onCheckedChange={(v) =>
                set(
                  "locations",
                  v ? [...draft.locations, loc] : draft.locations.filter((l) => l !== loc),
                )
              }
              className="data-[state=checked]:border-brand data-[state=checked]:bg-brand"
            />
            <span className="text-muted-foreground">{loc}</span>
          </label>
        ))}
        <button
          type="button"
          onClick={() => setShowAllLoc((s) => !s)}
          className="mt-1 text-xs font-medium text-price"
        >
          {showAllLoc ? "Show Less Location" : "Show More Location"}
        </button>
      </Section>

      <div className="mt-6">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium">{priceTitle}</span>
          <button
            type="button"
            onClick={() => {
              setDraft(DEFAULT_FILTERS);
              onReset();
            }}
            className="text-muted-foreground hover:underline"
          >
            Resets
          </button>
        </div>
        <div className="mt-4 flex items-center justify-between text-[11px]">
          <span className="rounded-full bg-ink px-2.5 py-1 text-ink-foreground font-medium">
            ₵{draft.price[0]}
          </span>
          <span className="rounded-full bg-ink px-2.5 py-1 text-ink-foreground font-medium">
            ₵{draft.price[1]}
          </span>
        </div>
        <Slider
          className="mt-3"
          min={0}
          max={10000}
          step={10}
          value={draft.price}
          onValueChange={(v) => set("price", [v[0], v[1]])}
        />
      </div>

      <button
        type="button"
        onClick={() => onApply(draft)}
        className="mt-6 w-full rounded-md bg-ink py-3 text-sm font-medium text-ink-foreground transition-opacity hover:opacity-90 shadow-sm"
      >
        Apply Filters
      </button>
      <button
        type="button"
        onClick={() => {
          setDraft(DEFAULT_FILTERS);
          onReset();
        }}
        className="mt-3 w-full text-center text-xs text-muted-foreground hover:underline"
      >
        Reset All Filters
      </button>
    </aside>
  );
}

function Section({
  title,
  open,
  toggle,
  children,
}: {
  title: string;
  open: boolean;
  toggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-6">
      <button type="button" onClick={toggle} className="flex w-full items-center justify-between">
        <span className="text-xs font-semibold">{title}</span>
        {open ? (
          <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        )}
      </button>
      {open && <div className="mt-3">{children}</div>}
    </div>
  );
}
