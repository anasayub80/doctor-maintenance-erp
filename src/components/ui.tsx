import { useAnimatedNumber } from "./Motion";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  ArrowUpRight,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Search,
  SlidersHorizontal,
  Plus,
  X,
  ArrowDown,
  ArrowUp,
  Inbox,
  Download,
  ArrowRight,
  Check,
} from "lucide-react";
import { useApp } from "../store";
import { money, compact, type Page } from "../domain";
export function Btn({
  children,
  onClick,
  primary = false,
  disabled = false,
  small = false,
  ...rest
}: {
  children: ReactNode;
  onClick?: () => void;
  primary?: boolean;
  disabled?: boolean;
  small?: boolean;
  [k: string]: any;
}) {
  return (
    <button
      className={`btn ${primary ? "primary" : ""} ${small ? "small" : ""}`}
      onClick={onClick}
      disabled={disabled}
      {...rest}
    >
      {children}
    </button>
  );
}
export function Badge({ children }: { children: ReactNode }) {
  const text = String(children);
  const kind =
    /Paid|Won|Completed|Accepted|Active|Available|Approved|Closed/.test(text)
      ? "good"
      : /Overdue|Lost|Rejected|Cancelled|Over budget|Voided/.test(text)
        ? "bad"
        : /Pending|Hold|Negotiation|Materials|Review|Site Visit|Partially|Next/.test(
              text,
            )
          ? "warn"
          : "neutral";
  return (
    <span className={`badge ${kind}`}>
      <i />
      {children}
    </span>
  );
}
export function Avatar({
  name,
  large = false,
}: {
  name: string;
  large?: boolean;
}) {
  return (
    <span className={`avatar ${large ? "large" : ""}`}>
      {name
        .split(" ")
        .slice(0, 2)
        .map((x) => x[0])
        .join("")}
    </span>
  );
}
export function Heading({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="page-heading">
      <div className="heading-brand-accent" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <div>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      <div className="actions">{actions}</div>
    </div>
  );
}
export function Panel({
  title,
  subtitle,
  action,
  children,
  className = "",
}: {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`panel ${className}`}>
      {title && (
        <div className="panel-heading">
          <div>
            <h3>{title}</h3>
            {subtitle && <p>{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
export function Metric({
  label,
  value,
  hint,
  onClick,
  dark = false,
}: {
  label: string;
  value: number | string;
  hint?: string;
  onClick?: () => void;
  dark?: boolean;
}) {
  const animated = useAnimatedNumber(typeof value === "number" ? value : 0);
  return (
    <button
      aria-label={`${label}: ${typeof value === "number" ? money(value) : value}. ${hint || ""}`}
      disabled={!onClick}
      onClick={onClick}
      className={`metric ${dark ? "dark" : ""}`}
    >
      <div className="metric-label">
        {label}
        {onClick && <ArrowUpRight size={15} />}
      </div>
      <strong>
        {typeof value === "number" ? (
          <>
            <small>PKR</small>
            {compact(animated)}
          </>
        ) : (
          value
        )}
      </strong>
      <span>{hint}</span>
    </button>
  );
}
export function Empty({
  title = "Nothing here yet",
  message = "Create a record to get started.",
  action,
}: {
  title?: string;
  message?: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty">
      <img
        className="empty-illustration"
        src="/assets/document-care.svg"
        alt=""
      />
      <h3>{title}</h3>
      <p>{message}</p>
      {action}
    </div>
  );
}
export function Tabs({
  tabs,
  value,
  onChange,
}: {
  tabs: string[];
  value: string;
  onChange: (s: string) => void;
}) {
  return (
    <div className="tabs" role="tablist">
      {tabs.map((t) => (
        <button
          key={t}
          role="tab"
          aria-selected={t === value}
          className={t === value ? "selected" : ""}
          onClick={() => onChange(t)}
        >
          {t}
        </button>
      ))}
    </div>
  );
}
export function Progress({ value }: { value: number }) {
  return (
    <div className="progress-wrap">
      <div className="progress">
        <span style={{ width: `${Math.min(100, value)}%` }} />
      </div>
      <small>{value}%</small>
    </div>
  );
}
export function PeriodFilters() {
  const { state, month, setMonth, serviceFilter, setServiceFilter } = useApp();
  return (
    <div className="actions">
      <select
        aria-label="Reporting period"
        value={month}
        onChange={(e) => setMonth(e.target.value)}
      >
        <option value="2026-10">October 2026</option>
        <option value="2026-09">September 2026</option>
        <option value="all">All demo periods</option>
      </select>
      <select
        aria-label="Service filter"
        value={serviceFilter}
        onChange={(e) => setServiceFilter(e.target.value)}
      >
        <option value="all">All services</option>
        {state.services.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>
    </div>
  );
}
export interface Col<T> {
  key: string;
  label: string;
  render?: (row: T) => ReactNode;
  numeric?: boolean;
  value?: (row: T) => string | number;
}
export function Table<T extends { id: string }>({
  rows,
  columns,
  onRow,
  searchPlaceholder = "Search records…",
  toolbar,
  emptyAction,
  noSearch = false,
}: {
  rows: T[];
  columns: Col<T>[];
  onRow?: (r: T) => void;
  searchPlaceholder?: string;
  toolbar?: ReactNode;
  emptyAction?: ReactNode;
  noSearch?: boolean;
}) {
  const [query, setQuery] = useState(""),
    [sort, setSort] = useState<{ key: string; asc: boolean } | null>(null),
    [page, setPage] = useState(0);
  const filtered = rows.filter((r) =>
    JSON.stringify(r).toLowerCase().includes(query.toLowerCase()),
  );
  const sorted = [...filtered];
  if (sort) {
    const c = columns.find((c) => c.key === sort.key)!;
    sorted.sort((a, b) => {
      const av = c.value ? c.value(a) : ((a as any)[c.key] ?? ""),
        bv = c.value ? c.value(b) : ((b as any)[c.key] ?? "");
      return (
        (typeof av === "number" && typeof bv === "number"
          ? av - bv
          : String(av).localeCompare(String(bv))) * (sort.asc ? 1 : -1)
      );
    });
  }
  useEffect(() => setPage(0), [query, rows.length]);
  const pages = Math.ceil(sorted.length / 8);
  const visible = sorted.slice(page * 8, page * 8 + 8);
  return (
    <div className="table-shell">
      {(!noSearch || toolbar) && (
        <div className="table-toolbar">
          {!noSearch && (
            <label className="search-field">
              <Search size={16} />
              <input
                aria-label={searchPlaceholder}
                placeholder={searchPlaceholder}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
          )}
          <div className="actions">{toolbar}</div>
        </div>
      )}
      {rows.length && filtered.length ? (
        <>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  {columns.map((c) => (
                    <th key={c.key} className={c.numeric ? "numeric" : ""}>
                      <button
                        onClick={() =>
                          setSort({
                            key: c.key,
                            asc: sort?.key === c.key ? !sort.asc : true,
                          })
                        }
                      >
                        {c.label}
                        {sort?.key === c.key ? (
                          sort.asc ? (
                            <ArrowUp size={12} />
                          ) : (
                            <ArrowDown size={12} />
                          )
                        ) : null}
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visible.map((r) => (
                  <tr
                    key={r.id}
                    onClick={() => onRow?.(r)}
                    className={onRow ? "clickable" : ""}
                  >
                    {columns.map((c, i) => (
                      <td
                        key={c.key}
                        data-label={c.label}
                        className={c.numeric ? "numeric" : ""}
                      >
                        {i === 0 && onRow ? (
                          <button
                            className="row-link"
                            onClick={(e) => {
                              e.stopPropagation();
                              onRow(r);
                            }}
                          >
                            {c.render
                              ? c.render(r)
                              : String((r as any)[c.key] ?? "")}
                          </button>
                        ) : c.render ? (
                          c.render(r)
                        ) : (
                          String((r as any)[c.key] ?? "")
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="table-footer">
            <span>
              {filtered.length} records{query && " matching search"}
            </span>
            <div className="actions">
              <small>
                Page {page + 1} of {pages}
              </small>
              <button
                className="icon-btn"
                aria-label="Previous page"
                disabled={page === 0}
                onClick={() => setPage(page - 1)}
              >
                <ChevronLeft size={16} />
              </button>
              <button
                className="icon-btn"
                aria-label="Next page"
                disabled={page >= pages - 1}
                onClick={() => setPage(page + 1)}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </>
      ) : (
        <Empty
          title={query ? "No matching records" : "No records yet"}
          message={
            query
              ? "Try another name or reference."
              : "New records will appear here."
          }
          action={emptyAction}
        />
      )}
    </div>
  );
}
export function Drawer({
  title,
  subtitle,
  children,
  onClose,
  wide = false,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const old = document.activeElement as HTMLElement;
    ref.current?.querySelector<HTMLElement>("input,button,select")?.focus();
    const cb = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab") {
        const els = Array.from(
          ref.current?.querySelectorAll<HTMLElement>(
            'button:not(:disabled),input,select,textarea,[tabindex="0"]',
          ) || [],
        );
        if (e.shiftKey && document.activeElement === els[0]) {
          e.preventDefault();
          els.at(-1)?.focus();
        } else if (!e.shiftKey && document.activeElement === els.at(-1)) {
          e.preventDefault();
          els[0]?.focus();
        }
      }
    };
    document.addEventListener("keydown", cb);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", cb);
      document.body.style.overflow = "";
      old?.focus();
    };
  }, []);
  return (
    <div className="overlay drawer-overlay" onClick={onClose}>
      <aside
        ref={ref}
        className={`drawer ${wide ? "wide" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="drawer-heading">
          <div>
            <div className="eyebrow">DOCTOR MAINTENANCE</div>
            <h2>{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <button
            className="icon-btn"
            aria-label="Close drawer"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>
        <div className="drawer-body">{children}</div>
      </aside>
    </div>
  );
}
export interface Field {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  options?: { value: string; label: string }[];
  hint?: string;
  default?: any;
  min?: number;
  max?: number;
}
export function Form({
  fields,
  onSubmit,
  label = "Save record",
  children,
  initial = {},
}: {
  fields: Field[];
  onSubmit: (data: any) => void;
  label?: string;
  children?: ReactNode;
  initial?: any;
}) {
  const [error, setError] = useState("");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        const d = Object.fromEntries(f);
        for (const field of fields) {
          if (field.type === "number")
            d[field.name] = Number(d[field.name]) as any;
        }
        try {
          onSubmit(d);
        } catch (err) {
          setError(
            err instanceof Error
              ? err.message
              : "Check the form and try again.",
          );
        }
      }}
    >
      <div className="form-grid">
        {fields.map((f) => (
          <label
            className={`field ${f.type === "textarea" ? "span-2" : ""}`}
            key={f.name}
          >
            <span>
              {f.label}
              {f.required && <b> *</b>}
            </span>
            {f.options ? (
              <select
                name={f.name}
                defaultValue={initial[f.name] ?? f.default ?? ""}
                required={f.required}
              >
                {!f.required && <option value="">None</option>}
                {f.options.map((o) => (
                  <option value={o.value} key={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            ) : f.type === "textarea" ? (
              <textarea
                name={f.name}
                defaultValue={initial[f.name] ?? f.default ?? ""}
                required={f.required}
                rows={4}
              />
            ) : (
              <input
                name={f.name}
                type={f.type || "text"}
                min={f.min ?? (f.type === "number" ? 0 : undefined)}
                max={f.max}
                step={f.type === "number" ? "any" : undefined}
                defaultValue={initial[f.name] ?? f.default ?? ""}
                required={f.required}
              />
            )}{" "}
            {f.hint && <small>{f.hint}</small>}
          </label>
        ))}
      </div>
      {children}
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <div className="form-footer">
        <span>Saved locally in this demo</span>
        <button className="btn primary" type="submit">
          <Check size={16} />
          {label}
        </button>
      </div>
    </form>
  );
}
export function DetailHeader({
  title,
  reference,
  status,
  back,
  actions,
}: {
  title: string;
  reference: string;
  status?: string;
  back: Page;
  actions?: ReactNode;
}) {
  const { go } = useApp();
  return (
    <>
      <button className="back-link" onClick={() => go(back)}>
        <ChevronLeft size={14} />
        Back to {back.toLowerCase()}
      </button>
      <div className="detail-heading">
        <div>
          <div className="eyebrow">{reference}</div>
          <h1>{title}</h1>
          {status && <Badge>{status}</Badge>}
        </div>
        <div className="actions">{actions}</div>
      </div>
    </>
  );
}
export function Timeline({
  items,
}: {
  items: { title: string; detail?: string; date?: string }[];
}) {
  return (
    <div className="timeline">
      {items.map((i, n) => (
        <div key={n}>
          <span className="timeline-marker" />
          <strong>{i.title}</strong>
          {i.detail && <p>{i.detail}</p>}
          <small>{i.date}</small>
        </div>
      ))}
    </div>
  );
}
export function ExportButton({ rows, name }: { rows: any[]; name: string }) {
  const { toast } = useApp();
  return (
    <Btn
      small
      onClick={() => {
        exportCSV(rows, name);
        toast("Demo records exported as CSV");
      }}
    >
      <Download size={15} />
      Export
    </Btn>
  );
}
export function exportCSV(rows: any[], name: string) {
  if (!rows.length) return;
  const keys = Object.keys(rows[0]);
  const cell = (v: any) =>
    '"' +
    String(typeof v === "object" ? JSON.stringify(v) : (v ?? "")).replaceAll(
      '"',
      '""',
    ) +
    '"';
  const text = [
    keys.map(cell).join(","),
    ...rows.map((r) => keys.map((k) => cell(r[k])).join(",")),
  ].join("\r\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(
    new Blob(["\uFEFF" + text], { type: "text/csv" }),
  );
  a.download = `doctor-maintenance-${name}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}
export function Info({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: string;
}) {
  return <div className={`info ${tone}`}>{children}</div>;
}
export {
  ArrowUpRight,
  ChevronDown,
  Search,
  SlidersHorizontal,
  Plus,
  ArrowRight,
  money,
};
