import {
  ArrowUpRight,
  ArrowRight,
  Clock,
  FileText,
  Wallet,
  AlertTriangle,
  CalendarCheck,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import { useApp } from "../store";
import {
  finance,
  canFinance,
  canCosts,
  compact,
  money,
  invoiceStatus,
  directCost,
  pct,
  inMonth,
  today,
} from "../domain";
import {
  Heading,
  Panel,
  Metric,
  Badge,
  Progress,
  PeriodFilters,
  Btn,
  Info,
  Empty,
} from "../components/ui";
import { TrendChart, CompareBars } from "../components/charts";
export default function Dashboard() {
  const {
    state: s,
    go,
    month,
    serviceFilter,
    setServiceFilter,
    openCreate,
  } = useApp();
  const f = finance(s, month, serviceFilter);
  const active = s.jobs.filter(
    (j) =>
      !["Completed", "Closed", "Cancelled"].includes(j.status) &&
      (serviceFilter === "all" || j.serviceId === serviceFilter),
  );
  const follow = s.leads.filter(
    (l) =>
      l.followUp && l.followUp <= today && !["Won", "Lost"].includes(l.stage),
  );
  const overdue = s.invoices.filter((i) => invoiceStatus(s, i) === "Overdue");
  const over = s.jobs.filter((j) => directCost(s, j.id) > j.budget);
  const serviceRows = s.services
    .map((sv) => ({ sv, f: finance(s, month, sv.id) }))
    .filter((r) => r.f.earned > 0)
    .sort((a, b) => b.f.contribution - a.f.contribution);
  const weekly = [0, 1, 2, 3].map((w) => {
    const js = s.jobs.filter(
      (j) =>
        inMonth(j.end, month) &&
        Math.min(3, Math.floor((Number(j.end.slice(-2)) - 1) / 7)) === w &&
        (serviceFilter === "all" || j.serviceId === serviceFilter),
    );
    const ids = new Set(js.map((j) => j.id));
    const revenue = js.reduce((a, j) => a + j.earned, 0),
      cost =
        s.expenses
          .filter((e) => e.status === "Approved" && ids.has(e.jobId))
          .reduce((a, e) => a + e.amount, 0) +
        s.bills
          .filter((b) => b.status === "Approved" && ids.has(b.jobId))
          .reduce((a, b) => a + b.amount, 0);
    return { revenue, profit: revenue - cost };
  });
  return (
    <>
      <div className="dashboard-hero">
        <div className="hero-copy">
          <Heading
            eyebrow="EXECUTIVE OVERVIEW"
            title="Your business, in focus."
            description={`${active.length} projects moving forward. ${follow.length} conversations need your attention.`}
          />
          <div className="hero-signals">
            <span>
              <i />
              {active.length} projects in motion
            </span>
            <button
              onClick={() =>
                go(
                  s.role === "Operations Manager" ? "Jobs & Projects" : "Leads",
                )
              }
            >
              <Clock size={13} />
              {follow.length} follow-ups to plan
              <ArrowUpRight size={12} />
            </button>
          </div>
        </div>
        <div className="hero-illustration" aria-hidden="true">
          <img src="/assets/property-care.svg" alt="" />
        </div>
        <div className="hero-controls">
          <PeriodFilters />
        </div>
      </div>
      {canFinance(s) ? (
        <div className="financial-ribbon">
          <div className="ribbon-caption">
            <span className="eyebrow">MONTHLY PERFORMANCE</span>
            <span>
              Accrual profitability <span className="live-dot" />
            </span>
          </div>
          <div className="metrics five">
            <Metric
              dark
              label="Revenue earned"
              value={f.earned}
              hint="Recognized on completed work"
              onClick={() => go("Reports & Analytics")}
            />
            <Metric
              dark
              label="Gross profit"
              value={f.gross}
              hint={`${pct(f.gross, f.earned)}% gross margin`}
              onClick={() => go("Reports & Analytics")}
            />
            <Metric
              dark
              label="Net profit"
              value={f.net}
              hint="After marketing & overhead"
              onClick={() => go("Cash & Accounts")}
            />
            <Metric
              dark
              label="Cash collected"
              value={f.receipts}
              hint="Includes customer advances"
              onClick={() => go("Cash & Accounts")}
            />
            <Metric
              dark
              label="Receivables"
              value={f.receivables}
              hint="Outstanding across all periods"
              onClick={() => go("Invoices & Receipts")}
            />
          </div>
        </div>
      ) : (
        <div className="metrics">
          <Metric
            label="Open leads"
            value={String(
              s.leads.filter((l) => !["Won", "Lost"].includes(l.stage)).length,
            )}
            hint="Active opportunities"
            onClick={() => go("Leads")}
          />
          <Metric
            label="Open quotations"
            value={String(
              s.quotes.filter((q) => ["Draft", "Issued"].includes(q.status))
                .length,
            )}
            hint="Awaiting next action"
            onClick={() => go("Quotations")}
          />
          <Metric
            label="Active projects"
            value={String(active.length)}
            hint="In delivery"
            onClick={() => go("Jobs & Projects")}
          />
        </div>
      )}
      <div className="dashboard-grid">
        <Panel
          title={
            canFinance(s) ? "The shape of your business" : "Sales momentum"
          }
          subtitle={
            canFinance(s)
              ? "Earned revenue & gross profit • PKR"
              : "Move conversations into confirmed work"
          }
          action={
            <button
              className="text-btn"
              onClick={() =>
                go(canFinance(s) ? "Reports & Analytics" : "Leads")
              }
            >
              View {canFinance(s) ? "report" : "pipeline"}
              <ArrowUpRight size={14} />
            </button>
          }
          className="performance-panel"
        >
          {canFinance(s) ? (
            <>
              <div className="chart-summary">
                <strong>{money(f.earned)}</strong>
                <span className="muted">earned this period</span>
                <span className="mini-tag">
                  {s.jobs.filter((j) => j.earned > 0).length} completed jobs in
                  demo
                </span>
              </div>
              <TrendChart data={weekly} />
            </>
          ) : (
            <div className="sales-stages">
              {["New", "Qualified", "Site Visit", "Quotation Sent", "Won"].map(
                (stage) => (
                  <button key={stage} onClick={() => go("Leads")}>
                    <span>{stage}</span>
                    <strong>
                      {s.leads.filter((l) => l.stage === stage).length}
                    </strong>
                  </button>
                ),
              )}
            </div>
          )}
        </Panel>
        <Panel
          title="Needs your attention"
          subtitle="A little focus. A lot of progress."
          action={
            <span className="count-pill">
              {follow.length + overdue.length + over.length}
            </span>
          }
          className="priority-panel"
        >
          <div className="priority-list">
            {[
              {
                icon: Clock,
                title: "Customer follow-ups",
                sub: `${follow.length} conversations are due`,
                count: follow.length,
                p: "Leads" as const,
              },
              {
                icon: FileText,
                title: "Quotations awaiting a response",
                sub: `${s.quotes.filter((q) => q.status === "Issued").length} issued quotations`,
                count: s.quotes.filter((q) => q.status === "Issued").length,
                p: "Quotations" as const,
              },
              {
                icon: Wallet,
                title: "Overdue collections",
                sub: money(
                  overdue.reduce(
                    (a, i) =>
                      a +
                      (i.items.reduce((a, x) => a + x.rate * x.quantity, 0) -
                        s.payments
                          .filter((p) => p.recordId === i.id)
                          .reduce((a, p) => a + p.amount, 0)),
                    0,
                  ),
                ),
                count: overdue.length,
                p: "Invoices & Receipts" as const,
              },
              {
                icon: AlertTriangle,
                title: "Projects above budget",
                sub: `${over.length} jobs need a cost review`,
                count: over.length,
                p: "Jobs & Projects" as const,
              },
            ]
              .filter(
                (a) => canFinance(s) || !["Invoices & Receipts"].includes(a.p),
              )
              .map((a) => (
                <button
                  key={a.title}
                  onClick={() => go(a.p)}
                  className="priority-row"
                >
                  <span
                    className={`priority-icon ${a.icon === AlertTriangle ? "warning" : ""}`}
                  >
                    <a.icon size={17} />
                  </span>
                  <span>
                    <strong>{a.title}</strong>
                    <small>{a.sub}</small>
                  </span>
                  <ChevronRight size={15} />
                </button>
              ))}
          </div>
          <div className="priority-footer">
            <span className="live-dot" />
            Connected demonstration workflows
          </div>
        </Panel>
        <Panel
          title="Projects in motion"
          subtitle="Keep the next milestone in sight."
          action={
            <button className="text-btn" onClick={() => go("Jobs & Projects")}>
              All projects
              <ArrowUpRight size={14} />
            </button>
          }
          className="projects-panel"
        >
          {active.length ? (
            <div className="project-list">
              {active.slice(0, 4).map((j) => (
                <button
                  className="project-row"
                  key={j.id}
                  onClick={() => go("Jobs & Projects", j.id)}
                >
                  <span className="project-icon">
                    {j.serviceId === "S7" ? "K" : "E"}
                  </span>
                  <div>
                    <strong>{j.title}</strong>
                    <small>
                      {s.customers.find((c) => c.id === j.customerId)?.name} ·{" "}
                      {j.id}
                    </small>
                  </div>
                  <div className="project-progress">
                    <Progress value={j.progress} />
                  </div>
                  <Badge>{j.status}</Badge>
                  <ArrowUpRight size={16} />
                </button>
              ))}
            </div>
          ) : (
            <Empty
              title="No active projects in this view"
              message="Change the service filter to see other work."
            />
          )}
          <div className="panel-note">
            <CalendarCheck size={15} />
            {active[0]
              ? `Next handover: ${active[0].end} · ${active[0].title}`
              : "You’re up to date."}
          </div>
        </Panel>
        {canFinance(s) && (
          <Panel
            title="Volume isn’t the whole story."
            subtitle="Service contribution after direct costs and marketing."
            action={
              <button
                className="text-btn"
                onClick={() => go("Reports & Analytics")}
              >
                Compare services
                <ArrowUpRight size={14} />
              </button>
            }
            className="service-panel"
          >
            <CompareBars
              rows={serviceRows.slice(0, 4).map((r) => ({
                label: r.sv.name
                  .replace(" & Custom Woodwork", "")
                  .replace(" & Heat Proofing", ""),
                revenue: r.f.earned,
                profit: r.f.contribution,
              }))}
              onRow={(i) => {
                setServiceFilter(serviceRows[i].sv.id);
                go("Reports & Analytics");
              }}
            />
            {serviceRows.length > 1 && (
              <div className="insight">
                <TrendingUp size={17} />
                <p>
                  <strong>{serviceRows[0].sv.name}</strong> contributes the most
                  in this period. Review contribution alongside job volume
                  before allocating ad spend.
                </p>
              </div>
            )}
          </Panel>
        )}
      </div>
      <div className="dashboard-bottom">
        <div className="sales-strip">
          <div>
            <div className="eyebrow">YOUR SALES PIPELINE</div>
            <strong>
              {s.leads.filter((l) => !["Won", "Lost"].includes(l.stage)).length}{" "}
              open opportunities
            </strong>
          </div>
          <div className="pipeline-mini">
            {[
              "New",
              "Qualified",
              "Site Visit",
              "Quotation Sent",
              "Negotiation",
            ].map((t) => (
              <button key={t} onClick={() => go("Leads")}>
                <span>{t}</span>
                <strong>{s.leads.filter((l) => l.stage === t).length}</strong>
              </button>
            ))}
          </div>
          <Btn onClick={() => openCreate("lead")}>
            <span>Capture lead</span>
            <ArrowRight size={15} />
          </Btn>
        </div>
        {canFinance(s) && (
          <div className="marketing-strip">
            <span className="gold-label">MARKETING PULSE</span>
            <span>
              <strong>{money(f.marketing)}</strong> invested
            </span>
            <span>
              <strong>{s.leads.filter((l) => l.campaignId).length}</strong>{" "}
              attributed leads
            </span>
            <button className="text-btn" onClick={() => go("Marketing")}>
              See the return
              <ArrowUpRight size={15} />
            </button>
          </div>
        )}
      </div>
    </>
  );
}
