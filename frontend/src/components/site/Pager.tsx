import { ArrowLeft, ArrowRight } from "lucide-react";

export function Pager({
  page,
  pages,
  onChange,
}: {
  page: number;
  pages: number;
  onChange: (p: number) => void;
}) {
  if (pages < 1) return null;
  const items = Array.from({ length: pages }).map((_, i) => i + 1);

  return (
    <nav className="mt-10 flex items-center justify-center gap-2" aria-label="Pagination">
      <button
        onClick={() => onChange(Math.max(1, page - 1))}
        disabled={page === 1}
        aria-label="Previous page"
        className="grid h-9 w-9 place-items-center rounded-md text-price disabled:opacity-30"
      >
        <ArrowLeft className="h-4 w-4" />
      </button>
      {items.map((n) => (
        <button
          key={n}
          onClick={() => onChange(n)}
          aria-current={n === page ? "page" : undefined}
          className={
            n === page
              ? "h-9 w-9 rounded-md bg-brand text-sm font-medium text-brand-foreground"
              : "h-9 w-9 rounded-md text-sm text-muted-foreground transition-colors hover:bg-muted"
          }
        >
          {String(n).padStart(2, "0")}
        </button>
      ))}
      <button
        onClick={() => onChange(Math.min(pages, page + 1))}
        disabled={page === pages}
        aria-label="Next page"
        className="grid h-9 w-9 place-items-center rounded-md bg-brand-soft text-price disabled:opacity-30"
      >
        <ArrowRight className="h-4 w-4" />
      </button>
    </nav>
  );
}
