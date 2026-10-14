import { useEffect, useState, type ReactNode } from "react";
import {
  LayoutDashboard,
  Users,
  Contact,
  FileText,
  BriefcaseBusiness,
  HardHat,
  Layers,
  Receipt,
  Wallet,
  Banknote,
  Landmark,
  Megaphone,
  ChartNoAxesCombined,
  UserRoundCog,
  Files,
  Settings,
  History,
  Search,
  Plus,
  Bell,
  Menu,
  ChevronDown,
  PanelLeftClose,
  PanelLeftOpen,
  X,
  ArrowUpRight,
  Command,
  ShieldCheck,
  Check,
} from "lucide-react";
import { useApp } from "../store";
import { permissions, type Page, type Role } from "../domain";
import { Btn, Avatar } from "./ui";
export const navGroups = [
  { label: "WORKSPACE", items: [["Dashboard", LayoutDashboard]] },
  {
    label: "SALES & RELATIONSHIPS",
    items: [
      ["Leads", Contact],
      ["Customers", Users],
      ["Quotations", FileText],
    ],
  },
  {
    label: "OPERATIONS",
    items: [
      ["Jobs & Projects", BriefcaseBusiness],
      ["Contractors", HardHat],
      ["Services & Rates", Layers],
    ],
  },
  {
    label: "FINANCE",
    items: [
      ["Invoices & Receipts", Receipt],
      ["Expenses", Wallet],
      ["Contractor Payables", Banknote],
      ["Cash & Accounts", Landmark],
    ],
  },
  {
    label: "INTELLIGENCE",
    items: [
      ["Marketing", Megaphone],
      ["Reports & Analytics", ChartNoAxesCombined],
    ],
  },
  {
    label: "ADMINISTRATION",
    items: [
      ["Team & Permissions", UserRoundCog],
      ["Document Templates", Files],
      ["Settings", Settings],
      ["Audit History", History],
    ],
  },
] as const;
export default function Shell({ children }: { children: ReactNode }) {
  const { state: s, page, recordId, go, openCreate, setRole, toast } = useApp();
  const [collapsed, setCollapsed] = useState(() => {
      try {
        return localStorage.getItem("dm-sidebar-collapsed") === "true";
      } catch {
        return false;
      }
    }),
    [mobile, setMobile] = useState(false),
    [command, setCommand] = useState(false),
    [quick, setQuick] = useState(false),
    [notifications, setNotifications] = useState(false),
    [user, setUser] = useState(false),
    [read, setRead] = useState(false);
  const allowed = permissions[s.role];
  useEffect(() => {
    try {
      localStorage.setItem("dm-sidebar-collapsed", String(collapsed));
    } catch {}
  }, [collapsed]);
  useEffect(() => {
    if (!mobile) return;
    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = old;
    };
  }, [mobile]);
  useEffect(() => {
    if (!quick && !notifications && !user) return;
    const close = (e: PointerEvent) => {
      const target = e.target as Element;
      if (
        target.closest(
          ".popover,.popover-anchor,.sidebar-user,.top-avatar,.demo-banner",
        )
      )
        return;
      setQuick(false);
      setNotifications(false);
      setUser(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [quick, notifications, user]);

  useEffect(() => {
    const cb = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCommand((c) => !c);
      }
      if (e.key === "Escape") {
        setCommand(false);
        setQuick(false);
        setNotifications(false);
        setUser(false);
        setMobile(false);
      }
    };
    document.addEventListener("keydown", cb);
    return () => document.removeEventListener("keydown", cb);
  }, []);
  return (
    <div className={`app ${collapsed ? "collapsed" : ""}`}>
      <a
        href="#main-content"
        className="skip-link"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById("main-content")?.focus();
        }}
      >
        Skip to content
      </a>
      {mobile && (
        <div className="mobile-backdrop" onClick={() => setMobile(false)} />
      )}
      <aside
        id="app-sidebar"
        aria-label="Workspace navigation"
        className={`sidebar ${mobile ? "mobile-open" : ""}`}
      >
        <div className="brand">
          <img src="/assets/mark.svg" alt="" />
          <div>
            <strong>
              doctor<span>maintenance</span>
            </strong>
            <small>BUSINESS WORKSPACE</small>
          </div>
          <button
            className="mobile-only icon-btn"
            aria-label="Close navigation"
            onClick={() => setMobile(false)}
          >
            <X size={19} />
          </button>
        </div>
        <div className="workspace-switch">
          <span className="workspace-mark">DM</span>
          <div>
            <strong>Doctor Maintenance</strong>
            <small>Karachi · Internal workspace</small>
          </div>
          <ShieldCheck size={15} />
        </div>
        <nav aria-label="Primary navigation">
          {navGroups.map((group) => {
            const items = group.items.filter(([p]) => allowed.includes(p));
            return items.length ? (
              <div className="nav-group" key={group.label}>
                <div className="nav-label">{group.label}</div>
                {items.map(([p, Icon]) => (
                  <button
                    key={p}
                    className={`nav-item ${page === p ? "active" : ""}`}
                    title={p}
                    aria-label={p}
                    aria-current={page === p ? "page" : undefined}
                    onClick={() => {
                      go(p);
                      setMobile(false);
                    }}
                  >
                    <Icon size={17} />
                    <span>{p}</span>
                    {p === "Leads" && (
                      <small>
                        {
                          s.leads.filter(
                            (l) => !["Won", "Lost"].includes(l.stage),
                          ).length
                        }
                      </small>
                    )}
                  </button>
                ))}
              </div>
            ) : null;
          })}
        </nav>
        <div className="sidebar-bottom">
          <div className="demo-marker">
            <span /> DEMONSTRATION MODE
          </div>
          <button className="sidebar-user" onClick={() => setUser(!user)}>
            <Avatar name={s.role === "Owner" ? "Workspace Owner" : s.role} />
            <div>
              <strong>{s.role === "Owner" ? "Workspace Owner" : s.role}</strong>
              <small>{s.role} · Demo role</small>
            </div>
            <ChevronDown size={14} />
          </button>
          <button
            className="collapse-btn"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-expanded={!collapsed}
            aria-controls="app-sidebar"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            onClick={() => setCollapsed((c) => !c)}
          >
            {collapsed ? (
              <PanelLeftOpen size={16} />
            ) : (
              <>
                <PanelLeftClose size={16} />
                <span>Collapse sidebar</span>
              </>
            )}
          </button>
        </div>
      </aside>
      <div className="app-body">
        <header className="topbar">
          <div className="breadcrumbs">
            <button
              className="icon-btn sidebar-toggle"
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              aria-expanded={!collapsed}
              aria-controls="app-sidebar"
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              onClick={() => setCollapsed((c) => !c)}
            >
              {collapsed ? (
                <PanelLeftOpen size={19} />
              ) : (
                <PanelLeftClose size={19} />
              )}
            </button>
            <button
              className="icon-btn mobile-only"
              aria-label="Open navigation"
              onClick={() => setMobile(true)}
            >
              <Menu size={21} />
            </button>
            <span className="breadcrumb-workspace">
              Workspace <span>/</span>
            </span>
            <strong>{page}</strong>
            {recordId && (
              <>
                <span>/</span>
                <small>{recordId}</small>
              </>
            )}
          </div>
          <div className="top-actions">
            <button
              className="command-trigger"
              onClick={() => setCommand(true)}
            >
              <Search size={16} />
              <span>Search anything…</span>
              <kbd>⌘ K</kbd>
            </button>
            <div className="popover-anchor">
              <button
                className="quick-btn"
                onClick={() => {
                  setQuick(!quick);
                  setNotifications(false);
                  setUser(false);
                }}
                aria-expanded={quick}
              >
                <Plus size={17} />
                <span>Create</span>
                <ChevronDown size={12} />
              </button>
              {quick && (
                <div className="popover quick-menu">
                  <div className="eyebrow">QUICK CREATE</div>
                  {[
                    ["lead", "Lead", "Leads"],
                    ["customer", "Customer", "Customers"],
                    ["quotation", "Quotation", "Quotations"],
                    ["job", "Job", "Jobs & Projects"],
                    ["expense", "Expense", "Expenses"],
                    ["invoice", "Invoice", "Invoices & Receipts"],
                  ]
                    .filter(([, , p]) => allowed.includes(p as Page))
                    .map(([k, label]) => (
                      <button
                        key={k}
                        onClick={() => {
                          setQuick(false);
                          openCreate(k);
                        }}
                      >
                        <Plus size={15} />
                        New {label.toLowerCase()}
                        <ArrowUpRight size={13} />
                      </button>
                    ))}
                </div>
              )}
            </div>
            <div className="popover-anchor">
              <button
                className="icon-btn notification-btn"
                aria-label="Notifications"
                onClick={() => {
                  setNotifications(!notifications);
                  setUser(false);
                  setQuick(false);
                }}
              >
                <Bell size={19} />
                {!read && <i />}
              </button>
              {notifications && (
                <div className="popover notification-menu">
                  <div className="panel-heading">
                    <h3>Notifications</h3>
                    <button
                      className="text-btn"
                      onClick={() => {
                        setRead(true);
                        toast("Notifications marked as read");
                      }}
                    >
                      Mark read
                    </button>
                  </div>
                  {[
                    {
                      title: "Follow-ups waiting",
                      body: `${s.leads.filter((l) => l.followUp && l.followUp <= "2026-10-14" && !["Won", "Lost"].includes(l.stage)).length} customer conversations are due.`,
                      preference: "Follow-ups due",
                      p: "Leads" as Page,
                    },
                    {
                      title: "Cost review recommended",
                      body: "Review current job costs against approved budgets.",
                      preference: "Job budget overruns",
                      p: "Jobs & Projects" as Page,
                    },
                    {
                      title: "Monthly review ready",
                      body: "Compare earned revenue with cash movement.",
                      preference: "Monthly financial review",
                      p: "Cash & Accounts" as Page,
                    },
                  ]
                    .filter(
                      (n) =>
                        allowed.includes(n.p) &&
                        (s.settings.notifications?.[n.preference] ?? true),
                    )
                    .map((n) => (
                      <button
                        key={n.title}
                        onClick={() => {
                          go(n.p);
                          setNotifications(false);
                        }}
                      >
                        <span className="notification-dot" />
                        <div>
                          <strong>{n.title}</strong>
                          <small>{n.body}</small>
                        </div>
                      </button>
                    ))}
                </div>
              )}
            </div>
            <button
              className="top-avatar"
              aria-label="User and role menu"
              onClick={() => {
                setUser(!user);
                setNotifications(false);
                setQuick(false);
              }}
            >
              <Avatar name="Workspace Owner" />
            </button>
          </div>
        </header>
        <div className="demo-banner">
          <span>
            <span className="demo-dot" />
            Demo workspace{" "}
            <span className="banner-detail">
              • All figures and records are illustrative. Changes stay in this
              browser.
            </span>
          </span>
          <button onClick={() => setUser(!user)}>
            Preview role: {s.role}
            <ChevronDown size={12} />
          </button>
        </div>
        <main id="main-content" tabIndex={-1}>
          {allowed.includes(page) ? (
            children
          ) : (
            <div className="restricted">
              <ShieldCheck size={36} />
              <h1>Access is restricted</h1>
              <p>
                This screen is not available to the simulated {s.role} role.
              </p>
              <Btn primary onClick={() => go("Dashboard")}>
                Return to dashboard
              </Btn>
            </div>
          )}
        </main>
        <footer className="app-footer">
          <span>
            Doctor Maintenance <span>— The Art of Maintenance & Care</span>
          </span>
          <span>Frontend preview · v1.0</span>
        </footer>
      </div>
      {user && (
        <div className="role-menu popover">
          <div className="eyebrow">SIMULATED ACCESS</div>
          <h3>Explore a different role</h3>
          <p>Frontend permissions preview. No live authentication.</p>
          {(
            [
              "Owner",
              "Finance Manager",
              "Operations Manager",
              "Sales Staff",
            ] as Role[]
          ).map((r) => (
            <button
              className={s.role === r ? "selected" : ""}
              key={r}
              onClick={() => {
                setRole(r);
                setUser(false);
              }}
            >
              <ShieldCheck size={16} />
              {r}
              {s.role === r && <Check size={15} />}
            </button>
          ))}
        </div>
      )}
      {command && <CommandPalette close={() => setCommand(false)} />}
    </div>
  );
}
function CommandPalette({ close }: { close: () => void }) {
  const { state: s, go } = useApp();
  const [query, setQuery] = useState(""),
    [selected, setSelected] = useState(0);
  const allowed = permissions[s.role];

  const destinations = allowed.map((p) => ({
    title: p,
    meta: "Navigate",
    page: p,
    id: "",
  }));
  const records = [
    ...s.customers.map((r) => ({
      title: r.name,
      meta: "Customer",
      page: "Customers" as Page,
      id: r.id,
    })),
    ...s.leads.map((r) => ({
      title: `${s.customers.find((c) => c.id === r.customerId)?.name} • ${r.requirements}`,
      meta: r.id,
      page: "Leads" as Page,
      id: r.id,
    })),
    ...s.quotes.map((r) => ({
      title: r.title,
      meta: r.id,
      page: "Quotations" as Page,
      id: r.id,
    })),
    ...s.jobs.map((r) => ({
      title: r.title,
      meta: r.id,
      page: "Jobs & Projects" as Page,
      id: r.id,
    })),
    ...s.contractors.map((r) => ({
      title: r.name,
      meta: r.id,
      page: "Contractors" as Page,
      id: r.id,
    })),
    ...s.invoices.map((r) => ({
      title: `Invoice • ${s.customers.find((c) => c.id === r.customerId)?.name}`,
      meta: r.id,
      page: "Invoices & Receipts" as Page,
      id: r.id,
    })),
  ].filter((r) => allowed.includes(r.page));
  const results = (
    query
      ? [...destinations, ...records].filter((r) =>
          (r.title + " " + r.meta).toLowerCase().includes(query.toLowerCase()),
        )
      : destinations
  ).slice(0, 10);
  useEffect(() => setSelected(0), [query]);
  return (
    <div className="overlay command-overlay" onClick={close}>
      <section
        className="command-palette"
        role="dialog"
        aria-modal="true"
        aria-label="Global search"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === "Escape") close();
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setSelected((n) => Math.min(n + 1, results.length - 1));
          }
          if (e.key === "ArrowUp") {
            e.preventDefault();
            setSelected((n) => Math.max(0, n - 1));
          }
          if (e.key === "Enter" && results[selected]) {
            go(results[selected].page, results[selected].id);
            close();
          }
        }}
      >
        <label className="command-input">
          <Search size={21} />
          <input
            autoFocus
            placeholder="Search customers, jobs, documents…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button onClick={close} aria-label="Close search">
            <kbd>esc</kbd>
          </button>
        </label>
        <div className="command-results">
          <div className="eyebrow">{query ? "SEARCH RESULTS" : "JUMP TO"}</div>
          {results.length ? (
            results.map((r, i) => (
              <button
                className={selected === i ? "selected" : ""}
                key={r.meta + r.title}
                onClick={() => {
                  go(r.page, r.id);
                  close();
                }}
              >
                <span className="command-icon">
                  {r.meta === "Navigate" ? (
                    <Command size={16} />
                  ) : (
                    <Search size={16} />
                  )}
                </span>
                <span>
                  <strong>{r.title}</strong>
                  <small>{r.meta}</small>
                </span>
                <ArrowUpRight size={15} />
              </button>
            ))
          ) : (
            <p className="empty">
              No results. Try a customer name or job reference.
            </p>
          )}
        </div>
        <div className="command-footer">
          <span>↑ ↓ to navigate</span>
          <span>↵ to open</span>
          <span>esc to close</span>
        </div>
      </section>
    </div>
  );
}
