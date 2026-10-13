import { useEffect, useState } from "react";
import {
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Printer,
  Copy,
  Check,
  Send,
  ArrowRight,
  FileText,
  Eye,
  LockKeyhole,
  History,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useApp, convertQuote } from "../store";
import {
  type Quote,
  type Invoice,
  type Item,
  quoteTotal,
  invoiceTotal,
  itemTotal,
  money,
  uid,
  pct,
  canCosts,
  canFinance,
  invoiceStatus,
  paid,
  balance,
  units,
  vocabulary,
  today,
} from "../domain";
import {
  Heading,
  Panel,
  Table,
  Badge,
  Btn,
  DetailHeader,
  Tabs,
  Info,
  Metric,
  Empty,
  Timeline,
} from "../components/ui";
import { DocumentPreview } from "../components/Documents";
export function Quotations() {
  const { state: s, recordId, go, openCreate } = useApp();
  const [filter, setFilter] = useState("all");
  const q = s.quotes.find((q) => q.id === recordId);
  if (q) return <QuoteStudio key={q.id} original={q} />;
  return (
    <>
      <Heading
        eyebrow="COMMERCIAL WORKSPACE"
        title="Good work starts with a clear scope."
        description="Build considered quotations. Keep every revision connected."
        actions={
          <Btn primary onClick={() => openCreate("quotation")}>
            <Plus size={16} />
            New quotation
          </Btn>
        }
      />
      <div className="metrics three">
        <Metric
          label="Awaiting response"
          value={money(
            s.quotes
              .filter((q) => q.status === "Issued")
              .reduce((a, q) => a + quoteTotal(q), 0),
          )}
          hint="Issued quotation value"
        />
        <Metric
          label="Accepted quotations"
          value={String(s.quotes.filter((q) => q.status === "Accepted").length)}
          hint="Ready for project delivery"
        />
        <Metric
          label="Acceptance rate"
          value={`${pct(s.quotes.filter((q) => q.status === "Accepted").length, s.quotes.filter((q) => !["Draft", "Ready for review"].includes(q.status)).length)}%`}
          hint="Accepted / non-draft quotations"
        />
      </div>
      <Panel>
        <Table
          rows={s.quotes.filter((q) => filter === "all" || q.status === filter)}
          onRow={(q) => go("Quotations", q.id)}
          toolbar={
            <select
              aria-label="Quotation status"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">All statuses</option>
              {[
                "Draft",
                "Ready for review",
                "Issued",
                "Accepted",
                "Rejected",
                "Expired",
              ].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          }
          columns={[
            {
              key: "title",
              label: "Project & quotation",
              render: (q) => (
                <div>
                  <strong>{q.title}</strong>
                  <small className="block muted">
                    {q.id} · Revision {q.version}
                  </small>
                </div>
              ),
            },
            {
              key: "customerId",
              label: "Customer",
              render: (q) =>
                s.customers.find((c) => c.id === q.customerId)?.name,
            },
            { key: "date", label: "Issued date" },
            {
              key: "total",
              label: "Quoted amount",
              numeric: true,
              render: (q) => money(quoteTotal(q)),
              value: quoteTotal,
            },
            { key: "validUntil", label: "Valid until" },
            {
              key: "status",
              label: "Status",
              render: (q) => <Badge>{q.status}</Badge>,
            },
          ]}
        />
      </Panel>
    </>
  );
}
function QuoteStudio({ original }: { original: Quote }) {
  const { state: s, save, mutate, confirm, go, toast } = useApp();
  const [q, setQ] = useState(structuredClone(original)),
    [section, setSection] = useState("Scope & pricing"),
    [mobileView, setMobileView] = useState("Edit"),
    [dirty, setDirty] = useState(false);
  const update = (patch: Partial<Quote>) => {
    setQ({ ...q, ...patch });
    setDirty(true);
  };
  const editable = ["Draft", "Ready for review"].includes(q.status);
  const total = quoteTotal(q),
    customer = s.customers.find((c) => c.id === q.customerId);
  const margin = pct(total - q.internalCost, total);
  const sum = q.milestones.reduce((a, m) => a + m.percentage, 0);
  const validate = () => {
    if (
      q.leadId &&
      s.leads.find((l) => l.id === q.leadId)?.customerId !== q.customerId
    )
      throw new Error(
        "This lead belongs to another customer. Select the original customer or create a new quotation.",
      );
    if (!q.title.trim() || !customer)
      throw new Error("Select a customer and add a project title.");
    if (
      q.items.length === 0 ||
      q.items.some(
        (i) => !i.description.trim() || i.quantity <= 0 || i.rate < 0,
      ) ||
      !Number.isFinite(total) ||
      total <= 0
    )
      throw new Error("Add valid line items with a positive total.");
    if (Math.abs(sum - 100) > 0.01)
      throw new Error("Payment milestones must add up to 100%.");
    if (
      q.discount < 0 ||
      q.discount > itemTotal(q.items) ||
      q.tax < 0 ||
      q.tax > 100
    )
      throw new Error("Check the discount and applicable tax rate.");
    if (q.validUntil < q.date)
      throw new Error("Validity must be on or after the issue date.");
  };
  const saveDraft = () => {
    try {
      validate();
      save("quotes", q, "Quotation saved");
      setDirty(false);
    } catch (e) {
      toast((e as Error).message);
    }
  };
  const issue = () => {
    try {
      validate();
      confirm(
        "Issue this quotation?",
        `${money(total)} will become the issued client quotation. Future edits require a new revision.`,
        () => {
          const next = { ...q, status: "Issued" };
          mutate(
            (st) => ({
              ...st,
              quotes: st.quotes.map((x) =>
                x.id === q.id
                  ? next
                  : x.id === q.parentId
                    ? { ...x, status: "Revised" }
                    : x,
              ),
              leads: st.leads.map((l) =>
                l.id === q.leadId ? { ...l, stage: "Quotation Sent" } : l,
              ),
            }),
            "Quotation issued",
          );
          setQ(next);
          setDirty(false);
        },
      );
    } catch (e) {
      toast((e as Error).message);
    }
  };
  const duplicate = (revision = false) => {
    const next = {
      ...structuredClone(q),
      id: uid(s.settings.quotePrefix),
      status: "Draft",
      version: revision ? q.version + 1 : 1,
      parentId: revision ? q.id : "",
      date: today,
    };
    save(
      "quotes",
      next,
      revision
        ? "New revision created • previous version preserved"
        : "Quotation duplicated",
    );
    go("Quotations", next.id);
  };
  const accept = () =>
    confirm(
      "Accept this quotation?",
      `Confirm customer acceptance of revision ${q.version}. The job will use this approved scope.`,
      () => {
        const next = { ...q, status: "Accepted" };
        save("quotes", next, "Quotation marked accepted");
        setQ(next);
      },
    );
  return (
    <>
      <DetailHeader
        title="Quotation studio"
        reference={`${q.id} · REVISION ${q.version}`}
        status={q.status}
        back="Quotations"
        actions={
          <>
            <Btn onClick={() => duplicate(false)}>
              <Copy size={15} />
              <span>Duplicate</span>
            </Btn>
            <Btn
              onClick={() => {
                setMobileView("Preview");
                requestAnimationFrame(() => window.print());
              }}
            >
              <Printer size={15} />
              Print / PDF
            </Btn>
            {editable ? (
              <>
                <Btn onClick={saveDraft}>Save draft{dirty ? " •" : ""}</Btn>
                <Btn primary onClick={issue}>
                  <Send size={15} />
                  Issue quotation
                </Btn>
              </>
            ) : q.status === "Issued" ? (
              <Btn primary onClick={accept}>
                <Check size={16} />
                Mark accepted
              </Btn>
            ) : q.status === "Accepted" ? (
              <Btn
                primary
                onClick={() => {
                  const existing = s.jobs.find((j) => j.quoteId === q.id);
                  if (existing) {
                    go("Jobs & Projects", existing.id);
                    return;
                  }
                  if (
                    mutate(
                      (st) => convertQuote(st, q),
                      "Quotation converted to a linked project",
                    )
                  ) {
                    go("Jobs & Projects");
                  }
                }}
              >
                {" "}
                {s.jobs.some((j) => j.quoteId === q.id)
                  ? "Open linked job"
                  : "Convert to job"}
                <ArrowRight size={15} />
              </Btn>
            ) : null}
          </>
        }
      />
      {!editable && (
        <Info>
          <LockKeyhole size={15} />
          This issued scope is preserved.{" "}
          <button className="text-btn" onClick={() => duplicate(true)}>
            Create revision {q.version + 1}
            <ArrowRight size={14} />
          </button>
          {q.status === "Issued" && (
            <button
              className="text-btn"
              onClick={() =>
                confirm(
                  "Reject quotation?",
                  "Record customer rejection of this version.",
                  () => {
                    const n = { ...q, status: "Rejected" };
                    save("quotes", n, "Quotation rejected");
                    setQ(n);
                  },
                )
              }
            >
              Mark rejected
            </button>
          )}
        </Info>
      )}
      <div className="studio-mobile-switch">
        <Tabs
          tabs={["Edit", "Preview"]}
          value={mobileView}
          onChange={setMobileView}
        />
      </div>
      <div
        className={`studio ${mobileView === "Preview" ? "preview-selected" : ""}`}
      >
        <section className="studio-editor">
          <div className="studio-top">
            <div>
              <span className="eyebrow">QUOTATION EDITOR</span>
              <strong>{q.title}</strong>
            </div>
            <span className="autosave">
              {dirty ? "Unsaved edits" : "Saved draft"}
            </span>
          </div>
          <Tabs
            tabs={[
              "Project",
              "Scope & pricing",
              "Payments & terms",
              "Internal & history",
            ]}
            value={section}
            onChange={setSection}
          />
          <fieldset disabled={!editable} className="editor-fields">
            {section === "Project" && (
              <>
                <div className="section-intro">
                  <span>01</span>
                  <div>
                    <h3>Customer & project</h3>
                    <p>Existing details, carried forward.</p>
                  </div>
                </div>
                <div className="form-grid">
                  <label className="field span-2">
                    <span>Customer</span>
                    <select
                      value={q.customerId}
                      onChange={(e) => {
                        const c = s.customers.find(
                          (c) => c.id === e.target.value,
                        )!;
                        update({
                          customerId: c.id,
                          propertyId: c.properties[0]?.id || "",
                        });
                      }}
                    >
                      {s.customers.map((c) => (
                        <option value={c.id} key={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="field span-2">
                    <span>Property</span>
                    <select
                      value={q.propertyId}
                      onChange={(e) => update({ propertyId: e.target.value })}
                    >
                      <option value="">To be confirmed</option>
                      {customer?.properties.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} · {p.address}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="field span-2">
                    <span>Project title</span>
                    <input
                      value={q.title}
                      onChange={(e) => update({ title: e.target.value })}
                    />
                  </label>
                  <label className="field span-2">
                    <span>Service</span>
                    <select
                      value={q.serviceId}
                      onChange={(e) => update({ serviceId: e.target.value })}
                    >
                      {s.services.map((sv) => (
                        <option key={sv.id} value={sv.id}>
                          {sv.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="field">
                    <span>Issue date</span>
                    <input
                      type="date"
                      value={q.date}
                      onChange={(e) => update({ date: e.target.value })}
                    />
                  </label>
                  <label className="field">
                    <span>Valid until</span>
                    <input
                      type="date"
                      value={q.validUntil}
                      onChange={(e) => update({ validUntil: e.target.value })}
                    />
                  </label>
                </div>
              </>
            )}
            {section === "Scope & pricing" && (
              <>
                <div className="section-intro">
                  <span>02</span>
                  <div>
                    <h3>A precise scope. A fair price.</h3>
                    <p>Rates are editable and stored with this quotation.</p>
                  </div>
                </div>
                <label className="field">
                  <span>Material arrangement</span>
                  <select
                    value={q.materials.split(" •")[0]}
                    onChange={(e) => update({ materials: e.target.value })}
                  >
                    {[
                      "With material",
                      "Without material",
                      "Partial material",
                      "Custom arrangement",
                    ].map((x) => (
                      <option key={x}>{x}</option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  <span>Material specifications</span>
                  <input
                    value={
                      q.materials.includes(" •")
                        ? q.materials.split(" •").slice(1).join(" •")
                        : ""
                    }
                    onChange={(e) =>
                      update({
                        materials:
                          q.materials.split(" •")[0] + " •" + e.target.value,
                      })
                    }
                    placeholder="e.g. Lasani ZRK sheets"
                  />
                </label>
                <LineEditor
                  items={q.items}
                  onChange={(items) => update({ items })}
                />
                <div className="form-grid">
                  <label className="field">
                    <span>Discount (PKR)</span>
                    <input
                      type="number"
                      min="0"
                      max={itemTotal(q.items)}
                      value={q.discount}
                      onChange={(e) =>
                        update({ discount: Number(e.target.value) })
                      }
                    />
                  </label>
                  <label className="field">
                    <span>Applicable tax (%)</span>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={q.tax}
                      onChange={(e) => update({ tax: Number(e.target.value) })}
                    />
                  </label>
                </div>
                <div className="pricing-summary">
                  <div>
                    <span>Subtotal</span>
                    <strong>{money(itemTotal(q.items))}</strong>
                  </div>
                  <div>
                    <span>Discount</span>
                    <span>−{money(q.discount)}</span>
                  </div>
                  <div className="total">
                    <span>Quotation total</span>
                    <strong>{money(total)}</strong>
                  </div>
                </div>
              </>
            )}
            {section === "Payments & terms" && (
              <>
                <div className="section-intro">
                  <span>03</span>
                  <div>
                    <h3>Clear expectations, from day one.</h3>
                    <p>Milestone percentages must total 100%.</p>
                  </div>
                </div>
                <div className="milestone-editor">
                  {q.milestones.map((m, i) => (
                    <div key={m.id}>
                      <span className="milestone-number">0{i + 1}</span>
                      <input
                        aria-label={`Milestone ${i + 1} name`}
                        value={m.name}
                        onChange={(e) =>
                          update({
                            milestones: q.milestones.map((x) =>
                              x.id === m.id
                                ? { ...x, name: e.target.value }
                                : x,
                            ),
                          })
                        }
                      />
                      <input
                        aria-label={`Milestone ${i + 1} percentage`}
                        type="number"
                        min="0"
                        max="100"
                        value={m.percentage}
                        onChange={(e) =>
                          update({
                            milestones: q.milestones.map((x) =>
                              x.id === m.id
                                ? { ...x, percentage: Number(e.target.value) }
                                : x,
                            ),
                          })
                        }
                      />
                      <span>%</span>
                      <strong>{money((total * m.percentage) / 100)}</strong>
                      <button
                        aria-label="Remove milestone"
                        onClick={() =>
                          update({
                            milestones: q.milestones.filter(
                              (x) => x.id !== m.id,
                            ),
                          })
                        }
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
                <Btn
                  small
                  onClick={() =>
                    update({
                      milestones: [
                        ...q.milestones,
                        {
                          id: uid("M"),
                          name: "New milestone",
                          percentage: 0,
                          done: false,
                          date: q.validUntil,
                        },
                      ],
                    })
                  }
                >
                  <Plus size={14} />
                  Add milestone
                </Btn>
                <p className={sum === 100 ? "success-text" : "form-error"}>
                  Allocated: {sum}% of total
                </p>
                <label className="field">
                  <span>Payment, warranty & project terms</span>
                  <textarea
                    rows={6}
                    value={q.terms}
                    onChange={(e) => update({ terms: e.target.value })}
                  />
                </label>
                <label className="field">
                  <span>Exclusions & optional risk clauses</span>
                  <textarea
                    rows={4}
                    value={q.exclusions}
                    onChange={(e) => update({ exclusions: e.target.value })}
                    placeholder="Only add clauses relevant to this scope."
                  />
                </label>
                <Btn small onClick={() => update({ terms: s.settings.terms })}>
                  Use company default terms
                </Btn>
              </>
            )}
          </fieldset>
          {section === "Internal & history" && (
            <div className="editor-fields">
              {canCosts(s) ? (
                <>
                  <Info>
                    <LockKeyhole size={15} />
                    Internal workspace only. Never rendered on the client
                    document.
                  </Info>
                  <label className="field">
                    <span>Estimated direct costs (PKR)</span>
                    <input
                      disabled={!editable}
                      type="number"
                      min="0"
                      value={q.internalCost}
                      onChange={(e) =>
                        update({ internalCost: Number(e.target.value) })
                      }
                    />
                  </label>
                  <div className="internal-summary">
                    <div>
                      <span>Expected gross profit</span>
                      <strong>{money(total - q.internalCost)}</strong>
                    </div>
                    <div>
                      <span>Expected margin</span>
                      <strong className={margin < 20 ? "overdue-text" : ""}>
                        {margin}%
                      </strong>
                    </div>
                  </div>
                  {q.internalCost > 0 && margin < 20 && (
                    <Info tone="warning">
                      Margin below 20%. Review scope, materials and contractor
                      estimate before issue.
                    </Info>
                  )}
                </>
              ) : (
                <Info>
                  Your simulated sales role cannot access internal costs.
                </Info>
              )}
              <h3 className="spaced-heading">Version history</h3>
              {s.quotes
                .filter(
                  (x) =>
                    x.id === q.id ||
                    x.id === q.parentId ||
                    x.parentId === q.id ||
                    (q.parentId && x.parentId === q.parentId),
                )
                .map((v) => (
                  <button
                    className="version-row"
                    key={v.id}
                    onClick={() => go("Quotations", v.id)}
                  >
                    <FileText size={16} />
                    <div>
                      <strong>
                        Revision {v.version} · {v.id}
                      </strong>
                      <small>
                        {money(quoteTotal(v))} · {v.date}
                      </small>
                    </div>
                    <Badge>{v.status}</Badge>
                  </button>
                ))}
            </div>
          )}
          <div className="studio-editor-footer">
            <span>
              <LockKeyhole size={13} />
              Client preview excludes internal costs
            </span>
            <strong>{money(total)}</strong>
          </div>
        </section>
        <section className="studio-preview">
          <div className="preview-toolbar">
            <span>
              <Eye size={15} />
              LIVE CLIENT PREVIEW
            </span>
            <span>A4 · 210 × 297 mm</span>
          </div>
          <DocumentPreview quote={q} />
        </section>
      </div>
    </>
  );
}
export function LineEditor({
  items,
  onChange,
}: {
  items: Item[];
  onChange: (i: Item[]) => void;
}) {
  const { state: s } = useApp();
  const pricingUnits = vocabulary(s, "Pricing units", units);
  return (
    <div className="line-editor">
      <div className="line-editor-header">
        <h3>Scope & line items</h3>
        <button
          className="text-btn"
          onClick={() =>
            onChange([
              ...items,
              {
                id: uid("I"),
                description: "",
                quantity: 1,
                unit: "unit",
                rate: 0,
              },
            ])
          }
        >
          <Plus size={14} />
          Add item
        </button>
      </div>
      {items.map((item, index) => (
        <div className="line-item" key={item.id}>
          <div className="line-number">
            {String(index + 1).padStart(2, "0")}
          </div>
          <div className="line-content">
            <textarea
              aria-label={`Item ${index + 1} description`}
              rows={2}
              placeholder="Describe the work…"
              value={item.description}
              onChange={(e) =>
                onChange(
                  items.map((i) =>
                    i.id === item.id
                      ? { ...i, description: e.target.value }
                      : i,
                  ),
                )
              }
            />
            <div className="line-controls">
              <label>
                <span>Quantity</span>
                <input
                  type="number"
                  min="0.01"
                  step="any"
                  value={item.quantity}
                  onChange={(e) =>
                    onChange(
                      items.map((i) =>
                        i.id === item.id
                          ? { ...i, quantity: Number(e.target.value) }
                          : i,
                      ),
                    )
                  }
                />
              </label>
              <label>
                <span>Unit</span>
                <input
                  list="pricing-units"
                  value={item.unit}
                  onChange={(e) =>
                    onChange(
                      items.map((i) =>
                        i.id === item.id ? { ...i, unit: e.target.value } : i,
                      ),
                    )
                  }
                />
              </label>
              <label>
                <span>Rate · PKR</span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={item.rate}
                  onChange={(e) =>
                    onChange(
                      items.map((i) =>
                        i.id === item.id
                          ? { ...i, rate: Number(e.target.value) }
                          : i,
                      ),
                    )
                  }
                />
              </label>
              <div className="line-amount">
                <span>Amount</span>
                <strong>{money(item.quantity * item.rate)}</strong>
              </div>
            </div>
          </div>
          <div className="line-actions">
            <button
              aria-label="Move item up"
              disabled={index === 0}
              onClick={() => {
                const next = [...items];
                [next[index - 1], next[index]] = [next[index], next[index - 1]];
                onChange(next);
              }}
            >
              <ArrowUp size={13} />
            </button>
            <button
              aria-label="Move item down"
              disabled={index === items.length - 1}
              onClick={() => {
                const next = [...items];
                [next[index + 1], next[index]] = [next[index], next[index + 1]];
                onChange(next);
              }}
            >
              <ArrowDown size={13} />
            </button>
            <button
              aria-label="Remove item"
              onClick={() => onChange(items.filter((i) => i.id !== item.id))}
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>
      ))}
      <datalist id="pricing-units">
        {pricingUnits.map((u) => (
          <option key={u} value={u} />
        ))}
      </datalist>
      {!items.length && (
        <Empty
          title="Give the work a clear scope"
          message="Add your first line item to begin."
        />
      )}
    </div>
  );
}
export function Invoices() {
  const { state: s, recordId, go, openCreate } = useApp();
  const [filter, setFilter] = useState("all");
  const i = s.invoices.find((i) => i.id === recordId);
  if (i) return <InvoiceStudio key={i.id} original={i} />;
  return (
    <>
      <Heading
        eyebrow="FINANCE WORKSPACE"
        title="Clear billing. Confident collections."
        description="Every invoice, payment and outstanding balance in one view."
        actions={
          <Btn primary onClick={() => openCreate("invoice")}>
            <Plus size={16} />
            New invoice
          </Btn>
        }
      />
      <div className="metrics three">
        <Metric
          label="Customer receivables"
          value={s.invoices
            .filter((i) => !["Draft", "Voided"].includes(i.status))
            .reduce((a, i) => a + balance(s, i), 0)}
          hint="Across all issued invoices"
        />
        <Metric
          label="Collected"
          value={s.payments
            .filter((p) => p.kind === "Customer receipt")
            .reduce((a, p) => a + p.amount, 0)}
          hint="Cash received, including advances"
        />
        <Metric
          label="Overdue invoices"
          value={String(
            s.invoices.filter((i) => invoiceStatus(s, i) === "Overdue").length,
          )}
          hint="Follow up on these balances"
        />
      </div>
      <Panel>
        <Table
          rows={s.invoices.filter(
            (i) => filter === "all" || invoiceStatus(s, i) === filter,
          )}
          toolbar={
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              aria-label="Payment status"
            >
              <option value="all">All payment statuses</option>
              {[
                "Draft",
                "Issued",
                "Partially Paid",
                "Paid",
                "Overdue",
                "Voided",
              ].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          }
          onRow={(i) => go("Invoices & Receipts", i.id)}
          columns={[
            {
              key: "id",
              label: "Invoice",
              render: (i) => <strong className="reference">{i.id}</strong>,
            },
            {
              key: "customerId",
              label: "Customer",
              render: (i) =>
                s.customers.find((c) => c.id === i.customerId)?.name,
            },
            {
              key: "jobId",
              label: "Project",
              render: (i) => s.jobs.find((j) => j.id === i.jobId)?.title,
            },
            {
              key: "amount",
              label: "Total",
              numeric: true,
              render: (i) => money(invoiceTotal(i)),
              value: invoiceTotal,
            },
            {
              key: "paid",
              label: "Paid",
              numeric: true,
              render: (i) => money(paid(s, i.id)),
            },
            {
              key: "balance",
              label: "Outstanding",
              numeric: true,
              render: (i) => money(balance(s, i)),
            },
            { key: "due", label: "Due date" },
            {
              key: "status",
              label: "Status",
              render: (i) => <Badge>{invoiceStatus(s, i)}</Badge>,
            },
          ]}
        />
      </Panel>
    </>
  );
}
function InvoiceStudio({ original }: { original: Invoice }) {
  const { state: s, save, openCreate, confirm, toast, go } = useApp();
  const [i, setI] = useState(structuredClone(original)),
    [view, setView] = useState("Edit"),
    [tab, setTab] = useState("Invoice"),
    [receipt, setReceipt] = useState<string>("");
  const draft = i.status === "Draft";
  const total = invoiceTotal(i);
  const payments = s.payments.filter((p) => p.recordId === i.id);
  const issue = () => {
    if (
      !i.items.length ||
      i.items.some((x) => !x.description || x.quantity <= 0 || x.rate < 0) ||
      total <= 0
    ) {
      toast("Add valid items with a positive total.");
      return;
    }
    confirm(
      "Issue customer invoice?",
      `${money(total)} will enter customer receivables. Earned revenue remains managed separately.`,
      () => {
        const n = { ...i, status: "Issued" };
        save("invoices", n, "Invoice issued");
        setI(n);
      },
    );
  };
  return (
    <>
      <DetailHeader
        title={`Invoice ${i.id}`}
        reference={s.customers.find((c) => c.id === i.customerId)?.name || ""}
        status={invoiceStatus(s, i)}
        back="Invoices & Receipts"
        actions={
          <>
            <Btn
              onClick={() => {
                setView("Preview");
                requestAnimationFrame(() => window.print());
              }}
            >
              <Printer size={15} />
              Print / PDF
            </Btn>
            {draft ? (
              <>
                <Btn onClick={() => save("invoices", i, "Invoice draft saved")}>
                  Save draft
                </Btn>
                <Btn primary onClick={issue}>
                  <Send size={15} />
                  Issue invoice
                </Btn>
              </>
            ) : (
              <Btn
                primary
                disabled={
                  balance(s, i) <= 0 || i.status === "Voided" || !canFinance(s)
                }
                onClick={() => openCreate("payment", i)}
              >
                <Plus size={16} />
                Record payment
              </Btn>
            )}
          </>
        }
      />
      <Info>
        Invoicing and customer advances do not automatically recognize earned
        revenue.
      </Info>
      <Tabs
        tabs={["Invoice", "Payments & receipts", "Linked project"]}
        value={tab}
        onChange={setTab}
      />
      {tab === "Linked project" ? (
        <Panel title="Project context">
          <div className="padded">
            <h2>{s.jobs.find((j) => j.id === i.jobId)?.title}</h2>
            <Btn onClick={() => go("Jobs & Projects", i.jobId)}>
              Open project workspace
              <ArrowRight size={15} />
            </Btn>
          </div>
        </Panel>
      ) : tab === "Payments & receipts" ? (
        <>
          <Panel
            title="Payment history"
            subtitle="Select a receipt to preview or print it."
          >
            <Table
              rows={payments}
              onRow={(p) => setReceipt(p.id)}
              columns={[
                { key: "id", label: "Receipt" },
                { key: "date", label: "Received" },
                {
                  key: "amount",
                  label: "Amount",
                  numeric: true,
                  render: (p) => money(p.amount),
                },
                { key: "method", label: "Method" },
                { key: "reference", label: "Reference" },
              ]}
            />
          </Panel>
          {receipt && (
            <div className="receipt-preview">
              <Btn onClick={() => window.print()}>
                <Printer size={15} />
                Print receipt
              </Btn>
              <DocumentPreview
                receipt={payments.find((p) => p.id === receipt)}
              />
            </div>
          )}
        </>
      ) : (
        <>
          <div className="studio-mobile-switch">
            <Tabs tabs={["Edit", "Preview"]} value={view} onChange={setView} />
          </div>
          <div
            className={`studio ${view === "Preview" ? "preview-selected" : ""}`}
          >
            <section className="studio-editor">
              <div className="studio-top">
                <div>
                  <span className="eyebrow">INVOICE EDITOR</span>
                  <strong>Billing & payment details</strong>
                </div>
                <Badge>{invoiceStatus(s, i)}</Badge>
              </div>
              <fieldset className="editor-fields" disabled={!draft}>
                <div className="form-grid">
                  <label className="field">
                    <span>Issue date</span>
                    <input
                      type="date"
                      value={i.date}
                      onChange={(e) => setI({ ...i, date: e.target.value })}
                    />
                  </label>
                  <label className="field">
                    <span>Due date</span>
                    <input
                      type="date"
                      value={i.due}
                      onChange={(e) => setI({ ...i, due: e.target.value })}
                    />
                  </label>
                </div>
                <LineEditor
                  items={i.items}
                  onChange={(items) => setI({ ...i, items })}
                />
                <label className="field">
                  <span>Applicable tax (%)</span>
                  <input
                    type="number"
                    min="0"
                    value={i.tax}
                    onChange={(e) =>
                      setI({ ...i, tax: Number(e.target.value) })
                    }
                  />
                </label>
                <label className="field">
                  <span>Notes & payment terms</span>
                  <textarea
                    rows={4}
                    value={i.notes}
                    onChange={(e) => setI({ ...i, notes: e.target.value })}
                  />
                </label>
              </fieldset>
              <div className="invoice-balance">
                <span>Balance due</span>
                <strong>{money(balance(s, i))}</strong>
                <p>
                  {money(paid(s, i.id))} collected of {money(total)}
                </p>
              </div>
              {!draft && i.status !== "Voided" && (
                <div className="padded">
                  <Btn
                    small
                    disabled={paid(s, i.id) > 0}
                    onClick={() =>
                      confirm(
                        "Void this invoice?",
                        "The invoice will be excluded from receivables. Invoices with payments require a backend credit-note workflow and cannot be voided here.",
                        () => {
                          const n = { ...i, status: "Voided" };
                          save("invoices", n, "Invoice voided");
                          setI(n);
                        },
                      )
                    }
                  >
                    Void invoice
                  </Btn>
                  <small className="block muted">
                    Paid invoices require a credit note; this workflow is
                    reserved for the backend phase.
                  </small>
                </div>
              )}
            </section>
            <section className="studio-preview">
              <div className="preview-toolbar">
                <span>
                  <Eye size={15} />
                  CLIENT DOCUMENT
                </span>
                <span>A4 · Print-ready</span>
              </div>
              <DocumentPreview invoice={i} />
            </section>
          </div>
        </>
      )}
    </>
  );
}
