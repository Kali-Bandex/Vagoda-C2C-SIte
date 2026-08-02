import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useState, useEffect, type ReactNode } from "react";
import {
  Bell,
  ChevronDown,
  ChevronRight,
  HelpCircle,
  Home,
  Inbox,
  LogOut,
  MessageSquare,
  PanelLeft,
  Search,
  Store,
  Sun,
  Target,
  Upload,
  UserCircle,
  CheckCheck,
  Package,
  Briefcase,
  Wrench,
  Bookmark,
  CalendarDays,
} from "lucide-react";
import { useAuth, ROLE_META, type Role } from "@/lib/auth";
import { Logo } from "@/components/site/Header";
import { api } from "@/lib/api";

interface Notif {
  _id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  link?: string;
  createdAt: string;
  fromUser?: { name: string; avatar?: string; companyName?: string };
}

export function DashboardShell({ children, role }: { children: ReactNode; role: Role }) {
  const meta = ROLE_META[role] || ROLE_META.product;
  const { session, ready, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (ready && !session) {
      navigate({ to: "/auth" });
    }
  }, [ready, session, navigate]);
  const path = useRouterState({ select: (s) => s.location.pathname });
  const searchObj = useRouterState({ select: (s) => (s.location.search as Record<string, any>) || {} });
  const activeTab = searchObj.tab || "orders";
  const [collapsed, setCollapsed] = useState(false);
  const isBuyer = role === "buyer";
  const [openGroup, setOpenGroup] = useState(
    isBuyer ? path.startsWith("/dashboard") : path.startsWith("/app/listings")
  );

  // Real notifications from DB
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    try {
      const res = await api.get("/notifications");
      setNotifs(res.data.notifications || []);
      setUnreadCount(res.data.unreadCount || 0);
    } catch {
      // fail silently
    }
  };

  const markRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifs((prev) => prev.map((n) => (n._id === id ? { ...n, read: true } : n)));
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {}
  };

  const markAllRead = async () => {
    try {
      await api.patch("/notifications/read-all");
      setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {}
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30_000);
    return () => clearInterval(interval);
  }, []);

  const subItems = isBuyer
    ? [
        { label: "My Orders", to: "/dashboard" },
        { label: "Browse Marketplace", to: "/marketplace" },
      ]
    : [
        { label: "List", to: "/app/listings" },
        { label: "Create", to: "/app/listings/new" },
      ];

  const items = [
    { label: "Overviews", to: "/app/overview", Icon: Home },
    { label: meta.activity, to: isBuyer ? "/dashboard" : "/app/activity", Icon: Inbox },
    { label: "Message", to: "/app/message", Icon: MessageSquare },
    { label: "Profile", to: "/app/profile", Icon: UserCircle },
    ...(isBuyer ? [] : [{ label: "Customers", to: "/app/customers", Icon: Upload }]),
  ];

  return (
    <div className="flex min-h-screen bg-background">
      <div className="hidden w-14 shrink-0 flex-col items-center justify-between border-r border-border py-6 lg:flex">
        <button
          aria-label="Appearance"
          className="grid h-9 w-9 place-items-center rounded-full text-muted-foreground hover:bg-muted"
        >
          <Sun className="h-5 w-5" />
        </button>
        <div className="flex flex-col gap-4">
          <Link
            to="/contact"
            aria-label="Help"
            className="grid h-9 w-9 place-items-center rounded-full border border-border text-muted-foreground"
          >
            <HelpCircle className="h-4 w-4" />
          </Link>
          <Link
            to="/"
            aria-label="Back to site"
            className="grid h-9 w-9 place-items-center rounded-full border border-border text-muted-foreground"
          >
            <Target className="h-4 w-4" />
          </Link>
          <button
            aria-label="Log out"
            onClick={() => {
              signOut();
              navigate({ to: "/" });
            }}
            className="grid h-9 w-9 place-items-center rounded-full border border-border text-muted-foreground"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>

      {!collapsed && (
        <aside className="hidden w-[300px] shrink-0 flex-col border-r border-border px-6 py-6 lg:flex">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3">
              <Logo label />
            </Link>
            <button
              aria-label="Collapse sidebar"
              onClick={() => setCollapsed(true)}
              className="grid h-10 w-10 place-items-center rounded-xl bg-muted text-muted-foreground"
            >
              <PanelLeft className="h-4 w-4" />
            </button>
          </div>

          {/* Profile snippet */}
          {session && (
            <Link to="/app/profile" className="mt-6 flex items-center gap-3 rounded-xl border border-border p-3 hover:bg-muted/50 transition-colors">
              <img
                src={
                  (isSeller(role) && session.companyLogo) ? session.companyLogo :
                  session.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(session.name)}&background=random`
                }
                alt={session.name}
                className="h-10 w-10 rounded-full object-cover"
              />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">
                  {isSeller(role) && session.companyName ? session.companyName : session.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {isBuyer ? "Buyer Account" : meta.dashboard}
                </p>
              </div>
            </Link>
          )}

          <p className="mt-9 text-lg font-medium">Menu</p>

          <nav className="mt-4 space-y-1">
            {isBuyer ? (
              <>
                <SideLink
                  to="/app/overview"
                  label="Overviews"
                  Icon={Home}
                  active={path === "/app/overview"}
                />
                <SideLink
                  to="/dashboard?tab=orders"
                  label="My Orders"
                  Icon={Package}
                  active={path === "/dashboard" && (activeTab === "orders" || !activeTab)}
                />
                <SideLink
                  to="/dashboard?tab=saved"
                  label="Saved Items"
                  Icon={Bookmark}
                  active={path === "/dashboard" && activeTab === "saved"}
                />
                <SideLink
                  to="/dashboard?tab=applications"
                  label="Applications"
                  Icon={Briefcase}
                  active={path === "/dashboard" && activeTab === "applications"}
                />
                <SideLink
                  to="/dashboard?tab=bookings"
                  label="Bookings"
                  Icon={CalendarDays}
                  active={path === "/dashboard" && activeTab === "bookings"}
                />
                <SideLink
                  to="/app/message"
                  label="Message"
                  Icon={MessageSquare}
                  active={path === "/app/message"}
                />
                <SideLink
                  to="/app/profile"
                  label="Profile"
                  Icon={UserCircle}
                  active={path === "/app/profile"}
                />
              </>
            ) : (
              <>
                <SideLink
                  to="/app/overview"
                  label="Overviews"
                  Icon={Home}
                  active={path === "/app/overview"}
                />

                <button
                  onClick={() => setOpenGroup((o) => !o)}
                  className={
                    path.startsWith("/app/listings")
                      ? "flex w-full items-center gap-2 rounded-full bg-brand-soft px-4 py-3 text-sm font-medium text-price"
                      : "flex w-full items-center gap-2 rounded-full px-4 py-3 text-sm text-muted-foreground hover:bg-muted"
                  }
                >
                  <ChevronRight
                    className={`h-4 w-4 transition-transform ${openGroup ? "rotate-90" : ""}`}
                  />
                  <Store className="h-4 w-4" />
                  {meta.listings}
                </button>
                {openGroup && (
                  <div className="ml-8 border-l border-border pl-4">
                    {subItems.map((s) => (
                      <Link
                        key={s.to}
                        to={s.to}
                        className={
                          path === s.to
                            ? "flex items-center gap-2 py-2 text-sm font-medium text-price"
                            : "flex items-center gap-2 py-2 text-sm text-muted-foreground hover:text-foreground"
                        }
                      >
                        {path === s.to && <span className="h-1.5 w-1.5 rounded-full bg-brand" />}
                        {s.label}
                      </Link>
                    ))}
                  </div>
                )}

                {items.slice(1).map((i) => (
                  <SideLink key={i.to} {...i} active={path === i.to} />
                ))}
              </>
            )}
          </nav>

          {/* ── Real Notifications ── */}
          <div className="mt-auto pt-10">
            <div className="flex items-center justify-between mb-1">
              <p className="flex items-center gap-2 text-xs font-medium tracking-wide text-muted-foreground">
                NOTIFICATIONS
                {unreadCount > 0 && (
                  <span className="rounded-full bg-[oklch(0.65_0.19_35)] px-2 py-0.5 text-[11px] text-ink-foreground">
                    {unreadCount}
                  </span>
                )}
              </p>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  title="Mark all as read"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <div className="mt-3 space-y-2 max-h-[260px] overflow-y-auto pr-1">
              {notifs.length === 0 ? (
                <p className="text-xs text-muted-foreground py-4 text-center">No notifications yet</p>
              ) : (
                notifs.slice(0, 6).map((n) => {
                  const avatar = n.fromUser?.avatar ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(n.fromUser?.name || "User")}&background=random`;
                  const displayName = n.fromUser?.companyName || n.fromUser?.name || "Vagoda";
                  return (
                    <button
                      key={n._id}
                      onClick={() => {
                        if (!n.read) markRead(n._id);
                        if (n.link) navigate({ to: n.link as any });
                      }}
                      className="relative flex w-full gap-3 rounded-xl bg-muted/60 p-3 text-left transition-colors hover:bg-muted"
                    >
                      <div className="relative">
                        <img
                          src={avatar}
                          alt={displayName}
                          className="h-9 w-9 rounded-full object-cover"
                        />
                        {n.type === "order_status" || n.type === "order_placed" ? (
                          <span className="absolute -bottom-1 -right-1 grid h-4 w-4 place-items-center rounded-full bg-brand">
                            <Package className="h-2.5 w-2.5 text-brand-foreground" />
                          </span>
                        ) : n.type === "application_received" || n.type === "application_status_changed" || n.type === "application_submitted" ? (
                          <span className="absolute -bottom-1 -right-1 grid h-4 w-4 place-items-center rounded-full bg-[oklch(0.55_0.18_285)]">
                            <Briefcase className="h-2.5 w-2.5 text-white" />
                          </span>
                        ) : n.type === "booking_received" || n.type === "booking_status_changed" || n.type === "booking_submitted" ? (
                          <span className="absolute -bottom-1 -right-1 grid h-4 w-4 place-items-center rounded-full bg-emerald-600">
                            <Wrench className="h-2.5 w-2.5 text-white" />
                          </span>
                        ) : null}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold truncate">{n.title}</p>
                        <p className="line-clamp-2 text-xs text-muted-foreground">{n.body}</p>
                      </div>
                      <span
                        className={`absolute right-3 top-3 h-2 w-2 rounded-full shrink-0 ${
                          !n.read ? "bg-[oklch(0.65_0.19_35)]" : "bg-transparent"
                        }`}
                      />
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </aside>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-4 border-b border-border px-5 py-4 lg:px-8">
          {collapsed && (
            <button
              aria-label="Expand sidebar"
              onClick={() => setCollapsed(false)}
              className="hidden h-10 w-10 place-items-center rounded-xl bg-muted text-muted-foreground lg:grid"
            >
              <PanelLeft className="h-4 w-4" />
            </button>
          )}
          <div className="lg:hidden">
            <Link to="/">
              <Logo />
            </Link>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              navigate({ to: "/app/listings" });
            }}
            className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl border border-border px-4 py-2.5 sm:max-w-[540px]"
          >
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              aria-label="Global search"
              placeholder="Global Search"
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            <span className="hidden shrink-0 rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground sm:block">
              ⌘ F
            </span>
          </form>

          <div className="ml-auto flex items-center gap-3">
            <div className="hidden items-center gap-1 rounded-full border border-border px-2 py-1.5 sm:flex">
              <Link
                to="/app/message"
                aria-label="Messages"
                className="grid h-8 w-8 place-items-center rounded-full hover:bg-muted"
              >
                <MessageSquare className="h-4 w-4" />
              </Link>
              <span className="h-5 w-px bg-border" />
              {/* Bell with real unread badge */}
              <button
                onClick={fetchNotifications}
                aria-label="Notifications"
                className="relative grid h-8 w-8 place-items-center rounded-full hover:bg-muted"
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[oklch(0.65_0.19_35)] text-[9px] font-bold text-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>
            </div>
            <Link to="/app/profile" aria-label="Your profile">
              <img
                src={
                  (isSeller(role) && session?.companyLogo) ? session.companyLogo :
                  session?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(session?.name || "U")}&background=random`
                }
                alt="Your profile"
                className="h-10 w-10 rounded-full object-cover ring-2 ring-border"
              />
            </Link>
          </div>
        </header>

        <div className="min-w-0 flex-1 px-5 py-8 lg:px-10">{children}</div>

        <nav className="flex items-center justify-around border-t border-border py-2 lg:hidden">
          <SideLink
            to="/app/overview"
            label="Home"
            Icon={Home}
            active={path === "/app/overview"}
            compact
          />
          <SideLink
            to={isBuyer ? "/dashboard?tab=orders" : "/app/listings"}
            label={isBuyer ? "Orders" : meta.listings}
            Icon={isBuyer ? Package : Store}
            active={isBuyer ? path === "/dashboard" : path.startsWith("/app/listings")}
            compact
          />
          <SideLink
            to={isBuyer ? "/dashboard?tab=saved" : "/app/activity"}
            label={isBuyer ? "Saved" : meta.activity}
            Icon={isBuyer ? Bookmark : Inbox}
            active={isBuyer ? path === "/dashboard" && activeTab === "saved" : path === "/app/activity"}
            compact
          />
          <SideLink
            to="/app/message"
            label="Message"
            Icon={MessageSquare}
            active={path === "/app/message"}
            compact
          />
          <SideLink
            to="/app/profile"
            label="Profile"
            Icon={UserCircle}
            active={path === "/app/profile"}
            compact
          />
        </nav>
      </div>
    </div>
  );
}

function isSeller(role: string) {
  return role !== "buyer";
}

function SideLink({
  to,
  label,
  Icon,
  active,
  compact = false,
}: {
  to: string;
  label: string;
  Icon: typeof Home;
  active: boolean;
  compact?: boolean;
}) {
  if (compact) {
    return (
      <Link
        to={to}
        className={`flex flex-col items-center gap-1 px-2 py-1 text-[11px] ${
          active ? "text-price" : "text-muted-foreground"
        }`}
      >
        <Icon className="h-4 w-4" /> {label}
      </Link>
    );
  }
  return (
    <Link
      to={to}
      className={
        active
          ? "flex items-center gap-3 rounded-full bg-brand-soft px-4 py-3 text-sm font-medium text-price"
          : "flex items-center gap-3 rounded-full px-4 py-3 text-sm text-muted-foreground transition-colors hover:bg-muted"
      }
    >
      <Icon className="h-4 w-4" /> {label}
    </Link>
  );
}

export function DashHeading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div>
      <h1 className="text-4xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-1 text-muted-foreground">{subtitle}</p>
    </div>
  );
}

export { ChevronDown };
