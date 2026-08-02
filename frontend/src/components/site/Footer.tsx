import { Link } from "@tanstack/react-router";
import { Logo } from "./Header";

const COLUMNS = [
  {
    title: "Home",
    links: [
      { label: "Marketplace", to: "/marketplace" },
      { label: "Jobs", to: "/jobs" },
      { label: "Services", to: "/services" },
    ],
  },
  {
    title: "Supports",
    links: [
      { label: "Help", to: "/contact" },
      { label: "Faqs", to: "/contact" },
      { label: "Contact", to: "/contact" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Help", to: "/contact" },
      { label: "Faqs", to: "/contact" },
      { label: "Contact", to: "/contact" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-auto bg-ink text-ink-foreground">
      <div className="mx-auto grid max-w-[1440px] gap-12 px-5 py-16 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr] lg:px-14 lg:py-24">
        <div>
          <Logo label />
          <p className="mt-6 max-w-xs text-sm leading-relaxed text-ink-foreground/60">
            Discover our featured services designed to elevate your experience
          </p>
        </div>
        {COLUMNS.map((col) => (
          <div key={col.title}>
            <h3 className="text-lg font-semibold">{col.title}</h3>
            <ul className="mt-5 space-y-4">
              {col.links.map((l, i) => (
                <li key={i}>
                  <Link
                    to={l.to}
                    className="text-sm text-ink-foreground/60 transition-colors hover:text-ink-foreground"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </footer>
  );
}
