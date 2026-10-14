import { useState } from "react";
import {
  Plus,
  ShieldCheck,
  Check,
  Minus,
  ArrowUpRight,
  Users,
  LockKeyhole,
  Settings as SettingsIcon,
  FileText,
  Receipt,
  HardHat,
  Printer,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { useApp } from "../store";
import { permissions, type Role, type Page, money, uid } from "../domain";
import {
  Heading,
  Panel,
  Table,
  Btn,
  Badge,
  Avatar,
  Tabs,
  Info,
  Form,
  Drawer,
  Timeline,
} from "../components/ui";
import { DocumentPreview } from "../components/Documents";
export function Team() {
  const { state: s, openCreate, setRole, save, confirm } = useApp();
  const [tab, setTab] = useState("Team directory");
  const roles = [
    "Owner",
    "Finance Manager",
    "Operations Manager",
    "Sales Staff",
  ] as Role[];
  return (
    <>
      <Heading
        eyebrow="WORKSPACE ADMINISTRATION"
        title="Good systems start with clear responsibility."
        description="The right workspace, for the right people."
        actions={
          <Btn primary onClick={() => openCreate("team")}>
            <Plus size={16} />
            Invite team member
          </Btn>
        }
      />
      <Tabs
        tabs={["Team directory", "Permission matrix", "Role preview"]}
        value={tab}
        onChange={setTab}
      />
      {tab === "Team directory" ? (
        <Panel>
          <Table
            rows={s.team}
            onRow={(t) => openCreate("team", t)}
            columns={[
              {
                key: "name",
                label: "Team member",
                render: (t) => (
                  <div className="person">
                    <Avatar name={t.name} />
                    <div>
                      <strong>{t.name}</strong>
                      <small>
                        {t.email || "Owner account • demonstration"}
                      </small>
                    </div>
                  </div>
                ),
              },
              {
                key: "role",
                label: "Role",
                render: (t) => (
                  <span className="role-pill">
                    <ShieldCheck size={13} />
                    {t.role}
                  </span>
                ),
              },
              {
                key: "status",
                label: "Access",
                render: (t) => <Badge>{t.status}</Badge>,
              },
              {
                key: "actions",
                label: "Manage",
                render: (t) => (
                  <button
                    className="text-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      confirm(
                        t.status === "Suspended"
                          ? "Restore member?"
                          : "Suspend member?",
                        `${t.name} will ${t.status === "Suspended" ? "regain" : "lose"} access in this simulation.`,
                        () =>
                          save(
                            "team",
                            {
                              ...t,
                              status:
                                t.status === "Suspended"
                                  ? "Active"
                                  : "Suspended",
                            },
                            "Member access updated",
                          ),
                      );
                    }}
                    disabled={t.role === "Owner"}
                  >
                    {t.role === "Owner"
                      ? "Owner protected"
                      : t.status === "Suspended"
                        ? "Restore"
                        : "Suspend"}
                  </button>
                ),
              },
            ]}
          />
        </Panel>
      ) : tab === "Permission matrix" ? (
        <>
          <Info>
            These are frontend access rules. Real account authorization and
            security enforcement require the backend phase.
          </Info>
          <Panel>
            <div className="table-scroll">
              <table className="permission-table">
                <thead>
                  <tr>
                    <th>Module access</th>
                    {roles.map((r) => (
                      <th key={r}>{r}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {permissions.Owner.map((p) => (
                    <tr key={p}>
                      <td>{p}</td>
                      {roles.map((r) => (
                        <td key={r}>
                          {permissions[r].includes(p) ? (
                            <Check size={17} className="success-text" />
                          ) : (
                            <Minus size={16} className="muted" />
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
          <Info>
            Finance actions require Owner or Finance Manager. Internal costs are
            hidden from Sales Staff. Issued documents preserve their scope.
          </Info>
        </>
      ) : (
        <div className="role-cards">
          {roles.map((r) => (
            <Panel key={r}>
              <div className="padded">
                <ShieldCheck size={26} />
                <h3>{r}</h3>
                <p>{permissions[r].length} accessible modules</p>
                <Btn onClick={() => setRole(r)}>
                  Preview this workspace
                  <ArrowUpRight size={14} />
                </Btn>
              </div>
            </Panel>
          ))}
        </div>
      )}
    </>
  );
}
export function Settings() {
  const { state: s, mutate, confirm, reset } = useApp();
  const [tab, setTab] = useState("Company identity"),
    [config, setConfig] = useState("Pricing units"),
    [entry, setEntry] = useState("");
  const lists = s.settings.vocabulary || {
    "Pricing units": [
      "sq ft",
      "running ft",
      "unit",
      "point",
      "sheet",
      "day",
      "visit",
      "project",
    ],
    "Expense categories": [
      "Materials",
      "Transportation",
      "Tools and equipment",
      "Marketing",
      "Office expenses",
      "Salaries",
      "Utilities",
      "Rent",
      "Miscellaneous",
    ],
    "Lead sources": [
      "WhatsApp",
      "Facebook",
      "Instagram",
      "Website",
      "Phone call",
      "Referral",
      "Returning customer",
      "Other",
    ],
    "Pipeline stages": [
      "New",
      "Contacted",
      "Qualified",
      "Site Visit",
      "Quotation Sent",
      "Negotiation",
      "Won",
      "Lost",
    ],
    "Job statuses": [
      "Scheduled",
      "In Progress",
      "On Hold",
      "Awaiting Materials",
      "Awaiting Client Approval",
      "Completed",
      "Closed",
      "Cancelled",
    ],
  };
  const saveLists = (next: Record<string, string[]>) =>
    mutate(
      (st) => ({ ...st, settings: { ...st.settings, vocabulary: next } }),
      "Business configuration updated",
    );
  return (
    <>
      <Heading
        eyebrow="WORKSPACE SETTINGS"
        title="Made to fit your business."
        description="Configure the company identity and defaults used throughout the workspace."
      />
      <Tabs
        tabs={[
          "Company identity",
          "Document defaults",
          "Business configuration",
          "Notifications",
          "Demo controls",
        ]}
        value={tab}
        onChange={setTab}
      />
      {tab === "Company identity" && (
        <div className="settings-layout">
          <Panel title="Your company, consistently represented">
            <div className="padded">
              <Form
                initial={s.settings}
                fields={[
                  { name: "name", label: "Company name", required: true },
                  { name: "tagline", label: "Tagline", required: true },
                  {
                    name: "address",
                    label: "Company address",
                    type: "textarea",
                    hint: "Leave blank until verified.",
                  },
                  { name: "phone", label: "Contact / WhatsApp", type: "tel" },
                  { name: "email", label: "Company email", type: "email" },
                  {
                    name: "currency",
                    label: "Currency",
                    options: [
                      { value: "PKR", label: "PKR • Pakistani Rupees" },
                    ],
                    required: true,
                  },
                ]}
                onSubmit={(d) =>
                  mutate(
                    (st) => ({ ...st, settings: { ...st.settings, ...d } }),
                    "Company settings saved",
                  )
                }
                label="Save identity"
              />
            </div>
          </Panel>
          <div>
            <Panel title="Brand direction">
              <div className="padded">
                <div className="brand-preview">
                  <img
                    src="/assets/mark.svg"
                    alt="Doctor Maintenance brand mark"
                  />
                  <strong>{s.settings.name}</strong>
                  <small>{s.settings.tagline}</small>
                </div>
                <div className="color-swatches">
                  <span style={{ background: "#181B19" }} />
                  <span style={{ background: "#B3925A" }} />
                  <span style={{ background: "#F7F6F2" }} />
                  <span style={{ background: "#ffffff" }} />
                </div>
                <p>
                  Charcoal, warm gold and ivory. Restrained accents for a calm,
                  considered workspace.
                </p>
              </div>
            </Panel>
            <Info>
              Company contact details remain blank until you provide them.
              Documents display a configuration placeholder.
            </Info>
          </div>
        </div>
      )}
      {tab === "Document defaults" && (
        <Panel title="Consistent documents, less repeated work">
          <div className="padded">
            <Form
              initial={s.settings}
              fields={[
                {
                  name: "quotePrefix",
                  label: "Quotation numbering prefix",
                  required: true,
                },
                {
                  name: "invoicePrefix",
                  label: "Invoice numbering prefix",
                  required: true,
                },
                {
                  name: "terms",
                  label: "Default commercial terms",
                  type: "textarea",
                  required: true,
                },
              ]}
              onSubmit={(d) =>
                mutate(
                  (st) => ({ ...st, settings: { ...st.settings, ...d } }),
                  "Document defaults saved",
                )
              }
              label="Save defaults"
            />
            <GoServices />
            <Info>
              Service-specific conditions are managed in Services & Rates →
              Quotation terms. New quotations use these defaults. Issued
              documents keep their saved terms and pricing. Each payment
              schedule remains editable in the quotation studio.
            </Info>
          </div>
        </Panel>
      )}
      {tab === "Business configuration" && (
        <div className="settings-layout">
          <Panel title="Flexible business vocabulary">
            <div className="padded">
              <Tabs
                tabs={Object.keys(lists)}
                value={config}
                onChange={setConfig}
              />
              <div className="configuration-list">
                {(lists[config] || []).map((x) => (
                  <div key={x}>
                    <span>{x}</span>
                    <button
                      aria-label={`Remove ${x}`}
                      disabled={[
                        "Won",
                        "Lost",
                        "Completed",
                        "Closed",
                        "Cancelled",
                        "Marketing",
                      ].includes(x)}
                      onClick={() =>
                        saveLists({
                          ...lists,
                          [config]: lists[config].filter((y) => y !== x),
                        })
                      }
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
              <form
                className="actions"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (entry.trim() && !lists[config].includes(entry.trim())) {
                    saveLists({
                      ...lists,
                      [config]: [...lists[config], entry.trim()],
                    });
                    entry && setEntry("");
                  }
                }}
              >
                <input
                  placeholder={`Add ${config.toLowerCase().replace("custom ", "").replace(/s$/, "")}…`}
                  aria-label="New configuration entry"
                  value={entry}
                  onChange={(e) => setEntry(e.target.value)}
                  required
                />
                <button type="submit" className="btn primary">
                  <Plus size={15} />
                  Add
                </button>
              </form>
              <Info>
                Changes appear in create forms and pipeline views immediately.
                Terminal stages and the Marketing category keep their core
                meaning. Pricing units can also be entered directly.
              </Info>
            </div>
          </Panel>
          <Panel title="Service categories">
            <div className="padded">
              <p>
                Manage active services, names, units, material-inclusive rates
                and labour-only rates in the service catalog.
              </p>
              <GoServices />
            </div>
          </Panel>
        </div>
      )}
      {tab === "Notifications" && (
        <Panel title="Keep the right priorities in view">
          <div className="padded">
            {[
              "Follow-ups due",
              "Overdue customer invoices",
              "Job budget overruns",
              "Contractor payment requests",
              "Upcoming handovers",
            ].map((n) => (
              <label className="notification-setting" key={n}>
                <div>
                  <strong>{n}</strong>
                  <small>In-app demonstration notification</small>
                </div>
                <input
                  type="checkbox"
                  checked={s.settings.notifications?.[n] ?? true}
                  aria-label={n}
                  onChange={(e) =>
                    mutate(
                      (st) => ({
                        ...st,
                        settings: {
                          ...st.settings,
                          notifications: {
                            ...st.settings.notifications,
                            [n]: e.target.checked,
                          },
                        },
                      }),
                      "Notification preference updated",
                    )
                  }
                />
              </label>
            ))}
            <Info>
              Email, WhatsApp and push delivery are not connected in this
              frontend phase.
            </Info>
          </div>
        </Panel>
      )}
      {tab === "Demo controls" && (
        <Panel title="Your preview workspace">
          <div className="padded">
            <Info>
              All records are fictitious. Changes persist in this browser only
              and do not sync between devices.
            </Info>
            <Btn
              onClick={() =>
                confirm(
                  "Restore demonstration data?",
                  "This removes locally created demo records and restores the original sample workspace.",
                  reset,
                )
              }
            >
              <RotateCcw size={15} />
              Reset demo records
            </Btn>
            <Btn disabled>Backend connection — future phase</Btn>
          </div>
        </Panel>
      )}
    </>
  );
}
function GoServices() {
  const { go } = useApp();
  return (
    <Btn onClick={() => go("Services & Rates")}>
      Manage services & quotation terms
      <ArrowUpRight size={15} />
    </Btn>
  );
}
export function Templates() {
  const { state: s, mutate, toast } = useApp();
  const [type, setType] = useState("Quotation"),
    [editing, setEditing] = useState(false),
    [terms, setTerms] = useState(s.settings.terms);
  const sampleQuote = { ...s.quotes[0], terms: s.settings.terms };
  const sampleInvoice = { ...s.invoices[0], notes: s.settings.terms };
  const receipt = s.payments.find((p) => p.kind === "Customer receipt")!;
  const job = s.jobs[0];
  return (
    <>
      <Heading
        eyebrow="DOCUMENT SYSTEM"
        title="Care, in every detail."
        description="A consistent, premium document language from first quotation to final receipt."
        actions={
          <>
            <Btn onClick={() => window.print()}>
              <Printer size={15} />
              Print / PDF
            </Btn>
            <Btn primary onClick={() => setEditing(true)}>
              Edit default terms
            </Btn>
          </>
        }
      />
      <div className="template-layout">
        <aside className="template-picker">
          {[
            {
              name: "Quotation",
              icon: FileText,
              desc: "Scope, pricing and payment milestones",
            },
            {
              name: "Invoice",
              icon: Receipt,
              desc: "Customer billing and outstanding balances",
            },
            {
              name: "Receipt",
              icon: Check,
              desc: "Confirmation of payments received",
            },
            {
              name: "Work order",
              icon: HardHat,
              desc: "Contractor assignment and agreed scope",
            },
          ].map((t) => (
            <button
              key={t.name}
              className={type === t.name ? "selected" : ""}
              onClick={() => setType(t.name)}
            >
              <t.icon size={21} />
              <div>
                <strong>{t.name}</strong>
                <small>{t.desc}</small>
              </div>
              <ArrowUpRight size={14} />
            </button>
          ))}
          <Info>
            Internal costing stays off client documents. Work orders are clearly
            labeled as contractor copies.
          </Info>
        </aside>
        <div className="template-preview">
          <div className="preview-toolbar">
            <span>{type.toUpperCase()} TEMPLATE PREVIEW</span>
            <span>A4 · Demonstration data</span>
          </div>
          <DocumentPreview
            quote={type === "Quotation" ? sampleQuote : undefined}
            invoice={type === "Invoice" ? sampleInvoice : undefined}
            receipt={type === "Receipt" ? receipt : undefined}
            workOrder={
              type === "Work order"
                ? {
                    job,
                    contractorId: job.contractorIds[0],
                    id: "WO-DEMO",
                    scope:
                      "Cabinet fabrication, installation and finish as approved.",
                    budget: 80000,
                  }
                : undefined
            }
          />
        </div>
      </div>
      {editing && (
        <Drawer
          title="Reusable document defaults"
          onClose={() => setEditing(false)}
        >
          <label className="field">
            <span>Default commercial terms</span>
            <textarea
              rows={8}
              value={terms}
              onChange={(e) => setTerms(e.target.value)}
            />
          </label>
          <Info>
            New documents inherit these terms. Issued quotations retain their
            previous text.
          </Info>
          <Btn
            primary
            onClick={() => {
              mutate(
                (st) => ({ ...st, settings: { ...st.settings, terms } }),
                "Document template defaults saved",
              );
              setEditing(false);
            }}
          >
            Save template defaults
          </Btn>
        </Drawer>
      )}
    </>
  );
}
export function Audit() {
  const { state: s } = useApp();
  const [role, setRole] = useState("all");
  return (
    <>
      <Heading
        eyebrow="WORKSPACE ACTIVITY"
        title="A clear record of important decisions."
        description="Trace simulated updates, approvals and financial actions."
      />
      <Info>
        This is a frontend activity trail. Tamper-resistant audit logging will
        be implemented with the backend.
      </Info>
      <Panel title="Audit history">
        <Table
          rows={s.audit.filter((a) => role === "all" || a.role === role)}
          toolbar={
            <select
              aria-label="Audit role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="all">All roles</option>
              {[
                "Owner",
                "Finance Manager",
                "Operations Manager",
                "Sales Staff",
              ].map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          }
          columns={[
            { key: "message", label: "Action" },
            {
              key: "role",
              label: "Performed as",
              render: (a) => (
                <span className="role-pill">
                  <ShieldCheck size={13} />
                  {a.role}
                </span>
              ),
            },
            {
              key: "date",
              label: "Date & time",
              render: (a) =>
                new Date(a.date).toLocaleString("en-PK", {
                  timeZone: "Asia/Karachi",
                }),
            },
            { key: "id", label: "Reference" },
          ]}
        />
      </Panel>
    </>
  );
}
