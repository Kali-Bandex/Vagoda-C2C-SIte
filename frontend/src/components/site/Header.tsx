import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { MessageSquare, Bell, Search, Menu, X, ShoppingCart, Infinity as InfinityIcon } from "lucide-react";
import { useState, useEffect } from "react";
import { AccountModal } from "@/components/site/AccountModal";
import { CartDrawer } from "@/components/site/CartDrawer";
import { useStore, subscribeCartOpen, getCartOpen, closeCart, openCart } from "@/lib/store";

const NAV = [
  { label: "HOME", to: "/" },
  { label: "AI MODE", to: "/ai-mode" },
  { label: "MARKETPLACE", to: "/marketplace" },
  { label: "JOB", to: "/jobs" },
  { label: "SERVICE", to: "/services" },
];

export function Logo({ label = false }: { label?: boolean }) {
  return (
    <span className="flex items-center gap-3">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-ink text-ink-foreground shadow-sm transition-transform hover:scale-105">
        <InfinityIcon className="h-6 w-6 stroke-[2.5]" />
      </span>
      {label && <span className="text-2xl font-semibold tracking-tight">vagoda</span>}
    </span>
  );
}

export function Header() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [account, setAccount] = useState(false);
  const [cartOpen, setCartOpen] = useState(getCartOpen);
  const { cartCount } = useStore();

  // Sync with global cart open signal from store
  useEffect(() => subscribeCartOpen(setCartOpen), []);

  const isActive = (to: string) => (to === "/" ? path === "/" : path.startsWith(to));

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-border bg-background">
        <div className="mx-auto grid max-w-[1440px] grid-cols-[auto_1fr_auto] items-center gap-4 px-5 py-3 lg:px-10">
          <div className="flex min-w-0 items-center gap-8">
            <Link to="/" aria-label="Vagoda home">
              <Logo />
            </Link>
            <nav className="hidden items-center gap-6 lg:flex">
              {NAV.map((n) => (
                <Link
                  key={n.to}
                  to={n.to}
                  className={
                    isActive(n.to)
                      ? "relative text-sm font-medium text-foreground after:absolute after:-bottom-2 after:left-1/2 after:h-1 after:w-1 after:-translate-x-1/2 after:rounded-full after:bg-foreground"
                      : "text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                  }
                >
                  {n.label}
                </Link>
              ))}
            </nav>
          </div>

          <form
            className="hidden justify-center md:flex"
            onSubmit={(e) => {
              e.preventDefault();
              navigate({ to: "/marketplace", search: { q } });
            }}
          >
            <div className="flex w-full max-w-[340px] items-center rounded-full border border-border py-1.5 pl-5 pr-1.5">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Global search"
                aria-label="Global search"
                className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
              <button
                type="submit"
                aria-label="Search"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-ink text-ink-foreground"
              >
                <Search className="h-4 w-4" />
              </button>
            </div>
          </form>

          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-1 rounded-full border border-border px-2 py-1.5 sm:flex">
              <Link
                to="/dashboard"
                search={{ tab: "message" }}
                aria-label="Messages"
                className="grid h-8 w-8 place-items-center rounded-full transition-colors hover:bg-muted"
              >
                <MessageSquare className="h-4 w-4" />
              </Link>
              <span className="h-5 w-px bg-border" />
              <Link
                to="/dashboard"
                search={{ tab: "orders" }}
                aria-label="Notifications"
                className="grid h-8 w-8 place-items-center rounded-full transition-colors hover:bg-muted"
              >
                <Bell className="h-4 w-4" />
              </Link>
              <span className="h-5 w-px bg-border" />
              {/* Cart button with badge */}
              <button
                id="header-cart-button"
                aria-label="Shopping cart"
                onClick={openCart}
                className="relative grid h-8 w-8 place-items-center rounded-full transition-colors hover:bg-muted"
              >
                <ShoppingCart className="h-4 w-4" />
                {cartCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[oklch(0.65_0.19_35)] text-[10px] font-semibold text-white">
                    {cartCount > 9 ? "9+" : cartCount}
                  </span>
                )}
              </button>
            </div>

            <button onClick={() => setAccount(true)} aria-label="Your account">
              <img
                src="https://i.pravatar.cc/80?img=12"
                alt="Your profile"
                loading="lazy"
                className="h-10 w-10 shrink-0 rounded-full object-cover ring-2 ring-border"
              />
            </button>

            <button
              className="grid h-10 w-10 place-items-center rounded-full border border-border lg:hidden"
              aria-label="Toggle menu"
              onClick={() => setOpen((o) => !o)}
            >
              {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {open && (
          <nav className="border-t border-border px-5 py-3 lg:hidden">
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                onClick={() => setOpen(false)}
                className="block py-2 text-sm font-medium"
              >
                {n.label}
              </Link>
            ))}
            {/* Mobile cart */}
            <button
              onClick={() => { setOpen(false); openCart(); }}
              className="flex items-center gap-2 py-2 text-sm font-medium"
            >
              <ShoppingCart className="h-4 w-4" />
              Cart {cartCount > 0 && `(${cartCount})`}
            </button>
          </nav>
        )}

        <AccountModal open={account} onClose={() => setAccount(false)} />
      </header>

      <CartDrawer open={cartOpen} onClose={closeCart} />
    </>
  );
}
