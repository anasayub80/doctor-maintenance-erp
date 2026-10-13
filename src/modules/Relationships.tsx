import { useState } from "react";
import {
  Phone,
  MessageCircle,
  ArrowUpRight,
  Plus,
  LayoutGrid,
  List,
  Calendar,
  MapPin,
  UserRound,
  FileText,
  Clock,
  MoreHorizontal,
  GripVertical,
  Star,
} from "lucide-react";
import { useApp } from "../store";
import {
  type Page,
  type Lead,
  type Customer,
  stages as defaultStages,
  vocabulary,
  money,
  balance,
  paid,
  invoiceTotal,
  invoiceStatus,
  quoteTotal,
  today,
} from "../domain";
import {
  Heading,
  Panel,
  Table,
  Badge,
  Avatar,
  Btn,
  Tabs,
  DetailHeader,
  Timeline,
  Info,
  Empty,
  Drawer,
  Form,
  Metric,
  ExportButton,
} from "../components/ui";
export function ContactActions({ phone }: { phone: string }) {
  const { toast } = useApp();
  return (
    <div className="actions">
      <Btn
        small
        onClick={() =>
          toast(
            phone
              ? `Call shortcut preview: ${phone}`
              : "Add a contact number before calling.",
          )
        }
      >
        <Phone size={14} />
        Call
      </Btn>
      <Btn
        small
        onClick={() =>
          toast(
            phone
              ? `WhatsApp shortcut preview: ${phone}. No message sent.`
              : "Add a WhatsApp number to this record.",
          )
        }
      >
        <MessageCircle size={14} />
        WhatsApp
      </Btn>
    </div>
  );
}
export function Related({
  kind,
  customerId,
  jobId,
}: {
  kind: string;
  customerId?: string;
  jobId?: string;
}) {
  const { state: s, go } = useApp();
  const rows = (
    kind === "Leads"
      ? s.leads
      : kind === "Quotations"
        ? s.quotes
        : kind === "Jobs"
          ? s.jobs
          : kind === "Invoices"
            ? s.invoices
            : s.payments
  ).filter((r: any) =>
    customerId
      ? r.customerId === customerId ||
        ("recordId" in r &&
          s.invoices.some(
            (i) => i.customerId === customerId && i.id === r.recordId,
          ))
      : r.jobId === jobId ||
        (r.recordId &&
          s.invoices.some((i) => i.jobId === jobId && i.id === r.recordId)),
  );
  const page: Page =
    kind === "Jobs"
      ? "Jobs & Projects"
      : kind === "Invoices"
        ? "Invoices & Receipts"
        : kind === "Payments"
          ? "Invoices & Receipts"
          : (kind as Page);
  return (
    <Table
      rows={rows}
      onRow={(r) => go(page, "recordId" in r ? r.recordId : r.id)}
      columns={[
        {
          key: "id",
          label: "Reference",
          render: (r) => <span className="reference">{r.id}</span>,
        },
        {
          key: "title",
          label: "Record",
          render: (r: any) =>
            r.title || r.requirements || r.notes || r.kind || r.id,
        },
        {
          key: "status",
          label: "Status",
          render: (r: any) => (
            <Badge>
              {r.stage ||
                ("due" in r ? invoiceStatus(s, r) : r.status) ||
                "Recorded"}
            </Badge>
          ),
        },
        {
          key: "value",
          label: "Amount",
          numeric: true,
          render: (r: any) =>
            money(
              "version" in r
                ? quoteTotal(r)
                : "due" in r
                  ? invoiceTotal(r)
                  : (r.value ?? r.amount ?? 0),
            ),
        },
      ]}
    />
  );
}
export function Leads() {
  const { state: s, recordId, go, openCreate, save, confirm } = useApp();
  const [view, setView] = useState("Pipeline"),
    [filter, setFilter] = useState("all"),
    [query, setQuery] = useState(""),
    [tab, setTab] = useState("Overview"),
    [lost, setLost] = useState(false);
  const lead = s.leads.find((l) => l.id === recordId);
  const stages = vocabulary(s, "Pipeline stages", defaultStages);
  const name = (l: Lead) =>
    s.customers.find((c) => c.id === l.customerId)?.name || "Customer";
  const service = (l: Lead) =>
    s.services.find((c) => c.id === l.serviceId)?.name || "";
  const change = (l: Lead, stage: string) => {
    if (stage === "Lost") {
      go("Leads", l.id);
      setLost(true);
    } else save("leads", { ...l, stage }, `Lead moved to ${stage}`);
  };
  if (lead) {
    const c = s.customers.find((c) => c.id === lead.customerId)!;
    return (
      <>
        <DetailHeader
          title={c.name}
          reference={`${lead.id} · ${service(lead)}`}
          status={lead.stage}
          back="Leads"
          actions={
            <>
              <Btn onClick={() => openCreate("lead", lead)}>Edit inquiry</Btn>
              <Btn primary onClick={() => openCreate("quotation", lead)}>
                <FileText size={16} />
                Prepare quotation
              </Btn>
            </>
          }
        />
        <div className="detail-layout">
          <div>
            <Tabs
              tabs={["Overview", "Activity", "Quotations", "Attachments"]}
              value={tab}
              onChange={setTab}
            />
            {tab === "Overview" && (
              <>
                <Panel
                  title="The customer’s request"
                  action={<span className="mini-tag">{lead.source}</span>}
                >
                  <div className="padded">
                    <h2 className="request-title">{lead.requirements}</h2>
                    <div className="detail-facts">
                      <div>
                        <label>Expected value</label>
                        <strong>{money(lead.value)}</strong>
                      </div>
                      <div>
                        <label>Assigned to</label>
                        <strong>{lead.assigned}</strong>
                      </div>
                      <div>
                        <label>Priority</label>
                        <Badge>{lead.priority}</Badge>
                      </div>
                      <div>
                        <label>Campaign</label>
                        <strong>
                          {s.campaigns.find((cp) => cp.id === lead.campaignId)
                            ?.name || "Unattributed"}
                        </strong>
                      </div>
                    </div>
                  </div>
                </Panel>
                <Panel
                  title="Internal notes"
                  action={
                    <Btn
                      small
                      onClick={() =>
                        openCreate("note", {
                          record: lead,
                          collection: "leads",
                        })
                      }
                    >
                      <Plus size={14} />
                      Add note
                    </Btn>
                  }
                >
                  {lead.notes.length ? (
                    <Timeline
                      items={lead.notes.map((n) => ({
                        title: n,
                        date: "Internal conversation note",
                      }))}
                    />
                  ) : (
                    <Empty
                      title="Keep the conversation together"
                      message="Add site observations, requests or call notes."
                    />
                  )}
                </Panel>
              </>
            )}
            {tab === "Activity" && (
              <Panel title="Conversation history">
                <Timeline
                  items={[
                    {
                      title: "Inquiry received",
                      detail: `${lead.source} · ${lead.requirements}`,
                      date: lead.date,
                    },
                    {
                      title: `Current stage: ${lead.stage}`,
                      detail: lead.lostReason || `Assigned to ${lead.assigned}`,
                    },
                    ...lead.notes.map((n) => ({ title: n })),
                  ]}
                />
              </Panel>
            )}
            {tab === "Quotations" && (
              <Panel title="Linked quotations">
                <Related kind="Quotations" customerId={lead.customerId} />
              </Panel>
            )}
            {tab === "Attachments" && (
              <Panel title="Site documents & photos">
                <Empty
                  title="Add context to this inquiry"
                  message="Attachment storage is a future backend feature."
                  action={<Btn disabled>Upload unavailable in lead demo</Btn>}
                />
              </Panel>
            )}
          </div>
          <div className="detail-aside">
            <Panel title="Move the conversation forward">
              <div className="padded">
                <label className="field">
                  <span>Sales stage</span>
                  <select
                    value={lead.stage}
                    onChange={(e) => change(lead, e.target.value)}
                  >
                    {stages.map((st) => (
                      <option key={st}>{st}</option>
                    ))}
                  </select>
                </label>
                <div className="next-action">
                  <Clock size={19} />
                  <div>
                    <strong>
                      {lead.followUp
                        ? "Follow-up scheduled"
                        : "Set the next step"}
                    </strong>
                    <p>{lead.followUp || "Keep this opportunity moving."}</p>
                  </div>
                </div>
                <Btn onClick={() => openCreate("followup", lead)}>
                  <Calendar size={15} />
                  Schedule follow-up
                </Btn>
              </div>
            </Panel>
            <Panel title="Customer">
              <div className="padded">
                <div className="person">
                  <Avatar name={c.name} />
                  <div>
                    <strong>{c.name}</strong>
                    <small>{c.type}</small>
                  </div>
                </div>
                <p className="muted">
                  {c.phone || "Contact number not provided"}
                </p>
                <ContactActions phone={c.phone} />
                <button
                  className="text-btn"
                  onClick={() => go("Customers", c.id)}
                >
                  Open customer profile
                  <ArrowUpRight size={14} />
                </button>
              </div>
            </Panel>
          </div>
        </div>
        {lost && (
          <Drawer
            title="Close this opportunity"
            subtitle="Capture what we can learn from this conversation."
            onClose={() => setLost(false)}
          >
            <Form
              fields={[
                {
                  name: "reason",
                  label: "Why was the lead lost?",
                  required: true,
                  type: "textarea",
                },
              ]}
              onSubmit={(d) => {
                save(
                  "leads",
                  { ...lead, stage: "Lost", lostReason: d.reason },
                  "Lead marked lost",
                );
                setLost(false);
              }}
              label="Record lost reason"
            />
          </Drawer>
        )}
      </>
    );
  }
  const rows = s.leads.filter(
    (l) =>
      (filter === "all" ||
        (filter === "followups" &&
          l.followUp &&
          l.followUp <= today &&
          !["Won", "Lost"].includes(l.stage)) ||
        l.stage === filter) &&
      (name(l) + " " + service(l) + " " + l.requirements)
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  const open = rows.filter((l) => !["Won", "Lost"].includes(l.stage));
  return (
    <>
      <Heading
        eyebrow="SALES & RELATIONSHIPS"
        title="Every conversation, an opportunity."
        description="A clear path from the first hello to approved work."
        actions={
          <>
            <ExportButton rows={s.leads} name="leads" />
            <Btn primary onClick={() => openCreate("lead")}>
              <Plus size={16} />
              Capture lead
            </Btn>
          </>
        }
      />
      <div className="crm-summary">
        <div>
          <span>Open pipeline</span>
          <strong>{money(open.reduce((a, l) => a + l.value, 0))}</strong>
        </div>
        <div>
          <span>Opportunities</span>
          <strong>{open.length}</strong>
        </div>
        <div>
          <span>Follow-ups due</span>
          <strong>
            {
              s.leads.filter(
                (l) =>
                  l.followUp &&
                  l.followUp <= today &&
                  !["Won", "Lost"].includes(l.stage),
              ).length
            }
          </strong>
        </div>
        <div>
          <span>Won this month</span>
          <strong>{s.leads.filter((l) => l.stage === "Won").length}</strong>
        </div>
      </div>
      <div className="workspace-toolbar">
        <Tabs tabs={["Pipeline", "List"]} value={view} onChange={setView} />
        <div className="actions">
          <label className="search-field">
            <input
              aria-label="Search lead names or services"
              placeholder="Find a conversation…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <select
            aria-label="Filter lead stage"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All stages</option>
            <option value="followups">Follow-ups due</option>
            {stages.map((st) => (
              <option key={st}>{st}</option>
            ))}
          </select>
        </div>
      </div>
      {view === "Pipeline" ? (
        <div className="kanban">
          {stages.map((stage, i) => (
            <section
              key={stage}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                const l = s.leads.find(
                  (l) => l.id === e.dataTransfer.getData("text/plain"),
                );
                if (l) change(l, stage);
              }}
            >
              <div className="kanban-heading">
                <span className={`stage-dot stage-${i}`} />
                <h3>{stage}</h3>
                <span>{rows.filter((l) => l.stage === stage).length}</span>
              </div>
              <small className="kanban-value">
                {money(
                  rows
                    .filter((l) => l.stage === stage)
                    .reduce((a, l) => a + l.value, 0),
                )}
              </small>
              <div className="kanban-cards">
                {rows
                  .filter((l) => l.stage === stage)
                  .map((l) => (
                    <article
                      key={l.id}
                      draggable
                      onDragStart={(e) =>
                        e.dataTransfer.setData("text/plain", l.id)
                      }
                      className="lead-card"
                    >
                      <button
                        className="lead-card-main"
                        onClick={() => go("Leads", l.id)}
                      >
                        <span className="card-source">
                          {l.source}
                          <ArrowUpRight size={14} />
                        </span>
                        <h3>{name(l)}</h3>
                        <p>{l.requirements}</p>
                        <span className="service-chip">{service(l)}</span>
                        <strong className="lead-value">{money(l.value)}</strong>
                        <div className="lead-card-footer">
                          <Avatar name={l.assigned} />
                          <span
                            className={
                              l.followUp && l.followUp <= today
                                ? "overdue-text"
                                : ""
                            }
                          >
                            <Calendar size={12} />
                            {l.followUp || "No follow-up"}
                          </span>
                        </div>
                      </button>
                      <select
                        aria-label={`Change stage for ${name(l)}`}
                        value={l.stage}
                        onChange={(e) => change(l, e.target.value)}
                      >
                        {stages.map((st) => (
                          <option key={st}>{st}</option>
                        ))}
                      </select>
                    </article>
                  ))}
              </div>
              <button className="kanban-add" onClick={() => openCreate("lead")}>
                <Plus size={13} />
                Add inquiry
              </button>
            </section>
          ))}
        </div>
      ) : (
        <Panel>
          <Table
            rows={rows}
            noSearch
            onRow={(l) => go("Leads", l.id)}
            columns={[
              {
                key: "customerId",
                label: "Customer",
                render: (l) => (
                  <div className="person">
                    <Avatar name={name(l)} />
                    <div>
                      <strong>{name(l)}</strong>
                      <small>{l.id}</small>
                    </div>
                  </div>
                ),
                value: name,
              },
              {
                key: "serviceId",
                label: "Service",
                render: service,
                value: service,
              },
              { key: "source", label: "Source" },
              {
                key: "value",
                label: "Expected value",
                numeric: true,
                render: (l) => money(l.value),
              },
              { key: "assigned", label: "Owner" },
              {
                key: "followUp",
                label: "Follow-up",
                render: (l) => (
                  <span
                    className={
                      l.followUp && l.followUp <= today ? "overdue-text" : ""
                    }
                  >
                    {l.followUp || "—"}
                  </span>
                ),
              },
              {
                key: "stage",
                label: "Stage",
                render: (l) => <Badge>{l.stage}</Badge>,
              },
            ]}
          />
        </Panel>
      )}
    </>
  );
}
export function Customers() {
  const { state: s, recordId, go, openCreate } = useApp();
  const [tab, setTab] = useState("Overview"),
    [type, setType] = useState("all");
  const c = s.customers.find((c) => c.id === recordId);
  const outstanding = (id: string) =>
    s.invoices
      .filter(
        (i) => i.customerId === id && !["Draft", "Voided"].includes(i.status),
      )
      .reduce((a, i) => a + balance(s, i), 0);
  if (c) {
    const jobs = s.jobs.filter((j) => j.customerId === c.id);
    return (
      <>
        <DetailHeader
          title={c.name}
          reference={`${c.id} · ${c.type}`}
          back="Customers"
          actions={
            <>
              <Btn onClick={() => openCreate("customer", c)}>Edit customer</Btn>
              <Btn
                primary
                onClick={() => openCreate("quotation", { customerId: c.id })}
              >
                <Plus size={16} />
                New quotation
              </Btn>
            </>
          }
        />
        <div className="customer-hero">
          <Avatar name={c.name} large />
          <div>
            <strong>{c.type}</strong>
            <p>
              {c.email || "Email not provided"} ·{" "}
              {c.phone || "Phone not provided"}
            </p>
            <ContactActions phone={c.phone} />
          </div>
          <div className="customer-stat">
            <span>Properties</span>
            <strong>{c.properties.length}</strong>
          </div>
          <div className="customer-stat">
            <span>Jobs</span>
            <strong>{jobs.length}</strong>
          </div>
          <div className="customer-stat">
            <span>Outstanding</span>
            <strong>{money(outstanding(c.id))}</strong>
          </div>
        </div>
        <Tabs
          tabs={[
            "Overview",
            "Properties",
            "Leads",
            "Quotations",
            "Jobs",
            "Invoices",
            "Payments",
            "Documents",
            "Activity",
          ]}
          value={tab}
          onChange={setTab}
        />
        {tab === "Overview" ? (
          <div className="two-col">
            <Panel
              title="Properties & service history"
              action={
                <Btn
                  small
                  onClick={() => openCreate("property", { customer: c })}
                >
                  <Plus size={14} />
                  Add property
                </Btn>
              }
            >
              <div className="property-list">
                {c.properties.map((p) => (
                  <div className="property-card" key={p.id}>
                    <span className="property-icon">
                      <MapPin size={19} />
                    </span>
                    <div>
                      <strong>{p.name}</strong>
                      <p>{p.address}</p>
                      <small>
                        {p.type} ·{" "}
                        {jobs.filter((j) => j.propertyId === p.id).length}{" "}
                        linked jobs
                      </small>
                    </div>
                    <button
                      className="text-btn"
                      onClick={() =>
                        openCreate("property", { customer: c, property: p })
                      }
                    >
                      Edit
                    </button>
                  </div>
                ))}
              </div>
              {!c.properties.length && (
                <Empty
                  title="Add the first property"
                  action={
                    <Btn
                      onClick={() => openCreate("property", { customer: c })}
                    >
                      Add property
                    </Btn>
                  }
                />
              )}
            </Panel>
            <Panel title="Relationship notes">
              <div className="padded">
                <p>{c.notes || "No internal notes yet."}</p>
                <Info>
                  Customer details are reused in new leads, quotations and
                  invoices.
                </Info>
                <Btn onClick={() => openCreate("lead", { customerId: c.id })}>
                  <Plus size={15} />
                  New service inquiry
                </Btn>
              </div>
            </Panel>
          </div>
        ) : tab === "Properties" ? (
          <Panel
            title="All properties"
            action={
              <Btn
                small
                onClick={() => openCreate("property", { customer: c })}
              >
                Add property
              </Btn>
            }
          >
            <div className="property-list">
              {c.properties.map((p) => (
                <div key={p.id} className="property-card">
                  <MapPin size={20} />
                  <div>
                    <h3>{p.name}</h3>
                    <p>{p.address}</p>
                    <small>{p.instructions || "No access instructions"}</small>
                  </div>
                  <Btn
                    small
                    onClick={() =>
                      openCreate("property", { customer: c, property: p })
                    }
                  >
                    Edit
                  </Btn>
                </div>
              ))}
            </div>
          </Panel>
        ) : ["Leads", "Quotations", "Jobs", "Invoices", "Payments"].includes(
            tab,
          ) ? (
          <Panel title={`Customer ${tab.toLowerCase()}`}>
            <Related kind={tab} customerId={c.id} />
          </Panel>
        ) : tab === "Activity" ? (
          <Panel title="Relationship history">
            <Timeline
              items={[
                { title: "Customer record created", detail: c.type },
                ...jobs.map((j) => ({
                  title: j.title,
                  detail: j.status,
                  date: j.start,
                })),
                ...s.payments
                  .filter((p) =>
                    s.invoices.some(
                      (i) => i.id === p.recordId && i.customerId === c.id,
                    ),
                  )
                  .map((p) => ({
                    title: "Payment received",
                    detail: money(p.amount),
                    date: p.date,
                  })),
              ]}
            />
          </Panel>
        ) : (
          <Panel title="Documents">
            <Related kind="Quotations" customerId={c.id} />
            <Related kind="Invoices" customerId={c.id} />
          </Panel>
        )}
      </>
    );
  }
  const rows = s.customers.filter((c) => type === "all" || c.type === type);
  return (
    <>
      <Heading
        eyebrow="SALES & RELATIONSHIPS"
        title="Relationships worth keeping."
        description="One customer. Every property, conversation and project."
        actions={
          <Btn primary onClick={() => openCreate("customer")}>
            <Plus size={16} />
            New customer
          </Btn>
        }
      />
      <Panel>
        <Table
          rows={rows}
          searchPlaceholder="Search customers, properties or locality…"
          toolbar={
            <select
              aria-label="Customer type"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              <option value="all">All customer types</option>
              {[
                "Homeowner",
                "Business",
                "Property manager",
                "Commercial client",
              ].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          }
          onRow={(c) => go("Customers", c.id)}
          columns={[
            {
              key: "name",
              label: "Customer",
              render: (c) => (
                <div className="person">
                  <Avatar name={c.name} />
                  <div>
                    <strong>{c.name}</strong>
                    <small>{c.email || "Contact details not provided"}</small>
                  </div>
                </div>
              ),
            },
            { key: "type", label: "Type" },
            {
              key: "properties",
              label: "Properties",
              render: (c) => c.properties.length,
              numeric: true,
              value: (c) => c.properties.length,
            },
            {
              key: "jobs",
              label: "Jobs",
              render: (c) => s.jobs.filter((j) => j.customerId === c.id).length,
              numeric: true,
            },
            {
              key: "outstanding",
              label: "Outstanding",
              numeric: true,
              render: (c) => (
                <span className={outstanding(c.id) > 0 ? "overdue-text" : ""}>
                  {money(outstanding(c.id))}
                </span>
              ),
              value: (c) => outstanding(c.id),
            },
            {
              key: "locality",
              label: "Primary property",
              render: (c) =>
                c.properties[0]?.address.split(" •")[0] || "Add a property",
            },
          ]}
        />
      </Panel>
    </>
  );
}
