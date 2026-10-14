import ServiceTermsWorkspace from "./ServiceTerms";
import { serviceTerms } from "../terms";
import { useState } from "react";
import {
  Plus,
  ArrowRight,
  ArrowUpRight,
  MapPin,
  Calendar,
  HardHat,
  Check,
  FileText,
  Printer,
  Upload,
  Star,
  Layers,
  CheckCircle2,
  Clock,
  LockKeyhole,
} from "lucide-react";
import { useApp } from "../store";
import {
  type Job,
  type Contractor,
  type Service,
  money,
  directCost,
  jobValue,
  pct,
  canCosts,
  canFinance,
  jobStatuses as defaultJobStatuses,
  vocabulary,
  today,
  uid,
} from "../domain";
import {
  Heading,
  Panel,
  Table,
  Btn,
  Badge,
  Avatar,
  Tabs,
  DetailHeader,
  Progress,
  Metric,
  Info,
  Empty,
  Timeline,
  Drawer,
} from "../components/ui";
import { Related, ContactActions } from "./Relationships";
import { DocumentPreview } from "../components/Documents";
export function Jobs() {
  const { state: s, recordId, go, openCreate, save, confirm } = useApp();
  const [tab, setTab] = useState("Overview"),
    [filter, setFilter] = useState("all"),
    [compare, setCompare] = useState(false),
    [workOrderId, setWorkOrderId] = useState("");
  const j = s.jobs.find((j) => j.id === recordId);
  const jobStatuses = vocabulary(s, "Job statuses", defaultJobStatuses);
  const name = (j: Job) =>
    s.customers.find((c) => c.id === j.customerId)?.name || "";
  const finish = (j: Job) =>
    confirm(
      "Complete and recognize this project?",
      `${money(jobValue(j))} will be recorded as earned revenue at handover. Invoices and cash receipts remain separate.`,
      () =>
        save(
          "jobs",
          {
            ...j,
            status: "Completed",
            progress: 100,
            earned: jobValue(j),
            end: today,
            milestones: j.milestones.map((m) => ({ ...m, done: true })),
          },
          "Project completed • revenue recognized",
        ),
    );
  if (j) {
    const actual = directCost(s, j.id),
      budget = j.budget + j.changes.reduce((a, c) => a + c.cost, 0),
      profit = j.earned - actual;
    const workOrder = j.workOrders.find((w) => w.id === workOrderId);
    return (
      <>
        <DetailHeader
          title={j.title}
          reference={`${j.id} · ${name(j)}`}
          status={j.status}
          back="Jobs & Projects"
          actions={
            <>
              <Btn onClick={() => openCreate("invoice", j)}>
                <FileText size={15} />
                Create invoice
              </Btn>
              <Btn
                primary
                disabled={["Completed", "Closed", "Cancelled"].includes(
                  j.status,
                )}
                onClick={() => finish(j)}
              >
                <Check size={15} />
                Mark complete
              </Btn>
            </>
          }
        />
        <div className="job-summary">
          <div>
            <label>PROPERTY</label>
            <strong>
              {s.customers
                .find((c) => c.id === j.customerId)
                ?.properties.find((p) => p.id === j.propertyId)?.name ||
                "Property to confirm"}
            </strong>
            <small>
              {
                s.customers
                  .find((c) => c.id === j.customerId)
                  ?.properties.find((p) => p.id === j.propertyId)?.address
              }
            </small>
          </div>
          <div>
            <label>CONTRACT VALUE</label>
            <strong>{money(jobValue(j))}</strong>
            <small>Approved scope + change orders</small>
          </div>
          <div>
            <label>TARGET HANDOVER</label>
            <strong>{j.end}</strong>
            <small>Started {j.start}</small>
          </div>
          <div>
            <label>PROGRESS</label>
            <Progress value={j.progress} />
          </div>
        </div>
        <Tabs
          tabs={[
            "Overview",
            "Scope",
            "Contractors",
            "Timeline",
            "Costs & financials",
            "Documents",
            "Activity",
          ]}
          value={tab}
          onChange={setTab}
        />
        {tab === "Overview" && (
          <div className="detail-layout">
            <div>
              <Panel
                title="Delivery, at a glance"
                action={
                  <select
                    value={j.status}
                    aria-label="Update job status"
                    onChange={(e) =>
                      e.target.value === "Completed"
                        ? finish(j)
                        : save(
                            "jobs",
                            { ...j, status: e.target.value },
                            "Project status updated",
                          )
                    }
                  >
                    {jobStatuses.map((st) => (
                      <option key={st}>{st}</option>
                    ))}
                  </select>
                }
              >
                <div className="padded">
                  <div className="milestone-list">
                    {j.milestones.map((m) => (
                      <button
                        className={`milestone-card ${m.done ? "done" : ""}`}
                        key={m.id}
                        onClick={() => {
                          const milestones = j.milestones.map((x) =>
                            x.id === m.id ? { ...x, done: !x.done } : x,
                          );
                          save(
                            "jobs",
                            {
                              ...j,
                              milestones,
                              progress: Math.round(
                                pct(
                                  milestones
                                    .filter((x) => x.done)
                                    .reduce((a, x) => a + x.percentage, 0),
                                  milestones.reduce(
                                    (a, x) => a + x.percentage,
                                    0,
                                  ),
                                ),
                              ),
                            },
                            "Milestone updated",
                          );
                        }}
                      >
                        <span>
                          {m.done ? (
                            <CheckCircle2 size={20} />
                          ) : (
                            <Clock size={20} />
                          )}
                        </span>
                        <div>
                          <strong>{m.name}</strong>
                          <small>
                            {m.date} · {m.percentage}% weight
                          </small>
                        </div>
                        <Badge>{m.done ? "Completed" : "Scheduled"}</Badge>
                      </button>
                    ))}
                  </div>
                  {!j.milestones.length && (
                    <Empty
                      title="Set the delivery milestones"
                      action={
                        <Btn onClick={() => openCreate("milestone", j)}>
                          Add milestone
                        </Btn>
                      }
                    />
                  )}
                </div>
              </Panel>
              <Panel
                title="Project notes"
                action={
                  <Btn
                    small
                    onClick={() =>
                      openCreate("note", { record: j, collection: "jobs" })
                    }
                  >
                    Add update
                  </Btn>
                }
              >
                <Timeline items={j.notes.map((n) => ({ title: n }))} />
              </Panel>
            </div>
            <div className="detail-aside">
              <Panel title="Project health">
                <div className="padded">
                  {canCosts(s) ? (
                    <>
                      <div className="health-amount">
                        <span>Cost vs budget</span>
                        <strong
                          className={actual > budget ? "overdue-text" : ""}
                        >
                          {money(actual)}
                        </strong>
                        <small>of {money(budget)} budgeted</small>
                      </div>
                      <Progress value={Math.round(pct(actual, budget))} />
                      {actual > budget ? (
                        <Info tone="warning">
                          Above budget by {money(actual - budget)}. Review
                          approved costs before new work.
                        </Info>
                      ) : (
                        <Info>
                          Actual costs remain within the agreed budget.
                        </Info>
                      )}
                    </>
                  ) : (
                    <Info>
                      Financial controls are restricted for this role.
                    </Info>
                  )}
                  <Btn onClick={() => setTab("Costs & financials")}>
                    Review project
                    <ArrowRight size={15} />
                  </Btn>
                </div>
              </Panel>
              <Panel title="Assigned specialists">
                <div className="padded">
                  {j.contractorIds.map((id) => {
                    const c = s.contractors.find((c) => c.id === id);
                    return c ? (
                      <button
                        className="contractor-mini"
                        key={id}
                        onClick={() => go("Contractors", id)}
                      >
                        <Avatar name={c.name} />
                        <div>
                          <strong>{c.name}</strong>
                          <small>{c.availability}</small>
                        </div>
                        <ArrowUpRight size={14} />
                      </button>
                    ) : null;
                  })}
                  <Btn small onClick={() => openCreate("workorder", j)}>
                    <Plus size={14} />
                    Assign contractor
                  </Btn>
                </div>
              </Panel>
            </div>
          </div>
        )}
        {tab === "Scope" && (
          <>
            <Panel
              title="Approved scope"
              action={
                j.quoteId && (
                  <Btn small onClick={() => go("Quotations", j.quoteId)}>
                    View original quotation
                  </Btn>
                )
              }
            >
              <div className="padded">
                {s.quotes
                  .find((q) => q.id === j.quoteId)
                  ?.items.map((i) => (
                    <div key={i.id} className="scope-row">
                      <FileText size={17} />
                      <span>{i.description}</span>
                      <strong>
                        {i.quantity} {i.unit}
                      </strong>
                    </div>
                  )) || <p>{j.title}</p>}
              </div>
            </Panel>
            <Panel
              title="Change orders"
              subtitle="Additional work remains separate from the original approved scope."
              action={
                <Btn small onClick={() => openCreate("change", j)}>
                  <Plus size={14} />
                  Add change order
                </Btn>
              }
            >
              <Table
                rows={j.changes}
                columns={[
                  { key: "title", label: "Scope change" },
                  {
                    key: "revenue",
                    label: "Added customer price",
                    numeric: true,
                    render: (c) => money(c.revenue),
                  },
                  {
                    key: "cost",
                    label: "Added cost budget",
                    numeric: true,
                    render: (c) => money(c.cost),
                  },
                  { key: "days", label: "Additional days", numeric: true },
                ]}
              />
            </Panel>
          </>
        )}
        {tab === "Contractors" && (
          <>
            <Panel
              title="Work orders & assignments"
              action={
                <>
                  <Btn small onClick={() => setCompare(true)}>
                    Compare estimates
                  </Btn>
                  <Btn primary small onClick={() => openCreate("workorder", j)}>
                    <Plus size={14} />
                    Assign contractor
                  </Btn>
                </>
              }
            >
              <Table
                rows={j.workOrders}
                onRow={(w) => setWorkOrderId(w.id)}
                columns={[
                  { key: "id", label: "Work order" },
                  {
                    key: "contractorId",
                    label: "Contractor",
                    render: (w) =>
                      s.contractors.find((c) => c.id === w.contractorId)?.name,
                  },
                  { key: "scope", label: "Agreed scope" },
                  {
                    key: "budget",
                    label: "Agreed cost",
                    numeric: true,
                    render: (w) => money(w.budget),
                  },
                  { key: "date", label: "Expected completion" },
                ]}
              />
            </Panel>
            <div className="contractor-grid">
              {j.contractorIds.map((id) => {
                const ct = s.contractors.find((c) => c.id === id)!;
                return (
                  <Panel key={id}>
                    <div className="padded">
                      <div className="person">
                        <Avatar name={ct.name} />
                        <div>
                          <strong>{ct.name}</strong>
                          <small>{ct.availability}</small>
                        </div>
                      </div>
                      <p>{ct.notes}</p>
                      <ContactActions phone={ct.phone} />
                      <Btn
                        small
                        onClick={() => openCreate("bill", { jobId: j.id })}
                      >
                        Record contractor bill
                      </Btn>
                    </div>
                  </Panel>
                );
              })}
            </div>
            {workOrder && (
              <div className="receipt-preview">
                <Btn onClick={() => window.print()}>
                  <Printer size={15} />
                  Print work order
                </Btn>
                <DocumentPreview workOrder={{ job: j, ...workOrder }} />
              </div>
            )}
          </>
        )}
        {tab === "Timeline" && (
          <Panel
            title="Project milestones"
            action={
              <Btn small onClick={() => openCreate("milestone", j)}>
                Add milestone
              </Btn>
            }
          >
            <Timeline
              items={j.milestones.map((m) => ({
                title: m.name,
                detail: m.done ? "Completed" : "Upcoming checkpoint",
                date: m.date,
              }))}
            />
          </Panel>
        )}
        {tab === "Costs & financials" &&
          (canCosts(s) ? (
            <>
              <div className="metrics four">
                <Metric
                  label="Earned revenue"
                  value={j.earned}
                  hint="Recognized at project handover"
                />
                <Metric
                  label="Approved costs"
                  value={actual}
                  hint="Approved bills + material expenses"
                />
                <Metric
                  label="Actual gross profit"
                  value={profit}
                  hint={`${pct(profit, j.earned)}% of earned revenue`}
                />
                <Metric
                  label="Projected margin"
                  value={`${pct(jobValue(j) - actual, jobValue(j))}%`}
                  hint="Contract value less costs to date"
                />
              </div>
              <Info>
                In-progress projects may show negative accrual gross profit
                before handover. Expected margin uses contract value; it is not
                earned profit.
              </Info>
              <Panel
                title="Project cost ledger"
                action={
                  <>
                    <Btn small onClick={() => openCreate("cost", j)}>
                      Add cost
                    </Btn>
                    <Btn
                      small
                      onClick={() => openCreate("bill", { jobId: j.id })}
                    >
                      Contractor bill
                    </Btn>
                  </>
                }
              >
                <Table
                  rows={[
                    ...s.expenses
                      .filter((e) => e.jobId === j.id)
                      .map((e) => ({ ...e, type: e.category })),
                    ...s.bills
                      .filter((b) => b.jobId === j.id)
                      .map((b) => ({ ...b, type: "Contractor labour" })),
                  ]}
                  columns={[
                    { key: "description", label: "Cost description" },
                    { key: "type", label: "Category" },
                    { key: "date", label: "Incurred" },
                    {
                      key: "amount",
                      label: "Amount",
                      numeric: true,
                      render: (r) => money(r.amount),
                    },
                    {
                      key: "status",
                      label: "Approval",
                      render: (r) => <Badge>{r.status}</Badge>,
                    },
                  ]}
                />
              </Panel>
              <Panel title="Customer billing & collections">
                <Related kind="Invoices" jobId={j.id} />
              </Panel>
            </>
          ) : (
            <Info>
              Internal costs and profit margins are restricted for this role.
            </Info>
          ))}
        {tab === "Documents" && (
          <Panel
            title="Project files"
            action={
              <label className="btn small">
                <Upload size={14} />
                Add mock file
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file)
                      save(
                        "jobs",
                        { ...j, attachments: [...j.attachments, file.name] },
                        "Mock attachment added • filename only",
                      );
                  }}
                />
              </label>
            }
          >
            <div className="padded">
              {j.attachments.map((f, i) => (
                <div key={i} className="scope-row">
                  <FileText size={16} />
                  {f}
                  <span className="muted">Demo attachment</span>
                </div>
              ))}
              {!j.attachments.length && (
                <Info>
                  Add filenames for before-and-after photos or site documents.
                  Upload storage is not connected.
                </Info>
              )}
            </div>
            <Related kind="Invoices" jobId={j.id} />
          </Panel>
        )}
        {tab === "Activity" && (
          <Panel title="Project history">
            <Timeline
              items={[
                { title: "Project scheduled", date: j.start },
                ...j.notes.map((n) => ({ title: n })),
                ...j.changes.map((c) => ({
                  title: `Change order: ${c.title}`,
                  detail: `${money(c.revenue)} added`,
                  date: c.date,
                })),
                {
                  title: `Current status: ${j.status}`,
                  detail: `${j.progress}% complete`,
                },
              ]}
            />
          </Panel>
        )}
        {compare && (
          <ContractorComparison job={j} close={() => setCompare(false)} />
        )}
      </>
    );
  }
  const rows = s.jobs.filter((j) => filter === "all" || j.status === filter);
  return (
    <>
      <Heading
        eyebrow="OPERATIONS WORKSPACE"
        title="Deliver work you’re proud of."
        description="Clear scopes, accountable specialists and considered handovers."
        actions={
          <Btn primary onClick={() => openCreate("job")}>
            <Plus size={16} />
            New project
          </Btn>
        }
      />
      <div className="operations-overview">
        <div>
          <span className="eyebrow">IN DELIVERY</span>
          <strong>
            {s.jobs.filter((j) => j.status === "In Progress").length} active
            projects
          </strong>
          <p>Stay close to the next milestone.</p>
        </div>
        <div>
          <label>Scheduled</label>
          <strong>
            {s.jobs.filter((j) => j.status === "Scheduled").length}
          </strong>
        </div>
        <div>
          <label>Completed</label>
          <strong>
            {s.jobs.filter((j) => j.status === "Completed").length}
          </strong>
        </div>
        {canCosts(s) && (
          <div>
            <label>Above budget</label>
            <strong className="overdue-text">
              {
                s.jobs.filter(
                  (j) =>
                    directCost(s, j.id) >
                    j.budget + j.changes.reduce((a, c) => a + c.cost, 0),
                ).length
              }
            </strong>
          </div>
        )}
      </div>
      <Panel>
        <Table
          rows={rows}
          onRow={(j) => go("Jobs & Projects", j.id)}
          toolbar={
            <select
              aria-label="Job status"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">All project statuses</option>
              {jobStatuses.map((st) => (
                <option key={st}>{st}</option>
              ))}
            </select>
          }
          columns={[
            {
              key: "title",
              label: "Project",
              render: (j) => (
                <div>
                  <strong>{j.title}</strong>
                  <small className="block muted">
                    {j.id} · {name(j)}
                  </small>
                </div>
              ),
            },
            {
              key: "value",
              label: "Contract",
              numeric: true,
              render: (j) => money(jobValue(j)),
            },
            {
              key: "progress",
              label: "Progress",
              render: (j) => <Progress value={j.progress} />,
            },
            {
              key: "contractorIds",
              label: "Specialist",
              render: (j) =>
                s.contractors.find((c) => c.id === j.contractorIds[0])?.name ||
                "Unassigned",
            },
            { key: "end", label: "Handover" },
            {
              key: "budget",
              label: "Budget health",
              render: (j) =>
                canCosts(s) ? (
                  <Badge>
                    {directCost(s, j.id) >
                    j.budget + j.changes.reduce((a, c) => a + c.cost, 0)
                      ? "Over budget"
                      : "Within budget"}
                  </Badge>
                ) : (
                  "Restricted"
                ),
            },
            {
              key: "status",
              label: "Status",
              render: (j) => <Badge>{j.status}</Badge>,
            },
          ]}
        />
      </Panel>
    </>
  );
}
export function ContractorComparison({
  job,
  close,
}: {
  job: Job;
  close: () => void;
}) {
  const { state: s, openCreate } = useApp();
  const candidates = s.contractors.filter((c) =>
    c.specialties.includes(job.serviceId),
  );
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [selected, setSelected] = useState("");
  return (
    <Drawer
      wide
      title="Compare contractor estimates"
      subtitle={`${job.title} · compare equivalent scope before selecting.`}
      onClose={close}
    >
      <Info>
        Illustrative estimates use each contractor’s rate × 120 units. Edit to
        match the actual scope. No automatic winner.
      </Info>
      <div className="comparison-grid">
        {candidates.map((ct) => (
          <section className={selected === ct.id ? "selected" : ""} key={ct.id}>
            <Avatar name={ct.name} />
            <h3>{ct.name}</h3>
            <Badge>{ct.availability}</Badge>
            <label className="field">
              <span>Estimated price (PKR)</span>
              <input
                type="number"
                min="0"
                value={prices[ct.id] ?? ct.rate * 120}
                onChange={(e) =>
                  setPrices({ ...prices, [ct.id]: Number(e.target.value) })
                }
              />
            </label>
            <div className="comparison-facts">
              <span>
                Typical unit<strong>{ct.unit}</strong>
              </span>
              <span>
                Quality notes<strong>{ct.quality || "Unrated"} / 5</strong>
              </span>
              <span>
                Prior projects
                <strong>
                  {s.jobs.filter((j) => j.contractorIds.includes(ct.id)).length}
                </strong>
              </span>
            </div>
            <p>{ct.notes}</p>
            <Btn
              primary={selected === ct.id}
              onClick={() => setSelected(ct.id)}
            >
              {selected === ct.id ? "Selected for review" : "Select contractor"}
            </Btn>
          </section>
        ))}
      </div>
      {!candidates.length && (
        <Empty
          title="No matching specialists"
          message="Add this service to a contractor’s profile before comparison."
        />
      )}
      <div className="form-footer">
        <span>Compare quality, timing and scope alongside price.</span>
        <Btn
          primary
          disabled={!selected}
          onClick={() => {
            const ct = selected;
            close();
            openCreate("workorder", {
              job,
              contractorId: ct,
              estimate:
                prices[ct] ??
                s.contractors.find((c) => c.id === ct)!.rate * 120,
              scope: job.title,
            });
          }}
        >
          Create work order
          <ArrowRight size={15} />
        </Btn>
      </div>
    </Drawer>
  );
}
export function Contractors() {
  const { state: s, recordId, go, openCreate } = useApp();
  const [tab, setTab] = useState("Overview"),
    [filter, setFilter] = useState("all");
  const ct = s.contractors.find((c) => c.id === recordId);
  const owed = (id: string) =>
    s.bills
      .filter((b) => b.contractorId === id && b.status === "Approved")
      .reduce(
        (a, b) =>
          a +
          b.amount -
          s.payments
            .filter((p) => p.recordId === b.id)
            .reduce((a, p) => a + p.amount, 0),
        0,
      );
  if (ct) {
    return (
      <>
        <DetailHeader
          title={ct.name}
          reference={`${ct.id} · SPECIALIST PARTNER`}
          status={ct.availability}
          back="Contractors"
          actions={
            <Btn primary onClick={() => openCreate("contractor", ct)}>
              Edit contractor
            </Btn>
          }
        />
        <div className="customer-hero">
          <Avatar large name={ct.name} />
          <div>
            <strong>
              {ct.specialties
                .map((id) => s.services.find((s) => s.id === id)?.name)
                .join(" · ")}
            </strong>
            <p>
              {money(ct.rate)} / {ct.unit}
            </p>
            <ContactActions phone={ct.phone} />
          </div>
          <div className="customer-stat">
            <span>Assigned jobs</span>
            <strong>
              {s.jobs.filter((j) => j.contractorIds.includes(ct.id)).length}
            </strong>
          </div>
          <div className="customer-stat">
            <span>Outstanding</span>
            <strong>{money(owed(ct.id))}</strong>
          </div>
        </div>
        <Tabs
          tabs={[
            "Overview",
            "Services & rates",
            "Work history",
            "Bills & payments",
            "Performance",
            "Documents",
          ]}
          value={tab}
          onChange={setTab}
        />
        {tab === "Overview" || tab === "Performance" ? (
          <div className="two-col">
            <Panel title="Performance & reliability">
              <div className="padded">
                <div className="rating">
                  <Star size={21} />
                  <strong>{ct.quality || "Unrated"}</strong>
                  <span>Internal demonstration score</span>
                </div>
                <p>{ct.notes}</p>
                <Info>
                  Compare past scope and rework alongside rates. Scores are
                  illustrative, not customer reviews.
                </Info>
              </div>
            </Panel>
            <Panel title="Specialties">
              <div className="padded">
                {ct.specialties.map((id) => (
                  <div className="scope-row" key={id}>
                    <Layers size={17} />
                    {s.services.find((s) => s.id === id)?.name}
                  </div>
                ))}
              </div>
            </Panel>
          </div>
        ) : tab === "Services & rates" ? (
          <Panel title="Agreed rate references">
            <div className="padded">
              <h2>
                {money(ct.rate)} / {ct.unit}
              </h2>
              <p>{ct.notes}</p>
              <Btn onClick={() => openCreate("contractor", ct)}>
                Update rate card
              </Btn>
            </div>
          </Panel>
        ) : tab === "Work history" ? (
          <Panel title="Assigned & completed jobs">
            <Table
              rows={s.jobs.filter((j) => j.contractorIds.includes(ct.id))}
              onRow={(j) => go("Jobs & Projects", j.id)}
              columns={[
                { key: "title", label: "Project" },
                {
                  key: "status",
                  label: "Status",
                  render: (j) => <Badge>{j.status}</Badge>,
                },
                {
                  key: "budget",
                  label: "Budget",
                  numeric: true,
                  render: (j) => money(j.budget),
                },
                { key: "end", label: "Handover" },
              ]}
            />
          </Panel>
        ) : tab === "Bills & payments" ? (
          <Panel title="Contractor account">
            <Table
              rows={s.bills.filter((b) => b.contractorId === ct.id)}
              onRow={() => go("Contractor Payables")}
              columns={[
                { key: "description", label: "Bill" },
                {
                  key: "amount",
                  label: "Amount",
                  numeric: true,
                  render: (b) => money(b.amount),
                },
                { key: "due", label: "Due" },
                {
                  key: "status",
                  label: "Status",
                  render: (b) => <Badge>{b.status}</Badge>,
                },
              ]}
            />
          </Panel>
        ) : (
          <Panel title="Documents">
            <Empty
              title="Contractor document storage"
              message="File storage and agreement signing are reserved for the backend phase."
              action={<Btn disabled>Upload unavailable</Btn>}
            />
          </Panel>
        )}
      </>
    );
  }
  return (
    <>
      <Heading
        eyebrow="OPERATIONS WORKSPACE"
        title="The right people for the right work."
        description="Specialist partners, transparent rates and a reliable work history."
        actions={
          <Btn primary onClick={() => openCreate("contractor")}>
            <Plus size={16} />
            Add contractor
          </Btn>
        }
      />
      <Panel>
        <Table
          rows={s.contractors.filter(
            (c) => filter === "all" || c.specialties.includes(filter),
          )}
          onRow={(c) => go("Contractors", c.id)}
          toolbar={
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              aria-label="Specialty filter"
            >
              <option value="all">All specialties</option>
              {s.services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          }
          columns={[
            {
              key: "name",
              label: "Specialist",
              render: (c) => (
                <div className="person">
                  <Avatar name={c.name} />
                  <strong>{c.name}</strong>
                </div>
              ),
            },
            {
              key: "specialties",
              label: "Specialties",
              render: (c) =>
                c.specialties
                  .map((id) => s.services.find((s) => s.id === id)?.name)
                  .join(" · "),
            },
            {
              key: "rate",
              label: "Typical rate",
              numeric: true,
              render: (c) => (
                <>
                  {money(c.rate)} <small>/ {c.unit}</small>
                </>
              ),
            },
            {
              key: "jobs",
              label: "Jobs",
              numeric: true,
              render: (c) =>
                s.jobs.filter((j) => j.contractorIds.includes(c.id)).length,
            },
            {
              key: "quality",
              label: "Internal score",
              render: (c) => (
                <span className="rating-small">
                  <Star size={13} />
                  {c.quality || "Unrated"}
                </span>
              ),
            },
            {
              key: "outstanding",
              label: "Payables",
              numeric: true,
              render: (c) => money(owed(c.id)),
            },
            {
              key: "availability",
              label: "Availability",
              render: (c) => <Badge>{c.availability}</Badge>,
            },
          ]}
        />
      </Panel>
    </>
  );
}
export function Services() {
  const { state: s, save, openCreate, recordId, go } = useApp();
  const [view, setView] = useState(
    recordId ? "Quotation terms" : "Service catalog",
  );
  const [termsService, setTermsService] = useState(recordId || "S7");
  const [query, setQuery] = useState(""),
    [selected, setSelected] = useState<Service | null>(null);
  return (
    <>
      <Heading
        eyebrow="SERVICE CATALOG"
        title="Expertise, with a clear price."
        description="Flexible rate references for every kind of maintenance work."
        actions={
          <Btn primary onClick={() => openCreate("service")}>
            <Plus size={16} />
            Add service
          </Btn>
        }
      />
      <Tabs
        tabs={["Service catalog", "Quotation terms"]}
        value={view}
        onChange={setView}
      />
      {view === "Quotation terms" ? (
        <ServiceTermsWorkspace
          serviceId={recordId || termsService}
          onSelect={(id) => {
            setTermsService(id);
            go("Services & Rates", id);
          }}
        />
      ) : (
        <>
          <Info>
            Demo rate references can be overridden by authorized staff. Changes
            do not rewrite issued quotations.
          </Info>
          <div className="workspace-toolbar">
            <span>
              {s.services.filter((s) => s.active).length} active service
              categories
            </span>
            <label className="search-field">
              <input
                placeholder="Find a service…"
                aria-label="Find service"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
          </div>
          <div className="service-grid">
            {s.services
              .filter((sv) =>
                sv.name.toLowerCase().includes(query.toLowerCase()),
              )
              .map((sv, i) => (
                <article
                  className={`service-card ${!sv.active ? "inactive" : ""}`}
                  key={sv.id}
                >
                  <div className="service-card-top">
                    <span className="service-number">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <Badge>{sv.active ? "Active" : "Inactive"}</Badge>
                  </div>
                  <h3>{sv.name}</h3>
                  <p>{sv.description}</p>
                  <div className="rate-pair">
                    <div>
                      <label>WITH MATERIAL</label>
                      <strong>{money(sv.rate)}</strong>
                    </div>
                    <div>
                      <label>LABOUR ONLY</label>
                      <strong>{money(sv.labourRate)}</strong>
                    </div>
                    <span>per {sv.unit}</span>
                  </div>
                  <div className="service-card-footer">
                    <button
                      className="text-btn"
                      onClick={() => openCreate("service", sv)}
                    >
                      Edit rate card
                      <ArrowUpRight size={14} />
                    </button>
                    <button
                      className="text-btn service-terms-link"
                      onClick={() => {
                        setTermsService(sv.id);
                        setView("Quotation terms");
                        go("Services & Rates", sv.id);
                      }}
                    >
                      <FileText size={13} />
                      Terms{" "}
                      <span>
                        {serviceTerms(sv).filter((t) => t.enabled).length}
                      </span>
                    </button>
                    <button
                      className="text-btn"
                      onClick={() => setSelected(sv)}
                    >
                      History
                    </button>
                    <button
                      className="text-btn"
                      onClick={() =>
                        save(
                          "services",
                          { ...sv, active: !sv.active },
                          sv.active
                            ? "Service deactivated"
                            : "Service reactivated",
                        )
                      }
                    >
                      {sv.active ? "Deactivate" : "Activate"}
                    </button>
                  </div>
                </article>
              ))}
          </div>
        </>
      )}
      {selected && (
        <Drawer
          title={`${selected.name} • rate history`}
          onClose={() => setSelected(null)}
        >
          <Timeline
            items={[
              {
                title: `Current reference: ${money(selected.rate)} / ${selected.unit}`,
                detail: "New quotations use the current reference.",
              },
              ...selected.history.map((h) => ({
                title: money(h.rate),
                date: h.date,
                detail: "Historical reference",
              })),
            ]}
          />
        </Drawer>
      )}
    </>
  );
}
